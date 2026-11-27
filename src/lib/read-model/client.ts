import { fixtureCompras, fixtureMes, fixtureSankey } from './fixtures';
import type {
	BlocoDoc,
	CompraDoc,
	ContratoDoc,
	ContaDoc,
	EntradaMensalDoc,
	EntradaTransacaoDoc,
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
	TipoEntradaDoc,
	ViagemDoc,
	VinculoDoc,
	AiSubscriptionDoc,
	AiPricingDoc,
	AiSummaryDoc
} from './types';
import { AUTH_MODE } from '$lib/auth/api';
import { getSession } from '$lib/auth/session';
import { caixaWrite } from '$lib/write/caixa';

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
	| 'blocos'
	| 'entradas'
	| 'entradas_transacoes'
	| 'tipos_entrada'
	| 'ai_subscriptions'
	| 'ai_pricing'
	| 'ai_summary'
	| 'bootstrap';

/** Leitura no mesmo endereço do site (`/api/leitura`); em dev o Vite repassa ao servidor local. */
function caixaBase(): string {
	return '/api/leitura';
}

function useFixtures(): boolean {
	if (AUTH_MODE === 'local') return false;
	if (AUTH_MODE === 'mock') return true;
	const token = getSession()?.token;
	return token === 'mock-token';
}

async function readRaw<T>(colecao: Colecao, periodo?: string): Promise<T | null> {
	if (!getSession()) throw new Error('leitura indisponível');
	const base = caixaBase();
	const path = periodo ? `${base}/${colecao}/${periodo}` : `${base}/${colecao}`;
	const res = await fetch(path, { credentials: 'same-origin' });
	if (!res.ok) throw new Error(`leitura ${res.status}`);
	const json = (await res.json()) as { data?: T | null };
	return json.data ?? null;
}

async function read<T>(colecao: Colecao, periodo?: string): Promise<T[]> {
	const data = await readRaw<T[]>(colecao, periodo);
	return Array.isArray(data) ? data : [];
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

export async function loadEntradas(ano: number | string): Promise<EntradaMensalDoc[]> {
	if (useFixtures()) return [];
	return read<EntradaMensalDoc>('entradas', String(ano));
}

export async function loadEntradasTransacoes(periodo?: string): Promise<EntradaTransacaoDoc[]> {
	if (useFixtures()) return [];
	return read<EntradaTransacaoDoc>('entradas_transacoes', periodo);
}

export async function loadTiposEntrada(): Promise<TipoEntradaDoc[]> {
	if (useFixtures()) return [];
	return read<TipoEntradaDoc>('tipos_entrada');
}

export async function reclassificarEntrada(
	transacaoId: string,
	contaCodigo: string
): Promise<void> {
	await caixaWrite({
		op: 'reclassificar_entrada',
		transacao_id: transacaoId,
		conta_codigo: contaCodigo
	});
}

export async function loadAiSubscriptions(): Promise<AiSubscriptionDoc[]> {
	if (useFixtures()) return [];
	return read<AiSubscriptionDoc>('ai_subscriptions');
}

export async function loadAiPricing(): Promise<AiPricingDoc[]> {
	if (useFixtures()) return [];
	return read<AiPricingDoc>('ai_pricing');
}

export async function loadAiSummary(): Promise<AiSummaryDoc | null> {
	if (useFixtures()) return null;
	const data = await readRaw<AiSummaryDoc | AiSummaryDoc[]>('ai_summary');
	if (!data) return null;
	if (Array.isArray(data)) return data[0] ?? null;
	return data;
}

export type BootstrapDoc = {
	months: Record<string, MesDoc[]>;
	sankey: Record<string, SankeyDoc[]>;
	compras: CompraDoc[];
	referencia: Record<string, ReferenciaDoc[]>;
	regras: RegraDoc[];
	viagens: ViagemDoc[];
	ferias: FeriasDoc[];
	importacoes: ImportacaoDoc[];
	faturasPendentes: FaturaPendenteDoc[];
	pendencias: PendenciasDoc | null;
	pessoas: PessoaDoc[];
	lugares: LugarDoc[];
	vinculos: VinculoDoc[];
	contratos: ContratoDoc[];
	contas: ContaDoc[];
	blocos: BlocoDoc[];
};

export async function loadBootstrap(mesAtual: string): Promise<BootstrapDoc | null> {
	if (useFixtures()) return null;
	const data = await readRaw<BootstrapDoc>('bootstrap', mesAtual);
	if (!data) return null;
	return {
		...data,
		viagens: (data.viagens ?? []).map((v) => ({
			...v,
			compra_ids: Array.isArray(v.compra_ids)
				? v.compra_ids.filter((x): x is string => typeof x === 'string')
				: []
		})),
		pessoas: (data.pessoas ?? []).map((p) => ({
			...p,
			aliases: Array.isArray(p.aliases)
				? p.aliases.filter((x): x is string => typeof x === 'string')
				: []
		}))
	};
}

export async function atualizarAiSubscription(params: {
	provider_key: string;
	balance_usd?: number;
	month_spent_usd?: number;
	renewal_date?: string;
	plan_name?: string;
	cost_usd?: number;
}): Promise<void> {
	await caixaWrite({
		op: 'atualizar_ai_subscription',
		...params
	});
}
