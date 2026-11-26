<script lang="ts">
	import '../app.css';
	import { onMount, untrack } from 'svelte';
	import { page } from '$app/state';
	import { fetchNeonSession } from '$lib/auth/neon';
	import { getSession, initSessionContext, setSession } from '$lib/auth/session';
	import { goto } from '$app/navigation';
	import { log } from '$lib/log';
	import LivroApp from '$lib/livro/LivroApp.svelte';
	import { book } from '$lib/livro/book.svelte';
	import { filtros } from '$lib/filters';

	let { children } = $props();

	initSessionContext();

	const hideNav = $derived(page.url.pathname.startsWith('/login'));
	let pronta = $state(false);

	onMount(() => {
		void (async () => {
			if (!hideNav) {
				if (import.meta.env.VITE_AUTH_MODE === 'local') {
					setSession({ token: 'local-token', email: 'daniel@casa.exemplo' });
				} else {
					try {
						const neon = await fetchNeonSession();
						if (neon) setSession(neon);
					} catch {
						// Falha de rede não pode deixar a página em Carregando.
					}
					if (!getSession()) {
						if (!import.meta.env.PROD) {
							setSession({ token: 'local-token', email: 'daniel@casa.exemplo' });
						} else {
							await goto('/login/');
							return;
						}
					}
				}
			}
			const sessao = getSession();
			if (sessao && sessao.token !== 'mock-token') await book.loadLedger(sessao.email);
			pronta = true;
			book.set({ auth: true });
			book.mountKeys();
			book.count();
			log('info', 'layout_mount', { route: page.url.pathname });
		})();
		return () => book.unmountKeys();
	});

	$effect(() => {
		const path = page.url.pathname.replace(/\/$/, '') || '/hoje';
		const route =
			{
				'/hoje': 'hoje',
				'/visao': 'visao',
				'/fluxo': 'fluxo',
				'/mes': 'mes',
				'/compras': 'compras',
				'/entradas': 'entradas',
				'/ia': 'ia',
				'/viagens': 'viagens',
				'/projetos': 'projetos',
				'/mapa': 'mapa',
				'/pessoas': 'pessoas',
				'/pessoa': 'pessoa',
				'/empregados': 'empregados',
				'/custo': 'custo',
				'/devem': 'devem',
				'/ano': 'ano',
				'/metas': 'metas',
				'/importar': 'importar',
				'/pendencias': 'pendencias',
				'/regras': 'regras',
				'/referencia': 'referencia',
				'/conta': 'conta',
				'/mobile': 'mobile',
				'/fechamento': 'hoje'
			}[path] ?? null;
		if (route && getSession()) book.set({ auth: true });
		untrack(() => {
			if (route && book.state.route !== route) book.setState({ route, panel: null });
			if (path === '/fechamento' && book.state.closeStep < 0) book.set({ closeStep: 0 });
		});
	});

	$effect(() => {
		document.documentElement.dataset.theme = $filtros.tema;
	});
</script>

{#if hideNav}
	{@render children()}
{:else if pronta}
	<LivroApp>{@render children()}</LivroApp>
{:else}
	<p class="boot">Carregando…</p>
{/if}

<style>
	.boot {
		padding: 24px;
	}
</style>
