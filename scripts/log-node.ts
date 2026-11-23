// Logger de scripts Node: stdout e logs/app.jsonl, mesma allowlist de src/lib/log.ts.
import { appendFileSync, mkdirSync } from 'node:fs';
import { formatLine, type LogContext, type LogLevel } from '../src/lib/log';

export function logNode(
	level: LogLevel,
	message: string,
	ctx: LogContext = {},
	file = 'logs/app.jsonl'
): string {
	const line = formatLine(level, message, ctx);
	console.log(line);
	mkdirSync('logs', { recursive: true });
	appendFileSync(file, line + '\n');
	return line;
}
