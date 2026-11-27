-- Livro-caixa: schema SQLite.
-- Gerado uma vez a partir do schema vivo do Neon (pg_dump do schema `caixa`,
-- 2026-11-27) e mantido à mão daqui em diante. Valores em centavos (INTEGER);
-- datas como texto 'YYYY-MM-DD'. Idempotente: pode rodar em todo boot.

CREATE TABLE IF NOT EXISTS app_event (
    id INTEGER PRIMARY KEY,
    ocorrido_em TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S','now')) NOT NULL,
    tipo TEXT NOT NULL,
    rota TEXT,
    mes TEXT,
    escopo TEXT,
    duracao_ms INTEGER,
    resultado TEXT
);

CREATE TABLE IF NOT EXISTS compra (
    id TEXT NOT NULL,
    data TEXT NOT NULL,
    data_aproximada INTEGER DEFAULT 0 NOT NULL,
    descricao TEXT NOT NULL,
    loja TEXT NOT NULL,
    conta_id TEXT NOT NULL,
    categoria_id TEXT,
    escopo TEXT,
    parcelas INTEGER DEFAULT 1 NOT NULL,
    parcelas_pagas INTEGER DEFAULT 1 NOT NULL,
    valor_parcela_centavos INTEGER NOT NULL,
    valor_total_centavos INTEGER NOT NULL,
    valor_pago_centavos INTEGER NOT NULL,
    ultima_parcela TEXT,
    proxima_parcela TEXT,
    estornada INTEGER DEFAULT 0 NOT NULL,
    tipo TEXT,
    subtipo TEXT,
    titulo TEXT,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS compra_item (
    id INTEGER PRIMARY KEY,
    compra_id TEXT NOT NULL,
    ordem INTEGER NOT NULL,
    titulo TEXT NOT NULL,
    tipo TEXT NOT NULL,
    subtipo TEXT NOT NULL,
    loja TEXT NOT NULL,
    valor_centavos INTEGER,
    origem TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS compra_lancamento (
    compra_id TEXT NOT NULL,
    lancamento_id INTEGER NOT NULL,
    PRIMARY KEY (compra_id, lancamento_id)
);

CREATE TABLE IF NOT EXISTS compra_nota (
    compra_id TEXT NOT NULL,
    item TEXT,
    pedido TEXT,
    loja TEXT,
    link TEXT,
    notas TEXT,
    atualizado_em TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S','now')),
    origem TEXT DEFAULT 'app' NOT NULL,
    PRIMARY KEY (compra_id)
);

CREATE TABLE IF NOT EXISTS dim_ai_model_pricing (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider_key TEXT NOT NULL,
    model_name TEXT NOT NULL,
    input_cache_hit_usd REAL,
    input_cache_miss_usd REAL,
    output_usd REAL,
    context_window TEXT,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dim_ai_subscription (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider_key TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    plan_name TEXT NOT NULL,
    billing_cycle TEXT NOT NULL,
    cost_usd REAL DEFAULT 0 NOT NULL,
    cost_brl REAL DEFAULT 0 NOT NULL,
    balance_usd REAL DEFAULT 0 NOT NULL,
    total_spent_usd REAL DEFAULT 0 NOT NULL,
    month_spent_usd REAL DEFAULT 0 NOT NULL,
    renewal_date TEXT,
    auto_renew INTEGER DEFAULT 1,
    status TEXT DEFAULT 'active',
    models_used TEXT,
    pricing_summary TEXT,
    notes TEXT,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT dim_ai_subscription_provider_key_key UNIQUE (provider_key)
);

CREATE TABLE IF NOT EXISTS dim_ativo (
    id TEXT NOT NULL,
    nome TEXT,
    classe TEXT,
    moeda TEXT DEFAULT 'BRL' NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS dim_categoria (
    id TEXT NOT NULL,
    nome TEXT NOT NULL,
    grupo TEXT NOT NULL,
    coicop_codigo TEXT,
    bloco TEXT,
    cor TEXT,
    ordem INTEGER DEFAULT 100 NOT NULL,
    CONSTRAINT dim_categoria_grupo_check CHECK (grupo IN ('despesa', 'receita', 'transferencia', 'investimento')),
    PRIMARY KEY (id),
    CONSTRAINT dim_categoria_bloco_fkey FOREIGN KEY (bloco) REFERENCES ref_bloco(id) DEFERRABLE INITIALLY DEFERRED,
    CONSTRAINT dim_categoria_coicop_codigo_fkey FOREIGN KEY (coicop_codigo) REFERENCES ref_coicop(codigo) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS dim_conta (
    id TEXT NOT NULL,
    nome TEXT NOT NULL,
    instituicao TEXT NOT NULL,
    tipo TEXT NOT NULL,
    conta_pai_id TEXT,
    titular TEXT,
    escopo_padrao TEXT NOT NULL,
    ativa INTEGER DEFAULT 1 NOT NULL,
    CONSTRAINT dim_conta_escopo_padrao_check CHECK (escopo_padrao IN ('casa', 'pessoal', 'familia', 'investimentos')),
    CONSTRAINT dim_conta_tipo_check CHECK (tipo IN ('corrente', 'carteira', 'cartao', 'cartao_final', 'investimento')),
    PRIMARY KEY (id),
    CONSTRAINT dim_conta_conta_pai_id_fkey FOREIGN KEY (conta_pai_id) REFERENCES dim_conta(id) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS dim_contraparte (
    id INTEGER PRIMARY KEY,
    nome_normalizado TEXT NOT NULL,
    documento TEXT,
    categoria_padrao_id TEXT,
    CONSTRAINT dim_contraparte_nome_normalizado_key UNIQUE (nome_normalizado),
    CONSTRAINT dim_contraparte_categoria_padrao_id_fkey FOREIGN KEY (categoria_padrao_id) REFERENCES dim_categoria(id) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS dim_contrato (
    id TEXT NOT NULL,
    pessoa_id TEXT NOT NULL,
    regime TEXT,
    salario_centavos INTEGER,
    inss_patronal_pct REAL,
    fgts_pct REAL,
    vt_centavos INTEGER,
    banco_pagador TEXT,
    inicio TEXT,
    ativo INTEGER DEFAULT 1 NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT dim_contrato_pessoa_id_fkey FOREIGN KEY (pessoa_id) REFERENCES dim_pessoa(id)
);

CREATE TABLE IF NOT EXISTS dim_lugar (
    id TEXT NOT NULL,
    nome TEXT NOT NULL,
    tipo TEXT DEFAULT 'outro' NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS dim_pessoa (
    id TEXT NOT NULL,
    nome TEXT NOT NULL,
    relacao TEXT,
    apelido TEXT,
    circulo TEXT,
    aniversario TEXT,
    visibilidade TEXT DEFAULT 'familia',
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS dim_pessoa_alias (
    pessoa_id TEXT NOT NULL,
    alias TEXT NOT NULL,
    PRIMARY KEY (pessoa_id, alias),
    CONSTRAINT dim_pessoa_alias_pessoa_id_fkey FOREIGN KEY (pessoa_id) REFERENCES dim_pessoa(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS documento (
    id INTEGER PRIMARY KEY,
    tipo TEXT NOT NULL,
    origem TEXT,
    gmail_msg_id TEXT,
    chave_nfe TEXT,
    caminho TEXT,
    data TEXT,
    valor_centavos INTEGER,
    emitente TEXT,
    resumo TEXT,
    CONSTRAINT documento_tipo_check CHECK (tipo IN ('email', 'nfe', 'nfse', 'pdf', 'recibo')),
    CONSTRAINT documento_chave_nfe_key UNIQUE (chave_nfe),
    CONSTRAINT documento_gmail_msg_id_key UNIQUE (gmail_msg_id)
);

CREATE TABLE IF NOT EXISTS fato_evento (
    id INTEGER PRIMARY KEY,
    ocorrido_em TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S','now')) NOT NULL,
    tipo TEXT NOT NULL,
    entidade_id TEXT,
    categoria_anterior TEXT,
    categoria_nova TEXT
);

CREATE TABLE IF NOT EXISTS fato_lancamento (
    id INTEGER PRIMARY KEY,
    hash_dedup TEXT NOT NULL,
    data_caixa TEXT NOT NULL,
    data_competencia TEXT NOT NULL,
    valor_centavos INTEGER NOT NULL,
    moeda_original TEXT DEFAULT 'BRL' NOT NULL,
    valor_original_centavos INTEGER,
    conta_id TEXT NOT NULL,
    fatura_id TEXT,
    parcela_n INTEGER,
    parcela_total INTEGER,
    descricao_original TEXT NOT NULL,
    categoria_banco TEXT,
    documento_banco TEXT,
    contraparte_id INTEGER,
    tipo TEXT NOT NULL,
    escopo TEXT NOT NULL,
    categoria_id TEXT NOT NULL,
    pessoa_id TEXT,
    extraordinario INTEGER DEFAULT 0 NOT NULL,
    regra_id TEXT,
    manual INTEGER DEFAULT 0 NOT NULL,
    par_transferencia_id INTEGER,
    sintetico INTEGER DEFAULT 0 NOT NULL,
    importacao_id INTEGER,
    nota TEXT,
    criado_em TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S','now')) NOT NULL,
    CONSTRAINT fato_lancamento_escopo_check CHECK (escopo IN ('casa', 'pessoal', 'familia', 'investimentos')),
    CONSTRAINT fato_lancamento_tipo_check CHECK (tipo IN ('despesa', 'receita', 'transferencia', 'investimento')),
    CONSTRAINT fato_lancamento_hash_dedup_key UNIQUE (hash_dedup),
    CONSTRAINT fato_lancamento_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES dim_categoria(id) DEFERRABLE INITIALLY DEFERRED,
    CONSTRAINT fato_lancamento_conta_id_fkey FOREIGN KEY (conta_id) REFERENCES dim_conta(id) DEFERRABLE INITIALLY DEFERRED,
    CONSTRAINT fato_lancamento_contraparte_id_fkey FOREIGN KEY (contraparte_id) REFERENCES dim_contraparte(id) DEFERRABLE INITIALLY DEFERRED,
    CONSTRAINT fato_lancamento_fatura_id_fkey FOREIGN KEY (fatura_id) REFERENCES fatura_cartao(id) DEFERRABLE INITIALLY DEFERRED,
    CONSTRAINT fato_lancamento_importacao_id_fkey FOREIGN KEY (importacao_id) REFERENCES importacao(id) DEFERRABLE INITIALLY DEFERRED,
    CONSTRAINT fato_lancamento_par_transferencia_id_fkey FOREIGN KEY (par_transferencia_id) REFERENCES fato_lancamento(id) DEFERRABLE INITIALLY DEFERRED,
    CONSTRAINT fato_lancamento_pessoa_id_fkey FOREIGN KEY (pessoa_id) REFERENCES dim_pessoa(id) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS fato_posicao (
    data TEXT NOT NULL,
    ativo_id TEXT NOT NULL,
    conta_id TEXT NOT NULL,
    quantidade REAL,
    valor_centavos INTEGER NOT NULL,
    fonte TEXT,
    PRIMARY KEY (data, ativo_id, conta_id),
    CONSTRAINT fato_posicao_ativo_id_fkey FOREIGN KEY (ativo_id) REFERENCES dim_ativo(id) DEFERRABLE INITIALLY DEFERRED,
    CONSTRAINT fato_posicao_conta_id_fkey FOREIGN KEY (conta_id) REFERENCES dim_conta(id) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS fato_vinculo (
    id TEXT NOT NULL,
    tipo TEXT NOT NULL,
    de_pessoa_id TEXT NOT NULL,
    para_pessoa_id TEXT NOT NULL,
    compra_id TEXT,
    valor_centavos INTEGER DEFAULT 0 NOT NULL,
    parcelas INTEGER,
    juros_pct REAL,
    prazo TEXT,
    status TEXT DEFAULT 'aberto' NOT NULL,
    nota TEXT,
    criado_em TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S','now')) NOT NULL,
    conta_codigo TEXT,
    CONSTRAINT fato_vinculo_tipo_check CHECK (tipo IN ('emprestimo', 'ajuda', 'racha')),
    PRIMARY KEY (id),
    CONSTRAINT fato_vinculo_compra_id_fkey FOREIGN KEY (compra_id) REFERENCES compra(id),
    CONSTRAINT fato_vinculo_de_pessoa_id_fkey FOREIGN KEY (de_pessoa_id) REFERENCES dim_pessoa(id),
    CONSTRAINT fato_vinculo_para_pessoa_id_fkey FOREIGN KEY (para_pessoa_id) REFERENCES dim_pessoa(id)
);

CREATE TABLE IF NOT EXISTS fatura_cartao (
    id TEXT NOT NULL,
    conta_id TEXT NOT NULL,
    competencia TEXT NOT NULL,
    vencimento TEXT,
    total_centavos INTEGER NOT NULL,
    detalhada INTEGER DEFAULT 0 NOT NULL,
    importacao_id INTEGER,
    PRIMARY KEY (id),
    CONSTRAINT fatura_cartao_conta_id_fkey FOREIGN KEY (conta_id) REFERENCES dim_conta(id) DEFERRABLE INITIALLY DEFERRED,
    CONSTRAINT fatura_cartao_importacao_id_fkey FOREIGN KEY (importacao_id) REFERENCES importacao(id) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS ferias (
    id INTEGER PRIMARY KEY,
    chave TEXT,
    inicio TEXT NOT NULL,
    fim TEXT NOT NULL,
    grupo TEXT,
    inferido INTEGER DEFAULT 0 NOT NULL,
    nota TEXT,
    CONSTRAINT ferias_chave_key UNIQUE (chave)
);

CREATE TABLE IF NOT EXISTS importacao (
    id INTEGER PRIMARY KEY,
    fonte TEXT NOT NULL,
    arquivo TEXT NOT NULL,
    arquivo_sha256 TEXT NOT NULL,
    importado_em TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S','now')) NOT NULL,
    linhas_lidas INTEGER DEFAULT 0 NOT NULL,
    linhas_novas INTEGER DEFAULT 0 NOT NULL,
    CONSTRAINT importacao_arquivo_sha256_key UNIQUE (arquivo_sha256)
);

CREATE TABLE IF NOT EXISTS lancamento_documento (
    lancamento_id INTEGER NOT NULL,
    documento_id INTEGER NOT NULL,
    confianca REAL DEFAULT 1.0 NOT NULL,
    PRIMARY KEY (lancamento_id, documento_id),
    CONSTRAINT lancamento_documento_documento_id_fkey FOREIGN KEY (documento_id) REFERENCES documento(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    CONSTRAINT lancamento_documento_lancamento_id_fkey FOREIGN KEY (lancamento_id) REFERENCES fato_lancamento(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS parametro (
    chave TEXT NOT NULL,
    valor TEXT NOT NULL,
    PRIMARY KEY (chave)
);

CREATE TABLE IF NOT EXISTS pedido_email (
    ref TEXT NOT NULL,
    data TEXT NOT NULL,
    loja TEXT NOT NULL,
    item TEXT NOT NULL,
    fonte TEXT NOT NULL,
    compra_id TEXT,
    PRIMARY KEY (ref)
);

CREATE TABLE IF NOT EXISTS ref_bloco (
    id TEXT NOT NULL,
    nome TEXT NOT NULL,
    nome_en TEXT NOT NULL,
    meta_pct REAL NOT NULL,
    tipo_meta TEXT NOT NULL,
    cor TEXT,
    CONSTRAINT ref_bloco_tipo_meta_check CHECK (tipo_meta IN ('teto', 'piso')),
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS ref_coicop (
    codigo TEXT NOT NULL,
    nivel TEXT NOT NULL,
    codigo_pai TEXT,
    nome_en TEXT NOT NULL,
    nome_pt TEXT NOT NULL,
    bloco_503020 TEXT,
    origem TEXT NOT NULL,
    CONSTRAINT ref_coicop_bloco_503020_check CHECK (bloco_503020 IN ('necessidade', 'desejo', 'futuro')),
    CONSTRAINT ref_coicop_nivel_check CHECK (nivel IN ('divisao', 'grupo')),
    PRIMARY KEY (codigo),
    CONSTRAINT ref_coicop_codigo_pai_fkey FOREIGN KEY (codigo_pai) REFERENCES ref_coicop(codigo) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS regra_categorizacao (
    id TEXT NOT NULL,
    prioridade INTEGER NOT NULL,
    padrao_regex TEXT,
    padrao_cat_banco TEXT,
    conta_id TEXT,
    sinal TEXT,
    valor_min_centavos INTEGER,
    valor_max_centavos INTEGER,
    tipo TEXT,
    escopo TEXT,
    categoria_id TEXT,
    pessoa_id TEXT,
    extraordinario INTEGER,
    nota TEXT,
    ativa INTEGER DEFAULT 1 NOT NULL,
    CONSTRAINT regra_categorizacao_escopo_check CHECK (escopo IN ('casa', 'pessoal', 'familia', 'investimentos')),
    CONSTRAINT regra_categorizacao_sinal_check CHECK (sinal IN ('+', '-')),
    CONSTRAINT regra_categorizacao_tipo_check CHECK (tipo IN ('despesa', 'receita', 'transferencia', 'investimento')),
    PRIMARY KEY (id),
    CONSTRAINT regra_categorizacao_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES dim_categoria(id) DEFERRABLE INITIALLY DEFERRED,
    CONSTRAINT regra_categorizacao_pessoa_id_fkey FOREIGN KEY (pessoa_id) REFERENCES dim_pessoa(id) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS sankey_link (
    periodo TEXT NOT NULL,
    nivel INTEGER NOT NULL,
    origem TEXT NOT NULL,
    destino TEXT NOT NULL,
    valor REAL NOT NULL,
    tipo TEXT,
    ordem INTEGER DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS viagem (
    id INTEGER PRIMARY KEY,
    chave TEXT,
    nome TEXT NOT NULL,
    destino TEXT,
    ida TEXT NOT NULL,
    volta TEXT NOT NULL,
    nota TEXT,
    margem INTEGER DEFAULT 0 NOT NULL,
    empresa INTEGER DEFAULT 0 NOT NULL,
    CONSTRAINT viagem_chave_key UNIQUE (chave)
);

CREATE TABLE IF NOT EXISTS viagem_compra (
    compra_id TEXT NOT NULL,
    viagem_id INTEGER NOT NULL,
    origem TEXT DEFAULT 'manual' NOT NULL,
    PRIMARY KEY (compra_id),
    CONSTRAINT viagem_compra_viagem_id_fkey FOREIGN KEY (viagem_id) REFERENCES viagem(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX IF NOT EXISTS ix_compra_item_compra ON compra_item (compra_id);

CREATE INDEX IF NOT EXISTS ix_compra_lanc ON compra_lancamento (lancamento_id);

CREATE INDEX IF NOT EXISTS ix_lanc_caixa ON fato_lancamento (data_caixa);

CREATE INDEX IF NOT EXISTS ix_lanc_comp ON fato_lancamento (data_competencia);

CREATE INDEX IF NOT EXISTS ix_lanc_conta ON fato_lancamento (conta_id);

CREATE INDEX IF NOT EXISTS ix_lanc_fatura ON fato_lancamento (fatura_id);

CREATE INDEX IF NOT EXISTS ix_sankey_periodo ON sankey_link (periodo);

CREATE INDEX IF NOT EXISTS ix_viagem_compra_viagem ON viagem_compra (viagem_id);

CREATE INDEX IF NOT EXISTS ix_vinculo_compra ON fato_vinculo (compra_id);

CREATE INDEX IF NOT EXISTS ix_vinculo_de ON fato_vinculo (de_pessoa_id);

CREATE INDEX IF NOT EXISTS ix_vinculo_para ON fato_vinculo (para_pessoa_id);


-- Views (traduzidas à mão do Postgres).

CREATE VIEW IF NOT EXISTS v_custo AS
SELECT l.*,
       substr(l.data_caixa, 1, 7) AS mes_caixa,
       substr(l.data_competencia, 1, 7) AS mes_competencia,
       (-l.valor_centavos) / 100.0 AS custo
FROM fato_lancamento l
WHERE l.tipo = 'despesa' AND l.escopo IN ('casa', 'pessoal', 'familia');

CREATE VIEW IF NOT EXISTS v_custo_mensal AS
SELECT mes_caixa AS mes,
       escopo,
       categoria_id,
       round(sum(CASE WHEN extraordinario = 0 THEN custo ELSE 0 END), 2) AS custo_recorrente,
       round(sum(CASE WHEN extraordinario = 1 THEN custo ELSE 0 END), 2) AS custo_extraordinario,
       count(*) AS n
FROM v_custo
GROUP BY mes_caixa, escopo, categoria_id;

CREATE VIEW IF NOT EXISTS v_mov AS
SELECT l.*,
       CASE WHEN l.conta_id = 'bb_conjunta' THEN 'casa' ELSE 'pessoal' END AS pool,
       c.bloco,
       c.coicop_codigo,
       c.nome AS categoria_nome,
       c.grupo AS categoria_grupo,
       substr(l.data_caixa, 1, 7) AS mes
FROM fato_lancamento l
JOIN dim_categoria c ON c.id = l.categoria_id;

CREATE VIEW IF NOT EXISTS v_transferencia_sem_par AS
SELECT *
FROM fato_lancamento
WHERE tipo = 'transferencia' AND par_transferencia_id IS NULL AND categoria_id = 'interna';

CREATE VIEW IF NOT EXISTS v_ai_subscriptions_summary AS
SELECT count(*) FILTER (WHERE status = 'active') AS total_active_services,
       count(*) FILTER (WHERE cost_usd > 0) AS total_recurring_plans,
       coalesce(sum(cost_usd), 0) AS total_monthly_cost_usd,
       coalesce(sum(cost_brl), 0) AS total_monthly_cost_brl,
       coalesce(sum(balance_usd) FILTER (WHERE balance_usd > 0), 0) AS total_available_credits_usd,
       coalesce(sum(month_spent_usd), 0) AS total_month_spent_usd,
       coalesce(sum(total_spent_usd), 0) AS total_historical_spent_usd,
       min(renewal_date) FILTER (WHERE renewal_date >= date('now')) AS next_renewal_date
FROM dim_ai_subscription;
