# Threat Model — Epic e01 (Onda 1: UI Primitives & Privacy)

type: security-threat-model
context: big-caixa/e01-onda-1

## Surface Area

- Frontend Svelte 5 components in `src/lib/ui/` and 4 financial views (`EntradasSpreadsheet`, `DevemView`, `AiSubscriptionsView`, `ViagensFeriasView`).
- No new backend endpoints, no new external dependencies, no auth/session changes.

## Vulnerability Categories & Mitigations

| Category                                   | Risk                       | Finding                                                                                                                                                                                                                | Mitigation                                                                                                                                                    |
| :----------------------------------------- | :------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Sensitive Data Exposure (Privacy Mode)** | **HIGH** (existing defect) | Currently, toggling Privacy Mode (`book.state.priv`) blurs legacy views (`v.bl`), but leaks financial amounts in clear text across `EntradasSpreadsheet`, `DevemView`, `AiSubscriptionsView`, and `ViagensFeriasView`. | Centralize all monetary rendering in `<Money />` which reactively reads `book.state.priv` and applies blur + `user-select: none` when privacy mode is active. |
| **XSS / HTML Injection**                   | LOW                        | Dynamic text props (`title`, `subtitle`, `error`) rendered in `PageHeader` and `DataState`.                                                                                                                            | Never use `{@html ...}` in any `src/lib/ui/` primitive; rely strictly on Svelte's escaped text interpolation.                                                 |
| **Logging of Financial PII**               | LOW                        | `CLAUDE.md` forbids logging values, stores, emails, or tokens.                                                                                                                                                         | Ensure no `console.log` of monetary amounts or user data is added in UI primitives or views.                                                                  |

## Verdict

- Risk level: **LOW** (net security improvement by closing the Privacy Mode exposure gap).
- Approved to proceed.
