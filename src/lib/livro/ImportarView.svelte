<script lang="ts">
	import { book } from '$lib/livro/book.svelte';

	let v = $derived(book.view());
</script>

<div style="max-width:900px;display:flex;flex-direction:column;gap:16px;animation:up .3s">
	<h1 style="font:600 28px 'Source Serif 4',serif;margin:0">Importar extratos</h1>
	{#if v.real}
		<p style="margin:0;color:var(--mut);font-size:14px">
			O envio de arquivos roda no Mac (<code>python3 -m livrocaixa import</code>). Aqui vê o
			histórico gravado no livro.
		</p>
	{/if}
	{#if v.sample}
		<div
			style="border:2px dashed var(--ln);border-radius:16px;padding:40px;text-align:center;background:var(--sf)"
		>
			<i class="ph ph-upload-simple" style="font-size:32px"></i>
			<div style="margin-top:6px"><b>Solte aqui</b> os arquivos CSV ou PDF de fatura</div>
		</div>
	{/if}
	<div style={v.card}>
		<b>{v.real ? 'Histórico de importação' : 'Último envio'}</b>
		{#each v.files as f}
			<div
				style="display:grid;grid-template-columns:1fr 120px 100px;gap:10px;padding:10px 0;border-top:1px solid var(--ln);margin-top:8px;font-size:14px"
			>
				<span>{f.n}</span><span style="color:var(--mut)">{f.d}</span><span
					style="color:{f.c};font-weight:600"
				>
					{f.s}
				</span>
			</div>
		{/each}
		{#if v.sample}
			<div
				style="background:var(--mossBg);padding:10px 12px;border-radius:10px;font-size:13px;margin-top:6px"
			>
				Conferência de saldo: Itaú Conta fecha em <b style={v.bl}>R$ 8.214,60</b>, igual ao extrato.
			</div>
		{/if}
	</div>
</div>
