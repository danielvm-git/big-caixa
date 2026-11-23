import { getContext, setContext } from 'svelte';

const KEY = 'big-caixa-session';

export type Session = {
	token: string;
	email: string;
} | null;

let memory: Session = null;

export function getSession(): Session {
	return memory;
}

export function setSession(s: Session): void {
	memory = s;
}

export function clearSession(): void {
	memory = null;
}

export function initSessionContext(): void {
	setContext(KEY, { getSession, setSession, clearSession });
}

export function useSession() {
	return getContext<{
		getSession: () => Session;
		setSession: (s: Session) => void;
		clearSession: () => void;
	}>(KEY);
}
