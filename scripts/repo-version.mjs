// Versão publicada do repo: tag git do big-release (ex. v1.1.2), não package.json.
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

export function repoVersion() {
	try {
		const tag = execSync('git describe --tags --abbrev=0', {
			stdio: ['ignore', 'pipe', 'ignore']
		})
			.toString()
			.trim();
		return tag.replace(/^v/, '');
	} catch {
		const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
		return pkg.version;
	}
}
