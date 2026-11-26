<script lang="ts">
	import { book } from '$lib/livro/book.svelte';

	let v = $derived(book.view());
</script>

<div style="display:flex;flex-direction:column;gap:12px;animation:up .3s">
	<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
		<div style="display:flex;gap:4px;background:var(--sf2);padding:3px;border-radius:10px">
			{#each v.vTabs as t}<button
					onclick={t.go}
					style="border:0;border-radius:8px;padding:5px 12px;font-size:13px;cursor:pointer;background:{t.bg};color:var(--ink);font-weight:{t.fw}"
				>
					{t.l}
				</button>{/each}
		</div>
		{#each v.quick as q}<button
				onclick={q.go}
				style="border:1px solid var(--ln);border-radius:999px;padding:4px 11px;font-size:12px;cursor:pointer;background:{q.bg};color:var(--ink)"
			>
				{q.l}
			</button>{/each}
		<div style="flex:1"></div>
		<span style="font-size:12px;color:var(--mut)">Estado:</span>
		{#each v.dsTabs as d}<button
				onclick={d.go}
				style="border:0;background:{d.bg};color:var(--ink);border-radius:6px;padding:3px 8px;font-size:12px;cursor:pointer"
			>
				{d.l}
			</button>{/each}
	</div>
	{#if v.selN}<div
			style="background:var(--sun);color:var(--onsun);border-radius:12px;padding:8px 14px;display:flex;gap:12px;align-items:center;font-size:14px;animation:up .2s"
		>
			<b>{v.selN} selecionadas</b><select
				onchange={v.bulkCat}
				style="padding:5px;border-radius:6px;border:0"
			>
				<option value="">Classificar como…</option>{#each v.catNames as cn}<option value={cn}>
						{cn}
					</option>{/each}
			</select><button
				onclick={v.clearSel}
				style="border:0;background:transparent;color:inherit;cursor:pointer;text-decoration:underline"
			>
				Limpar
			</button>
		</div>{/if}
	{#if v.ds.normal}<div style="{v.card}padding:0;overflow:auto">
			{#if v.vCompras}<div style="min-width:900px">
					<div
						style="{v.gridC}font-size:11px;color:var(--mut);text-transform:uppercase;letter-spacing:.04em;padding:10px 14px"
					>
						<span></span><span>Data</span><span>Loja e título</span><span> Categoria </span><span>
							Parc.
						</span><span style="text-align:right">Total</span><span style="text-align:right">
							Pago
						</span><span>Origem</span>
					</div>
					{#each v.rows as r}<div
							data-hv
							role="button"
							tabindex="0"
							onclick={r.open}
							onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && r.open?.()}
							style="{v.gridC}padding:8px 14px;border-top:1px solid var(--ln);cursor:pointer;background:{r.bg};font-size:14px"
						>
							<input
								type="checkbox"
								checked={r.chk}
								onclick={r.pick}
								style="accent-color:var(--ink)"
							/>
							<span style="color:var(--mut);font-size:13px">{r.date}</span>
							<span style="min-width:0">
								<b style="font-weight:500">{r.loja}</b><br /><span
									style="font-size:12px;color:var(--mut)"
								>
									{r.titulo}
									{#if r.hasP}
										· <span style="color:var(--plum)">{r.pessoa}</span>
									{/if}
									{r.ext}
								</span>
							</span>
							<span>
								<button onclick={r.chip} style={r.chipS}>
									<span style={r.bx}>{r.b}</span>{r.cat}{#if r.lock}<i
											class="ph ph-lock-simple"
											title="Edição manual: vence as regras"
											style="font-size:12px"
										></i>{/if}
								</button>
							</span>
							<span style="font-size:13px;color:var(--mut)">{r.parc}</span>
							<span style="text-align:right;font-variant-numeric:tabular-nums;{v.bl}">
								{r.total}
							</span><span
								style="text-align:right;font-variant-numeric:tabular-nums;color:var(--mut);{v.bl}"
							>
								{r.pago}
							</span>
							<span style="font-size:12px;color:var(--mut)">{r.orig}</span>
						</div>{/each}
				</div>{/if}
			{#if v.vLanc}<div style="min-width:760px">
					<div
						style="display:grid;grid-template-columns:70px 1.6fr 1fr 1fr 100px 110px;gap:10px;font-size:11px;color:var(--mut);text-transform:uppercase;padding:10px 14px"
					>
						<span>Data</span><span>Descrição</span><span>Conta</span><span> Fatura </span><span
							style="text-align:right"
						>
							Valor
						</span><span>Situação</span>
					</div>
					{#each v.lanc as r}<div
							data-hv
							role="button"
							tabindex="0"
							onclick={r.open}
							onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && r.open?.()}
							style="display:grid;grid-template-columns:70px 1.6fr 1fr 1fr 100px 110px;gap:10px;padding:9px 14px;border-top:1px solid var(--ln);font-size:14px;cursor:pointer"
						>
							<span style="color:var(--mut)">{r.date}</span><span>{r.loja}</span><span
								style="color:var(--mut)"
							>
								{r.conta}
							</span><span style="color:var(--mut)">{r.fat}</span><span
								style="text-align:right;color:{r.col};font-variant-numeric:tabular-nums;{v.bl}"
							>
								{r.v}
							</span><span style="font-size:12px;color:var(--mut)">{r.st}</span>
						</div>{/each}
				</div>{/if}
		</div>
		<div style="font-size:12px;color:var(--mut)">
			Dica: use ↑ ↓ para percorrer e Enter para abrir o painel. Clique no chip da categoria para
			reclassificar.
		</div>{/if}
	{#if v.ds.loading}<div style="{v.card}display:flex;flex-direction:column;gap:12px">
			{#each v.skel as _k}<div
					style="height:34px;border-radius:8px;background:var(--sf2);animation:pulse 1.2s infinite"
				></div>{/each}
		</div>{/if}
	{#if v.ds.empty}<div style="{v.card}text-align:center;padding:48px">
			<i class="ph ph-notebook" style="font-size:36px;color:var(--mut)"></i>
			<div style="font:600 20px 'Source Serif 4',serif;margin-top:8px">Sem dados nesse período</div>
			<div style="color:var(--mut);font-size:14px">
				Nenhuma compra em novembro com esses filtros. Que tal ampliar o período?
			</div>
		</div>{/if}
	{#if v.ds.error}<div style="{v.card}text-align:center;padding:48px;border-color:var(--terra)">
			<i class="ph ph-cloud-slash" style="font-size:36px;color:var(--terra)"></i>
			<div style="font:600 20px 'Source Serif 4',serif;margin-top:8px">
				Não conseguimos carregar as compras
			</div>
			<div style="color:var(--mut);font-size:14px;margin-bottom:12px">
				Nada se perdeu. Verifique a conexão e tente de novo.
			</div>
			<button onclick={v.retry} style={v.btnP}>Tentar de novo</button>
		</div>{/if}
</div>
