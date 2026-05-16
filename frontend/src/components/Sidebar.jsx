const TIER_DOT = {
  CRITICAL: "bg-red-500",
  HIGH: "bg-orange-500",
  MEDIUM: "bg-yellow-400",
  LOW: "bg-green-500",
};

export default function Sidebar({ properties, onSelect, loading }) {
  const sorted = [...properties].sort(
    (a, b) => (b.properties.total_score || 0) - (a.properties.total_score || 0)
  );

  return (
    <div className="w-72 bg-gray-900 border-r border-gray-800 flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800">
        <p className="text-xs text-gray-400 uppercase tracking-wide">
          {loading ? "Loading..." : `${properties.length} properties`}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {sorted.map(f => {
          const p = f.properties;
          return (
            <button
              key={p.parcel_id}
              onClick={() => onSelect(p.parcel_id)}
              className="w-full text-left px-4 py-3 border-b border-gray-800 hover:bg-gray-800 transition"
            >
              <div className="flex items-start gap-2">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${TIER_DOT[p.priority_tier] || "bg-gray-600"}`} />
                <div className="min-w-0">
                  <p className="text-xs text-white font-medium truncate">{p.address}</p>
                  <p className="text-xs text-gray-400 truncate">{p.neighborhood}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Score: <span className="text-white">{Math.round((p.total_score || 0) * 100)}</span>
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
