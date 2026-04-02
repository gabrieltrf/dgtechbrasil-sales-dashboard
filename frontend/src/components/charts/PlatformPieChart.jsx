import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatBRL } from "../../utils/formatters";

const COLORS = ["#3b82f6", "#22c55e", "#f97316", "#a855f7"];

export default function PlatformPieChart({ data = [] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="faturamento"
          nameKey="platform"
          cx="50%"
          cy="50%"
          outerRadius={90}
          label={({ platform, percent }) =>
            `${platform.replace("Mercado Livre", "ML")} ${(percent * 100).toFixed(0)}%`
          }
          labelLine={false}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => formatBRL(v)} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
