<script lang="ts">
	import { onMount } from 'svelte';
	import { loadCompras } from '$lib/read-model/client';
	import type { CompraDoc } from '$lib/read-model/types';

	let rows = $state<CompraDoc[]>([]);
	let loading = $state(true);
	let selected = $state<CompraDoc | null>(null);

	onMount(async () => {
		try {
			rows = await loadCompras();
		} finally {
			loading = false;
		}
	});

	function brl(cents: number) {
		return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
	}
</script>

<h1 class="serif">Compras e lançamentos</h1>
{#if loading}
	<p>Carregando…</p>
{:else if rows.length === 0}
	<p class="mut">Sem dados nesse período.</p>
{:else}
	<div class="card">
		{#each rows as r}
			<button class="row" type="button" onclick={() => (selected = r)}>
				<span class="mut">{r.data}</span>
				<b>{r.loja}</b>
				<span>{r.categoria_id ?? 'Sem classificar'}</span>
				<span class="val">{brl(r.valor_total_centavos)}</span>
			</button>
		{/each}
	</div>
{/if}
{#if selected}
	<aside class="card panel" aria-label="Detalhe da compra">
		<h2 class="serif">{selected.loja}</h2>
		<p class="mut">{selected.data}</p>
		<p>{brl(selected.valor_total_centavos)}</p>
		<p>{selected.categoria_id ?? 'Sem classificar'}</p>
		<button class="btn" type="button" onclick={() => (selected = null)}>Fechar</button>
	</aside>
{/if}

<style>
	.panel {
		margin-top: 16px;
	}
	.row {
		width: 100%;
		background: none;
		border: 0;
		border-top: 1px solid var(--ln);
		text-align: left;
		cursor: pointer;
		display: grid;
		grid-template-columns: 90px 1fr 140px 120px;
		gap: 8px;
		padding: 8px 0;
		border-top: 1px solid var(--ln);
		font-size: 14px;
	}
	.mut {
		color: var(--mut);
	}
	.val {
		text-align: right;
	}
</style>
