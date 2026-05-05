from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)  # Allow frontend to access the API

# MongoDB Configuration
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
client = MongoClient(MONGO_URI)
db = client["smart_parking"]
parking_collection = db["parking_records"]
status_collection = db["parking_status"]
users_collection = db["users"]
payments_collection = db["payments"]

# Initialize available slots if not present
TOTAL_CAPACITY = 100
status = status_collection.find_one({"_id": "status"})
if not status:
    status_collection.insert_one({"_id": "status", "available_slots": TOTAL_CAPACITY})

# Create Indexes for Speed
parking_collection.create_index([("Plate_Number", 1), ("Exit_Time", 1)])
parking_collection.create_index("Plate_Number")
users_collection.create_index("email", unique=True)

parkings_collection = db["parkings"]

# ── Parking Routes ──

@app.route("/api/parkings", methods=["GET"])
@app.route("/parkings", methods=["GET"])
def get_parkings():
    # Fetch all parking lots from MongoDB
    data = list(parkings_collection.find({}, {"_id": 1, "name": 1, "total_capacity": 1, "available_slots": 1}))
    
    # Convert ObjectId to string for JSON
    for item in data:
        item["_id"] = str(item["_id"])
        
    # ── Fallback: Agar DB khali hai toh default data bhej do ──
    if not data:
        return jsonify([{
            "_id": "local-parking-001",
            "name": "Aashima Mall Parking",
            "total_capacity": 100,
            "available_slots": 100
        }]), 200
        
    return jsonify(data), 200

# ── Profile Routes ──

@app.route("/profile/<email>", methods=["GET"])
def get_profile(email):
    user = users_collection.find_one({"email": email}, {"_id": 0})
    if not user:
        # Return a default user if not found
        return jsonify({
            "full_name": "New User",
            "email": email,
            "wallet_balance": 0.0,
            "vehicles": []
        }), 200
    return jsonify(user), 200

@app.route("/profile", methods=["POST"])
def update_profile():
    data = request.json
    email = data.get("email")
    if not email:
        return jsonify({"error": "Email is required"}), 400
    
    update_data = {
        "full_name": data.get("full_name"),
        "phone": data.get("phone"),
        "wallet_balance": data.get("wallet_balance", 0.0),
        "vehicles": data.get("vehicles", [])
    }
    
    # Remove None values
    update_data = {k: v for k, v in update_data.items() if v is not None}
    
    users_collection.update_one(
        {"email": email},
        {"$set": update_data},
        upsert=True
    )
    return jsonify({"message": "Profile updated successfully"}), 200

@app.route("/status", methods=["GET"])
def get_status():
    status = status_collection.find_one({"_id": "status"})
    return jsonify({"available_slots": status.get("available_slots", 0), "total_capacity": TOTAL_CAPACITY})

@app.route("/api/vehicle-entry", methods=["POST"])
@app.route("/vehicle-entry", methods=["POST"])
@app.route("/entry", methods=["POST"])
def vehicle_entry():
    data = request.json
    # Handle both camelCase (from LPR script) and snake_case (from frontend)
    plate_number = data.get("plateNumber") or data.get("plate_number")
    parking_id = data.get("parkingId") or data.get("parking_id")
    
    if not plate_number:
        return jsonify({"error": "Plate number is required"}), 400

    # Ensure the car isn't already parked
    existing = parking_collection.find_one({"Plate_Number": plate_number, "Exit_Time": None})
    if existing:
        return jsonify({"error": "Vehicle already parked"}), 400

    # Check available slots from the specific parking lot
    parking = parkings_collection.find_one({"_id": parking_id})
    if not parking:
        # Fallback to status_collection if parking_id not found in parkings
        status = status_collection.find_one({"_id": "status"})
        available_slots = status.get("available_slots", 0)
    else:
        available_slots = parking.get("available_slots", 0)

    if available_slots <= 0:
        return jsonify({"error": "Parking is full"}), 400

    entry_time = datetime.now()
    
    # Save entry record with parking_id
    record = {
        "Plate_Number": plate_number,
        "Parking_Id": parking_id,
        "Entry_Time": entry_time,
        "Exit_Time": None,
        "Total_Time": None
    }
    parking_collection.insert_one(record)

    # Decrease available slot count for this specific parking
    if parking:
        parkings_collection.update_one({"_id": parking_id}, {"$inc": {"available_slots": -1}})
    else:
        status_collection.update_one({"_id": "status"}, {"$inc": {"available_slots": -1}})

    return jsonify({"message": f"Vehicle {plate_number} entered at {parking.get('name') if parking else 'Parking'}", "available_slots": available_slots - 1}), 201

@app.route("/api/vehicle-exit", methods=["POST"])
@app.route("/vehicle-exit", methods=["POST"])
@app.route("/exit", methods=["POST"])
def vehicle_exit():
    data = request.json
    plate_number = data.get("plateNumber") or data.get("plate_number")
    
    if not plate_number:
        return jsonify({"error": "Plate number is required"}), 400

    # Find the active parking record (optionally filter by parking_id)
    query = {"Plate_Number": plate_number, "Exit_Time": None}
    if parking_id:
        query["Parking_Id"] = parking_id
        
    record = parking_collection.find_one(query)
    
    if not record:
        return jsonify({"error": "Vehicle not found in parking"}), 404
    
    # Use the parking_id from the record if not provided
    p_id = parking_id or record.get("Parking_Id")

    exit_time = datetime.now()
    entry_time = record["Entry_Time"]
    total_time_diff = exit_time - entry_time
    total_time_minutes = int(total_time_diff.total_seconds() / 60)
    
    # Calculate Fee (e.g., ₹30 per hour, minimum 1 hour)
    hours = max(1, (total_time_minutes + 59) // 60)  # Round up to nearest hour
    hourly_rate = 30
    total_fee = hours * hourly_rate

    # ── FASTag Simulation Logic ──
    # Check if a user is registered with this plate number
    user = users_collection.find_one({"vehicles": plate_number})
    payment_status = "Pending"
    auto_pay_msg = ""
    
    if user:
        wallet_balance = user.get("wallet_balance", 0.0)
        if wallet_balance >= total_fee:
            # Auto-deduct from wallet
            new_balance = wallet_balance - total_fee
            users_collection.update_one(
                {"_id": user["_id"]},
                {"$set": {"wallet_balance": new_balance}}
            )
            payment_status = "Paid (FASTag Auto-Debit)"
            auto_pay_msg = f"FASTag detected! ₹{total_fee} deducted from wallet. New Balance: ₹{new_balance}"
        else:
            auto_pay_msg = "FASTag user found but insufficient balance."

    # Update the parking record
    parking_collection.update_one(
        {"_id": record["_id"]},
        {"$set": {
            "Exit_Time": exit_time, 
            "Total_Time": f"{total_time_minutes} mins",
            "Fee": total_fee,
            "Payment_Status": payment_status
        }}
    )

    # Save Payment Record
    payment = {
        "record_id": record["_id"],
        "user_id": user["_id"] if user else None,
        "plate_number": plate_number,
        "amount": total_fee,
        "status": payment_status,
        "timestamp": exit_time
    }
    payments_collection.insert_one(payment)

    # Increase available slot count for this specific parking
    if p_id:
        parkings_collection.update_one({"_id": p_id}, {"$inc": {"available_slots": 1}})
    else:
        status_collection.update_one({"_id": "status"}, {"$inc": {"available_slots": 1}})

    return jsonify({
        "message": f"Vehicle {plate_number} exited. {auto_pay_msg}",
        "duration": f"{total_time_minutes} minutes",
        "fee": f"₹{total_fee}",
        "payment_status": payment_status,
        "available_slots": min(available_slots + 1, TOTAL_CAPACITY)
    }), 200

@app.route("/active-vehicles", methods=["GET"])
def active_vehicles():
    """Abhi park ki hui gaadiyaan — Exit camera ke fast fuzzy match ke liye."""
    records = list(parking_collection.find({"Exit_Time": None}, {"_id": 0, "Plate_Number": 1}))
    plates = [{"plateNumber": r["Plate_Number"]} for r in records if r.get("Plate_Number")]
    return jsonify(plates), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
