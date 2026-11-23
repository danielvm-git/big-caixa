// Lê o SQLite local e responde no formato das collections. Só no `vite dev`.
import { DatabaseSync } from 'node:sqlite';

const SQLITE_PATH =
	process.env.SQLITE_PATH ?? `${process.env.HOME}/Documents/My_Finances/livro-caixa.sqlite`;

const QUERIES = {
	mes: `SELECT mes, escopo, categoria_id, custo_recorrente, custo_extraordinario
		FROM v_custo_mensal ORDER BY mes DESC, escopo, categoria_id LIMIT 1000`,
	sankey: `SELECT periodo, nivel, origem, destino, valor
		FROM sankey_link ORDER BY periodo DESC, nivel, ordem LIMIT 1000`,
	compra: `SELECT id, data, loja, titulo, valor_total_centavos, categoria_id, escopo
		FROM compra ORDER BY data DESC LIMIT 1000`
};

export function sqliteCollections() {
	return function sqliteCollectionsMiddleware(req, res, next) {
		const url = req.url ?? '';
		if (!url.startsWith('/api/collections/')) return next();
		const name = url.slice('/api/collections/'.length).split('?')[0].split('/')[0];
		const sql = QUERIES[name];
		if (!sql) return next();
		try {
			const db = new DatabaseSync(SQLITE_PATH, { readOnly: true });
			try {
				const data = db.prepare(sql).all();
				res.setHeader('content-type', 'application/json');
				res.end(JSON.stringify({ data }));
			} finally {
				db.close();
			}
		} catch {
			res.statusCode = 503;
			res.setHeader('content-type', 'application/json');
			res.end(JSON.stringify({ error: 'sqlite unavailable' }));
		}
	};
}
