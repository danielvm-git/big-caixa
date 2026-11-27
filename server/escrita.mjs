// Escrita no livro-caixa (SQLite). Porta de functions/escrita.mjs (Neon/Postgres):
// mesmas operações e mesmos campos. Só o ramo sem schema `core` existia em produção.
import { randomUUID } from 'node:crypto';

export class ValidationError extends Error {
	constructor(message = 'invalid') {
		super(message);
		this.name = 'ValidationError';
	}
}

/** @typedef {import('node:sqlite').DatabaseSync} Db */

/**
 * Roda fn numa transação; desfaz tudo se ela lançar.
 * @template T
 * @param {Db} db
 * @param {() => T} fn
 * @returns {T}
 */
function tx(db, fn) {
	db.exec('BEGIN IMMEDIATE');
	try {
		const out = fn();
		db.exec('COMMIT');
		return out;
	} catch (err) {
		db.exec('ROLLBACK');
		throw err;
	}
}

/**
 * Valor de um campo do corpo, no formato que o SQLite aceita.
 * @param {unknown} x
 * @returns {string | number | null}
 */
function v(x) {
	if (x === undefined || x === null) return null;
	if (typeof x === 'boolean') return x ? 1 : 0;
	if (typeof x === 'string' || typeof x === 'number') return x;
	throw new ValidationError('invalid');
}

/**
 * @param {Db} db
 * @param {any} body
 */
export function handle(db, body) {
	const op = body?.op;
	if (op === 'upsert_pessoa') {
		const { id, nome, relacao, apelido, circulo, aniversario, visibilidade } = body;
		if (!id || !nome) throw new ValidationError('invalid');
		tx(db, () => {
			db.prepare(
				`INSERT INTO dim_pessoa (id, nome, relacao, apelido, circulo, aniversario, visibilidade)
				 VALUES (?, ?, ?, ?, ?, ?, coalesce(?, 'familia'))
				 ON CONFLICT (id) DO UPDATE SET
				   nome = excluded.nome,
				   relacao = excluded.relacao,
				   apelido = excluded.apelido,
				   circulo = excluded.circulo,
				   aniversario = excluded.aniversario,
				   visibilidade = excluded.visibilidade`
			).run(v(id), v(nome), v(relacao), v(apelido), v(circulo), v(aniversario), v(visibilidade));
			if (Array.isArray(body.aliases)) {
				db.prepare(`DELETE FROM dim_pessoa_alias WHERE pessoa_id = ?`).run(v(id));
				const ins = db.prepare(
					`INSERT INTO dim_pessoa_alias (pessoa_id, alias) VALUES (?, ?) ON CONFLICT DO NOTHING`
				);
				for (const alias of body.aliases) {
					if (typeof alias === 'string' && alias.trim()) ins.run(v(id), alias.trim());
				}
			}
		});
		return { id };
	}
	if (op === 'upsert_lugar') {
		const { id, nome, tipo } = body;
		const lid = id || randomUUID();
		if (!nome) throw new ValidationError('invalid');
		db.prepare(
			`INSERT INTO dim_lugar (id, nome, tipo) VALUES (?, ?, coalesce(?, 'outro'))
			 ON CONFLICT (id) DO UPDATE SET nome = excluded.nome, tipo = excluded.tipo`
		).run(v(lid), v(nome), v(tipo));
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
		db.prepare(
			`INSERT INTO fato_vinculo
			 (id, tipo, de_pessoa_id, para_pessoa_id, compra_id, valor_centavos, parcelas, juros_pct, prazo, nota, conta_codigo)
			 VALUES (?, ?, ?, ?, ?, coalesce(?, 0), ?, ?, ?, ?, ?)`
		).run(
			v(id),
			v(tipo),
			v(de_pessoa_id),
			v(para_pessoa_id),
			v(compra_id),
			v(valor_centavos) ?? 0,
			v(parcelas),
			v(juros_pct),
			v(prazo),
			v(nota),
			v(conta_codigo)
		);
		return { id };
	}
	if (op === 'vincular_compra') {
		const { compra_id, pessoa_id } = body;
		if (!compra_id || !pessoa_id) throw new ValidationError('invalid');
		db.prepare(
			`UPDATE fato_lancamento SET pessoa_id = ?
			 WHERE id IN (SELECT lancamento_id FROM compra_lancamento WHERE compra_id = ?)`
		).run(v(pessoa_id), v(compra_id));
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
		db.prepare(
			`INSERT INTO dim_contrato
			 (id, pessoa_id, regime, salario_centavos, inss_patronal_pct, fgts_pct, vt_centavos, banco_pagador, inicio)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
			 ON CONFLICT (id) DO UPDATE SET
			   regime = excluded.regime,
			   salario_centavos = excluded.salario_centavos,
			   inss_patronal_pct = excluded.inss_patronal_pct,
			   fgts_pct = excluded.fgts_pct,
			   vt_centavos = excluded.vt_centavos,
			   banco_pagador = excluded.banco_pagador,
			   inicio = excluded.inicio`
		).run(
			v(cid),
			v(pessoa_id),
			v(regime),
			v(salario_centavos),
			v(inss_patronal_pct),
			v(fgts_pct),
			v(vt_centavos),
			v(banco_pagador),
			v(inicio)
		);
		return { id: cid };
	}
	if (op === 'reclassificar_entrada') {
		const { transacao_id, conta_codigo } = body;
		if (!transacao_id || !conta_codigo) throw new ValidationError('invalid');
		const res = db
			.prepare(
				`UPDATE fato_lancamento SET categoria_id = ?2, manual = 1
				 WHERE CAST(id AS TEXT) = ?1 AND tipo = 'receita'
				   AND EXISTS (SELECT 1 FROM dim_categoria c WHERE c.id = ?2)`
			)
			.run(String(v(transacao_id)), v(conta_codigo));
		return { ok: true, count: Number(res.changes) };
	}
	if (op === 'atualizar_ai_subscription') {
		const { provider_key, balance_usd, month_spent_usd, renewal_date, plan_name, cost_usd } = body;
		if (!provider_key) throw new ValidationError('missing provider_key');
		db.prepare(
			`UPDATE dim_ai_subscription
			 SET balance_usd = coalesce(?2, balance_usd),
			     month_spent_usd = coalesce(?3, month_spent_usd),
			     renewal_date = coalesce(?4, renewal_date),
			     plan_name = coalesce(?5, plan_name),
			     cost_usd = coalesce(?6, cost_usd),
			     cost_brl = coalesce(?6 * 6.0, cost_brl),
			     updated_at = CURRENT_TIMESTAMP
			 WHERE provider_key = ?1`
		).run(
			v(provider_key),
			v(balance_usd),
			v(month_spent_usd),
			v(renewal_date),
			v(plan_name),
			v(cost_usd)
		);
		return { ok: true };
	}
	throw new ValidationError('unknown op');
}
