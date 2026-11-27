// Servidor SQLite do caixa (server/*.mjs): leitura, escrita, Access e arquivos.
import { createServer, type Server } from 'node:http';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SignJWT, createLocalJWKSet, exportJWK, generateKeyPair } from 'jose';
import { openDb } from '../server/db.mjs';
import { createApp } from '../server/app.mjs';
import { accessVerifier } from '../server/access.mjs';

const SEED = `
INSERT INTO ref_bloco (id, nome, nome_en, meta_pct, tipo_meta) VALUES ('necessidade', 'Necessidades', 'Needs', 50, 'teto');
INSERT INTO ref_coicop (codigo, nivel, nome_en, nome_pt, origem) VALUES ('01', 'divisao', 'Food', 'Alimentação', 'coicop');
INSERT INTO ref_coicop (codigo, nivel, nome_en, nome_pt, origem, codigo_pai) VALUES ('01.1', 'grupo', 'Food', 'Alimentos', 'coicop', '01');
INSERT INTO dim_conta (id, nome, instituicao, tipo, escopo_padrao) VALUES ('bb_conjunta', 'BB Conjunta', 'BB', 'corrente', 'casa');
INSERT INTO dim_categoria (id, nome, grupo, bloco, coicop_codigo) VALUES ('mercado', 'Mercado', 'despesa', 'necessidade', '01.1');
INSERT INTO dim_categoria (id, nome, grupo) VALUES ('salario', 'Salário', 'receita');
INSERT INTO dim_pessoa (id, nome) VALUES ('ana', 'Ana'), ('eu', 'Eu');
INSERT INTO fato_lancamento (id, hash_dedup, data_caixa, data_competencia, valor_centavos, conta_id, descricao_original, tipo, escopo, categoria_id)
VALUES (1, 'h1', '2026-01-10', '2026-01-10', -12345, 'bb_conjunta', 'SUPERMERCADO', 'despesa', 'casa', 'mercado'),
       (2, 'h2', '2026-01-20', '2026-01-20', -5000, 'bb_conjunta', 'FEIRA', 'despesa', 'casa', 'mercado'),
       (3, 'h3', '2026-01-05', '2026-01-05', 900000, 'bb_conjunta', 'SALARIO', 'receita', 'casa', 'salario');
INSERT INTO compra (id, data, descricao, loja, conta_id, valor_parcela_centavos, valor_total_centavos, valor_pago_centavos)
VALUES ('c1', '2026-01-10', 'Compra do mês', 'Mercado X', 'bb_conjunta', 12345, 12345, 12345);
INSERT INTO compra_lancamento (compra_id, lancamento_id) VALUES ('c1', 1);
INSERT INTO viagem (id, nome, ida, volta) VALUES (1, 'Praia', '2026-02-01', '2026-02-10');
INSERT INTO viagem_compra (compra_id, viagem_id) VALUES ('c1', 1);
INSERT INTO sankey_link (periodo, nivel, origem, destino, valor, ordem) VALUES ('2026-01', 1, 'Renda', 'Casa', 9000, 1);
`;

let dir: string;
let server: Server;
let base: string;

const USER = 'eu@exemplo.com';

beforeAll(async () => {
	dir = mkdtempSync(join(tmpdir(), 'caixa-test-'));
	const staticDir = join(dir, 'build');
	mkdirSync(join(staticDir, 'mes'), { recursive: true });
	writeFileSync(join(staticDir, '200.html'), '<p>spa</p>');
	writeFileSync(join(staticDir, 'index.html'), '<p>home</p>');
	writeFileSync(join(staticDir, 'mes', 'index.html'), '<p>mes</p>');
	writeFileSync(join(dir, 'secret.txt'), 'nao');
	const db = openDb(join(dir, 'caixa.db'));
	db.exec(SEED);
	const whoami = async (req: { headers: Record<string, string | undefined> }) =>
		req.headers['x-test-user'] === USER ? USER : null;
	server = createServer(createApp({ db, whoami, staticDir }));
	await new Promise<void>((ok) => server.listen(0, '127.0.0.1', () => ok()));
	const addr = server.address();
	base = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`;
});

afterAll(() => {
	server?.close();
	rmSync(dir, { recursive: true, force: true });
});

const get = (path: string, auth = true) =>
	fetch(base + path, { headers: auth ? { 'x-test-user': USER } : {} });
const post = (body: unknown, auth = true) =>
	fetch(base + '/api/escrita', {
		method: 'POST',
		headers: { 'content-type': 'application/json', ...(auth ? { 'x-test-user': USER } : {}) },
		body: typeof body === 'string' ? body : JSON.stringify(body)
	});
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- formato varia por coleção
type Json = any;
const data = async (path: string): Promise<Json> =>
	((await (await get(path)).json()) as { data: Json }).data;

describe('acesso', () => {
	it('/up responde sem login', async () => {
		expect((await get('/up', false)).status).toBe(200);
	});
	it('a API recusa quem não passou pelo Access', async () => {
		expect((await get('/api/leitura/mes/2026-01', false)).status).toBe(401);
		expect((await get('/api/me', false)).status).toBe(401);
		expect((await post({ op: 'upsert_lugar', nome: 'x' }, false)).status).toBe(401);
	});
	it('/api/me devolve o e-mail', async () => {
		expect(await (await get('/api/me')).json()).toEqual({ email: USER });
	});
});

describe('leitura', () => {
	it('mes soma o custo do mês por categoria', async () => {
		expect(await data('/api/leitura/mes/2026-01')).toEqual([
			{
				mes: '2026-01',
				escopo: 'casa',
				categoria_id: 'mercado',
				custo_recorrente: 173.45,
				custo_extraordinario: 0
			}
		]);
	});
	it('período inválido devolve lista vazia', async () => {
		expect(await data('/api/leitura/mes/2026-1')).toEqual([]);
	});
	it('referencia agrega por divisão COICOP', async () => {
		const [div] = await data('/api/leitura/referencia/2026-01');
		expect(div).toMatchObject({ codigo: '01', total: 173.45, n: 2 });
	});
	it('viagens devolve compras como JSON de verdade', async () => {
		const [v] = await data('/api/leitura/viagens');
		expect(v.compra_ids).toEqual(['c1']);
		expect(v.compras[0]).toMatchObject({ id: 'c1', loja: 'Mercado X', valor: 123.45 });
		expect(v.total_gasto).toBe(123.45);
	});
	it('entradas soma por mês', async () => {
		const [e] = await data('/api/leitura/entradas/2026');
		expect(e).toMatchObject({ ano: 2026, tipo_id: 'salario', jan: 9000, fev: 0, total: 9000 });
	});
	it('pendencias conta lançamentos sem regra', async () => {
		const [p] = await data('/api/leitura/pendencias/2026');
		expect(p).toMatchObject({ sem_regra_n: 2, sem_regra_v: 173.45, ano: '2026' });
	});
	it.each([
		'compra',
		'regras',
		'ferias',
		'importacoes',
		'faturas',
		'pessoas',
		'lugares',
		'vinculos',
		'contratos',
		'contas',
		'blocos',
		'entradas_transacoes',
		'tipos_entrada',
		'ai_subscriptions',
		'ai_pricing',
		'ai_summary',
		'sankey/2026-01',
		'bootstrap/2026-01'
	])('%s responde 200', async (c) => {
		expect((await get('/api/leitura/' + c)).status).toBe(200);
	});
	it('bootstrap traz as seções', async () => {
		const b = await data('/api/leitura/bootstrap/2026-01');
		expect(Object.keys(b.months)).toEqual(['2026-01']);
		expect(b.sankey['2026-01']).toHaveLength(1);
		expect(b.pendencias.sem_regra_n).toBe(2);
	});
	it('coleção desconhecida dá 404', async () => {
		expect((await get('/api/leitura/nada')).status).toBe(404);
	});
});

describe('escrita', () => {
	it('upsert_pessoa grava pessoa e apelidos', async () => {
		const r = await post({
			op: 'upsert_pessoa',
			id: 'bia',
			nome: 'Bia',
			aliases: ['B', ' bi ', '']
		});
		expect(r.status).toBe(200);
		const bia = (await data('/api/leitura/pessoas')).find((p: { id: string }) => p.id === 'bia');
		expect(bia).toMatchObject({ nome: 'Bia', visibilidade: 'familia', aliases: ['B', 'bi'] });
	});
	it('vincular_compra marca a pessoa nos lançamentos da compra', async () => {
		expect((await post({ op: 'vincular_compra', compra_id: 'c1', pessoa_id: 'ana' })).status).toBe(
			200
		);
		const [c] = await data('/api/leitura/compra');
		expect(c.pessoa_id).toBe('ana');
	});
	it('reclassificar_entrada só aceita categoria existente', async () => {
		const ok = await (
			await post({ op: 'reclassificar_entrada', transacao_id: 3, conta_codigo: 'salario' })
		).json();
		expect(ok).toEqual({ ok: true, count: 1 });
		const no = await (
			await post({ op: 'reclassificar_entrada', transacao_id: 3, conta_codigo: 'nao-existe' })
		).json();
		expect(no).toEqual({ ok: true, count: 0 });
	});
	it('criar_vinculo aparece em vinculos', async () => {
		await post({
			op: 'criar_vinculo',
			tipo: 'emprestimo',
			de_pessoa_id: 'eu',
			para_pessoa_id: 'ana',
			valor_centavos: 5000
		});
		const [v] = await data('/api/leitura/vinculos');
		expect(v).toMatchObject({
			para_pessoa_nome: 'Ana',
			valor_original: 50,
			saldo_devedor: 50,
			historico: []
		});
	});
	it('recusa operação desconhecida, campo de tipo errado, JSON ruim e corpo grande', async () => {
		expect((await post({ op: 'apagar_tudo' })).status).toBe(400);
		expect((await post({ op: 'upsert_lugar', nome: { x: 1 } })).status).toBe(400);
		expect((await post('{nao json')).status).toBe(400);
		expect((await post({ op: 'upsert_lugar', nome: 'x'.repeat(70 * 1024) })).status).toBe(413);
	});
});

describe('arquivos', () => {
	it('serve a rota e cai no 200.html para rota de SPA', async () => {
		expect(await (await get('/mes/', false)).text()).toBe('<p>mes</p>');
		expect(await (await get('/fluxo', false)).text()).toBe('<p>spa</p>');
	});
	it('não sai de build/', async () => {
		expect((await get('/../secret.txt', false)).status).toBe(404);
		expect((await get('/%2e%2e/secret.txt', false)).status).toBe(404);
	});
	it('manda CSP no HTML', async () => {
		expect((await get('/', false)).headers.get('content-security-policy')).toContain(
			"connect-src 'self'"
		);
	});
});

describe('Cloudflare Access', () => {
	const team = 'time.cloudflareaccess.com';
	const aud = 'aud-tag';
	async function setup() {
		const { publicKey, privateKey } = await generateKeyPair('RS256');
		const jwk = { ...(await exportJWK(publicKey)), kid: 'k1', alg: 'RS256' };
		const verify = accessVerifier({
			teamDomain: team,
			aud,
			allowedEmails: ['Eu@Exemplo.com'],
			jwks: createLocalJWKSet({ keys: [jwk] })
		});
		const sign = (claims: Record<string, unknown>, opts: { aud?: string; iss?: string } = {}) =>
			new SignJWT(claims)
				.setProtectedHeader({ alg: 'RS256', kid: 'k1' })
				.setIssuer(opts.iss ?? `https://${team}`)
				.setAudience(opts.aud ?? aud)
				.setIssuedAt()
				.setExpirationTime('5m')
				.sign(privateKey);
		const req = (token?: string) => ({
			headers: token ? { 'cf-access-jwt-assertion': token } : {}
		});
		return { verify, sign, req };
	}
	it('aceita token válido de e-mail permitido', async () => {
		const { verify, sign, req } = await setup();
		expect(await verify(req(await sign({ email: 'eu@exemplo.com' })))).toBe('eu@exemplo.com');
	});
	it('recusa e-mail fora da lista, outra audiência, outro emissor e sem token', async () => {
		const { verify, sign, req } = await setup();
		expect(await verify(req(await sign({ email: 'outro@exemplo.com' })))).toBeNull();
		expect(await verify(req(await sign({ email: 'eu@exemplo.com' }, { aud: 'outro' })))).toBeNull();
		expect(
			await verify(
				req(await sign({ email: 'eu@exemplo.com' }, { iss: 'https://x.cloudflareaccess.com' }))
			)
		).toBeNull();
		expect(await verify(req())).toBeNull();
	});
	it('não sobe sem configuração', () => {
		expect(() => accessVerifier({ teamDomain: '', aud: '', allowedEmails: [] })).toThrow();
	});
});
