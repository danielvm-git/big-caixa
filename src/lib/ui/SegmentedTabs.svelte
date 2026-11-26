<script module lang="ts">
	export interface SegmentedOption<V extends string | number> {
		value: V;
		label: string;
		count?: number;
		icon?: string;
	}
</script>

<script lang="ts" generics="T extends string | number">
	interface Props {
		items: readonly SegmentedOption<T>[];
		value: T;
		onchange: (next: T) => void;
		ariaLabel?: string;
	}

	let { items, value, onchange, ariaLabel = 'Opções' }: Props = $props();
</script>

<div class="ui-segmented" role="tablist" aria-label={ariaLabel}>
	{#each items as item (item.value)}
		<button
			type="button"
			role="tab"
			aria-selected={value === item.value}
			class="ui-segmented-btn"
			class:active={value === item.value}
			onclick={() => onchange(item.value)}
		>
			{#if item.icon}
				<i class={item.icon} aria-hidden="true"></i>
			{/if}
			<span>{item.label}</span>
			{#if item.count !== undefined}
				<span class="ui-segmented-count">{item.count}</span>
			{/if}
		</button>
	{/each}
</div>

<style>
	.ui-segmented {
		display: inline-flex;
		align-items: center;
		gap: 3px;
		background: var(--sf2);
		border: 1px solid var(--ln);
		border-radius: 10px;
		padding: 3px;
		flex-wrap: wrap;
	}

	.ui-segmented-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		border: 0;
		background: transparent;
		color: var(--mut);
		padding: 6px 12px;
		border-radius: 7px;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition:
			background 0.15s,
			color 0.15s;
	}

	.ui-segmented-btn:hover {
		color: var(--ink);
	}

	.ui-segmented-btn.active {
		background: var(--sf);
		color: var(--ink);
		font-weight: 600;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
	}

	.ui-segmented-count {
		font-size: 11px;
		padding: 1px 6px;
		border-radius: 999px;
		background: var(--sf2);
		color: var(--mut);
		font-variant-numeric: tabular-nums;
	}
</style>
