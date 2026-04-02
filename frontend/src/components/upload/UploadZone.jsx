import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { uploadExcel } from "../../api/client";

export default function UploadZone({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback(
    async (accepted) => {
      if (!accepted.length) return;
      const file = accepted[0];
      const fd = new FormData();
      fd.append("file", file);

      setLoading(true);
      setProgress(0);
      try {
        const { data } = await uploadExcel(fd, setProgress);
        toast.success(
          `✅ ${data.rows_inserted} linhas inseridas, ${data.rows_skipped} duplicatas ignoradas`
        );
        onSuccess?.();
      } catch (err) {
        const msg = err?.response?.data?.detail || "Erro ao processar o arquivo.";
        toast.error(`❌ ${msg}`);
      } finally {
        setLoading(false);
        setProgress(0);
      }
    },
    [onSuccess]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] },
    maxFiles: 1,
    disabled: loading,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
        isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400 bg-white"
      } ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
    >
      <input {...getInputProps()} />
      <p className="text-4xl mb-3">📂</p>
      {loading ? (
        <div>
          <p className="text-sm text-gray-600 mb-3">Enviando… {progress}%</p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        <>
          <p className="text-gray-700 font-medium">
            {isDragActive ? "Solte o arquivo aqui" : "Arraste o relatório Excel aqui"}
          </p>
          <p className="text-sm text-gray-400 mt-1">ou clique para selecionar (.xlsx)</p>
        </>
      )}
    </div>
  );
}
