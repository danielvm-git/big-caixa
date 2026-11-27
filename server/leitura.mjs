// Leitura do livro-caixa (SQLite). Porta de functions/leitura.mjs (Neon/Postgres):
// mesmas coleções, mesmos nomes de campos. Só o ramo sem schema `core` existia em
// produção, então só ele foi portado. Os ORDER BY ganharam desempate (id etc.): no
// Postgres a ordem entre empates era arbitrária, e o LIMIT de importações pegava
// linhas diferentes a cada vez.

/** @typedef {import('node:sqlite').DatabaseSync} Db */
/** @typedef {Record<string, any>} Row */

const PERIODO = /^\d{4}-\d{2}$/;
const ANO = /^\d{4}$/;

/**
 * Colunas que o SQLite devolve como texto JSON e o cliente espera como array.
 * @param {Row[]} rows
 * @param {string[]} fields
 */
function parseJson(rows, fields) {
	for (const r of rows) {
		for (const f of fields) {
			if (typeof r[f] === 'string') r[f] = JSON.parse(r[f]);
			else if (r[f] == null) r[f] = [];
		}
	}
	return rows;
}

/** @type {(db: Db, sql: string, ...params: any[]) => Row[]} */
const all = (db, sql, ...params) => /** @type {Row[]} */ (db.prepare(sql).all(...params));

const SQL_MES = `
	SELECT mes, escopo, categoria_id,
	       CAST(custo_recorrente AS REAL) AS custo_recorrente,
	       CAST(custo_extraordinario AS REAL) AS custo_extraordinario
	FROM v_custo_mensal`;

const SQL_SANKEY = `
	SELECT periodo, nivel, origem, destino, CAST(valor AS REAL) AS valor, coalesce(tipo, '') AS tipo
	FROM sankey_link`;

/**
 * @param {Db} db
 * @param {string} colecao
 * @param {string | null} periodo
 * @returns {any}
 */
export function rows(db, colecao, periodo) {
	if (colecao === 'mes') {
		if (!PERIODO.test(periodo ?? '')) return [];
		return all(db, `${SQL_MES} WHERE mes = ?`, periodo);
	}
	if (colecao === 'sankey') {
		if (!PERIODO.test(periodo ?? '')) return [];
		return all(
			db,
			`${SQL_SANKEY} WHERE periodo = ? ORDER BY nivel, ordem, origem, destino`,
			periodo
		);
	}
	if (colecao === 'compra') {
		// Igual ao LEFT JOIN LATERAL original: uma linha por pessoa distinta ligada à compra.
		return all(
			db,
			`SELECT c.id, c.data, c.loja, coalesce(c.titulo, c.descricao, '') AS titulo,
			        CAST(c.valor_total_centavos AS REAL) AS valor_total_centavos,
			        CAST(c.valor_pago_centavos AS REAL) AS valor_pago_centavos,
			        c.parcelas, c.parcelas_pagas, c.estornada, c.conta_id,
			        c.categoria_id, coalesce(c.escopo, '') AS escopo,
			        p.pessoa_id
			 FROM compra c
			 LEFT JOIN (
			   SELECT DISTINCT cl.compra_id, l.pessoa_id
			   FROM compra_lancamento cl
			   JOIN fato_lancamento l ON l.id = cl.lancamento_id
			   WHERE l.pessoa_id IS NOT NULL
			 ) p ON p.compra_id = c.id
			 ORDER BY c.data DESC, c.id, p.pessoa_id`
		);
	}
	if (colecao === 'referencia') {
		if (!PERIODO.test(periodo ?? '')) return [];
		return all(
			db,
			`WITH gasto AS (
				SELECT coicop_codigo AS c,
				       -SUM(valor_centavos) / 100.0 AS v,
				       COUNT(*) AS n
				FROM v_mov
				WHERE coicop_codigo IS NOT NULL
				  AND tipo IN ('despesa', 'investimento')
				  AND data_caixa LIKE ? || '%'
				GROUP BY 1
			),
			por_div AS (
				SELECT CASE WHEN instr(c, '.') > 0 THEN substr(c, 1, instr(c, '.') - 1) ELSE c END AS div,
				       SUM(v) AS v, SUM(n) AS n
				FROM gasto
				GROUP BY 1
			)
			SELECT r.codigo, r.nome_pt, r.bloco_503020,
			       CAST(coalesce(p.v, 0) AS REAL) AS total,
			       CAST(coalesce(p.n, 0) AS INTEGER) AS n
			FROM ref_coicop r
			LEFT JOIN por_div p ON p.div = r.codigo
			WHERE r.nivel = 'divisao'
			ORDER BY r.codigo`,
			periodo
		);
	}
	if (colecao === 'regras') {
		return all(
			db,
			`SELECT r.id, r.prioridade, r.padrao_regex, r.padrao_cat_banco, r.conta_id,
			        r.sinal, r.tipo, r.escopo, r.categoria_id, r.extraordinario, r.nota,
			        r.ativa,
			        (SELECT COUNT(*) FROM fato_lancamento l WHERE l.regra_id = r.id) AS usos
			 FROM regra_categorizacao r
			 ORDER BY r.prioridade`
		);
	}
	if (colecao === 'viagens') {
		return parseJson(
			all(
				db,
				`SELECT v.id, v.chave, v.nome, v.destino, v.ida, v.volta, v.nota,
				        v.margem, v.empresa,
				        CAST(coalesce(sum(c.valor_total_centavos) / 100.0, 0) AS REAL) AS total_gasto,
				        json_group_array(json_object('id', c.id, 'data', c.data, 'loja', c.loja,
				          'titulo', c.titulo, 'valor', c.valor_total_centavos / 100.0))
				          FILTER (WHERE c.id IS NOT NULL) AS compras,
				        json_group_array(vc.compra_id) FILTER (WHERE vc.compra_id IS NOT NULL) AS compra_ids
				 FROM viagem v
				 LEFT JOIN viagem_compra vc ON vc.viagem_id = v.id
				 LEFT JOIN compra c ON c.id = vc.compra_id
				 GROUP BY v.id
				 ORDER BY v.ida DESC`
			),
			['compras', 'compra_ids']
		);
	}
	if (colecao === 'ferias') {
		return all(
			db,
			`SELECT id, chave, inicio, fim, coalesce(grupo, '') AS grupo, inferido, coalesce(nota, '') AS nota
			 FROM ferias
			 ORDER BY inicio DESC`
		);
	}
	if (colecao === 'importacoes') {
		return all(
			db,
			`SELECT id, fonte, arquivo, importado_em, linhas_lidas, linhas_novas
			 FROM importacao
			 ORDER BY importado_em DESC, id DESC
			 LIMIT 80`
		);
	}
	if (colecao === 'faturas') {
		return all(
			db,
			`SELECT competencia, conta_id FROM fatura_cartao WHERE detalhada = 0 ORDER BY competencia DESC`
		);
	}
	if (colecao === 'pendencias') {
		const ano = ANO.test(periodo ?? '') ? periodo : (periodo ?? '').slice(0, 4);
		if (!ANO.test(ano ?? '')) return [];
		const prefix = ano + '%';
		const semRegra = db
			.prepare(
				`SELECT COUNT(*) AS n, CAST(coalesce(SUM(-valor_centavos), 0) / 100.0 AS REAL) AS v
				 FROM fato_lancamento
				 WHERE regra_id IS NULL AND manual = 0 AND sintetico = 0
				   AND tipo = 'despesa' AND data_caixa LIKE ?`
			)
			.get(prefix);
		const faturas = db.prepare(`SELECT COUNT(*) AS n FROM fatura_cartao WHERE detalhada = 0`).get();
		const transf = db
			.prepare(`SELECT COUNT(*) AS n FROM v_transferencia_sem_par WHERE data_caixa LIKE ?`)
			.get(prefix);
		return [
			{
				sem_regra_n: semRegra?.n ?? 0,
				sem_regra_v: semRegra?.v ?? 0,
				faturas_n: faturas?.n ?? 0,
				transferencias_n: transf?.n ?? 0,
				ano
			}
		];
	}
	if (colecao === 'pessoas') {
		return parseJson(
			all(
				db,
				`SELECT p.id, p.nome, coalesce(p.relacao, '') AS relacao,
				        coalesce(p.apelido, '') AS apelido,
				        coalesce(p.circulo, '') AS circulo,
				        coalesce(p.aniversario, '') AS aniversario,
				        coalesce(p.visibilidade, 'familia') AS visibilidade,
				        (SELECT json_group_array(alias)
				           FROM (SELECT a.alias FROM dim_pessoa_alias a
				                 WHERE a.pessoa_id = p.id ORDER BY a.alias)) AS aliases
				 FROM dim_pessoa p
				 ORDER BY coalesce(p.circulo, ''), p.nome`
			),
			['aliases']
		);
	}
	if (colecao === 'lugares') {
		return all(db, `SELECT id, nome, coalesce(tipo, 'outro') AS tipo FROM dim_lugar ORDER BY nome`);
	}
	if (colecao === 'vinculos') {
		return parseJson(
			all(
				db,
				`SELECT v.id, v.tipo, v.de_pessoa_id, v.para_pessoa_id,
				        coalesce(p.nome, v.para_pessoa_id) AS para_pessoa_nome,
				        coalesce(p.relacao, 'outro') AS para_pessoa_relacao,
				        v.compra_id,
				        v.valor_centavos / 100.0 AS valor_original,
				        CAST(v.valor_centavos AS REAL) AS valor_centavos,
				        v.parcelas,
				        CAST(v.juros_pct AS REAL) AS juros_pct,
				        v.prazo, v.status,
				        coalesce(v.nota, '') AS nota,
				        v.criado_em,
				        '' AS conta_codigo,
				        '' AS conta_nome,
				        CASE WHEN v.status = 'quitado' THEN v.valor_centavos / 100.0 ELSE 0.0 END AS total_pago,
				        CASE WHEN v.status = 'quitado' THEN 0.0 ELSE v.valor_centavos / 100.0 END AS saldo_devedor,
				        '[]' AS historico
				 FROM fato_vinculo v
				 LEFT JOIN dim_pessoa p ON p.id = v.para_pessoa_id
				 ORDER BY v.status ASC, v.criado_em DESC`
			),
			['historico']
		);
	}
	if (colecao === 'contratos') {
		return all(
			db,
			`SELECT id, pessoa_id, coalesce(regime, '') AS regime,
			        CAST(salario_centavos AS REAL) AS salario_centavos,
			        CAST(inss_patronal_pct AS REAL) AS inss_patronal_pct,
			        CAST(fgts_pct AS REAL) AS fgts_pct,
			        CAST(vt_centavos AS REAL) AS vt_centavos,
			        coalesce(banco_pagador, '') AS banco_pagador,
			        coalesce(inicio, '') AS inicio, ativo
			 FROM dim_contrato WHERE ativo = 1 ORDER BY inicio DESC`
		);
	}
	if (colecao === 'contas') {
		return all(
			db,
			`SELECT id, nome, instituicao, tipo, escopo_padrao
			 FROM dim_conta
			 WHERE ativa = 1 AND tipo != 'cartao_final'
			 ORDER BY tipo, nome`
		);
	}
	if (colecao === 'blocos') {
		return all(
			db,
			`SELECT id, nome, CAST(meta_pct AS REAL) AS meta_pct, tipo_meta, coalesce(cor, '') AS cor
			 FROM ref_bloco
			 ORDER BY meta_pct DESC`
		);
	}
	if (colecao === 'entradas') {
		const ano = periodo && ANO.test(periodo) ? parseInt(periodo, 10) : new Date().getFullYear();
		/** @param {string} m */
		const mes = (m) =>
			`CAST(coalesce(SUM(CASE WHEN substr(l.data_caixa, 6, 2) = '${m}' THEN l.valor_centavos / 100.0 END), 0) AS REAL)`;
		return all(
			db,
			`SELECT ? AS ano,
			        coalesce(co.nome, l.conta_id, 'Outro') AS origem,
			        coalesce(l.categoria_id, 'outros') AS tipo_id,
			        coalesce(ca.nome, l.categoria_id, 'Outras receitas') AS tipo_nome,
			        coalesce(l.categoria_id, 'outros') AS tipo_slug,
			        ${mes('01')} AS jan, ${mes('02')} AS fev, ${mes('03')} AS mar,
			        ${mes('04')} AS abr, ${mes('05')} AS mai, ${mes('06')} AS jun,
			        ${mes('07')} AS jul, ${mes('08')} AS ago, ${mes('09')} AS "set",
			        ${mes('10')} AS "out", ${mes('11')} AS nov, ${mes('12')} AS dez,
			        CAST(coalesce(SUM(l.valor_centavos / 100.0), 0) AS REAL) AS total
			 FROM fato_lancamento l
			 LEFT JOIN dim_conta co ON co.id = l.conta_id
			 LEFT JOIN dim_categoria ca ON ca.id = l.categoria_id
			 WHERE l.tipo = 'receita' AND l.sintetico = 0 AND l.data_caixa LIKE ?
			 GROUP BY 1, 2, 3, 4, 5
			 ORDER BY total DESC`,
			ano,
			`${ano}-%`
		);
	}
	if (colecao === 'entradas_transacoes') {
		return all(
			db,
			`SELECT CAST(l.id AS TEXT) AS transacao_id,
			        l.data_caixa AS data,
			        substr(l.data_caixa, 1, 7) AS periodo,
			        CAST(substr(l.data_caixa, 1, 4) AS INTEGER) AS ano,
			        CAST(substr(l.data_caixa, 6, 2) AS INTEGER) AS mes_num,
			        coalesce(l.descricao_original, '') AS descricao,
			        coalesce(co.nome, l.conta_id, 'Outro') AS origem,
			        coalesce(l.categoria_id, 'outros') AS tipo_id,
			        coalesce(ca.nome, l.categoria_id, 'Outras receitas') AS tipo_nome,
			        coalesce(l.categoria_id, 'outros') AS tipo_slug,
			        l.valor_centavos / 100.0 AS valor
			 FROM fato_lancamento l
			 LEFT JOIN dim_conta co ON co.id = l.conta_id
			 LEFT JOIN dim_categoria ca ON ca.id = l.categoria_id
			 WHERE l.tipo = 'receita' AND l.sintetico = 0
			   AND (?1 IS NULL OR substr(l.data_caixa, 1, 7) = ?1 OR substr(l.data_caixa, 1, 4) = ?1)
			 ORDER BY l.data_caixa DESC, l.id DESC
			 LIMIT 300`,
			periodo ?? null
		);
	}
	if (colecao === 'tipos_entrada') {
		return all(db, `SELECT id, nome, id AS slug FROM dim_categoria ORDER BY ordem, nome`);
	}
	if (colecao === 'ai_subscriptions') {
		return all(
			db,
			`SELECT id, provider_key, name, category, plan_name, billing_cycle,
			        CAST(cost_usd AS REAL) AS cost_usd, CAST(cost_brl AS REAL) AS cost_brl,
			        CAST(balance_usd AS REAL) AS balance_usd,
			        CAST(total_spent_usd AS REAL) AS total_spent_usd,
			        CAST(month_spent_usd AS REAL) AS month_spent_usd,
			        renewal_date, auto_renew, status, models_used, pricing_summary, notes, updated_at
			 FROM dim_ai_subscription
			 ORDER BY cost_usd DESC, balance_usd DESC, name ASC`
		);
	}
	if (colecao === 'ai_pricing') {
		return all(
			db,
			`SELECT id, provider_key, model_name,
			        CAST(input_cache_hit_usd AS REAL) AS input_cache_hit_usd,
			        CAST(input_cache_miss_usd AS REAL) AS input_cache_miss_usd,
			        CAST(output_usd AS REAL) AS output_usd,
			        context_window, notes
			 FROM dim_ai_model_pricing
			 ORDER BY provider_key, model_name`
		);
	}
	if (colecao === 'ai_summary') {
		return (
			db
				.prepare(
					`SELECT CAST(total_active_services AS INTEGER) AS total_active_services,
					        CAST(total_recurring_plans AS INTEGER) AS total_recurring_plans,
					        CAST(total_monthly_cost_usd AS REAL) AS total_monthly_cost_usd,
					        CAST(total_monthly_cost_brl AS REAL) AS total_monthly_cost_brl,
					        CAST(total_available_credits_usd AS REAL) AS total_available_credits_usd,
					        CAST(total_month_spent_usd AS REAL) AS total_month_spent_usd,
					        CAST(total_historical_spent_usd AS REAL) AS total_historical_spent_usd,
					        next_renewal_date
					 FROM v_ai_subscriptions_summary`
				)
				.get() ?? null
		);
	}
	if (colecao === 'bootstrap') {
		if (!periodo || !PERIODO.test(periodo)) return null;
		const year = parseInt(periodo.slice(0, 4), 10);
		const startMes = `${year - 2}-01`;
		/** @type {Record<string, Row[]>} */
		const months = {};
		for (const r of all(db, `${SQL_MES} WHERE mes >= ? AND mes <= ?`, startMes, periodo)) {
			(months[r.mes] ??= []).push(r);
		}
		/** @type {Record<string, Row[]>} */
		const sankey = {};
		for (const r of all(
			db,
			`${SQL_SANKEY} WHERE periodo >= ? AND periodo <= ? ORDER BY periodo, nivel, ordem, origem, destino`,
			startMes,
			periodo
		)) {
			(sankey[r.periodo] ??= []).push(r);
		}
		return {
			months,
			sankey,
			compras: rows(db, 'compra', null),
			referencia: { [periodo]: rows(db, 'referencia', periodo) },
			regras: rows(db, 'regras', null),
			viagens: rows(db, 'viagens', null),
			ferias: rows(db, 'ferias', null),
			importacoes: rows(db, 'importacoes', null),
			faturasPendentes: rows(db, 'faturas', null),
			pendencias: rows(db, 'pendencias', String(year))[0] ?? null,
			pessoas: rows(db, 'pessoas', null),
			lugares: rows(db, 'lugares', null),
			vinculos: rows(db, 'vinculos', null),
			contratos: rows(db, 'contratos', null),
			contas: rows(db, 'contas', null),
			blocos: rows(db, 'blocos', null)
		};
	}
	return null;
}
