import { describe, expect, it } from 'vitest';
import {
	baselineMes,
	carregarAno,
	soma,
	somaPorCategoria,
	somaRecorrente,
	totalResumo,
	type Ledger
} from '../src/lib/livro/ledger';
import type { MesDoc } from '../src/lib/read-model/types';

function linha(escopo: string, categoria_id: string, valor: number, extra = 0): MesDoc {
	return {
		mes: '2026-11',
		escopo,
		categoria_id,
		custo_recorrente: valor,
		custo_extraordinario: extra
	};
}

function ledgerComMeses(map: Record<string, MesDoc[]>, year = 2026, month = 11): Ledger {
	return {
		year,
		month,
		mesAtual: '2026-11',
		months: map,
		sankey: {},
		compras: [],
		referencia: {},
		regras: [],
		viagens: [],
		ferias: [],
		importacoes: [],
		faturasPendentes: [],
		pendencias: null,
		pessoas: [],
		contas: [],
		blocos: []
	};
}

describe('soma do custo mensal', () => {
	it('soma recorrente e extraordinário e separa por categoria', () => {
		const rows = [
			linha('casa', 'mercado', 10),
			linha('casa', 'mercado', 0, 2),
			linha('pessoal', 'lazer', 4)
		];
		expect(soma(rows)).toBe(16);
		expect(somaRecorrente(rows)).toBe(14);
		expect(somaPorCategoria(rows).get('mercado')).toBe(12);
	});

	it('baseline usa mediana dos meses fechados', () => {
		const meses: Record<string, MesDoc[]> = {
			'2026-09': [linha('casa', 'x', 10), linha('pessoal', 'y', 10)],
			'2026-10': [linha('casa', 'x', 20), linha('pessoal', 'y', 20)]
		};
		const L = ledgerComMeses(meses);
		const base = baselineMes(L);
		expect(base.casa).toBe(15);
		expect(totalResumo(base)).toBe(30);
	});

	it('carregarAno inclui doze meses e marca dezembro como projeção', () => {
		const meses: Record<string, MesDoc[]> = {
			'2026-09': [linha('casa', 'x', 10)],
			'2026-10': [linha('casa', 'x', 20)]
		};
		const L = ledgerComMeses(meses);
		const ano = carregarAno(L, 2026);
		expect(ano).toHaveLength(12);
		expect(ano.find((m) => m.mes === '2026-12')?.projetado).toBe(true);
	});
});
