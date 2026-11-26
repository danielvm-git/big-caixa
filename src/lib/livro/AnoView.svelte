<script lang="ts">
	import { book } from '$lib/livro/book.svelte';

	let v = $derived(book.view());
</script>

<div style="max-width:1100px;display:flex;flex-direction:column;gap:16px;animation:up .3s">
	<h1 style="font:600 28px 'Source Serif 4',serif;margin:0">O ano e o que vem a seguir</h1>
	<div style={v.card}>
		<div style="display:flex;gap:16px;font-size:12px;color:var(--mut);margin-bottom:8px">
			<span>■ Real</span><span>▨ Projeção</span><span>— Ritmo normal</span><span>
				- - Mês ideal
			</span>
		</div>
		<div style="position:relative;height:200px;display:flex;align-items:flex-end;gap:10px">
			<div
				style="position:absolute;left:0;right:0;bottom:{v.baseY};border-top:2px solid var(--ink)"
			></div>
			<div
				style="position:absolute;left:0;right:0;bottom:{v.idealY};border-top:2px dashed var(--moss)"
			></div>
			{#each v.ybars as b}
				<div
					style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;gap:3px"
				>
					<span style="font-size:10px;color:var(--mut);{v.bl}">{b.v}</span>
					<div
						style="width:100%;height:{b.h};border-radius:4px 4px 0 0;background:{b.bg};border:{b.bd}"
					></div>
					<span style="font-size:11px">{b.l}</span>
				</div>
			{/each}
		</div>
	</div>
	<div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px">
		<div style="{v.card}display:flex;flex-direction:column;gap:10px">
			<b style="font:600 17px 'Source Serif 4',serif">O que os números dizem</b>
			{#each v.insights as i}
				<div style="display:flex;gap:8px;font-size:14px">
					<i class="ph ph-lightbulb" style="color:var(--sun);font-size:18px"></i><span>
						{i}
					</span>
				</div>
			{/each}
		</div>
		<div style="{v.card}display:flex;flex-direction:column;gap:10px">
			<b style="font:600 17px 'Source Serif 4',serif">E se eu cortar…</b>
			<div style="font-size:14px">Cortar <b>{v.cut}%</b> de Restaurantes</div>
			<input
				type="range"
				min="0"
				max="50"
				value={v.cut}
				oninput={v.setCut}
				style="accent-color:var(--ink)"
			/>
			<div style="font-size:14px">
				Você economiza <b style={v.bl}>{v.saveM}</b> por mês, <b style={v.bl}>{v.saveY}</b>
				por ano. Fechamento do ano projetado: <b style={v.bl}>{v.yearEnd}</b>.
			</div>
		</div>
	</div>
</div>
