import { log } from '$lib/log';

export function trackScreen(route: string, durationMs: number): void {
	log('info', 'screen_view', { route, durationMs });
}

export function trackFilterChange(mes: string, escopo: string): void {
	log('info', 'filter_change', { route: 'global', count: 1, outcome: `${mes}/${escopo}` });
}
