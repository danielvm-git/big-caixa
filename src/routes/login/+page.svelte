<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { AUTH_MODE } from '$lib/auth/api';
	import { signInWithGoogle, fetchNeonSession } from '$lib/auth/neon';
	import { setSession } from '$lib/auth/session';

	let err = $state('');

	onMount(async () => {
		// #region agent log
		fetch('http://127.0.0.1:7763/ingest/caee9a34-7e8d-4177-870b-0ce591c4a815', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '15fadb' },
			body: JSON.stringify({
				sessionId: '15fadb',
				hypothesisId: 'H5',
				location: 'login/+page.svelte:onMount',
				message: 'login mount',
				data: {
					hasViteUrl:
						typeof import.meta.env.VITE_NEON_AUTH_URL === 'string' &&
						import.meta.env.VITE_NEON_AUTH_URL.length > 0,
					prod: import.meta.env.PROD
				},
				timestamp: Date.now()
			})
		}).catch(() => {});
		// #endregion
		const s = await fetchNeonSession();
		if (s) {
			setSession(s);
			await goto('/hoje/');
		}
	});

	async function googleLogin() {
		err = '';
		try {
			const callbackURL = `${window.location.origin}/hoje/`;
			await signInWithGoogle(callbackURL);
		} catch (e) {
			err = e instanceof Error ? e.message : 'Falha ao abrir o Google';
		}
	}

	async function mockLogin() {
		setSession({ token: 'mock-token', email: 'e2e@exemplo.invalid' });
		await goto('/hoje/');
	}
</script>

<div class="login">
	<h1 class="serif">big-caixa</h1>
	<p class="mut">As contas da nossa casa.</p>

	{#if err}<p class="err">{err}</p>{/if}

	<button class="btn btn-primary google" type="button" onclick={googleLogin}>
		Entrar com Google
	</button>

	{#if AUTH_MODE === 'mock'}
		<button class="btn" type="button" onclick={mockLogin}>Entrar (só e2e)</button>
	{/if}

	<p class="fine">Autenticação via Neon Auth. Coleções BigBase exigem sync local com API key.</p>
</div>

<style>
	.login {
		display: flex;
		flex-direction: column;
		justify-content: center;
		max-width: 420px;
		margin: 0 auto;
		gap: 12px;
		padding: 24px;
	}
	.mut,
	.fine {
		color: var(--mut);
		font-size: 13px;
	}
	.err {
		color: var(--terra);
		font-size: 13px;
	}
	.google {
		width: 100%;
	}
</style>
