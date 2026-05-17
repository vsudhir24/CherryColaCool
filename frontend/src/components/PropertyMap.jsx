import { useEffect, useRef } from 'react';
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { DETROIT_CENTER, DETROIT_ZOOM, getRiskTier, getTierColor } from '../utils/scoring';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const MAP_ID = import.meta.env.VITE_GOOGLE_MAP_ID || '';

const MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#1a1f26' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1f26' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8b949e' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2d333b' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#21262d' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d1117' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

export default function PropertyMap({ properties, selectedId, onSelect }) {
  if (!API_KEY) {
    return <MapPlaceholder propertyCount={properties.length} />;
  }

  return (
    <APIProvider apiKey={API_KEY}>
      <Map
        defaultCenter={DETROIT_CENTER}
        defaultZoom={DETROIT_ZOOM}
        gestureHandling="greedy"
        mapId={MAP_ID || undefined}
        styles={MAP_ID ? undefined : MAP_STYLES}
        className="h-full w-full"
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl
      >
        <PropertyMarkers
          properties={properties}
          selectedId={selectedId}
          onSelect={onSelect}
        />
        <MapLegend />
      </Map>
    </APIProvider>
  );
}

function makePinIcon(color, score, isSelected) {
  const size = isSelected ? 40 : 34;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 34 42">
      <path d="M17 0C8.2 0 1 7.2 1 16c0 11.5 16 26 16 26s16-14.5 16-26C33 7.2 25.8 0 17 0z" fill="${color}" stroke="${isSelected ? '#ffffff' : 'rgba(255,255,255,0.5)'}" stroke-width="2"/>
      <text x="17" y="19" text-anchor="middle" fill="#fff" font-size="11" font-weight="700" font-family="system-ui,sans-serif">${score}</text>
    </svg>
  `;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(size, size + 8),
    anchor: new google.maps.Point(size / 2, size + 6),
  };
}

function PropertyMarkers({ properties, selectedId, onSelect }) {
  const map = useMap();
  const clustererRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!map || !window.google?.maps) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    clustererRef.current?.clearMarkers();

    const markers = properties.map((property) => {
      const tier = getRiskTier(property.priorityScore);
      const color = getTierColor(tier);
      const isSelected = property.id === selectedId;

      const marker = new google.maps.Marker({
        position: { lat: property.lat, lng: property.lng },
        title: property.address,
        icon: makePinIcon(color, property.priorityScore, isSelected),
        zIndex: isSelected ? 1000 : property.priorityScore,
      });

      marker.addListener('click', () => onSelect(property));
      return marker;
    });

    markersRef.current = markers;
    clustererRef.current = new MarkerClusterer({ map, markers });

    return () => {
      markersRef.current.forEach((m) => m.setMap(null));
      clustererRef.current?.clearMarkers();
    };
  }, [map, properties, selectedId, onSelect]);

  useEffect(() => {
    if (!map || !selectedId) return;
    const selected = properties.find((p) => p.id === selectedId);
    if (selected) {
      map.panTo({ lat: selected.lat, lng: selected.lng });
    }
  }, [map, selectedId, properties]);

  return null;
}

function MapLegend() {
  const tiers = [
    { label: 'Critical 90+', tier: 'critical' },
    { label: 'High 75–89', tier: 'high' },
    { label: 'Medium 60–74', tier: 'medium' },
    { label: 'Lower <60', tier: 'low' },
  ];

  return (
    <div className="pointer-events-none absolute bottom-4 left-4 z-10 rounded-xl border border-detroit-border/80 bg-detroit-panel/95 px-3 py-2 shadow-panel backdrop-blur-md">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-detroit-muted">
        Priority
      </p>
      <div className="flex flex-wrap gap-2">
        {tiers.map(({ label, tier }) => (
          <span key={tier} className="flex items-center gap-1.5 text-[10px] text-gray-300">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: getTierColor(tier) }}
            />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

function MapPlaceholder({ propertyCount }) {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-detroit-slate via-[#1a2332] to-michigan-blue/30 p-8 text-center">
      <div className="absolute inset-0 opacity-20">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2d333b" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      <div className="relative z-10 max-w-md">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-detroit-accent/20 ring-1 ring-detroit-accent/40">
          <svg className="h-8 w-8 text-detroit-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
        <h3 className="font-display text-xl font-bold text-white">Google Maps API key required</h3>
        <p className="mt-2 text-sm text-detroit-muted">
          Copy <code className="rounded bg-detroit-border px-1.5 py-0.5 text-xs">.env.example</code> to{' '}
          <code className="rounded bg-detroit-border px-1.5 py-0.5 text-xs">.env</code> and set{' '}
          <code className="rounded bg-detroit-border px-1.5 py-0.5 text-xs">VITE_GOOGLE_MAPS_API_KEY</code>.
        </p>
        <p className="mt-3 text-xs text-detroit-muted">
          Enable <strong className="text-gray-400">Maps JavaScript API</strong> in Google Cloud Console.
        </p>
        <p className="mt-4 rounded-lg border border-detroit-border bg-detroit-panel/80 px-3 py-2 text-sm text-blue-200">
          {propertyCount} ranked properties ready in the list — pins appear once your key is set.
        </p>
      </div>
      <MockMapPins />
    </div>
  );
}

function MockMapPins() {
  const pins = [
    { x: 48, y: 42, color: '#f85149' },
    { x: 52, y: 45, color: '#e85d04' },
    { x: 55, y: 38, color: '#f85149' },
    { x: 44, y: 50, color: '#e85d04' },
    { x: 58, y: 48, color: '#d29922' },
    { x: 40, y: 35, color: '#d29922' },
    { x: 62, y: 52, color: '#3fb950' },
  ];

  return (
    <div className="pointer-events-none absolute inset-0">
      {pins.map((p, i) => (
        <div
          key={i}
          className="absolute h-3 w-3 rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            backgroundColor: p.color,
            boxShadow: `0 0 8px ${p.color}`,
          }}
        />
      ))}
    </div>
  );
}
