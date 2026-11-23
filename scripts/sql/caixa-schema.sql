-- Livro no Postgres, schema separado do neon_auth. Sem dados.
CREATE SCHEMA IF NOT EXISTS caixa;

SET search_path TO caixa, public;

CREATE TABLE IF NOT EXISTS dim_conta (
	id TEXT PRIMARY KEY,
	nome TEXT NOT NULL,
	instituicao TEXT NOT NULL,
	tipo TEXT NOT NULL CHECK (tipo IN ('corrente', 'carteira', 'cartao', 'cartao_final', 'investimento')),
	conta_pai_id TEXT REFERENCES dim_conta (id) DEFERRABLE INITIALLY DEFERRED,
	titular TEXT,
	escopo_padrao TEXT NOT NULL CHECK (escopo_padrao IN ('casa', 'pessoal', 'familia', 'investimentos')),
	ativa INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS ref_coicop (
	codigo TEXT PRIMARY KEY,
	nivel TEXT NOT NULL CHECK (nivel IN ('divisao', 'grupo')),
	codigo_pai TEXT REFERENCES ref_coicop (codigo) DEFERRABLE INITIALLY DEFERRED,
	nome_en TEXT NOT NULL,
	nome_pt TEXT NOT NULL,
	bloco_503020 TEXT CHECK (bloco_503020 IN ('necessidade', 'desejo', 'futuro')),
	origem TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ref_bloco (
	id TEXT PRIMARY KEY,
	nome TEXT NOT NULL,
	nome_en TEXT NOT NULL,
	meta_pct DOUBLE PRECISION NOT NULL,
	tipo_meta TEXT NOT NULL CHECK (tipo_meta IN ('teto', 'piso')),
	cor TEXT
);

CREATE TABLE IF NOT EXISTS dim_categoria (
	id TEXT PRIMARY KEY,
	nome TEXT NOT NULL,
	grupo TEXT NOT NULL CHECK (grupo IN ('despesa', 'receita', 'transferencia', 'investimento')),
	coicop_codigo TEXT REFERENCES ref_coicop (codigo) DEFERRABLE INITIALLY DEFERRED,
	bloco TEXT REFERENCES ref_bloco (id) DEFERRABLE INITIALLY DEFERRED,
	cor TEXT,
	ordem INTEGER NOT NULL DEFAULT 100
);

CREATE TABLE IF NOT EXISTS dim_pessoa (
	id TEXT PRIMARY KEY,
	nome TEXT NOT NULL,
	relacao TEXT,
	apelido TEXT,
	circulo TEXT,
	aniversario TEXT,
	visibilidade TEXT DEFAULT 'familia'
);

CREATE TABLE IF NOT EXISTS dim_pessoa_alias (
	pessoa_id TEXT NOT NULL REFERENCES dim_pessoa (id) ON DELETE CASCADE,
	alias TEXT NOT NULL,
	PRIMARY KEY (pessoa_id, alias)
);

CREATE TABLE IF NOT EXISTS dim_lugar (
	id TEXT PRIMARY KEY,
	nome TEXT NOT NULL,
	tipo TEXT NOT NULL DEFAULT 'outro'
);

CREATE TABLE IF NOT EXISTS fato_vinculo (
	id TEXT PRIMARY KEY,
	tipo TEXT NOT NULL CHECK (tipo IN ('emprestimo', 'ajuda', 'racha')),
	de_pessoa_id TEXT NOT NULL REFERENCES dim_pessoa (id),
	para_pessoa_id TEXT NOT NULL REFERENCES dim_pessoa (id),
	compra_id TEXT REFERENCES compra (id),
	valor_centavos BIGINT NOT NULL DEFAULT 0,
	parcelas INTEGER,
	juros_pct DOUBLE PRECISION,
	prazo TEXT,
	status TEXT NOT NULL DEFAULT 'aberto',
	nota TEXT,
	criado_em TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'utc', 'YYYY-MM-DD HH24:MI:SS')
);

CREATE TABLE IF NOT EXISTS dim_contrato (
	id TEXT PRIMARY KEY,
	pessoa_id TEXT NOT NULL REFERENCES dim_pessoa (id),
	regime TEXT,
	salario_centavos BIGINT,
	inss_patronal_pct DOUBLE PRECISION,
	fgts_pct DOUBLE PRECISION,
	vt_centavos BIGINT,
	banco_pagador TEXT,
	inicio TEXT,
	ativo INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS dim_contraparte (
	id BIGINT PRIMARY KEY,
	nome_normalizado TEXT NOT NULL UNIQUE,
	documento TEXT,
	categoria_padrao_id TEXT REFERENCES dim_categoria (id) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS dim_ativo (
	id TEXT PRIMARY KEY,
	nome TEXT,
	classe TEXT,
	moeda TEXT NOT NULL DEFAULT 'BRL'
);

CREATE TABLE IF NOT EXISTS importacao (
	id BIGINT PRIMARY KEY,
	fonte TEXT NOT NULL,
	arquivo TEXT NOT NULL,
	arquivo_sha256 TEXT NOT NULL UNIQUE,
	importado_em TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'utc', 'YYYY-MM-DD HH24:MI:SS'),
	linhas_lidas INTEGER NOT NULL DEFAULT 0,
	linhas_novas INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS fatura_cartao (
	id TEXT PRIMARY KEY,
	conta_id TEXT NOT NULL REFERENCES dim_conta (id) DEFERRABLE INITIALLY DEFERRED,
	competencia TEXT NOT NULL,
	vencimento TEXT,
	total_centavos BIGINT NOT NULL,
	detalhada INTEGER NOT NULL DEFAULT 0,
	importacao_id BIGINT REFERENCES importacao (id) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS regra_categorizacao (
	id TEXT PRIMARY KEY,
	prioridade INTEGER NOT NULL,
	padrao_regex TEXT,
	padrao_cat_banco TEXT,
	conta_id TEXT,
	sinal TEXT CHECK (sinal IN ('+', '-')),
	valor_min_centavos INTEGER,
	valor_max_centavos INTEGER,
	tipo TEXT CHECK (tipo IN ('despesa', 'receita', 'transferencia', 'investimento')),
	escopo TEXT CHECK (escopo IN ('casa', 'pessoal', 'familia', 'investimentos')),
	categoria_id TEXT REFERENCES dim_categoria (id) DEFERRABLE INITIALLY DEFERRED,
	pessoa_id TEXT REFERENCES dim_pessoa (id) DEFERRABLE INITIALLY DEFERRED,
	extraordinario INTEGER,
	nota TEXT,
	ativa INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS fato_lancamento (
	id BIGINT PRIMARY KEY,
	hash_dedup TEXT NOT NULL UNIQUE,
	data_caixa TEXT NOT NULL,
	data_competencia TEXT NOT NULL,
	valor_centavos BIGINT NOT NULL,
	moeda_original TEXT NOT NULL DEFAULT 'BRL',
	valor_original_centavos BIGINT,
	conta_id TEXT NOT NULL REFERENCES dim_conta (id) DEFERRABLE INITIALLY DEFERRED,
	fatura_id TEXT REFERENCES fatura_cartao (id) DEFERRABLE INITIALLY DEFERRED,
	parcela_n INTEGER,
	parcela_total INTEGER,
	descricao_original TEXT NOT NULL,
	categoria_banco TEXT,
	documento_banco TEXT,
	contraparte_id BIGINT REFERENCES dim_contraparte (id) DEFERRABLE INITIALLY DEFERRED,
	tipo TEXT NOT NULL CHECK (tipo IN ('despesa', 'receita', 'transferencia', 'investimento')),
	escopo TEXT NOT NULL CHECK (escopo IN ('casa', 'pessoal', 'familia', 'investimentos')),
	categoria_id TEXT NOT NULL REFERENCES dim_categoria (id) DEFERRABLE INITIALLY DEFERRED,
	pessoa_id TEXT REFERENCES dim_pessoa (id) DEFERRABLE INITIALLY DEFERRED,
	extraordinario INTEGER NOT NULL DEFAULT 0,
	regra_id TEXT,
	manual INTEGER NOT NULL DEFAULT 0,
	par_transferencia_id BIGINT REFERENCES fato_lancamento (id) DEFERRABLE INITIALLY DEFERRED,
	sintetico INTEGER NOT NULL DEFAULT 0,
	importacao_id BIGINT REFERENCES importacao (id) DEFERRABLE INITIALLY DEFERRED,
	nota TEXT,
	criado_em TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'utc', 'YYYY-MM-DD HH24:MI:SS')
);

CREATE INDEX IF NOT EXISTS ix_lanc_caixa ON fato_lancamento (data_caixa);
CREATE INDEX IF NOT EXISTS ix_lanc_comp ON fato_lancamento (data_competencia);
CREATE INDEX IF NOT EXISTS ix_lanc_conta ON fato_lancamento (conta_id);
CREATE INDEX IF NOT EXISTS ix_lanc_fatura ON fato_lancamento (fatura_id);

CREATE TABLE IF NOT EXISTS documento (
	id BIGINT PRIMARY KEY,
	tipo TEXT NOT NULL CHECK (tipo IN ('email', 'nfe', 'nfse', 'pdf', 'recibo')),
	origem TEXT,
	gmail_msg_id TEXT UNIQUE,
	chave_nfe TEXT UNIQUE,
	caminho TEXT,
	data TEXT,
	valor_centavos BIGINT,
	emitente TEXT,
	resumo TEXT
);

CREATE TABLE IF NOT EXISTS lancamento_documento (
	lancamento_id BIGINT NOT NULL REFERENCES fato_lancamento (id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
	documento_id BIGINT NOT NULL REFERENCES documento (id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
	confianca DOUBLE PRECISION NOT NULL DEFAULT 1.0,
	PRIMARY KEY (lancamento_id, documento_id)
);

CREATE TABLE IF NOT EXISTS fato_posicao (
	data TEXT NOT NULL,
	ativo_id TEXT NOT NULL REFERENCES dim_ativo (id) DEFERRABLE INITIALLY DEFERRED,
	conta_id TEXT REFERENCES dim_conta (id) DEFERRABLE INITIALLY DEFERRED,
	quantidade DOUBLE PRECISION,
	valor_centavos BIGINT NOT NULL,
	fonte TEXT,
	PRIMARY KEY (data, ativo_id, conta_id)
);

CREATE TABLE IF NOT EXISTS sankey_link (
	periodo TEXT NOT NULL,
	nivel INTEGER NOT NULL,
	origem TEXT NOT NULL,
	destino TEXT NOT NULL,
	valor DOUBLE PRECISION NOT NULL,
	tipo TEXT,
	ordem INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS ix_sankey_periodo ON sankey_link (periodo);

CREATE TABLE IF NOT EXISTS parametro (
	chave TEXT PRIMARY KEY,
	valor TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS compra (
	id TEXT PRIMARY KEY,
	data TEXT NOT NULL,
	data_aproximada INTEGER NOT NULL DEFAULT 0,
	descricao TEXT NOT NULL,
	loja TEXT NOT NULL,
	conta_id TEXT NOT NULL,
	categoria_id TEXT,
	escopo TEXT,
	parcelas INTEGER NOT NULL DEFAULT 1,
	parcelas_pagas INTEGER NOT NULL DEFAULT 1,
	valor_parcela_centavos BIGINT NOT NULL,
	valor_total_centavos BIGINT NOT NULL,
	valor_pago_centavos BIGINT NOT NULL,
	ultima_parcela TEXT,
	proxima_parcela TEXT,
	estornada INTEGER NOT NULL DEFAULT 0,
	tipo TEXT,
	subtipo TEXT,
	titulo TEXT
);

CREATE TABLE IF NOT EXISTS compra_lancamento (
	compra_id TEXT NOT NULL,
	lancamento_id BIGINT NOT NULL,
	PRIMARY KEY (compra_id, lancamento_id)
);

CREATE INDEX IF NOT EXISTS ix_compra_lanc ON compra_lancamento (lancamento_id);

CREATE TABLE IF NOT EXISTS compra_nota (
	compra_id TEXT PRIMARY KEY,
	item TEXT,
	pedido TEXT,
	loja TEXT,
	link TEXT,
	notas TEXT,
	atualizado_em TEXT DEFAULT to_char(now() AT TIME ZONE 'utc', 'YYYY-MM-DD HH24:MI:SS'),
	origem TEXT NOT NULL DEFAULT 'app'
);

CREATE TABLE IF NOT EXISTS pedido_email (
	ref TEXT PRIMARY KEY,
	data TEXT NOT NULL,
	loja TEXT NOT NULL,
	item TEXT NOT NULL,
	fonte TEXT NOT NULL,
	compra_id TEXT
);

CREATE TABLE IF NOT EXISTS compra_item (
	id BIGINT PRIMARY KEY,
	compra_id TEXT NOT NULL,
	ordem INTEGER NOT NULL,
	titulo TEXT NOT NULL,
	tipo TEXT NOT NULL,
	subtipo TEXT NOT NULL,
	loja TEXT NOT NULL,
	valor_centavos BIGINT,
	origem TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS ix_compra_item_compra ON compra_item (compra_id);

CREATE TABLE IF NOT EXISTS viagem (
	id BIGINT PRIMARY KEY,
	chave TEXT UNIQUE,
	nome TEXT NOT NULL,
	destino TEXT,
	ida TEXT NOT NULL,
	volta TEXT NOT NULL,
	nota TEXT,
	margem INTEGER NOT NULL DEFAULT 0,
	empresa INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS viagem_compra (
	compra_id TEXT PRIMARY KEY,
	viagem_id BIGINT NOT NULL REFERENCES viagem (id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
	origem TEXT NOT NULL DEFAULT 'manual'
);

CREATE INDEX IF NOT EXISTS ix_viagem_compra_viagem ON viagem_compra (viagem_id);

CREATE TABLE IF NOT EXISTS ferias (
	id BIGINT PRIMARY KEY,
	chave TEXT UNIQUE,
	inicio TEXT NOT NULL,
	fim TEXT NOT NULL,
	grupo TEXT,
	inferido INTEGER NOT NULL DEFAULT 0,
	nota TEXT
);

CREATE TABLE IF NOT EXISTS fato_evento (
	id BIGINT PRIMARY KEY,
	ocorrido_em TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'utc', 'YYYY-MM-DD HH24:MI:SS'),
	tipo TEXT NOT NULL,
	entidade_id TEXT,
	categoria_anterior TEXT,
	categoria_nova TEXT
);

CREATE TABLE IF NOT EXISTS app_event (
	id BIGINT PRIMARY KEY,
	ocorrido_em TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'utc', 'YYYY-MM-DD HH24:MI:SS'),
	tipo TEXT NOT NULL,
	rota TEXT,
	mes TEXT,
	escopo TEXT,
	duracao_ms INTEGER,
	resultado TEXT
);

CREATE OR REPLACE VIEW v_mov AS
SELECT
	l.*,
	CASE WHEN l.conta_id = 'bb_conjunta' THEN 'casa' ELSE 'pessoal' END AS pool,
	c.bloco,
	c.coicop_codigo,
	c.nome AS categoria_nome,
	c.grupo AS categoria_grupo,
	substring(l.data_caixa FROM 1 FOR 7) AS mes
FROM fato_lancamento l
JOIN dim_categoria c ON c.id = l.categoria_id;

CREATE OR REPLACE VIEW v_custo AS
SELECT
	l.*,
	substring(l.data_caixa FROM 1 FOR 7) AS mes_caixa,
	substring(l.data_competencia FROM 1 FOR 7) AS mes_competencia,
	-l.valor_centavos / 100.0 AS custo
FROM fato_lancamento l
WHERE l.tipo = 'despesa' AND l.escopo IN ('casa', 'pessoal', 'familia');

CREATE OR REPLACE VIEW v_custo_mensal AS
SELECT
	mes_caixa AS mes,
	escopo,
	categoria_id,
	round(sum(CASE WHEN extraordinario = 0 THEN custo ELSE 0 END)::numeric, 2) AS custo_recorrente,
	round(sum(CASE WHEN extraordinario = 1 THEN custo ELSE 0 END)::numeric, 2) AS custo_extraordinario,
	count(*) AS n
FROM v_custo
GROUP BY 1, 2, 3;

CREATE OR REPLACE VIEW v_transferencia_sem_par AS
SELECT *
FROM fato_lancamento
WHERE tipo = 'transferencia' AND par_transferencia_id IS NULL AND categoria_id = 'interna';
