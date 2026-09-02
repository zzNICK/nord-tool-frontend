import assert from 'node:assert/strict';
import test from 'node:test';
import type { Colaborador } from '../services/ColaboradorService';
import { podeLiberarChave, podeRetirarChave } from './elegibilidadeColaborador.ts';

const colaborador = (nomePermissao: string): Colaborador => ({
  nome: 'Colaborador de teste',
  celular: '',
  idEmpresa: 1,
  idCargo: 1,
  idPermissao: 1,
  nomePermissao,
});

test('Engenharia pode retirar e liberar, inclusive com espaços, caixa e acentos normalizados', () => {
  const engenharia = colaborador('  ENGENHÁRIA  ');
  assert.equal(podeRetirarChave(engenharia), true);
  assert.equal(podeLiberarChave(engenharia), true);
});

test('Campo aparece somente entre retirantes, com normalizacao de caixa e espacos', () => {
  const campo = colaborador('  CaMpO  ');
  assert.equal(podeRetirarChave(campo), true);
  assert.equal(podeLiberarChave(campo), false);
});

test('não aceita correspondência parcial nem permissão diferente', () => {
  for (const permissao of ['Engenharia externa', 'Liberar', 'Retirar', '']) {
    const outro = colaborador(permissao);
    assert.equal(podeRetirarChave(outro), false);
    assert.equal(podeLiberarChave(outro), false);
  }
});
