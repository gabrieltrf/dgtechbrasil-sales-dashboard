import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell, ResponsiveContainer,
} from "recharts";
import { formatBRL, formatPct } from "../../utils/formatters";

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md p-3 text-xs space-y-1">
      <p className="font-semibold text-gray-800 truncate max-w-[200px]">{d.sku}</p>
      <p className="text-purple-700">Margem Real: <span className="font-bold">{formatPct(d.margem_real)}</span></p>
      <p className="text-gray-600">Lucro Real: {formatBRL(d.lucro_real)}</p>
      <p className="text-gray-600">Unidades: {d.unidades}</p>
    </div>
  );
}

export default function MarginRanking({ data = [], threshold = 20 }) {
  // Shorten SKU for display
  const mapped = data.map((d) => ({
    ...d,
    label: d.sku.length > 20 ? d.sku.slice(0, 18) + "…" : d.sku,
  }));

  const height = Math.max(200, mapped.length * 36);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        layout="vertical"
        data={mapped}
        margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
        <XAxis
          type="number"
          tickFormatter={(v) => `${v.toFixed(0)}%`}
          tick={{ fontSize: 11 }}
        />
        <YAxis
          type="category"
          dataKey="label"
          width={160}
          tick={{ fontSize: 11 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="margem_real" radius={[0, 4, 4, 0]}>
          {mapped.map((entry) => (
            <Cell
              key={entry.sku}
              fill={entry.margem_real < threshold ? "#ef4444" : "#22c55e"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
