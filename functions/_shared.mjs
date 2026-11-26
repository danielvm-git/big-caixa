import { createRemoteJWKSet, jwtVerify } from 'jose';
import { Pool } from 'pg';

const ORIGINS = new Set(
	[
		'https://big-caixa.bigbase.click',
		...(process.env.CAIXA_CORS_ORIGINS?.split(',').map((s) => s.trim()) ?? [])
	].filter(Boolean)
);

let _pool = null;
export function getPool(eventName = 'pool') {
	if (!_pool) {
		const connStr = process.env.DATABASE_URL;
		if (!connStr) {
			throw new Error('DATABASE_URL is required');
		}
		const isLocal = connStr.includes('localhost') || connStr.includes('127.0.0.1');
		_pool = new Pool({
			connectionString: connStr,
			max: 5,
			ssl: isLocal ? false : { rejectUnauthorized: true }
		});
		_pool.on('error', (err) => {
			const msg = String(err?.message ?? err).replace(
				/postgres(?:ql)?:\/\/\S+/gi,
				'postgresql://***'
			);
			console.error(JSON.stringify({ event: eventName, message: msg }));
		});
	}
	return _pool;
}

export const pool = {
	query: (...args) => getPool().query(...args),
	connect: (...args) => getPool().connect(...args),
	on: (...args) => getPool().on(...args)
};

let _hasCore = null;
export async function hasCoreSchema() {
	if (_hasCore === null) {
		const q = await pool.query(`SELECT to_regclass('core.journal_entry') IS NOT NULL AS ok`);
		_hasCore = Boolean(q.rows[0]?.ok);
	}
	return _hasCore;
}

export class ValidationError extends Error {
	constructor(message = 'invalid') {
		super(message);
		this.name = 'ValidationError';
	}
}

const jwksUrl = process.env.NEON_AUTH_JWKS_URL;
const authBase = process.env.NEON_AUTH_BASE_URL;
const jwks = jwksUrl ? createRemoteJWKSet(new URL(jwksUrl)) : null;
const issuer = authBase ? new URL(authBase).origin : null;

export function allowedOrigin(origin) {
	if (!origin) return null;
	if (ORIGINS.has(origin)) return origin;
	if (
		process.env.LOCAL_DEV === 'true' &&
		/^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)
	) {
		return origin;
	}
	return null;
}

export function createJsonResponder({ methods, cacheControl = 'no-store' }) {
	function headers(origin) {
		const allow = allowedOrigin(origin);
		const h = { 'content-type': 'application/json', 'cache-control': cacheControl };
		if (allow) {
			h['access-control-allow-origin'] = allow;
			h['access-control-allow-headers'] = 'authorization, content-type';
			h['access-control-allow-methods'] = methods;
			h.vary = 'Origin';
		}
		return h;
	}
	function json(status, body, origin) {
		return new Response(JSON.stringify(body), { status, headers: headers(origin) });
	}
	return { headers, json };
}

export async function userId(request) {
	if (process.env.LOCAL_DEV === 'true') {
		return 'local-user';
	}
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
