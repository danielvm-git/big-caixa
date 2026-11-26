import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	atualizarAiSubscription,
	loadAiSummary,
	loadBootstrap,
	reclassificarEntrada
} from '../src/lib/read-model/client';
import { fetchLedger } from '../src/lib/livro/ledger';
import { clearSession, setSession } from '../src/lib/auth/session';

describe('read-model client regressions', () => {
	afterEach(() => {
		clearSession();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('loadAiSummary parses single-object response from leitura.mjs', async () => {
		setSession({ token: 'jwt.header.sig', email: 'test@example.com' });
		const mockSummary = {
			total_active_services: 10,
			total_recurring_plans: 6,
			total_monthly_cost_usd: 82.68,
			total_monthly_cost_brl: 496.08,
			total_available_credits_usd: 51.13,
			total_month_spent_usd: 130.86,
			total_historical_spent_usd: 951.37,
			next_renewal_date: '2026-12-01'
		};
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(
				new Response(JSON.stringify({ data: mockSummary }), {
					status: 200,
					headers: { 'content-type': 'application/json' }
				})
			)
		);

		const res = await loadAiSummary();
		expect(res).toEqual(mockSummary);
	});

	it('reclassificarEntrada and atualizarAiSubscription fail closed when unauthenticated', async () => {
		clearSession();
		await expect(reclassificarEntrada('tx-1', '4.1.001')).rejects.toThrow('escrita indisponível');
		await expect(atualizarAiSubscription({ provider_key: 'cursor' })).rejects.toThrow(
			'escrita indisponível'
		);
	});

	it('reclassificarEntrada and atualizarAiSubscription POST via caixaWrite with bearer token', async () => {
		setSession({ token: 'jwt.header.sig', email: 'test@example.com' });
		const fetchSpy = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ ok: true }), {
				status: 200,
				headers: { 'content-type': 'application/json' }
			})
		);
		vi.stubGlobal('fetch', fetchSpy);

		await reclassificarEntrada('tx-42', '4.1.001');
		await atualizarAiSubscription({ provider_key: 'deepseek', balance_usd: 25 });

		expect(fetchSpy).toHaveBeenCalledTimes(2);
		const [url1, init1] = fetchSpy.mock.calls[0];
		expect(String(url1)).not.toContain('leitura');
		expect(init1.method).toBe('POST');
		expect(JSON.parse(init1.body)).toEqual({
			op: 'reclassificar_entrada',
			transacao_id: 'tx-42',
			conta_codigo: '4.1.001'
		});

		const [, init2] = fetchSpy.mock.calls[1];
		expect(init2.method).toBe('POST');
		expect(JSON.parse(init2.body)).toEqual({
			op: 'atualizar_ai_subscription',
			provider_key: 'deepseek',
			balance_usd: 25
		});
	});

	it('fetchLedger uses single /bootstrap request instead of 80+ individual fetches', async () => {
		setSession({ token: 'jwt.header.sig', email: 'test@example.com' });
		const mockBoot = {
			months: { '2026-11': [] },
			sankey: { '2026-11': [] },
			compras: [],
			referencia: { '2026-11': [] },
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
			blocos: []
		};
		const fetchSpy = vi.fn().mockImplementation(() =>
			Promise.resolve(
				new Response(JSON.stringify({ data: mockBoot }), {
					status: 200,
					headers: { 'content-type': 'application/json' }
				})
			)
		);
		vi.stubGlobal('fetch', fetchSpy);

		const boot = await loadBootstrap('2026-11');
		expect(boot?.months).toEqual({ '2026-11': [] });

		fetchSpy.mockClear();
		const ledger = await fetchLedger();
		expect(ledger).not.toBeNull();
		expect(fetchSpy).toHaveBeenCalledTimes(1);
		expect(String(fetchSpy.mock.calls[0][0])).toContain('/bootstrap/');
	});
});
