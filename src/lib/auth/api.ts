import { bigbaseBase } from '$lib/bigbase-url';

/** `mock` só em dev e e2e (build com VITE_AUTH_MODE=mock). Produção usa `bigbase`. */
export const AUTH_MODE: 'bigbase' | 'mock' =
	import.meta.env.VITE_AUTH_MODE === 'mock' ? 'mock' : 'bigbase';

export async function login(email: string, password: string): Promise<{ token: string }> {
	if (AUTH_MODE === 'mock') return { token: 'mock-token' };
	let res: Response;
	try {
		res = await fetch(`${bigbaseBase()}/api/auth/login`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ email, password })
		});
	} catch {
		throw new Error('origem não autorizada: registre a origem do site no BigBase (CORS)');
	}
	if (res.status === 403) {
		throw new Error('origem não autorizada: registre a origem do site no BigBase (CORS)');
	}
	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		throw new Error((body as { error?: string }).error ?? `login ${res.status}`);
	}
	return (await res.json()) as { token: string };
}

export async function me(token: string): Promise<{ email: string }> {
	const res = await fetch(`${bigbaseBase()}/api/auth/me`, {
		headers: { Authorization: `Bearer ${token}` }
	});
	if (!res.ok) throw new Error(`me ${res.status}`);
	return (await res.json()) as { email: string };
}
