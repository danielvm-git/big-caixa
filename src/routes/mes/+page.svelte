<script lang="ts">
	import { onMount } from 'svelte';
	import { loadMes } from '$lib/read-model/client';
	import { filtros } from '$lib/filters';
	import { get } from 'svelte/store';
	import type { MesDoc } from '$lib/read-model/types';

	let rows = $state<MesDoc[]>([]);

	onMount(async () => {
		rows = await loadMes(get(filtros).mes);
	});
</script>

<h1 class="serif">Mês e categorias</h1>
<div class="card">
	{#each rows as r}
		<div class="row">
			<span>{r.categoria_id}</span>
			<span class="mut">{r.escopo}</span>
			<span class="val">
				R$ {(r.custo_recorrente + r.custo_extraordinario).toLocaleString('pt-BR')}
			</span>
		</div>
	{/each}
</div>

<style>
	.row {
		display: grid;
		grid-template-columns: 1fr 100px 120px;
		padding: 8px 0;
		border-top: 1px solid var(--ln);
	}
	.mut {
		color: var(--mut);
	}
	.val {
		text-align: right;
	}
</style>
