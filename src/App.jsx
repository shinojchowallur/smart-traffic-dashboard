import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  Map as MapIcon, 
  Settings, 
  Bell,
  BarChart3,
  RefreshCw,
  CheckCircle,
  Zap
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';

// Fix leaflet marker icon URLs for Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const incidentIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const MAP_CENTER = [40.730610, -73.935242]; // NY Coordinates

const INITIAL_TRAFFIC_DATA = [
  { time: '08:00', vehicles: 400, waitTime: 12 },
  { time: '09:00', vehicles: 850, waitTime: 25 },
  { time: '10:00', vehicles: 600, waitTime: 18 },
  { time: '11:00', vehicles: 500, waitTime: 14 },
  { time: '12:00', vehicles: 550, waitTime: 16 },
  { time: '13:00', vehicles: 700, waitTime: 20 },
  { time: '14:00', vehicles: 650, waitTime: 19 },
];

const INITIAL_INCIDENTS = [
  { id: 1, type: 'Accident', location: 'Downtown 5th Ave', severity: 'High', time: '10 mins ago', coords: [40.735, -73.94] },
  { id: 2, type: 'Roadwork', location: 'North Bridge', severity: 'Medium', time: '2 hrs ago', coords: [40.725, -73.95] }
];

const INITIAL_ZONES = [
  { id: 'z1', coords: [40.73, -73.93], radius: 600, status: 'green' },
  { id: 'z2', coords: [40.74, -73.94], radius: 800, status: 'red' },
  { id: 'z3', coords: [40.72, -73.92], radius: 500, status: 'yellow' },
  { id: 'z4', coords: [40.71, -73.96], radius: 700, status: 'green' }
];

const statusColors = {
  green: '#10b981',
  yellow: '#f59e0b',
  red: '#ef4444'
};

function App() {
  const [systemStatus, setSystemStatus] = useState('online');
  const [toast, setToast] = useState({ visible: false, message: '' });
  
  // App State
  const [trafficData, setTrafficData] = useState(INITIAL_TRAFFIC_DATA);
  const [incidents, setIncidents] = useState(INITIAL_INCIDENTS);
  const [zones, setZones] = useState(INITIAL_ZONES);
  const [activeVehicles, setActiveVehicles] = useState(12450);
  const [congestionLevel, setCongestionLevel] = useState(68);

  const showToast = (message) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: '' }), 3000);
  };

  // Passive Simulation Engine
  useEffect(() => {
    const simInterval = setInterval(() => {
      setActiveVehicles(prev => prev + Math.floor(Math.random() * 200 - 100));
      
      // Randomly change a zone color
      setZones(prev => {
        const next = [...prev];
        const randomZone = Math.floor(Math.random() * next.length);
        const colors = ['green', 'yellow', 'red'];
        next[randomZone] = { ...next[randomZone], status: colors[Math.floor(Math.random() * colors.length)] };
        return next;
      });

      // Update charts
      setTrafficData(prev => {
        const newData = [...prev];
        const lastTime = parseInt(newData[newData.length - 1].time.split(':')[0]);
        const nextTime = `${(lastTime + 1).toString().padStart(2, '0')}:00`;
        newData.shift();
        newData.push({
          time: nextTime,
          vehicles: 500 + Math.floor(Math.random() * 400),
          waitTime: 10 + Math.floor(Math.random() * 20)
        });
        return newData;
      });

      // Randomly spawn an incident
      if (Math.random() > 0.8 && incidents.length < 4) {
        setIncidents(prev => [
          {
            id: Date.now(),
            type: Math.random() > 0.5 ? 'Congestion' : 'Disabled Vehicle',
            location: 'Intersection ' + Math.floor(Math.random() * 100),
            severity: Math.random() > 0.7 ? 'High' : 'Low',
            time: 'Just now',
            coords: [40.71 + Math.random() * 0.04, -73.97 + Math.random() * 0.06]
          },
          ...prev
        ]);
      }
    }, 5000);

    return () => clearInterval(simInterval);
  }, [incidents.length]);

  // Recalculate congestion
  useEffect(() => {
    let score = 0;
    zones.forEach(z => {
      if (z.status === 'red') score += 30;
      if (z.status === 'yellow') score += 15;
    });
    setCongestionLevel(Math.min(100, Math.max(10, Math.floor(score * 0.8))));
  }, [zones]);

  // Quick Actions
  const handleOptimizeLights = () => {
    showToast("Traffic lights optimized. Wait times reducing.");
    setZones(prev => prev.map(z => ({ ...z, status: z.status === 'red' || z.status === 'yellow' ? 'green' : z.status })));
    setTrafficData(prev => {
      const next = [...prev];
      next[next.length - 1].waitTime = Math.max(5, next[next.length - 1].waitTime - 8);
      return next;
    });
  };

  const handleDispatchUnits = () => {
    if (incidents.length === 0) {
      showToast("No active incidents to dispatch units to.");
      return;
    }
    showToast("Emergency units dispatched to highest severity incident.");
    setTimeout(() => {
      setIncidents(prev => {
        const next = [...prev];
        next.shift();
        return next;
      });
      showToast("Incident cleared by emergency units.");
    }, 2000);
  };

  const handleEnableDivert = () => {
    showToast("Divert routes enabled. Rerouting traffic.");
    setActiveVehicles(prev => Math.floor(prev * 0.85));
    setZones(prev => prev.map(z => ({ ...z, status: z.status === 'red' ? 'yellow' : z.status })));
  };

  return (
    <div className="dashboard-grid">
      
      {toast.visible && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px',
          background: 'rgba(16, 185, 129, 0.9)', color: '#fff',
          padding: '12px 24px', borderRadius: '8px',
          display: 'flex', alignItems: 'center', gap: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 9999
        }}>
          <CheckCircle size={18} />
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Activity color="var(--accent-blue)" size={28} />
          <h2>Smart Traffic Control Center</h2>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={`status-dot status-${systemStatus === 'online' ? 'green' : 'yellow'}`}></span>
            <span className="text-muted">System {systemStatus === 'online' ? 'Online' : 'Warning'}</span>
          </div>
          <button className="btn">
            <Bell size={18} />
            Alerts
          </button>
          <button className="btn btn-primary">
            <Settings size={18} />
            Admin
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        
        {/* Real Map Visualization */}
        <div className="glass-panel" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: '400px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3>Live City Map</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn" onClick={() => setSystemStatus(s => s === 'online' ? 'warning' : 'online')}>
                <RefreshCw size={14} /> Toggle System
              </button>
            </div>
          </div>
          
          <div style={{ flexGrow: 1, borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            <MapContainer center={MAP_CENTER} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              />
              
              {/* Render Congestion Zones */}
              {zones.map(zone => (
                <Circle 
                  key={zone.id} 
                  center={zone.coords} 
                  radius={zone.radius}
                  pathOptions={{ 
                    color: statusColors[zone.status], 
                    fillColor: statusColors[zone.status], 
                    fillOpacity: 0.3 
                  }}
                >
                  <Popup>Congestion Level: {zone.status.toUpperCase()}</Popup>
                </Circle>
              ))}

              {/* Render Incidents */}
              {incidents.map(incident => (
                <Marker key={incident.id} position={incident.coords} icon={incidentIcon}>
                  <Popup>
                    <strong>{incident.type}</strong><br/>
                    {incident.location}<br/>
                    Severity: {incident.severity}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Analytics Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div className="glass-panel">
            <h3 style={{ marginBottom: '16px' }}><BarChart3 size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }}/> Volume Trend</h3>
            <div style={{ height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trafficData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="time" stroke="var(--text-secondary)" fontSize={12} />
                  <YAxis stroke="var(--text-secondary)" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-dark)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="vehicles" stroke="var(--accent-blue)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-panel">
            <h3 style={{ marginBottom: '16px' }}><Activity size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }}/> Avg Wait Time (mins)</h3>
            <div style={{ height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trafficData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="time" stroke="var(--text-secondary)" fontSize={12} />
                  <YAxis stroke="var(--text-secondary)" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-dark)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="waitTime" stroke="var(--accent-yellow)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>

      {/* Side Panel (Incidents & Controls) */}
      <div className="side-panel">
        
        {/* Quick Stats */}
        <div className="glass-panel" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <div className="text-muted" style={{ fontSize: '12px' }}>Active Vehicles</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-blue)', transition: 'color 0.3s' }}>
              {activeVehicles.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-muted" style={{ fontSize: '12px' }}>Congestion Level</div>
            <div style={{ 
              fontSize: '24px', fontWeight: 'bold', 
              color: congestionLevel > 70 ? 'var(--accent-red)' : congestionLevel > 40 ? 'var(--accent-yellow)' : 'var(--accent-green)',
              transition: 'color 0.3s'
            }}>
              {congestionLevel}%
            </div>
          </div>
        </div>

        {/* Active Incidents */}
        <div className="glass-panel" style={{ flexGrow: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3>Active Incidents</h3>
            <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--accent-red)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
              {incidents.length}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
            {incidents.length === 0 ? (
              <div className="text-muted" style={{ textAlign: 'center', padding: '20px 0' }}>No active incidents</div>
            ) : (
              incidents.map(incident => (
                <div key={incident.id} className="incident-card" style={{ transition: 'all 0.3s ease', animation: 'slideIn 0.3s ease' }}>
                  <div className="incident-icon">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>{incident.type}</div>
                    <div className="text-muted" style={{ fontSize: '14px', marginBottom: '4px' }}>{incident.location}</div>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                      <span style={{ color: incident.severity === 'High' ? 'var(--accent-red)' : 'var(--accent-yellow)' }}>
                        {incident.severity} Severity
                      </span>
                      <span className="text-muted">{incident.time}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Controls */}
        <div className="glass-panel">
          <h3 style={{ marginBottom: '16px' }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button className="btn" style={{ justifyContent: 'center', width: '100%' }} onClick={handleOptimizeLights}>
              <Zap size={16}/> Optimize Traffic Lights
            </button>
            <button className="btn" style={{ justifyContent: 'center', width: '100%' }} onClick={handleDispatchUnits}>
              <AlertTriangle size={16}/> Dispatch Emergency Units
            </button>
            <button className="btn btn-primary" style={{ justifyContent: 'center', width: '100%' }} onClick={handleEnableDivert}>
              <RefreshCw size={16}/> Enable Divert Routes
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;
