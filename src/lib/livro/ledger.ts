import {
	loadBlocos,
	loadCompras,
	loadContratos,
	loadContas,
	loadFaturasPendentes,
	loadFerias,
	loadImportacoes,
	loadMes,
	loadPendencias,
	loadLugares,
	loadPessoas,
	loadReferencia,
	loadVinculos,
	loadRegras,
	loadSankey,
	loadViagens
} from '$lib/read-model/client';
import { getSession } from '$lib/auth/session';
import { categoria } from './catalog';
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
} from '$lib/read-model/types';

export type Ledger = {
	year: number;
	month: number;
	mesAtual: string;
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

export function custoDe(row: MesDoc): number {
	return (row.custo_recorrente || 0) + (row.custo_extraordinario || 0);
}

export function somaRecorrente(rows: MesDoc[]): number {
	return rows.reduce((a, r) => a + (r.custo_recorrente || 0), 0);
}

export function somaExtraordinario(rows: MesDoc[]): number {
	return rows.reduce((a, r) => a + (r.custo_extraordinario || 0), 0);
}

export type MesResumo = {
	mes: string;
	casa: number;
	pessoal: number;
	familia: number;
	extraordinario: number;
	projetado?: boolean;
};

export function totalResumo(r: MesResumo): number {
	return r.casa + r.pessoal + r.familia;
}

function medianaDe(xs: number[]): number {
	const s = xs.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
	if (!s.length) return 0;
	return s.length % 2 === 1 ? s[s.length / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
}

export const mediana = medianaDe;

export function resumoMes(ledger: Ledger, mes: string): MesResumo {
	const rows = ledger.months[mes] ?? [];
	const out: MesResumo = { mes, casa: 0, pessoal: 0, familia: 0, extraordinario: 0 };
	for (const row of rows) {
		out.extraordinario += row.custo_extraordinario || 0;
		const rec = row.custo_recorrente || 0;
		if (row.escopo === 'casa') out.casa += rec;
		else if (row.escopo === 'pessoal') out.pessoal += rec;
		else if (row.escopo === 'familia') out.familia += rec;
	}
	return out;
}

export function mesesCarregados(ledger: Ledger): string[] {
	return Object.keys(ledger.months).sort();
}

export function historicoFechado(ledger: Ledger): MesResumo[] {
	const atual = ledger.mesAtual;
	return mesesCarregados(ledger)
		.filter((m) => m < atual)
		.map((m) => resumoMes(ledger, m));
}

export function baselineMes(ledger: Ledger): MesResumo {
	const ult = historicoFechado(ledger).slice(-12);
	return {
		mes: 'baseline',
		casa: medianaDe(ult.map((m) => m.casa)),
		pessoal: medianaDe(ult.map((m) => m.pessoal)),
		familia: medianaDe(ult.map((m) => m.familia)),
		extraordinario: 0,
		projetado: true
	};
}

export type VisaoCelula = { v: number; projetado: boolean };

export type VisaoLinha = {
	label: string;
	cells: VisaoCelula[];
	media: number;
	total: number;
	kind: 'summary' | 'category';
	categoriaId?: string;
};

function entradaMes(ledger: Ledger, mes: string, ano: number, mesAtual: string): VisaoCelula {
	const links = ledger.sankey[mes] ?? [];
	const direto = links.filter((l) => l.nivel === 1).reduce((a, l) => a + l.valor, 0);
	if (mes <= mesAtual && direto > 0) return { v: direto, projetado: false };
	if (mes <= mesAtual) return { v: 0, projetado: false };
	const vals = Array.from({ length: 12 }, (_, i) => {
		const k = chave(ano, i + 1);
		if (k > mesAtual) return 0;
		const lk = ledger.sankey[k] ?? [];
		return lk.filter((l) => l.nivel === 1).reduce((a, l) => a + l.valor, 0);
	}).filter((x) => x > 0);
	return { v: medianaDe(vals.length ? vals : [0]), projetado: true };
}

function saidaMes(ledger: Ledger, mes: string, ano: number, mesAtual: string): VisaoCelula {
	const rows = ledger.months[mes] ?? [];
	if (rows.length && mes <= mesAtual) return { v: soma(rows), projetado: false };
	if (mes > mesAtual) {
		const proj = carregarAno(ledger, ano).find((r) => r.mes === mes);
		return { v: proj ? totalResumo(proj) : 0, projetado: true };
	}
	return { v: 0, projetado: false };
}

function categoriaMes(
	ledger: Ledger,
	mes: string,
	catId: string,
	ano: number,
	mesAtual: string,
	medianaCat: number
): VisaoCelula {
	const rows = (ledger.months[mes] ?? []).filter((r) => r.categoria_id === catId);
	if (rows.length && mes <= mesAtual) return { v: soma(rows), projetado: false };
	if (mes > mesAtual) return { v: medianaCat, projetado: medianaCat > 0 };
	return { v: 0, projetado: false };
}

function statsLinha(cells: VisaoCelula[]): { media: number; total: number } {
	const vals = cells.map((c) => c.v);
	const total = vals.reduce((a, v) => a + v, 0);
	const fechados = cells.filter((c) => !c.projetado && c.v !== 0);
	const media =
		fechados.length > 0
			? fechados.reduce((a, c) => a + c.v, 0) / fechados.length
			: vals.length
				? total / vals.length
				: 0;
	return { media, total };
}

/** Planilha 12×categorias + entradas, saídas e saldo. */
export function visaoGeralAno(ledger: Ledger, ano: number): VisaoLinha[] {
	const mesAtual = ledger.mesAtual;
	const keys = Array.from({ length: 12 }, (_, i) => chave(ano, i + 1));
	const catIds = new Set<string>();
	for (const key of keys) {
		for (const row of ledger.months[key] ?? []) {
			if (row.categoria_id) catIds.add(row.categoria_id);
		}
	}
	const catList = [...catIds].sort();
	const medianaPorCat = new Map<string, number>();
	for (const id of catList) {
		const vals = keys
			.filter((k) => k <= mesAtual)
			.map((k) => soma((ledger.months[k] ?? []).filter((r) => r.categoria_id === id)))
			.filter((v) => v > 0);
		medianaPorCat.set(id, medianaDe(vals));
	}

	const entradas = keys.map((k) => entradaMes(ledger, k, ano, mesAtual));
	const saidas = keys.map((k) => saidaMes(ledger, k, ano, mesAtual));
	const saldos = keys.map((k, i) => ({
		v: entradas[i].v - saidas[i].v,
		projetado: entradas[i].projetado || saidas[i].projetado
	}));

	const rows: VisaoLinha[] = [
		{ label: 'Saldo', cells: saldos, ...statsLinha(saldos), kind: 'summary' },
		{ label: 'Entradas', cells: entradas, ...statsLinha(entradas), kind: 'summary' },
		{ label: 'Saídas', cells: saidas, ...statsLinha(saidas), kind: 'summary' }
	];
	for (const id of catList) {
		const cells = keys.map((k) =>
			categoriaMes(ledger, k, id, ano, mesAtual, medianaPorCat.get(id) ?? 0)
		);
		rows.push({
			label: categoria(id).nome || id,
			cells,
			...statsLinha(cells),
			kind: 'category',
			categoriaId: id
		});
	}
	return rows;
}

export function carregarAno(ledger: Ledger, ano: number): MesResumo[] {
	const atual = ledger.mesAtual;
	const base = baselineMes(ledger);
	const reais = new Map<string, MesResumo>();
	for (const m of mesesCarregados(ledger)) {
		if (m.startsWith(ano + '-')) reais.set(m, resumoMes(ledger, m));
	}
	const out: MesResumo[] = [];
	for (let i = 1; i <= 12; i++) {
		const m = ano + '-' + String(i).padStart(2, '0');
		if (reais.has(m) && m <= atual) {
			out.push(reais.get(m)!);
			continue;
		}
		if (m > atual) {
			let casa = base.casa;
			let pessoal = base.pessoal;
			let familia = base.familia;
			const anoAnt = ano - 1 + '-' + String(i).padStart(2, '0');
			const ant = historicoFechado(ledger).find((x) => x.mes === anoAnt);
			const baseTot = totalResumo(base);
			if (ant && baseTot > 0 && totalResumo(ant) > baseTot * 1.15) {
				const fator = totalResumo(ant) / baseTot;
				casa *= fator;
				pessoal *= fator;
				familia *= fator;
			}
			out.push({
				mes: m,
				casa,
				pessoal,
				familia,
				extraordinario: 0,
				projetado: true
			});
			continue;
		}
		out.push({ mes: m, casa: 0, pessoal: 0, familia: 0, extraordinario: 0 });
	}
	return out;
}

export type MetaBloco = {
	id: string;
	nome: string;
	metaPct: number;
	teto: boolean;
	cor: string;
	valor: number;
	pct: number;
	ok: boolean;
};

export function metas503020(
	ledger: Ledger,
	periodo: string
): { total: number; blocos: MetaBloco[]; pendente: number } {
	const links = ledger.sankey[periodo] ?? [];
	const total = links.filter((l) => l.nivel === 1).reduce((a, l) => a + l.valor, 0);
	const porBloco: Record<string, number> = {};
	for (const l of links) {
		if (l.nivel !== 2 || !l.tipo) continue;
		porBloco[l.tipo] = (porBloco[l.tipo] ?? 0) + l.valor;
	}
	const pendente = porBloco.pendente ?? 0;
	const blocos = (
		ledger.blocos.length
			? ledger.blocos
			: ([
					{ id: 'necessidade', nome: 'Necessidade', meta_pct: 50, tipo_meta: 'teto', cor: '' },
					{ id: 'desejo', nome: 'Desejo', meta_pct: 30, tipo_meta: 'teto', cor: '' },
					{ id: 'futuro', nome: 'Futuro', meta_pct: 20, tipo_meta: 'piso', cor: '' }
				] as BlocoDoc[])
	)
		.slice()
		.sort((a, b) => b.meta_pct - a.meta_pct)
		.map((b) => {
			const v = porBloco[b.id] ?? 0;
			const pct = total > 0 ? (v / total) * 100 : 0;
			const teto = b.tipo_meta === 'teto';
			const ok = teto ? pct <= b.meta_pct : pct >= b.meta_pct;
			return {
				id: b.id,
				nome: b.nome,
				metaPct: b.meta_pct,
				teto,
				cor: b.cor || '',
				valor: v,
				pct,
				ok
			};
		});
	return { total, blocos, pendente };
}

export function chavesHistorico(year: number, month: number): string[] {
	const keys: string[] = [];
	for (let y = year - 2; y <= year; y++) {
		const end = y === year ? month : 12;
		for (let m = 1; m <= end; m++) keys.push(chave(y, m));
	}
	return keys;
}

export function chave(ano: number, mes: number): string {
	return ano + '-' + String(mes).padStart(2, '0');
}

export function chavesDoAno(ano: number, ateMes: number): string[] {
	const keys: string[] = [];
	for (let i = 1; i <= ateMes; i++) keys.push(chave(ano, i));
	return keys;
}

export function linhas(ledger: Ledger, keys: string[], escopo: string | null): MesDoc[] {
	const out: MesDoc[] = [];
	for (const key of keys) {
		for (const row of ledger.months[key] ?? []) {
			if (escopo && row.escopo !== escopo) continue;
			out.push(row);
		}
	}
	return out;
}

export function soma(rows: MesDoc[]): number {
	return rows.reduce((a, r) => a + custoDe(r), 0);
}

export function somaPorCategoria(rows: MesDoc[]): Map<string, number> {
	const map = new Map<string, number>();
	for (const row of rows) {
		const id = row.categoria_id || '';
		map.set(id, (map.get(id) ?? 0) + custoDe(row));
	}
	return map;
}

export function somaPorEscopo(rows: MesDoc[]): Map<string, number> {
	const map = new Map<string, number>();
	for (const row of rows) {
		const id = row.escopo || '';
		map.set(id, (map.get(id) ?? 0) + custoDe(row));
	}
	return map;
}

type Par = { origem: string; destino: string; valor: number };

function agregar(rows: SankeyDoc[]): Par[] {
	const map = new Map<string, number>();
	for (const row of rows) {
		if (!row.valor) continue;
		const key = row.origem + '\0' + row.destino;
		map.set(key, (map.get(key) ?? 0) + row.valor);
	}
	return [...map.entries()].map(([key, valor]) => {
		const [origem, destino] = key.split('\0');
		return { origem, destino, valor };
	});
}

export function desenharSankey(
	links: SankeyDoc[],
	format: (v: number) => string,
	onPick: (nome: string) => void
) {
	const porNivel = (n: number) => agregar(links.filter((l) => l.nivel === n && l.valor > 0));
	const n1 = porNivel(1);
	const n2 = porNivel(2);
	const n3 = porNivel(3);
	const top = (rows: Par[], limite: number) => {
		const sorted = rows.slice().sort((a, b) => b.valor - a.valor);
		if (sorted.length <= limite) return sorted;
		const head = sorted.slice(0, limite);
		const resto = sorted.slice(limite).reduce((a, b) => a + b.valor, 0);
		if (resto > 0) head.push({ origem: head[0]?.origem ?? '', destino: 'Outras', valor: resto });
		return head;
	};
	const cats = top(n3, 8);
	const fontes = [...new Set(n1.map((r) => r.origem))];
	const pools = [...new Set(n1.map((r) => r.destino))];
	const blocos = [...new Set(n2.map((r) => r.destino))];
	const corBloco = (nome: string) => {
		if (nome.startsWith('Necess')) return 'var(--N)';
		if (nome.startsWith('Desej')) return 'var(--D)';
		if (nome.startsWith('Futur')) return 'var(--F)';
		return 'var(--terra)';
	};
	type No = {
		id: string;
		l: string;
		c: number;
		v: number;
		col: string;
		h: number;
		y: number;
		x: number;
		o: number;
		i: number;
	};
	const nodes: No[] = [];
	const add = (id: string, l: string, c: number, v: number, col: string) => {
		if (v <= 0) return;
		nodes.push({ id, l, c, v, col, h: 0, y: 0, x: 0, o: 0, i: 0 });
	};
	const somaDestino = (rows: Par[], nome: string) =>
		rows.filter((r) => r.destino === nome).reduce((a, b) => a + b.valor, 0);
	fontes.forEach((nome, i) =>
		add(
			's' + i,
			nome,
			0,
			n1.filter((r) => r.origem === nome).reduce((a, b) => a + b.valor, 0),
			'var(--moss)'
		)
	);
	pools.forEach((nome, i) => add('p' + i, nome, 1, somaDestino(n1, nome), 'var(--ink)'));
	blocos.forEach((nome, i) => add('b' + i, nome, 2, somaDestino(n2, nome), corBloco(nome)));
	cats.forEach((row, i) => add('c' + i, row.destino, 3, row.valor, corBloco(row.origem)));
	const tot = Math.max(
		1,
		...[0, 1, 2, 3].map((c) => nodes.filter((n) => n.c === c).reduce((a, n) => a + n.v, 0))
	);
	const pares: [string, string, number, string][] = [];
	const idPor = (col: number, nome: string) => nodes.find((n) => n.c === col && n.l === nome)?.id;
	for (const row of n1) {
		const a = idPor(0, row.origem);
		const b = idPor(1, row.destino);
		if (a && b) pares.push([a, b, row.valor, 'var(--moss)']);
	}
	for (const row of n2) {
		const a = idPor(1, row.origem);
		const b = idPor(2, row.destino);
		if (a && b) pares.push([a, b, row.valor, corBloco(row.destino)]);
	}
	for (const row of cats) {
		const a = idPor(2, row.origem) ?? idPor(2, 'Outras');
		const b = idPor(3, row.destino);
		if (a && b) pares.push([a, b, row.valor, corBloco(row.origem)]);
	}
	const H = 500;
	const gap = 10;
	const X = [10, 260, 510, 760];
	let kk = 1e9;
	for (let c = 0; c < 4; c++) {
		const ns = nodes.filter((n) => n.c === c);
		if (!ns.length) continue;
		kk = Math.min(kk, (H - gap * (ns.length - 1)) / tot);
	}
	if (!Number.isFinite(kk) || kk <= 0) kk = 1;
	for (let c = 0; c < 4; c++) {
		const ns = nodes.filter((n) => n.c === c);
		const th = ns.reduce((a, n) => a + n.v, 0) * kk + gap * Math.max(0, ns.length - 1);
		let y = (H - th) / 2 + 16;
		ns.forEach((n) => {
			n.h = Math.max(8, n.v * kk);
			n.y = y;
			n.x = X[c];
			y += n.h + gap;
		});
	}
	const by = (id: string) => nodes.find((n) => n.id === id);
	const paths = pares
		.filter((l) => l[2] > 0 && by(l[0]) && by(l[1]))
		.map((l) => {
			const a = by(l[0])!;
			const b = by(l[1])!;
			const w = l[2] * kk;
			const y0 = a.y + a.o + w / 2;
			const y1 = b.y + b.i + w / 2;
			a.o += w;
			b.i += w;
			const x0 = a.x + 14;
			const x1 = b.x;
			const xm = (x0 + x1) / 2;
			return {
				d: `M${x0} ${y0} C${xm} ${y0} ${xm} ${y1} ${x1} ${y1}`,
				w: Math.max(1, w).toFixed(1),
				c: l[3]
			};
		});
	return {
		reserva: false,
		links: paths,
		nodes: nodes.map((n) => ({
			x: n.x,
			y: n.y,
			h: n.h,
			c: n.col,
			tx: n.x + 20,
			ty: n.y + Math.min(n.h / 2 + 4, 14),
			t: n.l + ' · ' + format(n.v),
			go: () => onPick(n.l)
		}))
	};
}

export async function fetchLedger(): Promise<Ledger | null> {
	const token = getSession()?.token;
	if (!token || token === 'mock-token') return null;
	const now = new Date();
	const year = now.getFullYear();
	const month = now.getMonth() + 1;
	const mesAtual = chave(year, month);
	const keys = chavesHistorico(year, month);
	const months: Record<string, MesDoc[]> = {};
	const sankey: Record<string, SankeyDoc[]> = {};
	await Promise.all(
		keys.map(async (key) => {
			const [mes, fluxo] = await Promise.all([loadMes(key), loadSankey(key)]);
			months[key] = mes;
			sankey[key] = fluxo;
		})
	);
	const [
		compras,
		regras,
		viagens,
		ferias,
		importacoes,
		faturasPendentes,
		pendencias,
		pessoas,
		lugares,
		vinculos,
		contratos,
		contas,
		blocos,
		refAtual
	] = await Promise.all([
		loadCompras(),
		loadRegras(),
		loadViagens(),
		loadFerias(),
		loadImportacoes(),
		loadFaturasPendentes(),
		loadPendencias(String(year)),
		loadPessoas(),
		loadLugares(),
		loadVinculos(),
		loadContratos(),
		loadContas(),
		loadBlocos(),
		loadReferencia(mesAtual)
	]);
	const referencia: Record<string, ReferenciaDoc[]> = { [mesAtual]: refAtual };
	return {
		year,
		month,
		mesAtual,
		months,
		sankey,
		compras,
		referencia,
		regras,
		viagens,
		ferias,
		importacoes,
		faturasPendentes,
		pendencias,
		pessoas,
		lugares,
		vinculos,
		contratos,
		contas,
		blocos
	};
}

export function resumoDevem(vinculos: VinculoDoc[]): {
	emprestado: number;
	aReceber: number;
	voltou: number;
	taxa: number;
} {
	let emprestado = 0;
	let aReceber = 0;
	let voltou = 0;
	for (const v of vinculos) {
		const val = (v.valor_centavos || 0) / 100;
		if (v.status === 'quitado') voltou += val;
		if (v.tipo === 'emprestimo' || v.tipo === 'ajuda') {
			emprestado += val;
			if (v.status !== 'quitado') aReceber += val;
		}
	}
	const taxa = emprestado > 0 ? voltou / emprestado : 0;
	return { emprestado, aReceber, voltou, taxa };
}

export async function referenciaDoMes(ledger: Ledger, periodo: string): Promise<ReferenciaDoc[]> {
	if (ledger.referencia[periodo]) return ledger.referencia[periodo];
	const rows = await loadReferencia(periodo);
	ledger.referencia[periodo] = rows;
	return rows;
}
