import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { shortMonth, formatBRL } from "../../utils/formatters";

const fmt = (v) => formatBRL(v).replace("R$\u00a0", "R$ ");

export default function RevenueLineChart({ data = [] }) {
  const mapped = data.map((d) => ({ ...d, mes: shortMonth(d.mes) }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={mapped} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v) => fmt(v)} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="faturamento"  name="Faturamento"  stroke="#3b82f6" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="lucro_bruto"  name="Lucro Bruto"  stroke="#22c55e" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="lucro_real"   name="Lucro Real"   stroke="#a855f7" strokeWidth={2} dot={false} strokeDasharray="4 2" />
      </LineChart>
    </ResponsiveContainer>
  );
}
