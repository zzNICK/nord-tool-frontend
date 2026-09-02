export const CHAVE_OBRA_CONTROLE_CHAVES = '@NordTool:controle_chaves_obra';
export const EVENTO_OBRA_CONTROLE_CHAVES = 'nordtool:controle-chaves-obra';

const PREFIXOS_POR_OBRA: Record<string, string> = {
  'Nord 1': 'N1',
  'Nord 2': 'N2',
  Energy: 'EN',
  N1: 'N1',
  N2: 'N2',
  EN: 'EN',
};

const normalizarObraControleChaves = (obra: string | null): string =>
  obra ? PREFIXOS_POR_OBRA[obra.trim()] ?? '' : '';

export const lerObraControleChaves = (): string => {
  const valor = localStorage.getItem(CHAVE_OBRA_CONTROLE_CHAVES);
  return normalizarObraControleChaves(valor);
};

export const salvarObraControleChaves = (idObra: string) => {
  const obraNormalizada = normalizarObraControleChaves(idObra);
  if (!obraNormalizada) localStorage.removeItem(CHAVE_OBRA_CONTROLE_CHAVES);
  else localStorage.setItem(CHAVE_OBRA_CONTROLE_CHAVES, obraNormalizada);
  window.dispatchEvent(new CustomEvent(EVENTO_OBRA_CONTROLE_CHAVES));
};
