<script lang="ts">
	import { onMount } from 'svelte';
	import { loadMes } from '$lib/read-model/client';
	import { filtros } from '$lib/filters';
	import { get } from 'svelte/store';
	import { log } from '$lib/log';
	import type { MesDoc } from '$lib/read-model/types';

	let rows = $state<MesDoc[]>([]);
	let erro = $state(false);

	onMount(async () => {
		const t0 = performance.now();
		try {
			rows = await loadMes(get(filtros).mes);
		} catch {
			erro = true;
		}
		log('info', 'screen_view', {
			route: '/hoje',
			durationMs: Math.round(performance.now() - t0),
			count: rows.length
		});
	});
</script>

<h1 class="serif">Hoje</h1>
<p class="mut">Período {$filtros.mes}</p>
{#if erro}
	<p>Não foi possível ler o livro.</p>
{/if}
<div class="grid">
	<div class="card">
		<div class="mut">Custo de vida</div>
		<div class="big serif">
			R$ {rows
				.reduce((a, r) => a + r.custo_recorrente + r.custo_extraordinario, 0)
				.toLocaleString('pt-BR')}
		</div>
	</div>
	<div class="card">
		<b>Precisa de você</b>
		<p><a href="/pendencias">Classificar pendências</a></p>
		<p><a href="/compras">Conferir compras</a></p>
	</div>
</div>

<style>
	.mut {
		color: var(--mut);
	}
	.grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px;
		margin-top: 16px;
	}
	.big {
		font-size: 36px;
	}
</style>
