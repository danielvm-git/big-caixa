<script lang="ts">
	import { page } from '$app/state';

	const groups = [
		{ id: 'hoje', label: 'Hoje', href: '/hoje' },
		{
			id: 'entender',
			label: 'Entender',
			subs: [
				{ href: '/fluxo', label: 'Fluxo de caixa' },
				{ href: '/mes', label: 'Mês e categorias' },
				{ href: '/compras', label: 'Compras e lançamentos' }
			]
		},
		{
			id: 'viver',
			label: 'Viver',
			subs: [
				{ href: '/viagens', label: 'Viagens e férias' },
				{ href: '/projetos', label: 'Projetos' }
			]
		},
		{
			id: 'planejar',
			label: 'Planejar',
			subs: [
				{ href: '/ano', label: 'Ano e projeção' },
				{ href: '/metas', label: '50/30/20 e metas' }
			]
		},
		{
			id: 'cuidar',
			label: 'Cuidar',
			subs: [
				{ href: '/importar', label: 'Importar' },
				{ href: '/pendencias', label: 'Pendências' },
				{ href: '/regras', label: 'Regras' },
				{ href: '/referencia', label: 'Referência ONU' }
			]
		}
	];

	function active(href: string): boolean {
		return page.url.pathname === href;
	}
</script>

<nav class="nav">
	<div class="brand serif">big-caixa</div>
	{#each groups as g}
		{#if g.subs}
			<div class="group">
				<div class="group-label">{g.label}</div>
				{#each g.subs as s}
					<a class="link" class:on={active(s.href)} href={s.href}>{s.label}</a>
				{/each}
			</div>
		{:else}
			<a class="link top" class:on={active(g.href)} href={g.href}>{g.label}</a>
		{/if}
	{/each}
	<a class="link" href="/conta">Conta</a>
</nav>

<style>
	.nav {
		width: 236px;
		flex: none;
		background: var(--sf);
		border-right: 1px solid var(--ln);
		padding: 16px 12px;
		display: flex;
		flex-direction: column;
		gap: 6px;
		overflow: auto;
	}
	.brand {
		font-size: 19px;
		font-weight: 600;
		padding: 4px 8px 16px;
	}
	.group-label {
		font-size: 12px;
		color: var(--mut);
		padding: 8px 8px 2px;
	}
	.link {
		text-decoration: none;
		font-size: 14px;
		padding: 6px 10px;
		border-radius: 8px;
		display: block;
	}
	.link.on {
		background: var(--sf2);
		font-weight: 600;
	}
</style>
