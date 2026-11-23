import { createRemoteJWKSet, jwtVerify } from 'jose';
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
const ANO = /^\d{4}$/;

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
			`SELECT periodo, nivel, origem, destino, valor::float8 AS valor, coalesce(tipo, '') AS tipo
			 FROM caixa.sankey_link
			 WHERE periodo = $1
			 ORDER BY nivel, ordem`,
			[periodo]
		);
		return q.rows;
	}
	if (colecao === 'compra') {
		const q = await pool.query(
			`SELECT c.id, c.data, c.loja, coalesce(c.titulo, c.descricao, '') AS titulo,
			        c.valor_total_centavos::float8 AS valor_total_centavos,
			        c.valor_pago_centavos::float8 AS valor_pago_centavos,
			        c.parcelas, c.parcelas_pagas, c.estornada, c.conta_id,
			        c.categoria_id, coalesce(c.escopo, '') AS escopo,
			        p.pessoa_id
			 FROM caixa.compra c
			 LEFT JOIN LATERAL (
			   SELECT l.pessoa_id
			   FROM caixa.compra_lancamento cl
			   JOIN caixa.fato_lancamento l ON l.id = cl.lancamento_id
			   WHERE cl.compra_id = c.id AND l.pessoa_id IS NOT NULL
			   GROUP BY l.pessoa_id
			   HAVING COUNT(DISTINCT l.pessoa_id) = 1
			 ) p ON true
			 ORDER BY c.data DESC`
		);
		return q.rows;
	}
	if (colecao === 'referencia') {
		if (!PERIODO.test(periodo ?? '')) return [];
		const q = await pool.query(
			`WITH gasto AS (
				SELECT coicop_codigo AS c,
				       (-SUM(valor_centavos) / 100.0)::float8 AS v,
				       COUNT(*)::int AS n
				FROM caixa.v_mov
				WHERE coicop_codigo IS NOT NULL
				  AND tipo IN ('despesa', 'investimento')
				  AND data_caixa LIKE $1 || '%'
				GROUP BY 1
			),
			por_div AS (
				SELECT split_part(c, '.', 1) AS div, SUM(v) AS v, SUM(n) AS n
				FROM gasto
				GROUP BY 1
			)
			SELECT r.codigo, r.nome_pt, r.bloco_503020,
			       coalesce(p.v, 0)::float8 AS total,
			       coalesce(p.n, 0)::int AS n
			FROM caixa.ref_coicop r
			LEFT JOIN por_div p ON p.div = r.codigo
			WHERE r.nivel = 'divisao'
			ORDER BY r.codigo`,
			[periodo]
		);
		return q.rows;
	}
	if (colecao === 'regras') {
		const q = await pool.query(
			`SELECT r.id, r.prioridade, r.padrao_regex, r.padrao_cat_banco, r.conta_id,
			        r.sinal, r.tipo, r.escopo, r.categoria_id, r.extraordinario, r.nota,
			        r.ativa,
			        (SELECT COUNT(*)::int FROM caixa.fato_lancamento l WHERE l.regra_id = r.id) AS usos
			 FROM caixa.regra_categorizacao r
			 ORDER BY r.prioridade`
		);
		return q.rows;
	}
	if (colecao === 'viagens') {
		const q = await pool.query(
			`SELECT v.id, v.chave, v.nome, v.destino, v.ida, v.volta, v.nota,
			        v.margem, v.empresa,
			        coalesce(json_agg(vc.compra_id) FILTER (WHERE vc.compra_id IS NOT NULL), '[]') AS compra_ids
			 FROM caixa.viagem v
			 LEFT JOIN caixa.viagem_compra vc ON vc.viagem_id = v.id
			 GROUP BY v.id
			 ORDER BY v.ida DESC`
		);
		return q.rows;
	}
	if (colecao === 'ferias') {
		const q = await pool.query(
			`SELECT id, chave, inicio, fim, coalesce(grupo, '') AS grupo, inferido, coalesce(nota, '') AS nota
			 FROM caixa.ferias
			 ORDER BY inicio DESC`
		);
		return q.rows;
	}
	if (colecao === 'importacoes') {
		const q = await pool.query(
			`SELECT id, fonte, arquivo, importado_em, linhas_lidas, linhas_novas
			 FROM caixa.importacao
			 ORDER BY importado_em DESC
			 LIMIT 80`
		);
		return q.rows;
	}
	if (colecao === 'faturas') {
		const q = await pool.query(
			`SELECT competencia, conta_id
			 FROM caixa.fatura_cartao
			 WHERE detalhada = 0
			 ORDER BY competencia DESC`
		);
		return q.rows;
	}
	if (colecao === 'pendencias') {
		const ano = ANO.test(periodo ?? '') ? periodo : (periodo ?? '').slice(0, 4);
		if (!ANO.test(ano ?? '')) return [];
		const prefix = ano + '%';
		const [semRegra, faturas, transferencias] = await Promise.all([
			pool.query(
				`SELECT COUNT(*)::int AS n,
				        (coalesce(SUM(-valor_centavos), 0) / 100.0)::float8 AS v
				 FROM caixa.fato_lancamento
				 WHERE regra_id IS NULL AND manual = 0 AND sintetico = 0
				   AND tipo = 'despesa' AND data_caixa LIKE $1`,
				[prefix]
			),
			pool.query(`SELECT COUNT(*)::int AS n FROM caixa.fatura_cartao WHERE detalhada = 0`),
			pool.query(
				`SELECT COUNT(*)::int AS n FROM caixa.v_transferencia_sem_par WHERE data_caixa LIKE $1`,
				[prefix]
			)
		]);
		return [
			{
				sem_regra_n: semRegra.rows[0]?.n ?? 0,
				sem_regra_v: semRegra.rows[0]?.v ?? 0,
				faturas_n: faturas.rows[0]?.n ?? 0,
				transferencias_n: transferencias.rows[0]?.n ?? 0,
				ano
			}
		];
	}
	if (colecao === 'pessoas') {
		const q = await pool.query(
			`SELECT p.id, p.nome, coalesce(p.relacao, '') AS relacao,
			        coalesce(p.apelido, '') AS apelido,
			        coalesce(p.circulo, '') AS circulo,
			        coalesce(p.aniversario, '') AS aniversario,
			        coalesce(p.visibilidade, 'familia') AS visibilidade,
			        coalesce(
			          (SELECT json_agg(a.alias ORDER BY a.alias)
			           FROM caixa.dim_pessoa_alias a WHERE a.pessoa_id = p.id),
			          '[]'
			        ) AS aliases
			 FROM caixa.dim_pessoa p
			 ORDER BY coalesce(p.circulo, ''), p.nome`
		);
		return q.rows;
	}
	if (colecao === 'lugares') {
		const q = await pool.query(
			`SELECT id, nome, coalesce(tipo, 'outro') AS tipo FROM caixa.dim_lugar ORDER BY nome`
		);
		return q.rows;
	}
	if (colecao === 'vinculos') {
		const q = await pool.query(
			`SELECT id, tipo, de_pessoa_id, para_pessoa_id, compra_id,
			        valor_centavos::float8 AS valor_centavos,
			        parcelas, juros_pct::float8 AS juros_pct, prazo, status, coalesce(nota, '') AS nota
			 FROM caixa.fato_vinculo ORDER BY criado_em DESC`
		);
		return q.rows;
	}
	if (colecao === 'contratos') {
		const q = await pool.query(
			`SELECT id, pessoa_id, coalesce(regime, '') AS regime,
			        salario_centavos::float8 AS salario_centavos,
			        inss_patronal_pct::float8 AS inss_patronal_pct,
			        fgts_pct::float8 AS fgts_pct,
			        vt_centavos::float8 AS vt_centavos,
			        coalesce(banco_pagador, '') AS banco_pagador,
			        coalesce(inicio, '') AS inicio, ativo
			 FROM caixa.dim_contrato WHERE ativo = 1 ORDER BY inicio DESC`
		);
		return q.rows;
	}
	if (colecao === 'contas') {
		const q = await pool.query(
			`SELECT id, nome, instituicao, tipo, escopo_padrao
			 FROM caixa.dim_conta
			 WHERE ativa = 1 AND tipo != 'cartao_final'
			 ORDER BY tipo, nome`
		);
		return q.rows;
	}
	if (colecao === 'blocos') {
		const q = await pool.query(
			`SELECT id, nome, meta_pct::float8 AS meta_pct, tipo_meta, coalesce(cor, '') AS cor
			 FROM caixa.ref_bloco
			 ORDER BY meta_pct DESC`
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
