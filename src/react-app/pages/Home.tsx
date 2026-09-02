import { useState } from "react";
import { Package, Map, Briefcase, UserCircle, Sparkles, LayoutDashboard, Database, BookOpen, Settings, ChevronDown, Key, type LucideIcon } from "lucide-react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";

export default function HomePage() {
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState<string | null>(null);

  // Definindo as opções internas de cada módulo
  const subMenu: Record<string, { label: string, path: string, icon: LucideIcon }[]> = {
    "Entrega": [
      { label: "Agenda", path: "/entregas", icon: LayoutDashboard },
      { label: "Banco de Dados", path: "/database", icon: Database },
    ],
    "Mapeamentos": [],
    "Organizacional": [
      { label: "Treinamentos", path: "/treinamentos", icon: BookOpen },
      { label: "Controle de chaves", path: "/organizacional/controle-chaves", icon: Key },
    ],
    "Gestão Individual": [
      { label: "Configurações", path: "/configuracoes", icon: Settings },
    ]
  };

  const modulos = [
    { nome: "Entrega", icon: Package, cor: "from-blue-500 to-cyan-500", desc: "Gestão de vistorias e banco de dados" },
    { nome: "Mapeamentos", icon: Map, cor: "from-indigo-500 to-purple-500", desc: "Conferências e relatórios visuais" },
    { nome: "Organizacional", icon: Briefcase, cor: "from-emerald-500 to-teal-500", desc: "Treinamentos, diários e escadinha" },
    { nome: "Gestão Individual", icon: UserCircle, cor: "from-orange-500 to-red-500", desc: "Finanças, treinos e repertório" }
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] w-full animate-in fade-in duration-700">
      <div className="text-center mb-16 relative">
        <div className="absolute -top-6 -right-6 text-yellow-400 animate-pulse">
          <Sparkles className="w-8 h-8 opacity-70" />
        </div>
        <h1 className="text-7xl md:text-8xl font-black text-slate-900 tracking-tighter">
          Nord<span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Tool</span>
        </h1>
        <p className="text-lg text-slate-500 font-medium max-w-xl mx-auto">
          Sistema Integrado de Gestão de Obras
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl px-4">
        {modulos.map((mod, i) => (
          <div key={i} className="relative">
            <button 
              onClick={() => setActiveModule(activeModule === mod.nome ? null : mod.nome)}
              className="group relative bg-white p-6 rounded-3xl shadow-sm border border-slate-200/60 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden text-left w-full h-full"
            >
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${mod.cor}`} />
              <div className={`w-12 h-12 rounded-2xl mb-4 flex items-center justify-center bg-gradient-to-br ${mod.cor} text-white shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                <mod.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{mod.nome}</h3>
              <p className="text-sm text-slate-500 mb-6">{mod.desc}</p>
              <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider">
                {subMenu[mod.nome]?.length > 0 ? "Acessar" : "Em breve"} <ChevronDown className="w-4 h-4" />
              </div>
            </button>

            {/* Menu em Cascata */}
            <AnimatePresence>
              {activeModule === mod.nome && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 overflow-hidden"
                >
                  {subMenu[mod.nome]?.map((opt, idx) => (
                    <motion.button
                      key={opt.path}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      onClick={() => navigate(opt.path)}
                      className="flex items-center gap-3 w-full p-3 hover:bg-slate-50 rounded-xl text-sm font-bold text-slate-600 transition-colors"
                    >
                      <opt.icon className="w-4 h-4 text-blue-500" />
                      {opt.label}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
