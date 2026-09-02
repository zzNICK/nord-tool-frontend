import type { Colaborador } from '../services/ColaboradorService';

const normalizarPermissao = (valor?: string): string =>
  (valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('pt-BR');

export const podeRetirarChave = (colaborador: Colaborador): boolean => {
  const permissao = normalizarPermissao(colaborador.nomePermissao);
  return permissao === 'engenharia' || permissao === 'campo';
};

export const podeLiberarChave = (colaborador: Colaborador): boolean =>
  normalizarPermissao(colaborador.nomePermissao) === 'engenharia';
