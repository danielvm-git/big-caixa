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
	compra_id: string | null;
	valor_centavos: number;
	parcelas: number | null;
	juros_pct: number | null;
	prazo: string | null;
	status: string;
	nota: string;
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
