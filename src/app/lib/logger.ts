type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isProduction = import.meta.env.PROD;
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;

function sendToMonitoring(level: LogLevel, args: unknown[]) {
  if (!sentryDsn || level === 'debug' || level === 'info') return;
  // Hook for hosted monitoring. Keep this lightweight so the app does not depend on
  // a specific SDK at runtime; replace with @sentry/react or another provider when configured.
  globalThis.dispatchEvent?.(new CustomEvent('app:client-error', { detail: { level, args } }));
}

function write(level: LogLevel, args: unknown[]) {
  sendToMonitoring(level, args);
  if (isProduction && level !== 'error') return;
  globalThis.console?.[level === 'debug' ? 'debug' : level]?.(...args);
}

export const logger = {
  debug: (...args: unknown[]) => write('debug', args),
  info: (...args: unknown[]) => write('info', args),
  log: (...args: unknown[]) => write('info', args),
  warn: (...args: unknown[]) => write('warn', args),
  error: (...args: unknown[]) => write('error', args),
};
