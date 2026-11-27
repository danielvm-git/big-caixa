import { getSession } from '$lib/auth/session';
import { log } from '$lib/log';

/** Escrita no mesmo endereço do site; em dev o Vite repassa ao servidor local. */
export function escritaBase(): string {
	return '/api/escrita';
}

export async function caixaWrite(payload: Record<string, unknown>): Promise<void> {
	if (!getSession()) throw new Error('escrita indisponível');
	const res = await fetch(escritaBase(), {
		method: 'POST',
		credentials: 'same-origin',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});
	if (!res.ok) throw new Error(`escrita ${res.status}`);
	log('info', 'caixa_write', { outcome: String(payload.op ?? 'unknown'), count: 1 });
}
