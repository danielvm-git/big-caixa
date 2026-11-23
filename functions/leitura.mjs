import { createRemoteJWKSet, jwtVerify } from 'jose';
import { Pool } from 'pg';

const ORIGINS = new Set(['https://big-caixa.bigbase.click']);

const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	max: 5,
	ssl: { rejectUnauthorized: false }
});
pool.on('error', (err) => {
	const msg = String(err?.message ?? err).replace(/postgres(?:ql)?:\/\/\S+/gi, 'postgresql://***');
	console.error(JSON.stringify({ event: 'pool', message: msg }));
});

const jwksUrl = process.env.NEON_AUTH_JWKS_URL;
const authBase = process.env.NEON_AUTH_BASE_URL;
const jwks = jwksUrl ? createRemoteJWKSet(new URL(jwksUrl)) : null;
const issuer = authBase ? new URL(authBase).origin : null;

function allowedOrigin(origin) {
	if (!origin) return null;
	if (ORIGINS.has(origin)) return origin;
	if (/^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return origin;
	return null;
}

function headers(origin) {
	const allow = allowedOrigin(origin);
	const h = { 'content-type': 'application/json', 'cache-control': 'private, no-store' };
	if (allow) {
		h['access-control-allow-origin'] = allow;
		h['access-control-allow-headers'] = 'authorization, content-type';
		h['access-control-allow-methods'] = 'GET, OPTIONS';
		h.vary = 'Origin';
	}
	return h;
}

function json(status, body, origin) {
	return new Response(JSON.stringify(body), { status, headers: headers(origin) });
}

async function userId(request) {
	const auth = request.headers.get('authorization') ?? '';
	if (!auth.toLowerCase().startsWith('bearer ') || !jwks || !issuer) return null;
	try {
		const { payload } = await jwtVerify(auth.slice(7).trim(), jwks, {
			algorithms: ['EdDSA'],
			issuer,
			audience: issuer
		});
		return typeof payload.sub === 'string' ? payload.sub : null;
	} catch {
		return null;
	}
}

const PERIODO = /^\d{4}-\d{2}$/;

async function rows(colecao, periodo) {
	if (colecao === 'mes') {
		if (!PERIODO.test(periodo ?? '')) return [];
		const q = await pool.query(
			`SELECT mes, escopo, categoria_id,
			        custo_recorrente::float8 AS custo_recorrente,
			        custo_extraordinario::float8 AS custo_extraordinario
			 FROM caixa.v_custo_mensal
			 WHERE mes = $1`,
			[periodo]
		);
		return q.rows;
	}
	if (colecao === 'sankey') {
		if (!PERIODO.test(periodo ?? '')) return [];
		const q = await pool.query(
			`SELECT periodo, nivel, origem, destino, valor::float8 AS valor
			 FROM caixa.sankey_link
			 WHERE periodo = $1
			 ORDER BY nivel, ordem`,
			[periodo]
		);
		return q.rows;
	}
	if (colecao === 'compra') {
		const q = await pool.query(
			`SELECT id, data, loja, titulo, valor_total_centavos::float8 AS valor_total_centavos,
			        categoria_id, coalesce(escopo, '') AS escopo
			 FROM caixa.compra
			 ORDER BY data DESC`
		);
		return q.rows;
	}
	return null;
}

const handler = {
	async fetch(request) {
		const origin = request.headers.get('origin');
		if (request.method === 'OPTIONS') {
			return new Response(null, { status: 204, headers: headers(origin) });
		}
		if (request.method !== 'GET') return json(405, { error: 'method' }, origin);
		const url = new URL(request.url, 'https://fn.local');
		const parts = url.pathname.split('/').filter(Boolean);
		const colecao = parts[0] ?? '';
		const periodo = parts[1] ?? null;
		if (!(await userId(request))) return json(401, { error: 'unauthorized' }, origin);
		const data = await rows(colecao, periodo);
		if (data == null) return json(404, { error: 'unknown' }, origin);
		return json(200, { data }, origin);
	}
};

export default handler;
