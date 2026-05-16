export default function StatsBar({ stats }) {
  const tiers = stats.by_tier || {};
  return (
    <div className="flex items-center gap-6 px-6 py-2 bg-gray-900 border-b border-gray-800 text-xs">
      <Stat label="Total Properties" value={stats.total_properties?.toLocaleString()} />
      <Stat label="Critical" value={tiers.CRITICAL || 0} color="text-red-400" />
      <Stat label="High" value={tiers.HIGH || 0} color="text-orange-400" />
      <Stat label="Medium" value={tiers.MEDIUM || 0} color="text-yellow-400" />
      <Stat label="Low" value={tiers.LOW || 0} color="text-green-400" />
    </div>
  );
}

function Stat({ label, value, color = "text-white" }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-gray-500">{label}:</span>
      <span className={`font-bold ${color}`}>{value}</span>
    </div>
  );
}
