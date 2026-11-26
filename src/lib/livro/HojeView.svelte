<script lang="ts">
	import { book } from '$lib/livro/book.svelte';

	let v = $derived(book.view());
</script>

<div style="display:flex;flex-direction:column;gap:20px;max-width:1180px;animation:up .3s">
	<div>
		<div style="color:var(--mut);font-size:14px">{v.greet} · {v.today}</div>
		<h1 style="font:600 32px/1.2 'Source Serif 4',serif;margin:6px 0 0;text-wrap:pretty">
			{v.headline}
		</h1>
	</div>
	<div style="display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:16px">
		<div style={v.card}>
			<div style="font-size:13px;color:var(--mut)">Custo de vida até agora</div>
			<div style="display:flex;align-items:baseline;gap:14px;margin:6px 0 14px">
				<span style="font:600 44px 'Source Serif 4',serif;font-variant-numeric:tabular-nums;{v.bl}">
					{v.spentNow}
				</span><span style="color:var(--mut);font-size:14px">
					<span style={v.bl}>{v.paceNote}</span>
				</span>
			</div>
			{#if v.extraNote}<div style="font-size:13px;color:var(--terra);margin:-6px 0 10px">
					{v.extraNote}
				</div>{/if}
			<div style="position:relative;height:14px;border-radius:7px;background:var(--sf2)">
				<div style="height:14px;border-radius:7px;background:var(--terra);width:{v.barW}"></div>
				<div
					style="position:absolute;left:{v.baseW};top:-5px;width:2px;height:24px;background:var(--ink)"
				></div>
			</div>
			<div
				style="display:flex;justify-content:space-between;font-size:12px;color:var(--mut);margin-top:6px"
			>
				<span>Marca preta = referência do período</span><span>
					<b style="color:var(--ink);{v.bl}">{v.projectionNote}</b>
				</span>
			</div>
		</div>
		<div style="{v.card}display:flex;flex-direction:column;gap:10px">
			<div style="font:600 17px 'Source Serif 4',serif">Precisa de você</div>
			<button onclick={v.goPend} style={v.rowBtn}>
				<i class="ph ph-tag" style="color:var(--terra);font-size:20px"></i><span
					style="flex:1;text-align:left"
				>
					<b>
						{v.real ? v.pendN + ' pendências no livro' : v.pendN + ' compras sem classificação'}
					</b><br /><span style="color:var(--mut);font-size:12px;{v.bl}">
						{v.real ? 'Sem regra, faturas ou transferências' : v.pendTot + ' no total'}
					</span>
				</span>→
			</button>
			{#if v.sample}
				<button onclick={v.goCompras} style={v.rowBtn}>
					<i class="ph ph-credit-card" style="color:var(--terra);font-size:20px"></i><span
						style="flex:1;text-align:left"
					>
						<b>1 fatura para conferir</b><br /><span style="color:var(--mut);font-size:12px">
							Itaú Visa: diferença de R$ 1,50
						</span>
					</span>→
				</button>
				<button onclick={v.goImport} style={v.rowBtn}>
					<i class="ph ph-arrows-left-right" style="color:var(--terra);font-size:20px"></i><span
						style="flex:1;text-align:left"
					>
						<b>2 transferências sem par</b><br /><span style="color:var(--mut);font-size:12px">
							Caixa poupança ↔ Itaú
						</span>
					</span>→
				</button>
			{/if}
		</div>
	</div>
	{#if v.real}<div style="{v.card}display:flex;gap:12px;align-items:center;flex-wrap:wrap">
			<b>Quem deve a quem</b>
			<span style="font-size:13px;color:var(--mut)">A receber:</span>
			<b style={v.bl}>{v.hojeDevemAReceber}</b>
			<button type="button" onclick={v.goDevem} style={v.btn}>Ver todas as contas →</button>
		</div>{/if}
	<div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px">
		{#each v.scopes as sc}<div style={v.card}>
				<div style="font-size:13px;color:var(--mut)">{sc.n}</div>
				<div style="font:600 22px 'Source Serif 4',serif;font-variant-numeric:tabular-nums;{v.bl}">
					{sc.v}
				</div>
				<svg viewBox="0 0 100 28" style="width:100%;height:30px;margin-top:6px">
					<polyline
						points={sc.pts}
						fill="none"
						stroke="var(--ink)"
						stroke-width="2"
						stroke-linejoin="round"
					/>
				</svg>
			</div>{/each}
	</div>
	<div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px">
		<div style={v.card}>
			<div style="font:600 17px 'Source Serif 4',serif;margin-bottom:10px">
				Maiores categorias do mês
			</div>
			{#each v.topCats as c}<button
					onclick={c.go}
					style="{v.rowBtn}border-bottom:1px solid var(--ln);border-radius:0"
				>
					<span style="flex:1;text-align:left">{c.n}</span><span
						style="font-variant-numeric:tabular-nums;{v.bl}"
					>
						{c.v}
					</span><span style="width:64px;text-align:right;font-size:12px;color:{c.col}">
						{c.d}
					</span>
				</button>{/each}
		</div>
		<div style={v.card}>
			<div style="font:600 17px 'Source Serif 4',serif;margin-bottom:10px">Por vir</div>
			<div style="display:flex;flex-direction:column;gap:12px;font-size:14px">
				<div style="display:flex;gap:10px">
					<i class="ph ph-credit-card" style="font-size:20px"></i><span style="flex:1">
						Fatura Nubank vence em 28/11 <span style="color:var(--mut)">(5 dias)</span>
					</span><b style="font-variant-numeric:tabular-nums;{v.bl}">R$ 4.812</b>
				</div>
				<div style="display:flex;gap:10px">
					<i class="ph ph-airplane-tilt" style="font-size:20px"></i><span style="flex:1">
						Férias de dezembro em <b>28 dias</b><br /><span style="color:var(--mut);font-size:12px">
							já gasto: <span style={v.bl}>R$ 1.150</span> de entrada
						</span>
					</span>
				</div>
				<div style="display:flex;gap:10px">
					<i class="ph ph-repeat" style="font-size:20px"></i><span style="flex:1">
						3 assinaturas renovam em dezembro
					</span><b style="font-variant-numeric:tabular-nums;{v.bl}">R$ 214</b>
				</div>
			</div>
		</div>
	</div>
	<div style="display:flex;gap:10px;flex-wrap:wrap">
		<button onclick={v.goImport} style={v.btn}>
			<i class="ph ph-upload-simple"></i> Importar extratos
		</button>
		<button onclick={v.newPurchase} style={v.btn}>
			<i class="ph ph-plus"></i> Nova compra manual
		</button>
		<button onclick={v.openClose} style={v.btnP}>
			<i class="ph ph-flag-banner"></i> Abrir fechamento do mês
		</button>
	</div>
</div>
