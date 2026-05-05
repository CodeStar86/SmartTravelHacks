type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isProduction = Deno.env.get('ENVIRONMENT') === 'production';
const sentryDsn = Deno.env.get('SENTRY_DSN');

async function report(level: LogLevel, args: unknown[]) {
  if (!sentryDsn || level === 'debug' || level === 'info') return;
  try {
    await fetch(sentryDsn, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ level, message: args.map(String).join(' '), timestamp: new Date().toISOString() }),
    });
  } catch {
    // Never let monitoring failures affect request handling.
  }
}

function write(level: LogLevel, args: unknown[]) {
  void report(level, args);
  if (isProduction && level !== 'error') return;
  globalThis.console?.[level === 'debug' ? 'debug' : level]?.(...args);
}

export const appLogger = {
  debug: (...args: unknown[]) => write('debug', args),
  info: (...args: unknown[]) => write('info', args),
  log: (...args: unknown[]) => write('info', args),
  warn: (...args: unknown[]) => write('warn', args),
  error: (...args: unknown[]) => write('error', args),
};
