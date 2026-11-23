/** Base da API. Em dev, o Vite lê o SQLite na mesma origem. Em produção, passthrough `/api`. */
export function bigbaseBase(): string {
	if (import.meta.env.DEV) return '';
	const fromEnv = import.meta.env.VITE_BIGBASE_URL;
	if (typeof fromEnv === 'string' && fromEnv.length > 0) {
		return fromEnv.replace(/\/$/, '');
	}
	return '';
}
