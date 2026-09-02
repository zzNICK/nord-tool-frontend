import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, LayoutGrid, List, Briefcase, Star, Minus } from "lucide-react";

const cronograma = [
  { id: 1, dia: "Segunda", hora: "07:30", titulo: "Alinhamento com Hulk & Tainá", tag: "TRABALHO", icon: <Briefcase size={14}/> },
  { id: 2, dia: "Segunda", hora: "10:00", titulo: "Vistoria e check das chaves", tag: "TRABALHO", icon: <Star size={14}/> },
  { id: 3, dia: "Terça", hora: "08:30", titulo: "Controle tecnológico: Analisar fck", tag: "TRABALHO", icon: <Briefcase size={14}/> },
];

const diasDaSemana = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

export default function NordToolDashboard() {
  const [view, setView] = useState<'kanban' | 'list'>('kanban');

  return (
    // Alterado para bg-slate-950 e adicionado arredondamento e margem
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-[1400px] rounded-[2rem] border border-slate-200 bg-[#111827] p-8 text-slate-200 shadow-2xl">
        
        {/* Header com contraste ajustado */}
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative rounded-2xl bg-violet-600 p-3 shadow-lg">
              <CalendarDays className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Cronograma Semanal</h1>
              <p className="text-sm text-slate-400">Gestão de pendências e rotina</p>
            </div>
          </div>

          {/* Botão de Toggle com visual mais leve */}
          <div className="flex rounded-xl bg-slate-900 p-1.5 border border-slate-700">
            <button onClick={() => setView('kanban')} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all ${view === 'kanban' ? 'bg-violet-600 text-white' : 'text-slate-400'}`}>
              <LayoutGrid size={16} /> Kanban
            </button>
            <button onClick={() => setView('list')} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all ${view === 'list' ? 'bg-violet-600 text-white' : 'text-slate-400'}`}>
              <List size={16} /> Lista
            </button>
          </div>
        </div>

      <AnimatePresence mode="wait">
        {view === 'kanban' ? (
          <motion.div key="kanban" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 gap-6 md:grid-cols-4 lg:grid-cols-7">
            {diasDaSemana.map((dia) => (
              <div key={dia} className="flex flex-col gap-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{dia}</h3>
                
                {cronograma.filter(t => t.dia === dia).length > 0 ? (
                  cronograma.filter(t => t.dia === dia).map((tarefa) => (
                    <motion.div whileHover={{ scale: 1.02 }} key={tarefa.id} className="rounded-2xl border border-slate-800 bg-[#151921] p-4 shadow-xl">
                      <div className="mb-3 flex items-center gap-2 text-[10px] font-bold text-emerald-500">
                        {tarefa.icon} {tarefa.hora}
                      </div>
                      <p className="text-sm font-semibold leading-snug">{tarefa.titulo}</p>
                    </motion.div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-800 bg-transparent p-4 text-center">
                    <Minus className="mx-auto mb-2 text-slate-700" size={16} />
                    <p className="text-[10px] font-bold text-slate-700 uppercase">Livre</p>
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mx-auto max-w-2xl space-y-4">
            {cronograma.map((item) => (
              <motion.div whileHover={{ x: 5 }} key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-[#151921] p-5 shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-slate-800 p-2 text-violet-400">{item.icon}</div>
                  <div>
                    <p className="font-semibold">{item.titulo}</p>
                    <p className="text-xs text-slate-500">{item.dia} • {item.hora}</p>
                  </div>
                </div>
                <span className="rounded-full bg-slate-900 px-3 py-1 text-[10px] font-bold border border-slate-800">{item.tag}</span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </div>
  );
}
