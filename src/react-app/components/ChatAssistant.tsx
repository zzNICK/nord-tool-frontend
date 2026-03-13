import { useState, useRef, useEffect } from "react";
import { RotateCcw, X, Send, Loader2, Sparkles } from "lucide-react";
import { apartamentoVistoriaService } from "@/react-app/services/ApartamentoVistoriaService";
import { listarStatusVistoria } from "@/react-app/services/EndpointsDominioService";
import type { ApartamentoVistoriaForm } from "@/shared/types";
import { format, addDays } from "date-fns";

interface Message {
  role: "user" | "model" | "function";
  content: string;
}

interface ChatAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
}

// Nick, verifique se a chave está no .env e se o prefixo VITE_ está correto. Ex: VITE_GEMINI_API_KEY=sua_chave
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY; 
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const WELCOME_MESSAGE = { role: 'model', content: 'Olá! Como posso te ajudar a gerenciar as vistorias hoje?' } as Message;

export default function ChatAssistant({ isOpen, onClose, token }: ChatAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hasWelcomed, setHasWelcomed] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && !hasWelcomed) {
      setMessages([WELCOME_MESSAGE]);
      setHasWelcomed(true);
    }
    scrollToBottom();
  }, [messages, isOpen, hasWelcomed]);

  if (!isOpen) return null;

  const handleClearChat = () => {
    setMessages([WELCOME_MESSAGE]);
    setInput("");
  };

  // Definição das Ferramentas (Function Calling)
  const tools = [
    {
      function_declarations: [
        {
          name: "listar_apartamentos",
          description: "Busca a lista de apartamentos e vistorias. Use para responder perguntas sobre status, datas ou horários.",
          parameters: {
            type: "OBJECT",
            properties: {
              filtro: {
                type: "STRING",
                description: "Termo opcional para filtrar (ex: 'N1', 'Aprovado', 'amanhã', 'hoje', '2024-07-25'). Se vazio, traz tudo."
              }
            },
          },
        },
        {
          name: "atualizar_vistoria",
          description: "Atualiza uma vistoria existente. Primeiro, use 'listar_apartamentos' para encontrar o ID do apartamento se você só tiver o nome. Use este ID para atualizar.",
          parameters: {
            type: "OBJECT",
            properties: {
              idApartamentoVistoria: {
                type: "NUMBER",
                description: "O ID numérico exato do apartamento a ser atualizado. É obrigatório."
              },
              novaData: {
                type: "STRING",
                description: "A nova data da vistoria no formato AAAA-MM-DD."
              },
              novoHorario: {
                type: "STRING",
                description: "O novo horário da vistoria no formato HH:MM."
              },
              novoStatus: {
                type: "STRING",
                description: "O novo status da vistoria (ex: 'Aprovado', 'Reprovado', 'Pendente')."
              }
            },
            required: ["idApartamentoVistoria"]
          }
        }
      ],
    },
  ];

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    if (!GEMINI_API_KEY) {
      console.error("❌ ERRO: Chave de API do Gemini não encontrada ou undefined. Verifique o .env");
      setMessages((prev) => [...prev, { role: "model", content: "Erro de configuração: Chave de API não encontrada." }]);
      return;
    }

    const userMsg = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsLoading(true);

    try {
      // 1. Monta o histórico para enviar ao Gemini
      // Garante que apenas roles 'user' e 'model' sejam enviados no histórico (remove 'system' se houver)
      const contents = messages.filter(m => m.role === 'user' || m.role === 'model').map((m) => ({
        role: m.role,
        parts: [{ text: m.content }],
      }));
      
      // Adiciona a mensagem atual
      contents.push({
        role: "user",
        parts: [{ text: userMsg }],
      });

      // Payload para a API
      const payload = {
        contents,
        tools,
        // Ajuste do Campo System: system_instruction (com underline)
        system_instruction: { parts: [{ text: "Você é o Gemini, um assistente de IA do Google. Sua função é ajudar o usuário a gerenciar as vistorias de apartamentos no sistema NordTool. Seja prestativo, direto e eficiente. Use as ferramentas disponíveis para buscar ou atualizar informações quando solicitado." }] }
      };

      // Logs de Guerra
      console.log('Payload completo:', JSON.stringify(payload, null, 2));

      // 2. Primeira chamada à API
      let response = await fetch(API_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-goog-api-client": "genai-js" // Proxy de Segurança
        },
        body: JSON.stringify(payload),
      });

      // DEBUG: Tratamento de erro robusto
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ ERRO DO GEMINI:', errorData);
        throw new Error(`Erro da API do Gemini: ${errorData.error?.message || response.statusText}`);
      }

      let data = await response.json();
      console.log('Resposta bruta do Google:', data);

      let candidate = data.candidates?.[0]?.content;

      // 3. Verifica se o Gemini pediu para chamar uma função
      const functionCall = candidate?.parts?.find((part: any) => part.functionCall);

      if (functionCall) {
        const { name, args } = functionCall.functionCall;
        let functionResponsePayload;

        switch (name) {
          case "listar_apartamentos": {
            const todosApartamentos = await apartamentoVistoriaService.listar(token ?? undefined);
            let resultado = todosApartamentos;
            if (args.filtro) {
              const termo = args.filtro.toLowerCase();
              const hoje = new Date();
              const amanha = format(addDays(hoje, 1), 'yyyy-MM-dd');

              resultado = todosApartamentos.filter(apt => {
                const dataApt = apt.dtApartamentoVigente ? apt.dtApartamentoVigente.split('T')[0] : '';
                
                if (termo.includes('amanhã')) {
                  return dataApt === amanha;
                }
                if (termo.includes('hoje')) {
                  return dataApt === format(hoje, 'yyyy-MM-dd');
                }

                return (
                  apt.nmApartamentoVistoria?.toLowerCase().includes(termo) ||
                  apt.nmStatusVistoria?.toLowerCase().includes(termo) ||
                  dataApt.includes(termo)
                );
              });
            }
            const resultadoResumido = resultado.slice(0, 20).map(apt => ({
              id: apt.idApartamentoVistoria,
              apto: apt.nmApartamentoVistoria,
              status: apt.nmStatusVistoria,
              data: apt.dtApartamentoVigente,
              horario: apt.nmHorarioVistoria
            }));
            functionResponsePayload = { name, response: { result: resultadoResumido } };
            break;
          }

          case "atualizar_vistoria": {
            let functionResult;
            try {
              const { idApartamentoVistoria, novaData, novoHorario, novoStatus } = args;
              const currentApt = await apartamentoVistoriaService.getById(idApartamentoVistoria, token ?? undefined);

              const formData: ApartamentoVistoriaForm = {
                idApartamentoVistoria: currentApt.idApartamentoVistoria!,
                nmApartamentoVistoria: currentApt.nmApartamentoVistoria || "",
                idDiaSemana: currentApt.idDiaSemana || 0,
                dtApartamentoVigente: currentApt.dtApartamentoVigente ?? "",
                nmHorarioVistoria: currentApt.nmHorarioVistoria || "",
                idStatusVistoria: currentApt.idStatusVistoria || 0,
                inMarcarRevistoria: currentApt.inMarcarRevistoria ?? false,
                txObservacaoRevistoria: currentApt.txObservacaoRevistoria ?? "",
                dtRevistoriaVigente: currentApt.dtRevistoriaVigente ?? "",
              };

              if (novaData) {
                formData.dtApartamentoVigente = novaData;
                const dataObj = new Date(novaData + 'T12:00:00Z');
                const diaIndex = dataObj.getDay();
                formData.idDiaSemana = diaIndex === 0 ? 7 : diaIndex;
              }
              if (novoHorario) formData.nmHorarioVistoria = novoHorario;
              if (novoStatus) {
                const statusList = await listarStatusVistoria();
                const statusObj = statusList.find(s => s.nmStatusVistoria.toLowerCase() === novoStatus.toLowerCase());
                if (statusObj) {
                  formData.idStatusVistoria = statusObj.idStatusVistoria;
                } else {
                  throw new Error(`Status '${novoStatus}' não é válido.`);
                }
              }

              await apartamentoVistoriaService.editar(formData, token ?? undefined);
              const updatedApt = await apartamentoVistoriaService.getById(idApartamentoVistoria, token ?? undefined);

              functionResult = { 
                success: true, 
                message: `Operação concluída. O apartamento ${currentApt.nmApartamentoVistoria} foi atualizado com sucesso.`,
                dadosAtualizados: { apto: updatedApt.nmApartamentoVistoria, status: updatedApt.nmStatusVistoria, data: updatedApt.dtApartamentoVigente, horario: updatedApt.nmHorarioVistoria }
              };

              // Futuramente, aqui podemos disparar um evento para atualizar a UI principal.
            } catch (e: any) {
              console.error("Erro ao atualizar vistoria:", e);
              functionResult = { success: false, error: `Ocorreu um erro ao tentar atualizar a vistoria. Detalhes: ${e.message}` };
            }
            functionResponsePayload = { name, response: functionResult };
            break;
          }
        }

        if (functionResponsePayload) {
            const functionResponsePart = { functionResponse: functionResponsePayload };
            const newContents = [
              ...contents,
              candidate,
              { role: "function", parts: [functionResponsePart] }
            ];

            const secondPayload = { contents: newContents, tools };
            console.log('📦 Enviando para o Gemini (com resultado da função):', JSON.stringify(secondPayload, null, 2));

            response = await fetch(API_URL, {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                "x-goog-api-client": "genai-js"
              },
              body: JSON.stringify(secondPayload),
            });

            // DEBUG: Tratamento de erro robusto para a segunda chamada
            if (!response.ok) {
              const errorData = await response.json();
              console.error('❌ ERRO DO GEMINI (2ª chamada):', errorData);
              throw new Error(`Erro da API do Gemini na 2ª chamada: ${errorData.error?.message || response.statusText}`);
            }

            data = await response.json();
            console.log('Resposta bruta do Google (2ª chamada):', data);
            candidate = data.candidates?.[0]?.content;
        }
      }

      // 5. Exibe a resposta final
      const botText = candidate?.parts?.map((p: any) => p.text).join("") || "Desculpe, não entendi.";
      setMessages((prev) => [...prev, { role: "model", content: botText }]);

    } catch (error) {
      console.error("Erro no chat:", error);
      setMessages((prev) => [...prev, { role: "model", content: "Erro ao conectar com o assistente." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Janela do Chat */}
      <div className="w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[500px] animate-in slide-in-from-bottom-10 fade-in duration-300">
        {/* Header */}
        <div className="bg-white p-4 flex items-center justify-between text-slate-800 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <span className="font-bold">Gemini</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={handleClearChat} className="text-slate-500 hover:bg-slate-100 p-1 rounded-full transition-colors" title="Limpar conversa">
              <RotateCcw className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="text-slate-500 hover:bg-slate-100 p-1 rounded-full transition-colors" title="Fechar chat">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Área de Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${
                  msg.role === "user"
                    ? "bg-slate-100 text-slate-800 rounded-br-none"
                    : "bg-white text-slate-700 rounded-bl-none"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white p-3 rounded-2xl rounded-bl-none border border-slate-200 shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 bg-white border-t border-slate-100">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte ao Gemini..."
              className="flex-1 bg-slate-100 border-0 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-700"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}