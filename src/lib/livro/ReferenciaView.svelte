<script lang="ts">
	import { book } from '$lib/livro/book.svelte';

	let v = $derived(book.view());
</script>

<div style="max-width:960px;display:flex;flex-direction:column;gap:10px;animation:up .3s">
	<h1 style="font:600 28px 'Source Serif 4',serif;margin:0">Referência ONU · COICOP 2018</h1>
	<div style="color:var(--mut);font-size:14px">
		As 13 divisões, quanto gastamos em cada e quais categorias da casa apontam para elas.
	</div>
	{#each v.coicop as g}
		<div style="{v.card}padding:10px 16px">
			<button
				type="button"
				onclick={g.tog}
				style="display:flex;width:100%;gap:12px;border:0;background:transparent;color:var(--ink);font-size:14px;cursor:pointer;text-align:left"
			>
				<span style="color:var(--mut);width:24px">{g.k}</span><span style="flex:1">
					{g.n}
				</span><span style="font-variant-numeric:tabular-nums;{v.bl}">{g.v}</span><i class={g.ic}
				></i>
			</button>
			{#if g.open}
				<div style="padding:8px 36px;font-size:13px;color:var(--mut)">
					Categorias da casa: <b style="color:var(--ink)">{g.cats}</b>
				</div>
			{/if}
		</div>
	{/each}
</div>
