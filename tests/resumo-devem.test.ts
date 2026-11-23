import { describe, expect, it } from 'vitest';
import { resumoDevem } from '../src/lib/livro/ledger';

describe('resumoDevem', () => {
	it('zera quando não há vínculos', () => {
		const r = resumoDevem([]);
		expect(r.aReceber).toBe(0);
		expect(r.taxa).toBe(0);
	});
});
