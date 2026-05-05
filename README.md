# Smart Parking System (ANPR)

A complete college project implementation for a Smart Parking System. It uses ANPR (Automatic Number Plate Recognition) via cameras instead of physical sensors per slot.

## Architecture

1. **Backend** (`backend/app.py`): A Flask API backed by MongoDB. Tracks total slots (100 initially), logs entry/exit times, and calculates parking duration.
2. **Computer Vision** (`cv_module/main.py`): Python scripts utilizing OpenCV and EasyOCR to act as the "Entry" and "Exit" cameras. It reads images, extracts plate text, and hits the backend APIs.
3. **Frontend Dashboard** (`frontend/index.html`): A dynamic, modern web UI with a Leaflet.js map. It polls the backend API to show real-time available slots at the parking location without refreshing.

---

## Prerequisites

- **Python 3.8+**
- **MongoDB**: You must have a MongoDB instance running locally (default `mongodb://localhost:27017/`), or you can pass a connection string via environment variable `MONGO_URI`.
- **Node.js**: (Optional) For serving the frontend via a simple server like `http-server`.

---

## Setup & Running Step-by-Step

### 1. Database
Ensure your MongoDB service is running on your machine.
- Windows: `net start MongoDB` (if installed as service)
- Or simply run `mongod` in a separate terminal.

### 2. Run the Backend API
Open a new terminal and navigate to the `backend/` folder:

```bash
cd backend
python -m venv venv
.\venv\Scripts\activate   # On Windows
pip install -r requirements.txt
python app.py
```
*The API will start at `http://localhost:5000/`.*

### 3. Serve the Frontend Dashboard
You can simply open `frontend/index.html` in your browser.
Or, for a better experience, serve it using Python's http.server or Node's http-server.

Open a new terminal:
```bash
cd frontend
python -m http.server 8000
```
Then visit `http://localhost:8000` in your web browser. You will see the beautiful dashboard polling the live slots. By default, it will show `100 / 100`.

### 4. Run the Computer Vision (ANPR) Module
To simulate a car entering or exiting the parking lot, you run the CV script. Provide an image of a car with a clear license plate.

Open a third terminal:
```bash
cd cv_module
python -m venv venv
.\venv\Scripts\activate   # On Windows
pip install -r requirements.txt
```

**Simulate Car Entry:**
```bash
python main.py --image "path/to/car_image.jpg" --event entry
```
*Look at the frontend dashboard: The slots should instantly drop to 99!*

**Simulate Car Exit:**
(Use an image with the same license plate so it matches)
```bash
python main.py --image "path/to/same_car_image.jpg" --event exit
```
*Look at the frontend dashboard: The slots should jump back up to 100, and the database will log the total parked time.*

---

## Customization
- **Total Capacity:** You can change `TOTAL_CAPACITY = 100` in `backend/app.py`.
- **Map Location:** You can edit `PARKING_LAT` and `PARKING_LNG` in `frontend/script.js` to change the map pin coordinates.
- **Styling:** Feel free to tweak `frontend/style.css` to change the glassmorphism colors and gradients.

---

## OCR Evaluation Workflow

Industry-level accuracy ki taraf practical start `evaluation first` hai.

### 1. Prepare labeled images

- Images ko `datasets/eval_images/` me rakho
- Labels ko `datasets/eval_template.csv` format me fill karo
- Details `datasets/README.md` me milengi

### 2. Run OCR evaluation

Project root se:

```bash
python tools/evaluate_ocr.py --csv datasets/eval_template.csv --root .
```

Optional JSON report:

```bash
python tools/evaluate_ocr.py --csv datasets/eval_template.csv --root . --save-json reports/eval_report.json
```

### 3. Capture data from laptop camera

Testing ke liye laptop camera se labeled samples capture kar sakte ho:

```bash
python tools/capture_dataset.py --camera 0 --output-dir datasets/captured --csv datasets/captured_labels.csv
```

Ek known plate ke repeated samples:

```bash
python tools/capture_dataset.py --camera 0 --label MH12AB1234 --notes day-front
```

### 4. Core metrics

Evaluation script ye metrics dega:

- exact match rate
- average character accuracy
- false positive rate
- missed detection rate
