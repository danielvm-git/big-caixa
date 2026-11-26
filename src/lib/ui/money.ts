/**
 * Formatação unificada de valores monetários (BRL e USD) para o big-caixa.
 */

export type CurrencyCode = 'BRL' | 'USD';
export type MoneyPrecision = 'exact' | 'macro';

export interface MoneyFormatOptions {
	currency?: CurrencyCode;
	precision?: MoneyPrecision;
	/** Se false, omite o símbolo de moeda (útil em células de planilha). Padrão: true. */
	symbol?: boolean;
	/** Se true, adiciona prefixo "+" para valores positivos. Padrão: false. */
	signed?: boolean;
	/** Texto exibido quando o valor é exatamente 0. */
	zeroFallback?: string;
	/** Texto exibido para null, undefined ou NaN. Padrão: "—". */
	fallback?: string;
}

export function formatMoney(
	value: number | null | undefined,
	options: MoneyFormatOptions = {}
): string {
	const {
		currency = 'BRL',
		precision = 'exact',
		symbol = true,
		signed = false,
		zeroFallback,
		fallback = '—'
	} = options;

	if (value === null || value === undefined || Number.isNaN(value)) {
		return fallback;
	}

	if (value === 0 && zeroFallback !== undefined) {
		return zeroFallback;
	}

	const digits = precision === 'macro' ? 0 : 2;
	const locale = currency === 'USD' ? 'en-US' : 'pt-BR';
	const formattedAbs = Math.abs(value).toLocaleString(locale, {
		minimumFractionDigits: digits,
		maximumFractionDigits: digits
	});

	const sign = value < 0 ? '−' : signed && value > 0 ? '+' : '';
	const prefix = !symbol ? '' : currency === 'USD' ? '$' : 'R$ ';

	return `${sign}${prefix}${formattedAbs}`;
}
