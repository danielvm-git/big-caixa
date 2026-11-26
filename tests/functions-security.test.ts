import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { formatLine } from '../src/lib/log';

type FetchHandler = { fetch(request: Request): Promise<Response> };

let leituraHandler: FetchHandler;
let escritaHandler: FetchHandler;

beforeAll(async () => {
	const leituraUrl = new URL('../functions/leitura.mjs', import.meta.url).href;
	const escritaUrl = new URL('../functions/escrita.mjs', import.meta.url).href;
	leituraHandler = (await import(/* @vite-ignore */ leituraUrl)).default as FetchHandler;
	escritaHandler = (await import(/* @vite-ignore */ escritaUrl)).default as FetchHandler;
});

describe('Neon Functions security gates', () => {
	const origLocalDev = process.env.LOCAL_DEV;

	afterEach(() => {
		if (origLocalDev === undefined) delete process.env.LOCAL_DEV;
		else process.env.LOCAL_DEV = origLocalDev;
	});

	it('leitura rejects local-token and mock-token when LOCAL_DEV is not true', async () => {
		delete process.env.LOCAL_DEV;
		for (const token of ['local-token', 'mock-token', 'Bearer local-token']) {
			const req = new Request('https://fn.local/contas', {
				method: 'GET',
				headers: { authorization: token.startsWith('Bearer') ? token : `Bearer ${token}` }
			});
			const res = await leituraHandler.fetch(req);
			expect(res.status).toBe(401);
		}
	});

	it('escrita rejects local-token and mock-token when LOCAL_DEV is not true', async () => {
		delete process.env.LOCAL_DEV;
		for (const token of ['local-token', 'mock-token']) {
			const req = new Request('https://fn.local/', {
				method: 'POST',
				headers: {
					authorization: `Bearer ${token}`,
					'content-type': 'application/json'
				},
				body: JSON.stringify({ op: 'atualizar_ai_subscription', provider_key: 'cursor' })
			});
			const res = await escritaHandler.fetch(req);
			expect(res.status).toBe(401);
		}
	});

	it('disallows localhost CORS origin when LOCAL_DEV is not true', async () => {
		delete process.env.LOCAL_DEV;
		const req = new Request('https://fn.local/contas', {
			method: 'OPTIONS',
			headers: { origin: 'http://localhost:5173' }
		});
		const resLeitura = await leituraHandler.fetch(req);
		expect(resLeitura.headers.get('access-control-allow-origin')).toBeNull();

		const resEscrita = await escritaHandler.fetch(req);
		expect(resEscrita.headers.get('access-control-allow-origin')).toBeNull();
	});

	it('allows localhost CORS origin when LOCAL_DEV is true', async () => {
		process.env.LOCAL_DEV = 'true';
		const req = new Request('https://fn.local/contas', {
			method: 'OPTIONS',
			headers: { origin: 'http://localhost:5173' }
		});
		const res = await leituraHandler.fetch(req);
		expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:5173');
	});

	it('escrita returns 400 for invalid op when LOCAL_DEV is true', async () => {
		process.env.LOCAL_DEV = 'true';
		const req = new Request('https://fn.local/', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ op: 'nonexistent_op' })
		});
		const res = await escritaHandler.fetch(req);
		expect(res.status).toBe(400);
	});
});

describe('log.ts privacy guard', () => {
	it('never leaks error message or stack contents in JSON logs', () => {
		const err = new TypeError('token=secret-jwt-123 user@example.com R$ 50000');
		const line = formatLine('error', 'api_fail', { route: '/ia', err });
		expect(line).not.toContain('secret-jwt-123');
		expect(line).not.toContain('user@example.com');
		expect(line).not.toContain('50000');
		const parsed = JSON.parse(line);
		expect(parsed.err).toEqual({ message: 'TypeError' });
	});
});
