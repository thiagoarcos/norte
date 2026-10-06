/* Foto del plato → calorías estimadas con IA (Claude, vía la función estimate-food de Supabase). */
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { supabase } from '@/lib/supabase';

export type PhotoEstimate = {
  items: { name: string; portion: string; kcal: number; protein: number; carbs: number; fat: number }[];
  total: { kcal: number; protein: number; carbs: number; fat: number };
  confidence: 'alta' | 'media' | 'baja';
  note: string;
  uri: string;
};

/* Saca (o elige) la foto. null si el usuario canceló. */
export async function pickPlatePhoto(source: 'camera' | 'library'): Promise<string | null> {
  if (source === 'camera') {
    const p = await ImagePicker.requestCameraPermissionsAsync();
    if (!p.granted) throw new Error('Necesito permiso de cámara para sacar la foto del plato.');
  }
  const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.8 };
  const res = source === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
  if (res.canceled || !res.assets?.[0]) return null;
  return res.assets[0].uri;
}

export async function estimateFromPhoto(uri: string, comment: string): Promise<PhotoEstimate> {
  if (!supabase) throw new Error('La estimación por foto necesita la cuenta en la nube (Supabase).');
  // achicamos a 1024 px de ancho en JPEG: alcanza para reconocer la comida y viaja rápido
  const ctx = ImageManipulator.manipulate(uri).resize({ width: 1024 });
  const img = await ctx.renderAsync();
  const out = await img.saveAsync({ base64: true, compress: 0.7, format: SaveFormat.JPEG });
  if (!out.base64) throw new Error('No se pudo leer la foto.');
  const { data, error } = await supabase.functions.invoke('estimate-food', {
    body: { image: out.base64, mediaType: 'image/jpeg', comment },
  });
  if (error) {
    let msg = 'No se pudo analizar la foto.';
    try { const j = await (error as any).context?.json?.(); if (j?.error) msg = j.error; } catch {}
    throw new Error(msg);
  }
  return { ...(data as Omit<PhotoEstimate, 'uri'>), uri: out.uri };
}
