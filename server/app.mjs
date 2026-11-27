// Servidor do caixa: o site estático (build/) e a API no mesmo endereço.
//   GET  /up                         saúde (Kamal), sem login
//   GET  /api/me                     { email } de quem está logado
//   GET  /api/leitura/:colecao[/:p]  leitura (server/leitura.mjs)
//   POST /api/escrita                escrita (server/escrita.mjs)
// Toda rota /api exige o Cloudflare Access (server/access.mjs).
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { rows } from './leitura.mjs';
import { ValidationError, handle } from './escrita.mjs';

const MAX_BODY = 64 * 1024;

/** @type {Record<string, string>} */
const TYPES = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.json': 'application/json',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.ico': 'image/x-icon',
	'.txt': 'text/plain; charset=utf-8',
	'.woff2': 'font/woff2',
	'.webmanifest': 'application/manifest+json'
};

const CSP = [
	"default-src 'self'",
	"script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://unpkg.com",
	"connect-src 'self'",
	"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://unpkg.com",
	"font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://unpkg.com",
	"img-src 'self' data:",
	"frame-ancestors 'none'"
].join('; ');

/**
 * @param {import('node:http').ServerResponse} res
 * @param {number} status
 * @param {unknown} body
 * @param {Record<string, string>} [headers]
 */
function send(res, status, body, headers = {}) {
	res.writeHead(status, {
		'content-type': 'application/json',
		'cache-control': 'no-store',
		...headers
	});
	res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

/**
 * @param {import('node:http').IncomingMessage} req
 * @returns {Promise<string>}
 */
function readBody(req) {
	return new Promise((ok, fail) => {
		let size = 0;
		/** @type {Buffer[]} */
		const chunks = [];
		req.on('data', (/** @type {Buffer} */ c) => {
			size += c.length;
			if (size > MAX_BODY) {
				// Responde 413 primeiro; a conexão fecha depois da resposta (ver abaixo).
				req.removeAllListeners('data');
				req.pause();
				fail(new ValidationError('too large'));
			} else chunks.push(c);
		});
		req.on('end', () => ok(Buffer.concat(chunks).toString('utf8')));
		req.on('error', fail);
	});
}

/**
 * Caminho dentro de build/ ou null (nada de ../). SPA: rota sem arquivo cai em 200.html.
 * @param {string} root
 * @param {string} pathname
 */
function staticFile(root, pathname) {
	let rel;
	try {
		rel = decodeURIComponent(pathname);
	} catch {
		return null;
	}
	const full = resolve(root, '.' + normalize('/' + rel));
	if (full !== root && !full.startsWith(root + sep)) return null;
	for (const candidate of [full, join(full, 'index.html'), full + '.html']) {
		if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
	}
	const fallback = join(root, '200.html');
	return extname(full) === '' && existsSync(fallback) ? fallback : null;
}

/**
 * @param {{ db: import('node:sqlite').DatabaseSync, whoami: (req: any) => Promise<string|null>,
 *           staticDir: string, log?: (event: object) => void }} deps
 */
export function createApp({ db, whoami, staticDir, log = () => {} }) {
	const root = resolve(staticDir);
	/**
	 * @param {import('node:http').IncomingMessage} req
	 * @param {import('node:http').ServerResponse} res
	 */
	return async function app(req, res) {
		const started = Date.now();
		const url = new URL(req.url ?? '/', 'http://caixa.local');
		const path = url.pathname;
		let status = 500;
		/** @type {(code: number, body: unknown, headers?: Record<string, string>) => void} */
		const reply = (code, body, headers) => {
			status = code;
			send(res, code, body, headers);
		};
		try {
			if (path === '/up') return reply(200, { status: 'ok' });

			if (path === '/api' || path.startsWith('/api/')) {
				const email = await whoami(req);
				if (!email) return reply(401, { error: 'unauthorized' });

				if (path === '/api/me' && req.method === 'GET') return reply(200, { email });

				if (path.startsWith('/api/leitura/')) {
					if (req.method !== 'GET') return reply(405, { error: 'method' });
					const [colecao = '', periodo = null] = path
						.slice('/api/leitura/'.length)
						.split('/')
						.filter(Boolean);
					const data = rows(db, colecao, periodo);
					if (data == null) return reply(404, { error: 'unknown' });
					return reply(200, { data });
				}

				if (path === '/api/escrita') {
					if (req.method !== 'POST') return reply(405, { error: 'method' });
					let body;
					try {
						body = JSON.parse(await readBody(req));
					} catch (err) {
						if (err instanceof ValidationError) {
							res.on('finish', () => req.destroy());
							return reply(413, { error: 'too large' }, { connection: 'close' });
						}
						return reply(400, { error: 'json' });
					}
					try {
						return reply(200, handle(db, body));
					} catch (err) {
						if (err instanceof ValidationError) return reply(400, { error: 'invalid' });
						throw err;
					}
				}
				return reply(404, { error: 'unknown' });
			}

			if (req.method !== 'GET' && req.method !== 'HEAD') return reply(405, { error: 'method' });
			const file = staticFile(root, path);
			if (!file) return reply(404, { error: 'not found' });
			status = 200;
			res.writeHead(200, {
				'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
				'cache-control': file.includes(`${sep}_app${sep}immutable${sep}`)
					? 'public, max-age=31536000, immutable'
					: 'no-cache',
				'content-security-policy': CSP,
				'x-content-type-options': 'nosniff',
				'referrer-policy': 'same-origin'
			});
			if (req.method === 'HEAD') return res.end();
			createReadStream(file).pipe(res);
		} catch (err) {
			log({ event: 'error', path, error: String(/** @type {any} */ (err)?.name ?? 'Error') });
			if (!res.headersSent) reply(500, { error: 'internal' });
			else res.end();
		} finally {
			// Sem query string, sem e-mail, sem corpo: nada de dado financeiro no log.
			log({
				event: 'request',
				method: req.method,
				path: path.startsWith('/api/leitura/') ? '/api/leitura' : path,
				status,
				ms: Date.now() - started
			});
		}
	};
}
