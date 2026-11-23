# Probe de CORS e de collection autenticada

Data: 2026-11-23. Servidor: `https://bigbase.click`. Origem do site: `https://big-caixa.bigbase.click`.
Nenhum segredo, e-mail real ou token entra neste arquivo. As chamadas usaram credencial inválida de propósito.

## Comandos

```bash
O=https://big-caixa.bigbase.click
# preflight
curl -i -X OPTIONS https://bigbase.click/api/auth/login \
  -H "Origin: $O" -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type,authorization"
# chamada simples com Origin
curl -i -X POST https://bigbase.click/api/auth/login -H "Origin: $O" \
  -H "content-type: application/json" -d '{"email":"probe@example.invalid","password":"x"}'
# sem Origin (cliente servidor-a-servidor)
curl -i -X POST https://bigbase.click/api/auth/login \
  -H "content-type: application/json" -d '{"email":"probe@example.invalid","password":"x"}'
```

## Resultado

| Chamada                                                           | Resposta                                    |
| ----------------------------------------------------------------- | ------------------------------------------- |
| `OPTIONS /api/auth/login` com `Origin: big-caixa.bigbase.click`   | `403 {"error":"origin not allowed"}`        |
| `OPTIONS /api/auth/me`, `/api/auth/forgot-password`, mesma origem | `403 origin not allowed`                    |
| `GET /api/auth/me` com `Origin`                                   | `403 origin not allowed`                    |
| `POST /api/auth/login` com `Origin`                               | `403 origin not allowed`                    |
| `POST /api/auth/login` sem `Origin`, credencial inválida          | `401 {"error":"invalid email or password"}` |
| `OPTIONS` com `Origin` de sites já no ar (big-bolao, big-library) | `403 origin not allowed`                    |
| `OPTIONS` com `Origin: http://localhost:5173`                     | `403 origin not allowed`                    |
| `GET https://big-caixa.bigbase.click`                             | sem DNS: o site ainda não existe            |

Nenhuma resposta traz `Access-Control-Allow-Origin`.

## Conclusão

1. A API valida o cabeçalho `Origin` contra uma lista e responde 403 a qualquer origem fora dela. Chamadas sem `Origin` (curl, Node, o sync) chegam à API normalmente.
2. Hoje o navegador **não** consegue chamar `bigbase.click/api/auth/*` a partir de `big-caixa.bigbase.click`: o site não está registrado, e a lista de origens é provavelmente por site. Os sites já no ar também não passam em origem cruzada, então a regra não é "qualquer `*.bigbase.click`".
3. Não dá para concluir se o registro do site libera a origem. Isso só se confirma depois da onda 5 (site e segredos). **A coleção autenticada também não foi sondada**, porque não há JWT neste ambiente.
4. Não é impossível. O projeto segue com a limitação documentada abaixo.

## Decisão de implementação

- O cliente fala com `VITE_BIGBASE_URL` (padrão `https://bigbase.click`). O código é o do contrato HTTP descrito no plano: `POST /api/auth/login`, `GET /api/auth/me`.
- O token fica **em memória**. O reload derruba a sessão.
- Se a API responder 403 `origin not allowed` (ou o `fetch` falhar por CORS), a tela de login mostra o erro `origem não autorizada` com a instrução de registrar a origem do site no BigBase. Não há contorno.
- `VITE_AUTH_MODE=mock` e sem token a leitura cai nas fixtures; ambos existem só para desenvolvimento e Playwright. O build de produção usa `bigbase`.
- Alternativa se o BigBase não liberar a origem: um caminho de passagem (`passthrough_paths` da action `bigbase-deploy`) para servir `/api` na mesma origem do site. Está registrada como pendência de produção na onda 5.

## Reexecutar

Depois de registrar o site no BigBase, rode os comandos acima de novo. Esperado: `204` ou `200` com `Access-Control-Allow-Origin: https://big-caixa.bigbase.click`.
