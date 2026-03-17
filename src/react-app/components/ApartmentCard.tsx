import {
  Edit2,
  Trash2,
  Calendar,
  Clock,
  Home,
  ClipboardCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ApartamentoVistoriaDto } from "@/shared/types";

interface ApartmentCardProps {
  apartment: ApartamentoVistoriaDto;
  onEdit: (apartment: ApartamentoVistoriaDto) => void;
  onDelete: (id: number) => void;
  isObservationExpanded?: boolean;
  onToggleObservation?: () => void;
}

export default function ApartmentCard({
  apartment,
  onEdit,
  onDelete,
  isObservationExpanded,
  onToggleObservation,
}: ApartmentCardProps) {
  // Nick, aqui está o segredo: desestruturamos incluindo o dtVistoria do banco
  const {
    idApartamentoVistoria,
    nmApartamentoVistoria,
    nmDiaSemana,
    dtVistoria, // Campo real do banco
    dtApartamentoVigente,
    nmHorarioVistoria,
    nmStatusVistoria,
    dtRevistoriaVigente,
    inMarcarRevistoria,
    txObservacaoRevistoria,
  } = apartment;

  // Lugia: Proteção contra status nulo para não explodir o toLowerCase()
  const statusKey = (nmStatusVistoria || "pendente")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "liberado":
        return "from-blue-500 to-blue-600";
      case "aprovado":
        return "from-green-500 to-green-600";
      case "reprovado":
        return "from-red-500 to-red-600";
      case "pendente":
        return "from-yellow-500 to-yellow-600";
      case "agendado":
        return "from-purple-500 to-purple-600";
      default:
        return "from-slate-500 to-slate-600";
    }
  };

  // Prioridade de exibição da data: Revistoria > Vistoria do Banco > Vigente
  const dataExibicao = dtRevistoriaVigente || dtVistoria || dtApartamentoVigente;

  const formatDate = (dateValue?: string | null) => {
    if (!dateValue) return "-";
    
    try {
      // Nick, o parseISO lida melhor com as strings que vem do banco (YYYY-MM-DD...)
      let cleanDate = dateValue.split('T')[0];
      
      // Se vier DD/MM/YYYY, converte para YYYY-MM-DD para o parseISO entender
      if (cleanDate.includes('/')) {
        const parts = cleanDate.split('/');
        if (parts.length === 3) cleanDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }

      const date = parseISO(cleanDate);
      
      return isValid(date) 
        ? format(date, "dd/MM/yyyy", { locale: ptBR }) 
        : "-";
    } catch {
      return "-";
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-slate-100">
      {/* Header */}
      <div
        className={`bg-gradient-to-r ${getStatusColor(
          statusKey
        )} px-6 py-4`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Home className="w-5 h-5" />
            <h3 className="text-lg font-bold">{nmApartamentoVistoria || "Sem Identificação"}</h3>
          </div>

          <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
            {nmStatusVistoria || "Pendente"}
          </span>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3 text-slate-700">
          <Calendar className="w-5 h-5 text-slate-400" />
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Data e Dia</p>
            <p className="font-semibold text-sm">
              {nmDiaSemana || "Dia não inf."} - {formatDate(dataExibicao)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-slate-700">
          <Clock className="w-5 h-5 text-slate-400" />
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Horário</p>
            <p className="font-semibold text-sm">{nmHorarioVistoria || "--:--"}</p>
          </div>
        </div>

        {dtRevistoriaVigente && (
          <div className="flex items-center gap-3 text-slate-700 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
            <ClipboardCheck className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-[10px] font-bold text-blue-400 uppercase mb-1">Revistoria</p>
              <p className="text-xs font-bold text-blue-700">
                {inMarcarRevistoria
                  ? "Revistoria marcada"
                  : "Revistoria informada"}
              </p>
              <p className="text-[10px] text-blue-500 mt-1">
                Original: {formatDate(dtVistoria || dtApartamentoVigente)}
              </p>
            </div>
          </div>
        )}

        {txObservacaoRevistoria && (
          <div className="border-t border-slate-100 pt-4">
            {onToggleObservation ? (
              <button
                onClick={onToggleObservation}
                className="flex items-center justify-between w-full group mb-1"
              >
                <p className="text-[10px] font-bold text-slate-400 uppercase group-hover:text-blue-500 transition-colors">Observação</p>
                {isObservationExpanded ? (
                  <ChevronUp className="w-3 h-3 text-slate-400 group-hover:text-blue-500" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-blue-500" />
                )}
              </button>
            ) : (
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Observação</p>
            )}

            {(!onToggleObservation || isObservationExpanded) && (
              <p className="text-xs text-slate-600 leading-relaxed italic animate-in fade-in slide-in-from-top-1 duration-200 whitespace-pre-wrap">
                "{txObservacaoRevistoria}"
              </p>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-6 py-4 bg-slate-50/80 flex gap-2 border-t border-slate-100">
        <button
          onClick={() => onEdit(apartment)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span className="text-xs font-bold">Editar</span>
        </button>

        <button
          onClick={() => {
            // Garantimos que o ID existe antes de tentar excluir.
            if (idApartamentoVistoria) {
              onDelete(idApartamentoVistoria);
            }
          }}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-400 rounded-lg hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all shadow-sm"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="text-xs font-bold">Excluir</span>
        </button>
      </div>
    </div>
  );
}