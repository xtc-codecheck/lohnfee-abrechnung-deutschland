/**
 * Zentraler Logger
 * ─────────────────────────────────────────────────────────────
 * Einheitlicher, abschaltbarer Logging-Layer.
 *
 * - In Production werden nur `warn`/`error` an `console` durchgereicht.
 * - In Development werden alle Stufen geloggt.
 * - Sensible Daten (PII) sollen NICHT direkt geloggt werden – Aufrufer ist
 *   verantwortlich für Anonymisierung.
 * - Der Logger ist bewusst schmal gehalten (kein externer Sink), damit
 *   produktive Aufrufer keinen Bundle-Bloat sehen.
 *
 * Verwendung:
 *   import { logger } from '@/lib/logger';
 *   logger.error('payroll-calc', 'Storno fehlgeschlagen', err);
 */

type Level = 'debug' | 'info' | 'warn' | 'error';

const isProd = typeof import.meta !== 'undefined'
  ? !!(import.meta as ImportMeta & { env?: { PROD?: boolean } }).env?.PROD
  : false;

const ENABLED: Record<Level, boolean> = {
  debug: !isProd,
  info: !isProd,
  warn: true,
  error: true,
};

function emit(level: Level, scope: string, message: string, ...rest: unknown[]) {
  if (!ENABLED[level]) return;
  const prefix = `[${scope}]`;
  // eslint-disable-next-line no-console
  const fn = level === 'error' ? console.error
    : level === 'warn' ? console.warn
    : level === 'info' ? console.info
    : console.debug;
  fn(prefix, message, ...rest);
}

export const logger = {
  debug: (scope: string, message: string, ...rest: unknown[]) => emit('debug', scope, message, ...rest),
  info:  (scope: string, message: string, ...rest: unknown[]) => emit('info', scope, message, ...rest),
  warn:  (scope: string, message: string, ...rest: unknown[]) => emit('warn', scope, message, ...rest),
  error: (scope: string, message: string, ...rest: unknown[]) => emit('error', scope, message, ...rest),
  /** Erlaubt temporäres Aktivieren/Deaktivieren einer Stufe (z.B. in Tests). */
  setLevel(level: Level, enabled: boolean) {
    ENABLED[level] = enabled;
  },
};

export type Logger = typeof logger;
