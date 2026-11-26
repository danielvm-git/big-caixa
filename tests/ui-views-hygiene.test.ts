import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const MIGRATED_VIEWS = [
	'src/lib/livro/EntradasSpreadsheet.svelte',
	'src/lib/livro/DevemView.svelte',
	'src/lib/livro/AiSubscriptionsView.svelte',
	'src/lib/livro/ViagensFeriasView.svelte'
];

const PRIVACY_SENSITIVE_DRAWERS = ['src/lib/livro/EntradaInspectorDrawer.svelte'];

describe('Onda 1 UI primitives hygiene & privacy regression', () => {
	for (const relPath of MIGRATED_VIEWS) {
		const content = readFileSync(resolve(process.cwd(), relPath), 'utf8');

		it(`${relPath} imports and uses shared UI primitives`, () => {
			expect(content).toContain("from '$lib/ui'");
			expect(content).toContain('<PageHeader');
			expect(content).toContain('<DataState');
			expect(content).toContain('<SegmentedTabs');
			expect(content).toContain('<Money');
		});

		it(`${relPath} does not duplicate topbar breadcrumbs or bypass <Money />`, () => {
			expect(content).not.toMatch(/class="breadcrumb"/);
			expect(content).not.toMatch(/new Intl\.NumberFormat/);
			expect(content).not.toMatch(/\bformatMoney\(/);
		});
	}

	for (const relPath of PRIVACY_SENSITIVE_DRAWERS) {
		const content = readFileSync(resolve(process.cwd(), relPath), 'utf8');

		it(`${relPath} renders monetary values via <Money /> without local currency formatters`, () => {
			expect(content).toContain('<Money');
			expect(content).not.toMatch(/formatBRL/);
			expect(content).not.toMatch(/\bformatMoney\(/);
		});
	}

	it('Money primitive enforces global privacy blur without raw {@html}', () => {
		const moneySrc = readFileSync(resolve(process.cwd(), 'src/lib/ui/Money.svelte'), 'utf8');
		expect(moneySrc).toContain('book.state.priv');
		expect(moneySrc).toContain('blur(');
		expect(moneySrc).not.toContain('{@html');
	});
});
