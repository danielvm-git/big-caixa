# Threat Model: Epic e02 (Onda 2 — Contrato da Topbar & Taxonomia)

## Scope

- Extracting `Período`, `Escopo`, `Base` and `Mostrando:` chip bar into `LedgerContextBar`.
- Decoupling global header so context bar only displays on ledger-sensitive views (`hoje`, `visao`, `fluxo`, `mes`, `compras`, `ano`, `metas`).
- Reorganizing sidebar taxonomy (`MOM`) into 5 cohesive pillars and removing prototype residues.
- Making "Fechar outubro" button dynamic (`fecharMesLabel`).

## Vulnerability Analysis

| Threat                                   | Likelihood | Impact | Mitigation                                                                                                                                                            |
| :--------------------------------------- | :--------- | :----- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Information Confusion / State Desync** | Medium     | Medium | Isolating `LedgerContextBar` only to views querying ledger rows prevents users from believing global filters alter standalone views (e.g. `Entradas`, `Devem`, `IA`). |
| **XSS / Unsafe HTML**                    | Low        | Low    | All labels (`perLabel`, `escLabel`, `baseLabel`, `fecharMesLabel`) use standard Svelte text interpolation with strict auto-escaping. No `{@html}` used.               |
| **Access Control / Navigation Bypass**   | Low        | Low    | Modifying `MOM` only changes menu navigation links; route access controls and authentication are enforced independently at the route/page layout level.               |

## Verdict

- Net security and UX integrity improvement. Approved for implementation.
