<script lang="ts">
	import { book } from '$lib/livro/book.svelte';

	let v = $derived(book.view());
</script>

<div style="max-width:720px;display:flex;flex-direction:column;gap:14px;animation:up .3s">
	<h1 style="font:600 28px 'Source Serif 4',serif;margin:0">Conta e ajustes</h1>
	<div style="{v.card}display:flex;flex-direction:column;gap:6px;font-size:14px">
		<b>Perfil</b>{v.who}{#if v.mail}
			· {v.mail}{/if}<b style="margin-top:8px"> Pessoas da casa </b>{v.people}<b
			style="margin-top:8px"
		>
			Contas e cartões
		</b>{v.accounts}
	</div>
	<div style="{v.card}display:flex;gap:10px;flex-wrap:wrap">
		<button type="button" onclick={v.toggleDark} style={v.btn}>Tema: {v.themeName}</button>
		<button type="button" onclick={v.togglePriv} style={v.btn}>
			Privacidade: {v.privName}
		</button>
		<button type="button" onclick={v.expire} style={v.btn}> Simular sessão expirada </button>
		<button type="button" onclick={v.logout} style={v.btn}>
			<i class="ph ph-sign-out"></i> Sair
		</button>
	</div>
</div>
