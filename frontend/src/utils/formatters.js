export const formatBRL = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v ?? 0);

export const formatPct = (v) =>
  `${(v ?? 0).toFixed(1).replace(".", ",")}%`;

export const formatNum = (v) =>
  new Intl.NumberFormat("pt-BR").format(v ?? 0);

export const formatDate = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

export const shortMonth = (ym) => {
  if (!ym) return "";
  const [y, m] = ym.split("-");
  const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  return `${months[parseInt(m, 10) - 1]}/${y.slice(2)}`;
};
