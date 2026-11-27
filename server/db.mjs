// Abre o livro-caixa em SQLite e aplica db/schema.sql (idempotente).
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const SCHEMA = new URL('../db/schema.sql', import.meta.url);

/** @param {string} path */
export function openDb(path) {
	const db = new DatabaseSync(path);
	db.exec('PRAGMA journal_mode = WAL');
	db.exec('PRAGMA busy_timeout = 5000');
	db.exec('PRAGMA synchronous = NORMAL');
	db.exec('PRAGMA foreign_keys = ON');
	db.exec(readFileSync(SCHEMA, 'utf8'));
	return db;
}
