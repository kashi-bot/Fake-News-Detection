import { EventEmitter } from 'node:events';

/**
 * In-process stage bus for SSE progress. Swap for Redis pub/sub when running
 * more than one backend instance.
 */
const emitter = new EventEmitter();
emitter.setMaxListeners(200);

export function publish(verificationId: string, stage: string, detail?: string) {
  emitter.emit(`v:${verificationId}`, stage, detail);
}

export function subscribe(verificationId: string, fn: (stage: string, detail?: string) => void) {
  const key = `v:${verificationId}`;
  emitter.on(key, fn);
  return () => emitter.off(key, fn);
}