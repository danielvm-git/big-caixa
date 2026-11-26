<script lang="ts">
	import { reclassificarEntrada } from '$lib/read-model/client';
	import type { EntradaTransacaoDoc, TipoEntradaDoc } from '$lib/read-model/types';
	import { Money } from '$lib/ui';

	let {
		open = false,
		title = 'Conferir Entradas',
		periodo = '',
		filtroOrigem = '',
		filtroTipoId = '',
		transacoes = [] as EntradaTransacaoDoc[],
		tipos = [] as TipoEntradaDoc[],
		onclose = () => {},
		onupdated = () => {}
	}: {
		open: boolean;
		title?: string;
		periodo?: string;
		filtroOrigem?: string;
		filtroTipoId?: string;
		transacoes: EntradaTransacaoDoc[];
		tipos: TipoEntradaDoc[];
		onclose?: () => void;
		onupdated?: () => void;
	} = $props();

	let busca = $state('');
	let salvandoId = $state<string | null>(null);
	let msgSucesso = $state('');
	let toastTimer: ReturnType<typeof setTimeout> | null = null;

	const formatDataBR = (iso?: string) => (iso ? iso.split('-').reverse().join('/') : '—');

	const filtradas = $derived(
		transacoes.filter((t) => {
			if (filtroOrigem && t.origem !== filtroOrigem) return false;
			if (filtroTipoId && t.tipo_id !== filtroTipoId) return false;
			if (busca.trim()) {
				const q = busca.toLowerCase();
				const matchDesc = t.descricao.toLowerCase().includes(q);
				const matchOrigem = t.origem.toLowerCase().includes(q);
				const matchTipo = t.tipo_nome.toLowerCase().includes(q);
				if (!matchDesc && !matchOrigem && !matchTipo) return false;
			}
			return true;
		})
	);

	const totalFiltrado = $derived(filtradas.reduce((acc, t) => acc + t.valor, 0));

	async function handleReclassificar(transacaoId: string, novoCodigo: string) {
		try {
			salvandoId = transacaoId;
			await reclassificarEntrada(transacaoId, novoCodigo);
			const tipo = tipos.find((t) => t.id === novoCodigo);
			msgSucesso = `Classificado como "${tipo?.nome || novoCodigo}"`;
			if (toastTimer) clearTimeout(toastTimer);
			toastTimer = setTimeout(() => {
				msgSucesso = '';
				toastTimer = null;
			}, 3000);
			onupdated();
		} catch (err) {
			alert('Erro ao reclassificar: ' + (err as Error).message);
		} finally {
			salvandoId = null;
		}
	}
</script>

{#if open}
	<div class="drawer-backdrop" onclick={onclose} role="presentation">
		<div
			class="drawer-panel"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.key === 'Escape' && onclose()}
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			<header class="drawer-header">
				<div>
					<h2 class="serif" style="margin:0;font-size:22px;font-weight:600">
						{title}
					</h2>
					<div style="font-size:13px;color:var(--mut);margin-top:4px">
						{#if periodo}<span style="font-family:monospace;margin-right:6px">
								[{periodo}]
							</span>{/if}
						{filtradas.length} lançamento{filtradas.length === 1 ? '' : 's'} · Total:
						<b><Money value={totalFiltrado} /></b>
					</div>
				</div>
				<button class="btn-close" onclick={onclose} aria-label="Fechar">✕</button>
			</header>

			{#if msgSucesso}
				<div class="toast-inline">✓ {msgSucesso}</div>
			{/if}

			<div
				style="padding: 12px 20px; border-bottom: 1px solid var(--ln); display: flex; gap: 10px; align-items: center"
			>
				<input
					type="search"
					placeholder="Filtrar lançamentos por descrição, origem..."
					bind:value={busca}
					style="flex: 1; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--ln); background: var(--sf2); color: var(--ink); font-size: 13px; outline: none"
				/>
				{#if filtroOrigem || filtroTipoId}
					<span
						style="font-size:12px;color:var(--mut);background:var(--sf2);padding:4px 8px;border-radius:6px"
					>
						Filtro ativo
					</span>
				{/if}
			</div>

			<div class="drawer-body">
				{#if filtradas.length === 0}
					<div style="text-align:center;padding:48px 20px;color:var(--mut);font-size:14px">
						Nenhum lançamento encontrado para os critérios selecionados.
					</div>
				{:else}
					<div class="tx-list">
						{#each filtradas as t (t.transacao_id)}
							<div class="tx-card">
								<div class="tx-main">
									<div class="tx-meta">
										<span class="tx-date">{formatDataBR(t.data)}</span>
										<span class="tx-badge">{t.origem}</span>
										{#if t.tipo_id === '4.1.009'}
											<span class="badge-pendente">A classificar</span>
										{/if}
									</div>
									<div class="tx-desc" title={t.descricao}>{t.descricao}</div>
								</div>

								<div class="tx-right">
									<div class="tx-amount"><Money value={t.valor} /></div>
									<div class="tx-select-wrap">
										<select
											value={t.tipo_id}
											disabled={salvandoId === t.transacao_id}
											onchange={(e) => handleReclassificar(t.transacao_id, e.currentTarget.value)}
											class="tx-select"
										>
											{#each tipos as tipo}
												<option value={tipo.id}>{tipo.nome}</option>
											{/each}
										</select>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.drawer-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(10, 12, 24, 0.45);
		z-index: 60;
		display: flex;
		justify-content: flex-end;
		animation: fadeIn 0.15s ease-out;
	}
	.drawer-panel {
		width: 580px;
		max-width: 95vw;
		height: 100vh;
		background: var(--bg);
		border-left: 1px solid var(--ln);
		display: flex;
		flex-direction: column;
		box-shadow: -4px 0 24px rgba(0, 0, 0, 0.12);
		animation: slideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
	}
	.drawer-header {
		padding: 20px 24px;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		border-bottom: 1px solid var(--ln);
		background: var(--sf);
	}
	.btn-close {
		border: 1px solid var(--ln);
		background: transparent;
		color: var(--mut);
		width: 32px;
		height: 32px;
		border-radius: 8px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 16px;
	}
	.btn-close:hover {
		background: var(--sf2);
		color: var(--ink);
	}
	.toast-inline {
		padding: 8px 16px;
		background: var(--moss, #2e7d32);
		color: #fff;
		font-size: 13px;
		font-weight: 500;
	}
	.drawer-body {
		flex: 1;
		overflow-y: auto;
		padding: 16px 20px;
	}
	.tx-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.tx-card {
		background: var(--sf);
		border: 1px solid var(--ln);
		border-radius: 10px;
		padding: 12px 14px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 16px;
		transition: border-color 0.15s;
	}
	.tx-card:hover {
		border-color: var(--ink);
	}
	.tx-main {
		min-width: 0;
		flex: 1;
	}
	.tx-meta {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 12px;
		margin-bottom: 4px;
	}
	.tx-date {
		color: var(--mut);
		font-variant-numeric: tabular-nums;
	}
	.tx-badge {
		background: var(--sf2);
		color: var(--ink);
		padding: 2px 7px;
		border-radius: 4px;
		font-size: 11px;
		font-weight: 500;
	}
	.badge-pendente {
		background: #fff3e0;
		color: #e65100;
		border: 1px solid #ffe0b2;
		padding: 1px 6px;
		border-radius: 4px;
		font-size: 11px;
		font-weight: 600;
	}
	.tx-desc {
		font-size: 13px;
		font-weight: 500;
		color: var(--ink);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.tx-right {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 6px;
		flex-shrink: 0;
	}
	.tx-amount {
		font-family: 'Source Serif 4', serif;
		font-weight: 600;
		font-size: 16px;
		font-variant-numeric: tabular-nums;
		color: var(--moss, #2e7d32);
	}
	.tx-select {
		padding: 4px 8px;
		border-radius: 6px;
		border: 1px solid var(--ln);
		background: var(--sf2);
		color: var(--ink);
		font-size: 12px;
		max-width: 190px;
		cursor: pointer;
		outline: none;
	}
	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	@keyframes slideIn {
		from {
			transform: translateX(100%);
		}
		to {
			transform: translateX(0);
		}
	}
</style>
