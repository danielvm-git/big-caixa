import { describe, expect, it } from 'vitest';
import {
	R,
	blkC,
	bx,
	dataCurta,
	formatReal,
	getThemeStyle,
	getThemeTokens,
	pts,
	spark
} from '$lib/livro/format';

describe('format utilities', () => {
	it('formats positive and negative currency with and without cents', () => {
		expect(formatReal(1250)).toBe('R$ 1.250');
		expect(formatReal(1250.5, true)).toBe('R$ 1.250,50');
		expect(formatReal(-450)).toBe('−R$ 450');
		expect(formatReal(-450.75, true)).toBe('−R$ 450,75');
		expect(R(0)).toBe('R$ 0');
	});

	it('formats ISO dates to DD/MM', () => {
		expect(dataCurta('2026-11-23')).toBe('23/11');
		expect(dataCurta('2026-05-01')).toBe('01/05');
		expect(dataCurta('')).toBe('');
		expect(dataCurta(null)).toBe('');
		expect(dataCurta('invalid')).toBe('');
	});

	it('computes sparklines points string', () => {
		const points = pts([10, 20, 15], 100, 40);
		expect(typeof points).toBe('string');
		expect(points.split(' ')).toHaveLength(3);
		expect(pts([], 100, 40)).toBe('');
		expect(pts([10], 100, 40)).toBe('0,20.0');
	});

	it('generates spark series of 12 numbers', () => {
		const series = spark(1000, 2);
		expect(series).toHaveLength(12);
		expect(series[0]).toBeCloseTo(900);
	});

	it('resolves block colors and box badges', () => {
		expect(blkC('N')).toBe('var(--N)');
		expect(blkC('D')).toBe('var(--D)');
		expect(blkC(null)).toBe('var(--mut)');
		expect(bx('F')).toContain('var(--F)');
		expect(bx(null)).toContain('var(--mut)');
	});

	it('resolves theme tokens and styles', () => {
		const darkTokens = getThemeTokens(true);
		const lightTokens = getThemeTokens(false);
		expect(darkTokens.bg).toBe('#161826');
		expect(lightTokens.bg).toBe('#f7f0df');

		const darkStyle = getThemeStyle(true);
		expect(darkStyle).toContain('--bg:#161826');
		const lightStyle = getThemeStyle(false);
		expect(lightStyle).toContain('--bg:#f7f0df');
	});
});
