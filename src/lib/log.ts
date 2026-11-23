// Log operacional em JSON, uma linha por evento. Só contexto permitido entra na linha:
// nunca valor, loja, descrição, documento, e-mail ou token.
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
	requestId?: string;
	route?: string;
	durationMs?: number;
	release?: string;
	outcome?: string;
	count?: number;
	err?: unknown;
}

const ALLOWED = ['requestId', 'route', 'durationMs', 'release', 'outcome', 'count'] as const;

function serializeErr(err: unknown): { message: string; stack?: string } {
	if (err instanceof Error) {
		return { message: err.name, stack: err.stack };
	}
	return { message: 'non-error thrown' };
}

/** Monta a linha JSON aplicando a allowlist de contexto. */
export function formatLine(
	level: LogLevel,
	message: string,
	ctx: LogContext = {},
	now: Date = new Date()
): string {
	const line: Record<string, unknown> = { level, timestamp: now.toISOString(), message };
	for (const k of ALLOWED) {
		if (ctx[k] !== undefined) line[k] = ctx[k];
	}
	if (ctx.err !== undefined) line.err = serializeErr(ctx.err);
	return JSON.stringify(line);
}

export function log(level: LogLevel, message: string, ctx: LogContext = {}): void {
	console.log(formatLine(level, message, ctx));
}
