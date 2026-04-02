import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { formatBRL } from "../../utils/formatters";

export default function StateBarChart({ data = [] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="uf" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(1)}k`} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v) => formatBRL(v)} labelFormatter={(l) => `Estado: ${l}`} />
        <Bar dataKey="faturamento" name="Faturamento" fill="#6366f1" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
