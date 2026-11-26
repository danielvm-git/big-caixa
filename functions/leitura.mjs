import { createJsonResponder, hasCoreSchema, pool, userId } from './_shared.mjs';

const { headers, json } = createJsonResponder({
	methods: 'GET, OPTIONS',
	cacheControl: 'private, no-store'
});

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
			        coalesce(sum(c.valor_total_centavos)/100.0, 0)::float8 AS total_gasto,
			        coalesce(json_agg(json_build_object('id', c.id, 'data', c.data, 'loja', c.loja, 'titulo', c.titulo, 'valor', (c.valor_total_centavos/100.0)::float8)) FILTER (WHERE c.id IS NOT NULL), '[]') AS compras,
			        coalesce(json_agg(vc.compra_id) FILTER (WHERE vc.compra_id IS NOT NULL), '[]') AS compra_ids
			 FROM caixa.viagem v
			 LEFT JOIN caixa.viagem_compra vc ON vc.viagem_id = v.id
			 LEFT JOIN caixa.compra c ON c.id = vc.compra_id
			 GROUP BY v.id, v.chave, v.nome, v.destino, v.ida, v.volta, v.nota, v.margem, v.empresa
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
		if (!(await hasCoreSchema())) {
			const q = await pool.query(
				`SELECT
					v.id,
					v.tipo,
					v.de_pessoa_id,
					v.para_pessoa_id,
					coalesce(p.nome, v.para_pessoa_id) AS para_pessoa_nome,
					coalesce(p.relacao, 'outro') AS para_pessoa_relacao,
					v.compra_id,
					(v.valor_centavos / 100.0)::float8 AS valor_original,
					v.valor_centavos::float8 AS valor_centavos,
					v.parcelas,
					v.juros_pct::float8 AS juros_pct,
					v.prazo,
					v.status,
					coalesce(v.nota, '') AS nota,
					v.criado_em,
					''::text AS conta_codigo,
					''::text AS conta_nome,
					CASE WHEN v.status = 'quitado' THEN (v.valor_centavos / 100.0)::float8 ELSE 0::float8 END AS total_pago,
					CASE WHEN v.status = 'quitado' THEN 0::float8 ELSE (v.valor_centavos / 100.0)::float8 END AS saldo_devedor,
					'[]'::json AS historico
				 FROM caixa.fato_vinculo v
				 LEFT JOIN caixa.dim_pessoa p ON p.id = v.para_pessoa_id
				 ORDER BY v.status ASC, v.criado_em DESC`
			);
			return q.rows;
		}
		const q = await pool.query(
			`SELECT 
				v.id,
				v.tipo,
				v.de_pessoa_id,
				v.para_pessoa_id,
				coalesce(p.name, v.para_pessoa_id) AS para_pessoa_nome,
				coalesce(p.relationship, 'outro') AS para_pessoa_relacao,
				v.compra_id,
				(v.valor_centavos / 100.0)::float8 AS valor_original,
				v.valor_centavos::float8 AS valor_centavos,
				v.parcelas,
				v.juros_pct::float8 AS juros_pct,
				v.prazo,
				v.status,
				coalesce(v.nota, '') AS nota,
				v.criado_em,
				coalesce(acc.code, '') AS conta_codigo,
				coalesce(acc.name, '') AS conta_nome,
				coalesce(pag.total_pago, 0)::float8 AS total_pago,
				coalesce(saldo.saldo_devedor, v.valor_centavos / 100.0)::float8 AS saldo_devedor,
				coalesce(hist.items, '[]'::json) AS historico
			 FROM caixa.fato_vinculo v
			 LEFT JOIN core.person p ON p.id = v.para_pessoa_id
			 LEFT JOIN core.account acc ON acc.code = v.conta_codigo
			 LEFT JOIN LATERAL (
				SELECT sum(je.amount) AS total_pago
				FROM core.journal_entry je
				WHERE je.account_id = acc.id AND je.entry_type = 'C'
			 ) pag ON true
			 LEFT JOIN LATERAL (
				SELECT sum(CASE WHEN je.entry_type = 'D' THEN je.amount ELSE -je.amount END) AS saldo_devedor
				FROM core.journal_entry je
				WHERE je.account_id = acc.id
			 ) saldo ON true
			 LEFT JOIN LATERAL (
				SELECT json_agg(json_build_object(
					'data', to_char(t.date, 'YYYY-MM-DD'),
					'descricao', t.description,
					'valor', je.amount::float8,
					'memo', coalesce(je.memo, '')
				) ORDER BY t.date ASC) AS items
				FROM core.journal_entry je
				JOIN core.transaction t ON t.id = je.transaction_id
				WHERE je.account_id = acc.id AND je.entry_type = 'C'
			 ) hist ON true
			 ORDER BY v.status ASC, v.criado_em DESC`
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
	if (colecao === 'entradas') {
		const ano = ANO.test(periodo ?? '') ? parseInt(periodo, 10) : new Date().getFullYear();
		if (!(await hasCoreSchema())) {
			const q = await pool.query(
				`SELECT
					$1::int AS ano,
					coalesce(co.nome, l.conta_id, 'Outro') AS origem,
					coalesce(l.categoria_id, 'outros') AS tipo_id,
					coalesce(ca.nome, l.categoria_id, 'Outras receitas') AS tipo_nome,
					coalesce(l.categoria_id, 'outros') AS tipo_slug,
					coalesce(SUM(CASE WHEN substr(l.data_caixa, 6, 2) = '01' THEN l.valor_centavos / 100.0 END), 0)::float8 AS jan,
					coalesce(SUM(CASE WHEN substr(l.data_caixa, 6, 2) = '02' THEN l.valor_centavos / 100.0 END), 0)::float8 AS fev,
					coalesce(SUM(CASE WHEN substr(l.data_caixa, 6, 2) = '03' THEN l.valor_centavos / 100.0 END), 0)::float8 AS mar,
					coalesce(SUM(CASE WHEN substr(l.data_caixa, 6, 2) = '04' THEN l.valor_centavos / 100.0 END), 0)::float8 AS abr,
					coalesce(SUM(CASE WHEN substr(l.data_caixa, 6, 2) = '05' THEN l.valor_centavos / 100.0 END), 0)::float8 AS mai,
					coalesce(SUM(CASE WHEN substr(l.data_caixa, 6, 2) = '06' THEN l.valor_centavos / 100.0 END), 0)::float8 AS jun,
					coalesce(SUM(CASE WHEN substr(l.data_caixa, 6, 2) = '07' THEN l.valor_centavos / 100.0 END), 0)::float8 AS jul,
					coalesce(SUM(CASE WHEN substr(l.data_caixa, 6, 2) = '08' THEN l.valor_centavos / 100.0 END), 0)::float8 AS ago,
					coalesce(SUM(CASE WHEN substr(l.data_caixa, 6, 2) = '09' THEN l.valor_centavos / 100.0 END), 0)::float8 AS set,
					coalesce(SUM(CASE WHEN substr(l.data_caixa, 6, 2) = '10' THEN l.valor_centavos / 100.0 END), 0)::float8 AS out,
					coalesce(SUM(CASE WHEN substr(l.data_caixa, 6, 2) = '11' THEN l.valor_centavos / 100.0 END), 0)::float8 AS nov,
					coalesce(SUM(CASE WHEN substr(l.data_caixa, 6, 2) = '12' THEN l.valor_centavos / 100.0 END), 0)::float8 AS dez,
					coalesce(SUM(l.valor_centavos / 100.0), 0)::float8 AS total
				 FROM caixa.fato_lancamento l
				 LEFT JOIN caixa.dim_conta co ON co.id = l.conta_id
				 LEFT JOIN caixa.dim_categoria ca ON ca.id = l.categoria_id
				 WHERE l.tipo = 'receita' AND l.sintetico = 0 AND l.data_caixa LIKE $2
				 GROUP BY 1, 2, 3, 4, 5
				 ORDER BY total DESC`,
				[ano, `${ano}-%`]
			);
			return q.rows;
		}
		const q = await pool.query(
			`SELECT ano, origem, tipo_id, tipo_nome, tipo_slug,
			        jan, fev, mar, abr, mai, jun, jul, ago, set_val AS set, out_val AS out, nov, dez, total
			 FROM caixa.v_entrada_mensal
			 WHERE ano = $1
			 ORDER BY total DESC`,
			[ano]
		);
		return q.rows;
	}
	if (colecao === 'entradas_transacoes') {
		if (!(await hasCoreSchema())) {
			const q = await pool.query(
				`SELECT
					l.id::text AS transacao_id,
					l.data_caixa AS data,
					substr(l.data_caixa, 1, 7) AS periodo,
					substr(l.data_caixa, 1, 4)::int AS ano,
					substr(l.data_caixa, 6, 2)::int AS mes_num,
					coalesce(l.descricao_original, '') AS descricao,
					coalesce(co.nome, l.conta_id, 'Outro') AS origem,
					coalesce(l.categoria_id, 'outros') AS tipo_id,
					coalesce(ca.nome, l.categoria_id, 'Outras receitas') AS tipo_nome,
					coalesce(l.categoria_id, 'outros') AS tipo_slug,
					(l.valor_centavos / 100.0)::float8 AS valor
				 FROM caixa.fato_lancamento l
				 LEFT JOIN caixa.dim_conta co ON co.id = l.conta_id
				 LEFT JOIN caixa.dim_categoria ca ON ca.id = l.categoria_id
				 WHERE l.tipo = 'receita' AND l.sintetico = 0
				   AND ($1::text IS NULL OR substr(l.data_caixa, 1, 7) = $1 OR substr(l.data_caixa, 1, 4) = $1)
				 ORDER BY l.data_caixa DESC, l.id DESC
				 LIMIT 300`,
				[periodo]
			);
			return q.rows;
		}
		const q = await pool.query(
			`SELECT transacao_id, data, periodo, ano, mes_num, descricao, origem, tipo_id, tipo_nome, tipo_slug, valor
			 FROM caixa.v_entrada_transacao
			 WHERE ($1::text IS NULL OR periodo = $1 OR ano::text = $1)
			 ORDER BY data DESC, transacao_id DESC
			 LIMIT 300`,
			[periodo]
		);
		return q.rows;
	}
	if (colecao === 'tipos_entrada') {
		if (!(await hasCoreSchema())) {
			const q = await pool.query(
				`SELECT id, nome, id AS slug
				 FROM caixa.dim_categoria
				 ORDER BY ordem, nome`
			);
			return q.rows;
		}
		const q = await pool.query(
			`SELECT code AS id, name AS nome, coalesce(legacy_cat_id, 'outras_receitas') AS slug
			 FROM core.account
			 WHERE account_group = 'Revenues' AND code != '4'
			 ORDER BY code`
		);
		return q.rows;
	}
	if (colecao === 'ai_subscriptions') {
		const q = await pool.query(
			`SELECT id, provider_key, name, category, plan_name, billing_cycle,
			        cost_usd::float8, cost_brl::float8, balance_usd::float8,
			        total_spent_usd::float8, month_spent_usd::float8,
			        renewal_date, auto_renew, status, models_used, pricing_summary, notes, updated_at
			 FROM caixa.dim_ai_subscription
			 ORDER BY cost_usd DESC, balance_usd DESC, name ASC`
		);
		return q.rows;
	}
	if (colecao === 'ai_pricing') {
		const q = await pool.query(
			`SELECT id, provider_key, model_name,
			        input_cache_hit_usd::float8, input_cache_miss_usd::float8, output_usd::float8,
			        context_window, notes
			 FROM caixa.dim_ai_model_pricing
			 ORDER BY provider_key, model_name`
		);
		return q.rows;
	}
	if (colecao === 'ai_summary') {
		const q = await pool.query(
			`SELECT total_active_services::int, total_recurring_plans::int,
			        total_monthly_cost_usd::float8, total_monthly_cost_brl::float8,
			        total_available_credits_usd::float8, total_month_spent_usd::float8,
			        total_historical_spent_usd::float8, next_renewal_date
			 FROM caixa.v_ai_subscriptions_summary`
		);
		return q.rows[0] ?? null;
	}
	if (colecao === 'bootstrap') {
		if (!PERIODO.test(periodo ?? '')) return null;
		const year = parseInt(periodo.slice(0, 4), 10);
		const startMes = `${year - 2}-01`;
		const [
			mesRows,
			sankeyRows,
			compras,
			regras,
			viagens,
			ferias,
			importacoes,
			faturasPendentes,
			pendenciasRows,
			pessoas,
			lugares,
			vinculos,
			contratos,
			contas,
			blocos,
			refAtual
		] = await Promise.all([
			pool.query(
				`SELECT mes, escopo, categoria_id,
				        custo_recorrente::float8 AS custo_recorrente,
				        custo_extraordinario::float8 AS custo_extraordinario
				 FROM caixa.v_custo_mensal
				 WHERE mes >= $1 AND mes <= $2`,
				[startMes, periodo]
			),
			pool.query(
				`SELECT periodo, nivel, origem, destino, valor::float8 AS valor, coalesce(tipo, '') AS tipo
				 FROM caixa.sankey_link
				 WHERE periodo >= $1 AND periodo <= $2
				 ORDER BY periodo, nivel, ordem`,
				[startMes, periodo]
			),
			rows('compra', null),
			rows('regras', null),
			rows('viagens', null),
			rows('ferias', null),
			rows('importacoes', null),
			rows('faturas', null),
			rows('pendencias', String(year)),
			rows('pessoas', null),
			rows('lugares', null),
			rows('vinculos', null),
			rows('contratos', null),
			rows('contas', null),
			rows('blocos', null),
			rows('referencia', periodo)
		]);
		const months = {};
		for (const r of mesRows.rows) {
			(months[r.mes] ??= []).push(r);
		}
		const sankey = {};
		for (const r of sankeyRows.rows) {
			(sankey[r.periodo] ??= []).push(r);
		}
		return {
			months,
			sankey,
			compras,
			referencia: { [periodo]: refAtual },
			regras,
			viagens,
			ferias,
			importacoes,
			faturasPendentes,
			pendencias: pendenciasRows[0] ?? null,
			pessoas,
			lugares,
			vinculos,
			contratos,
			contas,
			blocos
		};
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
		try {
			const data = await rows(colecao, periodo);
			if (data == null) return json(404, { error: 'unknown' }, origin);
			return json(200, { data }, origin);
		} catch (err) {
			const msg = String(err?.name ?? 'Error');
			console.error(JSON.stringify({ event: 'leitura_error', colecao, error: msg }));
			return json(500, { error: 'internal' }, origin);
		}
	}
};

export default handler;
