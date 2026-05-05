from pymongo import MongoClient

def restore_balance():
    try:
        client = MongoClient('mongodb://localhost:27017/')
        db = client['smart_parking']
        result = db['users'].update_many({}, {'$set': {'wallet_balance': 500.0}})
        print(f"✅ Successfully restored balance for {result.modified_count} users!")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    restore_balance()
