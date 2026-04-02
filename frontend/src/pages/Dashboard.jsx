import { useEffect, useState, useCallback } from "react";
import KpiCard from "../components/cards/KpiCard";
import RevenueLineChart from "../components/charts/RevenueLineChart";
import PlatformPieChart from "../components/charts/PlatformPieChart";
import TopSkuChart from "../components/charts/TopSkuChart";
import StateBarChart from "../components/charts/StateBarChart";
import {
  fetchSummary, fetchRevenueByMonth, fetchRevenueByPlatform,
  fetchTopSkus, fetchSalesByState, fetchFilterOptions,
} from "../api/client";
import { formatBRL, formatPct, formatNum } from "../utils/formatters";

function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">{title}</h2>
      {children}
    </div>
  );
}

export default function Dashboard() {
  const [filters, setFilters] = useState({ date_from: "", date_to: "", platform: "", uf: "" });
  const [options, setOptions] = useState({ platforms: [], ufs: [], date_min: "", date_max: "" });
  const [summary, setSummary]   = useState(null);
  const [byMonth, setByMonth]   = useState([]);
  const [byPlat,  setByPlat]    = useState([]);
  const [topSkus, setTopSkus]   = useState([]);
  const [byState, setByState]   = useState([]);
  const [loading, setLoading]   = useState(false);

  const activeFilters = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, m, p, sk, st] = await Promise.all([
        fetchSummary(activeFilters),
        fetchRevenueByMonth(activeFilters),
        fetchRevenueByPlatform(activeFilters),
        fetchTopSkus(activeFilters),
        fetchSalesByState(activeFilters),
      ]);
      setSummary(s.data);
      setByMonth(m.data);
      setByPlat(p.data);
      setTopSkus(sk.data);
      setByState(st.data);
    } catch {}
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(activeFilters)]);

  useEffect(() => {
    fetchFilterOptions().then(({ data }) => setOptions(data)).catch(() => {});
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const setF = (k) => (e) => setFilters((prev) => ({ ...prev, [k]: e.target.value }));

  const inputCls = "text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="p-6 space-y-6">
      {/* Header + Filtros */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          {options.date_min && (
            <p className="text-xs text-gray-400 mt-0.5">
              Dados de {options.date_min} a {options.date_max}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 ml-auto items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">De</label>
            <input type="date" className={inputCls} value={filters.date_from} onChange={setF("date_from")} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Até</label>
            <input type="date" className={inputCls} value={filters.date_to} onChange={setF("date_to")} />
          </div>
          <select className={inputCls} value={filters.platform} onChange={setF("platform")}>
            <option value="">Todas as plataformas</option>
            {options.platforms.map((p) => <option key={p}>{p}</option>)}
          </select>
          <select className={inputCls} value={filters.uf} onChange={setF("uf")}>
            <option value="">Todos os estados</option>
            {options.ufs.map((u) => <option key={u}>{u}</option>)}
          </select>
          {Object.values(activeFilters).some(Boolean) && (
            <button
              onClick={() => setFilters({ date_from: "", date_to: "", platform: "", uf: "" })}
              className="text-xs text-red-500 hover:text-red-700 px-2 py-2"
            >
              ✕ Limpar
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      {loading && !summary ? (
        <div className="text-center text-gray-400 py-12">Carregando…</div>
      ) : summary ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KpiCard title="Faturamento"      value={formatBRL(summary.faturamento)}      color="blue"   icon="💰" />
            <KpiCard title="Lucro Bruto"      value={formatBRL(summary.lucro_bruto)}      color="green"  icon="📈"
              sub={`Margem: ${formatPct(summary.margem_bruta)}`} />
            <KpiCard title="Taxa de Plataforma" value={formatBRL(summary.taxa_plataforma)} color="red"   icon="🏷️"
              sub="ML + Amazon" />
            <KpiCard title="Lucro Real"       value={formatBRL(summary.lucro_real)}       color="purple" icon="✅"
              sub={`Margem real: ${formatPct(summary.margem_real)}`} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KpiCard title="Custo Produtos"   value={formatBRL(summary.custo_produtos)}   color="red"    icon="📦" />
            <KpiCard title="Margem Bruta"     value={formatPct(summary.margem_bruta)}     color="green"  icon="%" />
            <KpiCard title="Ticket Médio"     value={formatBRL(summary.ticket_medio)}     color="yellow" icon="🎫" />
            <KpiCard title="Unid. Vendidas"   value={formatNum(summary.unidades_vendidas)} color="blue"  icon="📦"
              sub={`${formatNum(summary.num_vendas)} vendas`} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ChartCard title="Faturamento por Mês">
              <RevenueLineChart data={byMonth} />
            </ChartCard>
            <ChartCard title="Receita por Plataforma">
              <PlatformPieChart data={byPlat} />
            </ChartCard>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ChartCard title="Top Produtos (SKU)">
              <TopSkuChart data={topSkus} />
            </ChartCard>
            <ChartCard title="Vendas por Estado">
              <StateBarChart data={byState} />
            </ChartCard>
          </div>
        </>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">📂</p>
          <p className="text-lg font-medium">Nenhum dado encontrado.</p>
          <p className="text-sm mt-1">Importe um relatório Excel na página <a href="/upload" className="text-blue-500 underline">Importar</a>.</p>
        </div>
      )}
    </div>
  );
}
