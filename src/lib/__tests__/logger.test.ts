import { describe, it, expect, vi, afterEach } from 'vitest';
import { logger } from '../logger';

afterEach(() => {
  vi.restoreAllMocks();
  logger.setLevel('debug', true);
  logger.setLevel('info', true);
  logger.setLevel('warn', true);
  logger.setLevel('error', true);
});

describe('logger', () => {
  it('error wird auf console.error mit prefix ausgegeben', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error('scope', 'msg', { a: 1 });
    expect(spy).toHaveBeenCalledWith('[scope]', 'msg', { a: 1 });
  });

  it('debug kann via setLevel deaktiviert werden', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    logger.setLevel('debug', false);
    logger.debug('s', 'no');
    expect(spy).not.toHaveBeenCalled();
  });

  it('warn ist auch bei deaktiviertem debug aktiv', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logger.setLevel('debug', false);
    logger.warn('s', 'hi');
    expect(spy).toHaveBeenCalled();
  });
});
