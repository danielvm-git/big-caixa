/**
 * `server` em produção: o site e a API estão no mesmo endereço, atrás do Cloudflare
 * Access; a sessão vem de `/api/me`. `local` para dev com o servidor local
 * (`LOCAL_DEV=true`). `mock` só em dev e e2e, com dados de exemplo.
 */
export const AUTH_MODE: 'server' | 'mock' | 'local' =
	import.meta.env.VITE_AUTH_MODE === 'local'
		? 'local'
		: import.meta.env.VITE_AUTH_MODE === 'mock'
			? 'mock'
			: 'server';

/** Quem está logado, segundo o servidor (Cloudflare Access em produção). */
export async function fetchServerSession(): Promise<{ token: string; email: string } | null> {
	const res = await fetch('/api/me', { credentials: 'same-origin' });
	if (!res.ok) return null;
	const body = (await res.json()) as { email?: string };
	return body.email ? { token: 'access', email: body.email } : null;
}
