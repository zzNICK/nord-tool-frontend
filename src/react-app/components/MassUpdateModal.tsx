import { useState } from "react";
import { X, ClipboardPaste } from "lucide-react";

interface MassUpdateModalProps {
  onClose: () => void;
  onProcess: (agendamentos: {
    nmApartamentoVistoria: string;
    dtApartamentoVigente: string;
    nmHorarioVistoria: string;
  }[]) => void;
}

export default function MassUpdateModal({ onClose, onProcess }: MassUpdateModalProps) {
  const [textoSales, setTextoSales] = useState("");
  const [prefixo, setPrefixo] = useState("N1");

  const processarTexto = () => {
    const linhas = textoSales.split("\n");
    const agendamentos = [];
    let dataAtual = "";

    const meses: Record<string, string> = {
      janeiro: "01", fevereiro: "02", março: "03", abril: "04",
      maio: "05", junho: "06", julho: "07", agosto: "08",
      setembro: "09", outubro: "10", novembro: "11", dezembro: "12",
    };

    for (const linha of linhas) {
      const txt = linha.trim();
      if (!txt) continue;

      const matchData = txt.match(/^(\d{1,2})\s+de\s+([a-zç]+)\s+de\s+(\d{4})/i);
      if (matchData) {
        const dia = matchData[1].padStart(2, "0");
        const mes = meses[matchData[2].toLowerCase()] || "01";
        const ano = matchData[3];
        dataAtual = `${ano}-${mes}-${dia}`;
        continue;
      }

      const matchApto = txt.match(/^(\d{2}:\d{2})\s*-\s*\d{2}:\d{2}.*?(\d{2}-\d{4})/);
      if (matchApto && dataAtual) {
        agendamentos.push({
          nmApartamentoVistoria: `${prefixo}-${matchApto[2]}`,
          dtApartamentoVigente: dataAtual,
          nmHorarioVistoria: matchApto[1],
        });
      }
    }
    
    onProcess(agendamentos);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col relative overflow-hidden h-[80vh]">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-50 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 md:p-8 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
            <ClipboardPaste className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Importação do Sales</h3>
            <p className="text-xs text-slate-500 font-medium">Cole os dados brutos e deixe a magia acontecer</p>
          </div>
        </div>

        <div className="p-6 md:p-8 flex-1 flex flex-col gap-6 overflow-y-auto">
          <div className="w-1/3 space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Condomínio</label>
            <select
              value={prefixo}
              onChange={(e) => setPrefixo(e.target.value)}
              className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none shadow-sm"
            >
              <option value="N1">Nord 1 (N1)</option>
              <option value="N2">Nord 2 (N2)</option>
              <option value="EN">Energy (EN)</option>
            </select>
          </div>

          <div className="space-y-1 flex-1 flex flex-col min-h-0">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Dados Copiados</label>
            <textarea
              value={textoSales}
              onChange={(e) => setTextoSales(e.target.value)}
              placeholder="Cole os dados aqui..."
              className="w-full flex-1 border border-slate-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none resize-none text-sm shadow-sm"
            />
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-white shrink-0 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-3 border border-slate-200 font-bold text-slate-500 rounded-xl hover:bg-slate-50 text-sm">Cancelar</button>
          <button onClick={processarTexto} className="px-6 py-3 bg-purple-600 text-white font-bold rounded-xl shadow-lg hover:bg-purple-700 text-sm">Atualizar Banco</button>
        </div>
      </div>
    </div>
  );
}