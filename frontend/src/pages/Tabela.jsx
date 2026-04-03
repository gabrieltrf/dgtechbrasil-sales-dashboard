import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { fetchSales, fetchFilterOptions, exportCsv } from "../api/client";
import { formatBRL, formatPct, formatDate } from "../utils/formatters";

const PAGE_SIZE = 50;

export default function Tabela() {
  const [filters, setFilters] = useState({ date_from: "", date_to: "", platform: "", uf: "", sku: "" });
  const [options, setOptions]   = useState({ platforms: [], ufs: [], skus: [] });
  const [data,    setData]      = useState({ items: [], total: 0 });
  const [page,    setPage]      = useState(1);
  const [loading, setLoading]   = useState(false);

  const activeFilters = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));

  useEffect(() => {
    fetchFilterOptions().then(({ data: d }) => setOptions(d)).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: d } = await fetchSales({ ...activeFilters, page, page_size: PAGE_SIZE });
      setData(d);
    } catch (e) {
      toast.error("Erro ao carregar vendas.");
    }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(activeFilters), page]);

  useEffect(() => { load(); }, [load]);

  const setF = (k) => (e) => { setFilters((p) => ({ ...p, [k]: e.target.value })); setPage(1); };

  const totalPages = Math.ceil(data.total / PAGE_SIZE);
  const inputCls = "text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tabela de Vendas</h1>
          <p className="text-xs text-gray-400">{data.total} registros</p>
        </div>
        <div className="flex flex-wrap gap-2 ml-auto items-end">
          <input type="date" className={inputCls} value={filters.date_from} onChange={setF("date_from")} />
          <input type="date" className={inputCls} value={filters.date_to} onChange={setF("date_to")} />
          <select className={inputCls} value={filters.platform} onChange={setF("platform")}>
            <option value="">Plataforma</option>
            {options.platforms.map((p) => <option key={p}>{p}</option>)}
          </select>
          <select className={inputCls} value={filters.uf} onChange={setF("uf")}>
            <option value="">Estado</option>
            {options.ufs.map((u) => <option key={u}>{u}</option>)}
          </select>
          <select className={inputCls} value={filters.sku} onChange={setF("sku")}>
            <option value="">SKU</option>
            {options.skus.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            onClick={() => exportCsv(activeFilters)}
            className="text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            ⬇ CSV
          </button>
          {Object.values(activeFilters).some(Boolean) && (
            <button
              onClick={() => { setFilters({ date_from: "", date_to: "", platform: "", uf: "", sku: "" }); setPage(1); }}
              className="text-xs text-red-500 hover:text-red-700 px-2 py-2"
            >
              ✕ Limpar
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {["Data","Estado","Plataforma","SKU","Qtd","Preço Unit.","Total","Custo","Frete","Taxa Plat.","Lucro Bruto","Lucro Real","Margem Real"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={12} className="text-center py-10 text-gray-400">Carregando…</td></tr>
            ) : data.items.length === 0 ? (
              <tr><td colSpan={12} className="text-center py-10 text-gray-400">Sem registros.</td></tr>
            ) : data.items.map((row) => (
              <tr key={row.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-2 whitespace-nowrap text-gray-600">{formatDate(row.sale_date)}</td>
                <td className="px-4 py-2"><span className="inline-block bg-gray-100 text-gray-700 rounded px-1.5 py-0.5 text-xs font-mono">{row.uf}</span></td>
                <td className="px-4 py-2 text-gray-700 whitespace-nowrap">{row.platform}</td>
                <td className="px-4 py-2 font-mono text-xs text-gray-600 max-w-[160px] truncate" title={row.sku}>{row.sku}</td>
                <td className="px-4 py-2 text-right tabular-nums">{row.quantity}</td>
                <td className="px-4 py-2 text-right tabular-nums">{formatBRL(row.unit_price)}</td>
                <td className="px-4 py-2 text-right tabular-nums font-medium">{formatBRL(row.total_value)}</td>
                <td className="px-4 py-2 text-right tabular-nums text-gray-500">{formatBRL(row.cost_price * row.quantity)}</td>
                <td className="px-4 py-2 text-right tabular-nums text-gray-500">{formatBRL(row.shipping)}</td>
                <td className="px-4 py-2 text-right tabular-nums text-red-500">{formatBRL(row.taxa_plataforma ?? 0)}</td>
                <td className="px-4 py-2 text-right tabular-nums text-green-700 font-medium">{formatBRL(row.gross_profit)}</td>
                <td className="px-4 py-2 text-right tabular-nums text-purple-700 font-semibold">{formatBRL(row.lucro_real ?? row.gross_profit)}</td>
                <td className="px-4 py-2 text-right tabular-nums">
                  <span className={`text-xs font-semibold ${(row.margem_real ?? row.gross_margin) >= 0 ? "text-green-600" : "text-red-500"}`}>
                    {formatPct(row.margem_real ?? row.gross_margin)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <p>Página {page} de {totalPages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border rounded-lg disabled:opacity-40 hover:bg-gray-100"
            >
              ← Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 border rounded-lg disabled:opacity-40 hover:bg-gray-100"
            >
              Próxima →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
