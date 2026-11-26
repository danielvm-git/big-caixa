<script lang="ts">
	import { onMount } from 'svelte';
	import { loadVinculos } from '$lib/read-model/client';
	import type { VinculoDoc } from '$lib/read-model/types';
	import { DataState, Money, PageHeader, SegmentedTabs } from '$lib/ui';

	let vinculos = $state<VinculoDoc[]>([]);
	let carregando = $state(true);
	let erro = $state(false);
	let filtroStatus = $state<'todos' | 'ativo' | 'quitado'>('todos');
	let vinculoSelecionadoId = $state<string | null>(null);

	const fmtData = (d?: string) => {
		if (!d) return '—';
		const parts = d.split('-');
		if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
		return d;
	};

	async function carregar() {
		try {
			carregando = true;
			erro = false;
			vinculos = await loadVinculos();
			if (!vinculoSelecionadoId && vinculos.length > 0) {
				const primeiroEmprestimo = vinculos.find((v) => v.tipo === 'emprestimo');
				if (primeiroEmprestimo) vinculoSelecionadoId = primeiroEmprestimo.id;
			}
		} catch (e) {
			console.error('Erro ao carregar vínculos:', e);
			erro = true;
		} finally {
			carregando = false;
		}
	}

	onMount(() => {
		carregar();
	});

	let emprestimos = $derived(vinculos.filter((v) => v.tipo === 'emprestimo'));

	let filtrados = $derived(
		filtroStatus === 'todos' ? emprestimos : emprestimos.filter((v) => v.status === filtroStatus)
	);

	let totalOriginal = $derived(
		emprestimos.reduce((acc, v) => acc + (v.valor_original ?? v.valor_centavos / 100), 0)
	);

	let totalPago = $derived(emprestimos.reduce((acc, v) => acc + (v.total_pago ?? 0), 0));

	let totalAReceber = $derived(emprestimos.reduce((acc, v) => acc + (v.saldo_devedor ?? 0), 0));

	let taxaRecuperacao = $derived(
		totalOriginal > 0 ? Math.round((totalPago / totalOriginal) * 100) : 0
	);

	let qtdQuitados = $derived(emprestimos.filter((v) => v.status === 'quitado').length);
	let qtdAtivos = $derived(emprestimos.filter((v) => v.status !== 'quitado').length);
	let nomesEmAberto = $derived(
		emprestimos
			.filter((v) => (v.saldo_devedor ?? 0) > 0)
			.map((v) => v.para_pessoa_nome || v.para_pessoa_id)
			.join(' e ') || 'Nenhum saldo em aberto'
	);

	let vinculoAtivo = $derived(
		emprestimos.find((v) => v.id === vinculoSelecionadoId) ?? emprestimos[0]
	);

	let statusTabs = $derived([
		{ value: 'todos' as const, label: 'Todos', count: emprestimos.length },
		{
			value: 'ativo' as const,
			label: 'Ativos',
			count: emprestimos.filter((v) => v.status === 'ativo').length
		},
		{
			value: 'quitado' as const,
			label: 'Quitados',
			count: emprestimos.filter((v) => v.status === 'quitado').length
		}
	]);
</script>

<div class="devem-container">
	<PageHeader
		title="Quem deve a quem"
		subtitle="Gestão e conciliação analítica de empréstimos concedidos, amortizações mensais e créditos a receber."
	>
		{#snippet actions()}
			<button class="btn-refresh" onclick={carregar} title="Recarregar dados">
				<i class="ph ph-arrows-clockwise"></i> Atualizar
			</button>
		{/snippet}
	</PageHeader>

	<!-- KPI Cards -->
	<div class="kpi-grid">
		<div class="kpi-card">
			<span class="kpi-label">Total Concedido</span>
			<span class="kpi-value"><Money value={totalOriginal} /></span>
			<span class="kpi-sub">
				{emprestimos.length}
				{emprestimos.length === 1 ? 'operação registrada' : 'operações registradas'}
			</span>
		</div>
		<div class="kpi-card">
			<span class="kpi-label">Já Devolvido / Amortizado</span>
			<span class="kpi-value positive"><Money value={totalPago} /></span>
			<span class="kpi-sub">{taxaRecuperacao}% do montante recuperado</span>
		</div>
		<div class="kpi-card highlight">
			<span class="kpi-label">Saldo em Aberto (A Receber)</span>
			<span class="kpi-value alert"><Money value={totalAReceber} /></span>
			<span class="kpi-sub">{nomesEmAberto}</span>
		</div>
		<div class="kpi-card">
			<span class="kpi-label">Status da Carteira</span>
			<span class="kpi-value">
				{qtdQuitados}
				{qtdQuitados === 1 ? 'Quitado' : 'Quitados'} · {qtdAtivos}
				{qtdAtivos === 1 ? 'Ativo' : 'Ativos'}
			</span>
			<span class="kpi-sub">Conciliado no razão</span>
		</div>
	</div>

	{#if carregando}
		<DataState kind="loading" message="Carregando empréstimos e razão analítico..." />
	{:else if erro}
		<DataState
			kind="error"
			message="Não foi possível carregar os dados de empréstimos."
			detail="Verifique a conexão com o banco."
			onretry={carregar}
		/>
	{:else}
		<!-- Main Content Grid -->
		<div class="main-grid">
			<!-- Lista de Empréstimos -->
			<div class="cards-column">
				<div class="filter-bar">
					<SegmentedTabs
						items={statusTabs}
						value={filtroStatus}
						ariaLabel="Filtrar empréstimos por status"
						onchange={(next) => (filtroStatus = next)}
					/>
				</div>

				<div class="loans-list">
					{#each filtrados as v}
						{@const orig = v.valor_original ?? v.valor_centavos / 100}
						{@const pago = v.total_pago ?? 0}
						{@const saldo = v.saldo_devedor ?? 0}
						{@const pct = orig > 0 ? Math.min(100, Math.round((pago / orig) * 100)) : 0}
						<div
							class="loan-card"
							class:selected={vinculoAtivo?.id === v.id}
							onclick={() => (vinculoSelecionadoId = v.id)}
							role="button"
							tabindex="0"
							aria-pressed={vinculoAtivo?.id === v.id}
							onkeydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									vinculoSelecionadoId = v.id;
								}
							}}
						>
							<div class="loan-card-top">
								<div>
									<div class="loan-name">{v.para_pessoa_nome || v.para_pessoa_id}</div>
									<div class="loan-rel">
										<span class="rel-badge">{v.para_pessoa_relacao}</span>
										<span class="loan-date">Concessão: {fmtData(v.criado_em?.slice(0, 10))}</span>
									</div>
								</div>
								<span class="status-badge" class:quitado={v.status === 'quitado'}>
									{v.status === 'quitado' ? 'QUITADO' : 'EM ABERTO'}
								</span>
							</div>

							<div class="loan-card-middle">
								<div class="val-box">
									<span class="val-label">Original</span>
									<span class="val-num"><Money value={orig} /></span>
								</div>
								<div class="val-box">
									<span class="val-label">Já Pago</span>
									<span class="val-num positive"><Money value={pago} /></span>
								</div>
								<div class="val-box">
									<span class="val-label">Saldo Devedor</span>
									<span class="val-num" class:alert={saldo > 0}><Money value={saldo} /></span>
								</div>
							</div>

							<div class="progress-wrap">
								<div class="progress-labels">
									<span>{pct}% quitado</span>
									<span>{v.historico?.length ?? 0} pagamentos recebidos</span>
								</div>
								<div class="progress-bar">
									<div class="progress-fill" style="width: {pct}%"></div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Painel de Detalhes e Extrato do Empréstimo Selecionado -->
			{#if vinculoAtivo}
				{@const atvOrig = vinculoAtivo.valor_original ?? vinculoAtivo.valor_centavos / 100}
				{@const atvPago = vinculoAtivo.total_pago ?? 0}
				{@const atvSaldo = vinculoAtivo.saldo_devedor ?? 0}
				<div class="detail-panel">
					<div class="detail-header">
						<div>
							<div class="detail-sub">{(vinculoAtivo.para_pessoa_relacao ?? '').toUpperCase()}</div>
							<h2 class="detail-title">
								{vinculoAtivo.para_pessoa_nome || vinculoAtivo.para_pessoa_id}
							</h2>
						</div>
						<span class="status-badge" class:quitado={vinculoAtivo.status === 'quitado'}>
							{vinculoAtivo.status === 'quitado' ? '100% Liquidado' : 'Em Cobrança'}
						</span>
					</div>

					<div class="detail-summary-cards">
						<div class="summary-box">
							<span class="s-label">Principal</span>
							<span class="s-val"><Money value={atvOrig} /></span>
						</div>
						<div class="summary-box">
							<span class="s-label">Total Amortizado</span>
							<span class="s-val positive"><Money value={atvPago} /></span>
						</div>
						<div class="summary-box highlight">
							<span class="s-label">Saldo Restante</span>
							<span class="s-val" class:alert={atvSaldo > 0}><Money value={atvSaldo} /></span>
						</div>
					</div>

					<div class="note-box">
						<i class="ph ph-note"></i>
						<span>{vinculoAtivo.nota}</span>
					</div>

					<!-- Extrato de Devoluções / Amortizações -->
					<div class="history-section">
						<h3 class="section-heading">
							<i class="ph ph-receipt"></i> Extrato de Devoluções Registradas no Razão
						</h3>

						{#if vinculoAtivo.historico && vinculoAtivo.historico.length > 0}
							<div class="history-table-container">
								<table class="history-table">
									<thead>
										<tr>
											<th>Data</th>
											<th>Transação / Contraparte</th>
											<th>Finalidade / Memo Contábil</th>
											<th style="text-align:right">Valor</th>
										</tr>
									</thead>
									<tbody>
										{#each vinculoAtivo.historico as h}
											<tr>
												<td class="td-date">{fmtData(h.data)}</td>
												<td class="td-desc">{h.descricao}</td>
												<td class="td-memo">{h.memo}</td>
												<td class="td-val positive"><Money value={h.valor} /></td>
											</tr>
										{/each}
									</tbody>
									<tfoot>
										<tr>
											<td colspan="3" style="text-align:right;font-weight:600">Total Devolvido:</td>
											<td class="td-val positive" style="font-weight:700">
												<Money value={atvPago} />
											</td>
										</tr>
									</tfoot>
								</table>
							</div>
						{:else}
							<div class="empty-history">
								Nenhum pagamento registrado até o momento para este vínculo.
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.devem-container {
		max-width: 1200px;
		display: flex;
		flex-direction: column;
		gap: 20px;
		animation: fadeIn 0.3s ease-out;
		color: var(--ink);
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.btn-refresh {
		display: flex;
		align-items: center;
		gap: 6px;
		border: 1px solid var(--ln);
		background: var(--sf);
		color: var(--ink);
		padding: 6px 14px;
		border-radius: 8px;
		font-size: 13px;
		cursor: pointer;
		transition: background 0.15s;
	}
	.btn-refresh:hover {
		background: var(--sf2);
	}

	.kpi-grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 12px;
	}

	.kpi-card {
		background: var(--sf);
		border: 1px solid var(--ln);
		border-radius: 12px;
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.kpi-card.highlight {
		border-color: #f59e0b;
		background: rgba(245, 158, 11, 0.04);
	}

	.kpi-label {
		font-size: 12px;
		color: var(--mut);
		font-weight: 500;
	}

	.kpi-value {
		font:
			600 24px 'Source Serif 4',
			serif;
	}

	.kpi-value.positive {
		color: var(--moss);
	}

	.kpi-value.alert {
		color: var(--terra);
	}

	.kpi-sub {
		font-size: 11px;
		color: var(--mut);
		margin-top: 2px;
	}

	.main-grid {
		display: grid;
		grid-template-columns: 420px 1fr;
		gap: 20px;
		align-items: start;
	}

	.cards-column {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.filter-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.loans-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.loan-card {
		background: var(--sf);
		border: 1px solid var(--ln);
		border-radius: 12px;
		padding: 14px;
		cursor: pointer;
		transition:
			border-color 0.15s,
			box-shadow 0.15s;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.loan-card:hover {
		border-color: var(--ink);
	}

	.loan-card.selected {
		border-color: #2563eb;
		box-shadow: 0 0 0 1px #2563eb;
		background: rgba(37, 99, 235, 0.02);
	}

	.loan-card-top {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}

	.loan-name {
		font-weight: 600;
		font-size: 15px;
	}

	.loan-rel {
		display: flex;
		gap: 8px;
		align-items: center;
		margin-top: 3px;
	}

	.rel-badge {
		background: var(--sf2);
		padding: 1px 7px;
		border-radius: 4px;
		font-size: 11px;
		color: var(--mut);
		text-transform: capitalize;
	}

	.loan-date {
		font-size: 11px;
		color: var(--mut);
	}

	.status-badge {
		font-size: 11px;
		font-weight: 600;
		padding: 2px 8px;
		border-radius: 999px;
		background: #fef3c7;
		color: #92400e;
	}

	.status-badge.quitado {
		background: #d1fae5;
		color: #065f46;
	}

	.loan-card-middle {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
		background: var(--sf2);
		padding: 8px 10px;
		border-radius: 8px;
	}

	.val-box {
		display: flex;
		flex-direction: column;
	}

	.val-label {
		font-size: 10px;
		color: var(--mut);
		text-transform: uppercase;
	}

	.val-num {
		font-size: 13px;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.val-num.positive {
		color: #10b981;
	}

	.val-num.alert {
		color: #d97706;
	}

	.progress-wrap {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.progress-labels {
		display: flex;
		justify-content: space-between;
		font-size: 11px;
		color: var(--mut);
	}

	.progress-bar {
		height: 6px;
		background: var(--sf2);
		border-radius: 3px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: #10b981;
		border-radius: 3px;
		transition: width 0.3s;
	}

	/* Detail Panel */
	.detail-panel {
		background: var(--sf);
		border: 1px solid var(--ln);
		border-radius: 14px;
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.detail-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		border-bottom: 1px solid var(--ln);
		padding-bottom: 12px;
	}

	.detail-sub {
		font-size: 11px;
		color: var(--mut);
		font-weight: 600;
		letter-spacing: 0.05em;
	}

	.detail-title {
		font:
			600 22px 'Source Serif 4',
			serif;
		margin: 2px 0 0;
	}

	.detail-summary-cards {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 12px;
	}

	.summary-box {
		background: var(--sf2);
		padding: 12px 14px;
		border-radius: 10px;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.summary-box.highlight {
		background: rgba(245, 158, 11, 0.08);
		border: 1px solid #fde68a;
	}

	.s-label {
		font-size: 11px;
		color: var(--mut);
		text-transform: uppercase;
	}

	.s-val {
		font:
			600 18px 'Source Serif 4',
			serif;
		font-variant-numeric: tabular-nums;
	}

	.s-val.positive {
		color: #10b981;
	}

	.s-val.alert {
		color: #d97706;
	}

	.note-box {
		display: flex;
		gap: 10px;
		align-items: flex-start;
		background: var(--sf2);
		padding: 12px 14px;
		border-radius: 8px;
		font-size: 13px;
		color: var(--ink);
		line-height: 1.4;
	}

	.section-heading {
		font-size: 15px;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 8px;
		margin: 0 0 10px;
	}

	.history-table-container {
		border: 1px solid var(--ln);
		border-radius: 8px;
		overflow: hidden;
	}

	.history-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 13px;
		text-align: left;
	}

	.history-table th {
		background: var(--sf2);
		padding: 8px 12px;
		color: var(--mut);
		font-weight: 600;
		font-size: 11px;
		text-transform: uppercase;
		border-bottom: 1px solid var(--ln);
	}

	.history-table td {
		padding: 10px 12px;
		border-bottom: 1px solid var(--sf2);
		vertical-align: middle;
	}

	.td-date {
		font-size: 12px;
		color: var(--mut);
		white-space: nowrap;
		width: 90px;
	}

	.td-desc {
		font-weight: 500;
	}

	.td-memo {
		font-size: 12px;
		color: var(--mut);
	}

	.td-val {
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.td-val.positive {
		color: var(--moss);
	}

	.history-table tfoot td {
		background: var(--sf2);
		border-bottom: none;
		padding: 10px 12px;
	}

	.empty-history {
		padding: 24px;
		text-align: center;
		color: var(--mut);
		font-size: 13px;
		background: var(--sf2);
		border-radius: 8px;
	}
</style>
