/* Alert que funciona en el teléfono y en el navegador.
   En React Native Web `Alert.alert` no muestra nada: ahí usamos window.alert / window.confirm. */
import { Alert as RNAlert, Platform, type AlertButton } from 'react-native';

function alert(title: string, message?: string, buttons?: AlertButton[]) {
  if (Platform.OS !== 'web') {
    RNAlert.alert(title, message, buttons);
    return;
  }
  const text = message ? `${title}\n\n${message}` : title;
  const actions = (buttons ?? []).filter((b) => b.style !== 'cancel');
  if (!buttons?.length || !actions.length) {
    window.alert(text);
    buttons?.[0]?.onPress?.();
    return;
  }
  // Web: una sola pregunta sí/no. "Aceptar" ejecuta la acción principal (la primera que no es "cancelar").
  if (window.confirm(text)) actions[0].onPress?.();
  else buttons.find((b) => b.style === 'cancel')?.onPress?.();
}

export const Alert = { alert };
