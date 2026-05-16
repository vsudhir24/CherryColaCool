import { useState, useEffect } from "react";
import Map from "./components/Map";
import Sidebar from "./components/Sidebar";
import StatsBar from "./components/StatsBar";
import PropertyPanel from "./components/PropertyPanel";
import axios from "axios";

const API = "http://localhost:8000/api";

export default function App() {
  const [properties, setProperties] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [filterTier, setFilterTier] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [filterTier]);

  async function fetchData() {
    setLoading(true);
    try {
      const [geoRes, statsRes] = await Promise.all([
        axios.get(`${API}/properties/geojson`, {
          params: filterTier ? { priority_tier: filterTier } : {}
        }),
        axios.get(`${API}/scores/stats`)
      ]);
      setProperties(geoRes.data.features);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectProperty(parcelId) {
    try {
      const res = await axios.get(`${API}/properties/${parcelId}`);
      setSelectedProperty(res.data);
    } catch (err) {
      console.error("Failed to fetch property:", err);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800">
        <div>
          <h1 className="text-xl font-bold text-white">Detroit Blight Prioritizer</h1>
          <p className="text-xs text-gray-400">AI-powered property intervention ranking</p>
        </div>
        <div className="flex gap-2">
          {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map(tier => (
            <button
              key={tier}
              onClick={() => setFilterTier(filterTier === tier ? null : tier)}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                filterTier === tier
                  ? tierColor(tier)
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </header>

      {/* Stats Bar */}
      {stats && <StatsBar stats={stats} />}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          properties={properties}
          onSelect={handleSelectProperty}
          loading={loading}
        />
        <Map
          properties={properties}
          onSelect={handleSelectProperty}
        />
        {selectedProperty && (
          <PropertyPanel
            property={selectedProperty}
            onClose={() => setSelectedProperty(null)}
          />
        )}
      </div>
    </div>
  );
}

function tierColor(tier) {
  switch (tier) {
    case "CRITICAL": return "bg-red-600 text-white";
    case "HIGH": return "bg-orange-500 text-white";
    case "MEDIUM": return "bg-yellow-500 text-black";
    case "LOW": return "bg-green-600 text-white";
    default: return "bg-gray-700 text-white";
  }
}
