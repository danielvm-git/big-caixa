// Copia o SQLite local para o schema caixa de um branch Neon. Não imprime linhas.
import { execFileSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import pg from 'pg';

const PROJECT = 'gentle-voice-24390268';
const branch = process.argv[2] ?? 'dev';
const sqlitePath =
	process.env.SQLITE_PATH ?? `${process.env.HOME}/Documents/My_Finances/livro-caixa.sqlite`;

const TABLES = [
	'dim_conta',
	'ref_coicop',
	'ref_bloco',
	'dim_categoria',
	'dim_pessoa',
	'dim_contraparte',
	'dim_ativo',
	'importacao',
	'fatura_cartao',
	'regra_categorizacao',
	'fato_lancamento',
	'documento',
	'lancamento_documento',
	'fato_posicao',
	'sankey_link',
	'parametro',
	'compra',
	'compra_lancamento',
	'compra_nota',
	'pedido_email',
	'compra_item',
	'viagem',
	'viagem_compra',
	'ferias',
	'fato_evento',
	'app_event'
];

function connectionString() {
	const out = execFileSync(
		'neon',
		['connection-string', branch, '--project-id', PROJECT, '--pooled', 'false'],
		{ encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
	);
	return out.trim();
}

function redact(err) {
	return String(err?.message ?? err).replace(/postgres(?:ql)?:\/\/\S+/gi, 'postgresql://***');
}

const sqlite = new DatabaseSync(sqlitePath, { readOnly: true });
const client = new pg.Client({
	connectionString: connectionString(),
	ssl: { rejectUnauthorized: false }
});

try {
	await client.connect();
	await client.query('BEGIN');
	await client.query('SET CONSTRAINTS ALL DEFERRED');
	for (const table of TABLES) {
		await client.query(`TRUNCATE TABLE caixa.${table} CASCADE`);
		const rows = sqlite.prepare(`SELECT * FROM ${table}`).all();
		if (rows.length === 0) {
			console.log(`${table} 0`);
			continue;
		}
		const cols = Object.keys(rows[0]);
		const colSql = cols.map((c) => `"${c}"`).join(', ');
		const chunk = 200;
		for (let i = 0; i < rows.length; i += chunk) {
			const slice = rows.slice(i, i + chunk);
			const values = [];
			const placeholders = slice
				.map((row, r) => {
					const slots = cols.map((col, c) => {
						values.push(row[col]);
						return `$${r * cols.length + c + 1}`;
					});
					return `(${slots.join(', ')})`;
				})
				.join(', ');
			await client.query(`INSERT INTO caixa.${table} (${colSql}) VALUES ${placeholders}`, values);
		}
		console.log(`${table} ${rows.length}`);
	}
	await client.query('COMMIT');
} catch (err) {
	await client.query('ROLLBACK').catch(() => {});
	console.error(redact(err));
	process.exitCode = 1;
} finally {
	sqlite.close();
	await client.end().catch(() => {});
}
