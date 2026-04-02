export default function KpiCard({ title, value, sub, color = "blue", icon }) {
  const colors = {
    blue:   "border-blue-500 bg-blue-50 text-blue-600",
    green:  "border-green-500 bg-green-50 text-green-600",
    yellow: "border-yellow-500 bg-yellow-50 text-yellow-600",
    purple: "border-purple-500 bg-purple-50 text-purple-600",
    red:    "border-red-500 bg-red-50 text-red-600",
    indigo: "border-indigo-500 bg-indigo-50 text-indigo-600",
  };
  const [border, bg, text] = (colors[color] || colors.blue).split(" ");

  return (
    <div className={`bg-white rounded-xl shadow-sm border-l-4 ${border} p-5`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 truncate">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        {icon && (
          <span className={`text-2xl ml-3 p-2 rounded-lg ${bg} ${text}`}>{icon}</span>
        )}
      </div>
    </div>
  );
}
