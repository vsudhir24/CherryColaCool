import { useState, useCallback } from "react";
import Map, { NavigationControl } from "react-map-gl";
import { DeckGL } from "@deck.gl/react";
import { ScatterplotLayer, HeatmapLayer } from "@deck.gl/layers";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const TIER_COLORS = {
  CRITICAL: [220, 38, 38, 220],
  HIGH: [249, 115, 22, 200],
  MEDIUM: [234, 179, 8, 180],
  LOW: [34, 197, 94, 160],
};

const INITIAL_VIEW = {
  longitude: -83.0458,
  latitude: 42.3314,
  zoom: 11,
  pitch: 30,
  bearing: 0,
};

export default function BlightMap({ properties, onSelect }) {
  const [viewState, setViewState] = useState(INITIAL_VIEW);
  const [hoveredId, setHoveredId] = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(false);

  const points = properties.map(f => ({
    coordinates: f.geometry.coordinates,
    parcel_id: f.properties.parcel_id,
    priority_tier: f.properties.priority_tier,
    total_score: f.properties.total_score || 0,
    address: f.properties.address,
  }));

  const layers = showHeatmap
    ? [
        new HeatmapLayer({
          id: "heatmap",
          data: points,
          getPosition: d => d.coordinates,
          getWeight: d => d.total_score,
          radiusPixels: 40,
          intensity: 1,
          threshold: 0.05,
          colorRange: [
            [0, 255, 0, 100],
            [255, 255, 0, 150],
            [255, 165, 0, 180],
            [255, 0, 0, 220],
          ],
        })
      ]
    : [
        new ScatterplotLayer({
          id: "properties",
          data: points,
          getPosition: d => d.coordinates,
          getRadius: d => (d.parcel_id === hoveredId ? 18 : 12),
          getFillColor: d => TIER_COLORS[d.priority_tier] || [100, 100, 100, 150],
          pickable: true,
          onClick: ({ object }) => object && onSelect(object.parcel_id),
          onHover: ({ object }) => setHoveredId(object?.parcel_id || null),
          updateTriggers: { getRadius: hoveredId },
          transitions: { getRadius: 150 },
        })
      ];

  return (
    <div className="relative flex-1">
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState }) => setViewState(viewState)}
        controller={true}
        layers={layers}
      >
        <Map
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle="mapbox://styles/mapbox/dark-v11"
        >
          <NavigationControl position="top-right" />
        </Map>
      </DeckGL>

      {/* Toggle heatmap */}
      <div className="absolute bottom-4 left-4 flex gap-2">
        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className="px-3 py-2 bg-gray-800 text-white text-xs rounded shadow hover:bg-gray-700 transition"
        >
          {showHeatmap ? "Show Points" : "Show Heatmap"}
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-gray-900 bg-opacity-90 rounded p-3 text-xs">
        {Object.entries(TIER_COLORS).map(([tier, color]) => (
          <div key={tier} className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: `rgba(${color.join(",")})` }} />
            <span className="text-gray-300">{tier}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
