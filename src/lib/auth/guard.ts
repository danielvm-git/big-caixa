import { goto } from '$app/navigation';
import { browser } from '$app/env';
import { getSession } from './session';

export async function requireSession(): Promise<void> {
	if (!browser) return;
	if (!getSession()) {
		await goto('/login');
	}
}
