import type { CompraDoc, MesDoc, SankeyDoc } from './types';

export const fixtureMes: MesDoc[] = [
	{
		mes: '2026-11',
		escopo: 'casa',
		categoria_id: 'mercado',
		custo_recorrente: 1480,
		custo_extraordinario: 0
	},
	{
		mes: '2026-11',
		escopo: 'pessoal',
		categoria_id: 'restaurantes',
		custo_recorrente: 286,
		custo_extraordinario: 0
	}
];

export const fixtureCompras: CompraDoc[] = [
	{
		id: 'c1',
		data: '2026-11-23',
		loja: 'Zaffari',
		titulo: 'Compra do mês',
		valor_total_centavos: 41280,
		categoria_id: 'mercado',
		escopo: 'casa'
	}
];

export const fixtureSankey: SankeyDoc[] = [
	{ periodo: '2026-11', origem: 'Salário', destino: 'Casa', valor: 11, nivel: 0 }
];
