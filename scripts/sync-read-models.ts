#!/usr/bin/env tsx
/**
 * Lê livro-caixa.sqlite (SQLITE_PATH) e faz upsert das collections no BigBase.
 * Sem BIGBASE_API_KEY: só conta linhas e grava app_event sync_finish.
 * Não copia o sqlite para o repositório.
 */
import { DatabaseSync } from 'node:sqlite';
import { logNode } from './log-node';
import { readMes, readSankey, recordSyncFinish } from './sync-lib';

const SQLITE_PATH =
	process.env.SQLITE_PATH ?? `${process.env.HOME}/Documents/My_Finances/livro-caixa.sqlite`;
const BASE = process.env.BIGBASE_URL ?? 'https://bigbase.click';
const TOKEN = process.env.BIGBASE_API_KEY ?? process.env.BIGBASE_TOKEN;

async function upsertCollection(name: string, rows: Record<string, unknown>[]): Promise<void> {
	if (!TOKEN) return;
	for (const row of rows) {
		const res = await fetch(`${BASE}/api/collections/${name}`, {
			method: 'POST',
			headers: { Authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' },
			body: JSON.stringify({ data: row })
		});
		if (!res.ok) throw new Error(`upsert ${name}: ${res.status}`);
	}
}

const db = new DatabaseSync(SQLITE_PATH);
const t0 = Date.now();
const mes = readMes(db);
const sankey = readSankey(db);
logNode('info', 'sync_start', { outcome: 'mes,sankey', count: mes.length + sankey.length });

try {
	await upsertCollection('mes', mes as unknown as Record<string, unknown>[]);
	await upsertCollection('sankey', sankey);
	recordSyncFinish(db, { mes: mes.length, sankey: sankey.length });
	logNode('info', 'sync_finish', {
		outcome: TOKEN ? 'uploaded' : 'dry',
		count: mes.length + sankey.length,
		durationMs: Date.now() - t0
	});
} catch (err) {
	logNode('error', 'sync_failed', { err, durationMs: Date.now() - t0 });
	process.exitCode = 1;
}
