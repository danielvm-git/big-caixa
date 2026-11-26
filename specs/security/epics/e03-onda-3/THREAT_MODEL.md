# Threat Model: Epic e03 (Onda 3 — Roteamento Real & Modularização de Stores)

## Scope
- Migrating monolithic `LivroApp.svelte` internal switch to composable `AppShell` with SvelteKit `{@render children()}` routing.
- Mounting domain views into their respective SvelteKit `+page.svelte` files.
- Decoupling `book.svelte.ts` into typed modular stores (`ui.svelte.ts`, `ledger-context.svelte.ts`).

## Vulnerability & Risk Analysis

| Threat | Likelihood | Impact | Mitigation |
| :--- | :--- | :--- | :--- |
| **Auth & Session Route Bypass** | Low | High | All routes wrapped by `+layout.svelte`, where session validation and redirect to `/login/` are enforced prior to mounting any protected view. |
| **State Synchronization Inconsistency** | Low | Medium | Stores maintain centralized reactive state through Svelte 5 runes (`$state`, `$derived`). |
| **XSS / HTML Injection** | Low | Low | All extracted view components use standard text interpolation and UI primitives without `{@html}`. |

## Verdict
- Net architectural improvement. Low security risk. Approved to proceed.
