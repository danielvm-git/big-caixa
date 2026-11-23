import { createAuthClient } from '@neondatabase/auth';

const authUrl = import.meta.env.VITE_NEON_AUTH_URL as string | undefined;

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
