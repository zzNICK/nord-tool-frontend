import { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router"; 
import { Plus, Loader2, Calendar, AlertCircle, ChevronDown, ChevronUp, ChevronsDown, ChevronsUp } from "lucide-react";
import { format, parseISO, isValid, startOfWeek, endOfWeek} from "date-fns";
import { ptBR } from "date-fns/locale";

import type { ApartamentoVistoriaDto, ApartamentoVistoriaForm } from "@/shared/types";
import { apartamentoVistoriaService } from "@/react-app/services/ApartamentoVistoriaService";
import ApartmentCard from "@/react-app/components/ApartmentCard";
import ApartmentModal from "@/react-app/components/ApartmentModal";

export default function DeliveriesPage() {
  // Correção: Acessa o contexto de forma segura para evitar crash (tela branca)
  // se a página for renderizada fora do Layout principal por engano na configuração de rotas.
  const outletContext = useOutletContext<{ sidebarOpen: boolean }>();
  const sidebarOpen = outletContext?.sidebarOpen ?? false;
  
  const [activeTab, setActiveTab] = useState<"current" | "next" | "all">("current");
  const [filterNord, setFilterNord] = useState<"Nord 1" | "Nord 2" | null>(null);
  const [apartamentos, setApartamentos] = useState<ApartamentoVistoriaDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingApartment, setEditingApartment] = useState<ApartamentoVistoriaDto | null>(null);
  const [collapsedDates, setCollapsedDates] = useState<Record<string, boolean>>({});
  const [collapsedObservations, setCollapsedObservations] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchApartamentos();
  }, []);

  async function fetchApartamentos() {
    try {
      setLoading(true);
      const data = await apartamentoVistoriaService.listar();
      // Unificando a forma de carregar os dados, igual à página de Database
      setApartamentos(data || []);
    } catch (error) {
      console.error("Erro ao carregar:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async (savedApartment: ApartamentoVistoriaForm) => {
    // O objeto retornado pelo 'salvar' no modal pode não ter todos os campos calculados (ex: nmDiaSemana).
    // Para garantir consistência, usamos o ID retornado para buscar o objeto completo,
    // que é o mesmo formato retornado pela listagem geral.
    const savedId = savedApartment.idApartamentoVistoria;

    // Fecha o modal imediatamente para dar feedback ao usuário.
    setModalOpen(false);
    setEditingApartment(null);

    if (!savedId) {
      console.error("ID do apartamento salvo não foi retornado. Recarregando a lista completa como fallback.");
      fetchApartamentos();
      return;
    }

    try {
      // Busca o objeto completo e atualizado.
      const fullApartmentData = await apartamentoVistoriaService.getById(savedId);

      // Atualiza o estado local com o objeto completo.
      setApartamentos(prev => {
        const existingIndex = prev.findIndex(apt => apt.idApartamentoVistoria === savedId);

        if (existingIndex > -1) {
          // Atualiza um item existente
          const newApartments = [...prev];
          newApartments[existingIndex] = fullApartmentData;
          return newApartments;
        } else {
          // Adiciona um novo item
          return [fullApartmentData, ...prev];
        }
      });
    } catch (error) {
      console.error("Falha ao buscar dados atualizados do apartamento. Recarregando a lista completa.", error);
      // Se a busca individual falhar, recarrega tudo para não deixar a UI inconsistente.
      fetchApartamentos();
      }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja excluir este registro?")) return;
    try {
      await apartamentoVistoriaService.deletar(id);
      await fetchApartamentos();
    } catch (error) {
      console.error("Erro ao excluir:", error);
      alert("Não foi possível excluir o registro.");
    }
  };

  const toggleObservation = (id: number) => {
    setCollapsedObservations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleExpandCollapseAll = (e: React.MouseEvent, apartmentList: ApartamentoVistoriaDto[], expand: boolean) => {
    e.stopPropagation(); // Evita que o clique propague para o header da data e o feche
    setCollapsedObservations(prev => {
      const newSet = new Set(prev);
      apartmentList.forEach(apt => {
        if (apt.idApartamentoVistoria) {
          // Se a ação for expandir (expand=true), removemos da lista de colapsados.
          // Se a ação for recolher (expand=false), adicionamos à lista de colapsados.
          if (expand) {
            newSet.delete(apt.idApartamentoVistoria);
          } else {
            if (apt.txObservacaoRevistoria) {
              newSet.add(apt.idApartamentoVistoria);
            }
          }
        }
      });
      return newSet;
    });
  };

  // Função auxiliar para normalizar datas (lida com YYYY-MM-DD e DD/MM/YYYY)
  const getNormalizedDate = (apt: any) => {
    const raw = apt.dtVistoria || apt.dtApartamentoVigente || apt.dtRevistoriaVigente;
    if (!raw) return null;
    const s = String(raw);
    if (s.includes('T')) return s.split('T')[0];
    
    if (s.includes('/')) {
      const parts = s.split('/');
      if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return s.substring(0, 10);
  };

 const groupedApartments = useMemo(() => {
    const hoje = new Date();
    // Corrigido para a semana começar na Segunda-feira, comum no Brasil
    const startCur = format(startOfWeek(hoje, { weekStartsOn: 1 }), "yyyy-MM-dd");
    const endCur = format(endOfWeek(hoje, { weekStartsOn: 1 }), "yyyy-MM-dd");

    const proximaSemana = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 7);
    const startNext = format(startOfWeek(proximaSemana, { weekStartsOn: 1 }), "yyyy-MM-dd");
    const endNext = format(endOfWeek(proximaSemana, { weekStartsOn: 1 }), "yyyy-MM-dd");

    const filtered = apartamentos.filter((apt: any) => {
      // Filtro de Nord (comum a todas as abas)
      const nomeApt = apt.nmApartamentoVistoria?.toUpperCase() || "";
      if (filterNord && !nomeApt.startsWith(filterNord === 'Nord 1' ? 'N1' : 'N2')) return false;
      
      const isoDate = getNormalizedDate(apt);

      // Aba "Tudo" mostra todos, sem filtro de data ou status (além do Nord)
      if (activeTab === "all") {
        return true;
      }

      // Para as abas de semana, precisamos de uma data
      if (!isoDate) return false;

      if (activeTab === "current") {
        return isoDate >= startCur && isoDate <= endCur;
      }

      if (activeTab === "next") {
        return isoDate >= startNext && isoDate <= endNext;
      }

      return false; // Não deve acontecer se activeTab for um dos 3 valores
    });

    const groups = filtered.reduce<Record<string, ApartamentoVistoriaDto[]>>((acc, apt: any) => {
      const key = getNormalizedDate(apt) || "Sem Data";
      if (!acc[key]) acc[key] = [];
      acc[key].push(apt);
      return acc;
    }, {});

    // Ordena as chaves para as datas aparecerem na ordem certa (01, 02, 03...)
    const sortedKeys = Object.keys(groups).sort();
    const sortedGroups: Record<string, ApartamentoVistoriaDto[]> = {};
    sortedKeys.forEach(key => {
      sortedGroups[key] = groups[key].sort((a, b) => {
        const timeA = a.nmHorarioVistoria || "";
        const timeB = b.nmHorarioVistoria || "";
        return timeA.localeCompare(timeB);
      });
    });

    return sortedGroups;
  }, [apartamentos, filterNord, activeTab]);

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  const today = format(new Date(), "yyyy-MM-dd");

  const toggleDate = (date: string) => {
    setCollapsedDates(prev => {
      const isPast = date < today;
      const isCurrentTab = activeTab === "current";
      // Se não tiver no estado, assume o padrão (past && current = collapsed)
      const currentCollapsed = prev[date] ?? (isCurrentTab && isPast);
      return { ...prev, [date]: !currentCollapsed };
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4 w-full">
        <div className={`flex flex-wrap items-center gap-4 transition-all duration-300 ${!sidebarOpen ? 'pl-16' : 'pl-0'}`}>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Entregas</h2>
          
          <div className="flex p-1 bg-slate-200/50 rounded-lg border border-slate-200 shadow-sm">
            {["current", "next", "all"].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)} 
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === tab ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"}`}
              >
                {tab === "current" ? "Semana Vigente" : tab === "next" ? "Próxima Semana" : "Tudo"}
              </button>
            ))}
          </div>

          <div className="flex p-1 bg-slate-200/50 rounded-lg border border-slate-200 shadow-sm">
            {["Nord 1", "Nord 2"].map((nord) => (
              <button 
                key={nord}
                onClick={() => setFilterNord(filterNord === nord ? null : nord as any)} 
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${filterNord === nord ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"}`}
              >
                {nord}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={() => { setEditingApartment(null); setModalOpen(true); }} 
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition-all ml-auto"
        >
          <Plus className="w-5 h-5" /> Novo Apartamento
        </button>
      </div>

      <div className="space-y-6">
        {Object.keys(groupedApartments).length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className="font-medium text-slate-500">Nenhum dado encontrado para esta seleção, **Nick**.</p>
          </div>
        ) : (
          Object.entries(groupedApartments).map(([dateKey, list]) => {
            let displayDate = dateKey;
            try {
              const parsed = parseISO(dateKey);
              if (isValid(parsed)) {
                const diaSemana = format(parsed, "EEEE", { locale: ptBR });
                const diaFormatado = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
                displayDate = `${diaFormatado}, ${format(parsed, "dd/MM/yyyy")}`;
              }
            } catch (e) { }

            const count = list.length;
            displayDate += ` (${count} ${count === 1 ? "Entrega" : "Entregas"})`;

            const isPast = dateKey < today;
            const isCurrentTab = activeTab === "current";
            const isCollapsed = collapsedDates[dateKey] ?? (isCurrentTab && isPast);
            const isTranslucent = isCurrentTab && isPast;
            
            const apartmentsWithObs = list.filter(apt => apt.txObservacaoRevistoria);
            const hasObservations = apartmentsWithObs.length > 0;
            const allAreExpanded = hasObservations && apartmentsWithObs.every(apt => !collapsedObservations.has(apt.idApartamentoVistoria!));

            return (
              <section key={dateKey} className={`rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all ${isTranslucent ? "bg-slate-50/80" : "bg-white"}`}>
                <div 
                  className={`flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors ${isTranslucent ? "opacity-60" : ""}`}
                  onClick={() => toggleDate(dateKey)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isTranslucent ? "bg-slate-200 text-slate-500" : "bg-blue-50 text-blue-600"}`}>
                      <Calendar className="w-5 h-5" />
                    </div>
                    <h3 className={`font-bold text-sm sm:text-base ${isTranslucent ? "text-slate-500" : "text-slate-800"}`}>{displayDate}</h3>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4">
                    {hasObservations && !isCollapsed && (
                      <button onClick={(e) => handleExpandCollapseAll(e, list, !allAreExpanded)} className={`flex items-center gap-1.5 text-xs font-bold p-1.5 rounded-md transition-colors ${isTranslucent ? 'text-slate-500 hover:bg-slate-200' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`} title={allAreExpanded ? "Recolher todas" : "Expandir todas"}>
                        {allAreExpanded ? <ChevronsUp className="w-4 h-4" /> : <ChevronsDown className="w-4 h-4" />}
                        <span className="hidden sm:inline">{allAreExpanded ? "Recolher" : "Expandir"}</span>
                      </button>
                    )}
                    {isCollapsed ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronUp className="w-5 h-5 text-slate-400" />}
                  </div>
                </div>
                
                {!isCollapsed && (
                <div className={`p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${isTranslucent ? "opacity-50 grayscale-[0.3]" : ""}`}>
                  {list.map((apt) => (
                    <ApartmentCard 
                      key={apt.idApartamentoVistoria} 
                      apartment={apt} 
                      onEdit={(a) => { setEditingApartment(a); setModalOpen(true); }} 
                      onDelete={handleDelete}
                      isObservationExpanded={!collapsedObservations.has(apt.idApartamentoVistoria!)}
                      onToggleObservation={() => toggleObservation(apt.idApartamentoVistoria!)}
                    />
                  ))}
                </div>
                )}
              </section>
            );
          })
        )}
      </div>

      {modalOpen && (
        <ApartmentModal 
          apartment={editingApartment} 
          onClose={() => { setModalOpen(false); setEditingApartment(null); }} 
          onSave={handleSave} 
        />
      )}
    </div>
  );
}