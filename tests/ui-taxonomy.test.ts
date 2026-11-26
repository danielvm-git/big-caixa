import { describe, expect, it } from 'vitest';
import { Book } from '../src/lib/livro/book.svelte';
import type { Ledger } from '../src/lib/livro/ledger';
import fs from 'node:fs';
import path from 'node:path';

function mockLedger(year: number, month: number): Ledger {
	return {
		year,
		month,
		mesAtual: `${year}-${String(month).padStart(2, '0')}`,
		months: {},
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
		lugares: [],
		vinculos: [],
		contratos: [],
		contas: [],
		blocos: [],
		aiSubscriptions: [],
		entradasPrevistas: [],
		entradasRealizadas: [],
		devem: []
	} as unknown as Ledger;
}

describe('Onda 2 — Taxonomia e Contrato da Topbar', () => {
	it('expõe exatamente 5 pilares coesos na navegação da sidebar', () => {
		const book = new Book();
		const view = book.view();

		expect(view.nav).toHaveLength(5);
		const labels = view.nav.map((p) => p.label);
		expect(labels).toEqual(['Hoje', 'Entender', 'Vida & Compromissos', 'Nossa casa', 'Operação']);
	});

	it('posiciona Assinaturas & IA em Vida & Compromissos e remove resíduos de protótipo', () => {
		const book = new Book();
		const view = book.view();

		const viver = view.nav.find((p) => p.label === 'Vida & Compromissos');
		expect(viver).toBeDefined();
		const viverSubs = viver?.subs.map((s) => s.label);
		expect(viverSubs).toContain('Assinaturas & IA');
		expect(viverSubs).toContain('Viagens e férias');
		expect(viverSubs).toContain('50/30/20 e metas');
		expect(viverSubs).not.toContain('Projetos');

		const operacao = view.nav.find((p) => p.label === 'Operação');
		expect(operacao).toBeDefined();
		const operacaoSubs = operacao?.subs.map((s) => s.label);
		expect(operacaoSubs).not.toContain('Assinaturas & IA');
		expect(operacaoSubs).not.toContain('Assinaturas & APIs de IA');

		const allSubs = view.nav.flatMap((p) => p.subs.map((s) => s.label));
		expect(allSubs).not.toContain('Ver no celular');
		expect(allSubs).not.toContain('Projetos');
	});

	it('isola o LedgerContextBar apenas para rotas contábeis/razão', () => {
		const book = new Book();

		const ledgerRoutes = ['hoje', 'visao', 'fluxo', 'mes', 'compras', 'ano', 'metas'];
		for (const route of ledgerRoutes) {
			book.set({ route });
			expect(book.view().showLedgerContext, `rota ${route} deve exibir ledger context`).toBe(true);
		}

		const standaloneRoutes = [
			'entradas',
			'ia',
			'viagens',
			'devem',
			'mapa',
			'pessoas',
			'pendencias',
			'importar',
			'regras',
			'referencia',
			'conta'
		];
		for (const route of standaloneRoutes) {
			book.set({ route });
			expect(book.view().showLedgerContext, `rota ${route} NÃO deve exibir ledger context`).toBe(
				false
			);
		}
	});

	it('computa o rótulo de Fechar Mês dinamicamente', () => {
		const book = new Book();

		// Mock/Sample sem ledger
		expect(book.view().fecharMesLabel).toBe('Fechar outubro');
		expect(book.view().fecharMesNome).toBe('outubro');

		// Com ledger para mês 12 (dezembro -> fecha novembro)
		book.set({ ledger: mockLedger(2026, 12) });
		expect(book.view().fecharMesLabel).toBe('Fechar novembro');
		expect(book.view().fecharMesNome).toBe('novembro');

		// Com ledger para mês 3 (março -> fecha fevereiro)
		book.set({ ledger: mockLedger(2026, 3) });
		expect(book.view().fecharMesLabel).toBe('Fechar fevereiro');
		expect(book.view().fecharMesNome).toBe('fevereiro');
	});

	it('garante que LivroApp.svelte não contém "Fechar outubro" hardcoded nem "Ver no celular"', () => {
		const appPath = path.resolve(__dirname, '../src/lib/livro/LivroApp.svelte');
		const content = fs.readFileSync(appPath, 'utf-8');

		expect(content).not.toContain('Fechar outubro');
		expect(content).not.toContain('Ver no celular');
		expect(content).toContain('{v.fecharMesLabel}');
		expect(content).toContain('<LedgerContextBar');
	});
});
