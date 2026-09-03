import type { DiaSemanaDto, StatusVistoriaDto } from "@/shared/types";

// Mantendo a URL do Railway que é o nosso porto seguro
const BASE_URL = "https://nordtoolbackend-develop.up.railway.app/api/v1/nord-tool";

export async function listarDiasSemana(): Promise<DiaSemanaDto[]> {
  try {
    const res = await fetch(`${BASE_URL}/diaSemana`);
    if (!res.ok) throw new Error("Erro ao buscar dias da semana");
    const json = await res.json();
    return json.body || json || [];
  } catch (error) {
    console.error("Lugia Report - Erro em listarDiasSemana:", error);
    return [];
  }
}

export async function listarStatusVistoria(): Promise<StatusVistoriaDto[]> {
  try {
    const res = await fetch(`${BASE_URL}/statusVistoria`);
    if (!res.ok) throw new Error("Erro ao buscar status");
    const json = await res.json();
    return json.body || json || [];
  } catch (error) {
    console.error("Lugia Report - Erro em listarStatusVistoria:", error);
    return [];
  }
}