import { createAuthClient } from '@neondatabase/auth';
import { NEON_AUTH_PUBLIC_BASE } from './neon-public-url';

function resolveNeonAuthUrl(): { url: string | undefined; source: 'vite' | 'fallback' | 'none' } {
	const fromVite = import.meta.env.VITE_NEON_AUTH_URL as string | undefined;
	if (typeof fromVite === 'string' && fromVite.length > 0) {
		return { url: fromVite, source: 'vite' };
	}
	if (import.meta.env.PROD) {
		return { url: NEON_AUTH_PUBLIC_BASE, source: 'fallback' };
	}
	return { url: undefined, source: 'none' };
}

const resolved = resolveNeonAuthUrl();
const authUrl = resolved.url;

function isJwt(token: string | undefined): token is string {
	return !!token && token.split('.').length === 3;
}

async function jwtFromTokenEndpoint(base: string): Promise<string | null> {
	const res = await fetch(`${base.replace(/\/$/, '')}/token`, { credentials: 'include' });
	if (!res.ok) return null;
	const body = (await res.json()) as { token?: string };
	return isJwt(body.token) ? body.token : null;
}

/** Cliente Neon Auth (Better Auth hospedado). Ausente em e2e mock sem URL. */
export const neonAuth =
	typeof authUrl === 'string' && authUrl.length > 0 ? createAuthClient(authUrl) : null;

export async function signInWithGoogle(callbackURL: string): Promise<void> {
	if (!neonAuth) {
		throw new Error('Neon Auth não configurado (VITE_NEON_AUTH_URL)');
	}
	await neonAuth.signIn.social({ provider: 'google', callbackURL });
}

export async function fetchNeonSession(): Promise<{
	token: string;
	email: string;
} | null> {
	if (!neonAuth || !authUrl) return null;
	const { data } = await neonAuth.getSession();
	if (!data?.user?.email) return null;
	const sessionToken = (data.session as { token?: string } | undefined)?.token;
	const token = isJwt(sessionToken) ? sessionToken : await jwtFromTokenEndpoint(authUrl);
	if (!token) return null;
	return { token, email: data.user.email };
}

export async function signOutNeon(): Promise<void> {
	if (neonAuth) await neonAuth.signOut();
}
