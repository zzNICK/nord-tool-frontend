import { useState } from "react";
import { Outlet, NavLink } from "react-router";
import { Database, BarChart3, Package, Settings, Menu, ChevronLeft } from "lucide-react";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { path: "/", label: "Entregas", icon: Package },
    { path: "/database", label: "Banco de Dados", icon: Database },
    { path: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { path: "/configuracoes", label: "Configurações", icon: Settings },
  ];

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden relative">
      
      {/* Sidebar */}
      <aside
        className={`bg-white border-r border-slate-200 shadow-xl transition-all duration-300 ease-in-out flex flex-col overflow-hidden z-50 ${
          sidebarOpen ? "w-64 opacity-100" : "w-0 opacity-0 border-none"
        }`}
      >
        <div className="w-64 flex flex-col h-full">
          <div className="p-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Nord Tool
              </h1>
              <p className="text-xs text-slate-500 mt-1">Sistema de Apartamentos</p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          <nav className="px-3 mt-6 flex-1">
            {navItems.map((item: any) => {
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 mb-2 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md"
                        : "text-slate-600 hover:bg-slate-50"
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Área Principal */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* BOTÃO TRANSLÚCIDO E POSICIONAMENTO */}
        {!sidebarOpen && (
          <div className="absolute top-6 left-6 z-50 flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-3 bg-white/30 backdrop-blur-lg border border-white/40 rounded-2xl shadow-xl hover:bg-white/50 transition-all group"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }} // Forçando o inline pra não ter erro
            >
              <Menu className="w-6 h-6 text-slate-700 group-hover:text-blue-600 transition-colors" />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-auto h-full">
          {/* Ajuste de padding: Se a sidebar tá fechada, damos um espaço lateral pro botão não cobrir o título */}
          <div className={`transition-all duration-300 ${!sidebarOpen ? "pl-20 pt-6" : "p-8"}`}>
            <Outlet context={{ sidebarOpen }} />
          </div>
        </div>
      </main>
    </div>
  );
}