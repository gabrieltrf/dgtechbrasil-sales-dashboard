import { formatDate } from "../../utils/formatters";

export default function UploadHistory({ logs = [] }) {
  if (!logs.length) return <p className="text-sm text-gray-400">Nenhum upload realizado ainda.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500 text-xs uppercase tracking-wide">
            <th className="pb-2 pr-4">Arquivo</th>
            <th className="pb-2 pr-4">Data</th>
            <th className="pb-2 pr-4 text-right">Linhas</th>
            <th className="pb-2 pr-4 text-right text-green-600">Inseridas</th>
            <th className="pb-2 text-right text-gray-400">Duplicatas</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((l) => (
            <tr key={l.id} className="border-b last:border-0 hover:bg-gray-50">
              <td className="py-2 pr-4 font-mono text-xs text-gray-700 max-w-[200px] truncate">{l.filename}</td>
              <td className="py-2 pr-4 text-gray-500 whitespace-nowrap">
                {new Date(l.uploaded_at).toLocaleString("pt-BR")}
              </td>
              <td className="py-2 pr-4 text-right">{l.rows_parsed}</td>
              <td className="py-2 pr-4 text-right font-semibold text-green-600">{l.rows_inserted}</td>
              <td className="py-2 text-right text-gray-400">{l.rows_skipped}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
