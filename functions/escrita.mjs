import { createRemoteJWKSet, jwtVerify } from 'jose';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';

const ORIGINS = new Set(
	[
		'https://big-caixa.bigbase.click',
		...(process.env.CAIXA_CORS_ORIGINS?.split(',').map((s) => s.trim()) ?? [])
	].filter(Boolean)
);

const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	max: 5,
	ssl: { rejectUnauthorized: false }
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
	const h = { 'content-type': 'application/json', 'cache-control': 'no-store' };
	if (allow) {
		h['access-control-allow-origin'] = allow;
		h['access-control-allow-headers'] = 'authorization, content-type';
		h['access-control-allow-methods'] = 'POST, OPTIONS';
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

async function handle(body) {
	const op = body?.op;
	if (op === 'upsert_pessoa') {
		const { id, nome, relacao, apelido, circulo, aniversario, visibilidade } = body;
		if (!id || !nome) throw new Error('invalid');
		await pool.query(
			`INSERT INTO caixa.dim_pessoa (id, nome, relacao, apelido, circulo, aniversario, visibilidade)
			 VALUES ($1,$2,$3,$4,$5,$6,coalesce($7,'familia'))
			 ON CONFLICT (id) DO UPDATE SET
			   nome = EXCLUDED.nome,
			   relacao = EXCLUDED.relacao,
			   apelido = EXCLUDED.apelido,
			   circulo = EXCLUDED.circulo,
			   aniversario = EXCLUDED.aniversario,
			   visibilidade = EXCLUDED.visibilidade`,
			[id, nome, relacao ?? null, apelido ?? null, circulo ?? null, aniversario ?? null, visibilidade]
		);
		if (Array.isArray(body.aliases)) {
			await pool.query(`DELETE FROM caixa.dim_pessoa_alias WHERE pessoa_id = $1`, [id]);
			for (const alias of body.aliases) {
				if (typeof alias === 'string' && alias.trim())
					await pool.query(
						`INSERT INTO caixa.dim_pessoa_alias (pessoa_id, alias) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
						[id, alias.trim()]
					);
			}
		}
		return { id };
	}
	if (op === 'upsert_lugar') {
		const { id, nome, tipo } = body;
		const lid = id || randomUUID();
		if (!nome) throw new Error('invalid');
		await pool.query(
			`INSERT INTO caixa.dim_lugar (id, nome, tipo) VALUES ($1,$2,coalesce($3,'outro'))
			 ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, tipo = EXCLUDED.tipo`,
			[lid, nome, tipo]
		);
		return { id: lid };
	}
	if (op === 'criar_vinculo') {
		const {
			tipo,
			de_pessoa_id,
			para_pessoa_id,
			compra_id,
			valor_centavos,
			parcelas,
			juros_pct,
			prazo,
			nota
		} = body;
		if (!tipo || !de_pessoa_id || !para_pessoa_id) throw new Error('invalid');
		const id = body.id || randomUUID();
		await pool.query(
			`INSERT INTO caixa.fato_vinculo
			 (id, tipo, de_pessoa_id, para_pessoa_id, compra_id, valor_centavos, parcelas, juros_pct, prazo, nota)
			 VALUES ($1,$2,$3,$4,$5,coalesce($6,0),$7,$8,$9,$10)`,
			[
				id,
				tipo,
				de_pessoa_id,
				para_pessoa_id,
				compra_id ?? null,
				valor_centavos ?? 0,
				parcelas ?? null,
				juros_pct ?? null,
				prazo ?? null,
				nota ?? null
			]
		);
		return { id };
	}
	if (op === 'vincular_compra') {
		const { compra_id, pessoa_id } = body;
		if (!compra_id || !pessoa_id) throw new Error('invalid');
		await pool.query(
			`UPDATE caixa.fato_lancamento l
			 SET pessoa_id = $2
			 FROM caixa.compra_lancamento cl
			 WHERE cl.compra_id = $1 AND cl.lancamento_id = l.id`,
			[compra_id, pessoa_id]
		);
		return { ok: true };
	}
	if (op === 'upsert_contrato') {
		const {
			id,
			pessoa_id,
			regime,
			salario_centavos,
			inss_patronal_pct,
			fgts_pct,
			vt_centavos,
			banco_pagador,
			inicio
		} = body;
		const cid = id || randomUUID();
		if (!pessoa_id) throw new Error('invalid');
		await pool.query(
			`INSERT INTO caixa.dim_contrato
			 (id, pessoa_id, regime, salario_centavos, inss_patronal_pct, fgts_pct, vt_centavos, banco_pagador, inicio)
			 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
			 ON CONFLICT (id) DO UPDATE SET
			   regime = EXCLUDED.regime,
			   salario_centavos = EXCLUDED.salario_centavos,
			   inss_patronal_pct = EXCLUDED.inss_patronal_pct,
			   fgts_pct = EXCLUDED.fgts_pct,
			   vt_centavos = EXCLUDED.vt_centavos,
			   banco_pagador = EXCLUDED.banco_pagador,
			   inicio = EXCLUDED.inicio`,
			[
				cid,
				pessoa_id,
				regime ?? null,
				salario_centavos ?? null,
				inss_patronal_pct ?? null,
				fgts_pct ?? null,
				vt_centavos ?? null,
				banco_pagador ?? null,
				inicio ?? null
			]
		);
		return { id: cid };
	}
	throw new Error('unknown op');
}

const handler = {
	async fetch(request) {
		const origin = request.headers.get('origin');
		if (request.method === 'OPTIONS') {
			return new Response(null, { status: 204, headers: headers(origin) });
		}
		if (request.method !== 'POST') return json(405, { error: 'method' }, origin);
		if (!(await userId(request))) return json(401, { error: 'unauthorized' }, origin);
		let body;
		try {
			body = await request.json();
		} catch {
			return json(400, { error: 'json' }, origin);
		}
		try {
			const result = await handle(body);
			return json(200, result, origin);
		} catch {
			return json(400, { error: 'invalid' }, origin);
		}
	}
};

export default handler;