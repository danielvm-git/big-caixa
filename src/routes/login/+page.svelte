<script lang="ts">
	import { goto } from '$app/navigation';
	import { login } from '$lib/auth/api';
	import { setSession } from '$lib/auth/session';

	let email = $state('rafael@casa.exemplo');
	let password = $state('');
	let forgot = $state(false);
	let err = $state('');
	let sent = $state(false);

	async function submit() {
		err = '';
		if (password.length < 4) {
			err = 'Senha muito curta';
			return;
		}
		try {
			const { token } = await login(email, password);
			setSession({ token, email });
			await goto('/hoje');
		} catch (e) {
			if (import.meta.env.DEV) {
				setSession({ token: 'dev-mock', email });
				await goto('/hoje');
				return;
			}
			err = e instanceof Error ? e.message : 'Falha no login';
		}
	}
</script>

<div class="login">
	<h1 class="serif">Livro-caixa</h1>
	{#if !forgot}
		<p class="mut">As contas da nossa casa.</p>
		<label>Email <input bind:value={email} autocomplete="username" /></label>
		<label>
			Senha <input type="password" bind:value={password} autocomplete="current-password" />
		</label>
		{#if err}<p class="err">{err}</p>{/if}
		<button class="btn btn-primary" type="button" onclick={submit}>Entrar</button>
		<button class="link" type="button" onclick={() => (forgot = true)}>Esqueci a senha</button>
	{:else}
		<p class="mut">Enviamos um link se o e-mail existir.</p>
		<input bind:value={email} />
		{#if sent}<p>Pronto. Verifique a caixa de entrada.</p>{/if}
		<button class="btn btn-primary" type="button" onclick={() => (sent = true)}>Enviar link</button>
		<button class="link" type="button" onclick={() => (forgot = false)}>Voltar</button>
	{/if}
	<p class="fine">Dados protegidos por login. CORS: ver specs/auth-probe.md.</p>
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
	label {
		display: flex;
		flex-direction: column;
		gap: 4px;
		font-size: 13px;
	}
	input {
		padding: 10px 12px;
		border-radius: 10px;
		border: 1px solid var(--ln);
		background: var(--sf);
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
	.link {
		background: none;
		border: 0;
		color: var(--mut);
		cursor: pointer;
		text-align: left;
	}
</style>
