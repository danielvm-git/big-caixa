/** Registro de escrita: API Neon ou log local em dev sem URL. */
import { log } from '$lib/log';
import { caixaWrite } from './caixa';

export function recordFatoEvento(payload: {
	tipo: string;
	entidade_id: string;
	categoria_anterior?: string;
	categoria_nova?: string;
}): void {
	log('info', 'fato_evento', { outcome: payload.tipo, count: 1 });
}

export { caixaWrite };
