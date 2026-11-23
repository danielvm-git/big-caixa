import { describe, expect, it } from 'vitest';
import { soma, somaPorCategoria, type Ledger } from '../src/lib/livro/ledger';
import type { MesDoc } from '../src/lib/read-model/types';

function linha(escopo: string, categoria_id: string, valor: number): MesDoc {
	return { mes: '2026-11', escopo, categoria_id, custo_recorrente: valor, custo_extraordinario: 0 };
}

describe('soma do custo mensal', () => {
	it('soma recorrente e extraordinário e separa por categoria', () => {
		const rows = [
			linha('casa', 'mercado', 10),
			{ ...linha('casa', 'mercado', 1), custo_extraordinario: 2, custo_recorrente: 0 },
			linha('pessoal', 'lazer', 4)
		];
		expect(soma(rows)).toBe(16);
		expect(somaPorCategoria(rows).get('mercado')).toBe(12);
	});

	it('não lê o livro no modo de teste', async () => {
		const vazio: Ledger = { year: 2026, month: 11, months: {}, sankey: {}, compras: [] };
		expect(soma(vazio.months['2026-11'] ?? [])).toBe(0);
	});
});
