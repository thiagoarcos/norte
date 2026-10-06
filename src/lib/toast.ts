/* Avisos tipo banner (los "flash" de NORTE): aparecen arriba unos segundos. */
import { useSyncExternalStore } from 'react';

let current: { id: number; text: string } | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function flash(text: string, ms = 5000) {
  current = { id: Date.now(), text };
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => { current = null; emit(); }, ms);
  emit();
}

export function closeFlash() {
  current = null;
  if (timer) clearTimeout(timer);
  emit();
}

const sub = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
const snap = () => current;
export function useFlash() {
  return useSyncExternalStore(sub, snap, snap);
}
