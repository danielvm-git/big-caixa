import { fixtureCompras, fixtureMes, fixtureSankey } from './fixtures';
import type { CompraDoc, MesDoc, SankeyDoc } from './types';
import { getSession } from '$lib/auth/session';

function caixaBase(): string {
	const fromEnv = import.meta.env.VITE_CAIXA_URL as string | undefined;
	return (fromEnv ?? '').replace(/\/$/, '');
}

function useFixtures(): boolean {
	const token = getSession()?.token;
	return !token || token === 'mock-token' || token.split('.').length !== 3;
}

async function read<T>(colecao: 'mes' | 'sankey' | 'compra', periodo?: string): Promise<T[]> {
	const token = getSession()?.token;
	const base = caixaBase();
	if (!token || !base) throw new Error('leitura indisponível');
	const path = periodo ? `${base}/${colecao}/${periodo}` : `${base}/${colecao}`;
	const res = await fetch(path, { headers: { Authorization: `Bearer ${token}` } });
	if (!res.ok) throw new Error(`leitura ${res.status}`);
	const json = (await res.json()) as { data?: T[] };
	return json.data ?? [];
}

export async function loadMes(periodo: string): Promise<MesDoc[]> {
	if (useFixtures()) return fixtureMes.filter((m) => m.mes === periodo);
	const all = await read<MesDoc>('mes', periodo);
	return all.filter((m) => m.mes === periodo);
}

export async function loadCompras(): Promise<CompraDoc[]> {
	if (useFixtures()) return fixtureCompras;
	return read<CompraDoc>('compra');
}

export async function loadSankey(periodo: string): Promise<SankeyDoc[]> {
	if (useFixtures()) return fixtureSankey.filter((s) => s.periodo === periodo);
	const all = await read<SankeyDoc>('sankey', periodo);
	return all.filter((s) => s.periodo === periodo);
}
