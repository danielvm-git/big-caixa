<script lang="ts">
	import { book } from '$lib/livro/book.svelte';

	let v = $derived(book.view());
</script>

<div style="max-width:1100px;display:flex;flex-direction:column;gap:16px;animation:up .3s">
	<h1 style="font:600 28px 'Source Serif 4',serif;margin:0">50/30/20 e metas</h1>
	<p style="margin:0;font-size:13px;color:var(--mut)">{v.metasVinculoNota}</p>
	<div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.2fr);gap:16px">
		<div style="{v.card}display:flex;gap:18px;align-items:center">
			<div
				style="width:150px;height:150px;border-radius:50%;background:{v.donut};display:flex;align-items:center;justify-content:center"
			>
				<div
					style="width:96px;height:96px;border-radius:50%;background:var(--sf);display:flex;align-items:center;justify-content:center;font:600 16px 'Source Serif 4',serif"
				>
					2026
				</div>
			</div>
			<div style="display:flex;flex-direction:column;gap:6px;font-size:13px">
				{#each v.blocks as b}
					<div style="display:flex;gap:8px;align-items:center">
						<span style={b.bx}>{b.b}</span><span>
							{b.n}: <b>{b.real}</b> <span style="color:var(--mut)">(meta {b.meta})</span>
						</span>
					</div>
				{/each}
			</div>
		</div>
		{#if v.showMetasGoals}
			<div style="{v.card}display:flex;flex-direction:column;gap:12px">
				<b style="font:600 17px 'Source Serif 4',serif">Metas</b>
				{#each v.goals as g}
					<div>
						<div style="display:flex;justify-content:space-between;font-size:13px">
							<span>{g.n}</span><span style={v.bl}>{g.t}</span>
						</div>
						<div style="height:10px;background:var(--sf2);border-radius:5px;margin-top:4px">
							<div style="height:10px;border-radius:5px;background:var(--moss);width:{g.w}"></div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
	{#if v.sample}
		<div style={v.card}>
			<b>Mês ideal como referência</b>
			<div style="font-size:14px;color:var(--mut);margin-top:4px">
				Para uma renda de R$ 19.080: R$ 9.540 em necessidades, R$ 5.724 em desejos e R$ 3.816 no
				futuro. Compare no <button
					type="button"
					onclick={v.goFluxo}
					style="border:0;background:transparent;padding:0;color:inherit;text-decoration:underline;cursor:pointer;font:inherit"
				>
					Fluxo de caixa
				</button>, aba “Mês ideal”.
			</div>
		</div>
	{/if}
</div>
