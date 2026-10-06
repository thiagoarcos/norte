/* Apple Health (iPhone) y Health Connect (Android): pasos de hoy, pulso y guardar salidas.
   Son módulos nativos: en Expo Go no existen, así que todo se carga "a demanda" y si no está,
   la función devuelve null en vez de romper la app. Funcionan en la build propia. */
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

import type { RunData } from '@/lib/runTracker';

export const healthSupported =
  Constants.executionEnvironment !== ExecutionEnvironment.StoreClient && (Platform.OS === 'ios' || Platform.OS === 'android');

export type HealthToday = { steps: number | null; heartRate: number | null; restingHr: number | null };

function load<T>(fn: () => T): T | null {
  try { return fn(); } catch { return null; }
}

const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

/* ---------- iPhone: HealthKit ---------- */
// require diferido a propósito: en Expo Go el módulo nativo no existe y el import fallaría al abrir la app
// eslint-disable-next-line @typescript-eslint/no-require-imports
const hk = () => load(() => require('@kingstinct/react-native-healthkit') as typeof import('@kingstinct/react-native-healthkit'));

/* ---------- Android: Health Connect ---------- */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const hc = () => load(() => require('react-native-health-connect') as typeof import('react-native-health-connect'));

/* Pide permisos. Devuelve true si quedó conectado. */
export async function connectHealth(): Promise<boolean> {
  if (!healthSupported) return false;
  if (Platform.OS === 'ios') {
    const k = hk();
    if (!k || !k.isHealthDataAvailable()) return false;
    return k.requestAuthorization({
      toRead: ['HKQuantityTypeIdentifierStepCount', 'HKQuantityTypeIdentifierHeartRate', 'HKQuantityTypeIdentifierRestingHeartRate'],
      toShare: ['HKWorkoutTypeIdentifier', 'HKQuantityTypeIdentifierDistanceWalkingRunning', 'HKQuantityTypeIdentifierActiveEnergyBurned'],
    });
  }
  const h = hc();
  if (!h) return false;
  if ((await h.getSdkStatus()) !== h.SdkAvailabilityStatus.SDK_AVAILABLE) return false;
  await h.initialize();
  const granted = await h.requestPermission([
    { accessType: 'read', recordType: 'Steps' },
    { accessType: 'read', recordType: 'HeartRate' },
    { accessType: 'read', recordType: 'RestingHeartRate' },
    { accessType: 'write', recordType: 'ExerciseSession' },
    { accessType: 'write', recordType: 'Distance' },
    { accessType: 'write', recordType: 'ActiveCaloriesBurned' },
  ]);
  return granted.length > 0;
}

export async function readHealthToday(): Promise<HealthToday | null> {
  if (!healthSupported) return null;
  try {
    if (Platform.OS === 'ios') {
      const k = hk();
      if (!k) return null;
      const [steps, hr, rest] = await Promise.all([
        k.queryStatisticsForQuantity('HKQuantityTypeIdentifierStepCount', ['cumulativeSum'], { filter: { date: { startDate: startOfToday() } }, unit: 'count' }),
        k.getMostRecentQuantitySample('HKQuantityTypeIdentifierHeartRate', 'count/min'),
        k.getMostRecentQuantitySample('HKQuantityTypeIdentifierRestingHeartRate', 'count/min'),
      ]);
      return {
        steps: steps.sumQuantity ? Math.round(steps.sumQuantity.quantity) : 0,
        heartRate: hr ? Math.round(hr.quantity) : null,
        restingHr: rest ? Math.round(rest.quantity) : null,
      };
    }
    const h = hc();
    if (!h) return null;
    await h.initialize();
    const range = { operator: 'between' as const, startTime: startOfToday().toISOString(), endTime: new Date().toISOString() };
    const agg: any = await h.aggregateRecord({ recordType: 'Steps', timeRangeFilter: range });
    const hr = await h.readRecords('HeartRate', { timeRangeFilter: range, ascendingOrder: false, pageSize: 1 });
    const rest = await h.readRecords('RestingHeartRate', { timeRangeFilter: range, ascendingOrder: false, pageSize: 1 });
    const lastHr = hr.records[0]?.samples?.at(-1)?.beatsPerMinute;
    return {
      steps: agg?.COUNT_TOTAL ?? 0,
      heartRate: lastHr ? Math.round(lastHr) : null,
      restingHr: rest.records[0] ? Math.round(rest.records[0].beatsPerMinute) : null,
    };
  } catch {
    return null;
  }
}

/* Guarda una salida terminada en Salud (como entrenamiento de running). */
export async function saveRunToHealth(r: RunData): Promise<boolean> {
  if (!healthSupported || r.km <= 0) return false;
  const start = new Date(r.startedAt);
  const end = new Date(r.startedAt + Math.max(60, r.sec) * 1000);
  try {
    if (Platform.OS === 'ios') {
      const k = hk();
      if (!k) return false;
      await k.saveWorkoutSample(k.WorkoutActivityType.running, [], start, end, { distance: r.km * 1000, energyBurned: r.kcal });
      return true;
    }
    const h = hc();
    if (!h) return false;
    await h.initialize();
    await h.insertRecords([
      { recordType: 'ExerciseSession', exerciseType: h.ExerciseType.RUNNING, title: 'Salida con Vamo', startTime: start.toISOString(), endTime: end.toISOString() },
      { recordType: 'Distance', distance: { value: r.km * 1000, unit: 'meters' }, startTime: start.toISOString(), endTime: end.toISOString() },
      { recordType: 'ActiveCaloriesBurned', energy: { value: r.kcal, unit: 'kilocalories' }, startTime: start.toISOString(), endTime: end.toISOString() },
    ]);
    return true;
  } catch {
    return false;
  }
}
