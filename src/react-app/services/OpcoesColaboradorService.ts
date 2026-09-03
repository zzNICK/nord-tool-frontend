export interface Empresa { id: number; nome: string; }
export interface Cargo { id: number; nome: string; }
export interface Permissao { id: number; nome: string; }

interface ApiResponseBody<T> {
  body?: T;
  txMensagem?: string;
}

type OpcaoColaborador = Empresa | Cargo | Permissao;

const API_BASE = (
  import.meta.env.DEV
    ? '/api/v1/nord-tool'
    : (import.meta.env.VITE_API_URL as string | undefined) || ''
).replace(/\/+$/, '').replace(/\/api$/, '');

const listarOpcoes = async <T extends OpcaoColaborador>(endpoint: string, descricao: string): Promise<T[]> => {
  if (!API_BASE) {
    throw new Error('VITE_API_URL não configurada para a API de Controle de Chaves');
  }

  const res = await fetch(`${API_BASE}${endpoint}`);
  const texto = await res.text();
  let json: ApiResponseBody<unknown> | unknown = null;

  if (texto.trim()) {
    try {
      json = JSON.parse(texto) as ApiResponseBody<unknown>;
    } catch {
      throw new Error(`Resposta inválida ao carregar ${descricao}`);
    }
  }

  if (!res.ok) {
    const resposta = json && typeof json === 'object' ? json as ApiResponseBody<unknown> : null;
    const mensagem = resposta?.txMensagem || `Falha ao carregar ${descricao}`;
    const causa = typeof resposta?.body === 'string' ? `: ${resposta.body}` : '';
    throw new Error(`${mensagem} (HTTP ${res.status})${causa}`);
  }

  const conteudo = json && typeof json === 'object' && 'body' in json
    ? (json as ApiResponseBody<unknown>).body
    : json;
  return Array.isArray(conteudo) ? conteudo as T[] : [];
};

export const OpcoesColaboradorService = {
  listarEmpresas: () => listarOpcoes<Empresa>('/api/empresas', 'empresas'),
  listarCargos: () => listarOpcoes<Cargo>('/api/cargos', 'cargos'),
  listarPermissoes: () => listarOpcoes<Permissao>('/api/permissoes', 'permissões'),
};
