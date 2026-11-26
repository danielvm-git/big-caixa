<script lang="ts">
	import Casa from '$lib/livro/Casa.svelte';
	import { book } from '$lib/livro/book.svelte';

	interface Props {
		secao?: 'mapa' | 'pessoas' | 'custo';
	}

	let { secao = 'mapa' }: Props = $props();
	let v = $derived(book.view());
</script>

{#if secao === 'mapa'}
	<div style="max-width:1240px;display:flex;flex-direction:column;gap:16px;animation:up .3s">
		<h1 style="font:600 28px 'Source Serif 4',serif;margin:0">Nossa casa</h1>
		<div style={v.card}>
			<Casa pins={v.casaPins} empty={v.casaEmpty} onstartWizard={v.startCasaWizard} />
		</div>
		{#if v.wzStep >= 0}
			<div style="{v.card}display:flex;flex-direction:column;gap:10px">
				<b>Passo {v.wzStep + 1} de 3</b>
				<p style="margin:0;color:var(--mut);font-size:14px">
					{v.wzStep === 0
						? 'Quem mora na casa'
						: v.wzStep === 1
							? 'Lugares da rotina'
							: 'Como aparecem no extrato'}
				</p>
				<button type="button" onclick={v.wzStep < 2 ? v.wzNext : v.wzDone} style={v.btnP}>
					{v.wzStep < 2 ? 'Continuar' : 'Concluir'}
				</button>
			</div>
		{/if}
	</div>
{:else if secao === 'pessoas'}
	<div style="max-width:1100px;display:flex;flex-direction:column;gap:16px;animation:up .3s">
		<h1 style="font:600 28px 'Source Serif 4',serif;margin:0">Pessoas</h1>
		<button type="button" onclick={v.openModalAm} style={v.btn}>Adicionar pessoa</button>
		{#each v.pessoasPorCirculo as g}
			<div style={v.card}>
				<div style="font:600 17px 'Source Serif 4',serif;margin-bottom:8px">{g.circulo}</div>
				{#each g.pessoas as p}
					<button type="button" onclick={p.go} style="{v.rowBtn}border-bottom:1px solid var(--ln)">
						<span style="flex:1;text-align:left;font-weight:600">{p.n}</span>
						<span style="color:var(--mut)">{p.r}</span>
					</button>
				{/each}
			</div>
		{/each}
	</div>
{:else if secao === 'custo'}
	<div style="max-width:1100px;display:flex;flex-direction:column;gap:16px;animation:up .3s">
		<div style="display:flex;justify-content:space-between;align-items:baseline">
			<h1 style="font:600 28px 'Source Serif 4',serif;margin:0">Custo e pagamentos da casa</h1>
			<span style="color:var(--mut);font-size:14px">{v.perLabel}</span>
		</div>
		{#if v.custoItens?.length}
			<div style="{v.card}display:flex;flex-direction:column;gap:10px">
				<div
					style="font:600 14px 'Source Serif 4',serif;padding-bottom:8px;border-bottom:1px solid var(--ln);display:grid;grid-template-columns:1fr 140px 140px;gap:12px"
				>
					<span>Categoria</span>
					<span style="text-align:right">Recorrente</span>
					<span style="text-align:right">Total</span>
				</div>
				{#each v.custoItens as it}
					<div
						style="display:grid;grid-template-columns:1fr 140px 140px;gap:12px;align-items:center;padding:6px 0;border-bottom:1px solid var(--sf2);font-size:13px"
					>
						<span style="font-weight:500">{it.nome}</span>
						<span
							style="text-align:right;color:var(--mut);font-variant-numeric:tabular-nums;{v.bl}"
						>
							{it.recorrente}
						</span>
						<span style="text-align:right;font-weight:600;font-variant-numeric:tabular-nums;{v.bl}">
							{it.total}
						</span>
					</div>
				{/each}
			</div>
		{:else}
			<div style={v.card}>{v.casaCadastroFalta}</div>
		{/if}
	</div>
{/if}
