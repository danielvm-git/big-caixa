import { loadCompras, loadMes, loadSankey } from '$lib/read-model/client';
import { getSession } from '$lib/auth/session';
import type { CompraDoc, MesDoc, SankeyDoc } from '$lib/read-model/types';

export type Ledger = {
	year: number;
	month: number;
	months: Record<string, MesDoc[]>;
	sankey: Record<string, SankeyDoc[]>;
	compras: CompraDoc[];
};

export function custoDe(row: MesDoc): number {
	return (row.custo_recorrente || 0) + (row.custo_extraordinario || 0);
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
	const keys = chavesDoAno(year, month);
	const months: Record<string, MesDoc[]> = {};
	const sankey: Record<string, SankeyDoc[]> = {};
	await Promise.all(
		keys.map(async (key) => {
			const [mes, fluxo] = await Promise.all([loadMes(key), loadSankey(key)]);
			months[key] = mes;
			sankey[key] = fluxo;
		})
	);
	const compras = await loadCompras();
	return { year, month, months, sankey, compras };
}
