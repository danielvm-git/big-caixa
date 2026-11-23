<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { fetchNeonSession } from '$lib/auth/neon';
	import { getSession, initSessionContext, setSession } from '$lib/auth/session';
	import { goto } from '$app/navigation';
	import { log } from '$lib/log';
	import Nav from '$lib/ui/Nav.svelte';
	import SiteFooter from '$lib/ui/SiteFooter.svelte';
	import { filtros, setMes, togglePrivacidade, toggleTema } from '$lib/filters';

	let { children } = $props();

	initSessionContext();

	const hideNav = $derived(page.url.pathname.startsWith('/login'));
	let pronta = $state(false);

	onMount(async () => {
		if (!hideNav) {
			const neon = await fetchNeonSession();
			if (neon) setSession(neon);
			if (!getSession()) {
				await goto('/login/');
				return;
			}
		}
		pronta = true;
		log('info', 'layout_mount', { route: page.url.pathname });
	});

	$effect(() => {
		document.documentElement.dataset.theme = $filtros.tema;
	});
</script>

{#if hideNav}
	<div class="login-frame">
		<div class="login-body">
			{@render children()}
		</div>
		<SiteFooter />
	</div>
{:else if pronta}
	<div class="shell">
		<Nav />
		<div class="main">
			<header class="header">
				<span class="mut">{page.url.pathname}</span>
				<div class="spacer"></div>
				<button class="btn" type="button" onclick={() => setMes('2026-11')}>Nov 2026</button>
				<button class="btn" type="button" onclick={togglePrivacidade}>
					{$filtros.privacidade ? 'Privacidade on' : 'Privacidade off'}
				</button>
				<button class="btn" type="button" onclick={toggleTema}>
					{$filtros.tema === 'escuro' ? 'Claro' : 'Escuro'}
				</button>
			</header>
			<main class:blur-private={$filtros.privacidade}>
				{@render children()}
			</main>
			<SiteFooter />
		</div>
	</div>
{:else}
	<p class="boot">Carregando…</p>
{/if}

<style>
	.boot {
		padding: 24px;
	}
	.shell {
		display: flex;
		min-height: 100vh;
	}
	.login-frame {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}
	.login-body {
		flex: 1;
		display: flex;
		min-height: 0;
	}
	.login-body :global(.login) {
		flex: 1;
		min-height: 0;
	}
	.main {
		flex: 1;
		min-width: 0;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}
	.header {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 24px;
		border-bottom: 1px solid var(--ln);
		background: var(--bg);
	}
	.spacer {
		flex: 1;
	}
	.mut {
		color: var(--mut);
		font-size: 13px;
	}
	main {
		flex: 1;
		min-height: 0;
		padding: 24px;
		overflow: auto;
	}
</style>
