<script lang="ts">
	import { clearSession, getSession } from '$lib/auth/session';
	import { goto } from '$app/navigation';

	const email = getSession()?.email ?? '—';

	async function logout() {
		clearSession();
		await goto('/login');
	}
</script>

<h1 class="serif">Conta e ajustes</h1>
<div class="card">
	<p><b>Perfil</b> {email}</p>
	<button class="btn" type="button" onclick={logout}>Sair</button>
</div>
