<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { requireSession } from '$lib/auth/guard';
	import { initSessionContext } from '$lib/auth/session';
	import { log } from '$lib/log';
	import Nav from '$lib/ui/Nav.svelte';
	import { filtros, setMes, togglePrivacidade, toggleTema } from '$lib/filters';

	let { children } = $props();

	initSessionContext();

	const hideNav = $derived(page.url.pathname === '/login');

	onMount(() => {
		if (!hideNav) void requireSession();
		log('info', 'layout_mount', { route: page.url.pathname });
	});

	$effect(() => {
		document.documentElement.dataset.theme = $filtros.tema;
	});
</script>

{#if hideNav}
	{@render children()}
{:else}
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
		</div>
	</div>
{/if}

<style>
	.shell {
		display: flex;
		min-height: 100vh;
	}
	.main {
		flex: 1;
		min-width: 0;
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
		padding: 24px;
		overflow: auto;
	}
</style>
