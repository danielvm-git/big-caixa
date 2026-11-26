<script lang="ts">
	import { book } from '$lib/livro/book.svelte';

	let v = $derived(book.view());
</script>

<div style="max-width:1180px;display:flex;flex-direction:column;gap:14px;animation:up .3s">
	<div style="display:flex;gap:4px;flex-wrap:wrap">
		{#each v.months as mo}
			<button
				type="button"
				onclick={mo.go}
				style="border:1px solid var(--ln);border-radius:8px;padding:5px 11px;font-size:13px;cursor:pointer;background:{mo.bg};color:{mo.col}"
			>
				{mo.l}
			</button>
		{/each}
	</div>
	<div
		style="display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);gap:16px;align-items:start"
	>
		<div style="{v.card}padding:8px 16px">
			<div
				style="display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1.2fr) 86px 52px 66px 70px;gap:8px;padding:8px 0;font-size:11px;color:var(--mut);text-transform:uppercase;letter-spacing:.04em"
			>
				<span>Categoria</span><span></span><span style="text-align:right">Valor</span><span
					style="text-align:right"
				>
					% total
				</span><span style="text-align:right">vs. mês ant.</span><span>12 meses</span>
			</div>
			{#each v.catRows as c}
				<div
					data-hv
					role="button"
					tabindex="0"
					onclick={c.go}
					onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && c.go?.()}
					style="display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1.2fr) 86px 52px 66px 70px;gap:8px;align-items:center;padding:9px 0;border-top:1px solid var(--ln);cursor:pointer;background:{c.bg}"
				>
					<span style="display:flex;gap:8px;align-items:center;font-size:14px">
						<span style={c.bx}>{c.b}</span>{c.n}
					</span>
					<div style="height:10px;background:var(--sf2);border-radius:5px">
						<div style="height:10px;border-radius:5px;background:{c.col};width:{c.w}"></div>
					</div>
					<span style="text-align:right;font-variant-numeric:tabular-nums;{v.bl}">
						{c.v}
					</span><span style="text-align:right;font-size:12px;color:var(--mut)">
						{c.pct}
					</span><span style="text-align:right;font-size:12px;color:{c.dc}">{c.d}</span>
					<svg viewBox="0 0 70 22" style="width:70px;height:22px">
						<polyline points={c.pts} fill="none" stroke="var(--ink)" stroke-width="1.6" />
					</svg>
				</div>
			{/each}
			<div style="font-size:12px;color:var(--mut);padding:10px 0 4px">
				Gastos extraordinários (◆) entram no total, mas ficam fora do ritmo normal.
			</div>
		</div>
		<div style="{v.card}display:flex;flex-direction:column;gap:12px;position:sticky;top:0">
			<div style="display:flex;align-items:center;gap:8px">
				<h2 style="font:600 22px 'Source Serif 4',serif;margin:0;flex:1">{v.cd.n}</h2>
				<span style={v.cd.bx}>{v.cd.b}</span><span style="font-size:12px;color:var(--mut)">
					{v.cd.bn}
				</span>
			</div>
			<div style="display:flex;align-items:flex-end;gap:5px;height:90px">
				{#each v.cd.bars as b}
					<div
						style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;justify-content:flex-end;height:100%"
					>
						<div style="width:100%;height:{b.h};background:{b.c};border-radius:3px 3px 0 0"></div>
						<span style="font-size:9px;color:var(--mut)">{b.l}</span>
					</div>
				{/each}
			</div>
			<div style="font-size:13px">
				<b>Maiores lojas</b>
				{#each v.cd.stores as s3}
					<div
						style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--ln)"
					>
						<span>{s3.n}</span><span style="font-variant-numeric:tabular-nums;{v.bl}">
							{s3.v}
						</span>
					</div>
				{/each}
			</div>
			<div style="font-size:13px">
				<b>Para quem foi o dinheiro</b>
				<div
					style="display:flex;height:14px;border-radius:5px;overflow:hidden;margin:6px 0;gap:2px"
				>
					<div style="flex:5;background:var(--N)"></div>
					<div style="flex:2;background:var(--D)"></div>
					<div style="flex:2;background:var(--F)"></div>
					<div style="flex:1;background:var(--mut)"></div>
				</div>
				<span style="color:var(--mut);font-size:12px">
					{#if v.real}{v.escopoShare}{:else}Casa 50% · Rafael 20% · Mariana 20% · Olivia 10%{/if}
				</span>
			</div>
			<button type="button" onclick={v.cd.go} style={v.btnP}>Ver as compras de {v.cd.n} →</button>
		</div>
	</div>
</div>
