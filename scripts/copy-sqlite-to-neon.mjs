// Copia o SQLite local para o schema caixa em um ou mais branches Neon (mesmos dados em cada um).
import { execFileSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import pg from 'pg';

const PROJECT = 'gentle-voice-24390268';
const branches =
	process.argv.length > 2 ? process.argv.slice(2) : ['production', 'staging'];
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

function connectionString(branch) {
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

async function copyToBranch(branch, sqlite) {
	const client = new pg.Client({
		connectionString: connectionString(branch),
		ssl: { rejectUnauthorized: false }
	});
	await client.connect();
	try {
		await client.query('BEGIN');
		await client.query('SET CONSTRAINTS ALL DEFERRED');
		for (const table of TABLES) {
			await client.query(`TRUNCATE TABLE caixa.${table} CASCADE`);
			const rows = sqlite.prepare(`SELECT * FROM ${table}`).all();
			if (rows.length === 0) {
				console.log(`${branch} ${table} 0`);
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
			console.log(`${branch} ${table} ${rows.length}`);
		}
		await client.query('COMMIT');
	} catch (err) {
		await client.query('ROLLBACK').catch(() => {});
		throw err;
	} finally {
		await client.end().catch(() => {});
	}
}

const sqlite = new DatabaseSync(sqlitePath, { readOnly: true });
let failed = false;
for (const branch of branches) {
	try {
		await copyToBranch(branch, sqlite);
	} catch (err) {
		console.error(`${branch}: ${redact(err)}`);
		failed = true;
	}
}
sqlite.close();
if (failed) process.exitCode = 1;