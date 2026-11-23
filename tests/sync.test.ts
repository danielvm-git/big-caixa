import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';
import { logNode } from '../scripts/log-node';
import { readMes, readSankey, recordSyncFinish } from '../scripts/sync-lib';

function fixtureDb() {
	const db = new DatabaseSync(':memory:');
	db.exec(`
		CREATE TABLE v_custo_mensal (mes TEXT, escopo TEXT, categoria_id TEXT,
			custo_recorrente REAL, custo_extraordinario REAL, n INTEGER);
		CREATE TABLE sankey_link (periodo TEXT, nivel INTEGER, origem TEXT, destino TEXT,
			valor REAL, tipo TEXT, ordem INTEGER);
		CREATE TABLE app_event (id INTEGER PRIMARY KEY AUTOINCREMENT,
			ocorrido_em TEXT NOT NULL DEFAULT (datetime('now')), tipo TEXT NOT NULL,
			rota TEXT, mes TEXT, escopo TEXT, duracao_ms INTEGER, resultado TEXT);
		INSERT INTO v_custo_mensal VALUES ('2026-11','casa','mercado',1480,0,12),
			('2026-11','pessoal','restaurantes',286,50,3);
		INSERT INTO sankey_link VALUES ('2026-11',1,'Renda','Casa',3000,'entrada',0);
	`);
	return db;
}

describe('sync read-models (fixture mínima)', () => {
	it('lê mês e sankey da fixture', () => {
		const db = fixtureDb();
		const mes = readMes(db);
		expect(mes).toHaveLength(2);
		expect(mes[0].mes).toBe('2026-11');
		expect(readSankey(db)).toHaveLength(1);
	});

	it('grava app_event sync_finish com contagens', () => {
		const db = fixtureDb();
		recordSyncFinish(db, { mes: 2, sankey: 1 });
		const row = db.prepare(`SELECT tipo, resultado FROM app_event`).get() as {
			tipo: string;
			resultado: string;
		};
		expect(row.tipo).toBe('sync_finish');
		expect(JSON.parse(row.resultado)).toEqual({ mes: 2, sankey: 1 });
	});
});

describe('log operacional', () => {
	it('app.jsonl não carrega valor, loja, e-mail nem token', () => {
		const dir = mkdtempSync(join(tmpdir(), 'bc-log-'));
		const file = join(dir, 'app.jsonl');
		const dirty = {
			route: '/compras',
			count: 3,
			loja: 'PADARIA SECRETA',
			email: 'alguem@exemplo.com',
			token: 'bb_dep_segredo',
			valor: 12345,
			err: new Error('falha com PADARIA SECRETA')
		} as never;
		logNode('error', 'teste', dirty, file);
		const out = readFileSync(file, 'utf8');
		const parsed = JSON.parse(out.trim());
		expect(parsed.level).toBe('error');
		expect(parsed.route).toBe('/compras');
		expect(parsed.err.stack).toBeDefined();
		for (const proibido of ['PADARIA', 'alguem@', 'bb_dep_', '12345']) {
			expect(out.replace(/"stack":"[^"]*"/, '')).not.toContain(proibido);
		}
	});
});
