// Leitura do livro-caixa para os documentos do read-model. Dinheiro em centavos inteiros.
import type { DatabaseSync } from 'node:sqlite';

export interface MesRow {
	mes: string;
	escopo: string;
	categoria_id: string;
	custo_recorrente: number;
	custo_extraordinario: number;
}

export function readMes(db: DatabaseSync, limit = 5000): MesRow[] {
	return db
		.prepare(
			`SELECT mes, escopo, categoria_id, custo_recorrente, custo_extraordinario
			 FROM v_custo_mensal ORDER BY mes DESC, escopo, categoria_id LIMIT ?`
		)
		.all(limit) as unknown as MesRow[];
}

export function readSankey(db: DatabaseSync, limit = 5000): Record<string, unknown>[] {
	return db
		.prepare(
			`SELECT periodo, nivel, origem, destino, valor, tipo, ordem
			 FROM sankey_link ORDER BY periodo DESC, nivel, ordem LIMIT ?`
		)
		.all(limit) as Record<string, unknown>[];
}

export function recordSyncFinish(db: DatabaseSync, counts: Record<string, number>): void {
	db.prepare(
		`INSERT INTO app_event (tipo, resultado, duracao_ms) VALUES ('sync_finish', ?, ?)`
	).run(JSON.stringify(counts), 0);
}
