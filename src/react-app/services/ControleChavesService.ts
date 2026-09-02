export interface ApartamentoControleChaves { id: number; label: string }
export interface ObraControleChaves { id: string; nome: string }
export interface PessoaControleChaves { id: number; nome: string; permissao?: string }
export interface RetiradaControleChaves {
  id: number; codigo: string; apartamento: ApartamentoControleChaves;
  retirante: PessoaControleChaves; liberador: PessoaControleChaves;
  recebedor?: PessoaControleChaves | null; dataRetirada: string;
  dataRecebimento?: string | null; status: string;
}
export interface DashboardControleChaves {
  chavesEmCampo: number; chavesNoQuadro: number; chavesEntregues: number;
  retiradasRecentes: RetiradaControleChaves[];
}
export interface NovaRetiradaControleChaves { idApartamento: number; idRetirante: number; idLiberador: number }
export interface RecebimentoControleChaves { idRecebedor: number }

interface ApiResponse<T> { body?: T; txMensagem?: string; error?: string }
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';
const API_URL = `${API_BASE}/api/controle-chaves`;

const requisitar = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, init);
  const text = await response.text();
  let json: ApiResponse<T> | T | null = null;
  if (text.trim()) {
    try { json = JSON.parse(text) as ApiResponse<T> | T; }
    catch { throw new Error(`Resposta inválida do servidor (HTTP ${response.status})`); }
  }
  if (!response.ok) {
    const envelope = json && typeof json === 'object' ? json as ApiResponse<T> : null;
    const detalhe = envelope?.txMensagem || envelope?.error || response.statusText;
    throw new Error(`Falha na API de Controle de Chaves (HTTP ${response.status})${detalhe ? `: ${detalhe}` : ''}`);
  }
  if (json && typeof json === 'object' && 'body' in json) return (json as ApiResponse<T>).body as T;
  return json as T;
};

export const ControleChavesService = {
  listarObras(options: { signal?: AbortSignal } = {}) {
    return requisitar<ObraControleChaves[]>(`${API_URL}/obras`, { signal: options.signal });
  },
  listarApartamentos(busca: string, options: { limite?: number; pagina?: number; signal?: AbortSignal } = {}) {
    const params = new URLSearchParams({ busca, limite: String(options.limite ?? 20), pagina: String(options.pagina ?? 0) });
    return requisitar<ApartamentoControleChaves[]>(`${API_URL}/apartamentos?${params}`, { signal: options.signal });
  },
  buscarDashboard(limiteRecentes = 5, idObra?: string) {
    const params = new URLSearchParams({ limiteRecentes: String(limiteRecentes) });
    if (idObra) params.set('idObra', idObra);
    return requisitar<DashboardControleChaves>(`${API_URL}/dashboard?${params}`);
  },
  listarHistorico(options: { busca?: string; status?: string; idObra?: string; limite?: number; pagina?: number; signal?: AbortSignal } = {}) {
    const params = new URLSearchParams({ busca: options.busca ?? '', status: options.status ?? '', limite: String(options.limite ?? 20), pagina: String(options.pagina ?? 0) });
    if (options.idObra) params.set('idObra', options.idObra);
    return requisitar<RetiradaControleChaves[]>(`${API_URL}/historico?${params}`, { signal: options.signal });
  },
  criarRetirada(payload: NovaRetiradaControleChaves) {
    return requisitar<RetiradaControleChaves>(`${API_URL}/retiradas`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  },
  receberRetirada(id: number, payload: RecebimentoControleChaves) {
    return requisitar<RetiradaControleChaves>(`${API_URL}/retiradas/${id}/recebimento`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  },
};
