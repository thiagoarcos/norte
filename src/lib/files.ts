/* Elegir un archivo del teléfono / compu y leerlo (backup de NORTE, Excel de rutina). */
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { Platform } from 'react-native';

export type Picked = { name: string; text: () => Promise<string>; bytes: () => Promise<ArrayBuffer> };

export async function pickFile(types: string[]): Promise<Picked | null> {
  const res = await DocumentPicker.getDocumentAsync({ type: types, copyToCacheDirectory: true, multiple: false });
  if (res.canceled || !res.assets?.[0]) return null;
  const a = res.assets[0];
  if (Platform.OS === 'web' && a.file) {
    const f = a.file;
    return { name: a.name, text: () => f.text(), bytes: () => f.arrayBuffer() };
  }
  const f = new File(a.uri);
  return { name: a.name, text: () => f.text(), bytes: () => f.arrayBuffer() };
}

/* Descargar / compartir un archivo de texto (backup). */
export async function saveTextFile(name: string, content: string) {
  if (Platform.OS === 'web') {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    return;
  }
  const { Paths } = await import('expo-file-system');
  const f = new File(Paths.cache, name);
  f.write(content);
  const Sharing = await import('expo-sharing').catch(() => null);
  if (Sharing && (await Sharing.isAvailableAsync())) await Sharing.shareAsync(f.uri, { mimeType: 'application/json' });
}
