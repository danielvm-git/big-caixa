/** Base da API BigBase. Em produção no BigBase: mesma origem + passthrough `/api`. */
export function bigbaseBase(): string {
	const fromEnv = import.meta.env.VITE_BIGBASE_URL;
	if (typeof fromEnv === 'string' && fromEnv.length > 0) {
		return fromEnv.replace(/\/$/, '');
	}
	if (import.meta.env.PROD) return '';
	return 'https://bigbase.click';
}
