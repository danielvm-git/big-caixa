// Filtros globais (período, escopo, base, privacidade, tema). Telas importam; não editam.
import { writable, derived, type Readable } from 'svelte/store';

export type Escopo = 'todos' | 'casa' | 'pessoal' | 'familia' | 'investimentos';
export type Base = 'caixa' | 'competencia';
export type Tema = 'claro' | 'escuro';

export const ESCOPOS: Escopo[] = ['todos', 'casa', 'pessoal', 'familia', 'investimentos'];

export interface Filtros {
	/** AAAA-MM */
	mes: string;
	escopo: Escopo;
	base: Base;
	privacidade: boolean;
	tema: Tema;
}

/** Mês corrente no fuso local, formato AAAA-MM. */
export function mesAtual(now = new Date()): string {
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function mesAnterior(mes: string, n = 1): string {
	const [y, m] = mes.split('-').map(Number);
	const d = new Date(y, m - 1 - n, 1);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export const filtros = writable<Filtros>({
	mes: mesAtual(),
	escopo: 'todos',
	base: 'caixa',
	privacidade: false,
	tema: 'claro'
});

export const mes: Readable<string> = derived(filtros, (f) => f.mes);
export const escopo: Readable<Escopo> = derived(filtros, (f) => f.escopo);
export const base: Readable<Base> = derived(filtros, (f) => f.base);

export function setMes(v: string) {
	filtros.update((f) => ({ ...f, mes: v }));
}
export function setEscopo(v: Escopo) {
	filtros.update((f) => ({ ...f, escopo: v }));
}
export function setBase(v: Base) {
	filtros.update((f) => ({ ...f, base: v }));
}
export function togglePrivacidade() {
	filtros.update((f) => ({ ...f, privacidade: !f.privacidade }));
}
export function toggleTema() {
	filtros.update((f) => ({ ...f, tema: f.tema === 'claro' ? 'escuro' : 'claro' }));
}
