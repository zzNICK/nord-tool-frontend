import { useState } from "react";
import { Outlet, NavLink } from "react-router";
import { 
  Database, BarChart3, Package, Settings, Menu, ChevronLeft, 
  Home as HomeIcon, Briefcase, GraduationCap,
  ClipboardCheck, AlertTriangle, Camera, FileText, BookOpen, 
  TrendingUp, GitMerge, FileCheck, CalendarDays, Wallet, Dumbbell, Music, Book, Key
} from "lucide-react";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuGroups = [
    {
      title: "Visão Geral",
      items: [
        { path: "/", label: "Início", icon: HomeIcon },
      ]
    },
    {
      title: "Entrega",
      items: [
        { path: "/entregas", label: "Agenda", icon: Package },
        { path: "/database", label: "Banco de Dados", icon: Database },
        { path: "/dashboard", label: "Dashboard", icon: BarChart3 },
      ]
    },
    {
      title: "Mapeamentos",
      items: [
        { path: "/mapeamentos/conferencias", label: "Conferências", icon: ClipboardCheck },
        { path: "/mapeamentos/pendencias", label: "Mapeamento de pendências", icon: AlertTriangle },
        { path: "/mapeamentos/relatorio-fotografico", label: "Relatório fotográfico", icon: Camera },
      ]
    },
    {
      title: "Organizacional",
      items: [
        { path: "/organizacional/rte", label: "RTE", icon: FileText },
        { path: "/organizacional/diario-obras", label: "Diário de obras", icon: BookOpen },
        { path: "/organizacional/escadinha", label: "Escadinha", icon: TrendingUp },
        { path: "/organizacional/fluxograma", label: "Fluxo de atividades", icon: GitMerge },
        { path: "/organizacional/controle-chaves", label: "Controle de chaves", icon: Key },
        { path: "/treinamentos", label: "Controle de treinamentos", icon: GraduationCap },
        { path: "/organizacional/fvs", label: "Controle de FVs", icon: FileCheck },
        { path: "/organizacional/projetos", label: "Controle de projetos", icon: Briefcase },
        { path: "/organizacional/cronograma", label: "Cronograma semanal", icon: CalendarDays },
      ]
    },
    {
      title: "Gestão Individual",
      items: [
        { path: "/gestao/financeiro", label: "Gestão financeira", icon: Wallet },
        { path: "/gestao/treinos", label: "Organograma de treinos", icon: Dumbbell },
        { path: "/gestao/repertorio", label: "Repertório", icon: Music },
        { path: "/gestao/academico", label: "Desenvolvimento acadêmico", icon: Book },
      ]
    },
  ];

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden relative font-sans">
      
      <aside
        className={`bg-white border-r border-slate-200 shadow-2xl transition-all duration-300 ease-in-out flex flex-col overflow-hidden z-50 ${
          sidebarOpen ? "w-80 opacity-100" : "w-0 opacity-0 border-none"
        }`}
      >
        <div className="w-80 flex flex-col h-full">
          <div className="p-6 flex items-center justify-between border-b border-slate-100 bg-white sticky top-0 z-10">
            <div>
              <h1 className="text-2xl font-black tracking-tight">
                <span className="text-slate-800">Nord</span>
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Tool</span>
              </h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-red-500 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          <nav className="px-4 py-6 flex-1 overflow-y-auto space-y-8 no-scrollbar">
            {menuGroups.map((group, idx) => (
              <div key={idx}>
                <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-3">
                  {group.title}
                </h3>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === "/"}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm ${
                          isActive
                            ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 font-bold"
                            : "text-slate-600 hover:bg-slate-50 hover:text-blue-600 font-medium"
                        }`
                      }
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Configurações fixadas no rodapé */}
          <div className="p-4 border-t border-slate-100 bg-white">
            <NavLink
              to="/configuracoes"
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 text-sm ${
                  isActive
                    ? "bg-slate-800 text-white shadow-md font-bold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                }`
              }
            >
              <Settings className="w-4 h-4" />
              <span>Configurações</span>
            </NavLink>
          </div>

        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {!sidebarOpen && (
          <div className="absolute top-6 left-6 z-50 flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-3 bg-white/50 backdrop-blur-md border border-white/60 rounded-2xl shadow-sm hover:bg-white transition-all group"
            >
              <Menu className="w-5 h-5 text-slate-700 group-hover:text-blue-600 transition-colors" />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-auto h-full">
          <div className={`transition-all duration-300 h-full ${!sidebarOpen ? "pl-20 pt-6" : "p-8"}`}>
            <Outlet context={{ sidebarOpen }} />
          </div>
        </div>
      </main>
    </div>
  );
}