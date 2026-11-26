<script lang="ts">
	interface Props {
		perLabel: string;
		escLabel: string;
		baseLabel: string;
		onCyclePer?: () => void;
		onCycleEsc?: () => void;
		onToggleBase?: () => void;
	}

	let { perLabel, escLabel, baseLabel, onCyclePer, onCycleEsc, onToggleBase }: Props = $props();
</script>

<div class="ledger-context-bar" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
	<button
		type="button"
		onclick={onCyclePer}
		aria-label="Alternar período"
		style="display:flex;gap:6px;align-items:center;padding:5px 11px;border-radius:999px;border:1px solid var(--ln);background:var(--sf);color:var(--ink);font-size:13px;cursor:pointer"
	>
		<i class="ph ph-calendar-blank"></i>{perLabel}
	</button>
	<button
		type="button"
		onclick={onCycleEsc}
		aria-label="Alternar escopo"
		style="display:flex;gap:6px;align-items:center;padding:5px 11px;border-radius:999px;border:1px solid var(--ln);background:var(--sf);color:var(--ink);font-size:13px;cursor:pointer"
	>
		<i class="ph ph-house-line"></i>{escLabel}
	</button>
	<button
		type="button"
		onclick={onToggleBase}
		aria-label="Alternar base contábil"
		style="display:flex;gap:6px;align-items:center;padding:5px 11px;border-radius:999px;border:1px solid var(--ln);background:var(--sf);color:var(--ink);font-size:13px;cursor:pointer"
	>
		<i class="ph ph-scales"></i>Base: {baseLabel}
	</button>
</div>
