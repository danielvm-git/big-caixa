<script lang="ts">
	// @ts-nocheck — markup fiel ao protótipo, tipos dinâmicos
	import Casa from '$lib/livro/Casa.svelte';
	import EntradasSpreadsheet from '$lib/livro/EntradasSpreadsheet.svelte';
	import AiSubscriptionsView from '$lib/livro/AiSubscriptionsView.svelte';
	import ViagensFeriasView from '$lib/livro/ViagensFeriasView.svelte';
	import DevemView from '$lib/livro/DevemView.svelte';
	import { book } from '$lib/livro/book.svelte';
	let v = $derived(book.view());

	function focusOnMount(node) {
		node.focus();
	}
</script>

<div style={v.themeStyle}>
	<aside
		style="width:236px;flex:none;background:var(--sf);border-right:1px solid var(--ln);display:flex;flex-direction:column;padding:16px 12px;gap:4px;overflow:auto"
	>
		<div style="display:flex;align-items:center;gap:10px;padding:4px 8px 16px">
			<div style="position:relative;width:30px;height:30px;border-radius:9px;background:var(--sun)">
				<div
					style="position:absolute;left:7px;top:8px;width:16px;height:7px;background:var(--onsun);clip-path:polygon(50% 0,100% 100%,0 100%)"
				></div>
				<div
					style="position:absolute;left:9px;top:15px;width:12px;height:8px;background:var(--onsun)"
				></div>
			</div>
			<div style="font:600 19px 'Source Serif 4',serif">Livro-caixa</div>
		</div>
		{#each v.nav as m}
			<div style="display:flex;flex-direction:column">
				<button
					data-hv
					onclick={m.go}
					style="display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:10px;border:0;background:{m.bg};color:var(--ink);font-size:14px;font-weight:{m.fw};cursor:pointer;text-align:left"
				>
					<i class={m.ic} style="font-size:18px"></i><span style="flex:1">{m.label}</span><span
						style="font-size:11px;color:var(--mut)"
					>
						{m.n}
					</span>
				</button>
				{#if m.open}
					<div style="display:flex;flex-direction:column;padding:2px 0 6px 38px">
						{#each m.subs as s2}<button
								data-hv
								onclick={s2.go}
								style="text-align:left;border:0;background:transparent;padding:5px 8px;border-radius:8px;font-size:13px;cursor:pointer;color:{s2.col};font-weight:{s2.fw}"
							>
								{s2.label}
							</button>{/each}
					</div>
				{/if}
			</div>
		{/each}
		<div style="flex:1"></div>
		<button
			onclick={v.openClose}
			style="display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:10px;border:1px dashed var(--ink);background:transparent;color:var(--ink);font-size:13px;font-weight:600;cursor:pointer"
		>
			<i class="ph ph-flag-banner" style="font-size:18px"></i>Fechar outubro
		</button>
		<button
			onclick={v.goMobile}
			style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:10px;border:0;background:transparent;color:var(--mut);font-size:13px;cursor:pointer"
		>
			<i class="ph ph-device-mobile" style="font-size:18px"></i>Ver no celular
		</button>
	</aside>

	<div style="flex:1;min-width:0;display:flex;flex-direction:column;height:100vh">
		<header
			style="display:flex;align-items:center;gap:10px;padding:10px 24px;border-bottom:1px solid var(--ln);background:var(--bg);flex-wrap:wrap"
		>
			{#if v.hasBack}<button
					onclick={v.back}
					style="border:1px solid var(--ln);background:var(--sf);color:var(--ink);border-radius:8px;padding:5px 10px;font-size:13px;cursor:pointer"
				>
					← {v.backLabel}
				</button>{/if}
			<div style="font-size:13px;color:var(--mut)">{v.crumb}</div>
			<div style="flex:1"></div>
			<button
				onclick={v.cyclePer}
				style="display:flex;gap:6px;align-items:center;padding:5px 11px;border-radius:999px;border:1px solid var(--ln);background:var(--sf);color:var(--ink);font-size:13px;cursor:pointer"
			>
				<i class="ph ph-calendar-blank"></i>{v.perLabel}
			</button>
			<button
				onclick={v.cycleEsc}
				style="display:flex;gap:6px;align-items:center;padding:5px 11px;border-radius:999px;border:1px solid var(--ln);background:var(--sf);color:var(--ink);font-size:13px;cursor:pointer"
			>
				<i class="ph ph-house-line"></i>{v.escLabel}
			</button>
			<button
				onclick={v.toggleBase}
				style="display:flex;gap:6px;align-items:center;padding:5px 11px;border-radius:999px;border:1px solid var(--ln);background:var(--sf);color:var(--ink);font-size:13px;cursor:pointer"
			>
				<i class="ph ph-scales"></i>Base: {v.baseLabel}
			</button>
			<button
				onclick={v.openCmd}
				style="display:flex;gap:8px;align-items:center;padding:5px 11px;border-radius:8px;border:1px solid var(--ln);background:var(--sf);color:var(--mut);font-size:13px;cursor:pointer"
			>
				<i class="ph ph-magnifying-glass"></i>Buscar
				<span style="border:1px solid var(--ln);border-radius:5px;padding:0 5px;font-size:11px">
					⌘K
				</span>
			</button>
			<button
				onclick={v.togglePriv}
				title="Modo privacidade"
				style="width:34px;height:34px;border-radius:8px;border:1px solid var(--ln);background:{v.privBg};color:var(--ink);cursor:pointer"
			>
				<i class={v.privIc} style="font-size:17px"></i>
			</button>
			<button
				onclick={v.toggleDark}
				title="Claro/escuro"
				style="width:34px;height:34px;border-radius:8px;border:1px solid var(--ln);background:var(--sf);color:var(--ink);cursor:pointer"
			>
				<i class={v.darkIc} style="font-size:17px"></i>
			</button>
			<button
				onclick={v.goConta}
				title="Conta"
				style="width:34px;height:34px;border-radius:50%;border:0;background:var(--sun);color:var(--onsun);font-weight:600;cursor:pointer"
			>
				R
			</button>
		</header>
		<div
			style="padding:8px 24px;border-bottom:1px solid var(--ln);display:flex;gap:8px;align-items:center;font-size:12px;color:var(--mut);flex-wrap:wrap"
		>
			Mostrando:
			<span style={v.chipS}>{v.perLabel}</span><span style={v.chipS}>{v.escLabel}</span><span
				style={v.chipS}
			>
				{v.baseLabel}
			</span>
			{#if v.filt}<span style="{v.chipS}background:var(--sun);color:var(--onsun)">
					{v.filtLabel}
					<button
						onclick={v.clearFilt}
						style="border:0;background:transparent;color:inherit;cursor:pointer;padding:0"
					>
						×
					</button>
				</span>{/if}
		</div>

		<main style="flex:1;overflow:auto;padding:24px;position:relative">
			{#if v.gap}
				<div style="max-width:720px;display:flex;flex-direction:column;gap:12px;animation:up .3s">
					<h1 style="font:600 28px 'Source Serif 4',serif;margin:0">{v.gapTitle}</h1>
					<p style="margin:0;color:var(--mut);font-size:15px;max-width:52ch">
						{v.s.projetos
							? 'Obras e reformas não têm tabela no livro (nem no app Swift). Use categorias e compras para acompanhar gastos.'
							: 'Esta parte ainda mostrava a casa de exemplo do protótipo.'}
					</p>
				</div>
			{/if}
			{#if v.s.hoje}
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
								<span
									style="font:600 44px 'Source Serif 4',serif;font-variant-numeric:tabular-nums;{v.bl}"
								>
									{v.spentNow}
								</span><span style="color:var(--mut);font-size:14px">
									<span style={v.bl}>{v.paceNote}</span>
								</span>
							</div>
							{#if v.extraNote}<div style="font-size:13px;color:var(--terra);margin:-6px 0 10px">
									{v.extraNote}
								</div>{/if}
							<div style="position:relative;height:14px;border-radius:7px;background:var(--sf2)">
								<div
									style="height:14px;border-radius:7px;background:var(--terra);width:{v.barW}"
								></div>
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
										{v.real
											? v.pendN + ' pendências no livro'
											: v.pendN + ' compras sem classificação'}
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
										<b>1 fatura para conferir</b><br /><span
											style="color:var(--mut);font-size:12px"
										>
											Itaú Visa: diferença de R$ 1,50
										</span>
									</span>→
								</button>
								<button onclick={v.goImport} style={v.rowBtn}>
									<i class="ph ph-arrows-left-right" style="color:var(--terra);font-size:20px"
									></i><span style="flex:1;text-align:left">
										<b>2 transferências sem par</b><br /><span
											style="color:var(--mut);font-size:12px"
										>
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
								<div
									style="font:600 22px 'Source Serif 4',serif;font-variant-numeric:tabular-nums;{v.bl}"
								>
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
										Férias de dezembro em <b>28 dias</b><br /><span
											style="color:var(--mut);font-size:12px"
										>
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
			{/if}

			{#if v.s.visao}
				<div style="display:flex;flex-direction:column;gap:14px;animation:up .3s">
					<div
						style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px"
					>
						<div>
							<h1 style="font:600 28px 'Source Serif 4',serif;margin:0">{v.visaoTitle}</h1>
							<div style="color:var(--mut);font-size:14px;margin-top:2px">{v.visaoNote}</div>
						</div>
						<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
							<div
								style="display:flex;gap:4px;background:var(--sf2);padding:3px;border-radius:10px;border:1px solid var(--ln)"
							>
								{#each v.visaoPerspectivas as p}
									<button
										type="button"
										onclick={p.go}
										style="border:0;border-radius:7px;padding:6px 14px;font-size:13px;cursor:pointer;background:{p.bg};color:var(--ink);font-weight:{p.fw};box-shadow:{p.fw ===
										600
											? '0 1px 3px rgba(0,0,0,0.08)'
											: 'none'};transition:all .15s"
									>
										{p.l}
									</button>
								{/each}
							</div>
							<div style="display:flex;align-items:center;gap:6px">
								<button
									type="button"
									onclick={v.expandAllDivisoes}
									style="padding:6px 12px;font-size:12px;font-weight:500;border-radius:8px;border:1px solid var(--ln);background:var(--sf);color:var(--ink);cursor:pointer;display:flex;align-items:center;gap:6px;transition:background .15s"
									title="Expandir todas as divisões"
								>
									<span>▼</span> Expandir
								</button>
								<button
									type="button"
									onclick={v.collapseAllDivisoes}
									style="padding:6px 12px;font-size:12px;font-weight:500;border-radius:8px;border:1px solid var(--ln);background:var(--sf);color:var(--ink);cursor:pointer;display:flex;align-items:center;gap:6px;transition:background .15s"
									title="Recolher todas as divisões"
								>
									<span>▶</span> Recolher
								</button>
							</div>
						</div>
					</div>
					{#if v.ledgerError}
						<div style={v.card}>
							Não foi possível ler o livro. Confira a sessão e a ligação ao Postgres.
						</div>
					{:else if !v.visaoRows.length}
						<div style={v.card}>Sem dados de ano no livro.</div>
					{:else}
						<div style="{v.card}padding:0;overflow:auto">
							<div style="min-width:1260px">
								<div
									style="display:grid;grid-template-columns:260px repeat(12,minmax(72px,1fr)) 92px 104px;gap:6px;padding:10px 14px;font-size:11px;color:var(--mut);text-transform:uppercase;position:sticky;top:0;background:var(--sf);z-index:2;border-bottom:1px solid var(--ln)"
								>
									<span>Estrutura / Categoria</span>
									{#each v.mnames as mn}<span style="text-align:right">{mn}</span>{/each}
									<span style="text-align:right">Média</span>
									<span style="text-align:right">Total</span>
								</div>
								{#each v.visaoRows as r}
									{#if !r.isHidden}
										<div
											role="button"
											tabindex={r.go ? 0 : -1}
											onclick={r.go}
											onkeydown={(e) => {
												if (e.key === 'Enter' || e.key === ' ') r.go?.();
											}}
											style="display:grid;grid-template-columns:260px repeat(12,minmax(72px,1fr)) 92px 104px;gap:6px;padding:7px 14px;border-top:1px solid var(--ln);font-size:{r.fs};font-weight:{r.fw};background:{r.bg};font-variant-numeric:tabular-nums;cursor:{r.go
												? 'pointer'
												: 'default'};align-items:center;transition:background .15s"
										>
											<div
												style="display:flex;align-items:center;gap:6px;padding-left:{r.pl};overflow:hidden;text-overflow:ellipsis;white-space:nowrap"
											>
												{#if r.isDivision}
													<span
														style="font-size:10px;color:var(--mut);display:inline-block;transition:transform .2s;transform:{r.isCollapsed
															? 'rotate(0deg)'
															: 'rotate(90deg)'}"
													>
														▶
													</span>
													<span
														style="font-size:10px;font-family:monospace;padding:1px 5px;border-radius:4px;background:rgba(59,130,246,0.15);color:#3b82f6;font-weight:700"
													>
														{r.divisaoId}
													</span>
													<span
														style="font-weight:600;color:var(--ink);overflow:hidden;text-overflow:ellipsis"
													>
														{r.l.split(' · ')[1] || r.l}
													</span>
													{#if r.childCount}
														<span
															style="font-size:10px;color:var(--mut);background:var(--sf2);padding:1px 6px;border-radius:10px"
														>
															({r.childCount})
														</span>
													{/if}
												{:else if r.isCategory}
													<span style="font-size:10px;color:var(--mut);opacity:0.6">↳</span>
													<span style="overflow:hidden;text-overflow:ellipsis;color:var(--ink)">
														{r.l}
													</span>
												{:else}
													<span style="font-weight:600;color:var(--ink)">{r.l}</span>
												{/if}
											</div>
											{#each r.v as c}
												<span
													style="text-align:right;color:{c.mut
														? 'var(--mut)'
														: 'var(--ink)'};{v.bl}"
												>
													{c.t}
												</span>
											{/each}
											<span style="text-align:right;color:var(--mut);{v.bl}">{r.m}</span>
											<span
												style="text-align:right;font-weight:{r.isDivision || r.isSummary
													? '600'
													: '400'};{v.bl}"
											>
												{r.t}
											</span>
										</div>
									{/if}
								{/each}
							</div>
						</div>
					{/if}
				</div>
			{/if}

			{#if v.s.fluxo}
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
						<h1 style="font:600 28px 'Source Serif 4',serif;margin:0;flex:1">
							Para onde foi o dinheiro
						</h1>
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
						{#if v.notSimple}<svg
								viewBox="0 0 1000 540"
								style="width:100%;min-width:760px;height:auto"
							>
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
													title={g.n}
													aria-label={g.n}
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
			{/if}

			{#if v.s.mes}
				<div style="max-width:1180px;display:flex;flex-direction:column;gap:14px;animation:up .3s">
					<div style="display:flex;gap:4px;flex-wrap:wrap">
						{#each v.months as mo}<button
								onclick={mo.go}
								style="border:1px solid var(--ln);border-radius:8px;padding:5px 11px;font-size:13px;cursor:pointer;background:{mo.bg};color:{mo.col}"
							>
								{mo.l}
							</button>{/each}
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
							{#each v.catRows as c}<div
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
								</div>{/each}
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
								{#each v.cd.bars as b}<div
										style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;justify-content:flex-end;height:100%"
									>
										<div
											style="width:100%;height:{b.h};background:{b.c};border-radius:3px 3px 0 0"
										></div>
										<span style="font-size:9px;color:var(--mut)">{b.l}</span>
									</div>{/each}
							</div>
							<div style="font-size:13px">
								<b>Maiores lojas</b>
								{#each v.cd.stores as s3}<div
										style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--ln)"
									>
										<span>{s3.n}</span><span style="font-variant-numeric:tabular-nums;{v.bl}">
											{s3.v}
										</span>
									</div>{/each}
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
							<button onclick={v.cd.go} style={v.btnP}>Ver as compras de {v.cd.n} →</button>
						</div>
					</div>
				</div>
			{/if}

			{#if v.s.compras}
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
								<option value="">Classificar como…</option>{#each v.catNames as cn}<option
										value={cn}
									>
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
										<span></span><span>Data</span><span>Loja e título</span><span>
											Categoria
										</span><span>Parc.</span><span style="text-align:right">Total</span><span
											style="text-align:right"
										>
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
										<span>Data</span><span>Descrição</span><span>Conta</span><span>
											Fatura
										</span><span style="text-align:right">Valor</span><span>Situação</span>
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
							Dica: use ↑ ↓ para percorrer e Enter para abrir o painel. Clique no chip da categoria
							para reclassificar.
						</div>{/if}
					{#if v.ds.loading}<div style="{v.card}display:flex;flex-direction:column;gap:12px">
							{#each v.skel as _k}<div
									style="height:34px;border-radius:8px;background:var(--sf2);animation:pulse 1.2s infinite"
								></div>{/each}
						</div>{/if}
					{#if v.ds.empty}<div style="{v.card}text-align:center;padding:48px">
							<i class="ph ph-notebook" style="font-size:36px;color:var(--mut)"></i>
							<div style="font:600 20px 'Source Serif 4',serif;margin-top:8px">
								Sem dados nesse período
							</div>
							<div style="color:var(--mut);font-size:14px">
								Nenhuma compra em novembro com esses filtros. Que tal ampliar o período?
							</div>
						</div>{/if}
					{#if v.ds.error}<div
							style="{v.card}text-align:center;padding:48px;border-color:var(--terra)"
						>
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
			{/if}

			{#if v.s.entradas}
				<EntradasSpreadsheet />
			{/if}

			{#if v.s.ia}
				<AiSubscriptionsView />
			{/if}

			{#if v.s.viagens}
				<ViagensFeriasView />
			{/if}

			{#if v.s.projetos && v.sample}
				<div style="max-width:1100px;display:flex;flex-direction:column;gap:16px;animation:up .3s">
					<div>
						<h1 style="font:600 28px 'Source Serif 4',serif;margin:0">Projetos da casa</h1>
						<div style="color:var(--mut);font-size:14px">
							Compras de um período, reunidas sob um nome. Mesma ideia das viagens.
						</div>
					</div>
					<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px">
						{#each v.projs as p}<button
								onclick={p.go}
								style="{v.card}text-align:left;cursor:pointer;color:var(--ink);border-color:{p.bd}"
							>
								<i class={p.ic} style="font-size:24px"></i>
								<div style="font:600 18px 'Source Serif 4',serif">{p.nome}</div>
								<div style="font-size:12px;color:var(--mut)">{p.per}</div>
								<div style="font:600 22px 'Source Serif 4',serif;margin-top:6px;{v.bl}">
									{p.total}
								</div>
								<div style="height:6px;background:var(--sf2);border-radius:3px;margin-top:6px">
									<div
										style="height:6px;border-radius:3px;background:var(--terra);width:{p.w}"
									></div>
								</div>
								<div style="font-size:12px;color:var(--mut);margin-top:4px">{p.sub}</div>
							</button>{/each}
					</div>
					<div style={v.card}>
						<h2 style="font:600 20px 'Source Serif 4',serif;margin:0 0 8px">{v.pj.nome}</h2>
						{#each v.pj.items as c}<div
								style="display:grid;grid-template-columns:70px 1fr 100px;gap:10px;padding:8px 0;border-top:1px solid var(--ln);font-size:14px"
							>
								<span style="color:var(--mut)">{c.d}</span><span>{c.n}</span><span
									style="text-align:right;font-variant-numeric:tabular-nums;{v.bl}"
								>
									{c.v}
								</span>
							</div>{/each}
					</div>
				</div>
			{/if}

			{#if v.s.mapa}
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
			{/if}

			{#if v.s.pessoas}
				<div style="max-width:1100px;display:flex;flex-direction:column;gap:16px;animation:up .3s">
					<h1 style="font:600 28px 'Source Serif 4',serif;margin:0">Pessoas</h1>
					<button type="button" onclick={v.openModalAm} style={v.btn}>Adicionar pessoa</button>
					{#each v.pessoasPorCirculo as g}
						<div style={v.card}>
							<div style="font:600 17px 'Source Serif 4',serif;margin-bottom:8px">{g.circulo}</div>
							{#each g.pessoas as p}<button
									type="button"
									onclick={p.go}
									style="{v.rowBtn}border-bottom:1px solid var(--ln)"
								>
									<span style="flex:1;text-align:left;font-weight:600">{p.n}</span>
									<span style="color:var(--mut)">{p.r}</span>
								</button>{/each}
						</div>
					{/each}
				</div>
			{/if}

			{#if v.s.pessoa && v.pessoaDet}
				<div style="max-width:900px;display:flex;flex-direction:column;gap:14px;animation:up .3s">
					<h1 style="font:600 28px 'Source Serif 4',serif;margin:0">
						{v.pessoaDet.apelido || v.pessoaDet.nome}
					</h1>
					<div style={v.card}>
						<div style="font-size:14px;color:var(--mut)">{v.pessoaDet.relacao}</div>
						{#if v.pessoaDet.aliases?.length}
							<div style="margin-top:8px;font-size:13px">
								Aliases: {v.pessoaDet.aliases.join(', ')}
							</div>
						{/if}
					</div>
				</div>
			{/if}

			{#if v.s.devem}
				<DevemView />
			{/if}

			{#if v.s.empregados}
				<div style="max-width:1100px;display:flex;flex-direction:column;gap:16px;animation:up .3s">
					<h1 style="font:600 28px 'Source Serif 4',serif;margin:0">Empregados</h1>
					{#if v.emps.length}{#each v.emps as e}<div style={v.card}>
								<div style="font:600 18px 'Source Serif 4',serif">{e.n}</div>
								<div style="font-size:13px;color:var(--mut)">{e.rel} · {e.reg}</div>
								<div style="font-size:13px;margin-top:8px">
									Salário: <b style={v.bl}>{e.sal}</b>
								</div>
							</div>{/each}{:else}<div style={v.card}>{v.casaCadastroFalta}</div>{/if}
				</div>
			{/if}

			{#if v.s.custo}
				<div style="max-width:1100px;display:flex;flex-direction:column;gap:16px;animation:up .3s">
					<div style="display:flex;justify-content:space-between;align-items:baseline">
						<h1 style="font:600 28px 'Source Serif 4',serif;margin:0">
							Custo e pagamentos da casa
						</h1>
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
									<span
										style="text-align:right;font-weight:600;font-variant-numeric:tabular-nums;{v.bl}"
									>
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

			{#if v.s.ano}
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
							{#each v.ybars as b}<div
									style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;gap:3px"
								>
									<span style="font-size:10px;color:var(--mut);{v.bl}">{b.v}</span>
									<div
										style="width:100%;height:{b.h};border-radius:4px 4px 0 0;background:{b.bg};border:{b.bd}"
									></div>
									<span style="font-size:11px">{b.l}</span>
								</div>{/each}
						</div>
					</div>
					<div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px">
						<div style="{v.card}display:flex;flex-direction:column;gap:10px">
							<b style="font:600 17px 'Source Serif 4',serif">O que os números dizem</b>
							{#each v.insights as i}<div style="display:flex;gap:8px;font-size:14px">
									<i class="ph ph-lightbulb" style="color:var(--sun);font-size:18px"></i><span>
										{i}
									</span>
								</div>{/each}
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
			{/if}

			{#if v.s.metas}
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
								{#each v.blocks as b}<div style="display:flex;gap:8px;align-items:center">
										<span style={b.bx}>{b.b}</span><span>
											{b.n}: <b>{b.real}</b> <span style="color:var(--mut)">(meta {b.meta})</span>
										</span>
									</div>{/each}
							</div>
						</div>
						{#if v.showMetasGoals}<div style="{v.card}display:flex;flex-direction:column;gap:12px">
								<b style="font:600 17px 'Source Serif 4',serif">Metas</b>
								{#each v.goals as g}<div>
										<div style="display:flex;justify-content:space-between;font-size:13px">
											<span>{g.n}</span><span style={v.bl}>{g.t}</span>
										</div>
										<div style="height:10px;background:var(--sf2);border-radius:5px;margin-top:4px">
											<div
												style="height:10px;border-radius:5px;background:var(--moss);width:{g.w}"
											></div>
										</div>
									</div>{/each}
							</div>{/if}
					</div>
					{#if v.sample}<div style={v.card}>
							<b>Mês ideal como referência</b>
							<div style="font-size:14px;color:var(--mut);margin-top:4px">
								Para uma renda de R$ 19.080: R$ 9.540 em necessidades, R$ 5.724 em desejos e R$
								3.816 no futuro. Compare no <button
									type="button"
									onclick={v.goFluxo}
									style="border:0;background:transparent;padding:0;color:inherit;text-decoration:underline;cursor:pointer;font:inherit"
								>
									Fluxo de caixa
								</button>, aba “Mês ideal”.
							</div>
						</div>{/if}
				</div>
			{/if}

			{#if v.s.importar}
				<div style="max-width:900px;display:flex;flex-direction:column;gap:16px;animation:up .3s">
					<h1 style="font:600 28px 'Source Serif 4',serif;margin:0">Importar extratos</h1>
					{#if v.real}<p style="margin:0;color:var(--mut);font-size:14px">
							O envio de arquivos roda no Mac (<code>python3 -m livrocaixa import</code>). Aqui vê o
							histórico gravado no livro.
						</p>{/if}
					{#if v.sample}<div
							style="border:2px dashed var(--ln);border-radius:16px;padding:40px;text-align:center;background:var(--sf)"
						>
							<i class="ph ph-upload-simple" style="font-size:32px"></i>
							<div style="margin-top:6px"><b>Solte aqui</b> os arquivos CSV ou PDF de fatura</div>
						</div>{/if}
					<div style={v.card}>
						<b>{v.real ? 'Histórico de importação' : 'Último envio'}</b>{#each v.files as f}<div
								style="display:grid;grid-template-columns:1fr 120px 100px;gap:10px;padding:10px 0;border-top:1px solid var(--ln);margin-top:8px;font-size:14px"
							>
								<span>{f.n}</span><span style="color:var(--mut)">{f.d}</span><span
									style="color:{f.c};font-weight:600"
								>
									{f.s}
								</span>
							</div>{/each}
						{#if v.sample}<div
								style="background:var(--mossBg);padding:10px 12px;border-radius:10px;font-size:13px;margin-top:6px"
							>
								Conferência de saldo: Itaú Conta fecha em <b style={v.bl}>R$ 8.214,60</b>, igual ao
								extrato.
							</div>{/if}
					</div>
				</div>
			{/if}

			{#if v.s.pendencias}
				<div style="max-width:960px;display:flex;flex-direction:column;gap:14px;animation:up .3s">
					<h1 style="font:600 28px 'Source Serif 4',serif;margin:0">
						{v.real ? v.pendN + ' pendências no ano' : 'Falta classificar ' + v.pendN + ' compras'}
					</h1>
					{#if v.pendEmpty}<div style="{v.card}text-align:center;padding:48px">
							<i class="ph ph-confetti" style="font-size:32px"></i>
							<div style="font:600 20px 'Source Serif 4',serif">Tudo classificado</div>
						</div>{/if}
					{#if v.real}{#each v.pendSummary as p}<div
								style="{v.card}padding:14px 16px;font-size:14px"
							>
								<b>{p.title}</b> · {p.n}{#if p.detail}
									<span style="color:var(--mut)"> — {p.detail}</span>{/if}
							</div>{/each}{:else}{#each v.pend as p}<div
								style="{v.card}display:flex;gap:14px;align-items:center;padding:12px 16px"
							>
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
								<button onclick={p.ok} style={v.btnP}>Aprovar</button>
							</div>{/each}{/if}
				</div>
			{/if}

			{#if v.s.regras}
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
					{#each v.rules as r}<div
							style="{v.card}display:flex;gap:12px;align-items:center;padding:10px 16px"
						>
							<span style="color:var(--mut);width:20px">{r.i}</span><span
								style="flex:1;font-size:14px"
							>
								{r.t} → <b>{r.c}</b>
							</span><span style="font-size:12px;color:{r.col}">{r.u}</span><button
								onclick={r.up}
								style={v.btn}
							>
								↑
							</button><button onclick={r.dn} style={v.btn}>↓</button>
						</div>{/each}
				</div>
			{/if}

			{#if v.s.referencia}
				<div style="max-width:960px;display:flex;flex-direction:column;gap:10px;animation:up .3s">
					<h1 style="font:600 28px 'Source Serif 4',serif;margin:0">
						Referência ONU · COICOP 2018
					</h1>
					<div style="color:var(--mut);font-size:14px">
						As 13 divisões, quanto gastamos em cada e quais categorias da casa apontam para elas.
					</div>
					{#each v.coicop as g}<div style="{v.card}padding:10px 16px">
							<button
								onclick={g.tog}
								style="display:flex;width:100%;gap:12px;border:0;background:transparent;color:var(--ink);font-size:14px;cursor:pointer;text-align:left"
							>
								<span style="color:var(--mut);width:24px">{g.k}</span><span style="flex:1">
									{g.n}
								</span><span style="font-variant-numeric:tabular-nums;{v.bl}">{g.v}</span><i
									class={g.ic}
								></i>
							</button>
							{#if g.open}<div style="padding:8px 36px;font-size:13px;color:var(--mut)">
									Categorias da casa: <b style="color:var(--ink)">{g.cats}</b>
								</div>{/if}
						</div>{/each}
				</div>
			{/if}

			{#if v.s.conta}
				<div style="max-width:720px;display:flex;flex-direction:column;gap:14px;animation:up .3s">
					<h1 style="font:600 28px 'Source Serif 4',serif;margin:0">Conta e ajustes</h1>
					<div style="{v.card}display:flex;flex-direction:column;gap:6px;font-size:14px">
						<b>Perfil</b>{v.who}{#if v.mail}
							· {v.mail}{/if}<b style="margin-top:8px"> Pessoas da casa </b>{v.people}<b
							style="margin-top:8px"
						>
							Contas e cartões
						</b>{v.accounts}
					</div>
					<div style="{v.card}display:flex;gap:10px;flex-wrap:wrap">
						<button onclick={v.toggleDark} style={v.btn}>Tema: {v.themeName}</button><button
							onclick={v.togglePriv}
							style={v.btn}
						>
							Privacidade: {v.privName}
						</button><button onclick={v.expire} style={v.btn}>
							Simular sessão expirada
						</button><button onclick={v.logout} style={v.btn}>
							<i class="ph ph-sign-out"></i> Sair
						</button>
					</div>
				</div>
			{/if}

			{#if v.s.mobile}
				<div style="display:flex;gap:28px;flex-wrap:wrap;justify-content:center;animation:up .3s">
					{#each v.phones as ph}<div>
							<div style="text-align:center;font-size:13px;color:var(--mut);margin-bottom:8px">
								{ph.t}
							</div>
							<div
								style="width:320px;height:620px;border:8px solid var(--ink);border-radius:36px;background:var(--bg);padding:18px 14px;overflow:hidden;display:flex;flex-direction:column;gap:10px"
							>
								<div style="font:600 20px/1.25 'Source Serif 4',serif">{ph.h}</div>
								{#each ph.rows as r}<div
										style="{v.card}padding:10px 12px;display:flex;justify-content:space-between;font-size:13px;gap:8px"
									>
										<span>{r.a}</span><b style="font-variant-numeric:tabular-nums;{v.bl}">{r.b}</b>
									</div>{/each}
								<div style="flex:1"></div>
								<div
									style="display:flex;justify-content:space-around;border-top:1px solid var(--ln);padding-top:8px;font-size:11px;color:var(--mut)"
								>
									<span>Hoje</span><span>Entender</span><span>Viver</span><span>
										Planejar
									</span><span>Cuidar</span>
								</div>
							</div>
						</div>{/each}
				</div>
			{/if}
		</main>
	</div>

	{#if v.panel}
		<aside
			style="position:fixed;right:0;top:0;bottom:0;width:380px;background:var(--sf);border-left:1px solid var(--ln);box-shadow:-12px 0 30px rgba(0,0,0,.12);padding:20px;display:flex;flex-direction:column;gap:12px;animation:slide .2s;z-index:20;overflow:auto"
		>
			<div style="display:flex;align-items:center">
				<div style="flex:1;font-size:12px;color:var(--mut)">Compra</div>
				<button
					onclick={v.closePanel}
					style="border:0;background:transparent;color:var(--ink);font-size:20px;cursor:pointer"
				>
					×
				</button>
			</div>
			<div>
				<div style="font:600 24px 'Source Serif 4',serif">{v.pn.loja}</div>
				<div style="color:var(--mut);font-size:14px">{v.pn.titulo}</div>
			</div>
			<div style="font:600 34px 'Source Serif 4',serif;font-variant-numeric:tabular-nums;{v.bl}">
				{v.pn.total}
			</div>
			<div style="display:grid;grid-template-columns:100px 1fr;gap:8px;font-size:14px">
				<span style="color:var(--mut)">Data</span><span>{v.pn.date}</span><span
					style="color:var(--mut)"
				>
					Conta
				</span><span>{v.pn.conta}</span><span style="color:var(--mut)">Categoria</span><span>
					<button onclick={v.pn.chip} style={v.pn.chipS}>
						<span style={v.pn.bx}>{v.pn.b}</span>{v.pn.cat}{#if v.pn.lock}<i
								class="ph ph-lock-simple"
							></i>{/if}
					</button>
				</span><span style="color:var(--mut)">Escopo</span><span>Casa</span><span
					style="color:var(--mut)"
				>
					Parcelas
				</span><span>{v.pn.parc} · pago {v.pn.pago}</span><span style="color:var(--mut)">
					Origem
				</span><span>{v.pn.orig}</span><span style="color:var(--mut)">Para quem</span><span>
					{v.pn.paraQuem}
				</span>
			</div>
			<div style="background:var(--sf2);border-radius:10px;padding:10px 12px;font-size:13px">
				<i class="ph ph-envelope-simple"></i> <b>Nota do e-mail</b><br /><span
					style="color:var(--mut)"
				>
					“Pedido confirmado. Obrigado por comprar com a gente!” · nota fiscal anexa (PDF)
				</span>
			</div>
			<div style="display:flex;flex-direction:column;gap:8px">
				<button onclick={v.mkRule} style={v.btn}>
					Criar regra a partir desta compra
				</button>{#if v.pn.trip}<button onclick={v.goTrip} style={v.btn}>
						✈ Ver a viagem
					</button>{/if}<button onclick={v.markExtra} style={v.btn}>
					Marcar como extraordinária
				</button>
				{#if v.pn.openLm}<button onclick={v.pn.openLm} style={v.btnP}>
						Isto é empréstimo / ajuda / racha
					</button>{/if}
			</div>
		</aside>
	{/if}

	{#if v.picker}<div
			role="presentation"
			onclick={v.closePicker}
			style="position:fixed;inset:0;background:rgba(10,12,24,.45);display:flex;align-items:center;justify-content:center;z-index:40"
		>
			<div
				role="dialog"
				aria-modal="true"
				tabindex="-1"
				onclick={v.stop}
				onkeydown={(e) => e.key === 'Escape' && v.closePicker?.()}
				style="background:var(--sf);border-radius:16px;padding:16px;width:340px;max-height:80vh;overflow:auto;display:flex;flex-direction:column;gap:4px"
			>
				<b style="font:600 18px 'Source Serif 4',serif;margin-bottom:6px">Classificar como…</b>
				{#each v.pickList as c}<button
						data-hv
						onclick={c.pick}
						style="display:flex;gap:10px;align-items:center;border:0;background:transparent;color:var(--ink);padding:8px;border-radius:8px;cursor:pointer;font-size:14px"
					>
						<span style={c.bx}>{c.b}</span>{c.n}
					</button>{/each}
			</div>
		</div>{/if}

	{#if v.cmd}<div
			role="presentation"
			onclick={v.closeCmd}
			style="position:fixed;inset:0;background:rgba(10,12,24,.45);display:flex;justify-content:center;padding-top:12vh;z-index:50"
		>
			<div
				role="dialog"
				aria-modal="true"
				tabindex="-1"
				onclick={v.stop}
				onkeydown={(e) => e.key === 'Escape' && v.closeCmd?.()}
				style="background:var(--sf);border-radius:16px;width:560px;max-width:92vw;height:fit-content;overflow:hidden"
			>
				<input
					use:focusOnMount
					value={v.q}
					oninput={v.setQ}
					placeholder="Buscar lojas, compras, viagens, categorias, telas…"
					style="width:100%;border:0;border-bottom:1px solid var(--ln);padding:16px;background:transparent;color:var(--ink);font-size:16px;outline:0"
				/>
				<div style="max-height:50vh;overflow:auto">
					{#each v.cmdList as c}<button
							data-hv
							onclick={c.go}
							style="display:flex;width:100%;gap:12px;border:0;background:transparent;color:var(--ink);padding:10px 16px;cursor:pointer;font-size:14px;text-align:left"
						>
							<span style="width:70px;font-size:11px;color:var(--mut);text-transform:uppercase">
								{c.k}
							</span>{c.n}
						</button>{/each}
				</div>
			</div>
		</div>{/if}

	{#if v.closeOpen}
		<div
			style="position:fixed;inset:0;background:var(--bg);z-index:60;display:flex;flex-direction:column;animation:up .25s"
		>
			<div style="height:6px;background:var(--sf2)">
				<div style="height:6px;background:var(--sun);width:{v.closeW};transition:width .3s"></div>
			</div>
			<div style="display:flex;padding:16px 28px;align-items:center">
				<div style="flex:1;font-size:13px;color:var(--mut)">{v.closeStepLabel}</div>
				<button onclick={v.closeX} style={v.btn}>Sair do fechamento</button>
			</div>
			<div
				style="flex:1;display:flex;align-items:center;justify-content:center;padding:24px;overflow:auto"
			>
				<div style="max-width:620px;width:100%;display:flex;flex-direction:column;gap:16px">
					{#if v.cs.summary}<h1 style="font:600 32px 'Source Serif 4',serif;margin:0">
							Resumo do ano · fechamento
						</h1>
						<p style="margin:0;color:var(--mut);font-size:14px">
							Sem gravar fechamento: o livro só lê. Projeção segue a regra do app Swift (mediana +
							sazonal).
						</p>
						<div style="{v.card}font-size:14px;display:flex;flex-direction:column;gap:8px">
							<span>Realizado + projeção: <b style={v.bl}>{v.closeAnoTotal || v.yearEnd}</b></span>
							{#each v.insights as i}<span>{i}</span>{/each}
						</div>
						<button onclick={v.closeX} style={v.btnP}>Fechar</button>{/if}
					{#if v.sample && v.cs.s0}<h1 style="font:600 32px 'Source Serif 4',serif;margin:0">
							Falta importar alguma coisa?
						</h1>
						<div style="{v.card}font-size:14px;display:flex;flex-direction:column;gap:8px">
							<span>✓ Itaú Conta, até 22/11</span><span>✓ Nubank, fatura de outubro</span><span
								style="color:var(--terra)"
							>
								! Caixa poupança: faltam 12 dias
							</span><button onclick={v.fakeImport} style={v.btn}>{v.importLabel}</button>
						</div>{/if}
					{#if v.sample && v.cs.s1}<h1 style="font:600 32px 'Source Serif 4',serif;margin:0">
							Faltam {v.pendN} compras para classificar
						</h1>
						<div style="color:var(--mut)">
							As sugestões acima de 90% podem ser aprovadas de uma vez.
						</div>
						<button onclick={v.approveHigh} style={v.btnP}>
							Aprovar sugestões de alta confiança
						</button>{/if}
					{#if v.sample && v.cs.s2}<h1 style="font:600 32px 'Source Serif 4',serif;margin:0">
							As faturas conferem centavo a centavo?
						</h1>
						<div style="{v.card}display:flex;justify-content:space-between">
							<span>Nubank</span><b style="color:var(--moss);{v.bl}">R$ 4.812,37 ✓ confere</b>
						</div>
						<div
							style="{v.card}display:flex;justify-content:space-between;border-color:var(--terra)"
						>
							<span>Itaú Visa</span><b style={v.bl}>diferença de R$ 1,50</b>
						</div>
						<button onclick={v.fixFee} style={v.btn}>{v.feeLabel}</button>{/if}
					{#if v.sample && v.cs.s3}<h1 style="font:600 32px 'Source Serif 4',serif;margin:0">
							Alguma compra é de viagem ou projeto?
						</h1>
						<div style="{v.card}display:flex;flex-direction:column;gap:8px;font-size:14px">
							<label>
								<input type="checkbox" checked style="accent-color:var(--ink)" /> Leroy Merlin, torneira
								e tinta → Reforma da cozinha
							</label><label>
								<input type="checkbox" style="accent-color:var(--ink)" /> Cinemark → Aniversário da Olivia
							</label>
						</div>{/if}
					{#if v.cs.s5}<h1 style="font:600 32px 'Source Serif 4',serif;margin:0">
							Rever empréstimos e trocas do mês
						</h1>
						<p style="color:var(--mut);font-size:14px">
							Confira vínculos abertos em <button type="button" onclick={v.goDevem} style={v.btn}>
								Quem deve a quem
							</button>.
						</p>{/if}
					{#if v.sample && v.cs.s4}<h1 style="font:600 32px 'Source Serif 4',serif;margin:0">
							Como foi outubro?
						</h1>
						<div style="{v.card}font-size:14px">
							Gastamos <b style={v.bl}>R$ 18.400</b>, 1% abaixo do ritmo normal. Maior categoria:
							Moradia.
						</div>
						<textarea
							placeholder="Uma nota para lembrar deste mês…"
							rows="3"
							style="border-radius:12px;border:1px solid var(--ln);background:var(--sf);color:var(--ink);padding:12px;font-size:14px"
						></textarea>{/if}
					{#if v.sample && v.cs.done}<i
							class="ph ph-house-line"
							style="font-size:48px;color:var(--moss)"
						></i>
						<h1 style="font:600 40px 'Source Serif 4',serif;margin:0">Outubro fechado</h1>
						<div style="{v.card}font-size:14px;display:flex;flex-direction:column;gap:6px">
							<b>O que mudou</b><span>Moradia subiu 4% com a reforma.</span><span>
								Restaurantes caiu 18%.
							</span><span>Reserva cresceu R$ 1.500.</span>
						</div>
						<button onclick={v.share} style={v.btnP}>
							<i class="ph ph-paper-plane-tilt"></i> Compartilhar resumo com a Mariana
						</button>{/if}
					{#if v.sample && v.cs.nav}<div
							style="display:flex;gap:10px;justify-content:space-between;margin-top:8px"
						>
							<button onclick={v.closePrev} style={v.btn}>Voltar</button><button
								onclick={v.closeNext}
								style={v.btnP}
							>
								{v.nextLabel}
							</button>
						</div>{/if}
				</div>
			</div>
		</div>{/if}

	{#if v.modalAm}<div
			style="position:fixed;inset:0;background:rgba(10,12,24,.45);display:flex;align-items:center;justify-content:center;z-index:50"
		>
			<div style="{v.card}width:min(400px,92vw);display:flex;flex-direction:column;gap:12px">
				<b>Adicionar pessoa</b>
				<input
					placeholder="Nome"
					value={v.novaPessoaNome}
					oninput={v.setNovaPessoaNome}
					style="border-radius:8px;border:1px solid var(--ln);padding:8px"
				/>
				<div style="display:flex;gap:8px">
					<button type="button" onclick={v.closeModalAm} style={v.btn}>Cancelar</button>
					<button type="button" onclick={v.saveNovaPessoa} style={v.btnP}>Colocar no mapa</button>
				</div>
			</div>
		</div>{/if}

	{#if v.expired}<div
			style="position:fixed;inset:0;background:rgba(10,12,24,.6);display:flex;align-items:center;justify-content:center;z-index:70"
		>
			<div
				style="background:var(--sf);padding:24px;border-radius:16px;width:360px;display:flex;flex-direction:column;gap:10px"
			>
				<b style="font:600 20px 'Source Serif 4',serif">Sua sessão terminou</b><span
					style="font-size:14px;color:var(--mut)"
				>
					Por segurança, entre de novo. Nada do que você fez se perdeu.
				</span><button onclick={v.relogin} style={v.btnP}>Entrar de novo</button>
			</div>
		</div>{/if}

	{#if v.toast}<div
			style="position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--ink);color:var(--bg);padding:10px 16px;border-radius:12px;display:flex;gap:14px;align-items:center;font-size:14px;z-index:80;animation:up .2s"
		>
			{v.toastMsg}{#if v.toastUndo}<button
					onclick={v.undo}
					style="border:0;background:transparent;color:var(--sun);font-weight:600;cursor:pointer"
				>
					Desfazer
				</button>{/if}
		</div>{/if}
</div>
