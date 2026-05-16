import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";

const TIER_STYLES = {
  CRITICAL: "bg-red-900 text-red-200 border-red-700",
  HIGH: "bg-orange-900 text-orange-200 border-orange-700",
  MEDIUM: "bg-yellow-900 text-yellow-200 border-yellow-700",
  LOW: "bg-green-900 text-green-200 border-green-700",
};

export default function PropertyPanel({ property, onClose }) {
  const radarData = [
    { subject: "Blight", value: Math.round((property.blight_score || 0) * 100) },
    { subject: "Vacancy", value: Math.round((property.vacancy_score || 0) * 100) },
    { subject: "Tax", value: Math.round((property.tax_score || 0) * 100) },
    { subject: "Complaints", value: Math.round((property.complaint_score || 0) * 100) },
  ];

  return (
    <div className="w-96 bg-gray-900 border-l border-gray-800 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-gray-800">
        <div>
          <p className="text-xs text-gray-400 mb-1">{property.parcel_id}</p>
          <h2 className="text-sm font-bold text-white leading-snug">{property.address}</h2>
          <p className="text-xs text-gray-400 mt-1">{property.neighborhood}</p>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white text-lg ml-2">✕</button>
      </div>

      {/* Priority Tier */}
      <div className="p-4 border-b border-gray-800">
        <div className={`inline-block px-3 py-1 rounded border text-xs font-bold ${TIER_STYLES[property.priority_tier] || ""}`}>
          {property.priority_tier} PRIORITY
        </div>
        <div className="mt-2 text-2xl font-bold text-white">
          {Math.round((property.total_score || 0) * 100)}
          <span className="text-sm text-gray-400 font-normal"> / 100</span>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="p-4 border-b border-gray-800">
        <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Score Breakdown</p>
        <ResponsiveContainer width="100%" height={180}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#374151" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: "#9CA3AF", fontSize: 11 }} />
            <Radar dataKey="value" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* AI Explanation */}
      {property.ai_explanation && (
        <div className="p-4 border-b border-gray-800">
          <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">AI Analysis</p>
          <p className="text-sm text-gray-200 leading-relaxed">{property.ai_explanation}</p>
        </div>
      )}

      {/* Property Details */}
      <div className="p-4 border-b border-gray-800">
        <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Details</p>
        <div className="space-y-1 text-xs">
          <Detail label="Vacant Since" value={property.vacancy_since || "Unknown"} />
          <Detail label="Tax Delinquent" value={property.tax_delinquent ? `Yes (${property.years_delinquent} yrs)` : "No"} />
          <Detail label="Blight Violations" value={property.violations?.length || 0} />
          <Detail label="311 Complaints" value={property.complaints?.length || 0} />
        </div>
      </div>

      {/* Recent Violations */}
      {property.violations?.length > 0 && (
        <div className="p-4">
          <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Recent Violations</p>
          <div className="space-y-2">
            {property.violations.slice(0, 3).map((v, i) => (
              <div key={i} className="bg-gray-800 rounded p-2 text-xs">
                <p className="text-white font-medium">{v.description}</p>
                <p className="text-gray-400">{v.violation_date} · ${v.fine_amount}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-400">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}
