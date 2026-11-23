import { fixtureCompras, fixtureMes, fixtureSankey } from './fixtures';
import type { CompraDoc, MesDoc, SankeyDoc } from './types';
import { getSession } from '$lib/auth/session';

import { bigbaseBase } from '$lib/bigbase-url';

async function listCollection<T>(name: string): Promise<T[]> {
	const token = getSession()?.token;
	if (!token) return [];
	const res = await fetch(`${bigbaseBase()}/api/collections/${name}?limit=1000`, {
		headers: { Authorization: `Bearer ${token}` }
	});
	if (!res.ok) throw new Error(`${name}: ${res.status}`);
	const json = (await res.json()) as { data?: T[] };
	return json.data ?? [];
}

export async function loadMes(periodo: string): Promise<MesDoc[]> {
	try {
		if (!getSession()?.token) return fixtureMes.filter((m) => m.mes === periodo);
		const all = await listCollection<MesDoc>('mes');
		return all.filter((m) => m.mes === periodo);
	} catch {
		return fixtureMes.filter((m) => m.mes === periodo);
	}
}

export async function loadCompras(): Promise<CompraDoc[]> {
	try {
		if (!getSession()?.token) return fixtureCompras;
		return await listCollection<CompraDoc>('compra');
	} catch {
		return fixtureCompras;
	}
}

export async function loadSankey(periodo: string): Promise<SankeyDoc[]> {
	try {
		if (!getSession()?.token) return fixtureSankey.filter((s) => s.periodo === periodo);
		const all = await listCollection<SankeyDoc>('sankey');
		return all.filter((s) => s.periodo === periodo);
	} catch {
		return fixtureSankey.filter((s) => s.periodo === periodo);
	}
}
