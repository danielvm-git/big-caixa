// BigBase (Go FileServer) não faz fallback SPA. Copia login.html → login/index.html, etc.
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const build = 'build';
for (const name of readdirSync(build)) {
	if (!name.endsWith('.html') || name === 'index.html' || name === '200.html') continue;
	const route = name.slice(0, -5);
	const dir = join(build, route);
	mkdirSync(dir, { recursive: true });
	const target = join(dir, 'index.html');
	if (!existsSync(target)) {
		copyFileSync(join(build, name), target);
	}
}
console.log('static-fileserver-layout: rotas em */index.html');
