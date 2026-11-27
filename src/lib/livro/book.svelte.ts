// @ts-nocheck
import { goto } from '$app/navigation';
import { caixaWrite } from '$lib/write/caixa';
import {
	CATEGORIAS,
	CONTAS,
	ESCOPOS,
	MESES,
	PENDENTE,
	PESSOAS,
	blocoDe,
	categoria,
	escopoNome,
	rotuloMes
} from './catalog';
import {
	blkC as blkCHelper,
	bx as bxHelper,
	dataCurta,
	formatReal,
	getThemeStyle,
	pts as ptsHelper,
	spark as sparkHelper,
	STYLE_BTN,
	STYLE_BTN_P,
	STYLE_CARD,
	STYLE_ROW_BTN
} from './format';
import {
	MOCK_CATS,
	MOCK_CV,
	MOCK_MN,
	MOCK_PEND,
	MOCK_PROJ,
	MOCK_ROWS,
	MOCK_RULES,
	MOCK_SER,
	MOCK_STORES,
	MOCK_TRIPS
} from './mock-book';
import {
	baselineMes,
	carregarAno,
	resumoDevem,
	visaoGeralAno,
	chavesDoAno,
	desenharSankey,
	fetchLedger,
	linhas,
	metas503020,
	resumoMes,
	soma,
	somaExtraordinario,
	somaPorCategoria,
	somaRecorrente,
	totalResumo
} from './ledger';
const PATH = {
	hoje: '/hoje/',
	visao: '/visao/',
	fluxo: '/fluxo/',
	mes: '/mes/',
	compras: '/compras/',
	entradas: '/entradas/',
	ia: '/ia/',
	viagens: '/viagens/',
	projetos: '/projetos/',
	mapa: '/mapa/',
	pessoas: '/pessoas/',
	pessoa: '/pessoa/',
	empregados: '/empregados/',
	custo: '/custo/',
	devem: '/devem/',
	ano: '/ano/',
	metas: '/metas/',
	importar: '/importar/',
	pendencias: '/pendencias/',
	regras: '/regras/',
	referencia: '/referencia/',
	conta: '/conta/',
	mobile: '/mobile/'
};

const ROUTE_CASA = new Set(['mapa', 'pessoas', 'pessoa', 'empregados', 'custo', 'devem']);
const LEDGER_ROUTES = new Set(['hoje', 'visao', 'fluxo', 'mes', 'compras', 'ano', 'metas']);

export class Book {
	setState(update, cb = undefined) {
		const patch = typeof update === 'function' ? update(this.state) : update;
		if (patch) Object.assign(this.state, patch);
		if (typeof cb === 'function') queueMicrotask(cb);
	}
	open(r) {
		const path = PATH[r];
		if (!path || typeof window === 'undefined') return;
		const here = window.location.pathname.replace(/\/$/, '');
		const dest = path.replace(/\/$/, '');
		if (here !== dest) void goto(path);
	}
	state = $state({
		auth: false,
		forgot: false,
		sent: false,
		loginErr: false,
		email: 'rafael@casa.exemplo',
		pwd: '',
		route: 'hoje',
		ledger: null,
		real: false,
		ledgerError: false,
		hist: [],
		dark: false,
		priv: false,
		per: 0,
		esc: 0,
		base: 0,
		panel: null,
		cmd: false,
		q: '',
		filt: null,
		sel: {},
		picker: null,
		toast: null,
		ds: 'normal',
		view: 'compras',
		cur: 0,
		quick: null,
		sMode: 'Mês',
		simple: false,
		cat: 'Restaurantes',
		mes: 10,
		trip: 'lisboa',
		diary: false,
		proj: 'cozinha',
		cut: 10,
		closeStep: -1,
		pessoaId: null,
		modalLm: null,
		modalAm: false,
		wzStep: -1,
		novaPessoaNome: '',
		collapsedDivisoes: [] as string[],
		visaoPerspectiva: 'pessoal' as 'pessoal' | 'casa' | 'consolidado',
		expired: false,
		cnt: 0,
		openRef: null,
		test: '',
		tc: {},
		importDone: false,
		feeFixed: false,
		rows: [...MOCK_ROWS],
		pend: [...MOCK_PEND],
		rules: [...MOCK_RULES],
		coi: {}
	});

	CATS = MOCK_CATS;
	CV = MOCK_CV;
	MN = MOCK_MN;
	SER = MOCK_SER;
	STORES = MOCK_STORES;
	TRIPS = MOCK_TRIPS;
	PROJ = MOCK_PROJ;

	R(v, c) {
		return formatReal(v, c);
	}
	pts(arr, w, h) {
		return ptsHelper(arr, w, h);
	}
	spark(v, seed) {
		return sparkHelper(v, seed);
	}
	blk(c) {
		if (this.state.ledger) return blocoDe(c);
		return c ? this.CATS[c] : null;
	}
	blkC(b) {
		return blkCHelper(b);
	}
	bx(b) {
		return bxHelper(b);
	}
	set(o) {
		this.setState(o);
	}
	nav(r) {
		this.setState({ route: r, hist: [], panel: null, filt: null, cnt: 0 }, () => this.count());
		this.open(r);
	}
	drill(r, x) {
		this.setState((s) => ({ route: r, hist: [...s.hist, s.route], panel: null, ...(x || {}) }));
		this.open(r);
	}
	toggleDivisao(codigo: string) {
		const arr = this.state.collapsedDivisoes || [];
		const exists = arr.includes(codigo);
		this.setState({
			collapsedDivisoes: exists ? arr.filter((x) => x !== codigo) : [...arr, codigo]
		});
	}
	expandAllDivisoes() {
		this.setState({ collapsedDivisoes: [] });
	}
	collapseAllDivisoes(allCodes: string[]) {
		this.setState({ collapsedDivisoes: allCodes });
	}
	setVisaoPerspectiva(p: 'pessoal' | 'casa' | 'consolidado') {
		this.setState({ visaoPerspectiva: p });
	}
	title(r) {
		return {
			hoje: 'Hoje',
			visao: 'Visão geral do ano',
			fluxo: 'Fluxo de caixa',
			mes: 'Mês e categorias',
			compras: 'Compras e lançamentos',
			entradas: 'Entradas e receitas',
			ia: 'Assinaturas & APIs de IA',
			viagens: 'Viagens e férias',
			projetos: 'Projetos',
			mapa: 'Mapa da casa',
			pessoas: 'Pessoas',
			pessoa: 'Pessoa',
			empregados: 'Empregados',
			custo: 'Custo e pagamentos',
			devem: 'Quem deve a quem',
			ano: 'Ano e projeção',
			metas: '50/30/20 e metas',
			importar: 'Importar',
			pendencias: 'Pendências',
			regras: 'Regras',
			referencia: 'Referência ONU',
			conta: 'Conta',
			mobile: 'Celular'
		}[r];
	}
	toast(m, u) {
		clearTimeout(this._t);
		this.setState({ toast: { m, u } });
		this._t = setTimeout(() => this.setState({ toast: null }), 5000);
	}
	count() {
		const t0 = performance.now();
		const f = (t) => {
			const p = Math.min(1, (t - t0) / 900);
			this.setState({ cnt: 1 - Math.pow(1 - p, 3) });
			if (p < 1) requestAnimationFrame(f);
		};
		requestAnimationFrame(f);
	}
	mountKeys() {
		this._k = (e) => {
			if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
				e.preventDefault();
				this.setState({ cmd: true, q: '' });
			} else if (e.key === 'Escape') this.setState({ cmd: false, picker: null, panel: null });
			else if (
				this.state.route === 'compras' &&
				this.state.auth &&
				!this.state.cmd &&
				(e.key === 'ArrowDown' || e.key === 'ArrowUp') &&
				e.target.tagName !== 'INPUT' &&
				e.target.tagName !== 'SELECT'
			) {
				e.preventDefault();
				const n = this.visRows().length;
				this.setState((s) => ({
					cur: Math.max(0, Math.min(n - 1, s.cur + (e.key === 'ArrowDown' ? 1 : -1)))
				}));
			} else if (
				e.key === 'Enter' &&
				this.state.route === 'compras' &&
				!this.state.panel &&
				!this.state.cmd &&
				e.target.tagName === 'BODY'
			) {
				const r = this.visRows()[this.state.cur];
				if (r) this.setState({ panel: r.id });
			}
		};
		document.addEventListener('keydown', this._k);
	}
	unmountKeys() {
		document.removeEventListener('keydown', this._k);
	}
	async reloadLedger() {
		await this.loadLedger(this.state.email);
	}
	openPessoa(id) {
		this.setState({ pessoaId: id, route: 'pessoa', hist: [...this.state.hist, this.state.route] });
		this.open('pessoa');
	}
	async gravarPessoa(payload) {
		try {
			await caixaWrite({ op: 'upsert_pessoa', ...payload });
			await this.reloadLedger();
			this.set({ modalAm: false });
			this.toast('Pessoa registrada no livro');
		} catch {
			this.toast('Não foi possível gravar agora');
		}
	}
	async gravarVinculo(payload) {
		try {
			await caixaWrite({ op: 'criar_vinculo', ...payload });
			await this.reloadLedger();
			this.set({ modalLm: null });
			this.toast('Registro criado');
		} catch {
			this.toast('Não foi possível gravar agora');
		}
	}
	async gravarLugar(payload) {
		try {
			await caixaWrite({ op: 'upsert_lugar', ...payload });
			await this.reloadLedger();
			this.toast('Lugar salvo');
		} catch {
			this.toast('Não foi possível gravar agora');
		}
	}
	async loadLedger(email) {
		try {
			const ledger = await fetchLedger();
			if (!ledger) {
				this.setState({ real: true, ledgerError: true, ledger: null });
				return;
			}
			this.setState({
				ledger,
				real: true,
				ledgerError: false,
				email: email || '',
				cat: ''
			});
		} catch {
			this.setState({ real: true, ledgerError: true, ledger: null });
		}
	}
	escopoAtual() {
		if (!this.state.ledger) return null;
		return ESCOPOS[this.state.esc % ESCOPOS.length]?.id ?? null;
	}
	chavesAtivas() {
		const L = this.state.ledger;
		if (!L) return [];
		if (this.state.per === 2) return chavesDoAno(L.year, L.month);
		if (this.state.route === 'mes') {
			const mes = Math.min(Math.max(this.state.mes + 1, 1), L.month);
			return [L.year + '-' + String(mes).padStart(2, '0')];
		}
		if (this.state.per === 1) {
			const d = new Date(L.year, L.month - 2, 1);
			return [d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')];
		}
		return [L.year + '-' + String(L.month).padStart(2, '0')];
	}
	chavesAnteriores() {
		const keys = this.chavesAtivas();
		if (keys.length !== 1) return [];
		const [y, m] = keys[0].split('-').map(Number);
		const d = new Date(y, m - 2, 1);
		return [d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')];
	}
	tableRows() {
		const s = this.state;
		if (!s.ledger) return s.rows;
		const keys = this.chavesAtivas();
		const esc = this.escopoAtual();
		return s.ledger.compras
			.filter((c) => {
				const data = String(c.data || '');
				if (!keys.some((k) => data.startsWith(k))) return false;
				if (esc && c.escopo !== esc) return false;
				return true;
			})
			.map((c) => {
				const pessoa = c.pessoa_id && s.ledger.pessoas.find((p) => p.id === c.pessoa_id);
				const pn = pessoa ? pessoa.apelido || pessoa.nome : null;
				return {
					id: c.id,
					date: dataCurta(c.data),
					loja: c.loja,
					titulo: c.titulo || '',
					cat: categoria(c.categoria_id).nome,
					parc: (c.parcelas_pagas ?? 1) + '/' + (c.parcelas ?? 1),
					total: (c.valor_total_centavos || 0) / 100,
					pago: ((c.valor_pago_centavos ?? c.valor_total_centavos) || 0) / 100,
					estornada: !!c.estornada,
					orig: escopoNome(c.escopo),
					extra: false,
					sub: false,
					pendente: PENDENTE.has(c.categoria_id || ''),
					pessoa: pn,
					hasP: !!pn
				};
			})
			.slice(0, 400);
	}
	visRows() {
		const s = this.state;
		return this.tableRows().filter((r) => {
			if (s.filt && s.filt.cat && r.cat !== s.filt.cat) return false;
			if (s.quick === 'pend') return r.pendente || !r.cat;
			if (s.quick === 'sub') return r.sub;
			if (s.quick === 'parc') return r.parc.split('/')[1] !== '1';
			if (s.quick === 'extra') return r.extra;
			return true;
		});
	}
	cats() {
		if (this.state.ledger) {
			const atual = somaPorCategoria(
				linhas(this.state.ledger, this.chavesAtivas(), this.escopoAtual())
			);
			const antes = somaPorCategoria(
				linhas(this.state.ledger, this.chavesAnteriores(), this.escopoAtual())
			);
			return [...atual.entries()]
				.filter(([, v]) => v > 0)
				.map(([id, v]) => {
					const cat = categoria(id);
					const p = antes.get(id) || v;
					return { n: cat.nome, v, p, b: cat.bloco || null };
				})
				.sort((a, b) => b.v - a.v);
		}
		return this.CV.map(([n, v, p]) => ({ n, v, p, b: this.CATS[n] }));
	}
	sankey() {
		if (this.state.ledger) {
			const keys = this.chavesAtivas();
			const links = keys.flatMap((k) => this.state.ledger.sankey?.[k] ?? []);
			return desenharSankey(
				links,
				(v) => this.R(v, true),
				(nome) => this.drill('compras', { filt: { cat: nome, label: nome }, quick: null, cur: 0 })
			);
		}
		const m = this.state.sMode,
			mul = m === 'Ano' ? 10 : 1,
			ideal = m === 'Mês ideal';
		const S = ideal
			? [
					['Salário do Rafael', 11.4],
					['Salário da Mariana', 7.08],
					['Freela', 0.6]
				]
			: [
					['Salário do Rafael', 11],
					['Salário da Mariana', 7],
					['Freela', 0.6],
					['Uso de reservas', 0.48]
				];
		const tot = S.reduce((a, b) => a + b[1], 0),
			B = ideal ? { N: tot * 0.5, D: tot * 0.3, F: tot * 0.2 } : { N: 10.9, D: 4.08, F: 4.1 },
			pes = ideal ? 2 : 2.4,
			inv = 2.9,
			casa = tot - pes - inv;
		const base = {
				N: [
					['Moradia', 5.2],
					['Mercado', 2.64],
					['Saúde', 1.21],
					['Transporte', 1.05],
					['Educação', 0.8]
				],
				D: [
					['Restaurantes', 1.71],
					['Lazer', 1.16],
					['Compras', 0.65],
					['Assinaturas', 0.56]
				],
				F: [
					['Previdência', 1.8],
					['Reserva', 1.5],
					['Poupança da Olivia', 0.8]
				]
			},
			bb = { N: 10.9, D: 4.08, F: 4.1 };
		const bn = { N: 'Necessidade', D: 'Desejo', F: 'Futuro' };
		const nodes = [];
		const add = (id, l, c, v, col) => nodes.push({ id, l, c, v, col });
		S.forEach((s, i) =>
			add('s' + i, s[0], 0, s[1], s[0] === 'Uso de reservas' ? 'var(--terra)' : 'var(--moss)')
		);
		add('casa', 'Casa', 1, casa, 'var(--ink)');
		add('pes', 'Pessoal', 1, pes, 'var(--ink)');
		add('inv', 'Investimentos', 1, inv, 'var(--ink)');
		['N', 'D', 'F'].forEach((k) =>
			add(k, bn[k] + ' · ' + { N: 50, D: 30, F: 20 }[k], 2, B[k], 'var(--' + k + ')')
		);
		['N', 'D', 'F'].forEach((k) =>
			base[k].forEach(([n, v]) => add('c' + n, n, 3, (v * B[k]) / bb[k], 'var(--' + k + ')'))
		);
		const L = [];
		S.forEach((s, i) =>
			['casa', 'pes', 'inv'].forEach((p) =>
				L.push([
					's' + i,
					p,
					(s[1] * nodes.find((x) => x.id === p).v) / tot,
					nodes.find((x) => x.id === p).col === 'x' ? 0 : 'var(--moss)'
				])
			)
		);
		L.push(
			['casa', 'N', B.N],
			['casa', 'D', B.D - pes],
			['casa', 'F', B.F - inv],
			['pes', 'D', pes],
			['inv', 'F', inv]
		);
		['N', 'D', 'F'].forEach((k) =>
			base[k].forEach(([n, v]) => L.push([k, 'c' + n, (v * B[k]) / bb[k]]))
		);
		const H = 500,
			gap = 12,
			X = [10, 260, 510, 760];
		let kk = 1e9;
		for (let c = 0; c < 4; c++) {
			const ns = nodes.filter((n) => n.c === c);
			kk = Math.min(kk, (H - gap * (ns.length - 1)) / tot);
		}
		for (let c = 0; c < 4; c++) {
			const ns = nodes.filter((n) => n.c === c);
			const th = tot * kk + gap * (ns.length - 1);
			let y = (H - th) / 2 + 10;
			ns.forEach((n) => {
				n.h = n.v * kk;
				n.y = y;
				n.x = X[c];
				y += n.h + gap;
				n.o = 0;
				n.i = 0;
			});
		}
		const by = (id) => nodes.find((n) => n.id === id);
		const links = L.filter((l) => l[2] > 0.001).map((l) => {
			const a = by(l[0]),
				b = by(l[1]),
				w = l[2] * kk,
				y0 = a.y + a.o + w / 2,
				y1 = b.y + b.i + w / 2;
			a.o += w;
			b.i += w;
			const x0 = a.x + 14,
				x1 = b.x,
				xm = (x0 + x1) / 2;
			return {
				d: `M${x0} ${y0} C${xm} ${y0} ${xm} ${y1} ${x1} ${y1}`,
				w: w.toFixed(1),
				c: l[3] || by(l[1]).col
			};
		});
		const self = this;
		return {
			reserva: !ideal,
			links,
			nodes: nodes.map((n) => ({
				x: n.x,
				y: n.y,
				h: n.h,
				c: n.col,
				tx: n.x + 20,
				ty: n.y + n.h / 2 + 4,
				t: n.l + ' · ' + self.R(n.v * 1000 * mul),
				go: () => {
					const isCat = n.c === 3;
					self.drill('compras', {
						filt: { cat: isCat ? n.l : null, label: n.l },
						quick: null,
						cur: 0
					});
				}
			}))
		};
	}
	renderVals() {
		const s = this.state,
			self = this,
			R = (v) => this.R(v),
			c2 = (v) => this.R(v, true);
		const route = s.route;
		const dark = s.dark;
		const themeStyle = getThemeStyle(dark);
		const card = STYLE_CARD;
		const btn = STYLE_BTN;
		const btnP = STYLE_BTN_P;
		const rowBtn = STYLE_ROW_BTN;
		const bl = s.priv ? 'filter:blur(7px);' : '';
		const MOM = [
			{ id: 'hoje', label: 'Hoje', ic: 'ph ph-sun-horizon', subs: [['hoje', 'Visão geral']] },
			{
				id: 'entender',
				label: 'Entender',
				ic: 'ph ph-magnifying-glass',
				subs: [
					['visao', 'Visão geral do ano'],
					['fluxo', 'Fluxo de caixa'],
					['mes', 'Mês e categorias'],
					['compras', 'Compras e lançamentos'],
					['entradas', 'Entradas contábeis']
				]
			},
			{
				id: 'viver',
				label: 'Vida & Compromissos',
				ic: 'ph ph-airplane-tilt',
				subs: [
					['viagens', 'Viagens e férias'],
					['ia', 'Assinaturas & IA'],
					['metas', '50/30/20 e metas']
				]
			},
			{
				id: 'casa',
				label: 'Nossa casa',
				ic: 'ph ph-house-line',
				subs: [
					['mapa', 'Mapa da casa'],
					['pessoas', 'Pessoas'],
					['custo', 'Custo e pagamentos'],
					['devem', 'Quem deve a quem']
				]
			},
			{
				id: 'cuidar',
				label: 'Operação',
				ic: 'ph ph-wrench',
				subs: [
					['pendencias', 'Pendências'],
					['importar', 'Importar'],
					['regras', 'Regras'],
					['referencia', 'Referência ONU']
				]
			}
		];
		const momOf =
			MOM.find((m) => m.subs.some((x) => x[0] === route)) ??
			(ROUTE_CASA.has(route) ? MOM.find((m) => m.id === 'casa') : undefined) ??
			(route === 'ano' ? MOM.find((m) => m.id === 'entender') : undefined) ??
			(route === 'projetos' ? MOM.find((m) => m.id === 'viver') : undefined);
		const fecharMesIdx = s.ledger ? (s.ledger.month > 1 ? s.ledger.month - 2 : 11) : 9;
		const fecharMesNome = MESES[fecharMesIdx] ?? 'mês';
		const fecharMesLabel = `Fechar ${fecharMesNome}`;
		const nav = MOM.map((m, i) => ({
			label: m.label,
			ic: m.ic,
			n: i + 1,
			bg: momOf === m ? 'var(--sf2)' : 'transparent',
			fw: momOf === m ? 600 : 500,
			open: momOf === m && m.subs.length > 1,
			go: () => this.nav(m.subs[0][0]),
			subs: m.subs.map((x) => ({
				label: x[1],
				col: x[0] === route ? 'var(--ink)' : 'var(--mut)',
				fw: x[0] === route ? 600 : 400,
				go: () => this.nav(x[0])
			}))
		}));
		const flag = (k) => route === k;
		const flags = {};
		[
			'hoje',
			'visao',
			'fluxo',
			'mes',
			'compras',
			'entradas',
			'ia',
			'viagens',
			'projetos',
			'mapa',
			'pessoas',
			'pessoa',
			'empregados',
			'custo',
			'devem',
			'ano',
			'metas',
			'importar',
			'pendencias',
			'regras',
			'referencia',
			'conta',
			'mobile'
		].forEach((k) => (flags[k] = flag(k)));
		const agora = new Date();
		const PER = s.ledger
			? [
					rotuloMes(s.ledger.year, s.ledger.month),
					rotuloMes(s.ledger.year, Math.max(1, s.ledger.month - 1)),
					'Ano ' + s.ledger.year
				]
			: ['Novembro 2026', 'Outubro 2026', 'Ano 2026'];
		const ESC = s.ledger
			? ESCOPOS.map((e) => e.nome)
			: ['Casa e Pessoal', 'Casa', 'Pessoal', 'Família', 'Investimentos'];
		const hr = agora.getHours(),
			quem = s.ledger ? 'Daniel' : 'Rafael',
			greet = (hr < 12 ? 'Bom dia, ' : hr < 18 ? 'Boa tarde, ' : 'Boa noite, ') + quem;
		const linhasAtivas = s.ledger ? linhas(s.ledger, this.chavesAtivas(), this.escopoAtual()) : [];
		const totalRec = s.ledger ? somaRecorrente(linhasAtivas) : 14980;
		const totalExtra = s.ledger ? somaExtraordinario(linhasAtivas) : 0;
		const totalReal = totalRec;
		const spentNow = s.ledger ? c2(totalRec * (s.cnt || 0)) : R(14980 * (s.cnt || 0));
		let extraNote = '';
		let headline = 'Novembro está 6% acima do ritmo normal; faltam 7 dias.';
		let paceNote = 'ritmo normal até hoje: R$ 14.130';
		let projectionNote = 'Projeção de fechamento: R$ 19.610 (ritmo: R$ 18.500)';
		let barW = (14980 / 19610) * 100 * (s.cnt || 0) + '%';
		let baseW = (14130 / 19610) * 100 + '%';
		if (s.ledgerError) headline = 'Não foi possível ler o livro agora.';
		else if (s.ledger) {
			const dia = agora.getDate();
			const dias = new Date(agora.getFullYear(), agora.getMonth() + 1, 0).getDate();
			const faltam = Math.max(0, dias - dia);
			const keys = this.chavesAtivas();
			const base = baselineMes(s.ledger);
			const esc = this.escopoAtual();
			const baseTot =
				esc === 'casa'
					? base.casa
					: esc === 'pessoal'
						? base.pessoal
						: esc === 'familia'
							? base.familia
							: totalResumo(base);
			const projecao = dia > 0 ? (totalRec / dia) * dias : totalRec;
			const nomeMes = rotuloMes(Number(keys[0].slice(0, 4)), Number(keys[0].slice(5))).split(
				' '
			)[0];
			if (keys.length === 1 && s.per === 0 && baseTot > 0) {
				const pct = Math.round((totalRec / baseTot - 1) * 100);
				const dir = pct > 0 ? 'acima' : pct < 0 ? 'abaixo' : 'na linha';
				headline =
					nomeMes +
					' está ' +
					Math.abs(pct) +
					'% ' +
					dir +
					' da mediana de 12 meses; faltam ' +
					faltam +
					' dias.';
			} else if (keys.length === 1)
				headline = 'Custo de vida de ' + rotuloMes(s.ledger.year, Number(keys[0].slice(5))) + '.';
			else headline = 'Custo de vida de ' + s.ledger.year + '.';
			paceNote = baseTot
				? 'Baseline (mediana de 12 meses): ' + c2(baseTot)
				: 'sem meses fechados para mediana';
			if (totalExtra > 0) extraNote = '+ ' + c2(totalExtra) + ' extraordinário (fora da baseline)';
			projectionNote = 'Projeção pelo ritmo deste mês: ' + c2(projecao);
			const topo = Math.max(totalRec, projecao, baseTot, 1);
			barW = (totalRec / topo) * 100 * (s.cnt || 0) + '%';
			baseW = (Math.min(baseTot, topo) / topo) * 100 + '%';
		}
		const scopes = s.ledger
			? ['casa', 'pessoal', 'familia'].map((id) => {
					const serie = chavesDoAno(s.ledger.year, s.ledger.month).map((k) =>
						soma(linhas(s.ledger, [k], id))
					);
					const v = soma(linhas(s.ledger, this.chavesAtivas(), id));
					return {
						n: escopoNome(id),
						v: c2(v),
						pts: this.pts(serie.length > 1 ? serie : [0, v], 100, 28)
					};
				})
			: [
					['Casa', 12580, [11, 12, 11.5, 12.6, 12, 12.8, 12.2, 13.5, 12, 12.4, 12.1, 12.6]],
					['Pessoal', 2400, [2, 2.4, 2.1, 2.2, 2.6, 2.3, 2.5, 2.2, 2.4, 2.1, 2.3, 2.4]],
					['Família', 900, [0.6, 0.9, 0.7, 0.9, 1, 0.8, 0.9, 1.1, 0.8, 0.9, 0.9, 0.9]],
					['Investimentos', 2900, [2.5, 2.9, 2.7, 3, 2.8, 2.9, 3.1, 2.8, 2.9, 2.9, 2.7, 2.9]]
				].map(([n, v, a]) => ({ n, v: R(v), pts: this.pts(a, 100, 28) }));
		const cl = this.cats();
		const topCats = cl
			.slice()
			.sort((a, b) => b.v - a.v)
			.slice(0, 5)
			.map((c) => {
				const d = Math.round((c.v / c.p - 1) * 100);
				return {
					n: c.n,
					v: s.ledger ? c2(c.v) : R(c.v),
					d: (d > 0 ? '+' : d < 0 ? '−' : '') + Math.abs(d) + '%',
					col: d > 5 ? 'var(--terra)' : d < -5 ? 'var(--moss)' : 'var(--mut)',
					go: () => this.drill('mes', { cat: c.n })
				};
			});
		const pendRows = s.ledger ? [] : s.pend;
		const pen = s.ledger?.pendencias;
		const pendN = s.ledger
			? (pen?.sem_regra_n ?? 0) + (pen?.faturas_n ?? 0) + (pen?.transferencias_n ?? 0)
			: pendRows.length;
		const pendTot = s.ledger
			? c2(pen?.sem_regra_v ?? 0)
			: c2(pendRows.reduce((a, p) => a + (p.total ?? p.v ?? 0), 0));
		const pendSummary = pen
			? [
					{
						title: 'Despesas sem regra',
						n: pen.sem_regra_n,
						detail: pen.sem_regra_v ? c2(pen.sem_regra_v) + ' em aberto' : ''
					},
					{
						title: 'Faturas sem PDF',
						n: pen.faturas_n,
						detail: s.ledger.faturasPendentes?.length
							? s.ledger.faturasPendentes
									.slice(0, 3)
									.map((f) => f.competencia)
									.join(', ') + (s.ledger.faturasPendentes.length > 3 ? '…' : '')
							: ''
					},
					{ title: 'Transferências sem par', n: pen.transferencias_n, detail: 'categoria interna' }
				]
			: [];
		// fluxo
		const sk = this.sankey();
		const sTabs = ['Ano', 'Mês', 'Mês ideal'].map((t) => ({
			l: t,
			bg: s.sMode === t ? 'var(--sun)' : 'transparent',
			fw: s.sMode === t ? 600 : 400,
			go: () => this.set({ sMode: t })
		}));
		const stack = ['N', 'D', 'F'].map((k) => {
			const bc = cl.filter((c) => c.b === k);
			const nm = { N: 'Necessidade', D: 'Desejo', F: 'Futuro' }[k];
			const items =
				!s.ledger && k === 'F'
					? [
							['Previdência', 1800],
							['Reserva', 1500],
							['Poupança da Olivia', 800]
						]
					: bc.map((c) => [c.n, c.v]);
			const t = items.reduce((a, b) => a + b[1], 0);
			return {
				n: s.ledger ? nm : nm + ' · ' + { N: 50, D: 30, F: 20 }[k],
				v: s.ledger ? c2(t) : R(t),
				c: 'var(--' + k + ')',
				segs: items.map(([n, v], i) => ({
					n,
					w: t ? (v / t) * 100 + '%' : '0%',
					o: 1 - i * 0.15,
					go: () => this.drill('compras', { filt: { cat: n, label: n }, cur: 0 })
				}))
			};
		});
		// mes
		const fac = s.ledger ? 1 : this.SER[s.mes] / 19610,
			months = this.MN.slice(0, s.ledger ? s.ledger.month : 11).map((l, i) => ({
				l,
				bg: s.mes === i ? 'var(--sun)' : 'var(--sf)',
				col: s.mes === i ? 'var(--onsun)' : 'var(--ink)',
				go: () => this.set({ mes: i })
			}));
		const tot = cl.reduce((a, c) => a + c.v * fac, 0),
			mx = Math.max(1, ...cl.map((c) => c.v));
		const serieDe = (nome) => {
			if (!s.ledger) return null;
			const id = (CATEGORIAS.find((c) => c.nome === nome) || {}).id;
			return chavesDoAno(s.ledger.year, s.ledger.month).map(
				(k) => somaPorCategoria(linhas(s.ledger, [k], this.escopoAtual())).get(id) || 0
			);
		};
		const catRows = cl.map((c) => {
			const d = Math.round((c.v / c.p - 1) * 100);
			const serie = serieDe(c.n);
			return {
				n: c.n,
				b: c.b,
				bx: this.bx(c.b),
				col: this.blkC(c.b),
				w: (c.v / mx) * 100 + '%',
				v: s.ledger ? c2(c.v * fac) : R(c.v * fac),
				pct: tot ? Math.round(((c.v * fac) / tot) * 100) + '%' : '0%',
				d: (d > 0 ? '+' : d < 0 ? '−' : '') + Math.abs(d) + '%',
				dc: d > 5 ? 'var(--terra)' : d < -5 ? 'var(--moss)' : 'var(--mut)',
				pts: this.pts(serie && serie.length > 1 ? serie : this.spark(c.v, c.n.length || 1), 70, 22),
				bg: s.cat === c.n ? 'var(--sf2)' : 'transparent',
				go: () => this.set({ cat: c.n })
			};
		});
		const cc = cl.find((c) => c.n === s.cat) ||
			cl[0] || { n: 'Sem categorias neste período', v: 0, p: 1, b: null };
		const serieCc = s.ledger ? serieDe(cc.n) : null;
		const pico = Math.max(1, ...(serieCc || [cc.v || 1]));
		const cd = {
			n: cc.n,
			b: cc.b,
			bx: this.bx(cc.b),
			bn: { N: 'Necessidade', D: 'Desejo', F: 'Futuro' }[cc.b] || '',
			bars: (serieCc || this.spark(cc.v, (cc.n || 'x').length)).map((v, i) => ({
				h: (v / (pico * 1.05 || 1)) * 100 + '%',
				l: (this.MN[i] || '?')[0],
				c: i === (serieCc ? serieCc.length - 1 : 11) ? 'var(--ink)' : this.blkC(cc.b)
			})),
			stores: s.ledger
				? [
						...this.tableRows().reduce((map, r) => {
							if (r.cat !== cc.n) return map;
							map.set(r.loja, (map.get(r.loja) || 0) + r.total);
							return map;
						}, new Map())
					]
						.sort((a, b) => b[1] - a[1])
						.slice(0, 5)
						.map(([n, v]) => ({ n, v: c2(v) }))
				: (this.STORES[cc.n] || []).map(([n, v]) => ({ n, v: R(v) })),
			go: () => this.drill('compras', { filt: { cat: cc.n, label: cc.n }, cur: 0 })
		};
		// compras
		const vis = this.visRows();
		const chipS = (cat) =>
			'display:inline-flex;gap:6px;align-items:center;border:1px ' +
			(cat ? 'solid' : 'dashed') +
			' ' +
			(cat ? 'var(--ln)' : 'var(--terra)') +
			';background:var(--sf2);color:var(--ink);padding:2px 8px 2px 3px;border-radius:999px;font-size:12px;cursor:pointer;';
		const rowOf = (r) => {
			const b = this.blk(r.cat);
			return {
				...r,
				b: b || '?',
				bx: this.bx(b),
				cat: r.cat || 'Sem classificar',
				lock: !!r.lock,
				chipS: chipS(r.cat),
				trip: !!r.trip
			};
		};
		const rows = vis.map((r, i) => ({
			...rowOf(r),
			total: c2(r.total),
			pago: c2(r.pago),
			ext: r.extra ? '◆ extraordinária' : '',
			orig: r.orig,
			chk: !!s.sel[r.id],
			bg: i === s.cur ? 'var(--sf2)' : 'transparent',
			open: () => this.set({ panel: r.id, cur: i }),
			chip: (ev) => {
				ev.stopPropagation();
				this.set({ picker: r.id });
			},
			pick: (ev) => {
				ev.stopPropagation();
				this.setState((st) => ({ sel: { ...st.sel, [r.id]: !st.sel[r.id] } }));
			}
		}));
		const lanc = vis.map((r) => ({
			date: r.date,
			loja: r.loja,
			conta:
				r.orig === 'Cartão'
					? 'Itaú Visa'
					: r.orig === 'Boleto'
						? 'Itaú Conta'
						: r.orig === 'Pix'
							? 'Itaú Conta'
							: 'Nubank',
			fat: r.orig === 'Cartão' ? 'Out/26' : '—',
			v: c2(-r.pago),
			col: 'var(--terra)',
			st: r.cat ? 'Classificada' : 'Pendente de revisão',
			open: () => this.set({ panel: r.id })
		}));
		const selN = Object.values(s.sel).filter(Boolean).length;
		const vTabs = [
			['compras', 'Compras'],
			['lanc', 'Lançamentos']
		].map(([k, l]) => ({
			l,
			bg: s.view === k ? 'var(--sun)' : 'transparent',
			fw: s.view === k ? 600 : 400,
			go: () => this.set({ view: k })
		}));
		const quick = [
			['pend', 'Sem classificação'],
			['sub', 'Assinaturas'],
			['parc', 'Parceladas'],
			['extra', 'Extraordinárias']
		].map(([k, l]) => ({
			l,
			bg: s.quick === k ? 'var(--sun)' : 'var(--sf)',
			go: () => this.set({ quick: s.quick === k ? null : k })
		}));
		const dsTabs = [
			['normal', 'normal'],
			['loading', 'carregando'],
			['empty', 'vazio'],
			['error', 'erro']
		].map(([k, l]) => ({
			l,
			bg: s.ds === k ? 'var(--sf2)' : 'transparent',
			go: () => this.set({ ds: k })
		}));
		const catNames = Object.keys(this.CATS);
		const pr =
			this.tableRows().find((r) => r.id === s.panel) ||
			s.pend
				.map((p) => ({
					id: p.id,
					date: p.date,
					loja: p.loja,
					titulo: p.titulo,
					cat: null,
					parc: '1/1',
					total: p.v,
					pago: p.v,
					orig: 'Cartão'
				}))
				.find((r) => r.id === s.panel);
		const pn = pr
			? {
					...rowOf(pr),
					total: c2(pr.total),
					pago: c2(pr.pago),
					conta: pr.orig === 'Cartão' ? 'Itaú Visa · fatura out/26' : 'Itaú Conta',
					chip: () => this.set({ picker: pr.id }),
					paraQuem: pr.pessoa || 'ninguém ainda',
					openLm: () => this.openModalLm(pr.id)
				}
			: {};
		// viagens
		const doy = (d, m) => {
			const dm = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
			let n = d;
			for (let i = 0; i < m - 1; i++) n += dm[i];
			return (n / 365) * 100;
		};
		const bar = (a, b, lab, kind, t, go) => ({
			l: doy(a[0], a[1]) + '%',
			w: doy(b[0], b[1]) - doy(a[0], a[1]) + '%',
			t,
			l2: lab,
			bg: kind === 'f' ? 'var(--sun)' : kind === 't' ? 'var(--N)' : 'transparent',
			fg: kind === 'f' ? 'var(--onsun)' : kind === 't' ? 'var(--bg)' : 'var(--ink)',
			bd: kind === 'w' ? '2px dashed var(--mut)' : '0',
			go
		});
		const tl = [
			bar([6, 1], [25, 1], 'Férias', 'f', 0, () => {}),
			bar([28, 3], [6, 4], 'Férias · Páscoa', 'f', 0, () => {}),
			bar([6, 7], [25, 7], 'Férias', 'f', 0, () => {}),
			bar([21, 12], [30, 12], 'Férias (plan.)', 'f', 0, () => {}),
			bar([28, 3], [5, 4], '✈ Gramado', 't', 40, () => this.set({ trip: 'gramado' })),
			bar([4, 7], [24, 7], '✈ Lisboa e Porto', 't', 40, () => this.set({ trip: 'lisboa' })),
			bar([14, 9], [17, 9], '💼', 'w', 40, () => this.set({ trip: 'trabalho' }))
		];
		const periods = [
			{
				n: '2025/26',
				d: '30 de 30',
				items: [
					{ l: '06–25 jul · 20 dias', s: '✈ Lisboa' },
					{ l: '21–30 dez · 10 dias', s: 'sem viagem' }
				]
			},
			{
				n: '2024/25',
				d: '30 de 30',
				items: [
					{ l: '06–25 jan · 20 dias', s: 'sem viagem' },
					{ l: '28 mar–06 abr · 10 dias', s: '✈ Gramado' }
				]
			}
		];
		const T = this.TRIPS[s.trip];
		const isW = s.trip === 'trabalho';
		const comp = T.c.map((c, i) => {
			const on = s.tc[s.trip + i] !== undefined ? s.tc[s.trip + i] : c[6];
			return { d: c[0], n: c[1], note: c[2], tipo: c[3], val: c[4], pago: c[5], on, orig: c[6], i };
		});
		const mk = comp.filter((c) => c.on);
		const totT = isW ? 0 : mk.reduce((a, c) => a + c.val, 0),
			pagoT = mk.reduce((a, c) => a + c.pago, 0);
		const tipos = {};
		mk.forEach((c) => (tipos[c.tipo] = (tipos[c.tipo] || 0) + c.val));
		const tr = {
			nome: T.nome,
			dest: T.dest,
			datas: T.datas,
			nota: T.nota,
			total: isW ? 'R$ 0 (empresa paga)' : R(totT),
			dia: isW ? '—' : R(totT / T.dias),
			pago: isW ? '—' : R(pagoT),
			apagar: isW ? '—' : R(totT - pagoT),
			tipos: isW
				? []
				: Object.entries(tipos).map(([n, v]) => ({ n, v: R(v), w: (v / totT) * 100 + '%' })),
			compras: comp.map((c) => ({
				d: c.d,
				n: c.n,
				note: c.note,
				v: R(c.val),
				on: c.on,
				bg: !c.on && !isW ? 'var(--terraBg)' : 'transparent',
				tog: () => this.setState((st) => ({ tc: { ...st.tc, [s.trip + c.i]: !c.on } }))
			}))
		};
		const tripTabs = [
			['lisboa', 'Lisboa'],
			['gramado', 'Gramado'],
			['trabalho', 'São Paulo 💼']
		].map(([k, l]) => ({
			l,
			bg: s.trip === k ? 'var(--sun)' : 'var(--sf)',
			go: () => this.set({ trip: k })
		}));
		if (s.ledger) {
			const vgs = s.ledger.viagens || [];
			const tripId = (() => {
				const hit = vgs.find((v) => v.chave === s.trip || String(v.id) === s.trip);
				return hit
					? hit.chave || String(hit.id)
					: vgs[0]?.chave || (vgs[0] ? String(vgs[0].id) : s.trip);
			})();
			const vNow = vgs.find((v) => v.chave === tripId || String(v.id) === tripId) || vgs[0];
			const comprasPorId = new Map(s.ledger.compras.map((c) => [c.id, c]));
			const mkViagem = (v) => {
				if (!v) return tr;
				const ids = v.compra_ids || [];
				const comp = ids
					.map((id) => comprasPorId.get(id))
					.filter(Boolean)
					.map((c) => ({
						d: dataCurta(c.data),
						n: c.loja,
						note: c.titulo || '',
						val: (c.valor_total_centavos || 0) / 100,
						pago: ((c.valor_pago_centavos ?? c.valor_total_centavos) || 0) / 100,
						on: !c.estornada
					}));
				const isW = !!v.empresa;
				const mk = comp.filter((c) => c.on);
				const totT = isW ? 0 : mk.reduce((a, c) => a + c.val, 0),
					pagoT = mk.reduce((a, c) => a + c.pago, 0);
				const tipos = {};
				mk.forEach((c) => (tipos[c.note || c.n] = (tipos[c.note || c.n] || 0) + c.val));
				const dias =
					Math.max(1, Math.round((new Date(v.volta) - new Date(v.ida)) / 864e5) + 1) || 1;
				Object.assign(tr, {
					nome: v.nome,
					dest: v.destino || '—',
					datas: dataCurta(v.ida) + '–' + dataCurta(v.volta),
					nota: v.nota || '',
					total: isW ? 'R$ 0 (empresa paga)' : R(totT),
					dia: isW ? '—' : R(totT / dias),
					pago: isW ? '—' : R(pagoT),
					apagar: isW ? '—' : R(totT - pagoT),
					tipos: isW
						? []
						: Object.entries(tipos).map(([n, val]) => ({
								n,
								v: R(val),
								w: totT ? (val / totT) * 100 + '%' : '0%'
							})),
					compras: comp.map((c) => ({
						d: c.d,
						n: c.n,
						note: c.note,
						v: R(c.val),
						on: c.on,
						bg: 'transparent',
						tog: () => {}
					}))
				});
			};
			mkViagem(vNow);
			tripTabs.length = 0;
			vgs.forEach((v) => {
				const k = v.chave || String(v.id);
				tripTabs.push({
					l: v.nome,
					bg: k === tripId ? 'var(--sun)' : 'var(--sf)',
					go: () => this.set({ trip: k })
				});
			});
			periods.length = 0;
			const feriasPorAno = new Map();
			for (const f of s.ledger.ferias) {
				const y = f.inicio.slice(0, 4);
				if (!feriasPorAno.has(y)) feriasPorAno.set(y, []);
				feriasPorAno.get(y).push(f);
			}
			[...feriasPorAno.entries()]
				.sort((a, b) => b[0].localeCompare(a[0]))
				.slice(0, 4)
				.forEach(([y, fs]) => {
					periods.push({
						n: y,
						d: fs.length + ' período' + (fs.length > 1 ? 's' : ''),
						items: fs.map((f) => ({
							l: dataCurta(f.inicio) + '–' + dataCurta(f.fim),
							s: f.grupo || f.nota || 'férias'
						}))
					});
				});
			tl.length = 0;
		}
		const yrs = s.ledger
			? (() => {
					const porAno = new Map();
					for (const v of s.ledger.viagens) {
						const y = v.ida.slice(0, 4);
						let sum = 0;
						for (const id of v.compra_ids || []) {
							const c = s.ledger.compras.find((x) => x.id === id);
							if (c && !c.estornada) sum += (c.valor_total_centavos || 0) / 100;
						}
						porAno.set(y, (porAno.get(y) || 0) + sum);
					}
					return [...porAno.entries()]
						.sort((a, b) => a[0].localeCompare(b[0]))
						.map(([l, v]) => ({ l, v: R(v), h: '40%' }));
				})()
			: [
					['2022', 9100],
					['2023', 14300],
					['2024', 11800],
					['2025', 16900],
					['2026', 24640]
				].map(([l, v]) => ({ l, v: R(v), h: (v / 24640) * 80 + '%' }));
		const projs = Object.entries(this.PROJ).map(([k, p]) => {
			const t = p.items.reduce((a, b) => a + b[2], 0);
			return {
				nome: p.nome,
				per: p.per,
				ic: p.ic,
				total: R(t),
				w: Math.min(100, (t / p.orc) * 100) + '%',
				sub: 'de ' + R(p.orc) + ' orçados · ' + p.items.length + ' compras',
				bd: s.proj === k ? 'var(--ink)' : 'var(--ln)',
				go: () => this.set({ proj: k })
			};
		});
		const P = this.PROJ[s.proj],
			pj = { nome: P.nome, items: P.items.map((i) => ({ d: i[0], n: i[1], v: R(i[2]) })) };
		// ano
		const anoSerie = s.ledger ? carregarAno(s.ledger, s.ledger.year) : null;
		const visaoRaw = s.ledger
			? visaoGeralAno(s.ledger, s.ledger.year, s.visaoPerspectiva || 'pessoal')
			: [];
		const collapsed = new Set(s.collapsedDivisoes || []);
		const allDivCodes = visaoRaw
			.filter((r) => r.kind === 'division' && r.divisaoId)
			.map((r) => r.divisaoId!);

		const visaoRows = visaoRaw.map((r) => {
			const isDivision = r.kind === 'division';
			const isCategory = r.kind === 'category';
			const isSummary = r.kind === 'summary';
			const isCollapsed = isDivision && r.divisaoId ? collapsed.has(r.divisaoId) : false;
			const isHidden = isCategory && r.divisaoId ? collapsed.has(r.divisaoId) : false;

			return {
				l: r.label,
				kind: r.kind,
				divisaoId: r.divisaoId,
				categoriaId: r.categoriaId,
				childCount: r.childCount,
				isDivision,
				isCategory,
				isSummary,
				isCollapsed,
				isHidden,
				v: r.cells.map((c) => ({
					t: c.projetado && c.v ? c2(c.v) : c2(c.v),
					mut: c.projetado
				})),
				m: c2(r.media),
				t: c2(r.total),
				fs: isSummary ? '13px' : isDivision ? '12.5px' : '11.5px',
				fw: isSummary ? 600 : isDivision ? 600 : 400,
				bg: isSummary
					? r.label === 'Saldo'
						? 'rgba(59,130,246,0.08)'
						: 'var(--sf2)'
					: isDivision
						? 'var(--sf)'
						: 'transparent',
				pl: isCategory ? '32px' : '10px',
				toggle: isDivision && r.divisaoId ? () => this.toggleDivisao(r.divisaoId!) : null,
				go: r.categoriaId
					? () =>
							this.drill('compras', {
								filt: {
									cat: categoria(r.categoriaId).nome,
									label: categoria(r.categoriaId).nome
								},
								cur: 0
							})
					: isDivision && r.divisaoId
						? () => this.toggleDivisao(r.divisaoId!)
						: null
			};
		});
		const mx2 = anoSerie ? Math.max(...anoSerie.map((r) => totalResumo(r)), 1) : 26000;
		const ybars = anoSerie
			? anoSerie.map((r, i) => ({
					l: this.MN[i],
					v: (totalResumo(r) / 1000).toFixed(1).replace('.', ','),
					h: (totalResumo(r) / mx2) * 100 + '%',
					bg: r.projetado
						? 'repeating-linear-gradient(45deg,var(--N),var(--N) 4px,transparent 4px,transparent 8px)'
						: 'var(--N)',
					bd: r.projetado ? '1.5px solid var(--N)' : '0'
				}))
			: this.MN.map((l, i) => ({
					l,
					v: (this.SER[i] / 1000).toFixed(1).replace('.', ','),
					h: (this.SER[i] / mx2) * 100 + '%',
					bg:
						i < 10
							? 'var(--N)'
							: 'repeating-linear-gradient(45deg,var(--N),var(--N) 4px,transparent 4px,transparent 8px)',
					bd: i < 10 ? '0' : '1.5px solid var(--N)'
				}));
		const saveM = (2400 * s.cut) / 100;
		const periodoMeta = s.ledger ? this.chavesAtivas()[0] || s.ledger.mesAtual : '';
		const meta503020 = s.ledger ? metas503020(s.ledger, periodoMeta) : null;
		const idLetra = { necessidade: 'N', desejo: 'D', futuro: 'F' };
		const blocks = meta503020
			? meta503020.blocos.map((b) => ({
					b: idLetra[b.id] || 'N',
					n: b.nome,
					real: Math.round(b.pct) + '%',
					meta: Math.round(b.metaPct) + '%',
					ok: b.ok,
					bx: this.bx(idLetra[b.id] || 'N')
				}))
			: [
					['N', 'Necessidade', '54%', '50%'],
					['D', 'Desejo', '25%', '30%'],
					['F', 'Futuro', '21%', '20%']
				].map(([b, n, r, m]) => ({ b, n, real: r, meta: m, bx: this.bx(b) }));
		const donut = meta503020
			? (() => {
					const p = meta503020.blocos;
					const n = p.find((x) => x.id === 'necessidade')?.pct || 0;
					const d = p.find((x) => x.id === 'desejo')?.pct || 0;
					const f = p.find((x) => x.id === 'futuro')?.pct || 0;
					const n2 = n + d;
					return (
						'conic-gradient(var(--N) 0 ' +
						n +
						'%,var(--D) ' +
						n +
						'% ' +
						n2 +
						'%,var(--F) ' +
						n2 +
						'% 100%)'
					);
				})()
			: 'conic-gradient(var(--N) 0 54%,var(--D) 54% 79%,var(--F) 79% 100%)';
		const goals = [
			['Reserva de emergência (6 meses)', 62000, 108000],
			['Viagem 2027', 9000, 25000],
			['Faculdade da Olivia', 34000, 120000],
			['Previdência 2026', 19800, 24000]
		].map(([n, a, b]) => ({ n, t: R(a) + ' de ' + R(b), w: (a / b) * 100 + '%' }));
		const files = s.ledger
			? s.ledger.importacoes.map((i) => ({
					n: i.arquivo,
					d: (i.importado_em || '').slice(5, 16).replace('T', ' ').replace('-', '/'),
					s:
						(i.linhas_novas ? i.linhas_novas + ' novos' : '0 novos') +
						(i.linhas_lidas ? ' · ' + i.linhas_lidas + ' lidos' : ''),
					c: i.linhas_novas > 0 ? 'var(--moss)' : 'var(--mut)'
				}))
			: [
					['itau_conta_nov.csv', '22/11 09:12', '12 novos', 'var(--moss)'],
					['nubank_fatura_out.pdf', '22/11 09:13', '48 novos, 3 repetidos', 'var(--moss)'],
					['caixa_poupanca.csv', '22/11 09:14', 'Erro: formato', 'var(--terra)']
				].map(([n, d, st, c]) => ({ n, d, s: st, c }));
		const pend = pendRows.map((p) => ({
			loja: p.loja,
			titulo: p.titulo,
			date: p.date,
			v: c2(p.v ?? p.total ?? 0),
			sug: p.sug || '',
			conf: p.conf != null ? p.conf + '%' : '',
			open: () => this.set({ panel: p.id }),
			ok: () => {
				if (s.ledger) {
					this.toast('A classificação ainda não grava no livro');
					return;
				}
				this.setState((st) => ({
					pend: st.pend.filter((x) => x.id !== p.id),
					rows: st.rows.map((r) =>
						r.id === p.id ? { ...r, cat: p.sug in this.CATS ? p.sug : 'Compras', lock: true } : r
					)
				}));
				this.toast(p.loja + ' classificada como ' + p.sug, () =>
					this.setState((st) => ({ pend: [...st.pend, p] }))
				);
			}
		}));
		const rules = s.ledger
			? s.ledger.regras.map((r) => ({
					i: r.prioridade,
					t: r.padrao_regex || r.padrao_cat_banco || r.nota || r.id,
					c: categoria(r.categoria_id).nome,
					u: r.usos ? r.usos + ' usos' : 'nunca dispara',
					col: r.usos ? 'var(--mut)' : 'var(--terra)',
					up: () => this.toast('Prioridade só muda no classificador'),
					dn: () => this.toast('Prioridade só muda no classificador')
				}))
			: s.rules.map((r, i) => ({
					i: i + 1,
					t: r[0],
					c: r[1],
					u: r[2] ? r[2] + ' usos' : 'nunca dispara',
					col: r[2] ? 'var(--mut)' : 'var(--terra)',
					up: () => this.mv(i, -1),
					dn: () => this.mv(i, 1)
				}));
		const hit = s.test
			? s.ledger
				? s.ledger.regras.find((r) => {
						const p = (r.padrao_regex || r.padrao_cat_banco || '').toLowerCase();
						const t = s.test.toLowerCase();
						return (p && (p.includes(t) || t.includes(p.replace(/\|.*$/, '').trim()))) || false;
					})
				: s.rules.find((r) =>
						r[0]
							.toLowerCase()
							.replace(/[“”*]/g, '')
							.split(/ \| |contém /)
							.some(
								(t) =>
									(t.trim() &&
										s.test.toLowerCase().includes(
											t
												.trim()
												.toLowerCase()
												.replace(/\s*\*$/, '')
										)) ||
									(t.trim().toLowerCase().includes(s.test.toLowerCase()) && s.test.length > 2)
							)
					)
			: null;
		const COI = [
			['01', 'Alimentos e bebidas não alcoólicas', 2640, 'Mercado'],
			['02', 'Bebidas alcoólicas e tabaco', 0, '—'],
			['03', 'Vestuário e calçados', 0, '—'],
			['04', 'Habitação, água, energia e gás', 5200, 'Moradia'],
			['05', 'Mobiliário e manutenção da casa', 650, 'Compras'],
			['06', 'Saúde', 1210, 'Saúde'],
			['07', 'Transportes', 1050, 'Transporte'],
			['08', 'Informação e comunicação', 560, 'Assinaturas'],
			['09', 'Recreação, esporte e cultura', 1160, 'Lazer, Viagens'],
			['10', 'Serviços de educação', 800, 'Educação'],
			['11', 'Restaurantes e hospedagem', 1710, 'Restaurantes'],
			['12', 'Seguros e serviços financeiros', 1800, 'Previdência'],
			['13', 'Cuidados pessoais e bens diversos', 0, 'Ajuda familiar']
		];
		const refMes = s.ledger
			? s.ledger.referencia[this.chavesAtivas()[0] || s.ledger.mesAtual] || []
			: [];
		const coicop = s.ledger
			? refMes.map((r) => ({
					k: r.codigo,
					n: r.nome_pt,
					v: c2(r.total),
					cats: r.bloco_503020 || (r.n ? '' : '—'),
					open: s.coi[r.codigo],
					ic: s.coi[r.codigo] ? 'ph ph-caret-up' : 'ph ph-caret-down',
					tog: () => this.setState((st) => ({ coi: { ...st.coi, [r.codigo]: !st.coi[r.codigo] } }))
				}))
			: COI.map(([k, n, v, c]) => ({
					k,
					n,
					v: R(v),
					cats: c,
					open: s.coi[k],
					ic: s.coi[k] ? 'ph ph-caret-up' : 'ph ph-caret-down',
					tog: () => this.setState((st) => ({ coi: { ...st.coi, [k]: !st.coi[k] } }))
				}));
		const phones = s.ledger
			? [
					{
						t: 'Hoje',
						h: greet + '. ' + headline.split(';')[0] + '.',
						rows: [
							{ a: 'Custo até agora', b: spentNow },
							{ a: paceNote, b: '' },
							{ a: 'Pendências no ano', b: String(pendN) },
							{ a: projectionNote, b: '' }
						]
					},
					{
						t: 'Pendências',
						h: pendN ? pendN + ' itens pedem revisão' : 'Nada pendente',
						rows: pendSummary.map((p) => ({
							a: p.title,
							b: p.n + (p.detail ? ' · ' + p.detail : '')
						}))
					}
				]
			: [
					{
						t: 'Hoje',
						h: greet + '. Novembro está 6% acima do ritmo normal.',
						rows: [
							{ a: 'Custo até agora', b: R(14980) },
							{ a: 'Projeção de fechamento', b: R(19610) },
							{ a: '7 compras a classificar', b: pendTot },
							{ a: 'Fatura Nubank, 28/11', b: 'R$ 4.812' }
						]
					},
					{
						t: 'Pendências',
						h: 'Falta classificar ' + pendN + ' compras',
						rows: s.pend.slice(0, 5).map((p) => ({ a: p.loja + ' → ' + p.sug, b: c2(p.v) }))
					},
					{
						t: 'Fluxo (versão simples)',
						h: 'Para onde foi o dinheiro',
						rows: stack.map((b) => ({ a: b.n, b: b.v }))
					}
				];
		// cmd
		const items = [
			...MOM.flatMap((m) => m.subs.map((x) => ({ k: 'Tela', n: x[1], go: () => this.nav(x[0]) }))),
			...catNames.map((n) => ({
				k: 'Categoria',
				n,
				go: () => this.drill('compras', { filt: { cat: n, label: n }, cur: 0 })
			})),
			...['Lisboa e Porto', 'Gramado'].map((n, i) => ({
				k: 'Viagem',
				n,
				go: () => this.drill('viagens', { trip: ['lisboa', 'gramado'][i] })
			})),
			...s.rows.map((r) => ({
				k: 'Compra',
				n: r.loja + ' · ' + r.titulo,
				go: () => this.drill('compras', { panel: r.id })
			})),
			...(s.ledger?.pessoas ?? []).map((p) => ({
				k: 'Pessoa',
				n: p.apelido || p.nome,
				go: () => this.openPessoa(p.id)
			})),
			...(s.ledger?.lugares ?? []).map((l) => ({
				k: 'Lugar',
				n: l.nome,
				go: () => this.nav('mapa')
			}))
		];
		const cmdList = items
			.filter((i) => !s.q || i.n.toLowerCase().includes(s.q.toLowerCase()))
			.slice(0, 9)
			.map((i) => ({
				...i,
				go: () => {
					this.setState({ cmd: false });
					i.go();
				}
			}));
		// fechar
		const cst = s.closeStep;
		const cs = s.ledger
			? cst >= 0
				? { summary: cst === 0, s5: cst === 5, nav: cst >= 0 && cst < 6 }
				: { summary: false, nav: false }
			: {
					s0: cst === 0,
					s1: cst === 1,
					s2: cst === 2,
					s3: cst === 3,
					s4: cst === 4,
					s5: cst === 5,
					done: cst === 6,
					nav: cst >= 0 && cst < 6,
					summary: false
				};
		const devemRes = s.ledger ? resumoDevem(s.ledger.vinculos) : null;
		const devemKpis = devemRes
			? [
					{ l: 'Total emprestado', v: c2(devemRes.emprestado) },
					{ l: 'A receber', v: c2(devemRes.aReceber) },
					{ l: 'Já voltou', v: c2(devemRes.voltou) },
					{
						l: 'Taxa de retorno',
						v: Math.round(devemRes.taxa * 100) + '%'
					}
				]
			: [];
		const pessoaDet =
			s.ledger && s.pessoaId ? s.ledger.pessoas.find((p) => p.id === s.pessoaId) : null;
		const pessoasPorCirculo = (() => {
			if (!s.ledger) return [];
			const m = new Map();
			for (const p of s.ledger.pessoas) {
				const c = p.circulo || 'Sem círculo';
				if (!m.has(c)) m.set(c, []);
				m.get(c).push(p);
			}
			return [...m.entries()].map(([c, ps]) => ({
				circulo: c,
				pessoas: ps.map((p) => ({
					n: p.apelido || p.nome,
					r: p.relacao || '—',
					go: () => this.openPessoa(p.id)
				}))
			}));
		})();
		const casaPins = (s.ledger?.lugares ?? []).map((l, i) => ({
			x: 200 + (i % 3) * 220,
			y: 200 + Math.floor(i / 3) * 120,
			label: l.nome,
			go: () => this.nav('mapa')
		}));
		const emps = (s.ledger?.contratos ?? []).map((c) => {
			const p = s.ledger.pessoas.find((x) => x.id === c.pessoa_id);
			return {
				n: p?.nome ?? c.pessoa_id,
				rel: p?.relacao ?? '',
				reg: c.regime || '—',
				sal: c.salario_centavos != null ? c2(c.salario_centavos / 100) : '—',
				mes: '—',
				ano: '—',
				banco: c.banco_pagador || '—',
				go: () => p && this.openPessoa(p.id)
			};
		});
		const realizadoAno = anoSerie
			? anoSerie.filter((r) => !r.projetado).reduce((a, r) => a + totalResumo(r), 0)
			: 0;
		const projecaoAno = anoSerie
			? anoSerie.filter((r) => r.projetado).reduce((a, r) => a + totalResumo(r), 0)
			: 0;
		const closeAnoTotal = realizadoAno + projecaoAno;
		const pickRow = s.picker;
		const pickList = catNames.map((n) => ({
			n,
			b: this.CATS[n],
			bx: this.bx(this.CATS[n]),
			pick: () => {
				const id = s.picker;
				const old = s.rows.find((r) => r.id === id);
				this.setState((st) => ({
					rows: st.rows.map((r) => (r.id === id ? { ...r, cat: n, lock: true } : r)),
					pend: st.pend.filter((p) => p.id !== id),
					picker: null
				}));
				this.toast(
					(old ? old.loja : 'Compra') + ' agora é ' + n + ' (manual, vence as regras)',
					() => this.setState((st) => ({ rows: st.rows.map((r) => (r.id === id ? old : r)) }))
				);
			}
		}));
		const showApp = s.auth;
		return {
			themeStyle,
			card,
			btn,
			btnP,
			rowBtn,
			bl,
			chipS:
				'display:inline-flex;gap:6px;padding:2px 10px;border-radius:999px;background:var(--sf2);color:var(--ink);align-items:center;',
			showLogin: !s.auth,
			showApp,
			notForgot: !s.forgot,
			forgot: s.forgot,
			sent: s.sent,
			loginErr: s.loginErr,
			email: s.email,
			pwd: s.pwd,
			setEmail: (e) => this.set({ email: e.target.value }),
			setPwd: (e) => this.set({ pwd: e.target.value }),
			login: () => {
				if (s.pwd.length < 4) this.set({ loginErr: true });
				else {
					this.set({ auth: true, loginErr: false, route: 'hoje' });
					this.count();
				}
			},
			toForgot: (e) => {
				e.preventDefault();
				this.set({ forgot: true });
			},
			backLogin: (e) => {
				e.preventDefault();
				this.set({ forgot: false, sent: false });
			},
			sendLink: () => this.set({ sent: true }),
			nav,
			s: flags,
			hasBack: s.hist.length > 0,
			backLabel: s.hist.length ? this.title(s.hist[s.hist.length - 1]) : '',
			back: () => {
				const r = this.state.hist[this.state.hist.length - 1];
				this.setState((st) => ({ route: r, hist: st.hist.slice(0, -1), panel: null }));
				if (r) this.open(r);
			},
			crumb: (momOf ? momOf.label + ' › ' : '') + this.title(route),
			showLedgerContext: LEDGER_ROUTES.has(route),
			fecharMesNome,
			fecharMesLabel,
			perLabel: PER[s.per],
			escLabel: ESC[s.esc],
			baseLabel: s.base ? 'Competência' : 'Caixa',
			cyclePer: () => this.set({ per: (s.per + 1) % 3 }),
			cycleEsc: () => this.set({ esc: (s.esc + 1) % (s.ledger ? ESCOPOS.length : 5) }),
			toggleBase: () => this.set({ base: s.base ? 0 : 1 }),
			filt: !!s.filt,
			filtLabel: s.filt ? s.filt.label : '',
			clearFilt: () => this.set({ filt: null }),
			openCmd: () => this.set({ cmd: true, q: '' }),
			togglePriv: () => this.set({ priv: !s.priv }),
			privBg: s.priv ? 'var(--sun)' : 'var(--sf)',
			privIc: s.priv ? 'ph ph-eye-slash' : 'ph ph-eye',
			toggleDark: () => this.set({ dark: !s.dark }),
			darkIc: s.dark ? 'ph ph-sun' : 'ph ph-moon',
			goConta: () => this.nav('conta'),
			goMobile: () => this.nav('mobile'),
			openClose: () => this.set({ closeStep: 0 }),
			greet,
			today: s.ledger
				? agora.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
				: 'segunda, 23 de novembro',
			headline,
			paceNote,
			extraNote,
			projectionNote,
			real: !!s.ledger,
			sample: !s.ledger && !s.ledgerError,
			ledgerError: !!s.ledgerError,
			gap: !!s.real && route === 'projetos',
			gapTitle: this.title(route),
			who: s.ledger ? 'Daniel' : 'Rafael Andrade',
			mail: s.ledger ? s.email || '' : 'rafael@casa.exemplo',
			people: s.ledger
				? s.ledger.pessoas.length
					? s.ledger.pessoas
							.map((p) => p.nome + (p.relacao ? ' (' + p.relacao + ')' : ''))
							.join(', ')
					: PESSOAS
				: 'Rafael, Mariana, Olivia (filha)',
			accounts: s.ledger
				? s.ledger.contas.length
					? s.ledger.contas
							.map((c) => c.instituicao + ' · ' + c.nome + ' (' + c.tipo + ')')
							.join(' · ')
					: CONTAS
				: 'Itaú Conta · Itaú Visa · Nubank · Caixa poupança',
			escopoShare: s.ledger ? scopes.map((sc) => sc.n + ' ' + sc.v).join(' · ') : '',
			fluxoHint: s.ledger
				? 'Fontes, escopos e categorias saem do livro, no período escolhido.'
				: 'Fontes → casa, pessoal e investimentos → blocos 50/30/20 → categorias. Clique em qualquer bloco para ver as compras.',
			spentNow,
			barW,
			baseW,
			scopes,
			topCats,
			pendN,
			pendTot,
			pendSummary,
			pendEmpty: s.ledger ? !pendN : !s.pend.length,
			goPend: () => this.nav('pendencias'),
			goPessoas: () => this.nav('pessoas'),
			goCompras: () => this.nav('compras'),
			goImport: () => this.nav('importar'),
			newPurchase: () => this.toast('Nova compra manual: formulário a desenhar na próxima rodada'),
			goFluxo: (e) => {
				e.preventDefault();
				this.nav('fluxo');
			},
			sk,
			sTabs,
			notSimple: !s.simple,
			simple: s.simple,
			simpleLabel: s.simple ? 'Ver Sankey' : 'Versão simples',
			toggleSimple: () => this.set({ simple: !s.simple }),
			stack,
			months,
			catRows,
			cd,
			vTabs,
			quick,
			dsTabs,
			ds: {
				normal: s.ds === 'normal',
				loading: s.ds === 'loading',
				empty: s.ds === 'empty',
				error: s.ds === 'error'
			},
			retry: () =>
				this.set({ ds: 'loading' }, () => setTimeout(() => this.set({ ds: 'normal' }), 900)),
			skel: [1, 2, 3, 4, 5, 6],
			vCompras: s.view === 'compras',
			vLanc: s.view === 'lanc',
			rows,
			lanc,
			selN,
			catNames,
			clearSel: () => this.set({ sel: {} }),
			bulkCat: (e) => {
				const n = e.target.value;
				if (!n) return;
				const ids = Object.keys(s.sel)
					.filter((k) => s.sel[k])
					.map(Number);
				const old = s.rows;
				this.setState((st) => ({
					rows: st.rows.map((r) => (ids.includes(r.id) ? { ...r, cat: n, lock: true } : r)),
					sel: {}
				}));
				this.toast(ids.length + ' compras classificadas como ' + n, () => this.set({ rows: old }));
			},
			gridC:
				'display:grid;grid-template-columns:28px 56px minmax(0,1.6fr) minmax(0,1.3fr) 54px 96px 96px 90px;gap:10px;align-items:center;',
			mnames: this.MN,
			visaoPerspectiva: s.visaoPerspectiva || 'pessoal',
			visaoPerspectivas: [
				{
					id: 'pessoal',
					l: '👤 Pessoal (Daniel)',
					bg: (s.visaoPerspectiva || 'pessoal') === 'pessoal' ? 'var(--sf)' : 'transparent',
					fw: (s.visaoPerspectiva || 'pessoal') === 'pessoal' ? 600 : 400,
					go: () => this.setVisaoPerspectiva('pessoal')
				},
				{
					id: 'casa',
					l: '🏡 Casa',
					bg: s.visaoPerspectiva === 'casa' ? 'var(--sf)' : 'transparent',
					fw: s.visaoPerspectiva === 'casa' ? 600 : 400,
					go: () => this.setVisaoPerspectiva('casa')
				},
				{
					id: 'consolidado',
					l: '🌐 Consolidado',
					bg: s.visaoPerspectiva === 'consolidado' ? 'var(--sf)' : 'transparent',
					fw: s.visaoPerspectiva === 'consolidado' ? 600 : 400,
					go: () => this.setVisaoPerspectiva('consolidado')
				}
			],
			visaoTitle: s.ledger
				? `Visão geral de ${s.ledger.year} · ${
						(s.visaoPerspectiva || 'pessoal') === 'casa'
							? 'Casa'
							: (s.visaoPerspectiva || 'pessoal') === 'pessoal'
								? 'Pessoal (Daniel)'
								: 'Consolidado'
					}`
				: 'Visão geral de 2026',
			visaoNote:
				(s.visaoPerspectiva || 'pessoal') === 'casa'
					? 'Despesas da casa custeadas pelo repasse de R$ 10.000/mês de Daniel, aportes de Mariana e da Mãe.'
					: (s.visaoPerspectiva || 'pessoal') === 'pessoal'
						? 'Gastos pessoais de Daniel + repasse fixo de R$ 10.000/mês para a moradia/casa.'
						: 'Visão consolidada de todas as entradas e despesas familiares no ano.',
			visaoRows,
			expandAllDivisoes: () => this.expandAllDivisoes(),
			collapseAllDivisoes: () => this.collapseAllDivisoes(allDivCodes),
			casaCadastroFalta: 'O cadastro desta área ainda não existe no livro.',
			pessoasPorCirculo,
			pessoaDet,
			devemKpis,
			casaPins,
			casaEmpty: !s.ledger?.lugares?.length,
			emps,
			custoItens: (s.ledger?.months[s.ledger.mesAtual] ?? [])
				.filter((m) => m.escopo === 'casa')
				.map((m) => {
					const cat = categoria(m.categoria_id);
					return {
						id: m.categoria_id,
						nome: cat?.nome ?? m.categoria_id,
						recorrente: c2(m.custo_recorrente),
						extraordinario: c2(m.custo_extraordinario),
						totalVal: m.custo_recorrente + m.custo_extraordinario,
						total: c2(m.custo_recorrente + m.custo_extraordinario)
					};
				})
				.sort((a, b) => b.totalVal - a.totalVal),
			goDevem: () => this.nav('devem'),
			goMapa: () => this.nav('mapa'),
			fluxoVinculosNota:
				'Fora do custo de vida: empréstimos e ajudas entre pessoas. Veja em Quem deve a quem.',
			hojeDevemAReceber: devemRes ? c2(devemRes.aReceber) : '—',
			hojeDevemVoce: devemRes ? c2(0) : '—',
			modalLm: !!s.modalLm,
			modalAm: s.modalAm,
			novaPessoaNome: s.novaPessoaNome,
			wzStep: s.wzStep,
			openModalAm: () => this.set({ modalAm: true }),
			closeModalAm: () => this.set({ modalAm: false }),
			openModalLm: (compraId) => this.set({ modalLm: { compraId } }),
			closeModalLm: () => this.set({ modalLm: null }),
			startCasaWizard: () => this.set({ wzStep: 0, route: 'mapa' }),
			wzNext: () => this.set({ wzStep: Math.min(2, s.wzStep + 1) }),
			wzDone: async () => {
				this.set({ wzStep: -1 });
				this.toast('Casa montada no livro');
			},
			setNovaPessoaNome: (e) => this.set({ novaPessoaNome: e.target.value }),
			saveNovaPessoa: () =>
				this.gravarPessoa({
					id: 'p-' + Date.now(),
					nome: s.novaPessoaNome || 'Nova pessoa',
					relacao: '',
					circulo: 'Família'
				}),
			metasVinculoNota:
				'Valores a receber de empréstimos só entram no bloco Futuro quando voltarem ao livro.',
			tl,
			tlH: 96,
			periods,
			tr,
			tripTabs,
			diary: s.diary,
			toggleDiary: () => this.set({ diary: !s.diary }),
			markAll: () =>
				this.setState((st) => {
					const o = {};
					T.c.forEach((c, i) => (o[s.trip + i] = true));
					return { tc: { ...st.tc, ...o } };
				}),
			yrs,
			projs,
			pj,
			ybars,
			baseY: (18500 / mx2) * 100 + '%',
			idealY: (17500 / mx2) * 100 + '%',
			insights: s.ledger
				? [
						'Projeção = mediana dos últimos 12 meses, ajustada quando o mesmo mês do ano anterior fugiu da curva.',
						'Realizado até ' +
							rotuloMes(s.ledger.year, s.ledger.month) +
							': ' +
							c2(realizadoAno) +
							'.',
						'Meses futuros no gráfico usam hachura.',
						'O ano fecha perto de ' + c2(closeAnoTotal) + ' (realizado + projeção).'
					]
				: [
						'Dezembro costuma custar 18% mais que o ritmo normal.',
						'Restaurantes caiu 14% em relação a outubro.',
						'Julho e agosto foram os meses mais caros: viagem e reforma.',
						'Se mantiver o ritmo, o ano fecha com R$ 215 mil em custo de vida.'
					],
			cut: s.cut,
			setCut: (e) => this.set({ cut: +e.target.value }),
			saveM: R(saveM),
			saveY: R(saveM * 12),
			yearEnd: s.ledger ? c2(closeAnoTotal) : R(215000 - saveM),
			closeAnoTotal: s.ledger ? c2(closeAnoTotal) : '',
			showMetasGoals: !s.ledger,
			donut,
			blocks,
			goals,
			files,
			pend,
			rules,
			test: s.test,
			setTest: (e) => this.set({ test: e.target.value }),
			testRes: s.test
				? hit
					? s.ledger
						? 'Casa com: “' +
							(hit.padrao_regex || hit.padrao_cat_banco || hit.id) +
							'” → ' +
							categoria(hit.categoria_id).nome
						: 'Casa com: “' + hit[0] + '” → ' + hit[1]
					: 'Nenhuma regra casa'
				: '',
			coicop,
			phones,
			themeName: s.dark ? 'escuro' : 'claro',
			privName: s.priv ? 'ligado' : 'desligado',
			expire: () => this.set({ expired: true }),
			relogin: () => this.set({ expired: false }),
			logout: () => this.signOut(),
			panel: !!pr,
			pn,
			closePanel: () => this.set({ panel: null }),
			mkRule: () => {
				this.setState((st) => ({
					rules: [['Loja contém “' + pr.loja + '”', pr.cat || 'Compras', 0], ...st.rules]
				}));
				this.toast('Regra criada: ' + pr.loja + ' → ' + (pr.cat || 'Compras'));
			},
			goTrip: () => this.drill('viagens', { trip: pr.trip, panel: null }),
			markExtra: () => {
				this.setState((st) => ({
					rows: st.rows.map((r) => (r.id === pr.id ? { ...r, extra: true } : r))
				}));
				this.toast('Marcada como extraordinária: fora do ritmo normal');
			},
			picker: !!pickRow,
			pickList,
			closePicker: () => this.set({ picker: null }),
			stop: (e) => e.stopPropagation(),
			cmd: s.cmd,
			q: s.q,
			setQ: (e) => this.set({ q: e.target.value }),
			closeCmd: () => this.set({ cmd: false }),
			cmdList,
			closeOpen: cst >= 0,
			closeW: ((cst + 1) / 7) * 100 + '%',
			closeStepLabel: cst < 6 ? 'Passo ' + (cst + 1) + ' de 6' : 'Concluído',
			closeX: () => this.set({ closeStep: -1 }),
			cs,
			nextLabel: cst === 5 ? 'Fechar o mês' : 'Continuar',
			closeNext: () => this.set({ closeStep: cst + 1 }),
			closePrev: () => this.set({ closeStep: Math.max(0, cst - 1) }),
			importLabel: s.importDone ? '✓ Importado' : 'Importar o que falta',
			fakeImport: () => this.set({ importDone: true }),
			approveHigh: () => {
				const hi = s.pend.filter((p) => p.conf >= 90);
				this.setState((st) => ({ pend: st.pend.filter((p) => p.conf < 90) }));
				this.toast(hi.length + ' compras aprovadas', () =>
					this.setState((st) => ({ pend: [...st.pend, ...hi] }))
				);
			},
			feeLabel: s.feeFixed ? '✓ Marcada como tarifa bancária' : 'Marcar diferença como tarifa',
			fixFee: () => this.set({ feeFixed: true }),
			share: () => this.toast('Resumo de outubro enviado para a Mariana'),
			toast: !!s.toast,
			toastMsg: s.toast ? s.toast.m : '',
			toastUndo: !!(s.toast && s.toast.u),
			undo: () => {
				s.toast.u();
				this.set({ toast: null });
			},
			expired: s.expired
		};
	}
	view() {
		return this.renderVals();
	}
	async signOut() {
		const { clearSession } = await import('$lib/auth/session');
		clearSession();
		this.set({ auth: false, pwd: '' });
		const { AUTH_MODE } = await import('$lib/auth/api');
		if (AUTH_MODE === 'server') {
			// Encerra a sessão do Cloudflare Access (rota do próprio Access no domínio do site).
			window.location.assign('/cdn-cgi/access/logout');
			return;
		}
		await goto('/login/');
	}
	mv(i, d) {
		this.setState((st) => {
			const a = st.rules.slice(),
				j = i + d;
			if (j < 0 || j >= a.length) return null;
			[a[i], a[j]] = [a[j], a[i]];
			return { rules: a };
		});
	}
}

export const book = new Book();
