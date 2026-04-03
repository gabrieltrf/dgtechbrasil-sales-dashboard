import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  fetchOperationalCosts, createOperationalCost,
  updateOperationalCost, deleteOperationalCost,
  fetchSummary,
} from "../api/client";
import { formatBRL } from "../utils/formatters";

const EMPTY_FORM = { name: "", cost_type: "per_unit", amount: "", active: true };

export default function Custos() {
  const [costs,   setCosts]   = useState([]);
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null); // id being edited
  const [editVal, setEditVal] = useState({});
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [c, s] = await Promise.all([fetchOperationalCosts(), fetchSummary({})]);
      setCosts(c.data);
      setSummary(s.data);
    } catch {
      toast.error("Erro ao carregar custos.");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.amount) return;
    try {
      await createOperationalCost({ ...form, amount: Number(form.amount) });
      setForm(EMPTY_FORM);
      toast.success("Custo adicionado!");
      load();
    } catch {
      toast.error("Erro ao criar custo.");
    }
  };

  const startEdit = (c) => {
    setEditing(c.id);
    setEditVal({ name: c.name, cost_type: c.cost_type, amount: c.amount, active: c.active });
  };

  const saveEdit = async (id) => {
    try {
      await updateOperationalCost(id, { ...editVal, amount: Number(editVal.amount) });
      setEditing(null);
      toast.success("Custo atualizado!");
      load();
    } catch {
      toast.error("Erro ao atualizar custo.");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Remover este custo?")) return;
    try {
      await deleteOperationalCost(id);
      toast.success("Custo removido.");
      load();
    } catch {
      toast.error("Erro ao remover custo.");
    }
  };

  const inputCls = "text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelType = (t) => t === "per_unit" ? "Por unidade" : "Mensal";

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Custos Operacionais</h1>
        <p className="text-xs text-gray-400 mt-0.5">Embalagem, etiquetas, mão de obra e outros custos fixos.</p>
      </div>

      {/* Card de impacto */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border-l-4 border-purple-500 shadow-sm p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Lucro Real (período total)</p>
            <p className="text-2xl font-bold text-gray-900">{formatBRL(summary.lucro_real)}</p>
            <p className="text-xs text-gray-400 mt-1">Após taxas + custos operacionais</p>
          </div>
          <div className="bg-white rounded-xl border-l-4 border-red-500 shadow-sm p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Custo Operacional Total</p>
            <p className="text-2xl font-bold text-gray-900">{formatBRL(summary.custo_operacional)}</p>
            <p className="text-xs text-gray-400 mt-1">Por unidade × unidades vendidas</p>
          </div>
          <div className="bg-white rounded-xl border-l-4 border-green-500 shadow-sm p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Margem Real</p>
            <p className="text-2xl font-bold text-gray-900">{summary.margem_real.toFixed(1)}%</p>
            <p className="text-xs text-gray-400 mt-1">Lucro real / faturamento</p>
          </div>
        </div>
      )}

      {/* Formulário de novo custo */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Adicionar Custo</h2>
        <form onSubmit={handleCreate} className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Nome</label>
            <input
              className={`${inputCls} w-48`}
              placeholder="Ex: Embalagem"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Tipo</label>
            <select
              className={inputCls}
              value={form.cost_type}
              onChange={(e) => setForm((p) => ({ ...p, cost_type: e.target.value }))}
            >
              <option value="per_unit">Por unidade</option>
              <option value="monthly">Mensal</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Valor (R$)</label>
            <input
              type="number" min="0" step="0.01"
              className={`${inputCls} w-28`}
              placeholder="0,00"
              value={form.amount}
              onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
              required
            />
          </div>
          <button
            type="submit"
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            + Adicionar
          </button>
        </form>
      </div>

      {/* Tabela de custos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {["Nome", "Tipo", "Valor", "Ativo", "Ações"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">Carregando…</td></tr>
            ) : costs.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">Nenhum custo cadastrado.</td></tr>
            ) : costs.map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                {editing === c.id ? (
                  <>
                    <td className="px-4 py-2">
                      <input className={inputCls} value={editVal.name} onChange={(e) => setEditVal((p) => ({ ...p, name: e.target.value }))} />
                    </td>
                    <td className="px-4 py-2">
                      <select className={inputCls} value={editVal.cost_type} onChange={(e) => setEditVal((p) => ({ ...p, cost_type: e.target.value }))}>
                        <option value="per_unit">Por unidade</option>
                        <option value="monthly">Mensal</option>
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <input type="number" min="0" step="0.01" className={`${inputCls} w-24`} value={editVal.amount} onChange={(e) => setEditVal((p) => ({ ...p, amount: e.target.value }))} />
                    </td>
                    <td className="px-4 py-2">
                      <input type="checkbox" checked={editVal.active} onChange={(e) => setEditVal((p) => ({ ...p, active: e.target.checked }))} />
                    </td>
                    <td className="px-4 py-2 flex gap-2">
                      <button onClick={() => saveEdit(c.id)} className="text-xs bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700">Salvar</button>
                      <button onClick={() => setEditing(null)} className="text-xs border border-gray-300 px-3 py-1 rounded-lg hover:bg-gray-100">Cancelar</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2 font-medium text-gray-800">{c.name}</td>
                    <td className="px-4 py-2 text-gray-500">{labelType(c.cost_type)}</td>
                    <td className="px-4 py-2 tabular-nums">{formatBRL(c.amount)}</td>
                    <td className="px-4 py-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {c.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-4 py-2 flex gap-2">
                      <button onClick={() => startEdit(c)} className="text-xs border border-gray-300 px-3 py-1 rounded-lg hover:bg-gray-100">Editar</button>
                      <button onClick={() => handleDelete(c.id)} className="text-xs text-red-500 border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50">Remover</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
