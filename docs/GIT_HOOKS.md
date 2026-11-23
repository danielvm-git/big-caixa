# Git hooks e commits pelo agente

## O que fica no repo

| Hook                 | Função                                                                                       |
| -------------------- | -------------------------------------------------------------------------------------------- |
| `prepare-commit-msg` | Remove `Co-authored-by` / rodapés de IA **antes** do commit gravar                           |
| `commit-msg`         | Conventional Commits, assunto ≤ 72 chars, **proíbe** co-author e texto “generated with … AI” |

Ativar (uma vez por clone):

```bash
bash scripts/setup-git-hooks.sh
```

Isto define só `core.hooksPath` **neste** repositório.

## Estilo e autoria (inalterados)

- Mensagens: `feat|fix|…(scope): subject` (como no CI).
- Histórico público: **sem** `Co-authored-by` de ferramentas.
- O **autor** no `git log` é quem corre `git commit` (a tua identidade git local).

## Por que o agente às vezes não consegue `git commit`

Duas camadas:

1. **Hooks git** (acima) — depois de ativados, mensagens com `-m "fix: …"` limpas **passam**; footers injetados são removidos no `prepare-commit-msg`.
2. **Cursor / Smart Mode (RTK)** — pode **bloquear o comando** antes do git correr se detectar atribuição de agente. Isso **não** é o hook do repo.

### Afrouxar a camada Cursor (para o agente commitar)

No **Cursor Settings**, procura por _co-author_, _attribution_ ou _git_ no contexto do **Agent** e desliga a opção que adiciona **Co-authored-by** (ou equivalente) aos commits do agente.

Alternativas:

- Aprovar o cartão de confirmação quando o agente pede para repetir o `git commit`.
- Continuar a commitar **tu** no terminal integrado (sempre válido).

Não desligues o job **Check no AI agent attribution** no CI — ele garante o mesmo no remoto.

## Commits seguros pelo agente

Peça commits com **uma linha** só, por exemplo:

`fix(deploy): bigbase build script and neon auth fallback`

Sem corpo, sem trailers. Os hooks tratam do resto se alguma ferramenta injetar rodapé.
