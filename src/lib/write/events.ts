/** Registro de escrita: append em fato_evento via API ou log local. */
import { log } from '$lib/log';

export function recordFatoEvento(payload: {
	tipo: string;
	entidade_id: string;
	categoria_anterior?: string;
	categoria_nova?: string;
}): void {
	log('info', 'fato_evento', { outcome: payload.tipo, count: 1 });
}
