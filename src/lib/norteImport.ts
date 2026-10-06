/* Importar los datos de NORTE.
   - En la web, si Vamo se abre donde estaba NORTE (mismo sitio), NORTE dejó todo guardado en
     este navegador (localStorage "nexofit-state-v4"): lo detectamos y se importa con un toque.
   - Si no, desde un archivo de backup (NORTE → Más → Datos → Exportar backup). */
import { Platform } from 'react-native';

import { getState, importNorte, isNorteBackup, type State } from '@/lib/store';

const KEYS = ['nexofit-state-v4', 'nexofit-state-v3', 'nexofit-state-v2', 'nexofit-state-v1'];

export function findNorteInBrowser(): State | null {
  if (Platform.OS !== 'web') return null;
  for (const k of KEYS) {
    try {
      const raw = window.localStorage.getItem(k);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (isNorteBackup(parsed)) return parsed;
    } catch {}
  }
  return null;
}

export function alreadyImported(): boolean {
  return !!getState().importedFromNorte;
}

export function importFromText(text: string): { runs: number } {
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { throw new Error('Ese archivo no es un JSON válido.'); }
  if (!isNorteBackup(parsed)) throw new Error('Ese archivo no es un backup de NORTE.');
  return importNorte(parsed);
}
