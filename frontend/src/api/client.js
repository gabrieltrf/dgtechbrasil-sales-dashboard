import axios from "axios";

const api = axios.create({
  baseURL: "",
  timeout: 60000,
});

export default api;

export const uploadExcel = (formData, onProgress) =>
  api.post("/api/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) =>
      onProgress && onProgress(Math.round((e.loaded * 100) / e.total)),
  });

export const fetchUploads = () => api.get("/api/uploads");

export const fetchSummary = (params) =>
  api.get("/api/metrics/summary", { params });

export const fetchRevenueByMonth = (params) =>
  api.get("/api/metrics/revenue-by-month", { params });

export const fetchRevenueByPlatform = (params) =>
  api.get("/api/metrics/revenue-by-platform", { params });

export const fetchTopSkus = (params) =>
  api.get("/api/metrics/top-skus", { params });

export const fetchSalesByState = (params) =>
  api.get("/api/metrics/sales-by-state", { params });

export const fetchFilterOptions = () => api.get("/api/metrics/filter-options");

export const fetchSales = (params) => api.get("/api/sales", { params });

export const fetchFees    = ()      => api.get("/api/fees/skus-platforms");
export const saveFees     = (fees)  => api.put("/api/fees", fees);

export const exportCsv = (params) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v)
  ).toString();
  window.open(`/api/sales/export${qs ? "?" + qs : ""}`, "_blank");
};

export const fetchMonthComparison = (params) =>
  api.get("/api/metrics/month-comparison", { params });

export const fetchMarginRanking = (params) =>
  api.get("/api/metrics/margin-ranking", { params });

export const fetchOperationalCosts = () =>
  api.get("/api/operational-costs");

export const createOperationalCost = (data) =>
  api.post("/api/operational-costs", data);

export const updateOperationalCost = (id, data) =>
  api.put(`/api/operational-costs/${id}`, data);

export const deleteOperationalCost = (id) =>
  api.delete(`/api/operational-costs/${id}`);
