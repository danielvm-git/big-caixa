<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { AUTH_MODE } from '$lib/auth/api';
	import { signInWithGoogle, fetchNeonSession } from '$lib/auth/neon';
	import { setSession } from '$lib/auth/session';

	let err = $state('');

	onMount(async () => {
		if (AUTH_MODE === 'local' || !import.meta.env.PROD) {
			setSession({ token: 'local-token', email: 'daniel@casa.exemplo' });
			await goto('/hoje/');
			return;
		}
		const s = await fetchNeonSession();
		if (s) {
			setSession(s);
			await goto('/hoje/');
		}
	});

	async function entrar() {
		err = '';
		try {
			await signInWithGoogle(`${window.location.origin}/hoje/`);
		} catch (e) {
			err = e instanceof Error ? e.message : 'Falha ao abrir o Google';
		}
	}

	async function mockLogin() {
		setSession({ token: 'mock-token', email: 'e2e@exemplo.invalid' });
		await goto('/hoje/');
	}
</script>

<div style="flex:1;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);min-height:100vh">
	<div
		style="background:var(--sf2);display:flex;align-items:center;justify-content:center;padding:40px"
	>
		<div
			style="position:relative;width:380px;height:320px;border-radius:24px;background:var(--sky);overflow:hidden"
		>
			<div
				style="position:absolute;right:60px;top:40px;width:64px;height:64px;border-radius:50%;background:var(--sun)"
			></div>
			<div
				style="position:absolute;left:-60px;bottom:-90px;width:560px;height:220px;border-radius:50%;background:var(--moss)"
			></div>
			<div
				style="position:absolute;left:130px;bottom:80px;width:120px;height:90px;background:var(--sf);border-radius:4px"
			></div>
			<div
				style="position:absolute;left:112px;bottom:160px;width:156px;height:70px;background:var(--terra);clip-path:polygon(50% 0,100% 100%,0 100%)"
			></div>
			<div
				style="position:absolute;left:178px;bottom:80px;width:30px;height:48px;background:var(--ink);border-radius:15px 15px 0 0"
			></div>
			<div
				style="position:absolute;left:142px;bottom:116px;width:24px;height:24px;background:var(--sun);border-radius:4px"
			></div>
		</div>
	</div>
	<div
		style="display:flex;flex-direction:column;justify-content:center;padding:0 min(8vw,96px);gap:16px;max-width:520px"
	>
		<div style="font:600 34px 'Source Serif 4',serif">Livro-caixa</div>
		<div style="display:flex;flex-direction:column;gap:14px">
			<div style="color:var(--mut)">Bem-vindo de volta. Aqui ficam as contas da nossa casa.</div>
			{#if err}
				<div
					style="background:var(--terraBg);color:var(--ink);padding:10px 12px;border-radius:10px;font-size:13px;border:1px solid var(--terra)"
				>
					{err}
				</div>
			{/if}
			<button
				type="button"
				onclick={entrar}
				style="background:var(--sun);color:var(--onsun);border:0;border-radius:10px;padding:12px;font-size:15px;font-weight:600;cursor:pointer"
			>
				Entrar com Google
			</button>
			{#if AUTH_MODE === 'mock'}
				<button class="btn" type="button" onclick={mockLogin}>Entrar (só e2e)</button>
			{/if}
		</div>
		<div style="font-size:12px;color:var(--mut);display:flex;gap:8px;align-items:center">
			<i class="ph ph-lock-simple"></i>Os dados são só nossos: acesso protegido via Google Auth.
		</div>
	</div>
</div>
