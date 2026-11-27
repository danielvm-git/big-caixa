// Entrada do servidor (container no Oracle, atrás do Cloudflare Access).
//   CAIXA_DB                caminho do SQLite (padrão /data/caixa.db)
//   PORT                    porta (padrão 3000)
//   CF_ACCESS_TEAM_DOMAIN   ex.: danielvm.cloudflareaccess.com
//   CF_ACCESS_AUD           "Application Audience (AUD) Tag" do app no Access
//   CAIXA_ALLOWED_EMAILS    e-mails aceitos, separados por vírgula
//   LOCAL_DEV=true          só em desenvolvimento: dispensa o Access
import { createServer } from 'node:http';
import { accessVerifier, localVerifier } from './access.mjs';
import { createApp } from './app.mjs';
import { openDb } from './db.mjs';

const env = process.env;
const log = (event) => console.log(JSON.stringify({ time: new Date().toISOString(), ...event }));

const whoami =
	env.LOCAL_DEV === 'true'
		? localVerifier
		: accessVerifier({
				teamDomain: env.CF_ACCESS_TEAM_DOMAIN ?? '',
				aud: env.CF_ACCESS_AUD ?? '',
				allowedEmails: (env.CAIXA_ALLOWED_EMAILS ?? '').split(',')
			});

const db = openDb(env.CAIXA_DB ?? '/data/caixa.db');
const app = createApp({
	db,
	whoami,
	staticDir: new URL('../build', import.meta.url).pathname,
	log
});
const port = Number(env.PORT ?? 3000);

const server = createServer(app);
server.listen(port, () => log({ event: 'listening', port }));

const stop = () => server.close(() => (db.close(), process.exit(0)));
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
