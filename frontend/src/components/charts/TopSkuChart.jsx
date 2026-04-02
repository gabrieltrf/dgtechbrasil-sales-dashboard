import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { formatBRL } from "../../utils/formatters";

export default function TopSkuChart({ data = [] }) {
  const mapped = data.map((d) => ({
    ...d,
    label: d.sku.length > 22 ? d.sku.slice(0, 22) + "…" : d.sku,
  }));
  return (
    <ResponsiveContainer width="100%" height={Math.max(240, data.length * 36)}>
      <BarChart data={mapped} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tickFormatter={(v) => `R$${(v / 1000).toFixed(1)}k`} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={160} />
        <Tooltip
          formatter={(v, n) => [formatBRL(v), n === "faturamento" ? "Faturamento" : "Lucro Bruto"]}
        />
        <Bar dataKey="faturamento" name="Faturamento" fill="#3b82f6" radius={[0, 4, 4, 0]} />
        <Bar dataKey="lucro_bruto" name="Lucro Bruto"  fill="#22c55e" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
