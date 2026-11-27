// Cópia única: livro-caixa do Neon (Postgres, schema `caixa`, branch production)
// para um arquivo SQLite novo, com o schema de db/schema.sql.
//
//   NEON_ORG_ID=org-... node scripts/copy-neon-to-sqlite.mjs caminho/caixa.db
//
// Recusa um arquivo que já tenha dados. Depois de copiar, confere tabela por tabela
// (linhas e conteúdo, por hash) e as views de custo. Imprime só contagens e ok/DIFF:
// nenhum valor do livro sai no terminal. A connection string vem do neonctl e não é
// impressa. Apagar depois que o Neon for desligado.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import pg from 'pg';
import { openDb } from '../server/db.mjs';

const PROJECT = process.env.NEON_PROJECT_ID ?? 'gentle-voice-24390268';
const BRANCH = process.env.NEON_BRANCH ?? 'production';
const out = process.argv[2];
if (!out) {
	console.error('uso: node scripts/copy-neon-to-sqlite.mjs <arquivo.db>');
	process.exit(2);
}

// Datas e números como texto do Postgres, sem fuso nem float do driver.
for (const oid of [1082, 1114, 1184, 1700, 20]) pg.types.setTypeParser(oid, (v) => v);

function connectionString() {
	const args = ['connection-string', BRANCH, '--project-id', PROJECT];
	if (process.env.NEON_ORG_ID) args.push('--org-id', process.env.NEON_ORG_ID);
	return execFileSync('neonctl', args, {
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'pipe']
	}).trim();
}

/** Valor do Postgres no formato que a coluna SQLite guarda. */
function toSqlite(value, decl) {
	if (value === null || value === undefined) return null;
	if (typeof value === 'boolean') return value ? 1 : 0;
	if (decl === 'INTEGER' && typeof value === 'string' && /^-?\d+$/.test(value)) {
		const n = Number(value);
		if (!Number.isSafeInteger(n)) throw new Error('inteiro fora do limite');
		return n;
	}
	if (decl === 'REAL' && typeof value === 'string') return Number(value);
	if (typeof value === 'object') return JSON.stringify(value);
	return value;
}

const digest = (rows) => createHash('sha256').update(JSON.stringify(rows)).digest('hex');

const db = openDb(out);
const tables = db
	.prepare(
		`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name`
	)
	.all()
	.map((r) => String(r.name));
for (const t of tables) {
	if (db.prepare(`SELECT 1 FROM "${t}" LIMIT 1`).get()) {
		console.error(`recusado: ${out} já tem dados em ${t}`);
		process.exit(1);
	}
}

const client = new pg.Client({
	connectionString: connectionString(),
	ssl: { rejectUnauthorized: true }
});
await client.connect();
const report = [];
try {
	const source = {};
	db.exec('BEGIN IMMEDIATE');
	db.exec('PRAGMA defer_foreign_keys = ON');
	try {
		for (const t of tables) {
			const cols = db.prepare(`PRAGMA table_info("${t}")`).all();
			const names = cols.map((c) => String(c.name));
			const decl = Object.fromEntries(
				cols.map((c) => [String(c.name), String(c.type).toUpperCase()])
			);
			const pk = cols.filter((c) => Number(c.pk) > 0).sort((a, b) => Number(a.pk) - Number(b.pk));
			const order = (pk.length ? pk.map((c) => c.name) : names).map((n) => `"${n}"`).join(', ');
			const q = await client.query(
				`SELECT ${names.map((n) => `"${n}"`).join(', ')} FROM caixa."${t}" ORDER BY ${order}`
			);
			const rows = q.rows.map((r) => names.map((n) => toSqlite(r[n], decl[n])));
			const ins = db.prepare(
				`INSERT INTO "${t}" (${names.map((n) => `"${n}"`).join(', ')}) VALUES (${names.map(() => '?').join(', ')})`
			);
			for (const r of rows) ins.run(...r);
			source[t] = { rows, order, names };
		}
		db.exec('COMMIT');
	} catch (err) {
		db.exec('ROLLBACK');
		throw err;
	}

	// Conferência: lê de volta do SQLite e compara com o que veio do Postgres.
	for (const t of tables) {
		const { rows, order, names } = source[t];
		const back = db
			.prepare(`SELECT ${names.map((n) => `"${n}"`).join(', ')} FROM "${t}" ORDER BY ${order}`)
			.all()
			.map((r) => names.map((n) => r[n]));
		report.push({ objeto: t, linhas: rows.length, ok: digest(back) === digest(rows) });
	}

	// Views de custo: Postgres e SQLite têm de dar os mesmos números (2 casas).
	const views = {
		v_custo_mensal: [
			'mes, escopo, categoria_id',
			'mes, escopo, categoria_id, round(custo_recorrente, 2) AS a, round(custo_extraordinario, 2) AS b, n'
		],
		v_mov: ['id', 'id, pool, bloco, coicop_codigo, mes'],
		v_transferencia_sem_par: ['id', 'id'],
		v_ai_subscriptions_summary: [
			'1',
			'total_active_services AS a, total_recurring_plans AS b, round(total_monthly_cost_usd, 2) AS c, next_renewal_date AS d'
		]
	};
	const norm = (rows) =>
		rows.map((r) =>
			Object.values(r).map((x) =>
				x === null ? null : /^-?\d+(\.\d+)?$/.test(String(x)) ? Number(x) : String(x)
			)
		);
	for (const [v, [order, cols]] of Object.entries(views)) {
		const a = (await client.query(`SELECT ${cols} FROM caixa.${v} ORDER BY ${order}`)).rows;
		const b = db.prepare(`SELECT ${cols} FROM ${v} ORDER BY ${order}`).all();
		report.push({
			objeto: v,
			linhas: a.length,
			ok: a.length === b.length && digest(norm(a)) === digest(norm(b))
		});
	}
} finally {
	await client.end();
	db.close();
}

console.table(report);
const bad = report.filter((r) => !r.ok);
if (bad.length) {
	console.error(`DIFF em: ${bad.map((r) => r.objeto).join(', ')}`);
	process.exit(1);
}
console.log(`ok: ${report.length} objetos conferidos`);
