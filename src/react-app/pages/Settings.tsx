import { useEffect, useState } from "react";
import {
  Settings as SettingsIcon, Save, ChevronDown, ChevronUp,
  Loader2, Building2, Clock, Filter, Database, LayoutDashboard
} from "lucide-react";
import { ControleChavesService, type ObraControleChaves } from "../services/ControleChavesService";
import { lerObraControleChaves, salvarObraControleChaves } from "../utils/preferenciasControleChaves";

const ROTULOS_OBRAS_CONTROLE_CHAVES: Record<string, string> = {
  N1: "Nord 1",
  N2: "Nord 2",
  EN: "Energy",
};

const normalizarIdObraControleChaves = (id: unknown): string =>
  typeof id === "string" && Object.prototype.hasOwnProperty.call(ROTULOS_OBRAS_CONTROLE_CHAVES, id) ? id : "";

export default function SettingsPage() {
  const [apartmentList, setApartmentList] = useState("");
  const [timeSlotsList, setTimeSlotsList] = useState("");
  
  // Novos estados para o Pré-carregamento
  const [activeFilterTab, setActiveFilterTab] = useState<"agenda" | "database">("agenda");
  const [defaultDeliveryCondo, setDefaultDeliveryCondo] = useState("");
  const [defaultDeliveryTime, setDefaultDeliveryTime] = useState("current");
  const [defaultDbCondo, setDefaultDbCondo] = useState("");
  const [defaultDbShowAll, setDefaultDbShowAll] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  
  const [showApartmentList, setShowApartmentList] = useState(false);
  const [showTimeSlotsList, setShowTimeSlotsList] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [defaultDbStatus, setDefaultDbStatus] = useState<string[]>([]);
  const [obrasControleChaves, setObrasControleChaves] = useState<ObraControleChaves[]>([]);
  const [obraControleChaves, setObraControleChaves] = useState<string>(() => lerObraControleChaves());
  const [erroObrasControleChaves, setErroObrasControleChaves] = useState("");
  const [carregandoObrasControleChaves, setCarregandoObrasControleChaves] = useState(true);
  const [tentativaObrasControleChaves, setTentativaObrasControleChaves] = useState(0);

  useEffect(() => {
    const statusSalvos = localStorage.getItem("@NordTool:filter_db_status");
    setDefaultDbStatus(statusSalvos ? JSON.parse(statusSalvos) : ["Agendado", "Pendente"]);
    const fetchSettings = async () => {
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 400)); // Simula o tempo de busca

        setApartmentList(localStorage.getItem("@NordTool:apartamentos") || "101, 102, 201");
        setTimeSlotsList(localStorage.getItem("@NordTool:horarios") || "08:00, 09:00, 10:00");
        
        // Carregando os filtros
        setDefaultDeliveryCondo(localStorage.getItem("@NordTool:filter_del_condo") || "");
        setDefaultDeliveryTime(localStorage.getItem("@NordTool:filter_del_time") || "current");
        setDefaultDbCondo(localStorage.getItem("@NordTool:filter_db_condo") || "");
        setDefaultDbShowAll(localStorage.getItem("@NordTool:filter_db_showall") === "true");

      } catch (error) {
        setMessage("Erro crítico na leitura da fundação.");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setCarregandoObrasControleChaves(true);
    setErroObrasControleChaves("");
    ControleChavesService.listarObras({ signal: controller.signal })
      .then(setObrasControleChaves)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setErroObrasControleChaves(error instanceof Error ? error.message : "Falha ao carregar as obras.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setCarregandoObrasControleChaves(false);
      });
    return () => controller.abort();
  }, [tentativaObrasControleChaves]);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      
      localStorage.setItem("@NordTool:apartamentos", apartmentList);
      localStorage.setItem("@NordTool:horarios", timeSlotsList);
      
      // Salvando os filtros
      localStorage.setItem("@NordTool:filter_del_condo", defaultDeliveryCondo);
      localStorage.setItem("@NordTool:filter_del_time", defaultDeliveryTime);
      localStorage.setItem("@NordTool:filter_db_condo", defaultDbCondo);
      localStorage.setItem("@NordTool:filter_db_showall", String(defaultDbShowAll));
      salvarObraControleChaves(obraControleChaves);

      setMessage("Parâmetros fixados com sucesso!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("Erro ao salvar os dados.");
    } finally {
      setSaving(false);
    }
    localStorage.setItem("@NordTool:filter_db_status", JSON.stringify(defaultDbStatus));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl animate-in fade-in zoom-in-95 duration-500 mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <SettingsIcon className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-800">
            Configurações Globais
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Ajuste os parâmetros do sistema para todas as frentes de serviço
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-2 overflow-hidden">
        <div className="p-6 md:p-8 space-y-6">

          <section className="border border-emerald-200 rounded-2xl bg-emerald-50/30 p-5 shadow-sm" aria-labelledby="config-controle-chaves">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <h3 id="config-controle-chaves" className="text-lg font-bold text-slate-800">Controle de Chaves</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Obra aplicada ao Dashboard, retiradas recentes e Histórico.</p>
                </div>
                <label htmlFor="obra-controle-chaves" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Obra/Condomínio</label>
                <select
                  id="obra-controle-chaves"
                  value={normalizarIdObraControleChaves(obraControleChaves)}
                  onChange={(event) => setObraControleChaves(event.target.value)}
                  disabled={carregandoObrasControleChaves || !!erroObrasControleChaves}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none shadow-sm disabled:opacity-60"
                >
                  <option value="">Todas as obras</option>
                  {obrasControleChaves
                    .map((obra) => normalizarIdObraControleChaves(obra.id))
                    .filter(Boolean)
                    .map((idObra) => (
                      <option key={idObra} value={idObra}>{ROTULOS_OBRAS_CONTROLE_CHAVES[idObra]}</option>
                    ))}
                </select>
                {carregandoObrasControleChaves && <p className="text-sm text-slate-500">Carregando obras...</p>}
                {erroObrasControleChaves && (
                  <div role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    <span>{erroObrasControleChaves}</span>
                    <button type="button" onClick={() => setTentativaObrasControleChaves((valor) => valor + 1)} className="shrink-0 font-semibold underline">Tentar novamente</button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* SESSÃO DE PRÉ-CARREGAMENTO (FILTROS) */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
            <button
              onClick={() => setShowFilters((prev) => !prev)}
              className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-purple-100/50 text-purple-600 rounded-xl">
                  <Filter className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-slate-800">
                    Pré-carregamento de Filtros
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Defina o que o sistema deve carregar automaticamente ao abrir cada tela
                  </p>
                </div>
              </div>
              <div className="p-2 hover:bg-slate-200/50 rounded-full transition-colors">
                {showFilters ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
              </div>
            </button>

            {showFilters && (
              <div className="p-5 pt-0 border-t border-slate-100 bg-slate-50/30">
                {/* Abas de Seleção */}
                <div className="flex p-1 bg-slate-200/50 rounded-xl border border-slate-200 w-max mb-6 mt-4">
                  <button 
                    onClick={() => setActiveFilterTab("agenda")}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeFilterTab === "agenda" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    <LayoutDashboard className="w-4 h-4" /> Agenda (Entregas)
                  </button>
                  <button 
                    onClick={() => setActiveFilterTab("database")}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeFilterTab === "database" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    <Database className="w-4 h-4" /> Banco de Dados
                  </button>
                </div>

                {/* Conteúdo: AGENDA */}
                {activeFilterTab === "agenda" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-left-2 duration-300">
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Obra/Condomínio Padrão</label>
                      <select 
                        value={defaultDeliveryCondo} 
                        onChange={(e) => setDefaultDeliveryCondo(e.target.value)}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 outline-none shadow-sm"
                      >
                        <option value="">Nenhum (Mostrar Todos)</option>
                        <option value="Nord 1">Nord 1</option>
                        <option value="Nord 2">Nord 2</option>
                        <option value="Energy">Energy</option>
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Período Padrão</label>
                      <select 
                        value={defaultDeliveryTime} 
                        onChange={(e) => setDefaultDeliveryTime(e.target.value)}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 outline-none shadow-sm"
                      >
                        <option value="current">Semana Vigente</option>
                        <option value="next">Próxima Semana</option>
                        <option value="all">Tudo</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Conteúdo: BANCO DE DADOS */}
                {activeFilterTab === "database" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Obra/Condomínio Padrão</label>
                        <select value={defaultDbCondo} onChange={(e) => setDefaultDbCondo(e.target.value)} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none shadow-sm">
                          <option value="">Nenhum (Todos)</option>
                          <option value="N1">Nord 1</option>
                          <option value="N2">Nord 2</option>
                          <option value="EN">Energy</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status carregados automaticamente</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200">
                        {["Agendado", "Aprovado", "Reprovado", "Pendente", "Liberado","Aprovado DAT","Pendente DAT"].map((status) => (
                          <label key={status} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded-lg">
                            <input 
                              type="checkbox" 
                              checked={defaultDbStatus.includes(status)}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setDefaultDbStatus(prev => checked ? [...prev, status] : prev.filter(s => s !== status));
                              }}
                              className="rounded text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-slate-700">{status}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                </div>
              )}
          </div>

          {/* SESSÃO DE HORÁRIOS */}
          <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50 hover:bg-slate-50 transition-colors">
            <button onClick={() => setShowTimeSlotsList((prev) => !prev)} className="w-full flex items-center justify-between p-5">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-blue-100/50 text-blue-600 rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-slate-800">Grade de Horários</h3>
                </div>
              </div>
              <div className="p-2 hover:bg-slate-200/50 rounded-full transition-colors">
                {showTimeSlotsList ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
              </div>
            </button>

            {showTimeSlotsList && (
              <div className="p-5 pt-0">
                <textarea value={timeSlotsList} onChange={(e) => setTimeSlotsList(e.target.value)} rows={2} className="w-full p-4 bg-white border border-slate-200 rounded-xl outline-none resize-none font-mono text-sm" />
              </div>
            )}
          </div>

          {/* SESSÃO DE APARTAMENTOS */}
          <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50 hover:bg-slate-50 transition-colors">
            <button onClick={() => setShowApartmentList((prev) => !prev)} className="w-full flex items-center justify-between p-5">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-indigo-100/50 text-indigo-600 rounded-xl">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-slate-800">Mapeamento de Unidades</h3>
                </div>
              </div>
              <div className="p-2 hover:bg-slate-200/50 rounded-full transition-colors">
                {showApartmentList ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
              </div>
            </button>

            {showApartmentList && (
              <div className="p-5 pt-0">
                <textarea value={apartmentList} onChange={(e) => setApartmentList(e.target.value)} rows={3} className="w-full p-4 bg-white border border-slate-200 rounded-xl outline-none resize-none font-mono text-sm" />
              </div>
            )}
          </div>

        </div>
        
        {/* RODAPÉ */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex-1">
            {message && (
              <span className={`text-sm font-bold px-4 py-2 rounded-lg ${message.includes("sucesso") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {message}
              </span>
            )}
          </div>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 active:scale-95 transition-all">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? "Registrando..." : "Salvar Parâmetros"}
          </button>
        </div>
      </div>
    </div>
  );
}
