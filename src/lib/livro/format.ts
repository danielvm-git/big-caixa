/**
 * Utilitários de formatação e estilos visuais do livro-caixa.
 */

export const THEME_DARK = {
	bg: '#161826',
	sf: '#1e2133',
	sf2: '#272b44',
	ink: '#e9e9ed',
	mut: '#a0a3b8',
	ln: '#303553',
	sun: '#9184d9',
	onsun: '#12131f',
	terra: '#e69078',
	moss: '#8dc28a',
	N: '#7fa3d9',
	D: '#e0a85c',
	F: '#b69be0',
	sky: '#232842',
	terraBg: '#3a2a30',
	mossBg: '#243a33',
	leaf: '#5a8f52',
	plum: '#9a6a9c',
	sand: '#4a4230',
	wall: '#2a2838',
	roomA: '#2d3a52',
	roomB: '#243a33',
	roomC: '#3a2a30',
	roomD: '#272b44'
};

export const THEME_LIGHT = {
	bg: '#f7f0df',
	sf: '#fffaf0',
	sf2: '#f0e7d1',
	ink: '#1d2c4d',
	mut: '#5b667e',
	ln: '#e3d8bd',
	sun: '#f0b429',
	onsun: '#1d2c4d',
	terra: '#b8472c',
	moss: '#3f6e3f',
	N: '#2f5d9a',
	D: '#b86a10',
	F: '#7a4fa8',
	sky: '#cfe3ee',
	terraBg: '#f8e3d9',
	mossBg: '#dfecd5',
	leaf: '#8fb67a',
	plum: '#6a3d6b',
	sand: '#ecd8a8',
	wall: '#fbf3e1',
	roomA: '#cfe3ee',
	roomB: '#dfecd5',
	roomC: '#f8e3d9',
	roomD: '#f0e7d1'
};

export const STYLE_CARD =
	'background:var(--sf);border:1px solid var(--ln);border-radius:14px;padding:16px;';
export const STYLE_BTN =
	'border:1px solid var(--ln);background:var(--sf);color:var(--ink);border-radius:8px;padding:7px 12px;font-size:13px;cursor:pointer;display:inline-flex;gap:6px;align-items:center;';
export const STYLE_BTN_P =
	'background:var(--sun);color:var(--onsun);border:0;border-radius:8px;padding:9px 14px;font-size:13px;font-weight:600;cursor:pointer;display:inline-flex;gap:6px;align-items:center;justify-content:center;';
export const STYLE_ROW_BTN =
	'display:flex;gap:10px;align-items:center;border:0;background:transparent;color:var(--ink);padding:9px 4px;cursor:pointer;font-size:14px;width:100%;';

export function getThemeTokens(dark: boolean) {
	return dark ? THEME_DARK : THEME_LIGHT;
}

export function getThemeStyle(dark: boolean): string {
	const tokens = getThemeTokens(dark);
	return (
		'display:flex;min-height:100vh;height:100vh;overflow:hidden;font-family:Inter,system-ui,sans-serif;font-size:14px;color:var(--ink);background:var(--bg);' +
		Object.entries(tokens)
			.map(([k, v]) => `--${k}:${v}`)
			.join(';')
	);
}

/**
 * Formata valor numérico em moeda brasileira (R$).
 * @param v Valor a formatar
 * @param centavos Se true, exibe 2 casas decimais; se false, arredonda para inteiro
 */
export function formatReal(v: number, centavos = false): string {
	const num = Number(v) || 0;
	return (
		(num < 0 ? '−' : '') +
		'R$ ' +
		Math.abs(num).toLocaleString('pt-BR', {
			minimumFractionDigits: centavos ? 2 : 0,
			maximumFractionDigits: centavos ? 2 : 0
		})
	);
}

export const R = formatReal;

/**
 * Gera string de pontos SVG para sparklines e gráficos lineares.
 */
export function pts(arr: number[], w: number, h: number): string {
	if (!arr || arr.length === 0) return '';
	if (arr.length === 1) return `0,${(h / 2).toFixed(1)}`;
	const mx = Math.max(...arr);
	const mn = Math.min(...arr);
	const range = mx - mn || 1;
	return arr
		.map(
			(v, i) =>
				((i * w) / (arr.length - 1)).toFixed(1) +
				',' +
				(h - 2 - ((v - mn) / range) * (h - 4)).toFixed(1)
		)
		.join(' ');
}

/**
 * Gera série sintética para visualização de sparklines com seed.
 */
export function spark(v: number, seed = 0): number[] {
	const f = [0.9, 1.05, 0.95, 1, 1.1, 0.92, 1.02, 1.12, 0.88, 1, 0.97, 1];
	return f.map((x, i) => v * (x + ((i * seed) % 5) * 0.01));
}

/**
 * Formata data ISO (YYYY-MM-DD) para DD/MM.
 */
export function dataCurta(iso?: string | null): string {
	const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
	if (!m) return '';
	return m[3] + '/' + m[2];
}

/**
 * Retorna cor de bloco CSS para bloco ('N', 'D', 'F') ou fallback.
 */
export function blkC(b?: string | null): string {
	return b ? 'var(--' + b + ')' : 'var(--mut)';
}

/**
 * Retorna estilo inline CSS para badge/ícone de bloco.
 */
export function bx(b?: string | null): string {
	return (
		'display:inline-flex;width:18px;height:18px;border-radius:5px;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:var(--bg);background:' +
		blkC(b) +
		';'
	);
}
