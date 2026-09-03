import type {
  ApartamentoVistoriaDto,
  ApartamentoVistoriaForm,
} from "@/shared/types";

// Nick, a URL correta é a do seu backend no Railway, não a do Localhost do Vite!
const API_BASE = "https://nordtoolbackend-develop.up.railway.app/api/v1/nord-tool";
const BASE_URL = `${API_BASE}/apartamentoVistoria`;

export const apartamentoVistoriaService = {
  async listar(token?: string): Promise<ApartamentoVistoriaDto[]> {
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(BASE_URL, { method: "GET", headers });
    if (!res.ok) throw new Error(`Erro ao listar apartamentos: ${res.status}`);

    const json = await res.json();

    // Garantindo que retornamos o array, esteja ele no .body ou solto no json
    return json.body || json || [];
  },

  async getById(id: number, token?: string): Promise<ApartamentoVistoriaDto> {
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}/${id}`, { method: "GET", headers });
    if (!res.ok) throw new Error(`Erro ao buscar apartamento: ${res.status}`);
    const json = await res.json();
    // O endpoint de 'get by id' pode ou não ter o wrapper 'body', então tratamos ambos os casos
    return json.body || json;
  },

  async criar(data: ApartamentoVistoriaForm, token?: string) {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(BASE_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Erro ao criar apartamento");
    return res.json();
  },

  async editar(data: ApartamentoVistoriaForm, token?: string) {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(BASE_URL, {
      method: "PUT",
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Erro ao editar apartamento");
    return res.json();
  },

  async deletar(id: number, token?: string) {
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}/${id}`, {
      method: "DELETE",
      headers,
    });
    if (!res.ok) throw new Error("Erro ao deletar apartamento");
  },

  async importar(file: File, token?: string) {
    // 1. O objeto 'file' é recebido como argumento e deve ser um objeto File válido.
    const formData = new FormData();

    // 2. A chave para o arquivo DEVE ser 'file' (minúsculo).
    // O backend (Spring/NestJS) espera por este nome de campo específico.
    formData.append('file', file);

    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // 3. Realiza a requisição POST usando fetch.
    // IMPORTANTE: Ao enviar FormData, NUNCA defina o header 'Content-Type' manualmente.
    // O navegador o definirá como 'multipart/form-data' e adicionará o 'boundary' necessário.
    // Se um interceptor global estiver adicionando 'Content-Type: application/json',
    // ele precisa ser configurado para ignorar esta rota de upload.
    const res = await fetch(`${BASE_URL}/importar`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!res.ok) {
      const errorMsg = await res.text();
      console.error("Erro detalhado do backend:", res.status, errorMsg);
      // Lança a mensagem de erro exata do backend para ser exibida no frontend.
      throw new Error(errorMsg || `Erro ${res.status} ao importar planilha`);
    }
    return res.json();
  },
};