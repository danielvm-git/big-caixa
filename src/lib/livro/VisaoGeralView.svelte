<script lang="ts">
	import { book } from '$lib/livro/book.svelte';

	let v = $derived(book.view());
</script>

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
								<span style="text-align:right;color:{c.mut ? 'var(--mut)' : 'var(--ink)'};{v.bl}">
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
