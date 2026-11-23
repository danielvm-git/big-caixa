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

// #region agent log
if (typeof fetch !== 'undefined') {
	fetch('http://127.0.0.1:7763/ingest/caee9a34-7e8d-4177-870b-0ce591c4a815', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '15fadb' },
		body: JSON.stringify({
			sessionId: '15fadb',
			hypothesisId: 'H1',
			location: 'neon.ts:resolve',
			message: 'neon auth url resolved',
			data: { source: resolved.source, urlLen: authUrl?.length ?? 0, prod: import.meta.env.PROD },
			timestamp: Date.now()
		})
	}).catch(() => {});
}
// #endregion

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
	if (!neonAuth) return null;
	const { data } = await neonAuth.getSession();
	if (!data?.session || !data.user?.email) return null;
	const token =
		(data.session as { token?: string }).token ??
		(data as { session?: { accessToken?: string } }).session?.accessToken ??
		'neon-session';
	return { token, email: data.user.email };
}

export async function signOutNeon(): Promise<void> {
	if (neonAuth) await neonAuth.signOut();
}
