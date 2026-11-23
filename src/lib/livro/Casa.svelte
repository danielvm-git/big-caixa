<script lang="ts">
	// Ilustração da casa (v2) — pinos opcionais vindos do livro.
	type Pin = { x: number; y: number; label: string; go?: () => void };
	let {
		pins = [] as Pin[],
		empty = false,
		onstartWizard
	}: {
		pins?: Pin[];
		empty?: boolean;
		onstartWizard?: () => void;
	} = $props();
</script>

<div style="position:relative;width:100%;aspect-ratio:900/560;user-select:none">
	<svg viewBox="0 0 900 560" style="position:absolute;inset:0;width:100%;height:100%">
		<ellipse cx="450" cy="470" rx="440" ry="80" fill="var(--leaf,#8fb67a)" opacity=".3" />
		<ellipse cx="450" cy="448" rx="310" ry="52" fill="var(--leaf,#8fb67a)" opacity=".55" />
		<rect x="310" y="140" width="280" height="282" rx="6" fill="var(--wall,#fbf3e1)" stroke="var(--ln)" stroke-width="2" />
		<polygon points="288,152 450,34 612,152" fill="var(--plum,#6a3d6b)" />
		<rect x="320" y="152" width="125" height="124" rx="4" fill="var(--roomA,#cfe3ee)" stroke="var(--ln)" />
		<rect x="455" y="152" width="125" height="124" rx="4" fill="var(--roomB,#dfecd5)" stroke="var(--ln)" />
		<rect x="320" y="290" width="125" height="100" rx="4" fill="var(--roomC,#f8e3d9)" stroke="var(--ln)" />
		<rect x="455" y="290" width="125" height="100" rx="4" fill="var(--roomD,#f0e7d1)" stroke="var(--ln)" />
	</svg>
	{#each pins as p}
		<button
			type="button"
			onclick={p.go}
			style="position:absolute;left:{(p.x / 900) * 100}%;top:{(p.y / 560) * 100}%;transform:translate(-50%,-50%);border:0;background:var(--sun);color:var(--onsun);border-radius:999px;padding:4px 10px;font-size:11px;font-weight:600;cursor:pointer"
		>
			{p.label}
		</button>
	{/each}
	{#if empty && onstartWizard}
		<div
			style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.04)"
		>
			<button
				type="button"
				onclick={onstartWizard}
				style="background:var(--sf);border:1px solid var(--ln);border-radius:12px;padding:16px 20px;font-size:14px;cursor:pointer"
			>
				Montar a casa em 3 passos
			</button>
		</div>
	{/if}
</div>