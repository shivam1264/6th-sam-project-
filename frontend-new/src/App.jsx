import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, Navigation, Car, ShieldCheck, Info, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

// Fix for Leaflet marker icons in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const BACKEND_URL = "https://sixth-sam-project.onrender.com";

// Component to handle map center changes
function ChangeView({ center, zoom }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

function App() {
  const [parkings, setParkings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedParking, setSelectedParking] = useState(null);
  const [mapCenter, setMapCenter] = useState([23.2599, 77.4126]); // Bhopal Center
  const [stats, setStats] = useState({ total: 0, available: 0 });

  const fetchData = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/parkings`);
      setParkings(response.data);
      
      // Calculate Stats
      const total = response.data.reduce((acc, p) => acc + p.total_capacity, 0);
      const available = response.data.reduce((acc, p) => acc + p.available_slots, 0);
      setStats({ total, available });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Polling every 5s
    return () => clearInterval(interval);
  }, []);

  const filteredParkings = parkings.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.area.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectParking = (p) => {
    setSelectedParking(p);
    setMapCenter([p.latitude, p.longitude]);
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-container">
            <Car size={32} className="logo-icon" />
            <h2>Smart Parking</h2>
          </div>
          <div className="search-bar">
            <Search size={18} color="#8b949e" />
            <input 
              type="text" 
              placeholder="Search mall, hospital, area..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="parking-list">
          <AnimatePresence>
            {filteredParkings.map((p) => (
              <motion.div 
                key={p._id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`parking-card ${selectedParking?._id === p._id ? 'active' : ''}`}
                onClick={() => handleSelectParking(p)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4>{p.name}</h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{p.area}</p>
                  </div>
                  <span style={{ 
                    color: p.available_slots > 20 ? 'var(--success)' : 'var(--warning)',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    {p.available_slots} / {p.total_capacity}
                  </span>
                </div>
                
                <div style={{ marginTop: '12px' }}>
                  <div style={{ 
                    height: '4px', 
                    width: '100%', 
                    background: 'var(--bg-tertiary)',
                    borderRadius: '2px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${(p.available_slots / p.total_capacity) * 100}%`,
                      background: p.available_slots > 20 ? 'var(--success)' : 'var(--warning)',
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="stats-grid">
          <StatCard icon={<TrendingUp size={18} />} label="Total Capacity" value={stats.total} color="var(--accent)" />
          <StatCard icon={<ShieldCheck size={18} />} label="Available" value={stats.available} color="var(--success)" />
          <StatCard icon={<Navigation size={18} />} label="Occupancy" value={`${Math.round(((stats.total - stats.available) / stats.total) * 100) || 0}%`} color="var(--warning)" />
        </div>

        <div className="map-container">
          <MapContainer center={mapCenter} zoom={13} zoomControl={false}>
            <ChangeView center={mapCenter} zoom={selectedParking ? 16 : 13} />
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            />
            {parkings.map((p) => (
              <Marker 
                key={p._id} 
                position={[p.latitude, p.longitude]}
                eventHandlers={{ click: () => handleSelectParking(p) }}
              >
                <Popup>
                  <div style={{ color: '#333' }}>
                    <h3 style={{ margin: '0 0 5px 0' }}>{p.name}</h3>
                    <p>{p.available_slots} slots available</p>
                    <button style={{ 
                      marginTop: '10px', 
                      background: '#3b82f6', 
                      color: 'white', 
                      border: 'none', 
                      padding: '5px 10px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}>Navigate</button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '12px' }}>
        {icon} <span>{label}</span>
      </div>
      <div className="stat-value" style={{ color }}>{value}</div>
    </div>
  );
}

export default App;
