import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import KpiCard from "../components/cards/KpiCard";
import RevenueLineChart from "../components/charts/RevenueLineChart";
import PlatformPieChart from "../components/charts/PlatformPieChart";
import TopSkuChart from "../components/charts/TopSkuChart";
import StateBarChart from "../components/charts/StateBarChart";
import MarginRanking from "../components/charts/MarginRanking";
import {
  fetchSummary, fetchRevenueByMonth, fetchRevenueByPlatform,
  fetchTopSkus, fetchSalesByState, fetchFilterOptions,
  fetchMonthComparison, fetchMarginRanking,
} from "../api/client";
import { formatBRL, formatPct, formatNum } from "../utils/formatters";

const LS_THRESHOLD = "margin_alert_threshold";
const DEFAULT_THRESHOLD = 20;

function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">{title}</h2>
      {children}
    </div>
  );
}

function MomBadge({ change }) {
  if (change == null) return null;
  const up = change >= 0;
  return (
    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${up ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
      {up ? "↑" : "↓"}{Math.abs(change).toFixed(1)}% vs mês ant.
    </span>
  );
}

export default function Dashboard() {
  const [filters, setFilters] = useState({ date_from: "", date_to: "", platform: "", uf: "" });
  const [options, setOptions] = useState({ platforms: [], ufs: [], date_min: "", date_max: "" });
  const [summary,    setSummary]    = useState(null);
  const [byMonth,    setByMonth]    = useState([]);
  const [byPlat,     setByPlat]     = useState([]);
  const [topSkus,    setTopSkus]    = useState([]);
  const [byState,    setByState]    = useState([]);
  const [momData,    setMomData]    = useState(null);
  const [ranking,    setRanking]    = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [threshold,  setThreshold]  = useState(
    () => Number(localStorage.getItem(LS_THRESHOLD) ?? DEFAULT_THRESHOLD)
  );

  const activeFilters = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, m, p, sk, st, mom, rank] = await Promise.all([
        fetchSummary(activeFilters),
        fetchRevenueByMonth(activeFilters),
        fetchRevenueByPlatform(activeFilters),
        fetchTopSkus(activeFilters),
        fetchSalesByState(activeFilters),
        fetchMonthComparison(activeFilters),
        fetchMarginRanking(activeFilters),
      ]);
      setSummary(s.data);
      setByMonth(m.data);
      setByPlat(p.data);
      setTopSkus(sk.data);
      setByState(st.data);
      setMomData(mom.data);
      setRanking(rank.data);
    } catch (e) {
      toast.error("Erro ao carregar dados do dashboard.");
    }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(activeFilters)]);

  useEffect(() => {
    fetchFilterOptions().then(({ data }) => setOptions(data)).catch(() => {});
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const setF = (k) => (e) => setFilters((prev) => ({ ...prev, [k]: e.target.value }));

  const handleThreshold = (e) => {
    const v = Number(e.target.value);
    setThreshold(v);
    localStorage.setItem(LS_THRESHOLD, v);
  };

  const belowThreshold = ranking.filter((r) => r.margem_real < threshold);

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
          {/* Threshold de alerta */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Alertar abaixo de (%)</label>
            <input
              type="number" min={0} max={100} step={1}
              className={`${inputCls} w-24`}
              value={threshold}
              onChange={handleThreshold}
            />
          </div>
        </div>
      </div>

      {/* Banner de alerta de margem baixa */}
      {belowThreshold.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <span className="text-lg mt-0.5">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-red-700">
              {belowThreshold.length} SKU{belowThreshold.length > 1 ? "s" : ""} com margem real abaixo de {threshold}%
            </p>
            <p className="text-xs text-red-500 mt-0.5">
              {belowThreshold.map((r) => r.sku).join(" · ")}
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      {loading && !summary ? (
        <div className="text-center text-gray-400 py-12">Carregando…</div>
      ) : summary ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KpiCard title="Faturamento" value={formatBRL(summary.faturamento)} color="blue" icon="💰"
              sub={<MomBadge change={momData?.faturamento_change} />} />
            <KpiCard title="Lucro Bruto" value={formatBRL(summary.lucro_bruto)} color="green" icon="📈"
              sub={`Margem: ${formatPct(summary.margem_bruta)}`} />
            <KpiCard title="Taxa de Plataforma" value={formatBRL(summary.taxa_plataforma)} color="red" icon="🏷️"
              sub="ML + Amazon" />
            <KpiCard title="Lucro Real" value={formatBRL(summary.lucro_real)} color="purple" icon="✅"
              sub={<>
                <span className="block">Margem real: {formatPct(summary.margem_real)}</span>
                <MomBadge change={momData?.lucro_real_change} />
              </>} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KpiCard title="Custo Produtos"   value={formatBRL(summary.custo_produtos)}    color="red"    icon="📦" />
            <KpiCard title="Custo Operacional" value={formatBRL(summary.custo_operacional)} color="red"   icon="🔧"
              sub="Por unidade × quantidade" />
            <KpiCard title="Ticket Médio"      value={formatBRL(summary.ticket_medio)}      color="yellow" icon="🎫" />
            <KpiCard title="Unid. Vendidas"    value={formatNum(summary.unidades_vendidas)} color="blue"   icon="📦"
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

          {/* Ranking de Margem */}
          {ranking.length > 0 && (
            <ChartCard title="Ranking de Margem Real por SKU (piores primeiro)">
              <MarginRanking data={ranking} threshold={threshold} />
            </ChartCard>
          )}
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
