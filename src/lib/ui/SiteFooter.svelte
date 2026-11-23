<script lang="ts">
	const version = __APP_VERSION__;
</script>

<footer class="app-footer" data-testid="app-footer">
	<div class="app-footer-brand">
		<span class="app-footer-logo" aria-hidden="true">b</span>
		<span>© 2026 big-caixa</span>
	</div>
	<div class="app-footer-meta">
		<a class="help" href="https://github.com/danielvm-git/big-caixa#big-caixa">Ajuda</a>
		<span class="mono">v{version}</span>
		<span class="app-footer-sep" aria-hidden="true"></span>
		<span>
			Built with
			<a href="https://github.com/danielvm-git/bigpowers" target="_blank" rel="noopener noreferrer">
				BigPowers
			</a>
			by
			<a href="https://github.com/danielvm-git" target="_blank" rel="noopener noreferrer">
				danielvm-git
			</a>
		</span>
		<span class="app-footer-sep" aria-hidden="true"></span>
		<a href="https://github.com/danielvm-git/big-caixa" target="_blank" rel="noopener noreferrer">
			GitHub
		</a>
		<a
			href="https://github.com/danielvm-git/big-caixa/releases/tag/v{version}"
			target="_blank"
			rel="noopener noreferrer"
		>
			Changelog
		</a>
	</div>
</footer>

<style>
	.app-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		flex-wrap: wrap;
		flex-shrink: 0;
		padding: 12px 32px;
		border-top: 1px solid var(--ln);
		font-size: 12px;
		color: var(--mut);
		background: var(--sf);
	}
	.app-footer a {
		color: var(--ink);
		text-decoration: none;
	}
	.app-footer a:hover {
		color: var(--N);
	}
	.app-footer-brand,
	.app-footer-meta {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
	}
	.app-footer-brand {
		gap: 8px;
	}
	.app-footer-meta {
		gap: 12px;
	}
	.app-footer-logo {
		width: 18px;
		height: 18px;
		background: var(--sun);
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--onsun);
		font-size: 10px;
		font-weight: 700;
	}
	.app-footer-sep {
		width: 3px;
		height: 3px;
		border-radius: 50%;
		background: var(--ln);
	}
	.mono {
		font-variant-numeric: tabular-nums;
	}
	.help {
		border: 1px solid var(--ln);
		border-radius: 8px;
		padding: 4px 8px;
		font-size: 12px;
	}
</style>
