import { describe, expect, it } from 'vitest';
import { mesAnterior } from '../src/lib/filters';

describe('filters', () => {
	it('calcula mês anterior atravessando o ano', () => {
		expect(mesAnterior('2026-01')).toBe('2025-12');
	});
});
