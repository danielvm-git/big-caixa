import { describe, expect, it } from 'vitest';
import { formatMoney, type MoneyFormatOptions } from '$lib/ui/money';

describe('formatMoney (src/lib/ui/money)', () => {
	it('formats BRL exact (default) with R$ and 2 decimals', () => {
		expect(formatMoney(1250.5)).toBe('R$ 1.250,50');
		expect(formatMoney(0)).toBe('R$ 0,00');
		expect(formatMoney(-450.75)).toBe('−R$ 450,75');
	});

	it('formats BRL macro without cents', () => {
		const opts: MoneyFormatOptions = { currency: 'BRL', precision: 'macro' };
		expect(formatMoney(1250.4, opts)).toBe('R$ 1.250');
		expect(formatMoney(-980.6, opts)).toBe('−R$ 981');
	});

	it('formats plain cells without currency symbol (spreadsheet mode)', () => {
		expect(formatMoney(1250.5, { symbol: false })).toBe('1.250,50');
		expect(formatMoney(-100, { symbol: false })).toBe('−100,00');
	});

	it('formats USD with $ prefix and en-US decimals', () => {
		expect(formatMoney(20, { currency: 'USD' })).toBe('$20.00');
		expect(formatMoney(1250.5, { currency: 'USD' })).toBe('$1,250.50');
		expect(formatMoney(-15.25, { currency: 'USD' })).toBe('−$15.25');
		expect(formatMoney(42.8, { currency: 'USD', precision: 'macro' })).toBe('$43');
	});

	it('returns fallback for null, undefined, NaN, or zero when zeroFallback is set', () => {
		expect(formatMoney(undefined)).toBe('—');
		expect(formatMoney(null)).toBe('—');
		expect(formatMoney(Number.NaN)).toBe('—');
		expect(formatMoney(0, { zeroFallback: '—' })).toBe('—');
		expect(formatMoney(0, { zeroFallback: '—', symbol: false })).toBe('—');
	});

	it('supports explicit plus sign when signed is true', () => {
		expect(formatMoney(300, { signed: true })).toBe('+R$ 300,00');
		expect(formatMoney(-300, { signed: true })).toBe('−R$ 300,00');
		expect(formatMoney(0, { signed: true })).toBe('R$ 0,00');
	});
});
