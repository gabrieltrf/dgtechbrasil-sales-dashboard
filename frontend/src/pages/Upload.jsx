import { useEffect, useState, useCallback } from "react";
import UploadZone from "../components/upload/UploadZone";
import UploadHistory from "../components/upload/UploadHistory";
import { fetchUploads } from "../api/client";

export default function Upload() {
  const [logs, setLogs] = useState([]);

  const load = useCallback(async () => {
    try {
      const { data } = await fetchUploads();
      setLogs(data);
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Importar Dados</h1>
      <p className="text-sm text-gray-500 mb-6">
        Faça upload do relatório Excel exportado pelo ERP. Linhas duplicadas são ignoradas automaticamente.
      </p>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <UploadZone onSuccess={load} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Histórico de Uploads</h2>
        <UploadHistory logs={logs} />
      </div>
    </div>
  );
}
