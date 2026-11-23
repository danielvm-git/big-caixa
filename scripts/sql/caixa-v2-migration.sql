-- Extensões v2 (idempotente no Postgres)
SET search_path TO caixa, public;

ALTER TABLE dim_pessoa ADD COLUMN IF NOT EXISTS apelido TEXT;
ALTER TABLE dim_pessoa ADD COLUMN IF NOT EXISTS circulo TEXT;
ALTER TABLE dim_pessoa ADD COLUMN IF NOT EXISTS aniversario TEXT;
ALTER TABLE dim_pessoa ADD COLUMN IF NOT EXISTS visibilidade TEXT DEFAULT 'familia';

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

CREATE INDEX IF NOT EXISTS ix_vinculo_de ON fato_vinculo (de_pessoa_id);
CREATE INDEX IF NOT EXISTS ix_vinculo_para ON fato_vinculo (para_pessoa_id);
CREATE INDEX IF NOT EXISTS ix_vinculo_compra ON fato_vinculo (compra_id);