<script lang="ts">
	import { onMount } from 'svelte';
	import {
		loadAiSubscriptions,
		loadAiPricing,
		loadAiSummary,
		atualizarAiSubscription
	} from '$lib/read-model/client';
	import type { AiSubscriptionDoc, AiPricingDoc, AiSummaryDoc } from '$lib/read-model/types';
	import { DataState, Money, PageHeader, SegmentedTabs, formatMoney } from '$lib/ui';

	let subscriptions = $state<AiSubscriptionDoc[]>([]);
	let pricing = $state<AiPricingDoc[]>([]);
	let summary = $state<AiSummaryDoc | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	let activeTab = $state<'all' | 'agents' | 'apis' | 'pricing'>('all');
	let searchQuery = $state('');

	// Modal state for editing balance/spend
	let editingSub = $state<AiSubscriptionDoc | null>(null);
	let editBalance = $state<number>(0);
	let editMonthSpend = $state<number>(0);
	let editRenewalDate = $state<string>('');
	let saving = $state(false);

	async function loadData() {
		loading = true;
		error = null;
		try {
			const [subs, prices, sum] = await Promise.all([
				loadAiSubscriptions(),
				loadAiPricing(),
				loadAiSummary()
			]);
			subscriptions = subs;
			pricing = prices;
			summary = sum;
		} catch (err) {
			error = (err as Error)?.message || 'Erro ao carregar dados de IA';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadData();
	});

	function openEditModal(sub: AiSubscriptionDoc) {
		editingSub = sub;
		editBalance = sub.balance_usd;
		editMonthSpend = sub.month_spent_usd;
		editRenewalDate = sub.renewal_date ? sub.renewal_date.split('T')[0] : '';
	}

	function closeEditModal() {
		editingSub = null;
	}

	async function handleSaveEdit() {
		if (!editingSub) return;
		saving = true;
		try {
			await atualizarAiSubscription({
				provider_key: editingSub.provider_key,
				balance_usd: Number(editBalance),
				month_spent_usd: Number(editMonthSpend),
				renewal_date: editRenewalDate || undefined
			});
			closeEditModal();
			await loadData();
		} catch (err) {
			alert('Erro ao atualizar: ' + ((err as Error)?.message || String(err)));
		} finally {
			saving = false;
		}
	}

	let filteredSubscriptions = $derived(
		subscriptions.filter((s) => {
			if (activeTab === 'agents') {
				if (
					!s.category.toLowerCase().includes('agent') &&
					!s.category.toLowerCase().includes('editor') &&
					!s.category.toLowerCase().includes('completion')
				) {
					return false;
				}
			} else if (activeTab === 'apis') {
				if (
					!s.category.toLowerCase().includes('api') &&
					!s.category.toLowerCase().includes('router') &&
					!s.category.toLowerCase().includes('llm')
				) {
					return false;
				}
			}
			if (searchQuery.trim()) {
				const q = searchQuery.toLowerCase();
				return (
					s.name.toLowerCase().includes(q) ||
					s.category.toLowerCase().includes(q) ||
					(s.models_used || '').toLowerCase().includes(q)
				);
			}
			return true;
		})
	);

	let aiTabs = $derived([
		{ value: 'all' as const, label: 'Todos os Serviços', count: subscriptions.length },
		{ value: 'agents' as const, label: 'Editores & Agentes' },
		{ value: 'apis' as const, label: 'APIs & Modelos' },
		{ value: 'pricing' as const, label: 'Tabela de Preços', count: pricing.length }
	]);

	function formatDate(dStr: string | null) {
		if (!dStr) return '—';
		const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dStr);
		const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(dStr);
		return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
	}

	let creditHint = $derived(
		subscriptions
			.filter((s) => s.balance_usd > 0)
			.sort((a, b) => b.balance_usd - a.balance_usd)
			.slice(0, 3)
			.map((s) => `${s.name}: ${formatMoney(s.balance_usd, { currency: 'USD' })}`)
			.join(' · ') || 'Sem créditos pré-pagos'
	);

	let spendHint = $derived(
		subscriptions
			.filter((s) => s.month_spent_usd > 0)
			.sort((a, b) => b.month_spent_usd - a.month_spent_usd)
			.slice(0, 2)
			.map((s) => `${s.name} (${formatMoney(s.month_spent_usd, { currency: 'USD' })})`)
			.join(' + ') || 'Sem consumo registrado'
	);

	let nextRenewalHint = $derived.by(() => {
		const nextDate = summary?.next_renewal_date?.slice(0, 10);
		if (!nextDate) return 'Nenhuma renovação agendada';
		const match = subscriptions.find((s) => s.renewal_date?.slice(0, 10) === nextDate);
		return match
			? `${match.name} (${formatMoney(match.cost_usd, { currency: 'USD' })}/mês)`
			: 'Próxima cobrança';
	});

	function getProviderBadgeColor(key: string) {
		switch (key) {
			case 'cursor':
				return 'background: #3b82f6; color: white;';
			case 'deepseek':
				return 'background: #0284c7; color: white;';
			case 'openrouter':
				return 'background: #6366f1; color: white;';
			case 'z_ai':
				return 'background: #8b5cf6; color: white;';
			case 'opencode':
				return 'background: #10b981; color: white;';
			case 'xiaomi_mimo':
				return 'background: #f97316; color: white;';
			case 'github_copilot':
				return 'background: #334155; color: white;';
			case 'claude':
				return 'background: #d97706; color: white;';
			case 'antigravity':
				return 'background: #059669; color: white;';
			default:
				return 'background: var(--sf2); color: var(--ink);';
		}
	}
</script>

<div class="ai-view-container">
	<PageHeader
		title="Assinaturas & APIs de IA"
		subtitle="Monitoramento de custos fixos recorrentes, saldos de créditos pré-pagos e consumo de tokens por provedor."
	>
		{#snippet actions()}
			<span class="rate-badge">Câmbio ref: $1.00 USD = R$ 6.00 BRL</span>
			<button class="btn-refresh" onclick={loadData}>
				<i class="ph ph-arrows-clockwise"></i> Atualizar
			</button>
		{/snippet}
	</PageHeader>

	{#if loading}
		<DataState kind="loading" message="Carregando dados de assinaturas de IA..." />
	{:else if error}
		<DataState kind="error" message={error} onretry={loadData} />
	{:else}
		<!-- KPI Summary Cards -->
		{#if summary}
			<section class="kpi-grid">
				<div class="kpi-card highlight">
					<div class="kpi-icon"><i class="ph ph-receipt"></i></div>
					<div class="kpi-content">
						<span class="kpi-label">Compromisso Fixo Mensal</span>
						<div class="kpi-value-row">
							<span class="kpi-value">
								<Money value={summary.total_monthly_cost_usd} currency="USD" />
							</span>
							<span class="kpi-subvalue">/mês</span>
						</div>
						<span class="kpi-hint">
							<Money value={summary.total_monthly_cost_brl} currency="BRL" /> · {summary.total_recurring_plans}
							planos ativos
						</span>
					</div>
				</div>

				<div class="kpi-card green">
					<div class="kpi-icon"><i class="ph ph-wallet"></i></div>
					<div class="kpi-content">
						<span class="kpi-label">Créditos Pré-Pagos Disponíveis</span>
						<div class="kpi-value-row">
							<span class="kpi-value">
								<Money value={summary.total_available_credits_usd} currency="USD" />
							</span>
						</div>
						<span class="kpi-hint">{creditHint}</span>
					</div>
				</div>

				<div class="kpi-card purple">
					<div class="kpi-icon"><i class="ph ph-chart-line-up"></i></div>
					<div class="kpi-content">
						<span class="kpi-label">Consumo no Mês Atual</span>
						<div class="kpi-value-row">
							<span class="kpi-value">
								<Money value={summary.total_month_spent_usd} currency="USD" />
							</span>
						</div>
						<span class="kpi-hint">{spendHint}</span>
					</div>
				</div>

				<div class="kpi-card amber">
					<div class="kpi-icon"><i class="ph ph-calendar-check"></i></div>
					<div class="kpi-content">
						<span class="kpi-label">Próxima Renovação</span>
						<div class="kpi-value-row">
							<span class="kpi-value date">{formatDate(summary.next_renewal_date)}</span>
						</div>
						<span class="kpi-hint">{nextRenewalHint}</span>
					</div>
				</div>
			</section>
		{/if}

		<!-- Live Provider Summary Strip -->
		{#if subscriptions.length > 0}
			<section class="codexbar-banner">
				<div class="codexbar-header">
					<div class="codexbar-title">
						<i class="ph ph-browsers"></i> Resumo de Serviços Ativos
					</div>
					<span class="live-pill">
						● {subscriptions.filter((s) => s.status === 'active').length} ativos
					</span>
				</div>
				<div class="codexbar-chips">
					{#each subscriptions.filter((s) => s.status === 'active') as sub (sub.provider_key)}
						<div class="codex-chip">
							<span class="dot" style={getProviderBadgeColor(sub.provider_key)}></span>
							<b>{sub.name}:</b>
							{#if sub.balance_usd !== 0}
								<Money value={sub.balance_usd} currency="USD" /> saldo
								{#if sub.month_spent_usd > 0}
									(mês: <Money value={sub.month_spent_usd} currency="USD" />)
								{/if}
							{:else if sub.cost_usd > 0}
								{sub.plan_name} (<Money value={sub.cost_usd} currency="USD" />/mês)
							{:else}
								{sub.plan_name}
							{/if}
						</div>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Tabs & Search -->
		<div class="tabs-bar">
			<SegmentedTabs
				items={aiTabs}
				value={activeTab}
				ariaLabel="Filtrar serviços de IA"
				onchange={(next) => (activeTab = next)}
			/>
			{#if activeTab !== 'pricing'}
				<div class="search-box">
					<i class="ph ph-magnifying-glass"></i>
					<input type="text" placeholder="Buscar serviço ou modelo..." bind:value={searchQuery} />
				</div>
			{/if}
		</div>

		<!-- Content: Pricing Table or Cards Grid -->
		{#if activeTab === 'pricing'}
			<section class="pricing-table-card">
				<div class="table-intro">
					<h3>Tabela Comparativa de Preços por 1M de Tokens</h3>
					<p>
						Base de preços oficiais e gateways agregadores para estimativa de custo de inferência.
					</p>
				</div>
				<table class="pricing-table">
					<thead>
						<tr>
							<th>Provedor</th>
							<th>Modelo / Recurso</th>
							<th>Context Window</th>
							<th>Cache Hit (In)</th>
							<th>Cache Miss (In)</th>
							<th>Output</th>
							<th>Notas</th>
						</tr>
					</thead>
					<tbody>
						{#each pricing as p}
							<tr>
								<td>
									<span class="provider-pill" style={getProviderBadgeColor(p.provider_key)}>
										{p.provider_key}
									</span>
								</td>
								<td class="model-name"><b>{p.model_name}</b></td>
								<td><span class="tag-context">{p.context_window || '—'}</span></td>
								<td class="num">
									<Money value={p.input_cache_hit_usd} currency="USD" privacy={false} />
								</td>
								<td class="num">
									<Money value={p.input_cache_miss_usd} currency="USD" privacy={false} />
								</td>
								<td class="num highlight-out">
									<Money value={p.output_usd} currency="USD" privacy={false} />
								</td>
								<td class="notes-col">{p.notes || ''}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</section>
		{:else}
			<!-- Subscriptions Cards Grid -->
			<section class="subs-grid">
				{#each filteredSubscriptions as sub}
					<div class="sub-card">
						<div class="sub-header">
							<div class="sub-title-row">
								<span class="provider-badge" style={getProviderBadgeColor(sub.provider_key)}>
									{sub.name.slice(0, 2).toUpperCase()}
								</span>
								<div>
									<h2 class="sub-name">{sub.name}</h2>
									<span class="sub-category">{sub.category}</span>
								</div>
							</div>
							<span class="status-badge" class:active={sub.status === 'active'}>
								● {sub.status === 'active' ? 'Ativo' : sub.status}
							</span>
						</div>

						<div class="sub-plan-info">
							<div class="plan-label">Plano: <b>{sub.plan_name}</b></div>
							{#if sub.cost_usd > 0}
								<div class="plan-cost">
									<span class="cost-usd"><Money value={sub.cost_usd} currency="USD" /></span>
									<span class="cost-period">
										/{sub.billing_cycle === 'annual' ? 'mês (anual)' : 'mês'}
									</span>
									<span class="cost-brl">(<Money value={sub.cost_brl} currency="BRL" />)</span>
								</div>
							{:else}
								<div class="plan-cost free">
									{sub.billing_cycle === 'pay_as_you_go'
										? 'Pay-as-you-go (Sem mensalidade fixa)'
										: 'Gratuito / Workspace'}
								</div>
							{/if}
						</div>

						<!-- Balances & Metrics -->
						<div class="sub-metrics">
							{#if sub.balance_usd !== 0 || sub.provider_key === 'deepseek' || sub.provider_key === 'opencode' || sub.provider_key === 'openrouter'}
								<div class="metric-row">
									<span class="m-label">Saldo Pré-Pago:</span>
									<span class="m-val balance" class:negative={sub.balance_usd < 0}>
										<Money value={sub.balance_usd} currency="USD" />
									</span>
								</div>
							{/if}
							{#if sub.month_spent_usd > 0}
								<div class="metric-row">
									<span class="m-label">Gasto no Mês:</span>
									<span class="m-val spend">
										<Money value={sub.month_spent_usd} currency="USD" />
									</span>
								</div>
							{/if}
							{#if sub.total_spent_usd > 0}
								<div class="metric-row">
									<span class="m-label">Total Histórico:</span>
									<span class="m-val"><Money value={sub.total_spent_usd} currency="USD" /></span>
								</div>
							{/if}
							{#if sub.renewal_date}
								<div class="metric-row">
									<span class="m-label">Renovação:</span>
									<span class="m-val date">
										<i class="ph ph-calendar-blank"></i>
										{formatDate(sub.renewal_date)}
									</span>
								</div>
							{/if}
						</div>

						{#if sub.models_used}
							<div class="sub-models">
								<span class="models-label">Modelos utilizados:</span>
								<div class="models-tags">
									{#each sub.models_used.split(',') as m}
										<span class="model-tag">{m.trim()}</span>
									{/each}
								</div>
							</div>
						{/if}

						{#if sub.notes}
							<div class="sub-notes">
								<i class="ph ph-info"></i>
								{sub.notes}
							</div>
						{/if}

						<div class="sub-footer">
							<button class="btn-edit" onclick={() => openEditModal(sub)}>
								<i class="ph ph-pencil-simple"></i> Atualizar Saldo / Dados
							</button>
						</div>
					</div>
				{/each}
			</section>
		{/if}
	{/if}

	<!-- Edit Modal -->
	{#if editingSub}
		<div class="modal-backdrop" onclick={closeEditModal} role="presentation">
			<div
				class="modal-dialog"
				onclick={(e) => e.stopPropagation()}
				onkeydown={(e) => e.key === 'Escape' && closeEditModal()}
				role="dialog"
				aria-modal="true"
				tabindex="-1"
			>
				<div class="modal-header">
					<h3>Atualizar {editingSub.name}</h3>
					<button class="btn-close" onclick={closeEditModal}>×</button>
				</div>
				<div class="modal-body">
					<div class="form-group">
						<label for="edit-bal">Saldo de Créditos Pré-Pagos (USD):</label>
						<input id="edit-bal" type="number" step="0.01" bind:value={editBalance} />
					</div>
					<div class="form-group">
						<label for="edit-month">Gasto no Mês Atual (USD):</label>
						<input id="edit-month" type="number" step="0.01" bind:value={editMonthSpend} />
					</div>
					<div class="form-group">
						<label for="edit-ren">Data de Renovação:</label>
						<input id="edit-ren" type="date" bind:value={editRenewalDate} />
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn-cancel" onclick={closeEditModal}>Cancelar</button>
					<button class="btn-save" disabled={saving} onclick={handleSaveEdit}>
						{saving ? 'Salvando...' : 'Salvar Alterações'}
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.ai-view-container {
		display: flex;
		flex-direction: column;
		gap: 24px;
		max-width: 1240px;
		margin: 0 auto;
		animation: up 0.3s ease-out;
	}

	@keyframes up {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.rate-badge {
		background: var(--sf2);
		border: 1px solid var(--ln);
		padding: 6px 12px;
		border-radius: 8px;
		font-size: 12px;
		color: var(--mut);
	}

	.btn-refresh {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: var(--sf);
		border: 1px solid var(--ln);
		color: var(--ink);
		padding: 7px 14px;
		border-radius: 8px;
		font-size: 13px;
		cursor: pointer;
		font-weight: 500;
	}

	.btn-refresh:hover {
		background: var(--sf2);
	}

	/* KPI Grid */
	.kpi-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 16px;
	}

	.kpi-card {
		background: var(--sf);
		border: 1px solid var(--ln);
		border-radius: 14px;
		padding: 18px 20px;
		display: flex;
		align-items: flex-start;
		gap: 16px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
	}

	.kpi-icon {
		width: 44px;
		height: 44px;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 22px;
		background: var(--sf2);
		color: var(--ink);
		flex: none;
	}

	.kpi-card.highlight .kpi-icon {
		background: #eff6ff;
		color: #2563eb;
	}
	.kpi-card.green .kpi-icon {
		background: #f0fdf4;
		color: #16a34a;
	}
	.kpi-card.purple .kpi-icon {
		background: #faf5ff;
		color: #9333ea;
	}
	.kpi-card.amber .kpi-icon {
		background: #fffbeb;
		color: #d97706;
	}

	.kpi-content {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.kpi-label {
		font-size: 12px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--mut);
	}

	.kpi-value-row {
		display: flex;
		align-items: baseline;
		gap: 6px;
	}

	.kpi-value {
		font:
			700 28px/1.1 'Source Serif 4',
			serif;
		color: var(--ink);
	}

	.kpi-value.date {
		font-size: 22px;
	}

	.kpi-subvalue {
		font-size: 14px;
		color: var(--mut);
	}

	.kpi-hint {
		font-size: 12px;
		color: var(--mut);
	}

	/* CodexBar Banner */
	.codexbar-banner {
		background: linear-gradient(135deg, var(--sf) 0%, var(--sf2) 100%);
		border: 1px solid var(--ln);
		border-radius: 14px;
		padding: 16px 20px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.codexbar-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.codexbar-title {
		font-size: 14px;
		font-weight: 600;
		color: var(--ink);
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.live-pill {
		font-size: 11px;
		font-weight: 600;
		color: #16a34a;
		background: #dcfce7;
		padding: 3px 8px;
		border-radius: 999px;
	}

	.codexbar-chips {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
	}

	.codex-chip {
		background: var(--sf);
		border: 1px solid var(--ln);
		padding: 6px 12px;
		border-radius: 8px;
		font-size: 12px;
		color: var(--ink);
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
	}

	/* Tabs */
	.tabs-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 16px;
		border-bottom: 1px solid var(--ln);
		padding-bottom: 12px;
		flex-wrap: wrap;
	}

	.search-box {
		display: flex;
		align-items: center;
		gap: 8px;
		background: var(--sf);
		border: 1px solid var(--ln);
		border-radius: 8px;
		padding: 6px 12px;
		font-size: 13px;
		color: var(--mut);
	}

	.search-box input {
		border: 0;
		background: transparent;
		color: var(--ink);
		font-size: 13px;
		outline: none;
		width: 220px;
	}

	/* Subscriptions Grid */
	.subs-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
		gap: 18px;
	}

	.sub-card {
		background: var(--sf);
		border: 1px solid var(--ln);
		border-radius: 14px;
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 14px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
		transition: border-color 0.15s ease;
	}

	.sub-card:hover {
		border-color: var(--mut);
	}

	.sub-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 12px;
	}

	.sub-title-row {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.provider-badge {
		width: 38px;
		height: 38px;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 14px;
		font-weight: 700;
		flex: none;
	}

	.sub-name {
		font:
			600 18px 'Source Serif 4',
			serif;
		margin: 0;
		color: var(--ink);
	}

	.sub-category {
		font-size: 12px;
		color: var(--mut);
	}

	.status-badge {
		font-size: 11px;
		font-weight: 600;
		padding: 4px 8px;
		border-radius: 999px;
		background: var(--sf2);
		color: var(--mut);
	}

	.status-badge.active {
		background: #dcfce7;
		color: #15803d;
	}

	.sub-plan-info {
		background: var(--sf2);
		border-radius: 10px;
		padding: 12px 14px;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.plan-label {
		font-size: 13px;
		color: var(--ink);
	}

	.plan-cost {
		display: flex;
		align-items: baseline;
		gap: 6px;
	}

	.cost-usd {
		font:
			700 20px 'Source Serif 4',
			serif;
		color: var(--ink);
	}

	.cost-period {
		font-size: 13px;
		color: var(--mut);
	}

	.cost-brl {
		font-size: 13px;
		color: var(--mut);
		margin-left: 4px;
	}

	.plan-cost.free {
		font-size: 13px;
		color: var(--mut);
		font-style: italic;
	}

	.sub-metrics {
		display: flex;
		flex-direction: column;
		gap: 8px;
		border-top: 1px solid var(--ln);
		padding-top: 12px;
	}

	.metric-row {
		display: flex;
		justify-content: space-between;
		font-size: 13px;
	}

	.m-label {
		color: var(--mut);
	}

	.m-val {
		font-weight: 600;
		color: var(--ink);
	}

	.m-val.balance {
		color: #16a34a;
		background: #f0fdf4;
		padding: 2px 8px;
		border-radius: 6px;
	}

	.m-val.balance.negative {
		color: #dc2626;
		background: #fef2f2;
	}

	.m-val.spend {
		color: #9333ea;
	}

	.m-val.date {
		display: inline-flex;
		align-items: center;
		gap: 4px;
	}

	.sub-models {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.models-label {
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--mut);
	}

	.models-tags {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
	}

	.model-tag {
		background: var(--sf2);
		border: 1px solid var(--ln);
		padding: 3px 8px;
		border-radius: 6px;
		font-size: 11px;
		font-family: monospace;
		color: var(--ink);
	}

	.sub-notes {
		background: var(--sf2);
		border-radius: 8px;
		padding: 8px 12px;
		font-size: 12px;
		color: var(--mut);
		line-height: 1.4;
	}

	.sub-footer {
		margin-top: auto;
		border-top: 1px solid var(--ln);
		padding-top: 12px;
	}

	.btn-edit {
		width: 100%;
		background: transparent;
		border: 1px dashed var(--ln);
		color: var(--mut);
		padding: 7px;
		border-radius: 8px;
		font-size: 12px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		transition: all 0.15s ease;
	}

	.btn-edit:hover {
		background: var(--sf2);
		border-color: var(--ink);
		color: var(--ink);
	}

	/* Pricing Table */
	.pricing-table-card {
		background: var(--sf);
		border: 1px solid var(--ln);
		border-radius: 14px;
		padding: 24px;
		overflow-x: auto;
	}

	.table-intro h3 {
		margin: 0 0 4px 0;
		font:
			600 20px 'Source Serif 4',
			serif;
	}

	.table-intro p {
		margin: 0 0 16px 0;
		font-size: 14px;
		color: var(--mut);
	}

	.pricing-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 13px;
	}

	.pricing-table th {
		text-align: left;
		padding: 10px 14px;
		border-bottom: 2px solid var(--ln);
		font-weight: 600;
		color: var(--mut);
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.pricing-table td {
		padding: 12px 14px;
		border-bottom: 1px solid var(--ln);
		vertical-align: middle;
	}

	.pricing-table tr:hover td {
		background: var(--sf2);
	}

	.provider-pill {
		display: inline-block;
		padding: 3px 8px;
		border-radius: 6px;
		font-size: 11px;
		font-weight: 600;
	}

	.model-name {
		font-family: monospace;
	}

	.tag-context {
		background: var(--sf2);
		border: 1px solid var(--ln);
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 11px;
	}

	.num {
		font-variant-numeric: tabular-nums;
		font-weight: 500;
	}

	.num.highlight-out {
		font-weight: 700;
		color: #2563eb;
	}

	.notes-col {
		font-size: 12px;
		color: var(--mut);
	}

	/* Modal */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.45);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 999;
		backdrop-filter: blur(2px);
	}

	.modal-dialog {
		background: var(--sf);
		border: 1px solid var(--ln);
		border-radius: 14px;
		width: 440px;
		max-width: 90vw;
		padding: 24px;
		display: flex;
		flex-direction: column;
		gap: 18px;
		box-shadow: 0 16px 36px rgba(0, 0, 0, 0.18);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.modal-header h3 {
		margin: 0;
		font:
			600 20px 'Source Serif 4',
			serif;
	}

	.btn-close {
		border: 0;
		background: transparent;
		font-size: 22px;
		color: var(--mut);
		cursor: pointer;
	}

	.modal-body {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.form-group label {
		font-size: 13px;
		font-weight: 500;
		color: var(--ink);
	}

	.form-group input {
		background: var(--sf2);
		border: 1px solid var(--ln);
		border-radius: 8px;
		padding: 9px 12px;
		font-size: 14px;
		color: var(--ink);
		outline: none;
	}

	.form-group input:focus {
		border-color: var(--ink);
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 10px;
		margin-top: 8px;
	}

	.btn-cancel {
		background: transparent;
		border: 1px solid var(--ln);
		padding: 8px 14px;
		border-radius: 8px;
		font-size: 13px;
		cursor: pointer;
		color: var(--ink);
	}

	.btn-save {
		background: var(--sun);
		color: var(--onsun);
		border: 0;
		padding: 8px 16px;
		border-radius: 8px;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
	}

	.btn-save:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
</style>
