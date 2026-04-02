import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Tabela from "./pages/Tabela";
import Upload from "./pages/Upload";
import Taxas from "./pages/Taxas";

const NAV = [
  { to: "/",        label: "Dashboard",    icon: "📊" },
  { to: "/tabela",  label: "Vendas",       icon: "📋" },
  { to: "/taxas",   label: "Taxas",        icon: "🏷️" },
  { to: "/upload",  label: "Importar",     icon: "⬆️" },
];

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-56 bg-brand-900 text-white flex flex-col shrink-0">
          <div className="px-5 py-6 border-b border-brand-700">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-100 mb-1">DGTechBrasil</p>
            <p className="text-lg font-bold leading-tight">Painel de Vendas</p>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            {NAV.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-brand-600 text-white"
                      : "text-brand-100 hover:bg-brand-700"
                  }`
                }
              >
                <span>{icon}</span>
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="px-5 py-4 text-xs text-brand-300 border-t border-brand-700">
            v1.0.0
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/"       element={<Dashboard />} />
            <Route path="/tabela" element={<Tabela />} />
            <Route path="/taxas"  element={<Taxas />} />
            <Route path="/upload" element={<Upload />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
