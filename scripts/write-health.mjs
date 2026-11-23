// Gera build/health.json com versão e sha do artefato. Sem dado financeiro.
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { repoVersion } from './repo-version.mjs';

const version = repoVersion();
let sha = process.env.GITHUB_SHA ?? '';
if (!sha) {
	try {
		sha = execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
			.toString()
			.trim();
	} catch {
		sha = 'unknown';
	}
}
mkdirSync('build', { recursive: true });
const health = { status: 'ok', version, sha, builtAt: new Date().toISOString() };
writeFileSync('build/health.json', JSON.stringify(health) + '\n');
console.log('health.json escrito:', health.version, sha.slice(0, 7));
