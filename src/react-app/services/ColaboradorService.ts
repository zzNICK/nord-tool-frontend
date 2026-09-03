export interface Colaborador {
  id?: number;
  nome: string;
  celular: string;
  idEmpresa: number;
  nomeEmpresa?: string;
  idCargo: number;
  nomeCargo?: string;
  idPermissao: number;
  nomePermissao?: string;
}

const API_BASE = (
  import.meta.env.DEV
    ? ''
    : (import.meta.env.VITE_API_URL as string | undefined) || ''
).replace(/\/+$/, '').replace(/\/api$/, '');

const API_URL = `${API_BASE}/api/colaboradores`;

type ApiResponseBody<T> = {
  body?: T;
  txMensagem?: string;
};

const criarErroHttp = (res: Response, json: unknown, fallback: string): Error => {
  const resposta = json && typeof json === 'object' ? json as ApiResponseBody<unknown> : null;
  const mensagem = resposta?.txMensagem || fallback;
  const causa = typeof resposta?.body === 'string' ? `: ${resposta.body}` : '';

  return new Error(`${mensagem} (HTTP ${res.status})${causa}`);
};

const lerJson = async (res: Response): Promise<unknown> => {
  const texto = await res.text();
  if (!texto.trim()) return null;

  try {
    return JSON.parse(texto) as unknown;
  } catch {
    throw new Error('Resposta inválida recebida do servidor');
  }
};

export const ColaboradorService = {
  async listar(): Promise<Colaborador[]> {
    const res = await fetch(API_URL);
    const json = await lerJson(res);
    if (!res.ok) throw criarErroHttp(res, json, 'Falha ao carregar colaboradores');

    const conteudo = json && typeof json === 'object' && 'body' in json
      ? (json as ApiResponseBody<unknown>).body
      : json;

    return Array.isArray(conteudo) ? conteudo as Colaborador[] : [];
  },

  async salvar(colaborador: Colaborador): Promise<void> {
    const method = colaborador.id ? 'PUT' : 'POST';
    const url = colaborador.id ? `${API_URL}/${colaborador.id}` : API_URL;

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(colaborador),
    });

    if (!res.ok) {
      const json = await lerJson(res);
      throw criarErroHttp(res, json, 'Falha ao salvar colaborador');
    }
  }
};
