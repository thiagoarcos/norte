/* Extiende app.json con valores que salen de variables de entorno (no se suben al repo).
   GOOGLE_MAPS_API_KEY: necesaria para que el mapa se vea en Android en la build propia
   (en Expo Go y en iPhone con Apple Maps no hace falta). */
import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  return {
    ...(config as ExpoConfig),
    plugins: [
      ...(config.plugins ?? []),
      ...(key ? [['react-native-maps', { androidGoogleMapsApiKey: key }] as [string, object]] : []),
    ],
  };
};
