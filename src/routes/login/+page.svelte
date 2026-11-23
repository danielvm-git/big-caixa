<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { AUTH_MODE } from '$lib/auth/api';
	import { signInWithGoogle, fetchNeonSession } from '$lib/auth/neon';
	import { setSession } from '$lib/auth/session';

	let err = $state('');

	onMount(async () => {
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
	<h1 class="serif">Livro-caixa</h1>
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
		min-height: 100vh;
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
