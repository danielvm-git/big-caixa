/** `mock` só em dev e e2e; `local` para dev com PostgreSQL local; `bigbase` para produção. */
export const AUTH_MODE: 'bigbase' | 'mock' | 'local' =
	import.meta.env.VITE_AUTH_MODE === 'local'
		? 'local'
		: import.meta.env.VITE_AUTH_MODE === 'mock'
			? 'mock'
			: 'bigbase';
