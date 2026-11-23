// Aplica scripts/sql/caixa-v2-migration.sql em um ou mais branches Neon.
import { execFileSync } from 'node:child_process';
import { readFileSync as rf } from 'node:fs';
import pg from 'pg';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const PROJECT = 'gentle-voice-24390268';
const branches = process.argv.length > 2 ? process.argv.slice(2) : ['production', 'staging'];
const sqlPath = join(dirname(fileURLToPath(import.meta.url)), 'sql/caixa-v2-migration.sql');
const sql = rf(sqlPath, 'utf8');

function connectionString(branch) {
	const out = execFileSync(
		'neon',
		['connection-string', branch, '--project-id', PROJECT, '--pooled', 'false'],
		{ encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
	);
	return out.trim();
}

for (const branch of branches) {
	const client = new pg.Client({
		connectionString: connectionString(branch),
		ssl: { rejectUnauthorized: false }
	});
	await client.connect();
	try {
		await client.query(sql);
		console.log(`${branch}: migration ok`);
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		console.error(`${branch}: migration failed — ${msg}`);
		process.exitCode = 1;
	} finally {
		await client.end();
	}
}
