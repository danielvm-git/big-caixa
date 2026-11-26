<script lang="ts">
	import { book } from '$lib/livro/book.svelte';

	let v = $derived(book.view());
</script>

<div style="max-width:960px;display:flex;flex-direction:column;gap:14px;animation:up .3s">
	<h1 style="font:600 28px 'Source Serif 4',serif;margin:0">
		{v.real ? v.pendN + ' pendências no ano' : 'Falta classificar ' + v.pendN + ' compras'}
	</h1>
	{#if v.pendEmpty}
		<div style="{v.card}text-align:center;padding:48px">
			<i class="ph ph-confetti" style="font-size:32px"></i>
			<div style="font:600 20px 'Source Serif 4',serif">Tudo classificado</div>
		</div>
	{/if}
	{#if v.real}
		{#each v.pendSummary as p}
			<div style="{v.card}padding:14px 16px;font-size:14px">
				<b>{p.title}</b> · {p.n}{#if p.detail}
					<span style="color:var(--mut)"> — {p.detail}</span>{/if}
			</div>
		{/each}
	{:else}
		{#each v.pend as p}
			<div style="{v.card}display:flex;gap:14px;align-items:center;padding:12px 16px">
				<div
					role="button"
					tabindex="0"
					style="flex:1;cursor:pointer"
					onclick={p.open}
					onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && p.open?.()}
				>
					<b>{p.loja}</b><br /><span style="font-size:12px;color:var(--mut)">
						{p.titulo} · {p.date}
					</span>
				</div>
				<span style="font-variant-numeric:tabular-nums;{v.bl}">{p.v}</span>
				{#if p.sug}<span style="font-size:13px;color:var(--mut)">
						parece <b style="color:var(--ink)">{p.sug}</b>{#if p.conf}, {p.conf}{/if}
					</span>{/if}
				<button type="button" onclick={p.ok} style={v.btnP}>Aprovar</button>
			</div>
		{/each}
	{/if}
</div>
