export type MesDoc = {
	mes: string;
	escopo: string;
	categoria_id: string;
	custo_recorrente: number;
	custo_extraordinario: number;
};

export type CompraDoc = {
	id: string;
	data: string;
	loja: string;
	titulo: string;
	valor_total_centavos: number;
	valor_pago_centavos?: number;
	parcelas?: number;
	parcelas_pagas?: number;
	estornada?: number;
	conta_id?: string;
	categoria_id: string | null;
	escopo: string;
	pessoa_id?: string | null;
};

export type SankeyDoc = {
	periodo: string;
	origem: string;
	destino: string;
	valor: number;
	nivel: number;
	tipo?: string;
};

export type ReferenciaDoc = {
	codigo: string;
	nome_pt: string;
	bloco_503020: string | null;
	total: number;
	n: number;
};

export type RegraDoc = {
	id: string;
	prioridade: number;
	padrao_regex: string | null;
	padrao_cat_banco: string | null;
	conta_id: string | null;
	sinal: string | null;
	tipo: string;
	escopo: string | null;
	categoria_id: string;
	extraordinario: number;
	nota: string | null;
	ativa: number;
	usos: number;
};

export type ViagemDoc = {
	id: number;
	chave: string | null;
	nome: string;
	destino: string | null;
	ida: string;
	volta: string;
	nota: string | null;
	margem: number;
	empresa: number;
	compra_ids: string[];
	total_gasto?: number;
	compras?: Array<{ id: string; data: string; loja: string; titulo: string; valor: number }>;
};

export type FeriasDoc = {
	id: number;
	chave: string | null;
	inicio: string;
	fim: string;
	grupo: string;
	inferido: number;
	nota: string;
};

export type ImportacaoDoc = {
	id: number;
	fonte: string;
	arquivo: string;
	importado_em: string;
	linhas_lidas: number;
	linhas_novas: number;
};

export type FaturaPendenteDoc = { competencia: string; conta_id: string };

export type PendenciasDoc = {
	sem_regra_n: number;
	sem_regra_v: number;
	faturas_n: number;
	transferencias_n: number;
	ano: string;
};

export type PessoaDoc = {
	id: string;
	nome: string;
	relacao: string;
	apelido?: string;
	circulo?: string;
	aniversario?: string;
	visibilidade?: string;
	aliases?: string[];
};

export type LugarDoc = { id: string; nome: string; tipo: string };

export type VinculoDoc = {
	id: string;
	tipo: string;
	de_pessoa_id: string;
	para_pessoa_id: string;
	para_pessoa_nome?: string;
	para_pessoa_relacao?: string;
	compra_id: string | null;
	valor_centavos: number;
	valor_original?: number;
	parcelas: number | null;
	juros_pct: number | null;
	prazo: string | null;
	status: string;
	nota: string;
	criado_em?: string;
	conta_codigo?: string;
	conta_nome?: string;
	total_pago?: number;
	saldo_devedor?: number;
	historico?: Array<{
		data: string;
		descricao: string;
		valor: number;
		memo: string;
	}>;
};

export type ContratoDoc = {
	id: string;
	pessoa_id: string;
	regime: string;
	salario_centavos: number | null;
	inss_patronal_pct: number | null;
	fgts_pct: number | null;
	vt_centavos: number | null;
	banco_pagador: string;
	inicio: string;
	ativo: number;
};
export type ContaDoc = {
	id: string;
	nome: string;
	instituicao: string;
	tipo: string;
	escopo_padrao: string;
};

export type BlocoDoc = {
	id: string;
	nome: string;
	meta_pct: number;
	tipo_meta: 'teto' | 'piso';
	cor: string;
};

export type EntradaMensalDoc = {
	ano: number;
	origem: string;
	tipo_id: string;
	tipo_nome: string;
	tipo_slug: string;
	jan: number;
	fev: number;
	mar: number;
	abr: number;
	mai: number;
	jun: number;
	jul: number;
	ago: number;
	set: number;
	out: number;
	nov: number;
	dez: number;
	total: number;
};

export type EntradaTransacaoDoc = {
	transacao_id: string;
	data: string;
	periodo: string;
	ano: number;
	mes_num: number;
	descricao: string;
	origem: string;
	tipo_id: string;
	tipo_nome: string;
	tipo_slug: string;
	valor: number;
};

export type TipoEntradaDoc = {
	id: string;
	nome: string;
	slug: string;
};

export type AiSubscriptionDoc = {
	id: number;
	provider_key: string;
	name: string;
	category: string;
	plan_name: string;
	billing_cycle: 'monthly' | 'annual' | 'pay_as_you_go' | 'free';
	cost_usd: number;
	cost_brl: number;
	balance_usd: number;
	total_spent_usd: number;
	month_spent_usd: number;
	renewal_date: string | null;
	auto_renew: boolean;
	status: string;
	models_used: string | null;
	pricing_summary: string | null;
	notes: string | null;
	updated_at: string;
};

export type AiPricingDoc = {
	id: number;
	provider_key: string;
	model_name: string;
	input_cache_hit_usd: number | null;
	input_cache_miss_usd: number | null;
	output_usd: number | null;
	context_window: string | null;
	notes: string | null;
};

export type AiSummaryDoc = {
	total_active_services: number;
	total_recurring_plans: number;
	total_monthly_cost_usd: number;
	total_monthly_cost_brl: number;
	total_available_credits_usd: number;
	total_month_spent_usd: number;
	total_historical_spent_usd: number;
	next_renewal_date: string | null;
};
