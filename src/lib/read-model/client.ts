import { fixtureCompras, fixtureMes, fixtureSankey } from './fixtures';
import type {
	BlocoDoc,
	CompraDoc,
	ContratoDoc,
	ContaDoc,
	FaturaPendenteDoc,
	FeriasDoc,
	ImportacaoDoc,
	LugarDoc,
	MesDoc,
	PendenciasDoc,
	PessoaDoc,
	ReferenciaDoc,
	RegraDoc,
	SankeyDoc,
	ViagemDoc,
	VinculoDoc
} from './types';
import { AUTH_MODE } from '$lib/auth/api';
import { getSession } from '$lib/auth/session';

type Colecao =
	| 'mes'
	| 'sankey'
	| 'compra'
	| 'referencia'
	| 'regras'
	| 'viagens'
	| 'ferias'
	| 'importacoes'
	| 'faturas'
	| 'pendencias'
	| 'pessoas'
	| 'lugares'
	| 'vinculos'
	| 'contratos'
	| 'contas'
	| 'blocos';

function caixaBase(): string {
	const fromEnv = import.meta.env.VITE_CAIXA_URL as string | undefined;
	return (fromEnv ?? '').replace(/\/$/, '');
}

function useFixtures(): boolean {
	if (AUTH_MODE === 'mock') return true;
	const token = getSession()?.token;
	return token === 'mock-token';
}

async function read<T>(colecao: Colecao, periodo?: string): Promise<T[]> {
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

export async function loadReferencia(periodo: string): Promise<ReferenciaDoc[]> {
	if (useFixtures()) return [];
	return read<ReferenciaDoc>('referencia', periodo);
}

export async function loadRegras(): Promise<RegraDoc[]> {
	if (useFixtures()) return [];
	return read<RegraDoc>('regras');
}

export async function loadViagens(): Promise<ViagemDoc[]> {
	if (useFixtures()) return [];
	const rows = await read<ViagemDoc & { compra_ids?: unknown }>('viagens');
	return rows.map((v) => ({
		...v,
		compra_ids: Array.isArray(v.compra_ids)
			? v.compra_ids.filter((x): x is string => typeof x === 'string')
			: []
	}));
}

export async function loadFerias(): Promise<FeriasDoc[]> {
	if (useFixtures()) return [];
	return read<FeriasDoc>('ferias');
}

export async function loadImportacoes(): Promise<ImportacaoDoc[]> {
	if (useFixtures()) return [];
	return read<ImportacaoDoc>('importacoes');
}

export async function loadFaturasPendentes(): Promise<FaturaPendenteDoc[]> {
	if (useFixtures()) return [];
	return read<FaturaPendenteDoc>('faturas');
}

export async function loadPendencias(ano: string): Promise<PendenciasDoc | null> {
	if (useFixtures()) return null;
	const data = await read<PendenciasDoc>('pendencias', ano);
	return data[0] ?? null;
}

export async function loadPessoas(): Promise<PessoaDoc[]> {
	if (useFixtures()) return [];
	const rows = await read<PessoaDoc & { aliases?: unknown }>('pessoas');
	return rows.map((p) => ({
		...p,
		aliases: Array.isArray(p.aliases)
			? p.aliases.filter((x): x is string => typeof x === 'string')
			: []
	}));
}

export async function loadLugares(): Promise<LugarDoc[]> {
	if (useFixtures()) return [];
	return read<LugarDoc>('lugares');
}

export async function loadVinculos(): Promise<VinculoDoc[]> {
	if (useFixtures()) return [];
	return read<VinculoDoc>('vinculos');
}

export async function loadContratos(): Promise<ContratoDoc[]> {
	if (useFixtures()) return [];
	return read<ContratoDoc>('contratos');
}

export async function loadContas(): Promise<ContaDoc[]> {
	if (useFixtures()) return [];
	return read<ContaDoc>('contas');
}

export async function loadBlocos(): Promise<BlocoDoc[]> {
	if (useFixtures()) return [];
	return read<BlocoDoc>('blocos');
}
