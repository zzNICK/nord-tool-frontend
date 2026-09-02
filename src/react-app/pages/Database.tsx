import { useEffect, useMemo, useRef, useState, Fragment } from "react";
import { useOutletContext } from "react-router";
import {
  Loader2,
  Edit2,
  Trash2,
  Search,
  RotateCcw,
  Filter,
  ArrowUpDown,
  FileSpreadsheet,
  ChevronDown,
  Upload,
  Download
} from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import * as XLSX from "xlsx";

import ApartmentModal from "@/react-app/components/ApartmentModal";
import { apartamentoVistoriaService } from "@/react-app/services/ApartamentoVistoriaService";
import type { ApartamentoVistoriaDto } from "@/shared/types";

import MassUpdateModal from "@/react-app/components/MassUpdateModal";
import { ClipboardPaste } from "lucide-react";

export default function DatabasePage() {
  const outletContext = useOutletContext<{ sidebarOpen: boolean }>();
  const sidebarOpen = outletContext?.sidebarOpen ?? false;
  const [apartamentos, setApartamentos] = useState<ApartamentoVistoriaDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApartment, setSelectedApartment] = useState<ApartamentoVistoriaDto | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const [nordSelecionado, setNordSelecionado] = useState<"N1" | "N2" | "EN" | null>(null);
  const [showExcelMenu, setShowExcelMenu] = useState(false);
  const [expandedObsId, setExpandedObsId] = useState<number | null>(null);
  const [colFilters, setColFilters] = useState(() => {
  const savedStatus = localStorage.getItem("@NordTool:filter_db_status");
        return {
      apartamento: "",
      status: savedStatus ? JSON.parse(savedStatus) : ["Agendado", "Pendente"],
      data: "",
      horario: ""
    };
  });
  const [visibleFilters, setVisibleFilters] = useState({ apartamento: false, status: false, data: false, horario: false });
  const [sortConfig, setSortConfig] = useState<{ key: keyof ApartamentoVistoriaDto | null, direction: 'asc' | 'desc' }>({ key: 'dtApartamentoVigente', direction: 'asc' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [showMassUpdateModal, setShowMassUpdateModal] = useState(false);

  useEffect(() => {
    const syncSettings = () => {
      // 1. Lê a obra (Condomínio)
      const savedCondo = localStorage.getItem("@NordTool:filter_db_condo"); // Valor deve ser "Nord 1", "Nord 2" ou "Energy"
      
      // 2. Lê os status selecionados
      const savedStatus = JSON.parse(localStorage.getItem("@NordTool:filter_db_status") || '["Agendado", "Pendente"]');

      // 3. Aplica os filtros
      setNordSelecionado(savedCondo as "N1" | "N2" | "EN" | null);
      setColFilters(prev => ({ ...prev, status: savedStatus }));
    };

    syncSettings();
    fetchApartamentos();
  }, []);

  const fetchApartamentos = async () => {
    setLoading(true);
    try {
      const data = await apartamentoVistoriaService.listar();
      setApartamentos(data || []);
    } catch (error) {
      console.error("Erro ao carregar:", error);
    } finally {
      setLoading(false);
    }
  };

  /* =======================
      HELPERS
  ======================= */
  const formatarDataParaBusca = (dateValue?: string | null): string => {
    if (!dateValue) return "";
    try {
      let cleanDate = String(dateValue).split('T')[0];
      if (cleanDate.includes('/')) {
        const parts = cleanDate.split('/');
        if (parts.length === 3) cleanDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      const date = parseISO(cleanDate);
      return isValid(date) ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "";
    } catch {
      return "";
    }
  };

  const formatarDataExibicao = (dateValue?: string | null, diaSemana?: string | null) => {
    const formattedDate = formatarDataParaBusca(dateValue);
    if (formattedDate) {
      return diaSemana && diaSemana !== "Sem agendamento" ? `${formattedDate} - ${diaSemana}` : formattedDate;
    }
    return diaSemana || "Sem agendamento";
  };

  const handleDownloadTemplate = () => {
    const header = [
      {
        "nmApartamentoVistoria": "N1-01-0101",
        "nmStatusVistoria": "Agendado",
        "dtApartamentoVistoria": new Date("2026-02-18T12:00:00Z"),
        "nmHorarioVistoria": "14:00",
        "nmObservacaoVistoria": "Exemplo de preenchimento"
      }
    ];
    const ws = XLSX.utils.json_to_sheet(header, { cellDates: true });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Modelo_Importacao");
    XLSX.writeFile(wb, "NordTool_Modelo_Importacao.xlsx");
    setShowExcelMenu(false);
  };

  const handleExportData = () => {
    const dadosParaExportar = filteredApartamentos.map(apt => ({
      "Apartamento": apt.nmApartamentoVistoria,
      "Status": apt.nmStatusVistoria,
      "Data": formatarDataParaBusca(apt.dtApartamentoVigente),
      "Dia da Semana": apt.nmDiaSemana,
      "Horário": apt.nmHorarioVistoria || "--:--",
      "Observação": apt.txObservacaoRevistoria || ""
    }));

    const ws = XLSX.utils.json_to_sheet(dadosParaExportar);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dados_Vistoria");
    XLSX.writeFile(wb, `NordTool_Export_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);
    setShowExcelMenu(false);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("Arquivo selecionado para importação:", file.name, file.type, file.size);

    setLoading(true);
    try {
      await apartamentoVistoriaService.importar(file);
      await fetchApartamentos();
      setShowExcelMenu(false);
      alert("Planilha importada com sucesso!");
    } catch (error: any) {
      console.error("Erro na importação:", error);
      alert(`Falha na importação: ${error.message || "Erro desconhecido"}`);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  /* =======================
      ACTIONS
  ======================= */
  const handleEdit = (apt: ApartamentoVistoriaDto) => {
    setSelectedApartment(apt);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja excluir este registro?")) return;
    try {
      await apartamentoVistoriaService.deletar(id);
      setApartamentos(prev => prev.filter(apt => apt.idApartamentoVistoria !== id));
    } catch (error) {
      console.error("Erro ao excluir:", error);
      alert("Não foi possível excluir o registro.");
    }
  };

  // Correção Cirúrgica: Atualiza localmente a linha editada mantendo a posição e estados
  const fetchApartamentosSilencioso = async () => {
    try {
      const data = await apartamentoVistoriaService.listar();
      setApartamentos(data || []);
    } catch (error) {
      console.error("Erro na atualização silenciosa:", error);
    }
  };

  const handleSaveApartment = async () => {
    setShowModal(false);
    setSelectedApartment(null);
    await fetchApartamentosSilencioso();
  };

  const toggleFilter = (key: keyof typeof visibleFilters) => {
    setVisibleFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSort = (key: keyof ApartamentoVistoriaDto) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  /* =======================
      FILTER & SORT LOGIC
  ======================= */
  const filteredApartamentos = useMemo(() => {
    const hiddenStatus = "não liberado";
    
    let result = apartamentos.filter((apt) => {
      const statusApt = apt.nmStatusVistoria?.toLowerCase() || "";
      const dataFormatada = formatarDataParaBusca(apt.dtApartamentoVigente);

      if (!mostrarTodos && statusApt.includes(hiddenStatus)) return false;
      if (nordSelecionado) {
        const nome = apt.nmApartamentoVistoria?.toUpperCase() || "";
        if (!nome.startsWith(nordSelecionado)) return false;
      }

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const searchFields = [
            apt.nmApartamentoVistoria, 
            apt.nmStatusVistoria, 
            dataFormatada,
            apt.nmHorarioVistoria,
            apt.txObservacaoRevistoria
        ].map(v => v?.toLowerCase() || "").join(" ");
        if (!searchFields.includes(term)) return false;
      }
      
      if (colFilters.apartamento && !apt.nmApartamentoVistoria?.toLowerCase().includes(colFilters.apartamento.toLowerCase())) return false;
      if (colFilters.status.length > 0 && !colFilters.status.some((s: string) => statusApt.includes(s.toLowerCase()))) return false;
      
      if (colFilters.data) {
        let dataApt = apt.dtApartamentoVigente || "";
        try {
          let clean = String(dataApt).split('T')[0];
          if (clean.includes('/')) {
            const [d, m, y] = clean.split('/');
            clean = `${y}-${m}-${d}`;
          }
          const parsed = parseISO(clean);
          if (isValid(parsed)) {
            dataApt = format(parsed, "yyyy-MM-dd");
          } else {
            dataApt = clean;
          }
        } catch { }
        
        if (dataApt !== colFilters.data) return false;
      }
      
      if (colFilters.horario && !apt.nmHorarioVistoria?.toLowerCase().includes(colFilters.horario.toLowerCase())) return false;
      return true;
    });

    if (sortConfig.key) {
      result.sort((a, b) => {
        // Tratamento exclusivo e lógico para a coluna de datas
        if (sortConfig.key === 'dtApartamentoVigente') {
          const dateA = a.dtApartamentoVigente;
          const dateB = b.dtApartamentoVigente;

          // Os "sem agendamento" sempre vão para o final
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;

          // Converte qualquer data para YYYY-MM-DD, blindando contra o fuso americano
          const normalizarData = (d: any) => {
            let clean = String(d).split('T')[0];
            if (clean.includes('/')) {
              const parts = clean.split('/');
              if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
            return clean;
          };

          const strA = normalizarData(dateA);
          const strB = normalizarData(dateB);

          if (strA === strB) {
            const horaA = String(a.nmHorarioVistoria || "").toLowerCase();
            const horaB = String(b.nmHorarioVistoria || "").toLowerCase();
            return horaA.localeCompare(horaB) * (sortConfig.direction === 'asc' ? 1 : -1);
          }

          return strA.localeCompare(strB) * (sortConfig.direction === 'asc' ? 1 : -1);
        }

        // Lógica padrão para as outras colunas de texto
        const valA = String(a[sortConfig.key!] || "").toLowerCase();
        const valB = String(b[sortConfig.key!] || "").toLowerCase();

        if (valA === valB) return 0;
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      result.sort((a, b) => (a.nmApartamentoVistoria || "").localeCompare(b.nmApartamentoVistoria || ""));
    }

    return result;
  }, [apartamentos, searchTerm, mostrarTodos, nordSelecionado, colFilters, sortConfig]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-nowrap">
        <div className={`flex items-center gap-4 shrink-0 transition-all duration-300 ${!sidebarOpen ? 'pl-16' : 'pl-0'}`}>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Banco de Dados</h2>
          <div className="flex p-1 bg-slate-200/50 rounded-lg border border-slate-200">
            <button onClick={() => setNordSelecionado(nordSelecionado === "N1" ? null : "N1")} className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${nordSelecionado === "N1" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"}`}>Nord 1</button>
            <button onClick={() => setNordSelecionado(nordSelecionado === "N2" ? null : "N2")} className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${nordSelecionado === "N2" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"}`}>Nord 2</button>
            <button onClick={() => setNordSelecionado(nordSelecionado === "EN" ? null : "EN")} className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${nordSelecionado === "EN" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"}`}>Energy</button>
          </div>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Busca global (ex: 18/02)..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm" />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setMostrarTodos(!mostrarTodos)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${mostrarTodos ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'}`}>{mostrarTodos ? "Ocultando" : "Mostrar Todos"}</button>
          
          <button onClick={() => { 
            setSearchTerm(""); 
            setNordSelecionado(null); 
            setColFilters({apartamento:"", status: [], data:"", horario: ""}); 
            setVisibleFilters({apartamento:false, status:false, data:false, horario: false});
            setSortConfig({ key: null, direction: 'asc' });
          }} className="p-2 text-red-600 bg-white border border-slate-200 rounded-xl hover:bg-red-50 shadow-sm"><RotateCcw className="w-4 h-4" /></button>
          
          <div className="relative" ref={menuRef}>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImportExcel} 
              accept=".xlsx, .xls" 
              className="hidden" 
            />
            <button onClick={() => setShowExcelMenu(!showExcelMenu)} className="p-2 bg-green-600 text-white rounded-xl hover:bg-green-700 shadow-sm transition-all flex items-center gap-1">
              <FileSpreadsheet className="w-4 h-4" />
              <ChevronDown className={`w-3 h-3 transition-transform ${showExcelMenu ? 'rotate-180' : ''}`} />
            </button>

            {showExcelMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                <button 
                  onClick={handleImportClick}
                  className="flex items-center gap-3 w-full px-4 py-3 text-xs text-slate-700 hover:bg-slate-50 border-b border-slate-100"
                >
                  <Upload className="w-4 h-4 text-blue-500" /> Importar planilha
                </button>
                <button 
                  onClick={handleExportData}
                  className="flex items-center gap-3 w-full px-4 py-3 text-xs text-slate-700 hover:bg-slate-50 border-b border-slate-100"
                >
                  <Download className="w-4 h-4 text-green-500" /> Exportar planilha
                </button>
                <button 
                  onClick={handleDownloadTemplate} 
                  className="flex items-center gap-3 w-full px-4 py-3 text-xs text-slate-700 hover:bg-slate-50"
                >
                  <FileSpreadsheet className="w-4 h-4 text-amber-500" /> Planilha modelo
                </button>
                <button 
                  onClick={() => setShowMassUpdateModal(true)}
                  className="flex items-center gap-3 w-full px-4 py-3 text-xs text-slate-700 hover:bg-slate-50 border-b border-slate-100"
                >
                  <ClipboardPaste className="w-4 h-4 text-purple-500" /> Atualizar agenda
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="w-12 px-4 py-4 text-center border-r border-slate-100"><input type="checkbox" className="rounded text-blue-600" /></th>
                <th className="px-4 py-4 text-left min-w-[150px]">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleFilter('apartamento')} className="text-xs font-bold text-slate-400 uppercase tracking-wider hover:text-blue-500 flex items-center gap-1">
                        Apartamento <Filter className="w-3 h-3" />
                      </button>
                      <button onClick={() => handleSort('nmApartamentoVistoria')}><ArrowUpDown className="w-3 h-3 text-slate-400" /></button>
                    </div>
                    {visibleFilters.apartamento && <input type="text" autoFocus placeholder="Filtrar..." value={colFilters.apartamento} onChange={(e) => setColFilters({...colFilters, apartamento: e.target.value})} className="text-[10px] p-1 border rounded" />}
                  </div>
                </th>
                <th className="px-4 py-4 text-left min-w-[120px]">
                  <div className="flex flex-col gap-2 relative">
                    <button onClick={() => toggleFilter('status')} className="text-xs font-bold text-slate-400 uppercase tracking-wider hover:text-blue-500 flex items-center gap-1">Status <Filter className="w-3 h-3" /></button>
                    {visibleFilters.status && (
                        <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-50 min-w-[160px] flex flex-col gap-2">
                          {["Agendado", "Aprovado", "Aprovado DAT", "Reprovado", "Liberado", "Não Liberado", "Pendente", "Pendente DAT"].map((opt) => (
                            <label key={opt} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded">
                              <input 
                                type="checkbox"
                                checked={colFilters.status.includes(opt)}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setColFilters(prev => ({
                                    ...prev,
                                    status: checked ? [...prev.status, opt] : prev.status.filter((s: string) => s !== opt)
                                  }));
                                }}
                                className="rounded text-blue-600 focus:ring-blue-500 w-3 h-3"
                              />
                              <span className="text-xs text-slate-700 font-medium">{opt}</span>
                            </label>
                          ))}
                        </div>
                    )}
                  </div>
                </th>
                <th className="px-4 py-4 text-left min-w-[140px]">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleFilter('data')} className="text-xs font-bold text-slate-400 uppercase tracking-wider hover:text-blue-500 flex items-center gap-1">Data <Filter className="w-3 h-3" /></button>
                      <button onClick={() => handleSort('dtApartamentoVigente')}><ArrowUpDown className="w-3 h-3 text-slate-400" /></button>
                    </div>
                    {visibleFilters.data && <input type="date" value={colFilters.data} onChange={(e) => setColFilters({...colFilters, data: e.target.value})} className="text-[10px] p-1 border rounded" />}
                  </div>
                </th>
                <th className="px-4 py-4 text-left min-w-[120px] text-xs font-bold text-slate-400 uppercase tracking-wider">Horário</th>
                <th className="px-4 py-4 text-left min-w-[150px] text-xs font-bold text-slate-400 uppercase tracking-wider">Observação</th>
                <th className="px-4 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider w-24">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" /></td></tr>
              ) : (
                filteredApartamentos.map((apt) => {
                  const status = apt.nmStatusVistoria?.toLowerCase() || "";
                  let statusClasses = "bg-blue-50 text-blue-600";
                  if (status.includes('aprovado')) statusClasses = "bg-green-50 text-green-700";
                  if (status.includes('reprovado')) statusClasses = "bg-red-50 text-red-700";
                  if (status.includes('agendado')) statusClasses = "bg-slate-100 text-slate-600";
                  if (status.includes('não liberado')) statusClasses = "bg-slate-900 text-white";
                  if (status.includes('pendente')) statusClasses = "bg-yellow-50 text-yellow-700";

                  return (
                    <Fragment key={apt.idApartamentoVistoria}>
                      <tr className={`hover:bg-slate-50/50 transition-colors group ${expandedObsId === apt.idApartamentoVistoria ? 'bg-slate-50' : ''}`}>
                        <td className="px-4 py-4 text-center border-r border-slate-50"><input type="checkbox" className="rounded text-blue-600" /></td>
                        <td className="px-4 py-4 text-sm font-bold text-slate-700">{apt.nmApartamentoVistoria}</td>
                        <td className="px-4 py-4 text-xs font-bold uppercase">
                          <span className={`px-2.5 py-1 rounded-full ${statusClasses}`}>
                            {apt.nmStatusVistoria}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600 font-medium">{formatarDataExibicao(apt.dtApartamentoVigente, apt.nmDiaSemana)}</td>
                        <td className="px-4 py-4 text-sm text-slate-400 font-medium">{apt.nmHorarioVistoria || "--:--"}</td>
                        <td 
                          className="px-4 py-4 text-sm text-slate-500 cursor-pointer hover:bg-slate-100 transition-all max-w-[200px]"
                          onClick={() => setExpandedObsId(expandedObsId === apt.idApartamentoVistoria ? null : apt.idApartamentoVistoria)}
                        >
                          <div className="truncate">
                            {apt.txObservacaoRevistoria || "-"}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(apt)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete(apt.idApartamentoVistoria)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Sub-linha que expande ocupando toda a largura */}
                      {expandedObsId === apt.idApartamentoVistoria && apt.txObservacaoRevistoria && (
                        <tr>
                          <td colSpan={7} className="px-8 py-4 bg-blue-50/30 border-b border-slate-200 shadow-inner">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Observações Completas</div>
                            <div className="text-sm text-slate-700 whitespace-pre-wrap break-words leading-relaxed">
                              {apt.txObservacaoRevistoria}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <ApartmentModal
          apartment={selectedApartment}
          onClose={() => { setShowModal(false); setSelectedApartment(null); }}
          onSave={handleSaveApartment}
        />
      )}

      {showMassUpdateModal && (
        <MassUpdateModal
          onClose={() => setShowMassUpdateModal(false)}
          onProcess={async (agendamentos) => {
            setLoading(true);
            try {
              // Prepara o payload para garantir compatibilidade total com o seu Form do Java
              const payload = agendamentos.map(item => ({
                nmApartamentoVistoria: item.nmApartamentoVistoria,
                dtApartamentoVigente: item.dtApartamentoVigente,
                nmHorarioVistoria: item.nmHorarioVistoria,
                idDiaSemana: 1,
                idStatusVistoria: 1
              }));

              console.log("Enviando para o backend:", JSON.stringify(payload));

              const response = await fetch("http://localhost:8080/api/v1/nord-tool/apartamentoVistoria/atualizar-agenda-massa", {
                method: "POST",
                headers: { 
                  "Content-Type": "application/json" 
                },
                body: JSON.stringify(payload)
              });

              if (response.ok) {
                alert("Agenda atualizada com sucesso!");
                if (typeof fetchApartamentosSilencioso === 'function') {
                  await fetchApartamentosSilencioso();
                }
              } else {
                const erro = await response.text();
                console.error("Erro do servidor:", erro);
                alert("Erro ao atualizar: " + erro);
              }
            } catch (err) {
              console.error("Falha na requisição:", err);
              alert("Falha de conexão com o servidor.");
            } finally {
              setLoading(false);
              setShowMassUpdateModal(false);
            }
          }}
        />
      )}
    </div>
  );
}