import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, XCircle, Clock, Home, Loader2, AlertCircle, RotateCcw, CalendarDays } from "lucide-react";
import type { DashboardStats } from "@/shared/types";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCondo, setSelectedCondo] = useState<string>(""); 

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (selectedCondo) params.append("condo", selectedCondo);

      const response = await fetch(`/api/dashboard?${params.toString()}`);
      const json = await response.json();
      // Backend uses ApiResponseBody wrapper: { timestamp, nrStatus, body, txMensagem }
      const payload = json?.body ?? json;

      // Validate payload shape minimally
      if (!payload || typeof payload !== "object") {
        throw new Error("Resposta do dashboard inválida");
      }

      setStats(payload as DashboardStats);
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
      setStats(null);
      setError(error instanceof Error ? error.message : "Não foi possível carregar os dados do Dashboard.");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, selectedCondo]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const toggleCondoFilter = (value: string) => {
    setSelectedCondo(prev => prev === value ? "" : value);
  };

  const handleSetToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    setEndDate(today);
  };

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
    setSelectedCondo("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <AlertCircle className="mx-auto mb-4 h-10 w-10 text-red-500" />
          <h2 className="text-xl font-bold text-slate-800">Não foi possível carregar o Dashboard</h2>
          <p className="mt-2 text-sm text-slate-500">{error ?? "Os dados retornados são inválidos."}</p>
          <button
            type="button"
            onClick={fetchStats}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
          >
            <RotateCcw className="h-4 w-4" /> Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  // Cálculos baseados no retorno da API
  // Quando selectedCondo está ativo, a API deve retornar apenas os dados de N1 ou N2
  const vitoriadasTotal = (stats.aprovados || 0) + (stats.reprovados || 0) + (stats.pendentes || 0);
  const aprovadasGeral = (stats.aprovados || 0) + (stats.pendentes || 0);
  const totalLiberadoObra = (stats.agendados || 0) + (stats.liberados || 0) + vitoriadasTotal;

  const indicators = [
    { label: "Não Liberados", value: stats.nao_liberados, icon: AlertCircle, color: "from-orange-500 to-orange-600", bgColor: "bg-orange-50", textColor: "text-orange-700" },
    { label: "Agendados", value: stats.agendados, icon: Clock, color: "from-purple-500 to-purple-600", bgColor: "bg-purple-50", textColor: "text-purple-700" },
    { label: "Liberados", value: stats.liberados, icon: Home, color: "from-blue-500 to-blue-600", bgColor: "bg-blue-50", textColor: "text-blue-700" },
    { label: "Aprovados", value: stats.aprovados, icon: CheckCircle2, color: "from-green-500 to-green-600", bgColor: "bg-green-50", textColor: "text-green-700" },
    { label: "Reprovados", value: stats.reprovados, icon: XCircle, color: "from-red-500 to-red-600", bgColor: "bg-red-50", textColor: "text-red-700" },
    { label: "Pendentes", value: stats.pendentes, icon: Clock, color: "from-yellow-500 to-yellow-600", bgColor: "bg-yellow-50", textColor: "text-yellow-700" },
  ];

  const getPercentage = (value: number) => {
    return stats.total > 0 ? ((value / stats.total) * 100).toFixed(1) : "0.0";
  };

  return (
    <div className="p-8">
      {/* Botões Nord - Lógica idêntica às Entregas */}
      <div className="flex items-center gap-6 mb-8">
        <h2 className="text-3xl font-bold text-slate-800">Dashboard</h2>
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button 
            onClick={() => toggleCondoFilter("N1")} 
            className={`px-6 py-1.5 rounded-md text-sm font-bold transition-all ${selectedCondo === "N1" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Nord 1
          </button>
          <button 
            onClick={() => toggleCondoFilter("N2")} 
            className={`px-6 py-1.5 rounded-md text-sm font-bold transition-all ${selectedCondo === "N2" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Nord 2
          </button>
        </div>
      </div>
      
      <div className="flex flex-col xl:flex-row gap-8 mb-8">
        {/* Filtros de Data */}
        <div className="bg-white rounded-xl shadow-md p-6 flex flex-1 flex-col items-center justify-center gap-4">
          <div className="flex gap-6">
            <div className="flex flex-col">
              <label className="text-xs font-bold text-slate-400 uppercase mb-1">Data inicial</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-bold text-slate-400 uppercase mb-1">Data final</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSetToday} className="flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-200">
              <CalendarDays className="w-4 h-4" /> Hoje
            </button>
            <button onClick={handleClearFilters} className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-100 border border-red-100">
              <RotateCcw className="w-4 h-4" /> Limpar
            </button>
          </div>
        </div>

        {/* Sumário Executivo Atualizado para o Filtro Ativo */}
        <div className="bg-white rounded-xl shadow-md border border-slate-100 p-6 min-w-[380px]">
          <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 border-b border-slate-50 pb-2">RESUMO GERAL {selectedCondo ? `(${selectedCondo})` : "(TODOS)"}</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600 font-medium">Liberadas pela obra:</span>
              <span className="text-blue-600 font-bold text-xl">{totalLiberadoObra}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600 font-medium">Unidades vistoriadas:</span>
              <span className="text-slate-900 font-bold text-xl">{vitoriadasTotal}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600 font-medium">Unidades aprovadas:</span>
              <span className="text-green-600 font-bold text-xl">{aprovadasGeral}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600 font-medium">Unidades reprovadas:</span>
              <span className="text-red-600 font-bold text-xl">{stats.reprovados}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
        {indicators.map((indicator) => (
          <div key={indicator.label} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${indicator.bgColor}`}>
                <indicator.icon className={`w-6 h-6 ${indicator.textColor}`} />
              </div>
              <span className={`text-xs font-semibold ${indicator.textColor}`}>{getPercentage(indicator.value)}%</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-1">{indicator.value}</h3>
            <p className="text-sm text-slate-600">{indicator.label}</p>
          </div>
        ))}
      </div>

      {/* Tabela de Resumo Detalhado */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-100">
        <div className="p-6 bg-slate-50 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-800">Resumo Detalhado {selectedCondo ? `(${selectedCondo})` : "(Todos)"}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Indicador</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Quantidade</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Porcentagem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 text-sm font-semibold text-slate-800">Total de Apartamentos</td>
                <td className="px-6 py-4 text-sm font-bold text-slate-900">{stats.total}</td>
                <td className="px-6 py-4 text-sm text-slate-500">100%</td>
              </tr>
              {indicators.map((indicator) => (
                <tr key={indicator.label} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium">{indicator.label}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-800">{indicator.value}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-slate-100 rounded-full h-1.5 max-w-[160px]">
                        <div className={`h-1.5 rounded-full bg-gradient-to-r ${indicator.color}`} style={{ width: `${getPercentage(indicator.value)}%` }} />
                      </div>
                      <span className="text-xs font-bold text-slate-600">{getPercentage(indicator.value)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
