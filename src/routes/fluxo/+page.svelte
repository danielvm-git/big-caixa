<script lang="ts">
	import { onMount } from 'svelte';
	import { loadSankey } from '$lib/read-model/client';
	import { filtros } from '$lib/filters';
	import { get } from 'svelte/store';
	import type { SankeyDoc } from '$lib/read-model/types';

	let links = $state<SankeyDoc[]>([]);
	let simple = $state(true);

	onMount(async () => {
		links = await loadSankey(get(filtros).mes);
	});
</script>

<h1 class="serif">Para onde foi o dinheiro</h1>
<button class="btn" type="button" onclick={() => (simple = !simple)}>
	{simple ? 'Ver Sankey' : 'Versão simples'}
</button>
<div class="card">
	{#if simple}
		{#each links as l}
			<div class="row">
				<span>{l.origem} → {l.destino}</span>
				<b>{l.valor}</b>
			</div>
		{:else}
			<p class="mut">Sem elos para o período.</p>
		{/each}
	{:else}
		<p class="mut">Sankey SVG liga-se aos dados de `sankey` quando houver volume na collection.</p>
	{/if}
</div>

<style>
	.row {
		display: flex;
		justify-content: space-between;
		padding: 6px 0;
		border-top: 1px solid var(--ln);
	}
	.mut {
		color: var(--mut);
	}
</style>
