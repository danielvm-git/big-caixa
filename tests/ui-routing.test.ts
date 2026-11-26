import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { uiStore } from '../src/lib/livro/ui.svelte';
import { ledgerContext } from '../src/lib/livro/ledger-context.svelte';
import type { Ledger } from '../src/lib/livro/ledger';

describe('Onda 3 — Roteamento Real & Modularização de Stores', () => {
	it('garante que +layout.svelte passa {@render children()} para o LivroApp / AppShell', () => {
		const layoutPath = path.resolve(__dirname, '../src/routes/+layout.svelte');
		const content = fs.readFileSync(layoutPath, 'utf-8');

		expect(content).toContain('<LivroApp>{@render children()}</LivroApp>');
	});

	it('garante que LivroApp.svelte aceita e renderiza children no main', () => {
		const appPath = path.resolve(__dirname, '../src/lib/livro/LivroApp.svelte');
		const content = fs.readFileSync(appPath, 'utf-8');

		expect(content).toContain('let { children }');
		expect(content).toContain('{@render children()}');
	});

	it('garante que todas as rotas principais importam seus respectivos componentes de view', () => {
		const routesToCheck: [string, string][] = [
			['hoje', 'HojeView'],
			['visao', 'VisaoGeralView'],
			['fluxo', 'FluxoView'],
			['compras', 'ComprasView'],
			['mes', 'MesView'],
			['ano', 'AnoView'],
			['metas', 'MetasView'],
			['entradas', 'EntradasSpreadsheet'],
			['ia', 'AiSubscriptionsView'],
			['viagens', 'ViagensFeriasView'],
			['devem', 'DevemView'],
			['importar', 'ImportarView'],
			['pendencias', 'PendenciasView'],
			['regras', 'RegrasView'],
			['referencia', 'ReferenciaView'],
			['conta', 'ContaView'],
			['mapa', 'CasaView'],
			['pessoas', 'CasaView'],
			['custo', 'CasaView']
		];

		for (const [route, componentName] of routesToCheck) {
			const pagePath = path.resolve(__dirname, `../src/routes/${route}/+page.svelte`);
			expect(fs.existsSync(pagePath), `Rota ${route} deve existir`).toBe(true);
			const pageContent = fs.readFileSync(pagePath, 'utf-8');
			expect(pageContent, `Rota ${route} deve montar o componente ${componentName}`).toContain(
				componentName
			);
		}
	});

	it('valida reatividade e métodos do store modular uiStore', () => {
		expect(uiStore.dark).toBe(false);
		uiStore.toggleDark();
		expect(uiStore.dark).toBe(true);
		uiStore.toggleDark();

		expect(uiStore.priv).toBe(false);
		uiStore.togglePriv();
		expect(uiStore.priv).toBe(true);
		uiStore.togglePriv();

		expect(uiStore.cmd).toBe(false);
		uiStore.openCmd();
		expect(uiStore.cmd).toBe(true);
		uiStore.closeCmd();
		expect(uiStore.cmd).toBe(false);

		expect(uiStore.toast).toBeNull();
		uiStore.showToast('Teste toast');
		expect(uiStore.toast?.m).toBe('Teste toast');
		uiStore.clearToast();
		expect(uiStore.toast).toBeNull();

		expect(uiStore.closeStep).toBe(-1);
		uiStore.openClose();
		expect(uiStore.closeStep).toBe(0);
		uiStore.closeX();
		expect(uiStore.closeStep).toBe(-1);

		uiStore.pushHist('hoje');
		uiStore.pushHist('compras');
		expect(uiStore.popHist()).toBe('compras');
		expect(uiStore.popHist()).toBe('hoje');
		expect(uiStore.popHist()).toBeUndefined();
	});

	it('valida reatividade e métodos do store modular ledgerContext', () => {
		expect(ledgerContext.per).toBe(0);
		ledgerContext.cyclePer();
		expect(ledgerContext.per).toBe(1);
		ledgerContext.cyclePer();
		expect(ledgerContext.per).toBe(2);
		ledgerContext.cyclePer();
		expect(ledgerContext.per).toBe(0);

		expect(ledgerContext.base).toBe(0);
		ledgerContext.toggleBase();
		expect(ledgerContext.base).toBe(1);
		ledgerContext.toggleBase();
		expect(ledgerContext.base).toBe(0);

		ledgerContext.filt = { cat: 'mercado', label: 'Mercado' };
		expect(ledgerContext.filt.cat).toBe('mercado');
		ledgerContext.clearFilt();
		expect(ledgerContext.filt).toBeNull();

		expect(ledgerContext.real).toBe(false);
		ledgerContext.setLedger({ year: 2026, month: 11 } as unknown as Ledger, true);
		expect(ledgerContext.real).toBe(true);
		expect(ledgerContext.ledger?.year).toBe(2026);
		ledgerContext.setLedger(null, false);
		expect(ledgerContext.real).toBe(false);
	});
});
