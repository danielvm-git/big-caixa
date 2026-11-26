<script lang="ts">
	import { book } from '$lib/livro/book.svelte';

	let v = $derived(book.view());
</script>

<div style="max-width:960px;display:flex;flex-direction:column;gap:14px;animation:up .3s">
	<h1 style="font:600 28px 'Source Serif 4',serif;margin:0">Regras de classificação</h1>
	<div style="color:var(--mut);font-size:14px">
		A primeira regra que casa vence. Classificações manuais (cadeado) vencem todas.
	</div>
	<div style="{v.card}display:flex;gap:10px;align-items:center">
		<i class="ph ph-flask"></i><input
			placeholder="Testar: digite uma loja, ex. Uber Trip"
			value={v.test}
			oninput={v.setTest}
			style="flex:1;border:0;background:transparent;color:var(--ink);font-size:14px;outline:0"
		/><span style="font-size:13px">{v.testRes}</span>
	</div>
	{#each v.rules as r}
		<div style="{v.card}display:flex;gap:12px;align-items:center;padding:10px 16px">
			<span style="color:var(--mut);width:20px">{r.i}</span><span style="flex:1;font-size:14px">
				{r.t} → <b>{r.c}</b>
			</span><span style="font-size:12px;color:{r.col}">{r.u}</span><button
				type="button"
				onclick={r.up}
				style={v.btn}
			>
				↑
			</button><button type="button" onclick={r.dn} style={v.btn}>↓</button>
		</div>
	{/each}
</div>
