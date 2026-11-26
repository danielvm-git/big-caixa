<script lang="ts">
	interface Props {
		kind: 'loading' | 'error' | 'empty';
		message: string;
		detail?: string;
		retryLabel?: string;
		onretry?: () => void;
	}

	let { kind, message, detail, retryLabel = 'Tentar novamente', onretry }: Props = $props();
</script>

<div
	class="ui-data-state"
	class:is-error={kind === 'error'}
	role={kind === 'error' ? 'alert' : 'status'}
>
	{#if kind === 'loading'}
		<i class="ph ph-spinner-gap ui-spin" aria-hidden="true"></i>
	{:else if kind === 'error'}
		<i class="ph ph-warning-circle" aria-hidden="true"></i>
	{:else}
		<i class="ph ph-notebook" aria-hidden="true"></i>
	{/if}
	<div class="ui-data-state-msg">{message}</div>
	{#if detail}
		<div class="ui-data-state-detail">{detail}</div>
	{/if}
	{#if kind === 'error' && onretry}
		<button type="button" class="ui-data-state-retry" onclick={onretry}>
			{retryLabel}
		</button>
	{/if}
</div>

<style>
	.ui-data-state {
		background: var(--sf);
		border: 1px solid var(--ln);
		border-radius: 14px;
		padding: 40px 24px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		gap: 8px;
		color: var(--mut);
		font-size: 14px;
	}

	.ui-data-state i {
		font-size: 28px;
		color: var(--mut);
	}

	.ui-data-state.is-error {
		border-color: var(--terra);
		color: var(--terra);
	}

	.ui-data-state.is-error i {
		color: var(--terra);
	}

	.ui-data-state-msg {
		font-weight: 500;
		color: var(--ink);
	}

	.ui-data-state.is-error .ui-data-state-msg {
		color: var(--terra);
	}

	.ui-data-state-detail {
		font-size: 13px;
		color: var(--mut);
		max-width: 52ch;
	}

	.ui-data-state-retry {
		margin-top: 6px;
		background: var(--sun);
		color: var(--onsun);
		border: 0;
		border-radius: 8px;
		padding: 8px 14px;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
	}

	.ui-spin {
		animation: ui-state-spin 1s linear infinite;
	}

	@keyframes ui-state-spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
