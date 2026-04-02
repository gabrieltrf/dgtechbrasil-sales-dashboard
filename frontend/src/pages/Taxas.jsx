import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { fetchFees, saveFees } from "../api/client";

const PLATFORMS = ["Mercado Livre", "Mercado Livre Fulfillment", "Amazon"];

function parseNum(v) {
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? 0 : n;
}

export default function Taxas() {
  const [rows, setRows]     = useState([]);
  const [dirty, setDirty]   = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await fetchFees();
      setRows(data);
      setDirty(false);
    } catch {
      toast.error("Erro ao carregar taxas.");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const update = (sku, platform, field, value) => {
    setRows((prev) =>
      prev.map((r) =>
        r.sku === sku && r.platform === platform ? { ...r, [field]: value } : r
      )
    );
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = rows.map((r) => ({
        sku:         r.sku,
        platform:    r.platform,
        fee_percent: parseNum(r.fee_percent),
        fee_fixed:   parseNum(r.fee_fixed),
      }));
      await saveFees(payload);
      toast.success("Taxas salvas com sucesso!");
      setDirty(false);
    } catch {
      toast.error("Erro ao salvar taxas.");
    }
    setSaving(false);
  };

  // Group rows by SKU for display
  const skus = [...new Set(rows.map((r) => r.sku))].sort();

  const inputCls =
    "w-24 text-right border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurar Taxas</h1>
          <p className="text-sm text-gray-500 mt-1">
            Taxa % é cobrada sobre o valor total da venda. Taxa fixa é cobrada por <strong>unidade</strong> vendida.
          </p>
        </div>
        <button
          onClick={save}
          disabled={!dirty || saving}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          {saving ? "Salvando…" : "💾 Salvar"}
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
          <p className="text-4xl mb-3">📭</p>
          <p>Nenhum dado de vendas encontrado. Importe um Excel primeiro.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Plataforma</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Taxa %
                  <span className="block font-normal normal-case text-gray-400">sobre valor total</span>
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Taxa Fixa (R$)
                  <span className="block font-normal normal-case text-gray-400">por unidade vendida</span>
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Exemplo
                  <span className="block font-normal normal-case text-gray-400">10 un. × R$40</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {skus.map((sku) => {
                const skuRows = rows.filter((r) => r.sku === sku);
                return skuRows.map((row, idx) => {
                  const exampleTotal = 400;
                  const exampleQty   = 10;
                  const fee = parseNum(row.fee_percent) * exampleTotal / 100 + parseNum(row.fee_fixed) * exampleQty;
                  return (
                    <tr
                      key={`${sku}-${row.platform}`}
                      className="border-b last:border-0 hover:bg-gray-50"
                    >
                      {idx === 0 ? (
                        <td
                          rowSpan={skuRows.length}
                          className="px-4 py-2 align-middle font-mono text-xs text-gray-700 border-r border-gray-100"
                          style={{ verticalAlign: "middle" }}
                        >
                          {sku}
                        </td>
                      ) : null}
                      <td className="px-4 py-2">
                        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                          row.platform.includes("Amazon")
                            ? "bg-orange-50 text-orange-700"
                            : "bg-yellow-50 text-yellow-700"
                        }`}>
                          {row.platform}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            className={inputCls}
                            value={row.fee_percent}
                            onChange={(e) => update(sku, row.platform, "fee_percent", e.target.value)}
                          />
                          <span className="text-gray-400 text-xs">%</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-gray-400 text-xs">R$</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className={inputCls}
                            value={row.fee_fixed}
                            onChange={(e) => update(sku, row.platform, "fee_fixed", e.target.value)}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-gray-500 text-xs">
                        R$ {fee.toFixed(2).replace(".", ",")}
                      </td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 p-4 bg-blue-50 rounded-lg text-xs text-blue-700 space-y-1">
        <p><strong>Como funciona o cálculo:</strong></p>
        <p>Taxa de plataforma = (Valor total × Taxa%) + (Unidades × Taxa fixa)</p>
        <p>Lucro Real = Lucro Bruto − Frete − Taxa de plataforma</p>
      </div>
    </div>
  );
}
