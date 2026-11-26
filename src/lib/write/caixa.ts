import { AUTH_MODE } from '$lib/auth/api';
import { getSession } from '$lib/auth/session';
import { log } from '$lib/log';

export function escritaBase(): string {
	const fromEnv =
		(import.meta.env.VITE_CAIXA_ESCRITA_URL as string | undefined) ||
		(import.meta.env.VITE_CAIXA_URL as string | undefined)?.replace(/\/leitura\/?$/, '/escrita');
	if (fromEnv) return fromEnv.replace(/\/$/, '');
	if (AUTH_MODE === 'local' || !import.meta.env.PROD) return 'http://localhost:8787';
	return '';
}

export async function caixaWrite(payload: Record<string, unknown>): Promise<void> {
	const token = getSession()?.token;
	const base = escritaBase();
	if (!token || !base) throw new Error('escrita indisponível');
	const res = await fetch(base, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(payload)
	});
	if (!res.ok) throw new Error(`escrita ${res.status}`);
	log('info', 'caixa_write', { outcome: String(payload.op ?? 'unknown'), count: 1 });
}
