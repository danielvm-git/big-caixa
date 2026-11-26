<script lang="ts">
	import { onMount } from 'svelte';
	import { loadEntradas, loadEntradasTransacoes, loadTiposEntrada } from '$lib/read-model/client';
	import type {
		EntradaMensalDoc,
		EntradaTransacaoDoc,
		TipoEntradaDoc
	} from '$lib/read-model/types';
	import EntradaInspectorDrawer from './EntradaInspectorDrawer.svelte';

	const agora = new Date();
	const anoCorrente = agora.getFullYear();
	const mesCorrenteNum = agora.getMonth() + 1;
	let anoAtual = $state(anoCorrente);
	let anosDisponiveis = [anoCorrente, anoCorrente - 1, anoCorrente - 2];
	let entradas = $state<EntradaMensalDoc[]>([]);
	let tipos = $state<TipoEntradaDoc[]>([]);
	let carregando = $state(true);
	let erro = $state(false);

	// Estado do Drawer de inspeção
	let drawerAberto = $state(false);
	let drawerTitulo = $state('');
	let drawerPeriodo = $state('');
	let drawerFiltroOrigem = $state('');
	let drawerFiltroTipoId = $state('');
	let transacoesGaveta = $state<EntradaTransacaoDoc[]>([]);

	const MESES = [
		{ k: 'jan', label: 'janeiro', num: 1 },
		{ k: 'fev', label: 'fevereiro', num: 2 },
		{ k: 'mar', label: 'março', num: 3 },
		{ k: 'abr', label: 'abril', num: 4 },
		{ k: 'mai', label: 'maio', num: 5 },
		{ k: 'jun', label: 'junho', num: 6 },
		{ k: 'jul', label: 'julho', num: 7 },
		{ k: 'ago', label: 'agosto', num: 8 },
		{ k: 'set', label: 'setembro', num: 9 },
		{ k: 'out', label: 'outubro', num: 10 },
		{ k: 'nov', label: 'novembro', num: 11 },
		{ k: 'dez', label: 'dezembro', num: 12 }
	] as const;

	const formatCell = (val: number) => {
		if (!val || val === 0) return '—';
		return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	};

	async function carregarDados() {
		try {
			carregando = true;
			erro = false;
			const [resEntradas, resTipos] = await Promise.all([
				loadEntradas(anoAtual),
				loadTiposEntrada()
			]);
			entradas = resEntradas;
			tipos = resTipos;
		} catch (e) {
			console.error('Erro ao carregar entradas:', e);
			erro = true;
		} finally {
			carregando = false;
		}
	}

	onMount(() => {
		void carregarDados();
	});

	// Totais por mês
	const totaisMes = $derived(
		MESES.reduce(
			(acc, m) => {
				acc[m.k] = entradas.reduce((s, r) => s + (r[m.k] || 0), 0);
				return acc;
			},
			{} as Record<string, number>
		)
	);

	const totalGeralAno = $derived(entradas.reduce((s, r) => s + (r.total || 0), 0));
	const mesReferencia = $derived(anoAtual === anoCorrente ? MESES[mesCorrenteNum - 1] : MESES[11]);
	const divisorMedia = $derived(anoAtual === anoCorrente ? Math.max(1, mesCorrenteNum) : 12);

	async function abrirInspecaoCelula(linha: EntradaMensalDoc, mesNum: number, mesLabel: string) {
		const periodoStr = `${anoAtual}-${String(mesNum).padStart(2, '0')}`;
		drawerPeriodo = periodoStr;
		drawerFiltroOrigem = linha.origem;
		drawerFiltroTipoId = linha.tipo_id;
		drawerTitulo = `${linha.tipo_nome} · ${mesLabel}/${anoAtual}`;
		drawerAberto = true;

		try {
			transacoesGaveta = await loadEntradasTransacoes(periodoStr);
		} catch (err) {
			console.error('Erro ao buscar transações da célula:', err);
		}
	}

	async function abrirInspecaoMes(mesNum: number, mesLabel: string) {
		const periodoStr = `${anoAtual}-${String(mesNum).padStart(2, '0')}`;
		drawerPeriodo = periodoStr;
		drawerFiltroOrigem = '';
		drawerFiltroTipoId = '';
		drawerTitulo = `Todas as Entradas · ${mesLabel}/${anoAtual}`;
		drawerAberto = true;

		try {
			transacoesGaveta = await loadEntradasTransacoes(periodoStr);
		} catch (err) {
			console.error('Erro ao buscar transações do mês:', err);
		}
	}

	async function abrirInspecaoPendentes() {
		drawerPeriodo = String(anoAtual);
		drawerFiltroOrigem = '';
		drawerFiltroTipoId = '4.1.009'; // Outras entradas
		drawerTitulo = `Entradas a Classificar (${anoAtual})`;
		drawerAberto = true;

		try {
			transacoesGaveta = await loadEntradasTransacoes(String(anoAtual));
		} catch (err) {
			console.error('Erro ao buscar pendentes:', err);
		}
	}
</script>

<div class="sheet-container">
	<!-- Cabeçalho Executivo -->
	<div class="sheet-header">
		<div>
			<div class="sheet-pretitle">Planilha Contábil de Receitas</div>
			<h1 class="serif sheet-title">Entradas tipo por mês</h1>
			<p class="sheet-desc">
				Conferência matricial de entradas e receitas. Clique em qualquer valor ou mês para
				inspecionar e reclassificar lançamentos.
			</p>
		</div>

		<div class="sheet-actions">
			<!-- Seletor de Ano -->
			<div class="year-selector">
				{#each anosDisponiveis as ano}
					<button
						class="btn-year"
						class:active={anoAtual === ano}
						onclick={() => {
							anoAtual = ano;
							void carregarDados();
						}}
					>
						{ano}
					</button>
				{/each}
			</div>

			<button
				class="btn-action"
				onclick={() => abrirInspecaoMes(mesReferencia.num, mesReferencia.label)}
			>
				<i class="ph ph-magnifying-glass"></i>Conferir {mesReferencia.label}
			</button>

			<button class="btn-action-alt" onclick={abrirInspecaoPendentes}>
				<i class="ph ph-tag"></i>A classificar
			</button>
		</div>
	</div>

	{#if carregando}
		<div class="sheet-loading">Carregando planilha de receitas…</div>
	{:else if erro}
		<div class="sheet-error">Não foi possível carregar as entradas do livro contábil.</div>
	{:else}
		<!-- Grade da Planilha Fiel à Imagem -->
		<div class="table-scroll-wrap">
			<table class="sheet-table">
				<thead>
					<tr>
						<th class="th-origem">Origem</th>
						<th class="th-tipo">Entradas tipo</th>
						{#each MESES as m}
							<th class="th-mes">
								<button class="btn-th-mes" onclick={() => abrirInspecaoMes(m.num, m.label)}>
									{m.label}
								</button>
							</th>
						{/each}
						<th class="th-total">Total</th>
						<th class="th-media">Média</th>
					</tr>
				</thead>

				<tbody>
					{#if entradas.length === 0}
						<tr>
							<td colspan="16" style="text-align:center;padding:32px;color:var(--mut)">
								Nenhuma receita registrada em {anoAtual}.
							</td>
						</tr>
					{:else}
						{#each entradas as row (row.origem + '_' + row.tipo_id)}
							<tr class="tr-row">
								<td class="td-origem" title={row.origem}>
									<span class="cell-origem-badge">{row.origem}</span>
								</td>
								<td class="td-tipo" title={row.tipo_nome}>
									<div class="tipo-wrap">
										<span class="tipo-nome">{row.tipo_nome}</span>
										{#if row.tipo_id === '4.1.009'}
											<span class="badge-mini-tag">revisar</span>
										{/if}
									</div>
								</td>

								{#each MESES as m}
									{@const val = row[m.k] || 0}
									<td
										class="td-cell"
										class:has-val={val > 0}
										onclick={() => val > 0 && abrirInspecaoCelula(row, m.num, m.label)}
									>
										<span class="cell-num">{formatCell(val)}</span>
									</td>
								{/each}

								<td class="td-total">
									<span class="cell-total">{formatCell(row.total)}</span>
								</td>
								<td class="td-media">
									<span class="cell-media">{formatCell((row.total || 0) / divisorMedia)}</span>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>

				<tfoot>
					<tr class="tr-footer">
						<td colspan="2" class="td-footer-label">Total do mês</td>
						{#each MESES as m}
							<td class="td-footer-num">
								<span class="footer-num">{formatCell(totaisMes[m.k] || 0)}</span>
							</td>
						{/each}
						<td class="td-footer-total">
							<span class="footer-grand-total">{formatCell(totalGeralAno)}</span>
						</td>
						<td class="td-footer-media">
							<span class="footer-grand-media">{formatCell(totalGeralAno / divisorMedia)}</span>
						</td>
					</tr>
				</tfoot>
			</table>
		</div>
	{/if}
</div>

<!-- Drawer de Inspeção e Classificação -->
<EntradaInspectorDrawer
	open={drawerAberto}
	title={drawerTitulo}
	periodo={drawerPeriodo}
	filtroOrigem={drawerFiltroOrigem}
	filtroTipoId={drawerFiltroTipoId}
	transacoes={transacoesGaveta}
	{tipos}
	onclose={() => (drawerAberto = false)}
	onupdated={() => {
		void carregarDados();
		// Atualiza também a lista atual da gaveta
		if (drawerPeriodo) {
			void loadEntradasTransacoes(drawerPeriodo).then((t) => (transacoesGaveta = t));
		}
	}}
/>

<style>
	.sheet-container {
		max-width: 100%;
		display: flex;
		flex-direction: column;
		gap: 20px;
		animation: up 0.3s ease-out;
	}
	.sheet-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		gap: 16px;
		flex-wrap: wrap;
	}
	.sheet-pretitle {
		font-size: 13px;
		color: var(--mut);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		font-weight: 600;
	}
	.sheet-title {
		margin: 4px 0 0;
		font-size: 32px;
		line-height: 1.2;
		font-weight: 600;
	}
	.sheet-desc {
		margin: 6px 0 0;
		color: var(--mut);
		font-size: 14px;
		max-width: 60ch;
	}
	.sheet-actions {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
	}
	.year-selector {
		display: flex;
		background: var(--sf);
		border: 1px solid var(--ln);
		border-radius: 8px;
		padding: 2px;
	}
	.btn-year {
		border: 0;
		background: transparent;
		color: var(--mut);
		font-size: 13px;
		font-weight: 500;
		padding: 5px 12px;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.15s;
	}
	.btn-year.active {
		background: var(--sf2);
		color: var(--ink);
		font-weight: 600;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
	}
	.btn-action {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 7px 12px;
		border-radius: 8px;
		border: 1px solid var(--ln);
		background: var(--sf);
		color: var(--ink);
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
	}
	.btn-action:hover {
		background: var(--sf2);
	}
	.btn-action-alt {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 7px 12px;
		border-radius: 8px;
		border: 1px solid #ffe0b2;
		background: #fff8e1;
		color: #e65100;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
	}
	.btn-action-alt:hover {
		background: #ffecb3;
	}
	.sheet-loading,
	.sheet-error {
		padding: 48px;
		text-align: center;
		font-size: 15px;
		color: var(--mut);
		background: var(--sf);
		border-radius: 12px;
		border: 1px solid var(--ln);
	}
	.sheet-error {
		color: var(--terra);
	}

	/* Tabela estilo planilha */
	.table-scroll-wrap {
		background: var(--sf);
		border: 1px solid var(--ln);
		border-radius: 12px;
		overflow-x: auto;
		width: 100%;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
	}
	.sheet-table {
		width: 100%;
		min-width: 1180px;
		border-collapse: collapse;
		font-size: 12px;
		text-align: left;
		white-space: nowrap;
	}
	.sheet-table th,
	.sheet-table td {
		border-right: 1px solid var(--ln);
		border-bottom: 1px solid var(--ln);
		padding: 6px 5px;
	}
	.sheet-table th:last-child,
	.sheet-table td:last-child {
		border-right: 0;
	}
	thead th {
		background: var(--sf2);
		color: var(--ink);
		font-weight: 600;
		font-size: 11px;
		position: sticky;
		top: 0;
		z-index: 2;
	}
	.th-origem {
		width: 95px;
		min-width: 85px;
	}
	.th-tipo {
		width: 170px;
		min-width: 150px;
	}
	.th-mes {
		text-align: right;
		width: 66px;
		min-width: 60px;
		padding: 2px 2px !important;
	}
	.btn-th-mes {
		width: 100%;
		text-align: right;
		border: 0;
		background: transparent;
		color: inherit;
		font-weight: 600;
		font-size: 11px;
		padding: 3px 2px;
		border-radius: 4px;
		cursor: pointer;
	}
	.btn-th-mes:hover {
		background: var(--ln);
	}
	.th-total {
		text-align: right;
		width: 86px;
		min-width: 78px;
		background: var(--sf2);
	}
	.th-media {
		text-align: right;
		width: 80px;
		min-width: 72px;
		background: rgba(0, 0, 0, 0.03);
	}
	.tr-row:hover td {
		background: rgba(0, 0, 0, 0.015);
	}
	.td-origem {
		font-weight: 500;
	}
	.cell-origem-badge {
		background: var(--sf2);
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 10.5px;
	}
	.td-tipo {
		color: var(--ink);
		font-weight: 500;
	}
	.tipo-wrap {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.tipo-nome {
		overflow: hidden;
		text-overflow: ellipsis;
		font-size: 12px;
	}
	.badge-mini-tag {
		background: #fff3e0;
		color: #e65100;
		border: 1px solid #ffe0b2;
		border-radius: 4px;
		padding: 0 4px;
		font-size: 10px;
		font-weight: 600;
	}
	.td-cell {
		text-align: right;
		font-variant-numeric: tabular-nums;
		color: var(--mut);
		user-select: none;
		font-size: 11.5px;
	}
	.td-cell.has-val {
		color: var(--ink);
		cursor: pointer;
		transition: background-color 0.1s;
	}
	.td-cell.has-val:hover {
		background: #e8f5e9 !important;
		color: #1b5e20;
		font-weight: 600;
	}
	.cell-num {
		display: inline-block;
		width: 100%;
	}
	.td-total {
		text-align: right;
		font-variant-numeric: tabular-nums;
		font-weight: 600;
		background: var(--sf2);
		font-size: 12px;
	}
	.cell-total {
		color: var(--ink);
	}
	.td-media {
		text-align: right;
		font-variant-numeric: tabular-nums;
		font-weight: 500;
		background: rgba(0, 0, 0, 0.02);
		font-size: 11.5px;
	}
	.cell-media {
		color: var(--mut);
	}

	/* Footer Totals */
	.tr-footer td {
		background: var(--sf2);
		font-weight: 600;
		border-bottom: 0;
	}
	.td-footer-label {
		text-transform: uppercase;
		font-size: 11px;
		color: var(--mut);
		letter-spacing: 0.5px;
	}
	.td-footer-num {
		text-align: right;
		font-variant-numeric: tabular-nums;
		font-size: 11.5px;
	}
	.td-footer-total {
		text-align: right;
		font-variant-numeric: tabular-nums;
		font-size: 12.5px;
		color: var(--moss, #2e7d32);
	}
	.td-footer-media {
		text-align: right;
		font-variant-numeric: tabular-nums;
		font-size: 12px;
		color: var(--mut);
	}
</style>
