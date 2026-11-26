<script lang="ts">
	import { book } from '$lib/livro/book.svelte';

	let v = $derived(book.view());
</script>

<div style="max-width:1180px;display:flex;flex-direction:column;gap:14px;animation:up .3s">
	<div style="font-size:13px;color:var(--mut)">
		{v.fluxoVinculosNota}
		<button
			type="button"
			onclick={v.goDevem}
			style="border:0;background:0;color:var(--ink);cursor:pointer;text-decoration:underline"
		>
			Quem deve a quem
		</button>
	</div>
	<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
		<h1 style="font:600 28px 'Source Serif 4',serif;margin:0;flex:1">Para onde foi o dinheiro</h1>
		<div style="display:flex;gap:4px;background:var(--sf2);padding:3px;border-radius:10px">
			{#each v.sTabs as t}<button
					onclick={t.go}
					style="border:0;border-radius:8px;padding:5px 12px;font-size:13px;cursor:pointer;background:{t.bg};color:var(--ink);font-weight:{t.fw}"
				>
					{t.l}
				</button>{/each}
		</div>
		<button onclick={v.toggleSimple} style={v.btn}>{v.simpleLabel}</button>
	</div>
	<div style="font-size:13px;color:var(--mut)">{v.fluxoHint}</div>
	<div style="{v.card}overflow:auto">
		{#if v.notSimple}<svg viewBox="0 0 1000 540" style="width:100%;min-width:760px;height:auto">
				{#each v.sk.links as l}<path
						d={l.d}
						fill="none"
						stroke={l.c}
						stroke-width={l.w}
						opacity=".32"
					/>{/each}
				{#each v.sk.nodes as n}<g
						role="button"
						tabindex="0"
						onclick={n.go}
						onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && n.go?.()}
						style="cursor:pointer"
					>
						<rect x={n.x} y={n.y} width="14" height={n.h} rx="3" fill={n.c} /><text
							x={n.tx}
							y={n.ty}
							font-size="12.5"
							fill="var(--ink)"
							style="paint-order:stroke;stroke:var(--sf);stroke-width:4px;{v.bl}"
						>
							{n.t}
						</text>
					</g>{/each}
			</svg>{/if}
		{#if v.simple}<div style="display:flex;flex-direction:column;gap:14px;max-width:520px">
				{#each v.stack as b}<div>
						<div
							style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px"
						>
							<b>{b.n}</b><span style={v.bl}>{b.v}</span>
						</div>
						<div style="display:flex;height:22px;border-radius:6px;overflow:hidden;gap:2px">
							{#each b.segs as g}<button
									type="button"
									title={String(g.n)}
									aria-label={String(g.n)}
									onclick={g.go}
									style="border:0;padding:0;width:{g.w};background:{b.c};opacity:{g.o};cursor:pointer"
								></button>{/each}
						</div>
					</div>{/each}
			</div>{/if}
		{#if v.sk.reserva}<div style="margin-top:8px;font-size:12px;color:var(--terra)">
				Este mês gastamos mais do que entrou: a diferença veio das reservas.
			</div>{/if}
	</div>
</div>
