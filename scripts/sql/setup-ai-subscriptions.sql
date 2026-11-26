CREATE SCHEMA IF NOT EXISTS caixa;

CREATE TABLE IF NOT EXISTS caixa.dim_ai_subscription (
  id SERIAL PRIMARY KEY,
  provider_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  billing_cycle TEXT NOT NULL, -- 'monthly', 'annual', 'pay_as_you_go', 'free'
  cost_usd NUMERIC(10,2) NOT NULL DEFAULT 0,
  cost_brl NUMERIC(10,2) NOT NULL DEFAULT 0,
  balance_usd NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_spent_usd NUMERIC(10,2) NOT NULL DEFAULT 0,
  month_spent_usd NUMERIC(10,2) NOT NULL DEFAULT 0,
  renewal_date DATE,
  auto_renew BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'active',
  models_used TEXT,
  pricing_summary TEXT,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS caixa.dim_ai_model_pricing (
  id SERIAL PRIMARY KEY,
  provider_key TEXT NOT NULL,
  model_name TEXT NOT NULL,
  input_cache_hit_usd NUMERIC(10,4),
  input_cache_miss_usd NUMERIC(10,4),
  output_usd NUMERIC(10,4),
  context_window TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aggregate summary view
CREATE OR REPLACE VIEW caixa.v_ai_subscriptions_summary AS
SELECT
  COUNT(*) FILTER (WHERE status = 'active') AS total_active_services,
  COUNT(*) FILTER (WHERE cost_usd > 0) AS total_recurring_plans,
  COALESCE(SUM(cost_usd), 0) AS total_monthly_cost_usd,
  COALESCE(SUM(cost_brl), 0) AS total_monthly_cost_brl,
  COALESCE(SUM(balance_usd) FILTER (WHERE balance_usd > 0), 0) AS total_available_credits_usd,
  COALESCE(SUM(month_spent_usd), 0) AS total_month_spent_usd,
  COALESCE(SUM(total_spent_usd), 0) AS total_historical_spent_usd,
  MIN(renewal_date) FILTER (WHERE renewal_date >= CURRENT_DATE) AS next_renewal_date
FROM caixa.dim_ai_subscription;
