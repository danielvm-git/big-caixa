<script lang="ts">
	import { book } from '$lib/livro/book.svelte';
	import { formatMoney, type CurrencyCode, type MoneyPrecision } from './money';

	interface Props {
		value: number | null | undefined;
		currency?: CurrencyCode;
		precision?: MoneyPrecision;
		symbol?: boolean;
		signed?: boolean;
		zeroFallback?: string;
		fallback?: string;
		/** Aplica blur automático quando o modo privacidade global está ativo. Padrão: true. */
		privacy?: boolean;
		class?: string;
	}

	let {
		value,
		currency = 'BRL',
		precision = 'exact',
		symbol = true,
		signed = false,
		zeroFallback,
		fallback = '—',
		privacy = true,
		class: className = ''
	}: Props = $props();

	let text = $derived(
		formatMoney(value, { currency, precision, symbol, signed, zeroFallback, fallback })
	);

	let isEmptyToken = $derived(
		text === fallback || (zeroFallback !== undefined && text === zeroFallback)
	);
	let blurred = $derived(privacy && Boolean(book.state.priv) && !isEmptyToken);
</script>

<span class="ui-money {className}" class:is-private={blurred}>{text}</span>

<style>
	.ui-money {
		font-variant-numeric: tabular-nums;
		display: inline;
	}

	.ui-money.is-private {
		filter: blur(7px);
		user-select: none;
	}
</style>
