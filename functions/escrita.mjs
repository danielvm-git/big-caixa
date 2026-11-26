import { randomUUID } from 'node:crypto';
import { ValidationError, createJsonResponder, hasCoreSchema, pool, userId } from './_shared.mjs';

const { headers, json } = createJsonResponder({
	methods: 'POST, OPTIONS',
	cacheControl: 'no-store'
});

async function handle(body) {
	const op = body?.op;
	if (op === 'upsert_pessoa') {
		const { id, nome, relacao, apelido, circulo, aniversario, visibilidade } = body;
		if (!id || !nome) throw new ValidationError('invalid');
		const client = await pool.connect();
		try {
			await client.query('BEGIN');
			await client.query(
				`INSERT INTO caixa.dim_pessoa (id, nome, relacao, apelido, circulo, aniversario, visibilidade)
				 VALUES ($1,$2,$3,$4,$5,$6,coalesce($7,'familia'))
				 ON CONFLICT (id) DO UPDATE SET
				   nome = EXCLUDED.nome,
				   relacao = EXCLUDED.relacao,
				   apelido = EXCLUDED.apelido,
				   circulo = EXCLUDED.circulo,
				   aniversario = EXCLUDED.aniversario,
				   visibilidade = EXCLUDED.visibilidade`,
				[
					id,
					nome,
					relacao ?? null,
					apelido ?? null,
					circulo ?? null,
					aniversario ?? null,
					visibilidade
				]
			);
			if (Array.isArray(body.aliases)) {
				await client.query(`DELETE FROM caixa.dim_pessoa_alias WHERE pessoa_id = $1`, [id]);
				for (const alias of body.aliases) {
					if (typeof alias === 'string' && alias.trim())
						await client.query(
							`INSERT INTO caixa.dim_pessoa_alias (pessoa_id, alias) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
							[id, alias.trim()]
						);
				}
			}
			await client.query('COMMIT');
		} catch (err) {
			await client.query('ROLLBACK').catch(() => {});
			throw err;
		} finally {
			client.release();
		}
		return { id };
	}
	if (op === 'upsert_lugar') {
		const { id, nome, tipo } = body;
		const lid = id || randomUUID();
		if (!nome) throw new ValidationError('invalid');
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
			nota,
			conta_codigo
		} = body;
		if (!tipo || !de_pessoa_id || !para_pessoa_id) throw new ValidationError('invalid');
		const id = body.id || randomUUID();
		await pool.query(
			`INSERT INTO caixa.fato_vinculo
			 (id, tipo, de_pessoa_id, para_pessoa_id, compra_id, valor_centavos, parcelas, juros_pct, prazo, nota, conta_codigo)
			 VALUES ($1,$2,$3,$4,$5,coalesce($6,0),$7,$8,$9,$10,$11)`,
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
				nota ?? null,
				conta_codigo ?? null
			]
		);
		return { id };
	}
	if (op === 'vincular_compra') {
		const { compra_id, pessoa_id } = body;
		if (!compra_id || !pessoa_id) throw new ValidationError('invalid');
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
		if (!pessoa_id) throw new ValidationError('invalid');
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
	if (op === 'reclassificar_entrada') {
		const { transacao_id, conta_codigo } = body;
		if (!transacao_id || !conta_codigo) throw new ValidationError('invalid');
		if (!(await hasCoreSchema())) {
			const res = await pool.query(
				`UPDATE caixa.fato_lancamento l
				 SET categoria_id = c.id, manual = 1
				 FROM caixa.dim_categoria c
				 WHERE l.id::text = $1
				   AND l.tipo = 'receita'
				   AND c.id = $2`,
				[String(transacao_id), conta_codigo]
			);
			return { ok: true, count: res.rowCount };
		}
		const res = await pool.query(
			`UPDATE core.journal_entry j
			 SET account_id = a_new.id
			 FROM core.account a_old, core.account a_new
			 WHERE j.transaction_id = $1
			   AND j.account_id = a_old.id
			   AND a_old.account_group = 'Revenues'
			   AND a_new.code = $2
			   AND a_new.account_group = 'Revenues'`,
			[transacao_id, conta_codigo]
		);
		if (res.rowCount > 0) {
			await pool
				.query(
					`UPDATE raw.legacy_fato_lancamento l
					 SET categoria_id = (SELECT legacy_cat_id FROM core.account WHERE code = $2 AND account_group = 'Revenues')
					 WHERE l.id = $1::text`,
					[transacao_id, conta_codigo]
				)
				.catch(() => {});
		}
		return { ok: true, count: res.rowCount };
	}
	if (op === 'atualizar_ai_subscription') {
		const { provider_key, balance_usd, month_spent_usd, renewal_date, plan_name, cost_usd } = body;
		if (!provider_key) throw new ValidationError('missing provider_key');
		await pool.query(
			`UPDATE caixa.dim_ai_subscription
			 SET balance_usd = COALESCE($2, balance_usd),
			     month_spent_usd = COALESCE($3, month_spent_usd),
			     renewal_date = COALESCE($4, renewal_date),
			     plan_name = COALESCE($5, plan_name),
			     cost_usd = COALESCE($6, cost_usd),
			     cost_brl = COALESCE($6 * 6.0, cost_brl),
			     updated_at = NOW()
			 WHERE provider_key = $1`,
			[
				provider_key,
				balance_usd ?? null,
				month_spent_usd ?? null,
				renewal_date ?? null,
				plan_name ?? null,
				cost_usd ?? null
			]
		);
		return { ok: true };
	}
	throw new ValidationError('unknown op');
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
		} catch (err) {
			if (err instanceof ValidationError) {
				return json(400, { error: 'invalid' }, origin);
			}
			const msg = String(err?.name ?? 'Error');
			console.error(
				JSON.stringify({ event: 'escrita_error', op: String(body?.op ?? ''), error: msg })
			);
			return json(500, { error: 'internal' }, origin);
		}
	}
};

export default handler;
