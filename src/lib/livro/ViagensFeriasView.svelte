<script lang="ts">
	import { onMount } from 'svelte';
	import { loadViagens, loadFerias } from '$lib/read-model/client';
	import type { ViagemDoc, FeriasDoc } from '$lib/read-model/types';
	import { DataState, Money, PageHeader, SegmentedTabs } from '$lib/ui';

	let viagens = $state<ViagemDoc[]>([]);
	let ferias = $state<FeriasDoc[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	let selectedAno = $state<number>(2026);
	let selectedTripId = $state<number | null>(null);

	const yearOptions = [2027, 2026, 2025, 2024].map((yr) => ({
		value: yr,
		label: String(yr)
	}));

	const MESES = [
		'Jan',
		'Fev',
		'Mar',
		'Abr',
		'Mai',
		'Jun',
		'Jul',
		'Ago',
		'Set',
		'Out',
		'Nov',
		'Dez'
	];

	async function loadData() {
		loading = true;
		error = null;
		try {
			const [vList, fList] = await Promise.all([loadViagens(), loadFerias()]);
			viagens = vList;
			ferias = fList;
			// Default selected trip: latest trip in selected year or first trip
			const yearTrips = vList.filter((v) => v.ida.startsWith(String(selectedAno)));
			if (yearTrips.length > 0) {
				selectedTripId = yearTrips[0].id;
			} else if (vList.length > 0) {
				selectedTripId = vList[0].id;
			}
		} catch (err) {
			error = (err as Error)?.message || 'Erro ao carregar viagens e férias';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadData();
	});

	let selectedTrip = $derived(viagens.find((v) => v.id === selectedTripId) || viagens[0] || null);

	// Filter ferias and trips for the timeline of the selected year
	let timelineFerias = $derived(
		ferias.filter((f) => {
			const startYear = parseInt(f.inicio.slice(0, 4), 10);
			const endYear = parseInt(f.fim.slice(0, 4), 10);
			return startYear === selectedAno || endYear === selectedAno;
		})
	);

	let timelineViagens = $derived(
		viagens.filter((v) => {
			const startYear = parseInt(v.ida.slice(0, 4), 10);
			const endYear = parseInt(v.volta.slice(0, 4), 10);
			return startYear === selectedAno || endYear === selectedAno;
		})
	);

	function isEmpresaTrip(v: ViagemDoc): boolean {
		return Number(v.empresa) === 1;
	}

	function parseIsoLocal(isoDate: string): Date {
		const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
		if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
		return new Date(isoDate);
	}

	// Grouping ferias by grupo / período aquisitivo
	let periodosAquisitivos = $derived.by(() => {
		const groups: Record<
			string,
			{ nome: string; items: FeriasDoc[]; totalDias: number; latest: string }
		> = {};
		for (const f of ferias) {
			const grpName = f.grupo || 'Outros períodos';
			if (!groups[grpName]) {
				groups[grpName] = { nome: grpName, items: [], totalDias: 0, latest: '' };
			}
			const g = groups[grpName];
			g.items.push(f);
			if (f.inicio > g.latest) g.latest = f.inicio;
			const d1 = parseIsoLocal(f.inicio);
			const d2 = parseIsoLocal(f.fim);
			const diffDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24)) + 1;
			g.totalDias += diffDays;
		}
		return Object.values(groups)
			.sort((a, b) => b.latest.localeCompare(a.latest))
			.slice(0, 4);
	});

	// Helper to calculate percentage offset within year
	function getYearDayPct(isoDate: string, year: number): number {
		const d = parseIsoLocal(isoDate);
		if (d.getFullYear() < year) return 0;
		if (d.getFullYear() > year) return 100;
		const startOfYear = new Date(year, 0, 1);
		const dayDiff = Math.max(0, (d.getTime() - startOfYear.getTime()) / (1000 * 3600 * 24));
		return Math.min(100, (dayDiff / 365) * 100);
	}

	function formatDateRange(d1Str: string, d2Str: string) {
		const d1 = parseIsoLocal(d1Str);
		const d2 = parseIsoLocal(d2Str);
		const fmt = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
		return `${fmt(d1)} – ${fmt(d2)} (${Math.round((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24)) + 1} dias)`;
	}
</script>

<div class="vf-container">
	<PageHeader
		title="{selectedAno}: o ano em tempo e estrada"
		subtitle="Férias e viagens num só calendário unificado. Viagens corporativas são custeadas pela empresa e não oneram o orçamento pessoal."
	>
		{#snippet actions()}
			<SegmentedTabs
				items={yearOptions}
				value={selectedAno}
				ariaLabel="Ano do calendário"
				onchange={(yr) => (selectedAno = yr)}
			/>
			<button class="btn-refresh" onclick={loadData} aria-label="Atualizar viagens e férias">
				<i class="ph ph-arrows-clockwise"></i>
			</button>
		{/snippet}
	</PageHeader>

	{#if loading}
		<DataState kind="loading" message="Carregando calendário de férias e viagens..." />
	{:else if error}
		<DataState kind="error" message={error} onretry={loadData} />
	{:else}
		<!-- Timeline Section -->
		<section class="timeline-card">
			<div class="timeline-header">
				<span class="section-badge">Visão Anual</span>
				<div class="legend">
					<span class="leg-item"><span class="leg-box ferias"></span> Férias</span>
					<span class="leg-item"><span class="leg-box trip"></span> Viagem Pessoal</span>
					<span class="leg-item"><span class="leg-box work"></span> Viagem Corporativa</span>
				</div>
			</div>

			<!-- Month labels -->
			<div class="months-bar">
				{#each MESES as m}
					<span class="month-label">{m}</span>
				{/each}
			</div>

			<!-- Track area -->
			<div class="timeline-track">
				<!-- Vacation bars -->
				{#each timelineFerias as f}
					{@const left = getYearDayPct(f.inicio, selectedAno)}
					{@const right = getYearDayPct(f.fim, selectedAno)}
					{@const width = Math.max(2.5, right - left)}
					<div
						class="bar-item bar-ferias"
						style="left: {left}%; width: {width}%; top: 6px;"
						title="Férias: {formatDateRange(f.inicio, f.fim)} - {f.nota || ''}"
					>
						<span class="bar-text">Férias ({formatDateRange(f.inicio, f.fim)})</span>
					</div>
				{/each}

				<!-- Trip bars -->
				{#each timelineViagens as v}
					{@const left = getYearDayPct(v.ida, selectedAno)}
					{@const right = getYearDayPct(v.volta, selectedAno)}
					{@const width = Math.max(3.5, right - left)}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="bar-item bar-trip"
						class:work={isEmpresaTrip(v)}
						class:selected={v.id === selectedTripId}
						style="left: {left}%; width: {width}%; top: 46px;"
						onclick={() => (selectedTripId = v.id)}
						title="{v.nome} ({formatDateRange(v.ida, v.volta)})"
					>
						<span class="bar-text">
							{#if isEmpresaTrip(v)}💼{:else}✈{/if}
							{v.nome}
						</span>
					</div>
				{/each}
			</div>
		</section>

		<!-- Períodos Aquisitivos Grid -->
		<section class="periodos-section">
			<h2 class="subheading">Períodos Aquisitivos de Férias (CLT)</h2>
			<div class="periodos-grid">
				{#each periodosAquisitivos as p}
					<div class="periodo-card">
						<div class="periodo-header">
							<b>Período {p.nome}</b>
							<span class="days-badge">{p.totalDias} de 30 dias</span>
						</div>
						<div class="periodo-items">
							{#each p.items as it}
								<div class="periodo-item-row">
									<span class="item-dates">{formatDateRange(it.inicio, it.fim)}</span>
									{#if it.nota}
										<span class="item-note">{it.nota}</span>
									{:else}
										<span class="item-status">Gozo aprovado</span>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</section>

		<!-- Trip Details Section -->
		{#if selectedTrip}
			<section class="trip-detail-card">
				<div class="trip-header">
					<div class="trip-title-block">
						<div class="trip-type-tag" class:work={isEmpresaTrip(selectedTrip)}>
							{#if isEmpresaTrip(selectedTrip)}
								<i class="ph ph-briefcase"></i> Viagem a Trabalho (Corporativa)
							{:else}
								<i class="ph ph-airplane-takeoff"></i> Viagem Pessoal / Férias
							{/if}
						</div>
						<h2 class="trip-name">{selectedTrip.nome}</h2>
						<span class="trip-dest">{selectedTrip.destino || 'Destino a confirmar'}</span>
					</div>
					<div class="trip-tabs">
						{#each viagens as tr}
							<button
								class="trip-pill-btn"
								class:active={tr.id === selectedTrip.id}
								onclick={() => (selectedTripId = tr.id)}
							>
								{#if isEmpresaTrip(tr)}💼{:else}✈{/if}
								{tr.nome}
							</button>
						{/each}
					</div>
				</div>

				<div class="trip-meta-grid">
					<div class="meta-box">
						<span class="meta-label">Período</span>
						<b class="meta-val">{formatDateRange(selectedTrip.ida, selectedTrip.volta)}</b>
					</div>
					<div class="meta-box">
						<span class="meta-label">Custo Pessoal no Livro</span>
						<b class="meta-val" class:free={selectedTrip.empresa === 1}>
							{#if selectedTrip.empresa === 1}
								<Money value={0} /> (Empresa paga)
							{:else}
								<Money value={selectedTrip.total_gasto || 0} />
							{/if}
						</b>
					</div>
					<div class="meta-box">
						<span class="meta-label">Compras Vinculadas</span>
						<b class="meta-val">{selectedTrip.compras?.length || 0} lançamentos</b>
					</div>
				</div>

				{#if selectedTrip.nota}
					<div class="trip-notes-box">
						<i class="ph ph-info"></i> <b>Observações / Bilhetes:</b>
						{selectedTrip.nota}
					</div>
				{/if}

				<!-- Linked Purchases List -->
				{#if selectedTrip.compras && selectedTrip.compras.length > 0}
					<div class="purchases-section">
						<h3>Despesas & Lançamentos da Viagem</h3>
						<table class="purchases-table">
							<thead>
								<tr>
									<th>Data</th>
									<th>Loja / Estabelecimento</th>
									<th>Descrição</th>
									<th style="text-align: right;">Valor</th>
								</tr>
							</thead>
							<tbody>
								{#each selectedTrip.compras as c}
									<tr>
										<td class="dt">{c.data}</td>
										<td><b>{c.loja}</b></td>
										<td class="desc-col">{c.titulo}</td>
										<td class="amt" style="text-align: right;"><Money value={c.valor} /></td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</section>
		{/if}
	{/if}
</div>

<style>
	.vf-container {
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

	.btn-refresh {
		background: var(--sf);
		border: 1px solid var(--ln);
		padding: 8px 12px;
		border-radius: 8px;
		cursor: pointer;
		color: var(--ink);
	}

	/* Inflow Banner */
	/* Timeline Card */
	.timeline-card {
		background: var(--sf);
		border: 1px solid var(--ln);
		border-radius: 14px;
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.timeline-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.section-badge {
		font-size: 13px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--mut);
	}

	.legend {
		display: flex;
		gap: 16px;
		font-size: 12px;
		color: var(--mut);
	}

	.leg-item {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.leg-box {
		width: 14px;
		height: 14px;
		border-radius: 4px;
	}
	.leg-box.ferias {
		background: var(--sun);
	}
	.leg-box.trip {
		background: #3b82f6;
	}
	.leg-box.work {
		background: transparent;
		border: 2px dashed #9333ea;
	}

	.months-bar {
		display: grid;
		grid-template-columns: repeat(12, 1fr);
		border-bottom: 1px solid var(--ln);
		padding-bottom: 6px;
		font-size: 12px;
		color: var(--mut);
		text-align: center;
	}

	.timeline-track {
		position: relative;
		height: 90px;
		background: var(--sf2);
		border-radius: 10px;
		overflow: hidden;
	}

	.bar-item {
		position: absolute;
		height: 32px;
		border-radius: 8px;
		padding: 0 8px;
		display: flex;
		align-items: center;
		font-size: 12px;
		font-weight: 600;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		cursor: pointer;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		transition: transform 0.15s ease;
	}

	.bar-item:hover {
		transform: scaleY(1.05);
	}

	.bar-ferias {
		background: var(--sun);
		color: var(--onsun);
	}

	.bar-trip {
		background: #3b82f6;
		color: white;
	}

	.bar-trip.work {
		background: #faf5ff;
		color: #9333ea;
		border: 2px dashed #9333ea;
	}

	.bar-trip.selected {
		outline: 2px solid var(--ink);
	}

	.bar-text {
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* Periodos Aquisitivos */
	.subheading {
		font:
			600 20px 'Source Serif 4',
			serif;
		margin: 0 0 12px 0;
	}

	.periodos-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 16px;
	}

	.periodo-card {
		background: var(--sf);
		border: 1px solid var(--ln);
		border-radius: 12px;
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.periodo-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1px solid var(--ln);
		padding-bottom: 8px;
	}

	.days-badge {
		font-size: 12px;
		font-weight: 600;
		background: var(--sf2);
		padding: 2px 8px;
		border-radius: 6px;
	}

	.periodo-items {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.periodo-item-row {
		display: flex;
		justify-content: space-between;
		font-size: 13px;
	}

	.item-dates {
		font-weight: 500;
	}

	.item-note,
	.item-status {
		font-size: 12px;
		color: var(--mut);
	}

	/* Trip Detail Card */
	.trip-detail-card {
		background: var(--sf);
		border: 1px solid var(--ln);
		border-radius: 14px;
		padding: 24px;
		display: flex;
		flex-direction: column;
		gap: 18px;
	}

	.trip-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 16px;
		flex-wrap: wrap;
	}

	.trip-title-block {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.trip-type-tag {
		font-size: 12px;
		font-weight: 600;
		color: #2563eb;
		display: inline-flex;
		align-items: center;
		gap: 4px;
	}

	.trip-type-tag.work {
		color: #9333ea;
	}

	.trip-name {
		font:
			600 24px 'Source Serif 4',
			serif;
		margin: 0;
	}

	.trip-dest {
		font-size: 14px;
		color: var(--mut);
	}

	.trip-tabs {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	.trip-pill-btn {
		background: var(--sf2);
		border: 1px solid var(--ln);
		border-radius: 999px;
		padding: 5px 12px;
		font-size: 13px;
		color: var(--ink);
		cursor: pointer;
	}

	.trip-pill-btn.active {
		background: var(--sun);
		color: var(--onsun);
		font-weight: 600;
	}

	.trip-meta-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 16px;
		background: var(--sf2);
		border-radius: 10px;
		padding: 16px;
	}

	.meta-box {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.meta-label {
		font-size: 12px;
		color: var(--mut);
	}

	.meta-val {
		font-size: 16px;
		color: var(--ink);
	}

	.meta-val.free {
		color: #16a34a;
	}

	.trip-notes-box {
		background: var(--sf2);
		border-radius: 8px;
		padding: 12px 14px;
		font-size: 13px;
		color: var(--ink);
		line-height: 1.5;
	}

	.purchases-section h3 {
		font:
			600 18px 'Source Serif 4',
			serif;
		margin: 0 0 12px 0;
	}

	.purchases-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 13px;
	}

	.purchases-table th {
		text-align: left;
		padding: 8px 12px;
		border-bottom: 2px solid var(--ln);
		color: var(--mut);
		font-size: 12px;
		text-transform: uppercase;
	}

	.purchases-table td {
		padding: 10px 12px;
		border-bottom: 1px solid var(--ln);
	}
</style>
