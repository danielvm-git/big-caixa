-- Schema caixa compatibility layer over pure double-entry general ledger
CREATE SCHEMA IF NOT EXISTS caixa;

-- 1. dim_conta
CREATE OR REPLACE VIEW caixa.dim_conta AS
SELECT 
    COALESCE(legacy_conta_id, code) AS id,
    name AS nome,
    CASE 
        WHEN code LIKE '1.1.01.001%' OR code LIKE '1.1.01.002%' OR code LIKE '2.1.01.015%' THEN 'Banco do Brasil'
        WHEN code LIKE '2.1.01%' THEN 'Itaú'
        WHEN code LIKE '1.1.01.003%' THEN 'Bradesco'
        WHEN code LIKE '1.1.01.004%' THEN 'XP'
        ELSE 'Outro'
    END AS instituicao,
    CASE 
        WHEN code LIKE '1.1.01%' THEN 'corrente'
        WHEN code LIKE '2.1.01%' THEN 'cartao'
        WHEN code LIKE '1.2%' THEN 'investimento'
        ELSE 'carteira'
    END AS tipo,
    NULL::text AS conta_pai_id,
    owner_person_id AS titular,
    'casa'::text AS escopo_padrao,
    1 AS ativa
FROM core.account;

-- 2. dim_pessoa & dim_pessoa_alias
CREATE OR REPLACE VIEW caixa.dim_pessoa AS
SELECT 
    id,
    name AS nome,
    COALESCE(relationship, 'familia') AS relacao,
    name AS apelido,
    'familia'::text AS circulo,
    ''::text AS aniversario,
    'familia'::text AS visibilidade
FROM core.person;

CREATE OR REPLACE VIEW caixa.dim_pessoa_alias AS
SELECT 
    id AS pessoa_id,
    name AS alias
FROM core.person;

-- 3. ref_coicop
CREATE OR REPLACE VIEW caixa.ref_coicop AS
SELECT 
    code AS codigo,
    CASE WHEN level = 1 THEN 'divisao' ELSE 'grupo' END AS nivel,
    parent_code AS codigo_pai,
    name_en,
    name_pt,
    name_pt AS nome_pt,
    name_en AS nome_en,
    'necessidade'::text AS bloco_503020,
    'un'::text AS origem
FROM core.coicop_category;

-- 4. ref_bloco
CREATE OR REPLACE VIEW caixa.ref_bloco AS
SELECT 
    id,
    nome,
    nome_en,
    meta_pct::float8 AS meta_pct,
    tipo_meta,
    cor
FROM raw.legacy_ref_bloco;

-- 5. dim_categoria
CREATE OR REPLACE VIEW caixa.dim_categoria AS
SELECT 
    id,
    nome,
    grupo,
    coicop_codigo,
    bloco,
    cor,
    ordem::int AS ordem
FROM raw.legacy_dim_categoria;

-- 6. v_custo_mensal
CREATE OR REPLACE VIEW caixa.v_custo_mensal AS
SELECT 
    m.fiscal_period AS mes,
    COALESCE(m.scope, 'casa') AS escopo,
    COALESCE(a.legacy_cat_id, m.account_code) AS categoria_id,
    m.net_amount::float8 AS custo_recorrente,
    0.0::float8 AS custo_extraordinario
FROM mart.monthly_income_statement m
LEFT JOIN core.account a ON a.code = m.account_code
WHERE m.account_group = 'Expenses';

-- 7. compra
CREATE OR REPLACE VIEW caixa.compra AS
SELECT 
    p.id::text AS id,
    p.purchase_date::text AS data,
    COALESCE(c.trade_name, p.raw_description) AS loja,
    p.raw_description AS titulo,
    p.raw_description AS descricao,
    (p.total_amount * 100)::float8 AS valor_total_centavos,
    (p.total_amount * 100)::float8 AS valor_pago_centavos,
    COALESCE(p.installments, 1)::int AS parcelas,
    COALESCE(p.paid_installments, 1)::int AS parcelas_pagas,
    (CASE WHEN p.is_refunded THEN 1 ELSE 0 END)::int AS estornada,
    COALESCE(p.payment_account_id::text, 'cartao') AS conta_id,
    COALESCE(lc.categoria_id, a.legacy_cat_id, 'outros')::text AS categoria_id,
    COALESCE(p.scope, 'casa')::text AS escopo
FROM core.purchase p
LEFT JOIN core.counterparty c ON c.id = p.counterparty_id
LEFT JOIN raw.legacy_compra lc ON lc.id = p.id
LEFT JOIN core.account a ON a.id = p.payment_account_id;

-- 8. compra_lancamento & fato_lancamento
CREATE OR REPLACE VIEW caixa.compra_lancamento AS
SELECT 
    cl.compra_id::text AS compra_id,
    cl.lancamento_id::text AS lancamento_id,
    1::int AS ordem
FROM raw.legacy_compra_lancamento cl;

CREATE OR REPLACE VIEW caixa.fato_lancamento AS
SELECT 
    id::text AS id,
    COALESCE(data_competencia, data_caixa)::text AS data_movimento,
    data_caixa::text AS data_caixa,
    conta_id::text AS conta_id,
    descricao_original::text AS descricao,
    documento_banco::text AS documento,
    COALESCE(valor_centavos::float8, 0.0) AS valor_centavos,
    tipo::text AS tipo,
    escopo::text AS escopo,
    categoria_id::text AS categoria_id,
    pessoa_id::text AS pessoa_id,
    regra_id::text AS regra_id,
    COALESCE(extraordinario::int, 0) AS extraordinario,
    COALESCE(manual::int, 0) AS manual,
    COALESCE(sintetico::int, 0) AS sintetico,
    nota::text AS nota
FROM raw.legacy_fato_lancamento;

-- 9. v_mov
CREATE OR REPLACE VIEW caixa.v_mov AS
SELECT 
    l.id,
    l.data_caixa,
    l.conta_id,
    l.descricao,
    l.valor_centavos,
    l.tipo,
    l.escopo,
    l.categoria_id,
    c.coicop_codigo
FROM caixa.fato_lancamento l
LEFT JOIN caixa.dim_categoria c ON c.id = l.categoria_id;

-- 10. sankey_link
CREATE OR REPLACE VIEW caixa.sankey_link AS
SELECT 
    periodo::text AS periodo,
    nivel::int AS nivel,
    origem::text AS origem,
    destino::text AS destino,
    valor::float8 AS valor,
    ordem::int AS ordem,
    tipo::text AS tipo
FROM raw.legacy_sankey_link;

-- 11. regra_categorizacao
CREATE OR REPLACE VIEW caixa.regra_categorizacao AS
SELECT 
    id::text AS id,
    coalesce(nullif(prioridade, ''), '0')::int AS prioridade,
    padrao_regex::text AS padrao_regex,
    padrao_cat_banco::text AS padrao_cat_banco,
    conta_id::text AS conta_id,
    sinal::text AS sinal,
    tipo::text AS tipo,
    escopo::text AS escopo,
    categoria_id::text AS categoria_id,
    coalesce(nullif(extraordinario, ''), '0')::int AS extraordinario,
    nota::text AS nota,
    coalesce(nullif(ativa, ''), '1')::int AS ativa
FROM raw.legacy_regra_categorizacao;

-- 12. viagem & viagem_compra
CREATE OR REPLACE VIEW caixa.viagem AS
SELECT 
    id::text AS id,
    chave::text AS chave,
    nome::text AS nome,
    destino::text AS destino,
    ida::text AS ida,
    volta::text AS volta,
    nota::text AS nota,
    margem::float8 AS margem,
    empresa::text AS empresa
FROM raw.legacy_viagem;

CREATE OR REPLACE VIEW caixa.viagem_compra AS
SELECT 
    viagem_id::text AS viagem_id,
    compra_id::text AS compra_id
FROM raw.legacy_viagem_compra;

-- 13. ferias
CREATE OR REPLACE VIEW caixa.ferias AS
SELECT 
    id::text AS id,
    chave::text AS chave,
    inicio::text AS inicio,
    fim::text AS fim,
    grupo::text AS grupo,
    inferido::int AS inferido,
    nota::text AS nota
FROM raw.legacy_ferias;

-- 14. fatura_cartao
CREATE OR REPLACE VIEW caixa.fatura_cartao AS
SELECT 
    i.fiscal_period AS competencia,
    COALESCE(a.legacy_conta_id, a.code) AS conta_id,
    (CASE WHEN i.is_detailed THEN 1 ELSE 0 END)::int AS detalhada
FROM core.credit_card_invoice i
JOIN core.account a ON a.id = i.account_id;

-- 15. dim_contrato (Sônia)
CREATE TABLE IF NOT EXISTS caixa.dim_contrato (
    id TEXT PRIMARY KEY,
    pessoa_id TEXT,
    regime TEXT,
    salario_centavos BIGINT,
    inss_patronal_pct DOUBLE PRECISION,
    fgts_pct DOUBLE PRECISION,
    vt_centavos BIGINT,
    banco_pagador TEXT,
    inicio TEXT,
    ativo INTEGER DEFAULT 1
);

INSERT INTO caixa.dim_contrato (id, pessoa_id, regime, salario_centavos, inss_patronal_pct, fgts_pct, vt_centavos, banco_pagador, inicio, ativo)
VALUES ('contrato_sonia', 'sonia', 'clt_domestico', 244700, 8.0, 8.0, 0, 'bb_pessoal', '2021-01-01', 1)
ON CONFLICT (id) DO NOTHING;

-- 16. importacao, dim_lugar, fato_vinculo, v_transferencia_sem_par
CREATE TABLE IF NOT EXISTS caixa.importacao (
    id TEXT PRIMARY KEY,
    fonte TEXT,
    arquivo TEXT,
    importado_em TEXT,
    linhas_lidas INTEGER,
    linhas_novas INTEGER
);

INSERT INTO caixa.importacao (id, fonte, arquivo, importado_em, linhas_lidas, linhas_novas)
VALUES 
    ('imp_bb_ourocard', 'bb_ourocard', 'card-bill-bb-ourocard_all-transactions.csv', '2026-11-25 14:37:00', 30, 30),
    ('imp_sqlite', 'livro-caixa.sqlite', 'livro-caixa.sqlite', '2026-11-25 14:00:00', 9186, 9186)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS caixa.dim_lugar (
    id TEXT PRIMARY KEY,
    nome TEXT,
    tipo TEXT
);

CREATE TABLE IF NOT EXISTS caixa.fato_vinculo (
    id TEXT PRIMARY KEY,
    tipo TEXT,
    de_pessoa_id TEXT,
    para_pessoa_id TEXT,
    compra_id TEXT,
    valor_centavos DOUBLE PRECISION,
    parcelas INTEGER,
    juros_pct DOUBLE PRECISION,
    prazo TEXT,
    status TEXT,
    nota TEXT,
    conta_codigo TEXT,
    criado_em TEXT DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE caixa.fato_vinculo ADD COLUMN IF NOT EXISTS conta_codigo TEXT;

CREATE OR REPLACE VIEW caixa.v_transferencia_sem_par AS
SELECT 
    id,
    data_caixa,
    descricao,
    valor_centavos
FROM caixa.fato_lancamento
WHERE tipo = 'transferencia' AND sintetico = 0;

-- 17. INSTEAD OF triggers so escrita.mjs writes work cleanly on view-backed schemas
CREATE OR REPLACE FUNCTION caixa.fn_upsert_dim_pessoa()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO core.person (id, name, relationship)
    VALUES (NEW.id, NEW.nome, COALESCE(NEW.relacao, 'familia'))
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        relationship = EXCLUDED.relationship;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_dim_pessoa_write ON caixa.dim_pessoa;
CREATE TRIGGER trg_dim_pessoa_write
INSTEAD OF INSERT OR UPDATE ON caixa.dim_pessoa
FOR EACH ROW EXECUTE FUNCTION caixa.fn_upsert_dim_pessoa();

CREATE OR REPLACE FUNCTION caixa.fn_write_dim_pessoa_alias()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_dim_pessoa_alias_write ON caixa.dim_pessoa_alias;
CREATE TRIGGER trg_dim_pessoa_alias_write
INSTEAD OF INSERT OR UPDATE OR DELETE ON caixa.dim_pessoa_alias
FOR EACH ROW EXECUTE FUNCTION caixa.fn_write_dim_pessoa_alias();

CREATE OR REPLACE FUNCTION caixa.fn_update_fato_lancamento()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    UPDATE raw.legacy_fato_lancamento
    SET pessoa_id = NEW.pessoa_id,
        categoria_id = COALESCE(NEW.categoria_id, categoria_id),
        nota = COALESCE(NEW.nota, nota)
    WHERE id::text = OLD.id;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fato_lancamento_update ON caixa.fato_lancamento;
CREATE TRIGGER trg_fato_lancamento_update
INSTEAD OF UPDATE ON caixa.fato_lancamento
FOR EACH ROW EXECUTE FUNCTION caixa.fn_update_fato_lancamento();
