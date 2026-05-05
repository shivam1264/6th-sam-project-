// --- Configuration ---
const BACKEND_URL = "https://smart-parking-usm7.onrender.com/api";
const REFRESH_INTERVAL_MS = 2000; // Poll every 2 seconds

// Example Parking Coordinates (Replace with actual location)
// E.g., a specific lot at a university or city
const PARKING_LAT = 28.6139; // Default New Delhi as example
const PARKING_LNG = 77.2090;

// --- Elements ---
const availableSlotsEl = document.getElementById('available-slots');
const totalSlotsEl = document.getElementById('total-slots');
const progressFillEl = document.getElementById('progress-fill');
const statusMessageEl = document.getElementById('status-message');

// --- Initialization ---
let map;
let parkingMarker;

function initMap() {
    // 1. Create the map instance
    map = L.map('map').setView([PARKING_LAT, PARKING_LNG], 16);

    // 2. Add modern dark-themed map tiles (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    // 3. Create Custom Marker Icon matching our UI style
    const customIcon = L.divIcon({
        className: 'custom-pin',
        html: `<div style="
            background-color: #3b82f6;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 0 15px rgba(59, 130, 246, 0.8);
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });

    // 4. Add the marker to the map
    parkingMarker = L.marker([PARKING_LAT, PARKING_LNG], { icon: customIcon }).addTo(map);
    
    // Bind initial popup
    parkingMarker.bindPopup(`
        <div class="popup-content">
            <h4>Main Campus Parking</h4>
            <p>Slots: <span class="popup-slots" id="popup-slot-count">--</span></p>
        </div>
    `).openPopup();
}

// --- Data Fetching and UI Updating ---
async function fetchStatus() {
    try {
        const response = await fetch(`${BACKEND_URL}/status`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const available = data.available_slots;
        const total = data.total_capacity;

        updateUI(available, total);
    } catch (error) {
        console.error("Error fetching parking status:", error);
        statusMessageEl.textContent = "Error connecting to server. Retrying...";
        statusMessageEl.style.color = "var(--danger)";
    }
}

function updateUI(available, total) {
    // 1. Update text
    availableSlotsEl.textContent = available;
    totalSlotsEl.textContent = total;
    statusMessageEl.textContent = "Live updating via ANPR cameras...";
    statusMessageEl.style.color = "var(--text-secondary)";

    // 2. Update Map Popup
    const popupEl = document.getElementById('popup-slot-count');
    if (popupEl) {
        popupEl.textContent = `${available} / ${total}`;
    } else {
         // If popup is closed and reopened, update its content model
         parkingMarker.setPopupContent(`
            <div class="popup-content">
                <h4>Main Campus Parking</h4>
                <p>Slots: <span class="popup-slots" id="popup-slot-count">${available} / ${total}</span></p>
            </div>
        `);
    }

    // 3. Calculate Percentages and Colors
    const availablePercent = (available / total) * 100;
    
    // We want the progress bar to represent "Fill Level" or "Availability Level"
    // Let's make it represent Availability for a positive feel.
    progressFillEl.style.width = `${availablePercent}%`;

    // Dynamic coloring based on availability
    let colorVar = "var(--success)"; // > 20%
    if (availablePercent <= 5) {
        colorVar = "var(--danger)"; // Almost Full
    } else if (availablePercent <= 20) {
        colorVar = "var(--warning)"; // Filling up
    }

    // Apply colors to UI elements
    availableSlotsEl.style.color = colorVar;
    progressFillEl.style.backgroundColor = colorVar;
    if (popupEl) {
        popupEl.style.color = colorVar;
    }
}

// --- Bootstrapping ---
document.addEventListener("DOMContentLoaded", () => {
    initMap();
    fetchStatus(); // Initial fetch
    
    // Start Poll
    setInterval(fetchStatus, REFRESH_INTERVAL_MS);
});
