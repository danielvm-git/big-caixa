<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		subtitle?: string;
		actions?: Snippet;
	}

	let { title, subtitle, actions }: Props = $props();
</script>

<header class="ui-page-header">
	<div class="ui-page-header-copy">
		<h1 class="ui-page-title">{title}</h1>
		{#if subtitle}
			<p class="ui-page-subtitle">{subtitle}</p>
		{/if}
	</div>
	{#if actions}
		<div class="ui-page-actions">
			{@render actions()}
		</div>
	{/if}
</header>

<style>
	.ui-page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		flex-wrap: wrap;
		gap: 16px;
		padding-bottom: 14px;
		border-bottom: 1px solid var(--ln);
	}

	.ui-page-header-copy {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
	}

	.ui-page-title {
		font:
			600 28px/1.2 'Source Serif 4',
			serif;
		margin: 0;
		color: var(--ink);
	}

	.ui-page-subtitle {
		margin: 0;
		font-size: 13.5px;
		color: var(--mut);
		max-width: 68ch;
		line-height: 1.45;
	}

	.ui-page-actions {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
	}
</style>
