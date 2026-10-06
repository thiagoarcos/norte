import { useState, useEffect, useRef, useMemo, useId } from "react";
import {
  Target, Dumbbell, Sun, Moon, Salad, Settings, Trophy, Flame, Zap, Droplet,
  TrendingUp, Apple, Sprout, Lock, Unlock, Bell, Lightbulb, Smartphone, X, Calendar,
  Upload, Award, PersonStanding, Check as CheckIcon, Video, Pencil, AlertTriangle, ScanFace,
  Bot, Send, Pause, Play, Clock, Menu, Mic, Volume2, VolumeX,
  Wallet, Coins, Landmark, DollarSign, LineChart, Plus, RefreshCw, Ghost, Building2,
  ChevronLeft, ChevronRight, Trash2, Home, HeartPulse, Undo2, Hourglass, Footprints, MapPin, Square, Sparkles, Scale,
} from "lucide-react";
import { buildDefaultProgram } from "./defaultProgram";
import {
  estimateFood, runTargetKm, runLevelInfo, RUN_DEFAULTS, haversineKm, acceptPoint, fmtPace, fmtDur,
  computeSplits, downsample, runKcal, weeklySets, plannedSets, saturation, VOLUME,
  navyBodyFat, composition, monthly, fastStatus, fastHours, fastIntervals,
} from "./fitness";
import { BONUS_LESSONS, BONUS_START, BONUS_SUBJECT_ID, bonusDayIndex } from "./bonusGeografia";

/* ============ NORTE (ex NEXO FIT) v4 ============
   Nuevo en v4: mapa muscular interactivo (frente/espalda) en Gym,
   base de ejercicios por músculo con tips de técnica, referencia en
   video, calculadora de sobrecarga progresiva según tu peso corporal
   y agregado directo a la rutina del día que elijas.
======================================== */

const LIGHT = {
  bg: "#F7F8FA", card: "#FFFFFF", ink: "#0A0B10", sub: "#6B7280",
  line: "#EDEEF1", soft: "#F1F2F5", input: "#FAFBFC",
  primary: "#2E5BFF", primarySoft: "#EAF0FF", primaryInk: "#1E3FCC",
  primaryGlow: "rgba(46,91,255,0.35)", accent: "#00D1FF",
  amber: "#F59E0B", amberSoft: "#FEF3E2", amberInk: "#B45309",
  blue: "#00BFFF", blueSoft: "#E5F7FF", red: "#EF4444",
  navBg: "rgba(255,255,255,0.72)", body: "#E4E6EB",
  green: "#16A34A", greenSoft: "#E7F7EC",
};
const DARK = {
  bg: "#08090C", card: "#101116", ink: "#F5F6F8", sub: "#8B8F9A",
  line: "#1E2028", soft: "#16171D", input: "#16171D",
  primary: "#4B7BFF", primarySoft: "#132048", primaryInk: "#A9C0FF",
  primaryGlow: "rgba(75,123,255,0.45)", accent: "#22DAFF",
  amber: "#FBBF24", amberSoft: "#3A2A0B", amberInk: "#FCD34D",
  blue: "#22DAFF", blueSoft: "#0E2A3B", red: "#F87171",
  navBg: "rgba(8,9,12,0.75)", body: "#1E2028",
  green: "#4ADE80", greenSoft: "#0F2A1A",
};
const C = { ...LIGHT };

const FONT = '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif';
const DAYS = ["D", "L", "M", "X", "J", "V", "S"];
const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MONTHS = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const EMOJIS = ["✅","🏋️","💧","😴","📖","🧘","🚶","🥗","💊","🦷","📵","🧠","☀️","🎯"];

const TIPS = [
  "La constancia le gana al talento: 30 minutos hoy valen más que 3 horas el domingo.",
  "Proteína en cada comida: te ayuda a recuperar músculo y a mantenerte saciado.",
  "Dormí 7–8 horas. El músculo crece cuando descansás, no cuando entrenás.",
  "Antes de entrenar, 5–10 min de movilidad reducen mucho el riesgo de lesión.",
  "Sobrecarga progresiva: subí un poquito el peso o las reps cada semana.",
  "Tomá agua apenas te levantás; llegás deshidratado de la noche.",
  "No rompas la cadena: si un día no podés entrenar, hacé la versión mínima (10 min).",
  "Registrá tus pesos en cada ejercicio: lo que se mide, mejora.",
  "Las verduras suman volumen y fibra: te llenan con pocas calorías.",
  "El mejor plan es el que podés sostener 6 meses, no el más extremo.",
  "Caminar 8–10 mil pasos por día acelera la recuperación y quema extra.",
  "Comé despacio: el cerebro tarda ~20 min en registrar saciedad.",
  "Calentá con 1–2 series livianas del primer ejercicio antes de ir al peso real.",
  "Un mal día no arruina nada; una mala semana repetida, sí. Volvé al plan hoy.",
  "Preparar la comida con anticipación evita decisiones impulsivas.",
  "Descansá 2–3 min entre series pesadas y 60–90 s en accesorios.",
  "Pesarte siempre a la misma hora (al despertar) hace comparables los números.",
];

/* ============ PLAN CUT ============
   Basado en la guía "Cómo bajar de un 30 a un 8% de grasa (Guía completa)"
   de Oswal Candela. 3 fases estilo videojuego: misiones diarias, XP y
   calculadoras que se desbloquean al avanzar de fase.               */
const CUT_VIDEO_URL = "https://www.youtube.com/watch?v=mce1xrWLV1E";

const CUT_PHASES = [
  {
    emoji: "🌱", name: "Base sólida", range: "hasta 15% de grasa", target: 15,
    rules: [
      "Déficit sin sufrir: apuntá a tu peso corporal × 22–24 kcal por día.",
      "Proteína 1.5–2 g por kg de peso, todos los días.",
      "Fuerza 3–5 veces por semana para proteger el músculo.",
      "No hace falta ser perfecto: entra alguna comida libre.",
      "Elegí comida que llena mucho con pocas calorías (verduras, carnes magras, papa, fruta).",
    ],
    unlock: "Calculadora rápida de calorías (peso × 22–24)",
  },
  {
    emoji: "🎯", name: "Precisión", range: "15% → 12% de grasa", target: 12,
    rules: [
      "El conteo de calorías deja de ser opcional: pesá los alimentos y registrá todo.",
      "Ultraprocesados casi en cero.",
      "La grasa baja más lento acá: mirá promedios semanales, no días sueltos.",
      "Constancia de semanas: el metabolismo se ajusta y hay que ser paciente.",
    ],
    unlock: "Calculadora completa de macros (Mifflin-St Jeor)",
  },
  {
    emoji: "🔥", name: "Modo shredded", range: "12% → 8% de grasa", target: 8,
    rules: [
      "Precisión extrema entre lo que comés y lo que gastás.",
      "Máxima densidad nutricional en cada comida.",
      "Ayuno intermitente como herramienta opcional.",
      "Eventos sociales: planificá qué vas a comer antes de ir.",
      "Es la fase más dura: energía baja y más sacrificio psicológico son esperables.",
    ],
    unlock: "Herramientas de precisión (ayuno + control fino)",
  },
];

const CUT_TIPS = [
  "Fase 1: no hace falta ser estricto. Enfocate en proteína y déficit; lo perfecto viene después.",
  "Regla rápida para definir: tu peso en kg × 22–24 = tus calorías del día.",
  "Proteína 1.5–2 g/kg todos los días: es lo que salva tu músculo en el déficit.",
  "Llenate con pocas calorías: verduras, papa, carnes magras y frutas ocupan mucho estómago.",
  "En Fase 2 el conteo es obligatorio: pesá los alimentos y registrá todo en la app.",
  "Reducí los ultraprocesados al máximo: gastan tus calorías sin llenarte.",
  "¿La báscula baja más lento debajo del 15%? Es normal, no lo estás haciendo mal.",
  "El cuerpo quema grasa en todo el cuerpo: el abdomen se marca al final (13–15% en hombres).",
  "12–15% de grasa ya es un cuerpo estético, saludable y con vida social. El 8% es opcional.",
  "Fase 3: cada caloría cuenta, hasta las 'probaditas'. Registrá absolutamente todo.",
];

/* ============ BASE DE EJERCICIOS POR MÚSCULO ============
   ratio = 1RM estimado / peso corporal para niveles
   [principiante, intermedio, avanzado]. null = aislamiento o
   peso corporal (se progresa por reps).                      */
const EXDB = {
  pecho: { label: "Pecho", icon: "🫀", exercises: [
    { name: "Press banca con barra", eq: "Barra", ratio: [0.6, 1.0, 1.5],
      tip: "Escápulas retraídas y pies firmes. Bajá la barra al pecho medio con control y empujá en diagonal hacia arriba." },
    { name: "Press inclinado con mancuernas", eq: "Mancuernas", ratio: [0.2, 0.35, 0.5],
      tip: "Banco a 30–45°. Bajá hasta sentir estiramiento en el pecho superior sin que los codos pasen mucho el torso." },
    { name: "Aperturas con mancuernas", eq: "Mancuernas", ratio: null,
      tip: "Codos levemente flexionados y fijos. Es un abrazo amplio: sentí el estiramiento, no busques peso." },
    { name: "Flexiones de brazos", eq: "Peso corporal", ratio: null,
      tip: "Cuerpo en línea recta, manos bajo los hombros. Pecho casi al piso en cada rep." },
    { name: "Fondos en paralelas", eq: "Peso corporal", ratio: null,
      tip: "Inclinándote hacia adelante trabajás más pecho; vertical, más tríceps. Bajá hasta 90° de codo." },
    { name: "Cruce de poleas", eq: "Polea", ratio: null,
      tip: "Paso adelante, torso levemente inclinado. Juntá las manos al frente apretando el pecho 1 segundo." },
    { name: "Press declinado con barra", eq: "Barra", ratio: [0.6, 1.05, 1.55],
      tip: "Banco declinado 15–30°. Enfatiza el pecho inferior; la barra baja a la parte baja del pecho." },
    { name: "Press de pecho en máquina", eq: "Máquina", ratio: null,
      tip: "Ajustá el asiento para que las manijas queden a la altura del pecho medio. Ideal para llegar al fallo con seguridad." },
    { name: "Flexiones diamante", eq: "Peso corporal", ratio: null,
      tip: "Manos juntas formando un diamante bajo el pecho. Trabaja pecho interno y tríceps a fondo." },
  ]},
  hombros: { label: "Hombros", icon: "🪨", exercises: [
    { name: "Press militar con barra", eq: "Barra", ratio: [0.4, 0.65, 0.9],
      tip: "Glúteos y abdomen apretados para no arquear la espalda. La barra sube en línea recta pasando cerca de la cara." },
    { name: "Press con mancuernas sentado", eq: "Mancuernas", ratio: [0.15, 0.3, 0.45],
      tip: "Respaldo casi vertical. Bajá hasta que las mancuernas queden a la altura de las orejas." },
    { name: "Vuelos laterales", eq: "Mancuernas", ratio: null,
      tip: "Peso liviano y codos apenas flexionados. Subí hasta la horizontal como sirviendo dos jarras." },
    { name: "Vuelos posteriores", eq: "Mancuernas", ratio: null,
      tip: "Torso inclinado casi paralelo al piso. Abrí los brazos apretando la parte trasera del hombro." },
    { name: "Face pull", eq: "Polea", ratio: null,
      tip: "Tirá la soga hacia la cara separando las manos al final. Excelente para postura y salud del hombro." },
    { name: "Press Arnold", eq: "Mancuernas", ratio: null,
      tip: "Arrancá con palmas hacia vos y rotá mientras subís. Recorrido largo: usá menos peso que en press normal." },
    { name: "Elevaciones frontales", eq: "Mancuernas", ratio: null,
      tip: "Subí al frente hasta la altura de los ojos, alternando brazos. Sin balanceo del torso." },
    { name: "Press en máquina de hombros", eq: "Máquina", ratio: null,
      tip: "Espalda pegada al respaldo. Perfecta para series pesadas sin comprometer el equilibrio." },
  ]},
  biceps: { label: "Bíceps", icon: "💪", exercises: [
    { name: "Curl con barra", eq: "Barra", ratio: [0.25, 0.45, 0.65],
      tip: "Codos pegados al torso, sin balancear el cuerpo. Bajá lento: la fase negativa construye músculo." },
    { name: "Curl alternado con mancuernas", eq: "Mancuernas", ratio: null,
      tip: "Rotá la muñeca al subir (supinación) para activar el bíceps completo." },
    { name: "Curl martillo", eq: "Mancuernas", ratio: null,
      tip: "Agarre neutro (palmas enfrentadas). Trabaja también el braquial y el antebrazo." },
    { name: "Curl en banco inclinado", eq: "Mancuernas", ratio: null,
      tip: "Brazos colgando detrás del torso: máximo estiramiento. Usá menos peso del habitual." },
    { name: "Curl en polea baja", eq: "Polea", ratio: null,
      tip: "Tensión constante en todo el recorrido. Ideal para terminar con series de 12–15." },
    { name: "Chin-ups (dominadas supinas)", eq: "Peso corporal", ratio: null,
      tip: "Agarre con palmas hacia vos, al ancho de hombros. Uno de los mejores constructores de bíceps." },
    { name: "Curl concentrado", eq: "Mancuerna", ratio: null,
      tip: "Sentado, codo apoyado en la cara interna del muslo. Aislamiento total, cero trampa." },
    { name: "Curl predicador (banco Scott)", eq: "Barra Z", ratio: null,
      tip: "Brazos apoyados en el banco inclinado. No extiendas del todo abajo para proteger el codo." },
  ]},
  antebrazos: { label: "Antebrazos", icon: "🤜", exercises: [
    { name: "Curl de muñeca con barra", eq: "Barra", ratio: null,
      tip: "Antebrazos apoyados en el banco, muñecas por fuera. Movimiento corto y controlado, reps altas (15–20)." },
    { name: "Paseo del granjero", eq: "Mancuernas", ratio: null,
      tip: "Agarrá pesado y caminá derecho 20–40 metros. Fuerza de agarre real para todo." },
    { name: "Curl invertido", eq: "Barra", ratio: null,
      tip: "Agarre con palmas hacia abajo. Trabaja el dorso del antebrazo y el braquiorradial." },
    { name: "Colgarse de la barra", eq: "Peso corporal", ratio: null,
      tip: "Acumulá tiempo colgado (30–60 s por serie). Mejora agarre, hombros y descompresión de columna." },
  ]},
  abdomen: { label: "Abdomen", icon: "🧱", exercises: [
    { name: "Plancha", eq: "Peso corporal", ratio: null,
      tip: "Codos bajo hombros, glúteos apretados, sin hundir la cadera. Sumá 5–10 s por semana." },
    { name: "Crunch en polea", eq: "Polea", ratio: null,
      tip: "De rodillas, enrollá el torso llevando codos hacia las rodillas. El abdomen se entrena con carga también." },
    { name: "Elevación de piernas colgado", eq: "Peso corporal", ratio: null,
      tip: "Subí las piernas sin balancearte, basculando la pelvis al final. Si es difícil, empezá con rodillas al pecho." },
    { name: "Rueda abdominal", eq: "Rueda", ratio: null,
      tip: "Desde rodillas, rodá hasta donde controles sin arquear la zona lumbar. Volvé con el abdomen, no con los brazos." },
    { name: "Pallof press", eq: "Polea", ratio: null,
      tip: "Antirotación: empujá la manija al frente resistiendo que el cable te gire. Oro para el core." },
    { name: "Crunch bicicleta", eq: "Peso corporal", ratio: null,
      tip: "Codo hacia la rodilla contraria alternando, con rotación real del torso, no solo del cuello." },
    { name: "Dead bug", eq: "Peso corporal", ratio: null,
      tip: "Boca arriba, bajá brazo y pierna opuestos sin despegar la zona lumbar del piso." },
  ]},
  oblicuos: { label: "Oblicuos", icon: "🌀", exercises: [
    { name: "Leñador en polea (woodchopper)", eq: "Polea", ratio: null,
      tip: "Movimiento diagonal de arriba-abajo cruzando el cuerpo. Girá desde el torso, con los brazos casi rectos." },
    { name: "Plancha lateral", eq: "Peso corporal", ratio: null,
      tip: "Codo bajo el hombro, cadera alta formando línea recta. Sumá segundos o apoyá pies en banco para progresar." },
    { name: "Russian twist", eq: "Disco/Mancuerna", ratio: null,
      tip: "Sentado con torso a 45°, girá el peso de lado a lado tocando el piso. Pies elevados para más intensidad." },
    { name: "Inclinaciones laterales con mancuerna", eq: "Mancuerna", ratio: null,
      tip: "Una mancuerna en una sola mano; bajá lateral y volvé usando el oblicuo contrario. No uses dos a la vez." },
    { name: "Elevación de rodillas con giro", eq: "Peso corporal", ratio: null,
      tip: "Colgado de la barra, subí las rodillas hacia un hombro alternando lados." },
  ]},
  aductores: { label: "Aductores", icon: "🧲", exercises: [
    { name: "Máquina de aducción", eq: "Máquina", ratio: null,
      tip: "Cerrá las piernas contra la resistencia con pausa de 1 s. Bajá lento; reps de 12–15." },
    { name: "Sentadilla sumo con mancuerna", eq: "Mancuerna", ratio: null,
      tip: "Postura bien ancha, puntas afuera. La mancuerna cuelga entre las piernas; sentí la cara interna del muslo." },
    { name: "Copenhagen plank", eq: "Peso corporal", ratio: null,
      tip: "Plancha lateral con la pierna de arriba apoyada en un banco. El estándar de oro para aductores; empezá con rodilla apoyada." },
    { name: "Zancada lateral", eq: "Peso corporal", ratio: null,
      tip: "Paso amplio hacia el costado bajando la cadera; la pierna estirada trabaja el aductor en estiramiento." },
  ]},
  cuadriceps: { label: "Cuádriceps", icon: "🦵", exercises: [
    { name: "Sentadilla con barra", eq: "Barra", ratio: [0.8, 1.25, 1.75],
      tip: "Pies al ancho de hombros, rodillas siguiendo la punta del pie. Bajá al menos hasta muslos paralelos." },
    { name: "Prensa de piernas", eq: "Máquina", ratio: [1.0, 1.8, 2.5],
      tip: "Bajá controlado hasta 90° sin despegar la cadera del asiento. No bloquees las rodillas arriba." },
    { name: "Zancadas (estocadas)", eq: "Mancuernas", ratio: null,
      tip: "Paso largo, torso erguido, rodilla trasera casi al piso. Alterná piernas o hacé caminando." },
    { name: "Sentadilla búlgara", eq: "Mancuernas", ratio: null,
      tip: "Pie trasero en banco. Brutal para cuádriceps y glúteo con poco peso. Equilibrio primero, carga después." },
    { name: "Extensiones de cuádriceps", eq: "Máquina", ratio: null,
      tip: "Apretá 1 segundo arriba y bajá lento. Ideal para pre-fatigar o terminar la sesión." },
    { name: "Sentadilla goblet", eq: "Mancuerna", ratio: null,
      tip: "Mancuerna al pecho como copa. La mejor para aprender el patrón de sentadilla con técnica limpia." },
    { name: "Hack squat", eq: "Máquina", ratio: null,
      tip: "Espalda apoyada en el respaldo, pies bajos en la plataforma para más cuádriceps. Bajá profundo y controlado." },
    { name: "Sentadilla frontal", eq: "Barra", ratio: [0.6, 1.0, 1.4],
      tip: "Barra apoyada en los hombros delanteros, codos altos. Torso más vertical = más cuádriceps y más core." },
    { name: "Step-up al banco", eq: "Mancuernas", ratio: null,
      tip: "Subí a un banco empujando solo con la pierna de arriba, sin impulso de la de abajo." },
  ]},
  gluteos: { label: "Glúteos", icon: "🍑", exercises: [
    { name: "Hip thrust con barra", eq: "Barra", ratio: [0.8, 1.4, 2.0],
      tip: "Espalda alta apoyada en banco. Empujá con talones y apretá el glúteo arriba 1 segundo, mentón al pecho." },
    { name: "Peso muerto sumo", eq: "Barra", ratio: [0.9, 1.4, 1.9],
      tip: "Postura ancha, puntas hacia afuera. La espalda se mantiene neutra todo el recorrido." },
    { name: "Puente de glúteos", eq: "Peso corporal", ratio: null,
      tip: "Versión en el piso del hip thrust. Perfecto para activar glúteos antes de piernas." },
    { name: "Patada en polea", eq: "Polea", ratio: null,
      tip: "Tobillera en polea baja. Extendé la cadera hacia atrás sin arquear la zona lumbar." },
    { name: "Abducción en máquina", eq: "Máquina", ratio: null,
      tip: "Torso inclinado hacia adelante para más glúteo medio. Reps altas, 15–20." },
  ]},
  isquios: { label: "Isquiotibiales", icon: "🦿", exercises: [
    { name: "Peso muerto rumano", eq: "Barra", ratio: [0.6, 1.0, 1.5],
      tip: "Piernas casi rectas, cadera hacia atrás como cerrando una puerta con la cola. Barra rozando las piernas." },
    { name: "Curl femoral tumbado", eq: "Máquina", ratio: null,
      tip: "Cadera pegada al banco. Subí explosivo, bajá en 3 segundos." },
    { name: "Peso muerto convencional", eq: "Barra", ratio: [1.0, 1.5, 2.0],
      tip: "El rey de la fuerza total. Espalda neutra, barra pegada al cuerpo, empujá el piso con las piernas." },
    { name: "Buenos días", eq: "Barra", ratio: null,
      tip: "Barra en la espalda, bisagra de cadera con rodillas semiflexionadas. Peso liviano y técnica perfecta." },
    { name: "Curl nórdico", eq: "Peso corporal", ratio: null,
      tip: "Caé hacia adelante frenando con los isquios. Durísimo: ayudate con las manos al principio." },
  ]},
  gemelos: { label: "Gemelos", icon: "🐐", exercises: [
    { name: "Elevación de talones de pie", eq: "Máquina", ratio: null,
      tip: "Estiramiento completo abajo (2 s) y pausa arriba (1 s). Los gemelos odian las medias reps." },
    { name: "Elevación de talones sentado", eq: "Máquina", ratio: null,
      tip: "Trabaja el sóleo (fibra lenta): reps altas, 15–25 por serie." },
    { name: "Elevación a una pierna", eq: "Peso corporal", ratio: null,
      tip: "En un escalón, con mancuerna en la mano del mismo lado. Corrige asimetrías." },
  ]},
  trapecio: { label: "Trapecio", icon: "⛰️", exercises: [
    { name: "Encogimientos con barra", eq: "Barra", ratio: null,
      tip: "Subí los hombros hacia las orejas sin rotarlos. Pausa arriba, bajá lento." },
    { name: "Encogimientos con mancuernas", eq: "Mancuernas", ratio: null,
      tip: "Brazos a los costados permiten mayor rango que la barra. Agarre firme o con straps." },
    { name: "Remo al mentón", eq: "Barra", ratio: null,
      tip: "Agarre amplio para cuidar los hombros. Codos siempre por encima de las muñecas." },
  ]},
  espalda: { label: "Espalda (dorsales)", icon: "🦅", exercises: [
    { name: "Dominadas", eq: "Peso corporal", ratio: null,
      tip: "Iniciá el movimiento bajando los omóplatos, pecho hacia la barra. Si no salen, usá banda o jalón." },
    { name: "Remo con barra", eq: "Barra", ratio: [0.5, 0.9, 1.2],
      tip: "Torso inclinado 45°, barra hacia el ombligo. Apretá los omóplatos al final de cada rep." },
    { name: "Jalón al pecho", eq: "Polea", ratio: null,
      tip: "Agarre algo más ancho que hombros. Llevá la barra a la parte alta del pecho sin balancearte." },
    { name: "Remo en polea baja", eq: "Polea", ratio: null,
      tip: "Espalda recta, tirá hacia el abdomen llevando los codos atrás. No uses impulso lumbar." },
    { name: "Remo con mancuerna a un brazo", eq: "Mancuerna", ratio: null,
      tip: "Rodilla y mano apoyadas en banco. Tirá la mancuerna hacia la cadera, no hacia el hombro." },
    { name: "Pullover en polea", eq: "Polea", ratio: null,
      tip: "Brazos casi rectos, llevá la barra desde arriba hasta los muslos. Aísla el dorsal como pocos." },
    { name: "Remo T con apoyo de pecho", eq: "Máquina", ratio: null,
      tip: "El pecho apoyado elimina el impulso lumbar. Apretá los omóplatos 1 s en cada rep." },
    { name: "Dominadas agarre neutro", eq: "Peso corporal", ratio: null,
      tip: "Palmas enfrentadas: la variante más amigable con hombros y codos. Gran transferencia a remo y peso muerto." },
    { name: "Rack pull", eq: "Barra", ratio: null,
      tip: "Peso muerto parcial desde soportes a la altura de las rodillas. Permite sobrecargar la espalda alta con seguridad." },
  ]},
  lumbar: { label: "Zona lumbar", icon: "🛡️", exercises: [
    { name: "Extensiones lumbares (banco 45°)", eq: "Banco", ratio: null,
      tip: "Subí hasta la línea del cuerpo, no hiperextiendas. Sumá disco al pecho cuando sea fácil." },
    { name: "Superman", eq: "Peso corporal", ratio: null,
      tip: "Boca abajo, elevá brazos y piernas a la vez con pausa de 2 s arriba." },
    { name: "Bird dog", eq: "Peso corporal", ratio: null,
      tip: "En cuadrupedia, extendé brazo y pierna opuestos sin rotar la cadera. Estabilidad pura." },
  ]},
  triceps: { label: "Tríceps", icon: "🔱", exercises: [
    { name: "Press francés", eq: "Barra", ratio: null,
      tip: "Acostado, bajá la barra a la frente con codos fijos apuntando al techo." },
    { name: "Extensiones en polea", eq: "Polea", ratio: null,
      tip: "Codos pegados al cuerpo, extendé hasta bloquear apretando el tríceps." },
    { name: "Press banca agarre cerrado", eq: "Barra", ratio: [0.5, 0.85, 1.2],
      tip: "Manos al ancho de hombros, codos cerca del torso. El mejor constructor de masa de tríceps." },
    { name: "Fondos entre bancos", eq: "Peso corporal", ratio: null,
      tip: "Manos en un banco, pies en otro. Bajá hasta 90° de codo; sumá disco en las piernas para progresar." },
    { name: "Extensión sobre la cabeza", eq: "Mancuerna", ratio: null,
      tip: "Una mancuerna con ambas manos detrás de la cabeza. Estira la cabeza larga del tríceps." },
    { name: "Patada de tríceps en polea", eq: "Polea", ratio: null,
      tip: "Torso inclinado, codo fijo pegado al cuerpo; extendé hacia atrás y apretá 1 s arriba." },
    { name: "Extensión con soga", eq: "Polea", ratio: null,
      tip: "Al final del recorrido separá las puntas de la soga hacia afuera para máxima contracción." },
  ]},
};

const FRONT_MUSCLES = ["hombros", "pecho", "biceps", "antebrazos", "abdomen", "oblicuos", "cuadriceps", "aductores"];
const BACK_MUSCLES = ["trapecio", "hombros", "espalda", "triceps", "antebrazos", "lumbar", "gluteos", "isquios", "gemelos"];

/* ---------- utilidades ---------- */
const dstr = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const dayOfYear = (d = new Date()) => Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
const lastNDays = (n) => {
  const out = [];
  for (let i = n - 1; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); out.push(d); }
  return out;
};
const uid = () => Math.random().toString(36).slice(2, 9);
const fmtDate = (key) => {
  const [y, m, d] = key.split("-").map(Number);
  return `${DAY_NAMES[new Date(y, m - 1, d).getDay()].slice(0, 3)} ${d} ${MONTHS[m - 1].slice(0, 3)}`;
};
const ytLink = (name) => `https://www.youtube.com/results?search_query=${encodeURIComponent("como hacer " + name + " técnica")}`;
const fmtClock = (s) => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;
const hm2min = (t) => { const [h, m] = String(t || "0:0").split(":").map(Number); return (h || 0) * 60 + (m || 0); };

/* ---------- PIN de bloqueo ---------- */
const PIN_KEY = "nexofit-pin-hash-v1";
const PIN_SESSION = "nexofit-unlocked";
const PIN_OPTOUT = "nexofit-pin-optout"; // "1" solo si el usuario quitó el PIN a propósito
const BIO_KEY = "nexofit-bio-cred-v1"; // id de la credencial WebAuthn (Face ID / huella)

async function hashPin(pin) {
  const data = new TextEncoder().encode("nexofit-salt:" + pin);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/* Build privada de NORTE: config bakeada.
   OJO: este repo es PÚBLICO — el token y el PIN quedan visibles. Rotar el token si hace falta.
   Token rotado el 2026-09-20 (el anterior quedó expuesto en el repo público). Al desplegar
   esto hay que actualizar TAMBIÉN el secreto AUTH_TOKEN del worker (worker/, wrangler secret
   put AUTH_TOKEN) y, en el teléfono ya instalado, Más → Notificaciones con el token nuevo
   (el valor guardado en el localStorage del teléfono no se actualiza solo). */
const RELAY_URL = "https://nexofit-push.arcossz.workers.dev";
const RELAY_TOKEN = "tilfy89L9iZ6l7RZ2JV4oq4xpt3IxiOa";
// PIN por defecto 4444 = SHA-256 de "nexofit-salt:4444". Se provisiona en el primer
// arranque si no hay PIN y no lo desactivaste a propósito (podés cambiarlo en Más → Seguridad).
const DEFAULT_PIN_HASH = "0dfd3b448fe1bc90a4d2b1a2e2bb8332d924380758640fbd83553cf82e9274e6";
try {
  if (typeof localStorage !== "undefined" && !localStorage.getItem(PIN_KEY) && localStorage.getItem(PIN_OPTOUT) !== "1") {
    localStorage.setItem(PIN_KEY, DEFAULT_PIN_HASH);
  }
} catch (e) { /* ignorar */ }

/* ---------- Face ID / huella vía WebAuthn (bloqueo local del dispositivo) ---------- */
const bioSupported = () =>
  typeof window !== "undefined" && !!window.PublicKeyCredential &&
  !!(navigator.credentials && navigator.credentials.create);
const bioEnrolled = () => { try { return !!localStorage.getItem(BIO_KEY); } catch (e) { return false; } };
const b64uFromBuf = (buf) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const bufFromB64u = (s) => {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(s);
  const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return u.buffer;
};
const randBytes = (n) => { const a = new Uint8Array(n); crypto.getRandomValues(a); return a; };

async function bioEnroll() {
  if (!bioSupported()) throw new Error("Este dispositivo no soporta Face ID / huella acá.");
  const cred = await navigator.credentials.create({
    publicKey: {
      challenge: randBytes(32),
      rp: { name: "NORTE", id: location.hostname },
      user: { id: randBytes(16), name: "norte", displayName: "NORTE" },
      pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
      authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required", residentKey: "preferred" },
      attestation: "none",
      timeout: 60000,
    },
  });
  if (!cred) throw new Error("No se pudo registrar.");
  localStorage.setItem(BIO_KEY, b64uFromBuf(cred.rawId));
  return true;
}

async function bioAuth() {
  const id = bioEnrolled() && localStorage.getItem(BIO_KEY);
  if (!id) throw new Error("No hay Face ID configurado.");
  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge: randBytes(32),
      allowCredentials: [{ type: "public-key", id: bufFromB64u(id), transports: ["internal"] }],
      userVerification: "required",
      rpId: location.hostname,
      timeout: 60000,
    },
  });
  return !!assertion;
}

/* ---------- análisis de sobrecarga progresiva ---------- */
function analyzeLift(ex, weight, reps, bodyWeight) {
  const w = Number(weight) || 0;
  const r = Number(reps) || 0;
  if (!r) return null;
  const e1rm = w > 0 ? Math.round(w * (1 + r / 30)) : null;

  let level = null, nextTarget = null;
  if (ex.ratio && bodyWeight > 0 && e1rm) {
    const rel = e1rm / bodyWeight;
    const [beg, int_, adv] = ex.ratio;
    if (rel < beg) { level = "Iniciando"; nextTarget = Math.round(beg * bodyWeight); }
    else if (rel < int_) { level = "Principiante"; nextTarget = Math.round(int_ * bodyWeight); }
    else if (rel < adv) { level = "Intermedio"; nextTarget = Math.round(adv * bodyWeight); }
    else { level = "Avanzado"; nextTarget = null; }
  }

  let advice, tone;
  if (w === 0) {
    if (r >= 15) { advice = "Dominás el peso corporal: sumá lastre o pasá a una variante más difícil."; tone = "up"; }
    else if (r >= 8) { advice = "Vas bien: sumá 1–2 reps por sesión hasta llegar a 15."; tone = "ok"; }
    else { advice = "Seguí acumulando reps con buena técnica; la fuerza llega con la práctica."; tone = "ok"; }
  } else if (r >= 12) { advice = "¡Subí el peso! Agregá 2,5–5 kg y volvé a un rango de ~8 reps."; tone = "up"; }
  else if (r >= 8) { advice = "Zona ideal de hipertrofia. Sumá 1 rep por sesión y al llegar a 12, subí peso."; tone = "ok"; }
  else if (r >= 5) { advice = "Peso desafiante (fuerza). Mantenelo hasta dominar 8 reps limpias antes de subir."; tone = "hold"; }
  else { advice = "Muy pesado para hipertrofia: bajá un 10 % y priorizá la técnica."; tone = "down"; }

  return { e1rm, level, nextTarget, advice, tone };
}

const tonnage = (ex) => (ex.sets || []).reduce((a, st) => a + (Number(st.weight) || 0) * (Number(st.reps) || 0), 0);

/* ---------- importar rutina desde .xlsx (formato tipo planilla de coach) ----------
   Hojas "SEMANA (N)" con bloques "Día N" seguidos de una fila de encabezados
   y filas de ejercicio: col B=nombre, C=intensidad, D=descanso, luego 6 series
   de 3 columnas (peso, reps, rir) empezando en la columna E.               ---- */
async function parseRoutineWorkbook(file) {
  const XLSX = await import("xlsx");
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const dayHeaderRe = /^d[ií]a\s*(\d+)/i;
  let sheetNames = wb.SheetNames.filter((n) => /semana/i.test(n));
  if (sheetNames.length === 0) sheetNames = wb.SheetNames;

  const weeks = sheetNames.map((name) => {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: false, defval: "" });
    const daysByNum = {};
    let current = null;
    rows.forEach((row) => {
      const b = String(row[1] || "").trim();
      const headerMatch = b.match(dayHeaderRe);
      if (headerMatch) {
        current = { notes: "", exercises: [] };
        daysByNum[parseInt(headerMatch[1], 10)] = current;
        return;
      }
      if (!current) return;
      const exName = b;
      if (!exName || /^ejercicio$/i.test(exName)) return;
      const sets = [];
      for (let s = 0; s < 6; s++) {
        const base = 4 + s * 3;
        sets.push({
          weight: String(row[base] ?? "").trim(),
          reps: String(row[base + 1] ?? "").trim(),
          rir: String(row[base + 2] ?? "").trim(),
        });
      }
      current.exercises.push({
        id: uid(), name: exName,
        intensity: String(row[2] || "").trim(),
        rest: String(row[3] || "").trim(),
        sets,
      });
    });
    const maxDay = Math.max(0, ...Object.keys(daysByNum).map(Number));
    const days = [];
    for (let d = 1; d <= maxDay; d++) {
      const found = daysByNum[d];
      days.push({ name: "", notes: found ? found.notes : "", exercises: found ? found.exercises : [] });
    }
    return { days };
  });

  return { weeks };
}

/* ---------- estado inicial ---------- */
const initialState = {
  theme: "light",
  habits: [
    { id: "h1", name: "Entrenar", icon: "🏋️", days: [1, 2, 3, 4, 5], history: {} },
    { id: "h3", name: "Dormir antes de las 00", icon: "😴", days: [0, 1, 2, 3, 4, 5, 6], history: {} },
  ],
  workoutLog: {},
  sessionLog: {},
  exerciseHistory: {},
  currentWeek: 0,
  currentDay: 0,
  programSeedV: 1, // subir cuando cambie la rutina "de fábrica" para forzar la actualización
  program: buildDefaultProgram(),
  meals: {},
  mealLibrary: [],
  water: {}, // legado: vasos por día (se migra a waterLog)
  waterLog: {}, // { "YYYY-MM-DD": [{ id, ml, t }] }
  waterV: 1,
  fasting: { windows: [] }, // horarios de ayuno: solo los edita el usuario (NEXO no los toca)
  weightLog: {},
  measurements: [],
  notes: {},
  reminders: [
    { id: uid(), text: "Hora de entrenar 💪", time: "18:00", days: [1, 2, 3, 4, 5] },
    { id: uid(), text: "Registrá tu cena 🍽️", time: "21:30", days: [0, 1, 2, 3, 4, 5, 6] },
  ],
  goals: { kcal: 2500, protein: 140, carbs: 300, fat: 80, waterMl: 2000 },
  customTips: [],
  cut: null,
  // Plata: patrimonio en wallets/cuentas. moneda = "USD" | "ARS"; tipo = "crypto" | "pesos" | "inversion"
  // saldo = saldo actual; history = { "YYYY-MM-DD": saldo } (snapshot al actualizar)
  financeSeedV: 1, // subir para re-sembrar la lista de cuentas "de fábrica" (conserva saldos existentes por id)
  finance: {
    usdRate: 1400, // ARS por USD (dólar de referencia para el patrimonio total; editable)
    rateUpdated: null,
    accounts: [
      { id: "acc-astropay", name: "AstroPay", tipo: "crypto", moneda: "USD", saldo: 0, icon: "💸", history: {} },
      { id: "acc-wallbit", name: "Wallbit", tipo: "crypto", moneda: "USD", saldo: 0, icon: "🪙", history: {} },
      { id: "acc-mercadopago", name: "Mercado Pago", tipo: "pesos", moneda: "ARS", saldo: 0, icon: "💳", history: {} },
      { id: "acc-naranjax", name: "Naranja X", tipo: "pesos", moneda: "ARS", saldo: 0, icon: "🍊", history: {} },
      { id: "acc-iol", name: "InvertirOnline", tipo: "inversion", moneda: "ARS", saldo: 0, icon: "📈", history: {} },
    ],
    // Pasivos: deudas en ARS (tarjeta, préstamos…). Restan del patrimonio neto.
    debts: [],
    // Presupuesto mensual (en ARS). tipo = "fijo" | "variable". Arranca con lo estimado para Bariloche compartiendo depto.
    budget: [
      { id: "bud-alquiler", name: "Alquiler", tipo: "fijo", monto: 450000, icon: "🏠" },
      { id: "bud-servicios", name: "Servicios", tipo: "fijo", monto: 100000, icon: "💡" },
      { id: "bud-comida", name: "Comida", tipo: "variable", monto: 380000, icon: "🛒" },
      { id: "bud-transporte", name: "Transporte", tipo: "variable", monto: 60000, icon: "🚌" },
      { id: "bud-varios", name: "Varios y salud", tipo: "variable", monto: 150000, icon: "💊" },
      { id: "bud-ocio", name: "Ocio", tipo: "variable", monto: 120000, icon: "🎉" },
    ],
    // Movimientos del día a día: { id, fecha "YYYY-MM-DD", tipo "ingreso"|"egreso", cat, clase "fijo"|"variable" (egresos), monto, nota }
    movs: [],
    // Meta de ahorro: el progreso es el patrimonio neto (cuentas − pasivos)
    plan: {
      nombre: "Mudanza a Bariloche",
      fecha: "2027-03-02",
      ahorroMensual: 2000000,
      items: [
        { id: "meta-entrada", name: "Entrar al depto (adelanto, depósito, comisión, garantía)", monto: 1700000 },
        { id: "meta-equipo", name: "Equipamiento y mudanza", monto: 1000000 },
        { id: "meta-fondo", name: "Fondo de emergencia (3 meses)", monto: 3700000 },
      ],
    },
  },
  push: { url: RELAY_URL, token: RELAY_TOKEN, enabled: false },
  agendaAlerts: { on: true, lead: 15 }, // avisar `lead` minutos antes de cada bloque
  // Materias: estado = "previa" | "cursando" | "aprobada"; examen = "YYYY-MM-DD" o ""; temas = checklist de unidades
  subjects: [
    {
      id: "sub-geo2", name: "Geografía", curso: "2° año", estado: "previa", examen: "2026-10-26", // mesa entre el 25 y el 30/10: se planifica para el primer día hábil
      // Programa 2022 (prof. Eliana Paz). Libro: "Geografía, Sociedades y Espacios en América y en la Argentina", Santillana 2015.
      temas: [
        "U1 · América: ubicación, límites y divisiones (estructural y socio-cultural)",
        "U1 · Conformación de los territorios: pueblos originarios, coloniales y estatales",
        "U1 · Argentina: ubicación en el mundo, límites, formación del Estado y poblamiento",
        "U1 · Condiciones naturales: relieve, clima, hidrografía y biomas",
        "U2 · Recursos naturales: clasificación, renovables/no renovables, potenciales",
        "U2 · Manejo de recursos: extractivismo, sustentabilidad y cuidado",
        "U2 · Recursos minerales en América Latina, Anglosajona y Argentina",
        "U2 · Agua, suelo y biodiversidad en América y Argentina",
        "U3 · Población: crecimiento e indicadores (natalidad, mortalidad, esperanza de vida)",
        "U3 · Distribución, densidad y migraciones en el continente",
        "U3 · Actividades económicas: clasificación, agropecuarias y extractivas",
        "U3 · Industria, comercio y servicios (estudio de casos)",
        "U4 · Problemas ambientales",
      ].map((text, i) => ({ id: `geo2-t${i + 1}`, text, done: false })),
    },
  ],
  scheduleSeedV: 2, // subir cuando cambie el cronograma "de fábrica" para forzar la actualización
  // Cronograma: who = "yo" | "novia"; day 0=Dom..6=Sáb; end vacío = aviso puntual
  schedule: [
    // Novia
    { id: uid(), who: "novia", title: "Colegio", day: 1, start: "08:00", end: "13:50" },
    { id: uid(), who: "novia", title: "Vóley", day: 1, start: "20:30", end: "22:00" },
    { id: uid(), who: "novia", title: "Colegio", day: 2, start: "08:00", end: "13:00" },
    { id: uid(), who: "novia", title: "Colegio", day: 3, start: "08:00", end: "13:00" },
    { id: uid(), who: "novia", title: "Gimnasia", day: 3, start: "15:20", end: "16:20" },
    { id: uid(), who: "novia", title: "Colegio", day: 4, start: "08:00", end: "13:00" },
    { id: uid(), who: "novia", title: "Colegio", day: 5, start: "08:00", end: "13:00" },
    { id: uid(), who: "novia", title: "Gimnasia", day: 5, start: "17:20", end: "18:20" },
    { id: uid(), who: "novia", title: "Vóley", day: 5, start: "20:30", end: "22:00" },
    // Yo
    { id: uid(), who: "yo", title: "Colegio", day: 1, start: "08:00", end: "17:10" },
    { id: uid(), who: "yo", title: "Colegio", day: 2, start: "08:00", end: "14:20" },
    { id: uid(), who: "yo", title: "Colegio", day: 3, start: "08:00", end: "17:10" },
    { id: uid(), who: "yo", title: "Colegio", day: 4, start: "08:00", end: "13:40" },
    { id: uid(), who: "yo", title: "Colegio", day: 5, start: "08:00", end: "13:00" },
    { id: uid(), who: "yo", title: "Gym (volvemos juntos del vóley)", day: 1, start: "20:30", end: "22:00" },
    { id: uid(), who: "yo", title: "Gym", day: 2, start: "18:00", end: "19:30" },
    { id: uid(), who: "yo", title: "Gym", day: 3, start: "18:00", end: "19:30" },
    { id: uid(), who: "yo", title: "INVAP", day: 4, start: "12:30", end: "16:30" },
    { id: uid(), who: "yo", title: "INVAP", day: 5, start: "12:30", end: "16:30" },
    { id: uid(), who: "yo", title: "Gym (volvemos juntos del vóley)", day: 5, start: "20:30", end: "22:00" },
  ],
};

const STORAGE_KEY = "nexofit-state-v4";
const RUN_LIVE_KEY = "nexofit-run-live-v1"; // salida a correr en curso (GPS)
// Ayunos que empiezan/terminan cerca de `now` (para los avisos)
const fastIntervalsNear = (fasting, now) => fastIntervals((fasting || {}).windows, now, -1, 1);

async function loadState() {
  for (const key of [STORAGE_KEY, "nexofit-state-v3", "nexofit-state-v2", "nexofit-state-v1"]) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignorar */ }
  }
  return null;
}

/* Parsea montos escritos a mano al estilo argentino ("1.700.000", "2500,50"). NaN si no es un número. */
function parseMoney(valor) {
  return Number(String(valor).replace(/[^\d.,-]/g, "").replace(/\./g, "").replace(",", "."));
}

const INGRESO_CATS = ["Sueldo", "Changa", "Venta", "Regalo", "Otro"];
const ymLabel = (ym) => {
  const [y, m] = ym.split("-").map(Number);
  const t = new Date(y, m - 1, 1).toLocaleDateString("es-AR", { month: "long", year: "numeric" });
  return t.charAt(0).toUpperCase() + t.slice(1);
};
const shiftYm = (ym, d) => {
  const [y, m] = ym.split("-").map(Number);
  const nd = new Date(y, m - 1 + d, 1);
  return `${nd.getFullYear()}-${String(nd.getMonth() + 1).padStart(2, "0")}`;
};

/* Formato de plata: USD con hasta 2 decimales, ARS redondeado. */
function fmtMoney(n, moneda) {
  const num = Number(n) || 0;
  if (moneda === "USD") return "US$ " + num.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return "$ " + Math.round(num).toLocaleString("es-AR");
}

/* ============ componentes base ============ */

function Card({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: C.card, borderRadius: 18, padding: 16,
      border: `1px solid ${C.line}`,
      boxShadow: "0 1px 2px rgba(0,0,0,0.03), 0 4px 12px rgba(0,0,0,0.02)",
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ children, right }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", margin: "20px 4px 10px" }}>
      <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: C.sub }}>{children}</div>
      {right}
    </div>
  );
}

function Ring({ pct, size = 120, stroke = 12, color, children }) {
  const col = color || C.primary;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const target = circ * (1 - Math.min(1, Math.max(0, pct)));
  // arranca vacío y se llena al montar / al cambiar el porcentaje
  const [off, setOff] = useState(circ);
  useEffect(() => { const t = setTimeout(() => setOff(target), 60); return () => clearTimeout(t); }, [target, circ]);
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.line} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1)" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {children}
      </div>
    </div>
  );
}

function Check({ done, onClick, color }) {
  const col = color || C.primary;
  return (
    <button onClick={onClick} aria-label={done ? "Desmarcar" : "Marcar"}
      style={{
        width: 30, height: 30, borderRadius: 15, border: done ? "none" : `2px solid ${C.line}`,
        background: done ? col : "transparent", color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0,
        transition: "background 0.2s ease, border-color 0.2s ease, transform 0.12s ease",
        boxShadow: done ? `0 4px 12px ${C.primaryGlow}` : "none",
      }}
      onPointerDown={(e) => { e.currentTarget.style.transform = "scale(0.85)"; }}
      onPointerUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      onPointerLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}>
      {done ? <CheckIcon size={16} strokeWidth={3} style={{ animation: "nortePop 0.32s ease" }} /> : null}
    </button>
  );
}

function Btn({ children, onClick, kind = "primary", small, style }) {
  const base = {
    border: "none", borderRadius: 12, fontWeight: 700, cursor: "pointer", fontFamily: FONT,
    padding: small ? "8px 14px" : "12px 18px", fontSize: small ? 13 : 15, whiteSpace: "nowrap",
    letterSpacing: -0.1,
  };
  const kinds = {
    primary: {
      background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
      color: "#fff",
      boxShadow: `0 4px 14px ${C.primaryGlow}`,
    },
    soft: { background: C.primarySoft, color: C.theme === "dark" ? C.primaryInk : C.primary },
    ghost: { background: "transparent", color: C.sub },
    danger: { background: "transparent", color: C.red },
    dark: { background: C.ink, color: C.bg },
  };
  return <button onClick={onClick}
    onPointerDown={(e) => { e.currentTarget.style.transform = "scale(0.94)"; }}
    onPointerUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
    onPointerLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
    style={{ ...base, transition: "transform 0.12s ease, box-shadow 0.2s ease, filter 0.2s ease", ...kinds[kind], ...style }}>{children}</button>;
}

function Input(props) {
  return (
    <input {...props} style={{
      width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 12,
      border: `1.5px solid ${C.line}`, fontSize: 15, fontFamily: FONT, background: C.input,
      color: C.ink, outline: "none", colorScheme: C.theme === "dark" ? "dark" : "light", ...props.style,
    }} />
  );
}

function DayPicker({ days, onToggle }) {
  return (
    <div style={{ display: "flex", gap: 5 }}>
      {DAYS.map((lbl, i) => (
        <button key={i} onClick={() => onToggle(i)} style={{
          flex: 1, padding: "7px 0", borderRadius: 8, border: "none", cursor: "pointer",
          fontWeight: 700, fontSize: 12, fontFamily: FONT,
          background: days.includes(i) ? C.primarySoft : C.soft,
          color: days.includes(i) ? (C.theme === "dark" ? C.primaryInk : C.primary) : C.sub,
        }}>{lbl}</button>
      ))}
    </div>
  );
}

function PageHeader({ title, subtitle, right }) {
  return (
    <div style={{ padding: "4px 4px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
      <div>
        {subtitle && (
          <div style={{ fontSize: 11.5, fontWeight: 700, color: C.primary, textTransform: "uppercase", letterSpacing: 1.2 }}>
            {subtitle}
          </div>
        )}
        <h1 style={{ margin: "4px 0 0", fontSize: 30, fontWeight: 800, letterSpacing: -0.8, lineHeight: 1.05 }}>{title}</h1>
      </div>
      {right}
    </div>
  );
}

function Segmented({ options, value, onChange }) {
  return (
    <div style={{
      display: "flex", background: C.soft, borderRadius: 14, padding: 4, gap: 4,
      border: `1px solid ${C.line}`,
    }}>
      {options.map(([id, lbl]) => {
        const active = value === id;
        return (
          <button key={id} onClick={() => onChange(id)} style={{
            flex: 1, padding: "9px 4px", borderRadius: 10, border: "none", cursor: "pointer",
            fontWeight: 800, fontSize: 12.5, fontFamily: FONT, letterSpacing: -0.1,
            background: active ? C.card : "transparent",
            color: active ? C.ink : C.sub,
            boxShadow: active ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
            transition: "all 0.15s",
          }}>{lbl}</button>
        );
      })}
    </div>
  );
}

/* ============ ESFERA DE AGUA: se llena con ondas a medida que tomás ============ */
function WaterSphere({ pct, size = 220, children }) {
  const id = useId().replace(/:/g, "");
  const p = Math.max(0, Math.min(1, pct || 0));
  const level = 212 - p * 204; // superficie del agua dentro del círculo (y 8 → 212)
  // 8 tramos de 55 = 4 longitudes de onda de 110; se desplaza 110 para un loop sin saltos
  const wave = (amp) => `M -220 0 q 27.5 ${-amp} 55 0 t 55 0 t 55 0 t 55 0 t 55 0 t 55 0 t 55 0 t 55 0 V 240 H -220 Z`;
  const full = p >= 1;
  return (
    <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
      <svg viewBox="0 0 220 220" width={size} height={size} style={{ display: "block", overflow: "visible" }}>
        <style>{`
          @keyframes wv${id} { from { transform: translateX(0); } to { transform: translateX(110px); } }
          .w1${id} { animation: wv${id} 3.2s linear infinite; }
          .w2${id} { animation: wv${id} 5s linear infinite reverse; }
        `}</style>
        <defs>
          <clipPath id={`c${id}`}><circle cx="110" cy="110" r="102" /></clipPath>
          <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={C.accent} />
            <stop offset="1" stopColor={C.primary} />
          </linearGradient>
        </defs>
        <circle cx="110" cy="110" r="106" fill={C.blueSoft} stroke={full ? C.primary : C.blue} strokeWidth="4" opacity="0.95" />
        <g clipPath={`url(#c${id})`}>
          <g style={{ transform: `translateY(${level}px)`, transition: "transform 0.9s cubic-bezier(.3,1.3,.5,1)" }}>
            <path className={`w2${id}`} d={wave(7)} fill={C.accent} opacity="0.45" transform="translate(0,-4)" />
            <path className={`w1${id}`} d={wave(9)} fill={`url(#g${id})`} />
          </g>
        </g>
        <ellipse cx="72" cy="58" rx="22" ry="12" transform="rotate(-35 72 58)" fill="#fff" opacity="0.35" />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        color: p > 0.5 ? "#fff" : C.ink, textShadow: p > 0.5 ? "0 1px 6px rgba(0,0,0,0.25)" : "none", pointerEvents: "none",
      }}>{children}</div>
    </div>
  );
}

/* ============ GRÁFICOS (SVG liviano, tocá una barra/punto para ver el valor) ============ */
function BarChart({ data, unit = "", height = 150, color, refLine, refLabel, fmt = (v) => v }) {
  const [sel, setSel] = useState(null);
  const W = 320, H = height, padT = 18, padB = 22;
  const vals = data.map((d) => d.value || 0);
  const max = Math.max(1, ...vals, refLine || 0) * 1.12;
  const bw = W / Math.max(1, data.length);
  const barW = Math.min(34, bw - 6);
  const y = (v) => padT + (H - padT - padB) * (1 - v / max);
  const shown = sel ?? data.length - 1;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H, display: "block", overflow: "visible" }}>
        <line x1="0" x2={W} y1={H - padB} y2={H - padB} stroke={C.line} strokeWidth="1" />
        {refLine > 0 && (
          <g>
            <line x1="0" x2={W} y1={y(refLine)} y2={y(refLine)} stroke={C.sub} strokeWidth="1" strokeDasharray="4 4" />
            {refLabel && <text x={W} y={y(refLine) - 4} textAnchor="end" fontSize="10" fill={C.sub} fontWeight="700">{refLabel}</text>}
          </g>
        )}
        {data.map((d, i) => {
          const x = i * bw + (bw - barW) / 2;
          const v = d.value || 0;
          const top = y(v), base = H - padB;
          const r = Math.min(4, (base - top) / 2);
          return (
            <g key={i} onClick={() => setSel(i)} style={{ cursor: "pointer" }}>
              <rect x={i * bw} y={0} width={bw} height={H} fill="transparent" />
              {v > 0 && (
                <path d={`M${x},${base} L${x},${top + r} Q${x},${top} ${x + r},${top} L${x + barW - r},${top} Q${x + barW},${top} ${x + barW},${top + r} L${x + barW},${base} Z`}
                  fill={d.color || color || C.primary} opacity={shown === i ? 1 : 0.55} />
              )}
              <text x={i * bw + bw / 2} y={H - 6} textAnchor="middle" fontSize="10" fill={shown === i ? C.ink : C.sub} fontWeight="700">{d.label}</text>
            </g>
          );
        })}
      </svg>
      {data[shown] && (
        <div style={{ fontSize: 12.5, color: C.sub, fontWeight: 600, marginTop: 4, textAlign: "center" }}>
          <b style={{ color: C.ink }}>{data[shown].title || data[shown].label}</b> · {fmt(data[shown].value || 0)} {unit}{data[shown].note ? ` · ${data[shown].note}` : ""}
        </div>
      )}
    </div>
  );
}

/* Líneas sobre un mismo eje (mismas unidades). series = [{ name, color, points: [{ x: "YYYY-MM-DD", y }] }] */
function TrendChart({ series, unit = "", height = 150 }) {
  const [sel, setSel] = useState(null);
  const W = 320, H = height, padT = 14, padB = 22, padL = 4, padR = 4;
  const xs = [...new Set(series.flatMap((s) => s.points.map((p) => p.x)))].sort();
  const ys = series.flatMap((s) => s.points.map((p) => p.y));
  if (xs.length < 2) return <div style={{ fontSize: 13, color: C.sub, padding: "8px 0" }}>Hacen falta al menos 2 registros para ver la evolución.</div>;
  const lo = Math.min(...ys), hi = Math.max(...ys);
  const span = hi - lo || 1;
  const t0 = new Date(xs[0]).getTime(), t1 = new Date(xs[xs.length - 1]).getTime();
  const px = (x) => padL + ((new Date(x).getTime() - t0) / (t1 - t0 || 1)) * (W - padL - padR);
  const py = (v) => padT + (H - padT - padB) * (1 - (v - lo + span * 0.1) / (span * 1.2));
  const shownX = sel ?? xs[xs.length - 1];
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H, display: "block", overflow: "visible" }}>
        <line x1="0" x2={W} y1={H - padB} y2={H - padB} stroke={C.line} />
        <line x1={px(shownX)} x2={px(shownX)} y1={padT - 6} y2={H - padB} stroke={C.line} strokeWidth="1" />
        {series.map((s) => (
          <g key={s.name}>
            <polyline fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              points={s.points.map((p) => `${px(p.x)},${py(p.y)}`).join(" ")} />
            {s.points.map((p) => (
              <circle key={p.x} cx={px(p.x)} cy={py(p.y)} r={p.x === shownX ? 4.5 : 3} fill={s.color} stroke={C.card} strokeWidth="2" />
            ))}
          </g>
        ))}
        {xs.map((x, i) => {
          const a = i === 0 ? px(x) : (px(xs[i - 1]) + px(x)) / 2;
          const b = i === xs.length - 1 ? px(x) : (px(x) + px(xs[i + 1])) / 2;
          return <rect key={x} x={a - (i === 0 ? 8 : 0)} y={0} width={b - a + (i === 0 || i === xs.length - 1 ? 8 : 0)} height={H} fill="transparent" onClick={() => setSel(x)} style={{ cursor: "pointer" }} />;
        })}
        <text x={2} y={H - 6} fontSize="10" fill={C.sub} fontWeight="700">{xs[0].slice(5).split("-").reverse().join("/")}</text>
        <text x={W - 2} y={H - 6} textAnchor="end" fontSize="10" fill={C.sub} fontWeight="700">{xs[xs.length - 1].slice(5).split("-").reverse().join("/")}</text>
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", fontSize: 12.5, fontWeight: 600, color: C.sub, marginTop: 4 }}>
        <span style={{ color: C.ink, fontWeight: 800 }}>{shownX.slice(5).split("-").reverse().join("/")}</span>
        {series.map((s) => {
          const p = s.points.find((q) => q.x === shownX);
          return (
            <span key={s.name} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color }} />
              {s.name}: <b style={{ color: C.ink }}>{p ? `${p.y}${unit}` : "–"}</b>
            </span>
          );
        })}
      </div>
    </div>
  );
}

/* Trazado de una salida (lat/lon → plano). points = [[lat, lon], ...] */
function RouteSvg({ points, height = 180, live }) {
  if (!points || points.length < 2) {
    return (
      <div style={{ height, borderRadius: 14, background: C.soft, display: "flex", alignItems: "center", justifyContent: "center", color: C.sub, fontSize: 13, fontWeight: 600, gap: 6 }}>
        <MapPin size={15} /> {live ? "Esperando señal de GPS…" : "Sin recorrido"}
      </div>
    );
  }
  const lat0 = points[0][0] * Math.PI / 180;
  const xy = points.map(([la, lo]) => [lo * Math.cos(lat0), -la]);
  const xsA = xy.map((p) => p[0]), ysA = xy.map((p) => p[1]);
  const minX = Math.min(...xsA), maxX = Math.max(...xsA), minY = Math.min(...ysA), maxY = Math.max(...ysA);
  const W = 320, H = height, pad = 14;
  const sc = Math.min((W - 2 * pad) / (maxX - minX || 1e-9), (H - 2 * pad) / (maxY - minY || 1e-9));
  const ox = (W - (maxX - minX) * sc) / 2, oy = (H - (maxY - minY) * sc) / 2;
  const P = xy.map(([x, y]) => [ox + (x - minX) * sc, oy + (y - minY) * sc]);
  const last = P[P.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height, display: "block", borderRadius: 14, background: C.soft }}>
      <polyline fill="none" stroke={C.primary} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" points={P.map((p) => p.join(",")).join(" ")} />
      <circle cx={P[0][0]} cy={P[0][1]} r="5" fill={C.green} stroke={C.card} strokeWidth="2" />
      <circle cx={last[0]} cy={last[1]} r="6" fill={live ? C.amber : C.red} stroke={C.card} strokeWidth="2" />
    </svg>
  );
}

/* ============ MAPA MUSCULAR ============ */
function BodyMap({ side, selected, onSelect, heat }) {
  const sel = (id) => selected === id;
  const P = (id) => ({
    fill: heat ? (heat[id] || C.line) : sel(id) ? C.accent : C.primary,
    opacity: heat ? (sel(id) ? 1 : 0.85) : sel(id) ? 1 : 0.55,
    cursor: "pointer",
    stroke: sel(id) ? C.ink : "none",
    strokeWidth: 1.5,
    onClick: () => onSelect(id),
    style: { transition: "opacity 0.15s" },
  });

  return (
    <svg viewBox="0 0 200 440" style={{ width: "100%", maxWidth: 240, display: "block", margin: "0 auto", filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.06))" }}>
      {/* ===== silueta atlética (torso en V, cintura fina) ===== */}
      <g fill={C.body}>
        {/* cabeza y cuello */}
        <ellipse cx="100" cy="24" rx="14" ry="16" />
        <path d="M90 37 Q100 43 110 37 Q113 47 110 53 Q100 58 90 53 Q87 47 90 37 Z" />
        {/* torso en V: hombros anchos → cintura fina → cadera, siempre en curva */}
        <path d="M58 58 Q100 46 142 58 Q140 78 136 96 Q131 116 123 152 Q124 162 123 170 Q112 178 100 178 Q88 178 77 170 Q76 162 77 152 Q69 116 64 96 Q60 78 58 58 Z" />
        {/* brazo izquierdo con deltoides y taper */}
        <path d="M60 60 Q45 65 42 82 Q39 104 42 124 Q42 144 38 162 Q36 180 34 196 Q40 200 46 199 Q49 182 51 165 Q54 146 53 128 Q55 106 56 88 Q57 70 60 60 Z" />
        {/* brazo derecho */}
        <path d="M140 60 Q155 65 158 82 Q161 104 158 124 Q158 144 162 162 Q164 180 166 196 Q160 200 154 199 Q151 182 149 165 Q146 146 147 128 Q145 106 144 88 Q143 70 140 60 Z" />
        {/* pierna izquierda: muslo → rodilla → gemelo → tobillo */}
        <path d="M77 172 Q69 202 69 234 Q69 264 76 290 Q73 298 74 306 Q71 336 76 364 Q78 388 78 410 Q85 412 93 410 Q94 388 93 366 Q95 338 92 308 Q94 299 96 290 Q101 262 99 234 Q98 204 100 178 Z" />
        {/* pierna derecha */}
        <path d="M123 172 Q131 202 131 234 Q131 264 124 290 Q127 298 126 306 Q129 336 124 364 Q122 388 122 410 Q115 412 107 410 Q106 388 107 366 Q105 338 108 308 Q106 299 104 290 Q99 262 101 234 Q102 204 100 178 Z" />
      </g>

      {side === "front" ? (
        <g>
          {/* hombros (deltoides) */}
          <ellipse cx="56" cy="65" rx="15" ry="14" {...P("hombros")} />
          <ellipse cx="144" cy="65" rx="15" ry="14" {...P("hombros")} />
          {/* pecho: dos placas pectorales */}
          <path d="M76 74 Q98 68 99 92 Q97 105 84 104 Q72 100 73 86 Z" {...P("pecho")} />
          <path d="M124 74 Q102 68 101 92 Q103 105 116 104 Q128 100 127 86 Z" {...P("pecho")} />
          {/* bíceps */}
          <ellipse cx="48" cy="110" rx="8" ry="17" transform="rotate(6 48 110)" {...P("biceps")} />
          <ellipse cx="152" cy="110" rx="8" ry="17" transform="rotate(-6 152 110)" {...P("biceps")} />
          {/* antebrazos */}
          <ellipse cx="42" cy="162" rx="7" ry="21" transform="rotate(4 42 162)" {...P("antebrazos")} />
          <ellipse cx="158" cy="162" rx="7" ry="21" transform="rotate(-4 158 162)" {...P("antebrazos")} />
          {/* abdomen con six-pack */}
          <g {...P("abdomen")}>
            <path d="M87 118 Q86 109 100 109 Q114 109 113 118 Q116 136 113 152 Q112 164 100 166 Q88 164 87 152 Q84 136 87 118 Z" />
          </g>
          <g stroke={C.card} strokeWidth="1.4" opacity={sel("abdomen") ? 0.5 : 0.35} pointerEvents="none">
            <line x1="100" y1="112" x2="100" y2="162" />
            <line x1="87" y1="126" x2="113" y2="126" />
            <line x1="87" y1="140" x2="113" y2="140" />
          </g>
          {/* oblicuos */}
          <path d="M78 114 Q84 116 84 160 Q77 156 74 138 Q74 124 78 114 Z" {...P("oblicuos")} />
          <path d="M122 114 Q116 116 116 160 Q123 156 126 138 Q126 124 122 114 Z" {...P("oblicuos")} />
          {/* cuádriceps: siguen el contorno real del muslo, de la cadera a la rodilla */}
          <path d="M74 184 Q68 210 70 230 Q71 260 77 284 Q85 289 92 284 Q97 260 98 230 Q99 208 96 182 Q85 178 74 184 Z" {...P("cuadriceps")} />
          <path d="M126 184 Q132 210 130 230 Q129 260 123 284 Q115 289 108 284 Q103 260 102 230 Q101 208 104 182 Q115 178 126 184 Z" {...P("cuadriceps")} />
          {/* aductores (cara interna del muslo) */}
          <ellipse cx="94" cy="216" rx="5" ry="28" {...P("aductores")} />
          <ellipse cx="106" cy="216" rx="5" ry="28" {...P("aductores")} />
        </g>
      ) : (
        <g>
          {/* trapecio */}
          <path d="M100 48 Q128 54 128 66 Q122 84 114 96 Q100 88 86 96 Q78 84 72 66 Q72 54 100 48 Z" {...P("trapecio")} />
          {/* hombros posteriores */}
          <ellipse cx="56" cy="65" rx="15" ry="14" {...P("hombros")} />
          <ellipse cx="144" cy="65" rx="15" ry="14" {...P("hombros")} />
          {/* dorsales en V */}
          <path d="M72 94 Q100 90 128 94 Q126 110 121 124 Q100 148 79 124 Q74 110 72 94 Z" {...P("espalda")} />
          {/* tríceps */}
          <ellipse cx="48" cy="110" rx="8" ry="17" transform="rotate(6 48 110)" {...P("triceps")} />
          <ellipse cx="152" cy="110" rx="8" ry="17" transform="rotate(-6 152 110)" {...P("triceps")} />
          {/* antebrazos (vista posterior) */}
          <ellipse cx="42" cy="162" rx="7" ry="21" transform="rotate(4 42 162)" {...P("antebrazos")} />
          <ellipse cx="158" cy="162" rx="7" ry="21" transform="rotate(-4 158 162)" {...P("antebrazos")} />
          {/* lumbar */}
          <path d="M88 148 Q100 144 112 148 Q114 160 112 168 Q100 176 88 168 Q86 160 88 148 Z" {...P("lumbar")} />
          {/* glúteos */}
          <ellipse cx="86" cy="188" rx="15" ry="14" {...P("gluteos")} />
          <ellipse cx="114" cy="188" rx="15" ry="14" {...P("gluteos")} />
          {/* isquiotibiales: mismo contorno de muslo que cuádriceps, vista de atrás */}
          <path d="M74 184 Q68 212 70 232 Q71 262 78 286 Q85 291 92 286 Q98 262 98 232 Q99 210 96 182 Q85 178 74 184 Z" {...P("isquios")} />
          <path d="M126 184 Q132 212 130 232 Q129 262 122 286 Q115 291 108 286 Q102 262 102 232 Q101 210 104 182 Q115 178 126 184 Z" {...P("isquios")} />
          {/* gemelos */}
          <ellipse cx="83" cy="348" rx="10" ry="26" {...P("gemelos")} />
          <ellipse cx="117" cy="348" rx="10" ry="26" {...P("gemelos")} />
        </g>
      )}
    </svg>
  );
}

/* ============ APP ============ */

/* ============ PIN GATE ============
   Pantalla de bloqueo. Si no hay PIN configurado, permite crear uno.
   Si ya existe, pide el PIN para entrar. Al ingresarlo correctamente
   marca la sesión como desbloqueada hasta que se cierre la pestaña.
==================================== */
function PinGate({ theme, onUnlock }) {
  const [mode, setMode] = useState("loading"); // loading | create | enter
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [bio] = useState(() => bioSupported() && bioEnrolled());
  const PAL = theme === "dark" ? DARK : LIGHT;

  useEffect(() => {
    (async () => {
      try {
        const stored = localStorage.getItem(PIN_KEY);
        setMode(stored ? "enter" : "create");
      } catch (e) { setMode("create"); }
    })();
  }, []);

  const doBio = async (auto) => {
    try {
      setError("");
      const ok = await bioAuth();
      if (ok) { sessionStorage.setItem(PIN_SESSION, "1"); onUnlock(); }
    } catch (e) {
      if (!auto) setError("No se pudo con Face ID — usá tu PIN");
    }
  };

  // Al abrir con la app bloqueada y Face ID configurado, lo intentamos solo (silencioso si falla).
  // Diferido con setTimeout para no llamar setState en el cuerpo del effect (renders en cascada).
  useEffect(() => {
    if (mode !== "enter" || !bio) return;
    const t = setTimeout(() => doBio(true), 0);
    return () => clearTimeout(t);
  }, [mode]);

  const handleKey = (k) => {
    setError("");
    if (k === "del") {
      if (mode === "create" && pin.length >= 4 && pin2.length > 0) setPin2(pin2.slice(0, -1));
      else setPin(pin.slice(0, -1));
      return;
    }
    if (mode === "create") {
      if (pin.length < 4) { setPin(pin + k); return; }
      if (pin.length === 4 && pin2.length < 4) setPin2(pin2 + k);
    } else {
      if (pin.length < 4) setPin(pin + k);
    }
  };

  useEffect(() => {
    (async () => {
      if (mode === "create" && pin.length === 4 && pin2.length === 4) {
        if (pin !== pin2) { setError("Los PIN no coinciden"); setPin(""); setPin2(""); return; }
        const h = await hashPin(pin);
        localStorage.setItem(PIN_KEY, h);
        localStorage.removeItem(PIN_OPTOUT);
        sessionStorage.setItem(PIN_SESSION, "1");
        onUnlock();
      }
      if (mode === "enter" && pin.length === 4) {
        const h = await hashPin(pin);
        const stored = localStorage.getItem(PIN_KEY);
        if (h === stored) {
          sessionStorage.setItem(PIN_SESSION, "1");
          onUnlock();
        } else {
          setError("PIN incorrecto");
          setAttempts(attempts + 1);
          setPin("");
        }
      }
    })();
  }, [pin, pin2, mode]);

  if (mode === "loading") return <div style={{ background: PAL.bg, minHeight: "100vh" }} />;

  const shownPin = mode === "create" && pin.length === 4 ? pin2 : pin;
  const title = mode === "create"
    ? (pin.length < 4 ? "Elegí un PIN de 4 dígitos" : "Repetilo para confirmar")
    : "Ingresá tu PIN";

  return (
    <div style={{
      fontFamily: FONT, background: PAL.bg, minHeight: "100vh", color: PAL.ink,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "20px", boxSizing: "border-box", position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: "10%", left: "-20%", width: "80%", height: "60%",
        background: `radial-gradient(circle, ${PAL.primaryGlow} 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "-10%", right: "-20%", width: "80%", height: "50%",
        background: `radial-gradient(circle, ${PAL.primaryGlow} 0%, transparent 70%)`,
        opacity: 0.6, pointerEvents: "none",
      }} />

      <div style={{
        width: 64, height: 64, borderRadius: 18, marginBottom: 16,
        background: `linear-gradient(135deg, ${PAL.primary}, ${PAL.accent})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 12px 32px ${PAL.primaryGlow}`, position: "relative",
      }}>
        <Lock size={28} color="#fff" />
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 4, letterSpacing: -0.5, position: "relative" }}>NORTE</div>
      <div style={{ fontSize: 14, color: PAL.sub, fontWeight: 600, marginBottom: 32, textAlign: "center", maxWidth: 280, position: "relative" }}>
        {title}
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 28, position: "relative" }}>
        {[0, 1, 2, 3].map((i) => {
          const filled = i < shownPin.length;
          return (
            <div key={i} style={{
              width: 18, height: 18, borderRadius: 10,
              background: filled ? `linear-gradient(135deg, ${PAL.primary}, ${PAL.accent})` : "transparent",
              border: `2px solid ${filled ? "transparent" : PAL.line}`,
              boxShadow: filled ? `0 4px 12px ${PAL.primaryGlow}` : "none",
              transition: "all 0.2s",
            }} />
          );
        })}
      </div>

      {error && (
        <div style={{ color: PAL.red, fontSize: 14, fontWeight: 700, marginBottom: 16, minHeight: 20, position: "relative" }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 74px)", gap: 14, position: "relative" }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button key={n} onClick={() => handleKey(String(n))} style={{
            width: 74, height: 74, borderRadius: 22, border: `1px solid ${PAL.line}`,
            background: PAL.card, color: PAL.ink, fontSize: 26, fontWeight: 600,
            fontFamily: FONT, cursor: "pointer",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)",
            transition: "transform 0.1s",
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.95)"}
          onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
          onTouchStart={(e) => e.currentTarget.style.transform = "scale(0.95)"}
          onTouchEnd={(e) => e.currentTarget.style.transform = "scale(1)"}
          >{n}</button>
        ))}
        <div />
        <button onClick={() => handleKey("0")} style={{
          width: 74, height: 74, borderRadius: 22, border: `1px solid ${PAL.line}`,
          background: PAL.card, color: PAL.ink, fontSize: 26, fontWeight: 600,
          fontFamily: FONT, cursor: "pointer",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)",
        }}>0</button>
        <button onClick={() => handleKey("del")} style={{
          width: 74, height: 74, borderRadius: 22, border: "none",
          background: "transparent", color: PAL.sub, fontSize: 22, fontWeight: 700,
          fontFamily: FONT, cursor: "pointer",
        }}>⌫</button>
      </div>

      {mode === "enter" && bio && (
        <button onClick={() => doBio(false)} style={{
          marginTop: 26, display: "flex", alignItems: "center", gap: 8,
          border: `1px solid ${PAL.line}`, background: PAL.card, color: PAL.primary,
          borderRadius: 14, padding: "12px 18px", fontSize: 15, fontWeight: 800,
          fontFamily: FONT, cursor: "pointer", position: "relative",
          boxShadow: `0 4px 16px ${PAL.primaryGlow}`,
        }}>
          <ScanFace size={20} /> Desbloquear con Face ID
        </button>
      )}

      {mode === "enter" && attempts >= 3 && (
        <div style={{ marginTop: 30, textAlign: "center", maxWidth: 300 }}>
          <div style={{ fontSize: 13, color: PAL.sub, marginBottom: 10, lineHeight: 1.5 }}>
            ¿Olvidaste tu PIN? Podés restablecerlo, pero se pierden todos tus datos.
          </div>
          <button onClick={() => {
            if (confirm("¿Borrar todos los datos y restablecer PIN?")) {
              localStorage.clear();
              sessionStorage.clear();
              location.reload();
            }
          }} style={{
            border: "none", background: "transparent", color: PAL.red,
            fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: FONT,
          }}>Restablecer app</button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [state, setState] = useState(initialState);
  const [loaded, setLoaded] = useState(false);
  const [locked, setLocked] = useState(() => {
    try {
      if (sessionStorage.getItem(PIN_SESSION) === "1") return false;
      const hasPin = !!localStorage.getItem(PIN_KEY);
      const optedOut = localStorage.getItem(PIN_OPTOUT) === "1";
      // Acceso prohibido por defecto: bloqueá siempre salvo que se haya quitado el PIN a propósito.
      // Sin PIN y sin opt-out ⇒ primera vez ⇒ obliga a crear uno.
      return hasPin || !optedOut;
    } catch (e) { return false; }
  });
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [bioOn, setBioOn] = useState(bioEnrolled());
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [installHidden, setInstallHidden] = useState(() => {
    try { return localStorage.getItem("nexofit-install-hidden") === "1"; } catch (e) { return false; }
  });
  const [tab, setTab] = useState("hoy");
  const [banner, setBanner] = useState(null);
  const [editHabit, setEditHabit] = useState(null);
  const [habitMonth, setHabitMonth] = useState(null);
  const [exDetail, setExDetail] = useState(null);
  const [editRem, setEditRem] = useState(null);
  const [gymView, setGymView] = useState("rutina");
  const [importingRoutine, setImportingRoutine] = useState(false);
  const fileImportRef = useRef(null);
  const [mapSide, setMapSide] = useState("front");
  const [muscle, setMuscle] = useState(null);
  const [openLift, setOpenLift] = useState(null);
  const [liftCalc, setLiftCalc] = useState({ w: "", r: "" });
  const [timerEnd, setTimerEnd] = useState(null);
  const [timerNow, setTimerNow] = useState(Date.now());
  const [timerTotal, setTimerTotal] = useState(60);
  const [timerPaused, setTimerPaused] = useState(null); // segundos restantes si está en pausa
  const [confirmReset, setConfirmReset] = useState(false);
  const [editAcc, setEditAcc] = useState(null);     // id de cuenta con el panel de edición abierto
  const [saldoDraft, setSaldoDraft] = useState({}); // { [accId]: texto } del input "nuevo saldo"
  const [addingAcc, setAddingAcc] = useState(false);
  const [newAcc, setNewAcc] = useState({ name: "", tipo: "pesos", moneda: "ARS", icon: "💰" });
  const [editRate, setEditRate] = useState(false);
  const [rateDraft, setRateDraft] = useState("");
  const [rateLoading, setRateLoading] = useState(false);
  const [addingWallet, setAddingWallet] = useState(false);
  const [newWallet, setNewWallet] = useState({ name: "Phantom", address: "", icon: "👻" });
  const [walletSyncing, setWalletSyncing] = useState({}); // { [accId]: true } mientras sincroniza
  const [trending, setTrending] = useState([]);      // top movidas de meme coins (CoinGecko, sin login)
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [trendingUpdated, setTrendingUpdated] = useState(null);
  const [addingIol, setAddingIol] = useState(false);
  const [finView, setFinView] = useState("patrimonio"); // patrimonio | mes | meta
  const [agendaView, setAgendaView] = useState("cronograma"); // cronograma | materias
  const [editSubject, setEditSubject] = useState(null);       // id de materia con el panel de edición abierto
  const [temaDraft, setTemaDraft] = useState({});             // { [subjectId]: texto } del input "nuevo tema"
  const [newSubject, setNewSubject] = useState(null);         // borrador de materia nueva (null = cerrado)
  const [finMonth, setFinMonth] = useState(() => dstr().slice(0, 7));
  const [movDraft, setMovDraft] = useState({ tipo: "egreso", monto: "", cat: "", nota: "", fecha: "" });
  const [budgetEdit, setBudgetEdit] = useState(false);
  const [planEdit, setPlanEdit] = useState(false);
  const [debtDraft, setDebtDraft] = useState({ name: "", monto: "" });
  const [iolModal, setIolModal] = useState(null);   // id de cuenta IOL pidiendo credenciales para (re)sincronizar
  const [iolCreds, setIolCreds] = useState({ name: "IOL", user: "", pass: "" }); // nunca se persiste — solo en memoria de la sesión
  const [iolLoading, setIolLoading] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [bonusSel, setBonusSel] = useState(null); // lección de Bonus abierta (null = la de hoy)
  const [loadView, setLoadView] = useState("ejercicios"); // Gym → Músculos: ejercicios | saturacion | volumen
  // Running: salida en curso con GPS. Se guarda en localStorage para no perderla si se recarga la app.
  const [runLive, setRunLive] = useState(() => {
    try {
      const r = JSON.parse(localStorage.getItem(RUN_LIVE_KEY) || "null");
      return r ? { ...r, status: "paused", segStart: null, gap: true } : null;
    } catch (e) { return null; }
  });
  const [, setRunTick] = useState(0);
  const [gpsInfo, setGpsInfo] = useState(null); // { acc, err }
  const [runManual, setRunManual] = useState({ km: "", min: "" });
  const [runOpen, setRunOpen] = useState(null); // id de salida expandida en el historial
  const [runPlanDraft, setRunPlanDraft] = useState(null); // edición del plan
  const watchRef = useRef(null);
  const wakeRef = useRef(null);
  const runSaveRef = useRef(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [kbInset, setKbInset] = useState(0); // alto del teclado en iOS (visualViewport)
  const swipeRef = useRef({ x: 0, y: 0 });
  const importFileRef = useRef(null);
  const [chatMsgs, setChatMsgs] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [listening, setListening] = useState(false); // dictado por voz activo
  const [ttsOn, setTtsOn] = useState(() => {
    try { return localStorage.getItem("nexofit-tts-v1") !== "0"; } catch (e) { return true; }
  }); // lee en voz alta las respuestas de NEXO
  const recogRef = useRef(null);
  const chatScrollRef = useRef(null);
  const firedRef = useRef({});
  const saveTimer = useRef(null);
  const snapTimer = useRef(null); // debounce del sync de estado hacia NEXO

  Object.assign(C, state.theme === "dark" ? DARK : LIGHT, { theme: state.theme });

  const today = dstr();
  const todayDate = new Date();
  const dow = todayDate.getDay();
  const allTips = [...(state.customTips || []), ...(state.cut ? CUT_TIPS : []), ...TIPS];
  const tip = allTips[dayOfYear() % allTips.length];

  useEffect(() => {
    (async () => {
      const s = await loadState();
      if (s) setState((prev) => {
        // Si una semilla quedó vieja, refrescamos ese dato (el resto se conserva).
        const schedStale = (s.scheduleSeedV || 0) < initialState.scheduleSeedV;
        const progStale = (s.programSeedV || 0) < initialState.programSeedV;
        const finStale = (s.financeSeedV || 0) < initialState.financeSeedV;
        // Finanzas: si hay cuentas guardadas las respetamos; si la semilla quedó vieja,
        // sumamos las cuentas "de fábrica" que falten (por id) sin pisar saldos ya cargados.
        const savedFin = s.finance || {};
        const savedAccs = savedFin.accounts || prev.finance.accounts;
        const mergedAccs = finStale
          ? [...savedAccs, ...initialState.finance.accounts.filter((d) => !savedAccs.some((a) => a.id === d.id))]
          : savedAccs;
        return {
          ...prev, ...s,
          goals: { ...prev.goals, ...(s.goals || {}), waterMl: (s.goals && s.goals.waterMl) || ((s.goals && s.goals.water) ? s.goals.water * 250 : prev.goals.waterMl) },
          // Agua: pasa de "hábito + vasos" a ml en la pestaña Salud
          waterLog: s.waterLog || Object.fromEntries(Object.entries(s.water || {}).filter(([, n]) => n > 0)
            .map(([d, n]) => [d, [{ id: uid(), ml: n * 250, t: d + "T12:00" }]])),
          habits: s.waterV ? (s.habits || prev.habits) : (s.habits || prev.habits).filter((h) => !/agua/i.test(h.name)),
          waterV: 1,
          finance: { ...prev.finance, ...savedFin, accounts: mergedAccs },
          financeSeedV: initialState.financeSeedV,
          program: progStale ? initialState.program : (s.program || prev.program),
          programSeedV: initialState.programSeedV,
          schedule: schedStale ? initialState.schedule : (s.schedule || prev.schedule),
          scheduleSeedV: initialState.scheduleSeedV,
        };
      });
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignorar */ }
    }, 500);
  }, [state, loaded]);

  useEffect(() => {
    // Detectar si la app ya está instalada como PWA
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    if (isStandalone) setInstalled(true);

    // Chrome / Android: capturar el evento beforeinstallprompt
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Cuando el usuario efectivamente instala la app
    const installed = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };
    window.addEventListener("appinstalled", installed);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  const triggerInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === "accepted") {
        setInstalled(true);
        setInstallPrompt(null);
      }
    } else {
      // Fallback (iOS Safari no soporta beforeinstallprompt)
      setBanner("En iPhone: tocá Compartir ⬆️ y elegí 'Añadir a pantalla de inicio'");
      setTimeout(() => setBanner(null), 8000);
    }
  };

  useEffect(() => {
    const check = () => {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      state.reminders.forEach((r) => {
        const key = `${r.id}-${dstr(now)}`;
        if (r.time === hhmm && r.days.includes(now.getDay()) && !firedRef.current[key]) {
          firedRef.current[key] = true;
          setBanner(r.text);
          setTimeout(() => setBanner(null), 12000);
        }
      });
      // Avisos de la Agenda: `lead` minutos antes de cada bloque del día
      const aa = state.agendaAlerts || { on: true, lead: 15 };
      if (aa.on) {
        (state.schedule || []).forEach((e) => {
          if (e.day !== now.getDay() || !e.start) return;
          const [hh, mm] = e.start.split(":").map(Number);
          const at = new Date(now); at.setHours(hh || 0, mm || 0, 0, 0);
          const notifyAt = new Date(at.getTime() - (aa.lead || 0) * 60000);
          const nk = `ag-${notifyAt.getHours()}:${notifyAt.getMinutes()}` === `ag-${now.getHours()}:${now.getMinutes()}`;
          const key = `agenda-${e.id}-${dstr(now)}`;
          if (nk && !firedRef.current[key]) {
            firedRef.current[key] = true;
            const who = e.who === "novia" ? "Novia" : "Vos";
            setBanner(`⏰ En ${aa.lead} min · ${e.title} (${e.start})${e.who === "novia" ? " — " + who : ""}`);
            setTimeout(() => setBanner(null), 12000);
          }
        });
      }
      // Ayuno: aviso al empezar y al terminar (dentro del mismo minuto)
      fastIntervalsNear(state.fasting, now).forEach(({ start, end }) => {
        [[start, "🕐 Empieza tu ayuno. Hasta las " + `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}` + ": solo agua, café o té."],
          [end, "🍽️ ¡Terminó tu ayuno! Ya podés comer."]].forEach(([at, msg]) => {
          const key = `fast-${at.getTime()}`;
          if (now >= at && now - at < 60000 && !firedRef.current[key]) {
            firedRef.current[key] = true;
            setBanner(msg);
            setTimeout(() => setBanner(null), 12000);
          }
        });
      });
    };
    const iv = setInterval(check, 20000);
    check();
    return () => clearInterval(iv);
  }, [state.reminders, state.schedule, state.agendaAlerts, state.fasting]);

  /* Temporizador anclado a la hora de fin: aunque iOS congele el JS en segundo
     plano, al volver muestra el tiempo real restante (no se atrasa). */
  const timer = timerEnd ? Math.max(0, Math.ceil((timerEnd - timerNow) / 1000)) : 0;
  useEffect(() => {
    if (!timerEnd) return;
    const iv = setInterval(() => setTimerNow(Date.now()), 500);
    return () => clearInterval(iv);
  }, [timerEnd]);
  useEffect(() => {
    if (timerEnd && timerNow >= timerEnd) {
      setTimerEnd(null);
      setBanner("¡Descanso terminado! Siguiente serie");
      setTimeout(() => setBanner(null), 5000);
    }
  }, [timerNow, timerEnd]);

  const up = (fn) => setState((s) => fn(structuredClone(s)));

  const flash = (msg, ms = 5000) => { setBanner(msg); setTimeout(() => setBanner(null), ms); };

  // Backup local: todo vive solo en el localStorage del teléfono — si se borra Safari o se
  // reinstala la PWA, se pierde. Exportar/importar un JSON es la única red de seguridad.
  const exportData = () => {
    try {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `norte-backup-${today}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      flash("📦 Backup descargado");
    } catch (e) {
      flash("No se pudo generar el backup");
    }
  };
  const importData = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || typeof parsed !== "object" || !parsed.habits) throw new Error("formato inválido");
        if (!confirm("¿Reemplazar todos tus datos actuales con este backup? No se puede deshacer.")) return;
        setState(parsed);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed)); } catch (e) { /* ignorar */ }
        flash("✅ Datos restaurados desde el backup");
      } catch (e) {
        flash("Ese archivo no es un backup válido de NORTE");
      }
    };
    reader.readAsText(file);
  };

  /* ---------- Plata: patrimonio y conversión de moneda ---------- */
  const fin = state.finance || { usdRate: 1400, accounts: [] };
  const usdRate = Number(fin.usdRate) || 1400;
  const accounts = fin.accounts || [];
  const toARS = (a) => (a.moneda === "USD" ? (Number(a.saldo) || 0) * usdRate : (Number(a.saldo) || 0));
  const totalARS = accounts.reduce((sum, a) => sum + toARS(a), 0);
  const totalUSD = usdRate ? totalARS / usdRate : 0;
  const FIN_TIPOS = {
    crypto: { label: "Crypto", Icon: Coins, color: C.amber },
    wallet: { label: "Wallets on-chain", Icon: Ghost, color: "#9945FF" },
    broker: { label: "Brokers", Icon: Building2, color: "#0EA5E9" },
    pesos: { label: "Pesos", Icon: Landmark, color: C.primary },
    inversion: { label: "Inversiones", Icon: LineChart, color: C.accent },
  };
  const FIN_GRUPOS = ["crypto", "wallet", "broker", "pesos", "inversion"];
  const finByTipo = FIN_GRUPOS.map((t) => ({
    tipo: t,
    ...FIN_TIPOS[t],
    accounts: accounts.filter((a) => a.tipo === t),
    totalARS: accounts.filter((a) => a.tipo === t).reduce((s, a) => s + toARS(a), 0),
  })).filter((g) => g.accounts.length);

  // Variación del patrimonio en los últimos 30 días (usando el snapshot más viejo dentro de la ventana)
  const finTrend = (() => {
    const cutoff = dstr(new Date(Date.now() - 30 * 86400000));
    let base = 0, hasBase = false;
    accounts.forEach((a) => {
      const keys = Object.keys(a.history || {}).filter((k) => k >= cutoff).sort();
      if (keys.length) {
        const v = a.history[keys[0]];
        base += a.moneda === "USD" ? (Number(v) || 0) * usdRate : (Number(v) || 0);
        hasBase = true;
      } else {
        base += toARS(a); // sin historial: asumimos que estuvo estable
      }
    });
    if (!hasBase) return null;
    return totalARS - base;
  })();

  // Pasivos y patrimonio neto (lo que tenés menos lo que debés)
  const debts = fin.debts || [];
  const totalDebt = debts.reduce((sum, d) => sum + (Number(d.monto) || 0), 0);
  const netARS = totalARS - totalDebt;

  // Presupuesto (costos fijos/variables) y movimientos (ingresos/egresos), todo en ARS
  const budget = fin.budget || [];
  const movs = fin.movs || [];
  const monthSummary = (ym) => {
    const ms = movs.filter((m) => (m.fecha || "").startsWith(ym));
    const sum = (arr) => arr.reduce((acc, m) => acc + (Number(m.monto) || 0), 0);
    const egr = ms.filter((m) => m.tipo === "egreso");
    const ingresos = sum(ms.filter((m) => m.tipo === "ingreso"));
    const egresos = sum(egr);
    return {
      ms, ingresos, egresos, ahorro: ingresos - egresos,
      fijos: sum(egr.filter((m) => m.clase === "fijo")),
      variables: sum(egr.filter((m) => m.clase !== "fijo")),
      porCat: egr.reduce((acc, m) => { acc[m.cat] = (acc[m.cat] || 0) + (Number(m.monto) || 0); return acc; }, {}),
    };
  };
  const curMonth = today.slice(0, 7);

  // Meta de ahorro (ej: mudanza). El progreso es el patrimonio neto.
  const plan = fin.plan || initialState.finance.plan;
  const planMeta = (plan.items || []).reduce((sum, i) => sum + (Number(i.monto) || 0), 0);
  const planDias = Math.ceil((new Date(plan.fecha + "T00:00:00") - new Date(today + "T00:00:00")) / 86400000);
  const planMeses = planDias > 0 ? Math.max(1, Math.round(planDias / 30.44)) : 0;
  const planFalta = Math.max(0, planMeta - netARS);
  const planPorMes = planMeses ? planFalta / planMeses : planFalta;

  /* ---------- Materias: previas y exámenes ---------- */
  const subjects = state.subjects || [];
  const daysUntil = (fecha) => Math.ceil((new Date(fecha + "T00:00:00") - new Date(today + "T00:00:00")) / 86400000);
  // Exámenes que vienen (de hoy en adelante), el más cercano primero; se muestran en Hoy
  const upcomingExams = subjects
    .filter((m) => m.estado !== "aprobada" && m.examen && daysUntil(m.examen) >= 0)
    .sort((a, b) => a.examen.localeCompare(b.examen));

  // Registrar un nuevo saldo para una cuenta (guarda snapshot del día)
  const setSaldo = (id, valor) => {
    const v = parseMoney(valor);
    if (!Number.isFinite(v)) { flash("Poné un número válido"); return; }
    up((s) => {
      const a = s.finance.accounts.find((x) => x.id === id);
      if (!a) return s;
      a.saldo = v;
      a.history = a.history || {};
      a.history[today] = v;
      return s;
    });
    setSaldoDraft((d) => { const n = { ...d }; delete n[id]; return n; });
    flash("💰 Saldo actualizado");
  };

  // Cotización del dólar blue vía dolarapi.com (pública, sin auth). Si falla (sin internet,
  // API caída) no rompe nada: el usuario puede seguir editando la cotización a mano.
  const fetchUsdRate = async () => {
    setRateLoading(true);
    try {
      const r = await fetch("https://dolarapi.com/v1/dolares/blue");
      const j = await r.json();
      const venta = Number(j && j.venta);
      if (!Number.isFinite(venta) || venta <= 0) throw new Error("respuesta inválida");
      up((s) => { s.finance.usdRate = venta; s.finance.rateUpdated = today; return s; });
      flash("💵 Cotización actualizada (dólar blue)");
    } catch (e) {
      flash("No se pudo traer la cotización — revisá tu conexión o editala a mano");
    }
    setRateLoading(false);
  };
  // Al entrar a "Plata" refresca sola una vez por día (no pega a la API en cada render).
  useEffect(() => {
    if (tab === "plata" && state.finance?.rateUpdated !== today) fetchUsdRate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Wallets on-chain (Phantom/Solana por ahora): lee el saldo directo de la blockchain con
  // la dirección pública, sin login ni API key. Solo cubre el saldo nativo en SOL — tokens
  // SPL/meme coins sueltos no se valúan todavía (necesitaría precio por-token).
  const syncWallet = async (idOrAcc) => {
    const acc = typeof idOrAcc === "string" ? (state.finance.accounts || []).find((a) => a.id === idOrAcc) : idOrAcc;
    if (!acc || !acc.address) return;
    const id = acc.id;
    setWalletSyncing((w) => ({ ...w, [id]: true }));
    try {
      const [balRes, priceRes] = await Promise.all([
        fetch("https://solana-rpc.publicnode.com", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getBalance", params: [acc.address] }),
        }),
        fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"),
      ]);
      const balJson = await balRes.json();
      const priceJson = await priceRes.json();
      const lamports = Number(balJson?.result?.value);
      const solPrice = Number(priceJson?.solana?.usd);
      if (!Number.isFinite(lamports) || !Number.isFinite(solPrice)) throw new Error("respuesta inválida");
      const sol = lamports / 1e9;
      const usd = sol * solPrice;
      up((s) => {
        const a = s.finance.accounts.find((x) => x.id === id);
        if (!a) return s;
        a.saldoSol = sol; a.saldo = usd; a.lastSynced = today;
        a.history = a.history || {}; a.history[today] = usd;
        return s;
      });
      flash(`👻 ${acc.name}: sincronizado (${sol.toFixed(3)} SOL)`);
    } catch (e) {
      flash(`No se pudo sincronizar ${acc.name} — revisá la dirección o probá de nuevo`);
    }
    setWalletSyncing((w) => { const n = { ...w }; delete n[id]; return n; });
  };
  useEffect(() => {
    if (tab !== "plata") return;
    (state.finance.accounts || [])
      .filter((a) => a.tipo === "wallet" && a.address && a.lastSynced !== today)
      .forEach((a) => syncWallet(a.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // IOL (InvertirOnline): usuario/contraseña se piden cada vez y viven solo en memoria de
  // React (state.finance.accounts NUNCA los guarda) — se llama directo desde el navegador
  // a la API oficial de IOL (permite CORS), no pasa por el worker. Al terminar (éxito o
  // error) se limpia iolCreds para no dejar la contraseña pisteada en el estado.
  const syncIol = async (existingId) => {
    const { name, user, pass } = iolCreds;
    if (!user.trim() || !pass) { flash("Poné usuario y contraseña de IOL"); return; }
    setIolLoading(true);
    try {
      const tokRes = await fetch("https://api.invertironline.com/token", {
        method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
        body: `grant_type=password&username=${encodeURIComponent(user)}&password=${encodeURIComponent(pass)}`,
      });
      if (!tokRes.ok) throw new Error("credenciales inválidas");
      const tokJson = await tokRes.json();
      const accessToken = tokJson.access_token;
      if (!accessToken) throw new Error("sin token");

      const cuentaRes = await fetch("https://api.invertironline.com/api/v2/estadocuenta", {
        headers: { authorization: "Bearer " + accessToken },
      });
      if (!cuentaRes.ok) throw new Error("no se pudo leer el estado de cuenta");
      const cuentaJson = await cuentaRes.json();
      // La API de IOL agrupa por cuenta (pesos/dólares/etc). Sumamos el total valorizado
      // de cada una a ARS usando la cotización configurada si viene en USD.
      const cuentas = Array.isArray(cuentaJson?.cuentas) ? cuentaJson.cuentas : [];
      if (!cuentas.length) throw new Error("respuesta sin cuentas — revisá si cambió el formato de la API");
      let totalArs = 0;
      cuentas.forEach((c) => {
        const val = Number(c.total ?? c.totalEnPesos ?? 0);
        totalArs += /usd|dolar/i.test(c.moneda || "") ? val * usdRate : val;
      });

      const id = existingId || uid();
      up((s) => {
        let a = s.finance.accounts.find((x) => x.id === id);
        if (!a) { a = { id, name: name.trim() || "IOL", tipo: "broker", broker: "iol", moneda: "ARS", saldo: 0, icon: "📈", history: {} }; s.finance.accounts.push(a); }
        a.saldo = totalArs; a.lastSynced = today;
        a.history = a.history || {}; a.history[today] = totalArs;
        return s;
      });
      flash(`📈 IOL sincronizado: ${fmtMoney(totalArs, "ARS")}`);
      setIolModal(null); setAddingIol(false);
    } catch (e) {
      flash(`No se pudo sincronizar IOL: ${e.message || "revisá tus credenciales"}`);
    }
    setIolCreds({ name: "IOL", user: "", pass: "" }); // se descarta siempre, haya salido bien o mal
    setIolLoading(false);
  };

  // Tendencias de meme coins (CoinGecko, categoría "meme-token", pública y sin login):
  // los que más subieron/bajaron en 24h. No es un feed de texto tipo X, pero cubre lo mismo
  // que importa acá — qué se está moviendo — sin depender de una API paga.
  const fetchTrending = async () => {
    setTrendingLoading(true);
    try {
      const r = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=meme-token&order=price_change_percentage_24h_desc&per_page=8&price_change_percentage=24h");
      const j = await r.json();
      if (!Array.isArray(j)) throw new Error("respuesta inválida");
      setTrending(j);
      setTrendingUpdated(today);
    } catch (e) {
      flash("No se pudieron traer las tendencias cripto ahora");
    }
    setTrendingLoading(false);
  };
  useEffect(() => {
    if (tab === "plata" && trendingUpdated !== today) fetchTrending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  /* ---------- Notificaciones push (worker/ en Cloudflare) ---------- */
  const cutActive = !!state.cut;
  const pushCfg = {
    url: (state.push && state.push.url) || RELAY_URL,
    token: (state.push && state.push.token) || RELAY_TOKEN,
    enabled: !!(state.push && state.push.enabled),
  };
  const pushReady = !!(pushCfg.enabled && pushCfg.url && pushCfg.token);
  const pushCall = async (path, payload) => {
    if (!pushCfg.url || !pushCfg.token) return null;
    try {
      return await fetch(pushCfg.url.replace(/\/+$/, "") + path, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer " + pushCfg.token },
        body: JSON.stringify(payload || {}),
      });
    } catch (e) { return null; }
  };

  // TTS: lee en voz alta las respuestas de NEXO (Web Speech Synthesis, soportado en Safari/iOS).
  const speak = (text) => {
    if (!ttsOn || !text) return;
    try {
      if (!("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel(); // corta lo que estaba leyendo antes de arrancar lo nuevo
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "es-AR";
      window.speechSynthesis.speak(u);
    } catch (e) { /* ignorar */ }
  };
  const toggleTts = () => {
    setTtsOn((v) => {
      const next = !v;
      try { localStorage.setItem("nexofit-tts-v1", next ? "1" : "0"); } catch (e) { /* ignorar */ }
      if (!next) { try { window.speechSynthesis?.cancel(); } catch (e) { /* ignorar */ } }
      return next;
    });
  };

  // Revisa si llegó una respuesta de NEXO mientras la app estaba cerrada o el chat dejó
  // de esperar (el mensaje sigue guardado en el relay aunque el bridge haya tardado más
  // de los ~70s que espera sendChat). No bloquea: /chat/peek drena sin long-poll.
  const checkPendingReplies = async () => {
    if (!pushCfg.url || !pushCfg.token) return;
    try {
      const pr = await pushCall("/chat/peek");
      if (!pr || !pr.ok) return;
      const pj = await pr.json().catch(() => null);
      for (const rep of (pj && pj.replies) || []) {
        setChatMsgs((m) => [...m, { id: uid(), role: "nexo", text: rep.text }]);
        speak(rep.text);
      }
    } catch (e) { /* ignorar */ }
  };
  useEffect(() => {
    if (showChat) checkPendingReplies();
    const onVis = () => { if (document.visibilityState === "visible") checkPendingReplies(); };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showChat]);

  // Chat con NEXO (asistente) vía el relay del worker. El mensaje queda guardado en el
  // relay (Durable Object) apenas se manda: si NEXO/nexo_bridge.py está offline, no se
  // pierde — lo drena en cuanto se reconecte y checkPendingReplies() lo trae solo.
  const sendChat = async (override) => {
    const text = (typeof override === "string" ? override : chatInput).trim();
    if (!text || chatBusy) return;
    if (!pushCfg.url || !pushCfg.token) {
      flash("Configurá el servidor en Más → Notificaciones para hablar con NEXO");
      return;
    }
    const id = uid();
    setChatMsgs((m) => [...m, { id, role: "me", text }]);
    setChatInput("");
    setChatBusy(true);
    try {
      const r = await pushCall("/chat/send", { id, text });
      if (!r || !r.ok) {
        setChatMsgs((m) => [...m, { id: uid(), role: "nexo", text: "No pude contactar el relay. ¿El servidor está bien configurado en Más?" }]);
        setChatBusy(false);
        return;
      }
      const deadline = Date.now() + 70000; // el bridge + NEXO pueden tardar unos segundos
      let answered = false;
      while (Date.now() < deadline && !answered) {
        const pr = await pushCall("/chat/poll"); // long-poll ~20s en el server
        if (!pr || !pr.ok) break;
        const pj = await pr.json().catch(() => null);
        for (const rep of (pj && pj.replies) || []) {
          if (rep.id === id) { setChatMsgs((m) => [...m, { id: uid(), role: "nexo", text: rep.text }]); speak(rep.text); answered = true; }
        }
      }
      if (!answered) setChatMsgs((m) => [...m, { id: uid(), role: "nexo", text: "NEXO está desconectado ahora mismo. Tu mensaje quedó guardado — en cuanto prendas nexo_bridge.py te va a contestar y te aviso." }]);
    } catch (e) {
      setChatMsgs((m) => [...m, { id: uid(), role: "nexo", text: "Error de conexión." }]);
    }
    setChatBusy(false);
  };

  // Dictado por voz. Donde hay Web Speech (Android/desktop) transcribe en vivo y manda
  // al terminar; en iPhone (sin soporte) enfoca el input para usar el 🎤 del teclado.
  const toggleMic = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      flash("Tocá el 🎤 del teclado para dictarle a NEXO");
      try { document.getElementById("norteChatInput")?.focus(); } catch (e) { /* ignorar */ }
      return;
    }
    if (listening) { try { recogRef.current?.stop(); } catch (e) { /* ignorar */ } return; }
    const r = new SR();
    r.lang = "es-AR"; r.interimResults = true; r.continuous = false;
    r.onresult = (e) => {
      let txt = "", final = false;
      for (let i = 0; i < e.results.length; i++) { txt += e.results[i][0].transcript; if (e.results[i].isFinal) final = true; }
      setChatInput(txt);
      if (final && txt.trim()) setTimeout(() => sendChat(txt), 120);
    };
    r.onend = () => { setListening(false); recogRef.current = null; };
    r.onerror = () => { setListening(false); };
    recogRef.current = r;
    setListening(true);
    try { r.start(); } catch (e) { setListening(false); }
  };

  useEffect(() => {
    if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [chatMsgs, chatBusy, showChat]);

  // iOS PWA: cuando se abre el teclado, la ventana fija NO se achica sola, así que el
  // pie del chat (con el botón enviar) queda tapado. Con visualViewport calculamos el
  // alto del teclado y levantamos el modal esa cantidad.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => setKbInset(Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)));
    vv.addEventListener("resize", onResize);
    vv.addEventListener("scroll", onResize);
    onResize();
    return () => { vv.removeEventListener("resize", onResize); vv.removeEventListener("scroll", onResize); };
  }, []);

  // Comandos que NEXO manda a la app (crear/borrar bloques de Agenda, recordatorios)
  const applyCmd = (c) => {
    if (!c || !c.type) return;
    if (c.type === "agenda_add") {
      up((s) => { s.schedule = [...(s.schedule || []), { id: uid(), who: c.who === "novia" ? "novia" : "yo", title: c.title || "Bloque", day: Number(c.day) || 0, start: c.start || "18:00", end: c.end || "" }]; return s; });
      flash(`🤖 NEXO agregó a tu agenda: ${c.title || "bloque"}${c.start ? " · " + c.start : ""}`);
    } else if (c.type === "agenda_remove") {
      up((s) => { s.schedule = (s.schedule || []).filter((e) => !(e.day === Number(c.day) && (!c.title || (e.title || "").toLowerCase().includes(String(c.title).toLowerCase())))); return s; });
      flash(`🤖 NEXO sacó de tu agenda: ${c.title || "un bloque"}`);
    } else if (c.type === "reminder_add") {
      up((s) => { s.reminders = [...(s.reminders || []), { id: uid(), text: c.text || "Recordatorio", time: c.time || "18:00", days: Array.isArray(c.days) && c.days.length ? c.days : [0, 1, 2, 3, 4, 5, 6] }]; return s; });
      flash(`🤖 NEXO agregó un recordatorio: ${c.text || ""}`);
    } else if (c.type === "water_add") {
      const ml = Math.max(50, Math.min(3000, Number(c.ml) || (Math.max(1, Math.min(20, Number(c.n) || 1)) * 250)));
      addWater(ml);
      flash(`🤖 NEXO sumó ${ml} ml de agua 💧`);
    } else if (c.type === "weight_set") {
      const kg = Number(String(c.kg).replace(",", "."));
      if (kg > 0) { up((s) => { s.weightLog[today] = kg; return s; }); flash(`🤖 NEXO registró tu peso: ${kg} kg`); }
    } else if (c.type === "habit_done") {
      const q = String(c.query || "").toLowerCase().trim();
      up((s) => {
        const h = (s.habits || []).find((x) => q && x.name.toLowerCase().includes(q));
        if (h) h.history[today] = true;
        return s;
      });
      flash(`🤖 NEXO marcó tu hábito${q ? ": " + c.query : ""} ✅`);
    } else if (c.type === "train_done") {
      up((s) => {
        const wk = s.program?.weeks?.[s.currentWeek];
        const day = wk && wk.days[s.currentDay];
        s.workoutLog[today] = s.workoutLog[today] || {};
        s.sessionLog[today] = s.sessionLog[today] || [];
        if (day) day.exercises.forEach((ex) => {
          if (!s.workoutLog[today][ex.id]) {
            s.workoutLog[today][ex.id] = true;
            s.sessionLog[today].push({ id: ex.id, name: ex.name, setsCount: (ex.sets || []).length, tonnage: 0 });
          }
        });
        if (!s.sessionLog[today].length) s.sessionLog[today].push({ id: uid(), name: "Entreno", setsCount: 0, tonnage: 0 });
        return s;
      });
      flash("🤖 NEXO marcó tu entreno de hoy 💪");
    } else if (c.type === "meal_add") {
      up((s) => {
        s.meals[today] = s.meals[today] || [];
        s.meals[today].push({ id: uid(), name: c.name || "Comida", kcal: Number(c.kcal) || 0, protein: Number(c.protein) || 0, carbs: Number(c.carbs) || 0, fat: Number(c.fat) || 0 });
        return s;
      });
      flash(`🤖 NEXO registró una comida${c.name ? ": " + c.name : ""} 🍽️`);
    }
  };

  useEffect(() => {
    if (!pushCfg.url || !pushCfg.token) return; // alcanza con el relay configurado (no requiere notis)
    let alive = true;
    (async () => {
      while (alive) {
        const r = await pushCall("/cmd/poll"); // long-poll ~20s
        if (!alive) break;
        if (!r || !r.ok) { await new Promise((res) => setTimeout(res, 3000)); continue; }
        const j = await r.json().catch(() => null);
        for (const c of (j && j.commands) || []) applyCmd(c);
      }
    })();
    return () => { alive = false; };
  }, [pushCfg.url, pushCfg.token]);

  const schedulePush = (at) => {
    if (pushReady)
      pushCall("/schedule", {
        id: "timer", at,
        title: "⏱️ ¡Descanso terminado!", body: "Siguiente serie 💪", ttl: 120,
      });
  };
  const startTimer = (secs) => {
    setTimerPaused(null);
    setTimerTotal(secs);
    setTimerNow(Date.now());
    const end = Date.now() + secs * 1000;
    setTimerEnd(end);
    schedulePush(end);
  };
  const stopTimer = () => {
    setTimerEnd(null);
    setTimerPaused(null);
    if (pushReady) pushCall("/cancel", { id: "timer" });
  };
  const pauseTimer = () => {
    if (!timerEnd) return;
    setTimerPaused(Math.max(1, Math.ceil((timerEnd - Date.now()) / 1000)));
    setTimerEnd(null);
    if (pushReady) pushCall("/cancel", { id: "timer" });
  };
  const resumeTimer = () => {
    if (!timerPaused) return;
    setTimerNow(Date.now());
    const end = Date.now() + timerPaused * 1000;
    setTimerEnd(end);
    setTimerPaused(null);
    schedulePush(end);
  };
  const addTimer = (secs) => {
    if (!timerEnd) return;
    const end = timerEnd + secs * 1000;
    setTimerEnd(end);
    setTimerTotal((t) => t + secs);
    schedulePush(end);
  };

  const b64ToU8 = (s) => {
    const pad = "=".repeat((4 - (s.length % 4)) % 4);
    const raw = atob((s + pad).replace(/-/g, "+").replace(/_/g, "/"));
    return Uint8Array.from(raw, (c) => c.charCodeAt(0));
  };

  const enablePush = async () => {
    if (!pushCfg.url || !pushCfg.token) return flash("Completá la URL y el token del servidor primero");
    if (!("serviceWorker" in navigator) || !("PushManager" in window))
      return flash("Este navegador no soporta push. En iPhone: instalá la app en la pantalla de inicio (iOS 16.4+).", 8000);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return flash("Permiso de notificaciones denegado");
      const reg = await navigator.serviceWorker.ready;
      const vr = await fetch(pushCfg.url.replace(/\/+$/, "") + "/vapid");
      const { publicKey } = await vr.json();
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToU8(publicKey) });
      const r = await pushCall("/subscribe", { subscription: sub.toJSON() });
      if (r && r.ok) {
        up((s) => { s.push = { ...pushCfg, enabled: true }; return s; });
        flash("✅ Notificaciones activadas en este teléfono");
      } else {
        flash("El servidor rechazó la suscripción. Revisá la URL y el token.");
      }
    } catch (e) {
      flash("Error activando push: " + e.message, 8000);
    }
  };

  const disablePush = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
    } catch (e) { /* sin SW en dev */ }
    up((s) => { s.push = { ...pushCfg, enabled: false }; return s; });
    flash("Notificaciones desactivadas");
  };

  /* Con push activo, agenda en el worker los recordatorios de las próximas 48 h
     (ids deterministas por recordatorio+fecha → re-agendar es idempotente). */
  useEffect(() => {
    if (!pushReady) return;
    const items = [];
    for (let off = 0; off < 2; off++) {
      const d = new Date();
      d.setDate(d.getDate() + off);
      const ds = dstr(d);
      state.reminders.forEach((r) => {
        if (!r.days.includes(d.getDay())) return;
        const [hh, mm] = String(r.time || "0:0").split(":").map(Number);
        const t = new Date(d);
        t.setHours(hh || 0, mm || 0, 0, 0);
        if (t.getTime() > Date.now())
          items.push({ id: `rem-${r.id}-${ds}`, at: t.getTime(), title: "NORTE", body: r.text, ttl: 1800 });
      });
      // Bloques de la Agenda: push `lead` min antes
      const aa = state.agendaAlerts || { on: true, lead: 15 };
      if (aa.on) {
        (state.schedule || []).forEach((e) => {
          if (e.day !== d.getDay() || !e.start) return;
          const [hh, mm] = e.start.split(":").map(Number);
          const t = new Date(d);
          t.setHours(hh || 0, mm || 0, 0, 0);
          const at = t.getTime() - (aa.lead || 0) * 60000;
          if (at > Date.now()) {
            const rango = e.end ? `${e.start}–${e.end}` : e.start;
            items.push({
              id: `agenda-${e.id}-${ds}`, at, ttl: 1800,
              title: e.who === "novia" ? "Agenda · Novia" : "Agenda",
              body: `⏰ ${e.title} · ${rango} (en ${aa.lead} min)`,
            });
          }
        });
      }
      if (state.cut) {
        const t = new Date(d);
        t.setHours(17, 0, 0, 0);
        if (t.getTime() > Date.now()) {
          const doy = Math.floor((t - new Date(t.getFullYear(), 0, 0)) / 86400000);
          items.push({ id: `tip-${ds}`, at: t.getTime(), title: "💡 Tip del Plan Cut", body: CUT_TIPS[doy % CUT_TIPS.length], ttl: 3600 });
        }
      }
    }
    if (items.length) pushCall("/schedule", items);
  }, [pushReady, state.reminders, state.schedule, state.agendaAlerts, cutActive]);

  /* El sync completo hacia NEXO (agenda + estado de hoy) está más abajo,
     después de calcular las métricas del día. */

  /* ---------- métricas ---------- */
  const habitsToday = state.habits.filter((h) => h.days.includes(dow));
  const habitsDone = habitsToday.filter((h) => h.history[today]).length;
  const wLog = state.workoutLog[today] || {};
  const currentProgWeek = state.program.weeks[state.currentWeek];
  const currentProgDay = currentProgWeek ? currentProgWeek.days[state.currentDay] : null;
  const exDone = currentProgDay ? currentProgDay.exercises.filter((e) => wLog[e.id]).length : 0;
  const exTotal = currentProgDay ? currentProgDay.exercises.length : 0;
  const mealsToday = state.meals[today] || [];
  const sumM = (k) => mealsToday.reduce((a, m) => a + (Number(m[k]) || 0), 0);
  const kcal = sumM("kcal"), prot = sumM("protein"), carbs = sumM("carbs"), fat = sumM("fat");
  const waterToday = (state.waterLog || {})[today] || [];
  const water = waterToday.reduce((a, e) => a + (Number(e.ml) || 0), 0); // ml de hoy
  const waterGoal = Number(state.goals.waterMl) || 2000;

  const weightEntriesAll = Object.entries(state.weightLog).sort((a, b) => a[0].localeCompare(b[0]));
  const bodyWeight = weightEntriesAll.length ? Number(weightEntriesAll[weightEntriesAll.length - 1][1]) : 0;

  /* ---------- Plan Cut ---------- */
  const cut = state.cut;
  const cutBfEntries = cut ? Object.entries(cut.bfLog || {}).sort((a, b) => a[0].localeCompare(b[0])) : [];
  const cutBf = cutBfEntries.length ? Number(cutBfEntries[cutBfEntries.length - 1][1]) : cut ? Number(cut.startBf) : 0;
  const cutPhaseIdx = cutBf > 15 ? 0 : cutBf > 12 ? 1 : 2;
  const cutDone = !!cut && cutBf <= 8;
  const cutPhase = CUT_PHASES[cutPhaseIdx];
  const cutPhaseStartBf = cutPhaseIdx === 0 ? Math.max(Number(cut?.startBf) || 30, 15.5) : cutPhaseIdx === 1 ? 15 : 12;
  const cutPhasePct = cut ? Math.min(1, Math.max(0, (cutPhaseStartBf - cutBf) / (cutPhaseStartBf - cutPhase.target))) : 0;
  const cutManualToday = (cut && cut.manual && cut.manual[today]) || {};
  const cutMissions = cut ? [
    { id: "meal", auto: true, text: "Registrá tus comidas de hoy", done: mealsToday.length > 0 },
    { id: "prot", auto: true, text: `Llegá a ${state.goals.protein} g de proteína`, done: prot >= state.goals.protein },
    { id: "water", auto: true, text: "Completá tu meta de agua", done: water >= waterGoal },
    ...(exTotal > 0 ? [{ id: "train", auto: true, text: "Completá el entreno de hoy", done: exDone >= exTotal }] : []),
    ...(cutPhaseIdx >= 1 ? [
      { id: "weigh", auto: true, text: "Pesate hoy (siempre a la misma hora)", done: !!state.weightLog[today] },
      { id: "allmeals", auto: true, text: "Registrá todas las comidas (mínimo 3)", done: mealsToday.length >= 3 },
    ] : []),
    ...(cutPhaseIdx >= 2 ? [
      { id: "clean", auto: false, text: "Cero ultraprocesados hoy", done: !!cutManualToday.clean },
      { id: "fast", auto: false, text: "Ayuno intermitente (si lo usaste hoy)", done: !!cutManualToday.fast },
    ] : []),
  ] : [];
  const cutMissionsDone = cutMissions.filter((m) => m.done).length;
  const cutXp = (() => {
    if (!cut) return 0;
    let xp = 0;
    Object.entries(state.meals).forEach(([d, arr]) => { if (d >= cut.startDate && (arr || []).length) xp += 10; });
    Object.entries(state.sessionLog).forEach(([d, arr]) => { if (d >= cut.startDate && (arr || []).length) xp += 15; });
    Object.keys(state.weightLog).forEach((d) => { if (d >= cut.startDate) xp += 5; });
    xp += cutBfEntries.length * 20;
    return xp;
  })();

  const toggleCutManual = (id) => up((s) => {
    s.cut.manual = s.cut.manual || {};
    s.cut.manual[today] = s.cut.manual[today] || {};
    if (s.cut.manual[today][id]) delete s.cut.manual[today][id]; else s.cut.manual[today][id] = true;
    return s;
  });

  /* Sync completo hacia NEXO/Obsidian: agenda + estado de hoy (gym, agua, hábitos,
     peso, nutrición, cut). Debounced para no spamear el relay en cada toque. */
  useEffect(() => {
    if (!pushCfg.url || !pushCfg.token) return; // basta con el relay configurado (no requiere notis activas)
    clearTimeout(snapTimer.current);
    snapTimer.current = setTimeout(() => {
      const snapshot = {
        fecha: today,
        gym: {
          hoy: currentProgDay
            ? { nombre: currentProgDay.name || "Entreno", ejercicios: currentProgDay.exercises.map((e) => e.name).filter(Boolean), hechos: exDone, total: exTotal }
            : null,
          entrenoHoy: (state.sessionLog[today] || []).length > 0,
          split: (currentProgWeek?.days || []).map((d) => d.name).filter(Boolean),
        },
        agua: { hoyMl: water, metaMl: waterGoal },
        nutricion: { kcal, kcalMeta: state.goals.kcal, proteina: prot, proteinaMeta: state.goals.protein, carbs, grasa: fat, comidas: mealsToday.length },
        habitos: habitsToday.map((h) => ({ nombre: h.name, hecho: !!h.history[today] })),
        materias: subjects.map((m) => ({
          nombre: `${m.name}${m.curso ? ` (${m.curso})` : ""}`, estado: m.estado, examen: m.examen || null,
          diasParaExamen: m.examen ? daysUntil(m.examen) : null,
          temas: `${(m.temas || []).filter((t) => t.done).length}/${(m.temas || []).length}`,
        })),
        peso: bodyWeight || null,
        cut: cut ? { activo: true, bf: cutBf, fase: cutPhase?.name, objetivo: cutPhase?.target, misiones: `${cutMissionsDone}/${cutMissions.length}` } : { activo: false },
        finanzas: {
          usdRate,
          patrimonioARS: Math.round(totalARS),
          patrimonioUSD: Math.round(totalUSD),
          variacion30dARS: finTrend != null ? Math.round(finTrend) : null,
          porTipo: finByTipo.map((g) => ({ tipo: g.tipo, ars: Math.round(g.totalARS) })),
          cuentas: accounts.map((a) => ({ nombre: a.name, tipo: a.tipo, moneda: a.moneda, saldo: Number(a.saldo) || 0, ars: Math.round(toARS(a)) })),
          pasivosARS: Math.round(totalDebt),
          patrimonioNetoARS: Math.round(netARS),
          mes: (() => { const m = monthSummary(curMonth); return { ingresos: m.ingresos, egresos: m.egresos, fijos: m.fijos, variables: m.variables, ahorro: m.ahorro }; })(),
          meta: { nombre: plan.nombre, fecha: plan.fecha, objetivoARS: planMeta, faltaARS: Math.round(planFalta), ahorroPorMesNecesario: Math.round(planPorMes) },
        },
      };
      pushCall("/agenda/push", { schedule: state.schedule || [], snapshot });
    }, 1200);
    return () => clearTimeout(snapTimer.current);
  }, [pushReady, state]);

  // Subida de nivel: celebrar una sola vez cuando el % de grasa cruza el umbral de fase
  useEffect(() => {
    if (!cut) return;
    const reached = cutDone ? 3 : cutPhaseIdx;
    if (reached > (cut.lastPhase || 0)) {
      setBanner(reached >= 3
        ? "🏆 ¡LO LOGRASTE! 8% de grasa: completaste el Plan Cut."
        : `🎉 ¡Subiste de nivel! Fase ${reached + 1}: ${CUT_PHASES[reached].emoji} ${CUT_PHASES[reached].name}`);
      setTimeout(() => setBanner(null), 12000);
      up((s) => { s.cut.lastPhase = reached; return s; });
    }
  }, [cut, cutPhaseIdx, cutDone]);

  // Avisos del Plan Cut mientras la app está abierta (uno por tipo por día)
  useEffect(() => {
    if (!cut) return;
    const check = () => {
      const now = new Date();
      const h = now.getHours();
      const fire = (key, msg) => {
        const k = `cutnag-${key}-${dstr(now)}`;
        if (firedRef.current[k]) return false;
        firedRef.current[k] = true;
        setBanner(msg);
        setTimeout(() => setBanner(null), 12000);
        return true;
      };
      if (h >= 14 && mealsToday.length === 0 && fire("meals", "👀 Todavía no registraste ninguna comida hoy. ¿Cómo venís con la dieta?")) return;
      if (h >= 20 && prot < state.goals.protein * 0.7 && fire("prot", "🥩 Te falta proteína para hoy: sumá una buena fuente en la cena.")) return;
      if (h >= 17) fire("tip", "💡 " + CUT_TIPS[dayOfYear() % CUT_TIPS.length]);
    };
    check();
    const iv = setInterval(check, 60000);
    return () => clearInterval(iv);
  }, [cut, mealsToday.length, prot, state.goals.protein]);

  const dayPct = useMemo(() => {
    const parts = [];
    if (habitsToday.length) parts.push(habitsDone / habitsToday.length);
    if (exTotal) parts.push(exDone / exTotal);
    parts.push(Math.min(1, water / waterGoal));
    return parts.reduce((a, b) => a + b, 0) / parts.length;
  }, [habitsDone, habitsToday.length, exDone, exTotal, water, waterGoal]);

  const streak = (h) => {
    let s = 0;
    const d = new Date();
    for (;;) {
      const key = dstr(d);
      if (h.days.includes(d.getDay())) {
        if (h.history[key]) s++;
        else if (key !== today) break;
      }
      d.setDate(d.getDate() - 1);
      if (s > 365) break;
    }
    return s;
  };

  const week = lastNDays(7);
  const weekTrained = week.filter((d) => (state.sessionLog[dstr(d)] || []).length > 0).length;
  const weekHabitPct = (() => {
    let done = 0, total = 0;
    week.forEach((d) => state.habits.forEach((h) => {
      if (h.days.includes(d.getDay())) { total++; if (h.history[dstr(d)]) done++; }
    }));
    return total ? Math.round((done / total) * 100) : 0;
  })();

  const totalWorkouts = Object.keys(state.sessionLog).filter((k) => (state.sessionLog[k] || []).length > 0).length;
  const bestStreak = Math.max(0, ...state.habits.map(streak));

  const ACHIEVEMENTS = [
    { Icon: Sprout, name: "Primer paso", desc: "Completá tu primer entrenamiento", done: totalWorkouts >= 1 },
    { Icon: Flame, name: "En racha", desc: "7 días de racha en un hábito", done: bestStreak >= 7 },
    { Icon: Zap, name: "Imparable", desc: "30 días de racha en un hábito", done: bestStreak >= 30 },
    { Icon: Dumbbell, name: "Habitué", desc: "10 entrenamientos registrados", done: totalWorkouts >= 10 },
    { Icon: Trophy, name: "Máquina", desc: "50 entrenamientos registrados", done: totalWorkouts >= 50 },
    { Icon: Droplet, name: "Hidratado", desc: "Meta de agua cumplida hoy", done: water >= waterGoal },
    { Icon: TrendingUp, name: "Bajo control", desc: "Registrá tu peso 7 días", done: Object.keys(state.weightLog).length >= 7 },
    { Icon: Apple, name: "Nutrición al día", desc: "Registrá 20 comidas", done: Object.values(state.meals).flat().length >= 20 },
    { Icon: Target, name: "Modo Cut", desc: "Empezá el Plan Cut", done: !!cut },
    { Icon: Award, name: "Fase 2 🎯", desc: "Bajá a 15% de grasa", done: !!cut && cutBf <= 15 },
    { Icon: Flame, name: "Fase 3 🔥", desc: "Bajá a 12% de grasa", done: !!cut && cutBf <= 12 },
    { Icon: Trophy, name: "Shredded 🏆", desc: "Llegá al 8% de grasa", done: cutDone },
  ];
  const achDone = ACHIEVEMENTS.filter((a) => a.done).length;

  const toggleEx = (ex) =>
    up((s) => {
      s.workoutLog[today] = s.workoutLog[today] || {};
      s.sessionLog[today] = s.sessionLog[today] || [];
      if (s.workoutLog[today][ex.id]) {
        delete s.workoutLog[today][ex.id];
        s.sessionLog[today] = s.sessionLog[today].filter((x) => x.id !== ex.id);
        if (s.exerciseHistory[ex.name])
          s.exerciseHistory[ex.name] = s.exerciseHistory[ex.name].filter((x) => x.date !== today);
      } else {
        const maxWeight = Math.max(0, ...ex.sets.map((st) => Number(st.weight) || 0));
        s.workoutLog[today][ex.id] = true;
        // workSets = series realmente cargadas (con reps); alimenta el análisis de carga muscular
        const workSets = ex.sets.filter((st) => Number(st.reps) > 0).length;
        s.sessionLog[today].push({ id: ex.id, name: ex.name, setsCount: ex.sets.length, workSets, tonnage: tonnage(ex) });
        s.exerciseHistory[ex.name] = s.exerciseHistory[ex.name] || [];
        if (!s.exerciseHistory[ex.name].some((x) => x.date === today))
          s.exerciseHistory[ex.name].push({ date: today, weight: maxWeight });
      }
      return s;
    });

  const prOf = (name) => {
    const h = state.exerciseHistory[name] || [];
    return h.length ? Math.max(...h.map((x) => Number(x.weight) || 0)) : null;
  };

  const setCurrentWeek = (i) => up((s) => { s.currentWeek = i; s.currentDay = 0; return s; });
  const setCurrentDay = (i) => up((s) => { s.currentDay = i; return s; });

  const addExerciseToCurrentDay = (exName, weight) => {
    if (!currentProgDay) {
      setBanner("Primero elegí un día en Rutina (o importá/creá tu Programa).");
      setTimeout(() => setBanner(null), 4000);
      return;
    }
    up((s) => {
      const day = s.program.weeks[state.currentWeek].days[state.currentDay];
      if (!day.exercises.some((x) => x.name === exName)) {
        day.exercises.push({
          id: uid(), name: exName, intensity: "", rest: "",
          sets: [{ weight: String(weight || ""), reps: "", rir: "" }, { weight: "", reps: "", rir: "" }, { weight: "", reps: "", rir: "" }],
        });
      }
      return s;
    });
    setBanner(`"${exName}" agregado a tu día actual`);
    setTimeout(() => setBanner(null), 4000);
  };

  /* ============ HOY ============ */
  function Hoy() {
    const showInstall = !installed && !installHidden;
    const hr = todayDate.getHours();
    const greet = hr < 6 ? "Buenas noches" : hr < 13 ? "Buen día" : hr < 20 ? "Buenas tardes" : "Buenas noches";
    return (
      <>
        <div style={{ padding: "4px 4px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: C.primary, textTransform: "uppercase", letterSpacing: 1.2 }}>
              {DAY_NAMES[dow]}, {todayDate.getDate()} de {MONTHS[todayDate.getMonth()]}
            </div>
            <h1 style={{ margin: "4px 0 14px", fontSize: 31, fontWeight: 800, letterSpacing: -0.8, lineHeight: 1.05 }}>{greet}</h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn kind="soft" small onClick={() => up((s) => { s.theme = s.theme === "dark" ? "light" : "dark"; return s; })}>
              {state.theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </Btn>
          </div>
        </div>

        {showInstall && (
          <div style={{
            position: "relative", overflow: "hidden",
            background: `linear-gradient(135deg, ${C.primary} 0%, ${C.accent} 100%)`,
            borderRadius: 18, padding: "14px 16px", marginBottom: 12,
            display: "flex", alignItems: "center", gap: 12,
            boxShadow: `0 8px 24px ${C.primaryGlow}`,
          }}>
            <Smartphone size={24} color="#fff" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 14.5, letterSpacing: -0.2 }}>Instalar NORTE</div>
              <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: 500 }}>Como app en tu pantalla de inicio</div>
            </div>
            <button onClick={triggerInstall} style={{
              background: "#fff", color: C.primary, border: "none", borderRadius: 10,
              padding: "8px 14px", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: FONT,
            }}>Instalar</button>
            <button onClick={() => {
              try { localStorage.setItem("nexofit-install-hidden", "1"); } catch (e) { /* ignorar */ }
              setInstallHidden(true);
            }} style={{
              background: "transparent", border: "none", color: "rgba(255,255,255,0.7)",
              cursor: "pointer", padding: 4, marginLeft: -4, display: "flex",
            }} aria-label="Cerrar"><X size={16} /></button>
          </div>
        )}

        <div style={{
          position: "relative", overflow: "hidden",
          background: C.card, borderRadius: 22, padding: "22px 20px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.03)",
          border: `1px solid ${C.line}`,
        }}>
          <div style={{
            position: "absolute", top: -60, right: -60, width: 180, height: 180,
            background: `radial-gradient(circle, ${C.primaryGlow} 0%, transparent 70%)`,
            pointerEvents: "none",
          }} />
          <div style={{ display: "flex", alignItems: "center", gap: 20, position: "relative" }}>
            <Ring pct={dayPct} size={128} stroke={13}>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>{Math.round(dayPct * 100)}<span style={{ fontSize: 15, color: C.sub }}>%</span></div>
              <div style={{ fontSize: 10.5, color: C.sub, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase" }}>del día</div>
            </Ring>
            <div style={{ flex: 1, display: "grid", gap: 10 }}>
              <MiniStat label="Hábitos" value={`${habitsDone}/${habitsToday.length}`} color={C.primary} />
              <MiniStat label="Gym" value={exTotal ? `${exDone}/${exTotal}` : "Descanso"} color={C.accent} />
              <MiniStat label="Agua" value={`${(water / 1000).toFixed(1)}/${(waterGoal / 1000).toFixed(1)} L`} color={C.blue} />
            </div>
          </div>
        </div>

        {cut && (
          <div onClick={() => setTab("dieta")} style={{
            marginTop: 12, borderRadius: 18, padding: "14px 16px", cursor: "pointer",
            background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
            boxShadow: `0 8px 24px ${C.primaryGlow}`,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{ fontSize: 26 }}>{cutDone ? "🏆" : cutPhase.emoji}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 14.5 }}>
                Plan Cut · {cutDone ? "Completado" : `Nivel ${cutPhaseIdx + 1}: ${cutPhase.name}`}
              </div>
              <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: 600 }}>
                Misiones {cutMissionsDone}/{cutMissions.length} · {cutBf}% de grasa → meta {cutPhase.target}%
              </div>
            </div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 18 }}>→</div>
          </div>
        )}

        <SectionTitle>Tip del día</SectionTitle>
        <div style={{
          borderRadius: 18, padding: "16px 18px",
          background: `linear-gradient(135deg, ${C.primarySoft} 0%, ${C.blueSoft} 100%)`,
          border: `1px solid ${C.line}`,
          display: "flex", gap: 14, alignItems: "flex-start",
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 4px 12px ${C.primaryGlow}`,
          }}><Lightbulb size={17} color="#fff" /></div>
          <div style={{ fontSize: 14, lineHeight: 1.5, color: C.primaryInk, fontWeight: 500 }}>{tip}</div>
        </div>

        <SectionTitle>Hábitos de hoy</SectionTitle>
        <Card style={{ padding: 8 }}>
          {habitsToday.length === 0 && <Empty text="No hay hábitos programados para hoy." />}
          {habitsToday.map((h) => (
            <Row key={h.id}
              left={<span style={{ fontSize: 20 }}>{h.icon}</span>}
              title={h.name}
              sub={<span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Flame size={11} /> {streak(h)} día{streak(h) === 1 ? "" : "s"} de racha</span>}
              right={<Check done={!!h.history[today]} onClick={() =>
                up((s) => {
                  const hh = s.habits.find((x) => x.id === h.id);
                  if (hh.history[today]) delete hh.history[today]; else hh.history[today] = true;
                  return s;
                })} />}
            />
          ))}
        </Card>

        <SectionTitle right={<Btn kind="ghost" small onClick={() => setTab("salud")}>Salud →</Btn>}>Agua{fasting.windows.length ? " y ayuno" : ""}</SectionTitle>
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <WaterSphere pct={water / waterGoal} size={104}>
              <div style={{ fontSize: 17, fontWeight: 900 }}>{Math.round((water / waterGoal) * 100)}%</div>
            </WaterSphere>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 800 }}>{water.toLocaleString("es-AR")} <span style={{ fontSize: 13, color: C.sub, fontWeight: 600 }}>/ {waterGoal.toLocaleString("es-AR")} ml</span></div>
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                {[250, 500].map((ml) => <Btn key={ml} kind="soft" small onClick={() => addWater(ml)}>+{ml}</Btn>)}
              </div>
            </div>
          </div>
          {fasting.windows.length > 0 && (
            <div style={{ borderTop: `1px solid ${C.line}`, marginTop: 12, paddingTop: 10 }}><FastCard compact /></div>
          )}
        </Card>

        {currentProgDay && currentProgDay.exercises.length > 0 && (
          <>
            <SectionTitle right={<Btn kind="ghost" small onClick={() => { setGymView("rutina"); setTab("gym"); }}>Ver rutina →</Btn>}>
              Gym · {currentProgDay.name || `Día ${state.currentDay + 1}`}
            </SectionTitle>
            <Card style={{ padding: 8 }}>
              {currentProgDay.exercises.map((e) => (
                <Row key={e.id} title={e.name} sub={`${e.sets.length} serie${e.sets.length === 1 ? "" : "s"}${e.intensity ? ` · ${e.intensity}` : ""}`}
                  right={<Check color={C.amber} done={!!wLog[e.id]} onClick={() => toggleEx(e)} />} />
              ))}
            </Card>
          </>
        )}

        {bonusPendHoy && (
          <>
            <SectionTitle>Bonus de hoy</SectionTitle>
            <Card onClick={() => { setBonusSel(null); setTab("bonus"); }} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
              <Lightbulb size={22} color={C.amber} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 15 }}>📕 Geografía · {bonusHoy.titulo}</div>
                <div style={{ fontSize: 12.5, color: C.sub, fontWeight: 600, marginTop: 2 }}>Lectura + ejercicio · {bonusProg(bonusHoy.id).leido ? "falta el ejercicio" : "unos 20 minutos"}</div>
              </div>
              <ChevronRight size={18} color={C.sub} />
            </Card>
          </>
        )}

        {upcomingExams.length > 0 && (
          <>
            <SectionTitle right={<Btn kind="ghost" small onClick={() => { setAgendaView("materias"); setTab("agenda"); }}>Ver materias →</Btn>}>Exámenes</SectionTitle>
            <Card style={{ padding: 8 }}>
              {upcomingExams.slice(0, 3).map((m) => {
                const d = daysUntil(m.examen);
                const temas = m.temas || [];
                const hechos = temas.filter((t) => t.done).length;
                return (
                  <Row key={m.id} title={`${m.estado === "previa" ? "📕" : "📘"} ${m.name}${m.curso ? ` · ${m.curso}` : ""}`}
                    sub={`${m.estado === "previa" ? "Previa · " : ""}${temas.length ? `${hechos}/${temas.length} temas` : "Cargá los temas"}`}
                    right={<span style={{ fontWeight: 900, fontSize: 13.5, whiteSpace: "nowrap", color: d <= 7 ? C.red : d <= 14 ? C.amber : C.ink }}>{d === 0 ? "¡Hoy!" : d === 1 ? "Mañana" : `${d} días`}</span>} />
                );
              })}
            </Card>
          </>
        )}

        <SectionTitle right={<Btn kind="ghost" small onClick={() => setTab("dieta")}>Registrar →</Btn>}>Dieta de hoy</SectionTitle>
        <Card style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <MacroBox label="Calorías" value={kcal} goal={state.goals.kcal} unit="kcal" color={C.amber} />
          <MacroBox label="Proteína" value={prot} goal={state.goals.protein} unit="g" color={C.primary} />
          <MacroBox label="Carbos" value={carbs} goal={state.goals.carbs} unit="g" color={C.blue} />
          <MacroBox label="Grasas" value={fat} goal={state.goals.fat} unit="g" color={C.red} />
        </Card>

        {runPlan && (
          <>
            <SectionTitle right={<Btn kind="ghost" small onClick={() => setTab("correr")}>{runLive ? "Ver salida →" : "Correr →"}</Btn>}>Correr hoy</SectionTitle>
            <Card>
              <MacroBox label={runKmToday >= runTarget ? "Meta cumplida ✅" : "Distancia"} value={runKmToday} goal={runTarget} unit="km" color={C.green} />
            </Card>
          </>
        )}

        <SectionTitle>Nota del día</SectionTitle>
        <Card>
          <textarea
            placeholder="¿Cómo te sentiste hoy? Energía, dolores, ánimo…"
            value={state.notes[today] || ""}
            onChange={(e) => up((s) => { s.notes[today] = e.target.value; return s; })}
            style={{
              width: "100%", boxSizing: "border-box", minHeight: 70, resize: "vertical",
              border: `1.5px solid ${C.line}`, borderRadius: 12, padding: 10,
              fontFamily: FONT, fontSize: 14, background: C.input, color: C.ink, outline: "none",
            }} />
        </Card>

        <SectionTitle>Tu semana</SectionTitle>
        <Card style={{ display: "flex", gap: 12 }}>
          <BigStat value={weekTrained} label="días entrenados (7d)" color={C.amber} />
          <BigStat value={`${weekHabitPct}%`} label="hábitos cumplidos (7d)" color={C.primary} />
          <BigStat value={`${achDone}/${ACHIEVEMENTS.length}`} label="logros" color={C.blue} />
        </Card>
      </>
    );
  }

  /* ============ HÁBITOS ============ */
  const [newHabit, setNewHabit] = useState("");

  function MonthGrid({ habit }) {
    const days = lastNDays(28);
    return (
      <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.sub, marginBottom: 6 }}>ÚLTIMOS 28 DÍAS</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {days.map((d) => {
            const key = dstr(d);
            const planned = habit.days.includes(d.getDay());
            const done = !!habit.history[key];
            return (
              <div key={key}
                onClick={() => up((s) => {
                  const hh = s.habits.find((x) => x.id === habit.id);
                  if (hh.history[key]) delete hh.history[key]; else hh.history[key] = true;
                  return s;
                })}
                style={{
                  aspectRatio: "1", borderRadius: 6, cursor: "pointer",
                  background: done ? C.primary : planned ? C.line : C.soft,
                  opacity: planned || done ? 1 : 0.45,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, color: done ? "#fff" : C.sub, fontWeight: 700,
                }}>
                {d.getDate()}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function Finanzas() {
    const FIN_EMOJIS = ["💰","💸","🪙","💳","🏦","📈","📊","🍊","💵","💶","🐷","⭐","🚀","🔷"];
    const moneyBadge = (moneda) => (
      <span style={{
        fontSize: 10.5, fontWeight: 800, letterSpacing: 0.3, padding: "2px 7px", borderRadius: 999,
        background: moneda === "USD" ? "rgba(52,199,89,0.14)" : C.soft,
        color: moneda === "USD" ? "#2e9e4f" : C.sub,
      }}>{moneda}</span>
    );

    const rate = (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => { setEditRate(true); setRateDraft(String(usdRate)); }} style={{
          border: "none", background: "transparent", cursor: "pointer", fontFamily: FONT,
          color: "rgba(255,255,255,0.9)", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4,
        }}>
          <DollarSign size={13} /> 1 USD = ${usdRate.toLocaleString("es-AR")} <Pencil size={11} />
        </button>
        <button onClick={fetchUsdRate} disabled={rateLoading} aria-label="Actualizar cotización" title="Traer cotización del dólar blue" style={{
          border: "none", background: "transparent", cursor: rateLoading ? "default" : "pointer",
          color: "rgba(255,255,255,0.85)", display: "flex", alignItems: "center", padding: 2,
        }}>
          <RefreshCw size={13} style={rateLoading ? { animation: "norteOrbSpin 0.8s linear infinite" } : undefined} />
        </button>
      </div>
    );

    const finNav = (
      <>
        <PageHeader title="Plata" subtitle={{ patrimonio: "Patrimonio", mes: "Ingresos y gastos", meta: "Meta de ahorro" }[finView]} />
        <div style={{ marginBottom: 14 }}>
          <Segmented options={[["patrimonio", "Patrimonio"], ["mes", "Mes"], ["meta", "Meta"]]} value={finView} onChange={setFinView} />
        </div>
      </>
    );
    if (finView === "mes") return FinMes();
    if (finView === "meta") return FinMeta();

    function FinMes() {
      const sm = monthSummary(finMonth);
      const isIngreso = movDraft.tipo === "ingreso";
      const cats = isIngreso ? INGRESO_CATS : [...budget.map((b) => b.name), "Otro"];
      const budFijos = budget.filter((b) => b.tipo === "fijo").reduce((acc, b) => acc + (Number(b.monto) || 0), 0);
      const budVar = budget.filter((b) => b.tipo !== "fijo").reduce((acc, b) => acc + (Number(b.monto) || 0), 0);
      const defaultFecha = finMonth === curMonth ? today : `${finMonth}-01`;
      const addMov = () => {
        const v = parseMoney(movDraft.monto);
        if (!Number.isFinite(v) || v <= 0) { flash("Poné un monto válido"); return; }
        const cat = movDraft.cat || (isIngreso ? "Sueldo" : "Otro");
        const bud = budget.find((b) => b.name === cat);
        up((s) => {
          s.finance.movs = s.finance.movs || [];
          s.finance.movs.push({
            id: uid(), fecha: movDraft.fecha || defaultFecha, tipo: movDraft.tipo, cat, monto: v, nota: movDraft.nota.trim(),
            ...(isIngreso ? {} : { clase: bud?.tipo === "fijo" ? "fijo" : "variable" }),
          });
          return s;
        });
        setMovDraft({ ...movDraft, monto: "", nota: "", fecha: "" });
        flash(isIngreso ? "💵 Ingreso registrado" : "🧾 Gasto registrado");
      };
      const chip = (active) => ({
        fontSize: 12.5, fontWeight: 700, padding: "6px 11px", borderRadius: 999, cursor: "pointer", border: "none", fontFamily: FONT,
        background: active ? C.primarySoft : C.soft, color: active ? (C.theme === "dark" ? C.primaryInk : C.primary) : C.sub,
      });
      const iconBtn = { width: 30, height: 26, borderRadius: 8, border: "none", cursor: "pointer", background: C.soft, color: C.sub, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };
      return (
        <>
          {finNav}

          {/* Selector de mes */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <button onClick={() => setFinMonth(shiftYm(finMonth, -1))} aria-label="Mes anterior" style={iconBtn}><ChevronLeft size={16} /></button>
            <div style={{ fontWeight: 800, fontSize: 16 }}>{ymLabel(finMonth)}</div>
            <button onClick={() => setFinMonth(shiftYm(finMonth, 1))} aria-label="Mes siguiente" style={iconBtn}><ChevronRight size={16} /></button>
          </div>

          {/* Resumen del mes */}
          <div style={{
            borderRadius: 22, padding: 20, color: "#fff",
            background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
            boxShadow: `0 10px 30px ${C.primaryGlow}`,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", opacity: 0.85 }}>Ahorro del mes</div>
            <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1, marginTop: 4 }}>{sm.ahorro < 0 ? "−" : ""}{fmtMoney(Math.abs(sm.ahorro), "ARS")}</div>
            <div style={{ display: "flex", gap: 10, marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.22)" }}>
              {[["Ingresos", sm.ingresos], ["Fijos", sm.fijos], ["Variables", sm.variables]].map(([lbl, v]) => (
                <div key={lbl} style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.85, textTransform: "uppercase", letterSpacing: 0.5 }}>{lbl}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fmtMoney(v, "ARS")}</div>
                </div>
              ))}
            </div>
          </div>
          {plan.ahorroMensual > 0 && sm.ingresos > 0 && (
            <div style={{ fontSize: 12.5, color: sm.ahorro >= plan.ahorroMensual ? "#2e9e4f" : C.sub, fontWeight: 700, textAlign: "center", marginTop: 8 }}>
              {sm.ahorro >= plan.ahorroMensual
                ? `✅ Llegaste a tu objetivo de ahorro (${fmtMoney(plan.ahorroMensual, "ARS")})`
                : `Te faltan ${fmtMoney(plan.ahorroMensual - sm.ahorro, "ARS")} para tu objetivo de ahorro del mes`}
            </div>
          )}

          {/* Cargar movimiento */}
          <SectionTitle>Registrar</SectionTitle>
          <Card>
            <Segmented options={[["egreso", "Gasto"], ["ingreso", "Ingreso"]]} value={movDraft.tipo}
              onChange={(v) => setMovDraft({ ...movDraft, tipo: v, cat: "" })} />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <Input placeholder="Monto ($)" inputMode="decimal" value={movDraft.monto}
                onChange={(e) => setMovDraft({ ...movDraft, monto: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && addMov()} />
              <Input type="date" value={movDraft.fecha || defaultFecha}
                onChange={(e) => setMovDraft({ ...movDraft, fecha: e.target.value })} style={{ width: 150, flexShrink: 0 }} />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              {cats.map((c) => {
                const active = (movDraft.cat || (isIngreso ? "Sueldo" : "Otro")) === c;
                const bud = budget.find((b) => b.name === c);
                return <button key={c} onClick={() => setMovDraft({ ...movDraft, cat: c })} style={chip(active)}>{bud?.icon ? `${bud.icon} ` : ""}{c}</button>;
              })}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <Input placeholder="Nota (opcional)" value={movDraft.nota}
                onChange={(e) => setMovDraft({ ...movDraft, nota: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && addMov()} />
              <Btn onClick={addMov}>Agregar</Btn>
            </div>
          </Card>

          {/* Presupuesto vs real */}
          <SectionTitle right={<Btn kind="ghost" small onClick={() => setBudgetEdit(!budgetEdit)}>{budgetEdit ? "Listo" : "Editar"}</Btn>}>Presupuesto</SectionTitle>
          <Card>
            {["fijo", "variable"].map((t) => (
              <div key={t} style={{ marginBottom: t === "fijo" ? 14 : 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 800, color: C.sub, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
                  <span>Costos {t === "fijo" ? "fijos" : "variables"}</span>
                  <span>{fmtMoney(t === "fijo" ? sm.fijos : sm.variables, "ARS")} / {fmtMoney(t === "fijo" ? budFijos : budVar, "ARS")}</span>
                </div>
                {budget.filter((b) => (b.tipo === "fijo") === (t === "fijo")).map((b) => {
                  const real = sm.porCat[b.name] || 0;
                  const pct = b.monto ? real / b.monto : 0;
                  return (
                    <div key={b.id} style={{ padding: "7px 0", borderTop: `1px solid ${C.line}` }}>
                      {budgetEdit ? (
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <Input value={b.name} onChange={(e) => up((s) => { s.finance.budget.find((x) => x.id === b.id).name = e.target.value; return s; })} />
                          <Input inputMode="numeric" value={String(b.monto || "")} style={{ width: 110, flexShrink: 0 }}
                            onChange={(e) => up((s) => { const v = parseMoney(e.target.value); s.finance.budget.find((x) => x.id === b.id).monto = Number.isFinite(v) ? v : 0; return s; })} />
                          <button title="Cambiar fijo/variable" style={{ ...iconBtn, width: 48, fontSize: 11, fontWeight: 800, fontFamily: FONT }}
                            onClick={() => up((s) => { const x = s.finance.budget.find((y) => y.id === b.id); x.tipo = x.tipo === "fijo" ? "variable" : "fijo"; return s; })}>
                            {b.tipo === "fijo" ? "Fijo" : "Var."}
                          </button>
                          <button aria-label="Borrar categoría" style={iconBtn} onClick={() => up((s) => { s.finance.budget = s.finance.budget.filter((x) => x.id !== b.id); return s; })}><Trash2 size={14} /></button>
                        </div>
                      ) : (
                        <>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13.5, fontWeight: 700 }}>
                            <span>{b.icon} {b.name}</span>
                            <span style={{ color: pct > 1 ? C.red : C.ink, whiteSpace: "nowrap" }}>{fmtMoney(real, "ARS")} <span style={{ color: C.sub, fontWeight: 600 }}>/ {fmtMoney(b.monto, "ARS")}</span></span>
                          </div>
                          <div style={{ height: 6, borderRadius: 999, background: C.soft, marginTop: 6, overflow: "hidden" }}>
                            <div style={{ width: `${Math.min(100, pct * 100)}%`, height: "100%", borderRadius: 999, background: pct > 1 ? C.red : pct > 0.85 ? C.amber : C.primary }} />
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
            {budgetEdit && (
              <Btn kind="soft" small style={{ width: "100%", marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                onClick={() => up((s) => { s.finance.budget = s.finance.budget || []; s.finance.budget.push({ id: uid(), name: "Nueva categoría", tipo: "variable", monto: 0, icon: "🧾" }); return s; })}>
                <Plus size={15} /> Agregar categoría
              </Btn>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, paddingTop: 10, borderTop: `1px solid ${C.line}`, fontWeight: 800, fontSize: 14 }}>
              <span>Total del mes</span>
              <span>{fmtMoney(sm.egresos, "ARS")} / {fmtMoney(budFijos + budVar, "ARS")}</span>
            </div>
          </Card>

          {/* Movimientos del mes */}
          <SectionTitle>Movimientos</SectionTitle>
          <Card>
            {!sm.ms.length && <div style={{ fontSize: 13, color: C.sub, fontWeight: 600, textAlign: "center", padding: "8px 0" }}>Todavía no cargaste nada este mes</div>}
            {[...sm.ms].sort((a, b) => (b.fecha || "").localeCompare(a.fecha || "")).map((m, i) => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: i ? `1px solid ${C.line}` : "none" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {m.cat}{m.nota ? <span style={{ color: C.sub, fontWeight: 600 }}> · {m.nota}</span> : null}
                  </div>
                  <div style={{ fontSize: 11.5, color: C.sub, fontWeight: 600 }}>
                    {m.fecha.slice(8, 10)}/{m.fecha.slice(5, 7)}{m.tipo === "egreso" ? ` · ${m.clase === "fijo" ? "fijo" : "variable"}` : " · ingreso"}
                  </div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 14, whiteSpace: "nowrap", color: m.tipo === "ingreso" ? "#2e9e4f" : C.ink }}>
                  {m.tipo === "ingreso" ? "+" : "−"}{fmtMoney(m.monto, "ARS")}
                </div>
                <button aria-label="Borrar movimiento" style={iconBtn} onClick={() => up((s) => { s.finance.movs = s.finance.movs.filter((x) => x.id !== m.id); return s; })}><Trash2 size={13} /></button>
              </div>
            ))}
          </Card>
        </>
      );
    }

    function FinMeta() {
      const pct = planMeta ? Math.max(0, netARS) / planMeta : 0;
      const ahorroMes = monthSummary(curMonth).ahorro;
      // Proyección: en qué mes llegás si ahorrás lo que te propusiste por mes
      const mesesProy = plan.ahorroMensual > 0 ? Math.ceil(planFalta / plan.ahorroMensual) : null;
      const llegaEn = mesesProy != null ? shiftYm(curMonth, mesesProy) : null;
      const llegaATiempo = llegaEn != null && llegaEn <= plan.fecha.slice(0, 7);
      const setPlan = (fn) => up((s) => { s.finance.plan = s.finance.plan || structuredClone(initialState.finance.plan); fn(s.finance.plan); return s; });
      const iconBtn = { width: 30, height: 26, borderRadius: 8, border: "none", cursor: "pointer", background: C.soft, color: C.sub, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };
      return (
        <>
          {finNav}

          <div style={{
            borderRadius: 22, padding: 20, color: "#fff",
            background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
            boxShadow: `0 10px 30px ${C.primaryGlow}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Ring pct={pct} size={92} stroke={9} color="#fff">
                <span style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>{Math.round(Math.min(1, pct) * 100)}%</span>
              </Ring>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", opacity: 0.85, display: "flex", alignItems: "center", gap: 5 }}><Home size={13} /> {plan.nombre}</div>
                <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: -0.8, marginTop: 4 }}>{fmtMoney(Math.max(0, netARS), "ARS")}</div>
                <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.9 }}>de {fmtMoney(planMeta, "ARS")}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.22)" }}>
              {[
                ["Falta", fmtMoney(planFalta, "ARS")],
                ["Quedan", planDias > 0 ? `${planDias} días` : "¡Llegó!"],
                ["Por mes", planFalta > 0 ? fmtMoney(planPorMes, "ARS") : "—"],
              ].map(([lbl, v]) => (
                <div key={lbl} style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.85, textTransform: "uppercase", letterSpacing: 0.5 }}>{lbl}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ fontSize: 12, color: C.sub, fontWeight: 600, textAlign: "center", margin: "8px 8px 0", lineHeight: 1.45 }}>
            El progreso es tu patrimonio neto: cuentas de Patrimonio menos pasivos.
          </div>

          {/* Ritmo */}
          <SectionTitle>Ritmo</SectionTitle>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, fontWeight: 700, padding: "4px 0" }}>
              <span>Objetivo de ahorro mensual</span><span>{fmtMoney(plan.ahorroMensual, "ARS")}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, fontWeight: 700, padding: "4px 0" }}>
              <span>Ahorro real este mes</span>
              <span style={{ color: ahorroMes >= plan.ahorroMensual ? "#2e9e4f" : C.ink }}>{ahorroMes < 0 ? "−" : ""}{fmtMoney(Math.abs(ahorroMes), "ARS")}</span>
            </div>
            {planFalta > 0 && llegaEn && (
              <div style={{
                marginTop: 10, padding: "10px 12px", borderRadius: 12, fontSize: 13, fontWeight: 700, lineHeight: 1.45,
                background: llegaATiempo ? "rgba(52,199,89,0.12)" : "rgba(255,159,10,0.14)", color: llegaATiempo ? "#2e9e4f" : C.amber,
              }}>
                {llegaATiempo
                  ? `A este ritmo llegás en ${ymLabel(llegaEn).toLowerCase()} ✅`
                  : `A este ritmo llegás recién en ${ymLabel(llegaEn).toLowerCase()}. Para llegar a tiempo necesitás ${fmtMoney(planPorMes, "ARS")}/mes.`}
              </div>
            )}
          </Card>

          {/* Desglose de la meta */}
          <SectionTitle right={<Btn kind="ghost" small onClick={() => setPlanEdit(!planEdit)}>{planEdit ? "Listo" : "Editar"}</Btn>}>Qué necesitás juntar</SectionTitle>
          <Card>
            {planEdit && (
              <div style={{ marginBottom: 12 }}>
                <div style={lblStyle}>NOMBRE</div>
                <Input value={plan.nombre} onChange={(e) => setPlan((p) => { p.nombre = e.target.value; })} />
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={lblStyle}>FECHA</div>
                    <Input type="date" value={plan.fecha} onChange={(e) => e.target.value && setPlan((p) => { p.fecha = e.target.value; })} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={lblStyle}>AHORRO / MES</div>
                    <Input inputMode="numeric" value={String(plan.ahorroMensual || "")}
                      onChange={(e) => setPlan((p) => { const v = parseMoney(e.target.value); p.ahorroMensual = Number.isFinite(v) ? v : 0; })} />
                  </div>
                </div>
              </div>
            )}
            {(plan.items || []).map((it, i) => (
              <div key={it.id} style={{ padding: "8px 0", borderTop: i || planEdit ? `1px solid ${C.line}` : "none" }}>
                {planEdit ? (
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <Input value={it.name} onChange={(e) => setPlan((p) => { p.items.find((x) => x.id === it.id).name = e.target.value; })} />
                    <Input inputMode="numeric" value={String(it.monto || "")} style={{ width: 110, flexShrink: 0 }}
                      onChange={(e) => setPlan((p) => { const v = parseMoney(e.target.value); p.items.find((x) => x.id === it.id).monto = Number.isFinite(v) ? v : 0; })} />
                    <button aria-label="Borrar ítem" style={iconBtn} onClick={() => setPlan((p) => { p.items = p.items.filter((x) => x.id !== it.id); })}><Trash2 size={14} /></button>
                  </div>
                ) : (
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13.5, fontWeight: 700 }}>
                    <span>{it.name}</span><span style={{ whiteSpace: "nowrap" }}>{fmtMoney(it.monto, "ARS")}</span>
                  </div>
                )}
              </div>
            ))}
            {planEdit && (
              <Btn kind="soft" small style={{ width: "100%", marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                onClick={() => setPlan((p) => { p.items = p.items || []; p.items.push({ id: uid(), name: "Nuevo ítem", monto: 0 }); })}>
                <Plus size={15} /> Agregar ítem
              </Btn>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.line}`, fontWeight: 900, fontSize: 15 }}>
              <span>Meta total</span><span>{fmtMoney(planMeta, "ARS")}</span>
            </div>
          </Card>
        </>
      );
    }

    return (
      <>
        {finNav}

        {/* Hero: patrimonio total */}
        <div style={{
          borderRadius: 22, padding: 20, color: "#fff",
          background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
          boxShadow: `0 10px 30px ${C.primaryGlow}`,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", opacity: 0.85 }}>Patrimonio total</div>
          <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: -1, marginTop: 4 }}>{fmtMoney(totalARS, "ARS")}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 15, fontWeight: 800, opacity: 0.95 }}>≈ {fmtMoney(totalUSD, "USD")}</span>
            {finTrend != null && finTrend !== 0 && (
              <span style={{ fontSize: 12.5, fontWeight: 800, padding: "3px 9px", borderRadius: 999, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", gap: 3 }}>
                <TrendingUp size={13} style={{ transform: finTrend < 0 ? "scaleY(-1)" : "none" }} />
                {finTrend > 0 ? "+" : ""}{fmtMoney(finTrend, "ARS")} · 30d
              </span>
            )}
          </div>
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.22)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {editRate ? (
              <div style={{ display: "flex", gap: 6, alignItems: "center", width: "100%" }}>
                <span style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>1 USD =</span>
                <input autoFocus value={rateDraft} inputMode="numeric" onChange={(e) => setRateDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { up((s) => { s.finance.usdRate = Number(rateDraft) || usdRate; s.finance.rateUpdated = today; return s; }); setEditRate(false); flash("Cotización actualizada"); } }}
                  style={{ flex: 1, minWidth: 0, padding: "6px 10px", borderRadius: 10, border: "none", fontSize: 14, fontFamily: FONT, fontWeight: 700 }} />
                <Btn small kind="dark" onClick={() => { up((s) => { s.finance.usdRate = Number(rateDraft) || usdRate; s.finance.rateUpdated = today; return s; }); setEditRate(false); flash("Cotización actualizada"); }}>OK</Btn>
              </div>
            ) : rate}
          </div>
        </div>

        {/* Reparto por tipo */}
        {totalARS > 0 && finByTipo.length > 0 && (
          <Card style={{ marginTop: 12 }}>
            <div style={{ display: "flex", height: 12, borderRadius: 999, overflow: "hidden", marginBottom: 12 }}>
              {finByTipo.map((g) => (
                <div key={g.tipo} title={g.label} style={{ width: `${(g.totalARS / totalARS) * 100}%`, background: g.color }} />
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {finByTipo.map((g) => (
                <div key={g.tipo} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: g.color, flexShrink: 0 }} />
                  <g.Icon size={15} color={C.sub} />
                  <span style={{ fontWeight: 800, fontSize: 14, flex: 1 }}>{g.label}</span>
                  <span style={{ fontWeight: 700, fontSize: 13, color: C.sub }}>{Math.round((g.totalARS / totalARS) * 100)}%</span>
                  <span style={{ fontWeight: 800, fontSize: 14, minWidth: 92, textAlign: "right" }}>{fmtMoney(g.totalARS, "ARS")}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Cuentas agrupadas por tipo */}
        {FIN_GRUPOS.map((tipoKey) => {
          const meta = FIN_TIPOS[tipoKey];
          const accs = accounts.filter((a) => a.tipo === tipoKey);
          if (!accs.length) return null;
          return (
            <div key={tipoKey}>
              <SectionTitle>{meta.label}</SectionTitle>
              {accs.map((a) => {
                const editing = editAcc === a.id;
                const hist = Object.keys(a.history || {}).sort();
                const lastUpd = hist.length ? hist[hist.length - 1] : null;
                const prevVal = hist.length > 1 ? a.history[hist[hist.length - 2]] : null;
                const delta = prevVal != null ? (Number(a.saldo) || 0) - prevVal : null;
                return (
                  <Card key={a.id} style={{ marginTop: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 26, flexShrink: 0 }}>{a.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <span style={{ fontWeight: 800, fontSize: 15.5, letterSpacing: -0.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</span>
                          {moneyBadge(a.moneda)}
                        </div>
                        <div style={{ fontSize: 12, color: C.sub, fontWeight: 600, marginTop: 2 }}>
                          {lastUpd ? `Actualizado ${lastUpd === today ? "hoy" : lastUpd}` : "Sin actualizar"}
                          {delta != null && delta !== 0 && (
                            <span style={{ color: delta > 0 ? "#2e9e4f" : C.red, fontWeight: 800 }}> · {delta > 0 ? "+" : ""}{fmtMoney(delta, a.moneda)}</span>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontWeight: 900, fontSize: 17, letterSpacing: -0.4 }}>{fmtMoney(a.saldo, a.moneda)}</div>
                        {a.moneda === "USD" && <div style={{ fontSize: 11.5, color: C.sub, fontWeight: 600 }}>≈ {fmtMoney(toARS(a), "ARS")}</div>}
                        {a.tipo === "wallet" && a.saldoSol != null && <div style={{ fontSize: 11, color: C.sub, fontWeight: 600 }}>{a.saldoSol.toFixed(3)} SOL</div>}
                      </div>
                      <button onClick={() => setEditAcc(editing ? null : a.id)}
                        style={{ width: 30, height: 26, borderRadius: 8, border: "none", cursor: "pointer", background: C.soft, color: C.sub, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {editing ? <X size={14} /> : <Pencil size={14} />}
                      </button>
                    </div>

                    {!editing && a.tipo === "wallet" && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
                        <span style={{ fontSize: 11.5, color: C.sub, fontWeight: 600, flex: 1, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {a.address ? `${a.address.slice(0, 4)}…${a.address.slice(-4)}` : "Sin dirección"}
                        </span>
                        <Btn small kind="soft" onClick={() => { if (!walletSyncing[a.id]) syncWallet(a.id); }}
                          style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <RefreshCw size={13} style={walletSyncing[a.id] ? { animation: "norteOrbSpin 0.8s linear infinite" } : undefined} /> Sincronizar
                        </Btn>
                      </div>
                    )}

                    {!editing && a.tipo === "broker" && iolModal !== a.id && (
                      <div style={{ marginTop: 12 }}>
                        <Btn small kind="soft" onClick={() => setIolModal(a.id)} style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", justifyContent: "center" }}>
                          <RefreshCw size={13} /> Sincronizar (pide usuario y clave)
                        </Btn>
                      </div>
                    )}
                    {!editing && a.tipo === "broker" && iolModal === a.id && (
                      <div style={{ marginTop: 12 }}>
                        <Input placeholder="Usuario IOL" value={iolCreds.user} onChange={(e) => setIolCreds({ ...iolCreds, user: e.target.value })} />
                        <Input type="password" placeholder="Contraseña" style={{ marginTop: 8 }} value={iolCreds.pass}
                          onChange={(e) => setIolCreds({ ...iolCreds, pass: e.target.value })}
                          onKeyDown={(e) => e.key === "Enter" && syncIol(a.id)} />
                        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                          <Btn kind="ghost" small style={{ flex: 1 }} onClick={() => { setIolModal(null); setIolCreds({ name: "IOL", user: "", pass: "" }); }}>Cancelar</Btn>
                          <Btn small style={{ flex: 1 }} onClick={() => syncIol(a.id)}>{iolLoading ? "Conectando…" : "Sincronizar"}</Btn>
                        </div>
                      </div>
                    )}

                    {!editing && a.tipo !== "wallet" && a.tipo !== "broker" && (
                      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                        <Input placeholder={`Nuevo saldo (${a.moneda})`} inputMode="decimal"
                          value={saldoDraft[a.id] || ""}
                          onChange={(e) => setSaldoDraft({ ...saldoDraft, [a.id]: e.target.value })}
                          onKeyDown={(e) => e.key === "Enter" && setSaldo(a.id, saldoDraft[a.id])} />
                        <Btn onClick={() => setSaldo(a.id, saldoDraft[a.id])}>Guardar</Btn>
                      </div>
                    )}

                    {editing && (
                      <div style={{ marginTop: 12 }}>
                        <div style={lblStyle}>NOMBRE</div>
                        <Input value={a.name} onChange={(e) => up((s) => { s.finance.accounts.find((x) => x.id === a.id).name = e.target.value; return s; })} />
                        {a.tipo === "wallet" ? (
                          <>
                            <div style={{ ...lblStyle, marginTop: 10 }}>DIRECCIÓN (SOLANA)</div>
                            <Input value={a.address || ""} placeholder="Ej: 9WzD…AWWM"
                              onChange={(e) => up((s) => { s.finance.accounts.find((x) => x.id === a.id).address = e.target.value.trim(); return s; })} />
                          </>
                        ) : (
                          <>
                            <div style={{ ...lblStyle, marginTop: 10 }}>TIPO</div>
                            <Segmented options={[["crypto", "Crypto"], ["pesos", "Pesos"], ["inversion", "Inversión"]]}
                              value={a.tipo} onChange={(v) => up((s) => { s.finance.accounts.find((x) => x.id === a.id).tipo = v; return s; })} />
                            <div style={{ ...lblStyle, marginTop: 10 }}>MONEDA</div>
                            <Segmented options={[["ARS", "Pesos ($)"], ["USD", "Dólares (US$)"]]}
                              value={a.moneda} onChange={(v) => up((s) => { s.finance.accounts.find((x) => x.id === a.id).moneda = v; return s; })} />
                          </>
                        )}
                        <div style={{ ...lblStyle, marginTop: 10 }}>ÍCONO</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {FIN_EMOJIS.map((em) => (
                            <button key={em} onClick={() => up((s) => { s.finance.accounts.find((x) => x.id === a.id).icon = em; return s; })}
                              style={{ fontSize: 18, padding: "6px 8px", borderRadius: 10, cursor: "pointer", border: "none", background: a.icon === em ? C.primarySoft : C.soft }}>{em}</button>
                          ))}
                        </div>
                        <div style={{ marginTop: 12, textAlign: "right" }}>
                          <Btn kind="danger" small onClick={() => { setEditAcc(null); up((s) => { s.finance.accounts = s.finance.accounts.filter((x) => x.id !== a.id); return s; }); }}>Borrar cuenta</Btn>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          );
        })}

        {/* Pasivos (deudas) */}
        <SectionTitle>Pasivos</SectionTitle>
        <Card>
          {debts.map((d, i) => (
            <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: i ? `1px solid ${C.line}` : "none" }}>
              <span style={{ flex: 1, fontWeight: 700, fontSize: 14 }}>{d.name}</span>
              <span style={{ fontWeight: 800, fontSize: 14, color: C.red }}>−{fmtMoney(d.monto, "ARS")}</span>
              <button aria-label="Borrar pasivo" onClick={() => up((s) => { s.finance.debts = s.finance.debts.filter((x) => x.id !== d.id); return s; })}
                style={{ width: 30, height: 26, borderRadius: 8, border: "none", cursor: "pointer", background: C.soft, color: C.sub, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Trash2 size={13} /></button>
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: debts.length ? 10 : 0 }}>
            <Input placeholder="Deuda (ej: tarjeta)" value={debtDraft.name} onChange={(e) => setDebtDraft({ ...debtDraft, name: e.target.value })} />
            <Input placeholder="Monto ($)" inputMode="decimal" value={debtDraft.monto} style={{ width: 110, flexShrink: 0 }}
              onChange={(e) => setDebtDraft({ ...debtDraft, monto: e.target.value })} />
            <Btn onClick={() => {
              const v = parseMoney(debtDraft.monto);
              if (!debtDraft.name.trim() || !Number.isFinite(v) || v <= 0) { flash("Poné nombre y monto"); return; }
              up((s) => { s.finance.debts = s.finance.debts || []; s.finance.debts.push({ id: uid(), name: debtDraft.name.trim(), monto: v }); return s; });
              setDebtDraft({ name: "", monto: "" });
            }}>＋</Btn>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, paddingTop: 10, borderTop: `1px solid ${C.line}`, fontWeight: 900, fontSize: 15 }}>
            <span>Patrimonio neto</span><span>{fmtMoney(netARS, "ARS")}</span>
          </div>
        </Card>

        {/* Agregar cuenta */}
        <SectionTitle>Agregar</SectionTitle>
        {addingAcc ? (
          <Card>
            <div style={lblStyle}>NOMBRE</div>
            <Input placeholder="Ej: Binance, Banco, Lemon…" value={newAcc.name} onChange={(e) => setNewAcc({ ...newAcc, name: e.target.value })} />
            <div style={{ ...lblStyle, marginTop: 10 }}>TIPO</div>
            <Segmented options={[["crypto", "Crypto"], ["pesos", "Pesos"], ["inversion", "Inversión"]]}
              value={newAcc.tipo} onChange={(v) => setNewAcc({ ...newAcc, tipo: v, moneda: v === "crypto" ? "USD" : newAcc.moneda })} />
            <div style={{ ...lblStyle, marginTop: 10 }}>MONEDA</div>
            <Segmented options={[["ARS", "Pesos ($)"], ["USD", "Dólares (US$)"]]}
              value={newAcc.moneda} onChange={(v) => setNewAcc({ ...newAcc, moneda: v })} />
            <div style={{ ...lblStyle, marginTop: 10 }}>ÍCONO</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {FIN_EMOJIS.map((em) => (
                <button key={em} onClick={() => setNewAcc({ ...newAcc, icon: em })}
                  style={{ fontSize: 18, padding: "6px 8px", borderRadius: 10, cursor: "pointer", border: "none", background: newAcc.icon === em ? C.primarySoft : C.soft }}>{em}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <Btn kind="ghost" onClick={() => { setAddingAcc(false); setNewAcc({ name: "", tipo: "pesos", moneda: "ARS", icon: "💰" }); }} style={{ flex: 1 }}>Cancelar</Btn>
              <Btn style={{ flex: 1 }} onClick={() => {
                if (!newAcc.name.trim()) { flash("Poné un nombre"); return; }
                up((s) => { s.finance.accounts.push({ id: uid(), name: newAcc.name.trim(), tipo: newAcc.tipo, moneda: newAcc.moneda, saldo: 0, icon: newAcc.icon, history: {} }); return s; });
                setAddingAcc(false); setNewAcc({ name: "", tipo: "pesos", moneda: "ARS", icon: "💰" });
                flash("Cuenta agregada");
              }}>Crear cuenta</Btn>
            </div>
          </Card>
        ) : addingWallet ? (
          <Card>
            <div style={lblStyle}>NOMBRE</div>
            <Input placeholder="Ej: Phantom, Axiom…" value={newWallet.name} onChange={(e) => setNewWallet({ ...newWallet, name: e.target.value })} />
            <div style={{ ...lblStyle, marginTop: 10 }}>DIRECCIÓN PÚBLICA (SOLANA)</div>
            <Input placeholder="Ej: 9WzD…AWWM" value={newWallet.address} onChange={(e) => setNewWallet({ ...newWallet, address: e.target.value.trim() })} />
            <div style={{ fontSize: 11.5, color: C.sub, fontWeight: 600, marginTop: 6, lineHeight: 1.4 }}>
              Solo la dirección pública — nunca pidas ni pegues acá tu frase semilla (seed phrase) o clave privada.
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <Btn kind="ghost" onClick={() => { setAddingWallet(false); setNewWallet({ name: "Phantom", address: "", icon: "👻" }); }} style={{ flex: 1 }}>Cancelar</Btn>
              <Btn style={{ flex: 1 }} onClick={() => {
                if (!newWallet.name.trim()) { flash("Poné un nombre"); return; }
                if (!newWallet.address.trim()) { flash("Poné la dirección pública"); return; }
                const nuevaAcc = { id: uid(), name: newWallet.name.trim(), tipo: "wallet", chain: "solana", address: newWallet.address.trim(), moneda: "USD", saldo: 0, icon: newWallet.icon, history: {} };
                up((s) => { s.finance.accounts.push(nuevaAcc); return s; });
                setAddingWallet(false); setNewWallet({ name: "Phantom", address: "", icon: "👻" });
                flash("Wallet agregada — sincronizando…");
                syncWallet(nuevaAcc);
              }}>Conectar</Btn>
            </div>
          </Card>
        ) : addingIol ? (
          <Card>
            <div style={lblStyle}>USUARIO IOL</div>
            <Input placeholder="Tu usuario de InvertirOnline" value={iolCreds.user} onChange={(e) => setIolCreds({ ...iolCreds, user: e.target.value })} />
            <div style={{ ...lblStyle, marginTop: 10 }}>CONTRASEÑA</div>
            <Input type="password" placeholder="Contraseña" value={iolCreds.pass}
              onChange={(e) => setIolCreds({ ...iolCreds, pass: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && syncIol()} />
            <div style={{ fontSize: 11.5, color: C.sub, fontWeight: 600, marginTop: 6, lineHeight: 1.4 }}>
              No se guardan — se usan una vez para pedir un token a la API oficial de IOL y se descartan.
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <Btn kind="ghost" onClick={() => { setAddingIol(false); setIolCreds({ name: "IOL", user: "", pass: "" }); }} style={{ flex: 1 }}>Cancelar</Btn>
              <Btn style={{ flex: 1 }} onClick={() => syncIol()}>{iolLoading ? "Conectando…" : "Conectar"}</Btn>
            </div>
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Btn kind="soft" onClick={() => setAddingWallet(true)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Ghost size={17} /> Conectar wallet Solana (Phantom)
            </Btn>
            <Btn kind="soft" onClick={() => setAddingIol(true)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Building2 size={17} /> Conectar broker (IOL)
            </Btn>
            <Btn kind="soft" onClick={() => setAddingAcc(true)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Plus size={17} /> Cuenta manual (banco, otras billeteras, etc.)
            </Btn>
          </div>
        )}

        {/* Tendencias de meme coins (CoinGecko, pública y sin login) */}
        <SectionTitle>Tendencias cripto (24h)</SectionTitle>
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: trending.length ? 10 : 0 }}>
            <Flame size={15} color={C.amber} />
            <span style={{ fontSize: 12, color: C.sub, fontWeight: 600, flex: 1 }}>Meme coins que más se movieron</span>
            <button onClick={fetchTrending} aria-label="Actualizar tendencias" style={{ border: "none", background: "transparent", cursor: "pointer", color: C.sub, display: "flex" }}>
              <RefreshCw size={13} style={trendingLoading ? { animation: "norteOrbSpin 0.8s linear infinite" } : undefined} />
            </button>
          </div>
          {!trending.length && !trendingLoading && <Empty text="Sin datos todavía" />}
          {trending.map((c) => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderTop: `1px solid ${C.line}` }}>
              <img src={c.image} alt="" width={22} height={22} style={{ borderRadius: 999, flexShrink: 0 }} onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                <div style={{ fontSize: 11, color: C.sub, fontWeight: 600, textTransform: "uppercase" }}>{c.symbol}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 800, fontSize: 13 }}>US$ {Number(c.current_price).toLocaleString("es-AR", { maximumFractionDigits: 6 })}</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: (c.price_change_percentage_24h || 0) >= 0 ? "#2e9e4f" : C.red }}>
                  {(c.price_change_percentage_24h || 0) >= 0 ? "+" : ""}{Number(c.price_change_percentage_24h || 0).toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </Card>

        <div style={{ fontSize: 12, color: C.sub, fontWeight: 600, textAlign: "center", margin: "16px 8px 4px", lineHeight: 1.5 }}>
          {pushCfg.url && pushCfg.token
            ? "🔄 Tu patrimonio se sincroniza con NEXO automáticamente."
            : "Configurá el servidor en Más → Notificaciones para sincronizar tu patrimonio con NEXO."}
        </div>
      </>
    );
  }

  function Habitos() {
    const iconBtnStyle = {
      width: 30, height: 26, borderRadius: 8, border: "none", cursor: "pointer",
      background: C.soft, color: C.sub, display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: FONT,
    };
    return (
      <>
        <PageHeader title="Hábitos" subtitle="Constancia diaria" />
        <Card style={{ display: "flex", gap: 8 }}>
          <Input placeholder="Nuevo hábito (ej: leer 15 min)" value={newHabit}
            onChange={(e) => setNewHabit(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addHabit()} />
          <Btn onClick={addHabit}>＋</Btn>
        </Card>

        {state.habits.map((h) => {
          const editing = editHabit === h.id;
          const showMonth = habitMonth === h.id;
          return (
            <Card key={h.id} style={{ marginTop: 10 }}>
              {(() => {
                const last7 = lastNDays(7);
                const planned7 = last7.filter((d) => h.days.includes(d.getDay())).length;
                const done7 = last7.filter((d) => h.history[dstr(d)]).length;
                const weekPct = planned7 ? done7 / planned7 : (done7 ? 1 : 0);
                const todayDone = !!h.history[today];
                const st = streak(h);
                return (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                    <Ring pct={weekPct} size={52} stroke={6} color={C.primary}>
                      <span style={{ fontSize: 21 }}>{h.icon}</span>
                    </Ring>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {editing ? (
                        <Input value={h.name} onChange={(e) => up((s) => {
                          s.habits.find((x) => x.id === h.id).name = e.target.value; return s;
                        })} />
                      ) : (
                        <>
                          <div style={{ fontWeight: 800, fontSize: 15.5, letterSpacing: -0.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.name}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 3 }}>
                            <span style={{ fontSize: 12.5, color: st > 0 ? C.amber : C.sub, fontWeight: 800, display: "flex", alignItems: "center", gap: 3 }}><Flame size={12} /> {st}</span>
                            <span style={{ fontSize: 12, color: C.sub, fontWeight: 700 }}>{done7}/{planned7 || 7} esta semana</span>
                          </div>
                        </>
                      )}
                    </div>
                    {!editing && (
                      <Check done={todayDone} onClick={() => up((s) => {
                        const hh = s.habits.find((x) => x.id === h.id);
                        if (hh.history[today]) delete hh.history[today]; else hh.history[today] = true;
                        return s;
                      })} />
                    )}
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
                      <button onClick={() => setHabitMonth(showMonth ? null : h.id)} style={iconBtnStyle}>{showMonth ? <X size={14} /> : <Calendar size={14} />}</button>
                      <button onClick={() => setEditHabit(editing ? null : h.id)} style={iconBtnStyle}>{editing ? <CheckIcon size={14} /> : <Pencil size={14} />}</button>
                    </div>
                  </div>
                );
              })()}

              {editing && (
                <>
                  <div style={lblStyle}>ÍCONO</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                    {EMOJIS.map((em) => (
                      <button key={em} onClick={() => up((s) => { s.habits.find((x) => x.id === h.id).icon = em; return s; })}
                        style={{
                          fontSize: 18, padding: "6px 8px", borderRadius: 10, cursor: "pointer",
                          border: "none", background: h.icon === em ? C.primarySoft : C.soft,
                        }}>{em}</button>
                    ))}
                  </div>
                  <div style={lblStyle}>DÍAS</div>
                  <DayPicker days={h.days} onToggle={(i) => up((s) => {
                    const hh = s.habits.find((x) => x.id === h.id);
                    hh.days = hh.days.includes(i) ? hh.days.filter((x) => x !== i) : [...hh.days, i];
                    return s;
                  })} />
                  <div style={{ marginTop: 10, textAlign: "right" }}>
                    <Btn kind="danger" small onClick={() => {
                      setEditHabit(null);
                      up((s) => { s.habits = s.habits.filter((x) => x.id !== h.id); return s; });
                    }}>Borrar hábito</Btn>
                  </div>
                </>
              )}

              {!editing && !showMonth && (
                <div style={{ display: "flex", gap: 6 }}>
                  {lastNDays(7).map((d) => {
                    const key = dstr(d);
                    const planned = h.days.includes(d.getDay());
                    const done = !!h.history[key];
                    const isToday = key === today;
                    return (
                      <div key={key} style={{ flex: 1, textAlign: "center" }}>
                        <div style={{ fontSize: 10.5, color: isToday ? C.primary : C.sub, fontWeight: 800, marginBottom: 5 }}>{DAYS[d.getDay()]}</div>
                        <div onClick={() => up((s) => {
                          const hh = s.habits.find((x) => x.id === h.id);
                          if (hh.history[key]) delete hh.history[key]; else hh.history[key] = true;
                          return s;
                        })}
                          style={{
                            height: 30, borderRadius: 9, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            background: done ? `linear-gradient(135deg, ${C.primary}, ${C.accent})` : planned ? C.soft : "transparent",
                            border: isToday && !done ? `1.5px solid ${C.primary}` : planned ? `1px solid ${C.line}` : `1px dashed ${C.line}`,
                            opacity: planned || done ? 1 : 0.55, transition: "background 0.2s ease",
                          }}>
                          {done && <CheckIcon size={13} strokeWidth={3} color="#fff" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {showMonth && <MonthGrid habit={h} />}
            </Card>
          );
        })}
      </>
    );
  }

  const addHabit = () => {
    const name = newHabit.trim();
    if (!name) return;
    up((s) => { s.habits.push({ id: uid(), name, icon: "✅", days: [0,1,2,3,4,5,6], history: {} }); return s; });
    setNewHabit("");
  };

  /* ============ GYM ============ */
  /* ---------- Carga muscular: saturación (fatiga) y volumen semanal (hipertrofia) ---------- */
  const satColor = (v) => (v >= 0.7 ? C.red : v >= 0.3 ? C.amber : C.green);
  const satLabel = (v) => (v >= 0.7 ? "Saturado" : v >= 0.3 ? "Recuperando" : "Listo");
  const volStatus = (v) =>
    v < VOLUME.mev ? { t: "Poco estímulo", c: C.sub }
      : v < VOLUME.mavLo ? { t: "Creciendo", c: C.amberInk }
        : v <= VOLUME.mavHi ? { t: "Óptimo", c: C.green }
          : v <= VOLUME.mrv ? { t: "Alto", c: C.amberInk }
            : { t: "Excesivo", c: C.red };

  function CargaMuscular() {
    const sat = saturation(state.sessionLog, state.running?.runs, new Date());
    const muscles = mapSide === "front" ? FRONT_MUSCLES : BACK_MUSCLES;
    const heat = Object.fromEntries(Object.entries(sat).map(([m, v]) => [m, satColor(v)]));
    const weeks = [3, 2, 1, 0].map((o) => weeklySets(state.sessionLog, today, o));
    const cur = weeks[3];
    // La rutina tiene N días de entreno por "semana" del programa; la escalamos a tus días reales de gym.
    const gymDays = new Set((state.schedule || []).filter((e) => e.who === "yo" && /gym/i.test(e.title)).map((e) => e.day)).size || 4;
    const progDays = (currentProgWeek?.days || []).length || 1;
    const planned = plannedSets(currentProgWeek);
    const plannedWk = (m) => Math.round((planned[m] || 0) * Math.min(1, gymDays / progDays));
    const allM = [...new Set([...FRONT_MUSCLES, ...BACK_MUSCLES])];
    const r1 = (v) => Math.round(v * 10) / 10;
    const sel = muscle && sat[muscle] != null ? muscle : null;
    const hoursToReady = (v) => (v <= 0.3 ? 0 : Math.ceil(36 * Math.log(v / 0.3)));

    if (loadView === "saturacion") {
      return (
        <>
          <Card>
            <div style={{ marginBottom: 12 }}>
              <Segmented options={[["front", "Frente"], ["back", "Espalda"]]} value={mapSide} onChange={(id) => { setMapSide(id); setMuscle(null); }} />
            </div>
            <BodyMap side={mapSide} selected={sel} heat={heat} onSelect={(m) => setMuscle(m === muscle ? null : m)} />
            <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 10, fontSize: 12, fontWeight: 700, color: C.sub }}>
              {[["Listo", C.green], ["Recuperando", C.amber], ["Saturado", C.red]].map(([l, c]) => (
                <span key={l} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: c }} />{l}
                </span>
              ))}
            </div>
            {sel && (
              <div style={{ background: C.soft, borderRadius: 12, padding: 12, marginTop: 12, fontSize: 13.5, fontWeight: 600, lineHeight: 1.45 }}>
                <b>{EXDB[sel].label}</b>: {Math.round(sat[sel] * 100)} % de saturación · {satLabel(sat[sel])}.{" "}
                {hoursToReady(sat[sel]) > 0 ? `Listo para entrenarlo fuerte en ~${hoursToReady(sat[sel])} h.` : "Podés entrenarlo fuerte hoy."}
              </div>
            )}
          </Card>
          <SectionTitle>Saturación por músculo</SectionTitle>
          <Card style={{ padding: "8px 14px" }}>
            {muscles.slice().sort((a, b) => sat[b] - sat[a]).map((m) => (
              <div key={m} onClick={() => setMuscle(m)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", cursor: "pointer" }}>
                <div style={{ width: 86, fontSize: 13, fontWeight: 700 }}>{EXDB[m].label}</div>
                <div style={{ flex: 1, height: 8, borderRadius: 4, background: C.line, overflow: "hidden" }}>
                  <div style={{ width: `${Math.max(2, sat[m] * 100)}%`, height: "100%", borderRadius: 4, background: satColor(sat[m]) }} />
                </div>
                <div style={{ width: 92, textAlign: "right", fontSize: 12, fontWeight: 700, color: C.sub }}>{Math.round(sat[m] * 100)} % · {satLabel(sat[m])}</div>
              </div>
            ))}
          </Card>
          <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.45, margin: "8px 4px 0" }}>
            Se calcula con los ejercicios que marcás como hechos (y tus salidas a correr, para piernas). Cada serie suma fatiga que se va recuperando en ~48–72 h. Es una estimación: si te sentís cargado, hacé caso a tu cuerpo.
          </div>
        </>
      );
    }

    // Volumen semanal (estímulo de hipertrofia)
    const rows = allM.map((m) => ({ m, v: r1(cur[m] || 0), p: plannedWk(m), hist: weeks.map((w) => r1(w[m] || 0)) }))
      .sort((a, b) => b.v - a.v || b.p - a.p);
    const maxV = Math.max(VOLUME.mrv + 2, ...rows.map((r) => Math.max(r.v, r.p)));
    const X = (v) => `${(v / maxV) * 100}%`;
    const optimos = rows.filter((r) => r.v >= VOLUME.mavLo && r.v <= VOLUME.mavHi).length;
    return (
      <>
        <Card>
          <div style={{ fontSize: 12, fontWeight: 800, color: C.sub, letterSpacing: 0.4 }}>ESTÍMULO DE HIPERTROFIA · ÚLTIMOS 7 DÍAS</div>
          <div style={{ fontSize: 22, fontWeight: 800, margin: "4px 0 2px" }}>{optimos} de {allM.length} músculos en zona óptima</div>
          <div style={{ fontSize: 12.5, color: C.sub, fontWeight: 600, lineHeight: 1.45 }}>
            Series efectivas por semana (los secundarios cuentan a medias). Zona óptima para crecer: {VOLUME.mavLo}–{VOLUME.mavHi} series. Menos de {VOLUME.mev} casi no estimula; más de {VOLUME.mrv} cuesta recuperarse.
          </div>
        </Card>
        <SectionTitle>Series por músculo</SectionTitle>
        <Card style={{ padding: "10px 14px" }}>
          <div style={{ display: "flex", gap: 14, fontSize: 11.5, fontWeight: 700, color: C.sub, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: C.primary }} />Hecho</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 2, height: 12, background: C.ink }} />Tu rutina (hecho / rutina)</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 14, height: 10, borderRadius: 3, background: C.greenSoft }} />Zona óptima</span>
          </div>
          {rows.map((r) => {
            const st = volStatus(r.v);
            return (
              <div key={r.m} style={{ padding: "7px 0", borderTop: `1px solid ${C.line}` }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, fontSize: 13, fontWeight: 700, marginBottom: 5 }}>
                  <span style={{ flex: 1, minWidth: 0 }}>{EXDB[r.m].label.split(" (")[0]} <span style={{ color: st.c, fontSize: 11.5, fontWeight: 800 }}>{st.t}</span></span>
                  <span style={{ color: C.sub, fontWeight: 600, fontSize: 12, whiteSpace: "nowrap" }}><b style={{ color: C.ink }}>{r.v}</b>{r.p ? ` / ${r.p}` : ""} series</span>
                </div>
                <div style={{ position: "relative", height: 10, borderRadius: 5, background: C.line }}>
                  <div style={{ position: "absolute", left: X(VOLUME.mavLo), width: `calc(${X(VOLUME.mavHi)} - ${X(VOLUME.mavLo)})`, top: 0, bottom: 0, background: C.greenSoft }} />
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: X(r.v), borderRadius: 5, background: C.primary }} />
                  {r.p > 0 && <div style={{ position: "absolute", left: X(r.p), top: -3, bottom: -3, width: 2, background: C.ink, borderRadius: 1 }} />}
                </div>
                <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 16, marginTop: 5 }} title="Últimas 4 semanas">
                  <span style={{ fontSize: 10.5, color: C.sub, fontWeight: 600, marginRight: 4 }}>4 sem:</span>
                  {r.hist.map((h, i) => (
                    <div key={i} style={{ width: 12, height: Math.max(2, (h / maxV) * 16), borderRadius: 2, background: i === 3 ? C.primary : C.sub, opacity: i === 3 ? 1 : 0.4 }} />
                  ))}
                  <span style={{ fontSize: 10.5, color: C.sub, fontWeight: 600, marginLeft: 4 }}>{r.hist.join(" · ")}</span>
                </div>
              </div>
            );
          })}
        </Card>
        <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.45, margin: "8px 4px 0" }}>
          Para que cuente bien, cargá las reps de cada serie antes de marcar el ejercicio como hecho. Si no hay reps cargadas, se toman las series del nombre (ej: "3x8-10"). La rutina se escala a tus {gymDays} días de gym por semana de la Agenda.
        </div>
      </>
    );
  }

  function Musculos() {
    const muscles = mapSide === "front" ? FRONT_MUSCLES : BACK_MUSCLES;
    const md = muscle ? EXDB[muscle] : null;

    return (
      <>
        <div style={{ marginBottom: 12 }}>
          <Segmented options={[["ejercicios", "Ejercicios"], ["saturacion", "Saturación"], ["volumen", "Hipertrofia"]]} value={loadView} onChange={(v) => { setLoadView(v); setMuscle(null); setOpenLift(null); }} />
        </div>
        {loadView !== "ejercicios" ? CargaMuscular() : (
        <>
        <Card>
          <div style={{ marginBottom: 12 }}>
            <Segmented
              options={[["front", "Frente"], ["back", "Espalda"]]}
              value={mapSide}
              onChange={(id) => { setMapSide(id); setMuscle(null); setOpenLift(null); }}
            />
          </div>
          <BodyMap side={mapSide} selected={muscle} onSelect={(m) => { setMuscle(m === muscle ? null : m); setOpenLift(null); }} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginTop: 12 }}>
            {muscles.map((m) => {
              const active = muscle === m;
              return (
                <button key={m} onClick={() => { setMuscle(m === muscle ? null : m); setOpenLift(null); }} style={{
                  border: `1px solid ${active ? "transparent" : C.line}`,
                  borderRadius: 20, padding: "7px 12px", cursor: "pointer",
                  fontFamily: FONT, fontWeight: 700, fontSize: 12.5, letterSpacing: -0.1,
                  background: active ? `linear-gradient(135deg, ${C.primary}, ${C.accent})` : C.card,
                  color: active ? "#fff" : C.sub,
                  boxShadow: active ? `0 4px 12px ${C.primaryGlow}` : "none",
                  transition: "all 0.15s",
                }}>{EXDB[m].label}</button>
              );
            })}
          </div>
          <div style={{ fontSize: 12.5, color: C.sub, textAlign: "center", marginTop: 10 }}>
            Tocá un músculo en el cuerpo o en las etiquetas.
          </div>
        </Card>

        {!bodyWeight && (
          <Card style={{ marginTop: 10, background: C.amberSoft }}>
            <div style={{ fontSize: 13.5, color: C.amberInk, fontWeight: 600, lineHeight: 1.4, display: "flex", gap: 8, alignItems: "flex-start" }}>
              <Lightbulb size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>Registrá tu peso corporal en la pestaña Dieta para que el análisis de fuerza sea relativo a tu peso.</span>
            </div>
          </Card>
        )}

        {md && (
          <>
            <SectionTitle>Ejercicios de {md.label.toLowerCase()}</SectionTitle>
            {md.exercises.map((e) => {
              const open = openLift === e.name;
              const an = open ? analyzeLift(e, liftCalc.w, liftCalc.r, bodyWeight) : null;
              const toneColor = an ? { up: C.primary, ok: C.blue, hold: C.amber, down: C.red }[an.tone] : null;
              const inRoutine = !!currentProgDay && currentProgDay.exercises.some((x) => x.name === e.name);
              return (
                <Card key={e.name} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>
                        {e.name} {inRoutine && <span style={{ fontSize: 11, color: C.primary, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 2 }}>· en tu día actual <CheckIcon size={12} /></span>}
                      </div>
                      <div style={{ fontSize: 12.5, color: C.sub, fontWeight: 600 }}>{e.eq}{e.ratio ? " · con análisis de fuerza" : ""}</div>
                    </div>
                    <Btn kind="soft" small onClick={() => { setOpenLift(open ? null : e.name); setLiftCalc({ w: "", r: "" }); }}>
                      {open ? "▲" : "Ver"}
                    </Btn>
                  </div>

                  {open && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ background: C.soft, borderRadius: 12, padding: 12, fontSize: 13.5, lineHeight: 1.5, marginBottom: 10 }}>
                        <b>Técnica:</b> {e.tip}
                      </div>
                      <a href={ytLink(e.name)} target="_blank" rel="noreferrer"
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 700, color: C.blue, textDecoration: "none", marginBottom: 12 }}>
                        <Video size={14} /> Ver cómo se hace (videos de referencia) →
                      </a>

                      <div style={{ fontWeight: 700, fontSize: 13.5, margin: "4px 0 8px" }}>¿Cómo venís con este ejercicio?</div>
                      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                        <div style={{ flex: 1 }}>
                          <div style={lblStyle}>Peso que usás (kg)</div>
                          <Input type="number" placeholder="0 si es sin peso" value={liftCalc.w} onChange={(ev) => setLiftCalc({ ...liftCalc, w: ev.target.value })} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={lblStyle}>Reps que lográs</div>
                          <Input type="number" placeholder="ej: 10" value={liftCalc.r} onChange={(ev) => setLiftCalc({ ...liftCalc, r: ev.target.value })} />
                        </div>
                      </div>

                      {an && (
                        <div style={{ borderLeft: `4px solid ${toneColor}`, background: C.soft, borderRadius: 12, padding: 12, marginBottom: 10 }}>
                          <div style={{ fontWeight: 800, fontSize: 14, color: toneColor, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                            {an.tone === "up" ? <TrendingUp size={16} /> : an.tone === "ok" ? <CheckIcon size={16} /> : an.tone === "hold" ? <Dumbbell size={16} /> : <AlertTriangle size={16} />}
                            {an.tone === "up" ? "Momento de subir" : an.tone === "ok" ? "Vas por buen camino" : an.tone === "hold" ? "Consolidá este peso" : "Ajustá la carga"}
                          </div>
                          <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>{an.advice}</div>
                          {an.e1rm ? (
                            <div style={{ fontSize: 12.5, color: C.sub, marginTop: 6, fontWeight: 600 }}>
                              Tu 1RM estimado: ~{an.e1rm} kg
                              {an.level ? ` · Nivel: ${an.level}` : ""}
                              {an.nextTarget ? ` · Próxima meta: ${an.nextTarget} kg de 1RM` : ""}
                              {bodyWeight ? ` (peso corporal: ${bodyWeight} kg)` : ""}
                            </div>
                          ) : null}
                        </div>
                      )}

                      <Btn onClick={() => addExerciseToCurrentDay(e.name, liftCalc.w)} style={{ width: "100%" }}>
                        ＋ Agregar al día actual
                      </Btn>
                    </div>
                  )}
                </Card>
              );
            })}
          </>
        )}
        </>
        )}
      </>
    );
  }

  function ProgramaView(mode) {
    const isRutina = mode === "rutina";
    const progW = state.program.weeks[state.currentWeek];
    const day = progW ? progW.days[state.currentDay] : null;
    const dayTonnage = day ? day.exercises.reduce((a, e) => a + tonnage(e), 0) : 0;
    const prevDay = day && state.currentWeek > 0 ? state.program.weeks[state.currentWeek - 1].days[state.currentDay] : null;
    const canCopyPrev = !!prevDay && prevDay.exercises.length > 0 && day.exercises.length === 0;

    const handleImportFile = async (ev) => {
      const file = ev.target.files && ev.target.files[0];
      ev.target.value = "";
      if (!file) return;
      setImportingRoutine(true);
      try {
        const parsed = await parseRoutineWorkbook(file);
        const totalEx = parsed.weeks.reduce((a, w) => a + w.days.reduce((b, d) => b + d.exercises.length, 0), 0);
        if (totalEx === 0) {
          setBanner("No encontré ejercicios en ese archivo. ¿Tiene el formato de tu coach (hojas 'SEMANA' con bloques 'Día N')?");
          setTimeout(() => setBanner(null), 6000);
          return;
        }
        if (!confirm(`Encontré ${parsed.weeks.length} semana(s) y ${totalEx} ejercicio(s). Esto va a reemplazar tu Programa actual. ¿Importar?`)) return;
        up((s) => { s.program = parsed; s.currentWeek = 0; s.currentDay = 0; return s; });
        setBanner("Rutina importada");
        setTimeout(() => setBanner(null), 4000);
      } catch {
        setBanner("No pude leer ese archivo. ¿Es un .xlsx válido?");
        setTimeout(() => setBanner(null), 5000);
      } finally {
        setImportingRoutine(false);
      }
    };

    const updDay = (fn) => up((s) => { fn(s.program.weeks[state.currentWeek].days[state.currentDay]); return s; });

    const addExercise = () => updDay((d) => {
      d.exercises.push({
        id: uid(), name: "", intensity: "", rest: "",
        sets: [{ weight: "", reps: "", rir: "" }, { weight: "", reps: "", rir: "" }, { weight: "", reps: "", rir: "" }],
      });
    });
    const removeExercise = (id) => updDay((d) => { d.exercises = d.exercises.filter((x) => x.id !== id); });
    const editExercise = (id, field, value) => updDay((d) => { d.exercises.find((x) => x.id === id)[field] = value; });
    const addSet = (id) => updDay((d) => {
      const ex = d.exercises.find((x) => x.id === id);
      if (ex.sets.length < 6) ex.sets.push({ weight: "", reps: "", rir: "" });
    });
    const removeSet = (id) => updDay((d) => {
      const ex = d.exercises.find((x) => x.id === id);
      if (ex.sets.length > 1) ex.sets.pop();
    });
    const editSet = (id, i, field, value) => updDay((d) => { d.exercises.find((x) => x.id === id).sets[i][field] = value; });
    const copyPrevWeek = () => up((s) => {
      const prev = s.program.weeks[state.currentWeek - 1].days[state.currentDay];
      s.program.weeks[state.currentWeek].days[state.currentDay].exercises = prev.exercises.map((e) => ({
        id: uid(), name: e.name, intensity: e.intensity, rest: e.rest,
        sets: e.sets.map(() => ({ weight: "", reps: "", rir: "" })),
      }));
      return s;
    });

    return (
      <>
        {!isRutina && (
          <Card style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 13, color: C.sub, fontWeight: 600, lineHeight: 1.4, display: "flex", gap: 8, alignItems: "flex-start" }}>
                <Upload size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>Importá el Excel que te pasa tu coach y se carga toda la rutina (semanas, días y ejercicios) automáticamente.</span>
              </div>
              <Btn small onClick={() => fileImportRef.current && fileImportRef.current.click()} style={{ flexShrink: 0 }}>
                {importingRoutine ? "Leyendo…" : "Importar .xlsx"}
              </Btn>
            </div>
            <input ref={fileImportRef} type="file" accept=".xlsx" style={{ display: "none" }} onChange={handleImportFile} />
          </Card>
        )}

        {!progW && <Card><Empty text="Todavía no hay semanas cargadas. Importá tu rutina o agregá ejercicios manualmente." /></Card>}

        {progW && (
          <>
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              {state.program.weeks.map((w, i) => {
                const active = state.currentWeek === i;
                const hasEx = w.days.some((d) => d.exercises.length > 0);
                return (
                  <button key={i} onClick={() => setCurrentWeek(i)} style={{
                    flex: 1, padding: "10px 0 8px", borderRadius: 12, cursor: "pointer",
                    fontWeight: 800, fontSize: 13, fontFamily: FONT,
                    border: `1px solid ${active ? "transparent" : C.line}`,
                    background: active ? `linear-gradient(135deg, ${C.primary}, ${C.accent})` : C.card,
                    color: active ? "#fff" : hasEx ? C.ink : C.sub,
                    boxShadow: active ? `0 4px 12px ${C.primaryGlow}` : "none",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                    transition: "all 0.15s",
                  }}>
                    S{i + 1}
                    <span style={{ width: 4, height: 4, borderRadius: 2, background: active ? "rgba(255,255,255,0.9)" : hasEx ? C.primary : "transparent" }} />
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
              {progW.days.map((d, i) => {
                const active = state.currentDay === i;
                const hasEx = d.exercises.length > 0;
                return (
                  <button key={i} onClick={() => setCurrentDay(i)} style={{
                    flex: "1 1 0", minWidth: 34, padding: "10px 0 8px", borderRadius: 12, cursor: "pointer",
                    fontWeight: 800, fontSize: 12.5, fontFamily: FONT,
                    border: `1px solid ${active ? "transparent" : C.line}`,
                    background: active ? `linear-gradient(135deg, ${C.primary}, ${C.accent})` : C.card,
                    color: active ? "#fff" : hasEx ? C.ink : C.sub,
                    boxShadow: active ? `0 4px 12px ${C.primaryGlow}` : "none",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                    transition: "all 0.15s",
                  }}>
                    {i + 1}
                    <span style={{ width: 4, height: 4, borderRadius: 2, background: active ? "rgba(255,255,255,0.9)" : hasEx ? C.primary : "transparent" }} />
                  </button>
                );
              })}
            </div>

            {!day && <Card><Empty text="Esta semana no tiene días cargados." /></Card>}

            {day && (
              <>
                <Card>
                  <Input placeholder={`Nombre del Día ${state.currentDay + 1} (ej: Piernas)`} value={day.name}
                    onChange={(e) => updDay((d) => { d.name = e.target.value; })}
                    style={{ fontWeight: 700, fontSize: 17, marginBottom: 10 }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ fontSize: 13, color: C.sub, fontWeight: 700 }}>Tonelaje total del día</div>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>{dayTonnage.toLocaleString("es-AR")} kg</div>
                  </div>
                  <div style={lblStyle}>OBSERVACIONES Y NOTAS</div>
                  <textarea
                    placeholder="Sensaciones, ajustes, lo que quieras recordar de esta sesión…"
                    value={day.notes}
                    onChange={(e) => updDay((d) => { d.notes = e.target.value; })}
                    style={{
                      width: "100%", boxSizing: "border-box", minHeight: 60, resize: "vertical",
                      border: `1.5px solid ${C.line}`, borderRadius: 12, padding: 10,
                      fontFamily: FONT, fontSize: 14, background: C.input, color: C.ink, outline: "none",
                    }} />
                </Card>

                {canCopyPrev && (
                  <Card style={{ marginTop: 10, background: C.primarySoft }}>
                    <div style={{ fontSize: 13.5, color: C.theme === "dark" ? C.primaryInk : C.primary, fontWeight: 600, marginBottom: 10, lineHeight: 1.4, display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <Lightbulb size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                      <span>La Semana {state.currentWeek} ya tiene ejercicios cargados para este día. ¿Copiamos la misma estructura (sin los pesos) para seguir la progresión?</span>
                    </div>
                    <Btn small onClick={copyPrevWeek}>Copiar ejercicios de Semana {state.currentWeek}</Btn>
                  </Card>
                )}

                <SectionTitle>Ejercicios</SectionTitle>
                {day.exercises.length === 0 && <Card><Empty text="Todavía no cargaste ejercicios para este día." /></Card>}
                {day.exercises.map((e) => {
                  const showDetail = isRutina && exDetail === e.id;
                  const pr = prOf(e.name);
                  const hist = (state.exerciseHistory[e.name] || []).slice(-10);
                  const dbEx = Object.values(EXDB).flatMap((m) => m.exercises).find((x) => x.name === e.name);
                  return (
                    <Card key={e.id} style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        {isRutina && <Check color={C.amber} done={!!wLog[e.id]} onClick={() => toggleEx(e)} />}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Input placeholder="Nombre del ejercicio (ej: Sentadilla 3x5)" value={e.name}
                            onChange={(ev) => editExercise(e.id, "name", ev.target.value)}
                            style={{ fontWeight: 700 }} />
                          {isRutina && pr ? (
                            <div style={{ fontSize: 11.5, color: C.amber, fontWeight: 800, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                              <Award size={12} /> PR {pr} kg
                            </div>
                          ) : null}
                        </div>
                        {isRutina && (hist.length > 0 || dbEx) && (
                          <Btn kind="ghost" small onClick={() => setExDetail(showDetail ? null : e.id)}>{showDetail ? "▲" : "ℹ️"}</Btn>
                        )}
                        <Btn kind="danger" small onClick={() => removeExercise(e.id)}><X size={14} /></Btn>
                      </div>

                      {showDetail && (
                        <div style={{ marginTop: 10, background: C.soft, borderRadius: 12, padding: 10 }}>
                          {dbEx && (
                            <>
                              <div style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 6 }}><b>Técnica:</b> {dbEx.tip}</div>
                              <a href={ytLink(e.name)} target="_blank" rel="noreferrer"
                                style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: C.blue, textDecoration: "none" }}>
                                <Video size={13} /> Ver cómo se hace →
                              </a>
                            </>
                          )}
                          {hist.length > 0 && (
                            <>
                              <div style={{ fontSize: 11.5, fontWeight: 800, color: C.sub, margin: "10px 0 4px" }}>HISTORIAL DE PESO</div>
                              {hist.map((x, i) => (
                                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "2px 0", fontWeight: 600 }}>
                                  <span style={{ color: C.sub }}>{fmtDate(x.date)}</span>
                                  <span style={{ color: Number(x.weight) === pr ? C.amber : C.ink, display: "flex", alignItems: "center", gap: 4 }}>
                                    {x.weight} kg{Number(x.weight) === pr ? <Award size={12} /> : null}
                                  </span>
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                      )}

                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div style={lblStyle}>Intensidad (RIR/RPE)</div>
                          <Input placeholder="rir 1 - @8-9" value={e.intensity} onChange={(ev) => editExercise(e.id, "intensity", ev.target.value)} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={lblStyle}>Descanso</div>
                          <Input placeholder="3'-4'" value={e.rest} onChange={(ev) => editExercise(e.id, "rest", ev.target.value)} />
                        </div>
                      </div>

                      <div style={{ marginTop: 10 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "20px 1fr 1fr 1fr", gap: 6, marginBottom: 4 }}>
                          <div />
                          <div style={lblStyle}>Peso (kg)</div>
                          <div style={lblStyle}>Reps</div>
                          <div style={lblStyle}>RIR</div>
                        </div>
                        {e.sets.map((st, i) => (
                          <div key={i} style={{ display: "grid", gridTemplateColumns: "20px 1fr 1fr 1fr", gap: 6, alignItems: "center", marginBottom: 6 }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: C.sub, textAlign: "center" }}>{i + 1}</div>
                            <Input type="number" value={st.weight} onChange={(ev) => editSet(e.id, i, "weight", ev.target.value)} />
                            <Input type="number" value={st.reps} onChange={(ev) => editSet(e.id, i, "reps", ev.target.value)} />
                            <Input type="number" value={st.rir} onChange={(ev) => editSet(e.id, i, "rir", ev.target.value)} />
                          </div>
                        ))}
                        <div style={{ display: "flex", gap: 6, marginTop: 4, alignItems: "center" }}>
                          <Btn kind="soft" small onClick={() => addSet(e.id)} style={{ opacity: e.sets.length >= 6 ? 0.4 : 1 }}>+ Serie</Btn>
                          <Btn kind="ghost" small onClick={() => removeSet(e.id)} style={{ opacity: e.sets.length <= 1 ? 0.4 : 1 }}>－ Serie</Btn>
                          <div style={{ flex: 1 }} />
                          <div style={{ fontSize: 12.5, color: C.sub, fontWeight: 700 }}>
                            Tonelaje: <span style={{ color: C.ink, fontWeight: 800 }}>{tonnage(e).toLocaleString("es-AR")} kg</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}

                <Btn onClick={addExercise} style={{ width: "100%" }}>＋ Agregar ejercicio</Btn>
              </>
            )}
          </>
        )}
      </>
    );
  }

  function Gym() {
    const historyDates = Object.keys(state.sessionLog)
      .filter((k) => (state.sessionLog[k] || []).length > 0)
      .sort((a, b) => b.localeCompare(a));

    return (
      <>
        <PageHeader title="Gimnasio" subtitle="Entrenamiento" />

        {/* Cronómetro de descanso (vive en el apartado de Gimnasio) */}
        <div style={{ marginBottom: 14 }}>
          {timer > 0 || timerPaused ? (() => {
            const paused = !!timerPaused;
            const shown = paused ? timerPaused : timer;
            const roundBtn = (onClick, node, extra = {}) => (
              <button onClick={onClick} style={{
                background: C.soft, border: "none", borderRadius: 14, width: 40, height: 40,
                cursor: "pointer", color: C.sub, display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, transition: "transform 0.12s ease", ...extra,
              }}
                onPointerDown={(e) => { e.currentTarget.style.transform = "scale(0.9)"; }}
                onPointerUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                onPointerLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}>{node}</button>
            );
            return (
              <div style={{
                background: C.card, border: `1.5px solid ${C.amberSoft}`, borderRadius: 20,
                padding: "12px 14px", display: "flex", alignItems: "center", gap: 12,
                boxShadow: `0 8px 24px rgba(0,0,0,0.10)`,
              }}>
                <Ring pct={shown / timerTotal} size={60} stroke={6} color={C.amber}>
                  <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: -0.6, fontVariantNumeric: "tabular-nums" }}>{fmtClock(shown)}</div>
                </Ring>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15.5, fontWeight: 800, letterSpacing: -0.2 }}>Descanso</div>
                  <div style={{ fontSize: 12, color: paused ? C.amberInk : C.sub, fontWeight: 700 }}>
                    {paused ? "En pausa" : "Recuperá para la próxima serie"}
                  </div>
                </div>
                {roundBtn(() => addTimer(30), <span style={{ fontSize: 12, fontWeight: 900 }}>+30</span>)}
                {roundBtn(paused ? resumeTimer : pauseTimer,
                  paused ? <Play size={17} fill="currentColor" /> : <Pause size={17} fill="currentColor" />,
                  { background: C.amberSoft, color: C.amberInk })}
                {roundBtn(stopTimer, <X size={17} />)}
              </div>
            );
          })() : (
            <div style={{
              display: "flex", alignItems: "center", gap: 8, background: C.card,
              border: `1px solid ${C.line}`, borderRadius: 16, padding: "10px 12px",
              boxShadow: "0 4px 14px rgba(0,0,0,0.05)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.sub, fontWeight: 800, fontSize: 12.5, flexShrink: 0 }}>
                <Clock size={16} /> Descanso
              </div>
              <div style={{ display: "flex", gap: 7, flex: 1, justifyContent: "flex-end" }}>
                {[60, 90, 120].map((t) => (
                  <button key={t} onClick={() => startTimer(t)} style={{
                    border: "none", borderRadius: 12, padding: "10px 16px", cursor: "pointer",
                    fontFamily: FONT, fontWeight: 800, fontSize: 13.5, fontVariantNumeric: "tabular-nums", transition: "transform 0.12s ease",
                    background: C.primarySoft, color: C.theme === "dark" ? C.primaryInk : C.primary,
                  }}
                    onPointerDown={(e) => { e.currentTarget.style.transform = "scale(0.92)"; }}
                    onPointerUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                    onPointerLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}>{fmtClock(t)}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ marginBottom: 14 }}>
          <Segmented
            options={[["rutina", "Rutina"], ["programa", "Programa"], ["musculos", <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><PersonStanding size={13} /> Músculos</span>], ["historial", "Historial"]]}
            value={gymView}
            onChange={setGymView}
          />
        </div>

        {gymView === "rutina" && ProgramaView("rutina")}

        {gymView === "programa" && ProgramaView("programa")}

        {gymView === "musculos" && Musculos()}

        {gymView === "historial" && (
          <>
            {historyDates.length === 0 && <Card><Empty text="Todavía no registraste entrenamientos. Marcá ejercicios como hechos y van a aparecer acá." /></Card>}
            {historyDates.map((k) => (
              <Card key={k} style={{ marginBottom: 8 }}>
                <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 6, textTransform: "capitalize" }}>
                  {fmtDate(k)} <span style={{ color: C.sub, fontWeight: 600 }}>· {state.sessionLog[k].length} ejercicio{state.sessionLog[k].length === 1 ? "" : "s"}</span>
                </div>
                {state.sessionLog[k].map((e, i) => (
                  <div key={i} style={{ fontSize: 13.5, color: C.sub, padding: "3px 0", fontWeight: 500 }}>
                    • {e.name} — {e.setsCount} serie{e.setsCount === 1 ? "" : "s"}{e.tonnage ? ` · ${e.tonnage.toLocaleString("es-AR")} kg` : ""}
                  </div>
                ))}
              </Card>
            ))}
          </>
        )}
      </>
    );
  }

  /* ============ SALUD: agua (esfera en ml) + horarios de ayuno ============ */
  const [waterCustom, setWaterCustom] = useState("");
  const [fastEdit, setFastEdit] = useState(false); // los horarios de ayuno se editan solo tras confirmar con tu PIN
  const [fastPin, setFastPin] = useState(null);    // null = no se está pidiendo PIN; string = PIN tipeado
  const [, setClockTick] = useState(0);
  useEffect(() => {
    if (tab !== "salud" && tab !== "hoy") return;
    const iv = setInterval(() => setClockTick((x) => x + 1), 30000);
    return () => clearInterval(iv);
  }, [tab]);

  const addWater = (ml) => up((s) => {
    s.waterLog = s.waterLog || {};
    s.waterLog[today] = [...(s.waterLog[today] || []), { id: uid(), ml, t: new Date().toISOString() }];
    return s;
  });
  const removeWater = (id) => up((s) => {
    s.waterLog[today] = (s.waterLog[today] || []).filter((e) => e.id !== id);
    return s;
  });
  const setWaterGoal = (ml) => up((s) => { s.goals.waterMl = Math.max(500, Math.min(6000, Math.round(ml / 50) * 50)); return s; });

  const fasting = state.fasting || { windows: [] };
  const fastNow = fastStatus(fasting.windows, new Date());
  const hhmm = (d) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  const durTxt = (ms) => { const m = Math.max(0, Math.round(ms / 60000)); return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`; };
  const dayTxt = (d) => {
    const diff = Math.round((new Date(dstr(d) + "T00:00:00") - new Date(today + "T00:00:00")) / 86400000);
    return diff === 0 ? "hoy" : diff === 1 ? "mañana" : DAY_NAMES[d.getDay()].toLowerCase();
  };
  const setFastWindows = (fn) => up((s) => { s.fasting = s.fasting || { windows: [] }; s.fasting.windows = fn(s.fasting.windows || []); return s; });

  const unlockFastEdit = async () => {
    let stored = null;
    try { stored = localStorage.getItem(PIN_KEY); } catch (e) { /* sin storage */ }
    if (!stored) { setFastEdit(true); return; }
    if (fastPin == null) { setFastPin(""); return; }
    if ((await hashPin(fastPin)) === stored) { setFastEdit(true); setFastPin(null); }
    else { flash("PIN incorrecto"); setFastPin(""); }
  };

  function FastCard({ compact }) {
    if (!fasting.windows.length) {
      return compact ? null : <Empty text="Todavía no agendaste horarios de ayuno." />;
    }
    const a = fastNow.active, n = fastNow.next;
    if (a) {
      const pct = (Date.now() - a.start) / (a.end - a.start);
      return (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 15 }}>
            <Hourglass size={17} color={C.amber} /> En ayuno · llevás {durTxt(Date.now() - a.start)}
          </div>
          <div style={{ fontSize: 13, color: C.sub, fontWeight: 600, margin: "4px 0 8px" }}>
            Termina {dayTxt(a.end)} a las <b style={{ color: C.ink }}>{hhmm(a.end)}</b> (faltan {durTxt(a.end - Date.now())}) · solo agua, café o té sin azúcar
          </div>
          <div style={{ height: 8, borderRadius: 4, background: C.line, overflow: "hidden" }}>
            <div style={{ width: `${Math.min(100, pct * 100)}%`, height: "100%", background: C.amber, borderRadius: 4 }} />
          </div>
        </div>
      );
    }
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 15 }}>
          🍽️ Ventana para comer
        </div>
        {n && (
          <div style={{ fontSize: 13, color: C.sub, fontWeight: 600, marginTop: 4 }}>
            Próximo ayuno: {dayTxt(n.start)} a las <b style={{ color: C.ink }}>{hhmm(n.start)}</b> (en {durTxt(n.start - Date.now())}) · {fastHours(n.w)} h
          </div>
        )}
      </div>
    );
  }

  function Salud() {
    const pct = water / waterGoal;
    const left = Math.max(0, waterGoal - water);
    const last7 = lastNDays(7).map((d) => {
      const k = dstr(d);
      const ml = ((state.waterLog || {})[k] || []).reduce((a, e) => a + (Number(e.ml) || 0), 0);
      return { label: DAYS[d.getDay()], title: fmtDate(k), value: ml };
    });
    const ib = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 };
    const PRESETS = [["16:8", "20:00", "12:00"], ["14:10", "20:00", "10:00"], ["18:6", "18:00", "12:00"]];
    return (
      <>
        <PageHeader title="Salud" subtitle="Agua y ayuno" />

        <Card>
          <WaterSphere pct={pct} size={230}>
            <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: -1.2, fontVariantNumeric: "tabular-nums" }}>{water.toLocaleString("es-AR")}</div>
            <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.85 }}>de {waterGoal.toLocaleString("es-AR")} ml · {Math.round(pct * 100)} %</div>
          </WaterSphere>
          <div style={{ textAlign: "center", fontSize: 13.5, fontWeight: 700, color: left ? C.sub : C.green, margin: "10px 0 14px" }}>
            {left ? `Te faltan ${left.toLocaleString("es-AR")} ml` : "💧 ¡Meta de agua cumplida!"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {[250, 500, 750, 1000].map((ml, i) => (
              <button key={ml} onClick={() => addWater(ml)} style={{
                border: "none", borderRadius: 14, padding: "10px 0 8px", cursor: "pointer", fontFamily: FONT,
                background: C.blueSoft, color: C.theme === "dark" ? C.blue : C.primaryInk,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 3, fontWeight: 800, fontSize: 13,
              }}
                onPointerDown={(e) => { e.currentTarget.style.transform = "scale(0.92)"; }}
                onPointerUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                onPointerLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}>
                <Droplet size={14 + i * 4} fill="currentColor" />
                {ml >= 1000 ? "1 L" : `${ml} ml`}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <Input type="number" placeholder="Otra cantidad (ml)" value={waterCustom} onChange={(e) => setWaterCustom(e.target.value)} />
            <Btn kind="soft" onClick={() => {
              const ml = Number(waterCustom);
              if (!(ml > 0 && ml <= 3000)) { flash("Poné una cantidad entre 1 y 3000 ml"); return; }
              addWater(Math.round(ml)); setWaterCustom("");
            }}>＋</Btn>
            {waterToday.length > 0 && (
              <Btn kind="ghost" style={ib} onClick={() => removeWater(waterToday[waterToday.length - 1].id)} aria-label="Deshacer"><Undo2 size={16} /></Btn>
            )}
          </div>
        </Card>

        <SectionTitle>Meta diaria</SectionTitle>
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Btn kind="soft" onClick={() => setWaterGoal(waterGoal - 250)}>−</Btn>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 900 }}>{(waterGoal / 1000).toLocaleString("es-AR")} L</div>
              <div style={{ fontSize: 12, color: C.sub, fontWeight: 600 }}>tu máximo de agua por día</div>
            </div>
            <Btn kind="soft" onClick={() => setWaterGoal(waterGoal + 250)}>＋</Btn>
          </div>
          {bodyWeight > 0 && (
            <div style={{ fontSize: 12.5, color: C.sub, fontWeight: 600, marginTop: 10, textAlign: "center" }}>
              Referencia: ~35 ml por kg → <b style={{ color: C.ink }}>{(Math.round(bodyWeight * 35 / 250) * 250).toLocaleString("es-AR")} ml</b>{" "}
              <Btn kind="ghost" small onClick={() => setWaterGoal(Math.round(bodyWeight * 35 / 250) * 250)}>Usar</Btn>
            </div>
          )}
        </Card>

        {waterToday.length > 0 && (
          <>
            <SectionTitle>Tomas de hoy</SectionTitle>
            <Card style={{ padding: 8 }}>
              {[...waterToday].reverse().map((e) => {
                const t = new Date(e.t);
                return (
                  <Row key={e.id} left={<Droplet size={16} color={C.blue} fill={C.blue} />}
                    title={`${e.ml.toLocaleString("es-AR")} ml`}
                    sub={Number.isNaN(t.getTime()) ? "" : hhmm(t)}
                    right={<Btn kind="danger" small onClick={() => removeWater(e.id)}><X size={14} /></Btn>} />
                );
              })}
            </Card>
          </>
        )}

        <SectionTitle>Últimos 7 días</SectionTitle>
        <Card>
          <BarChart data={last7} unit="ml" color={C.blue} refLine={waterGoal} refLabel={`meta ${waterGoal} ml`} fmt={(v) => v.toLocaleString("es-AR")} />
        </Card>

        <SectionTitle right={fasting.windows.length > 0 && !fastEdit
          ? <Btn kind="ghost" small style={ib} onClick={unlockFastEdit}><Lock size={13} /> Editar</Btn> : null}>
          Ayuno
        </SectionTitle>
        <Card>
          <FastCard />
          {!fastEdit && fasting.windows.length > 0 && (
            <div style={{ borderTop: `1px solid ${C.line}`, marginTop: 12, paddingTop: 8 }}>
              {fasting.windows.map((w) => (
                <div key={w.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, fontWeight: 600, padding: "5px 0" }}>
                  <span style={{ color: C.sub }}>{w.days.length === 7 ? "Todos los días" : [1, 2, 3, 4, 5, 6, 0].filter((d) => w.days.includes(d)).map((d) => DAY_NAMES[d].slice(0, 3)).join(" ")}</span>
                  <span>{w.start} → {w.end} <span style={{ color: C.sub }}>· {fastHours(w)} h</span></span>
                </div>
              ))}
            </div>
          )}
          {!fastEdit && fasting.windows.length === 0 && (
            <Btn style={{ ...ib, width: "100%", marginTop: 4 }} onClick={unlockFastEdit}><Lock size={14} /> Agendar horarios de ayuno</Btn>
          )}
          {fastPin != null && !fastEdit && (
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <Input type="password" inputMode="numeric" autoFocus placeholder="Tu PIN para editar" value={fastPin}
                onChange={(e) => setFastPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
                onKeyDown={(e) => { if (e.key === "Enter") unlockFastEdit(); }} />
              <Btn onClick={unlockFastEdit}>OK</Btn>
              <Btn kind="ghost" onClick={() => setFastPin(null)}><X size={15} /></Btn>
            </div>
          )}
          {fastEdit && (
            <div style={{ borderTop: `1px solid ${C.line}`, marginTop: 12, paddingTop: 12 }}>
              <div style={{ fontSize: 12.5, color: C.sub, fontWeight: 600, marginBottom: 8 }}>
                El ayuno <b>empieza</b> a la primera hora y <b>termina</b> a la segunda (si es más temprano, al día siguiente).
              </div>
              {fasting.windows.map((w) => (
                <div key={w.id} style={{ background: C.soft, borderRadius: 12, padding: 10, marginBottom: 8 }}>
                  <DayPicker days={w.days} onToggle={(d) => setFastWindows((ws) => ws.map((x) => x.id === w.id
                    ? { ...x, days: x.days.includes(d) ? x.days.filter((y) => y !== d) : [...x.days, d] } : x))} />
                  <div style={{ display: "flex", gap: 8, alignItems: "end", marginTop: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={lblStyle}>Empieza</div>
                      <Input type="time" value={w.start} onChange={(e) => setFastWindows((ws) => ws.map((x) => x.id === w.id ? { ...x, start: e.target.value } : x))} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={lblStyle}>Termina</div>
                      <Input type="time" value={w.end} onChange={(e) => setFastWindows((ws) => ws.map((x) => x.id === w.id ? { ...x, end: e.target.value } : x))} />
                    </div>
                    <Btn kind="danger" small onClick={() => setFastWindows((ws) => ws.filter((x) => x.id !== w.id))}><Trash2 size={15} /></Btn>
                  </div>
                  <div style={{ fontSize: 12, color: C.sub, fontWeight: 600, marginTop: 6 }}>{w.start && w.end ? `${fastHours(w)} h de ayuno` : ""}</div>
                </div>
              ))}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                {PRESETS.map(([name, st, en]) => (
                  <Btn key={name} kind="soft" small onClick={() => setFastWindows((ws) => [...ws, { id: uid(), days: [0, 1, 2, 3, 4, 5, 6], start: st, end: en }])}>＋ {name}</Btn>
                ))}
                <Btn kind="soft" small onClick={() => setFastWindows((ws) => [...ws, { id: uid(), days: [1, 2, 3, 4, 5], start: "21:00", end: "13:00" }])}>＋ Personalizado</Btn>
              </div>
              <Btn style={{ ...ib, width: "100%" }} onClick={() => { setFastEdit(false); flash("🔒 Horarios de ayuno guardados"); }}><Lock size={14} /> Listo</Btn>
            </div>
          )}
        </Card>
        <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.45, margin: "8px 4px 0" }}>
          Los horarios de ayuno solo los cambiás vos desde acá (con tu PIN); NEXO no puede modificarlos. Te aviso cuando empieza y cuando termina cada ayuno.
        </div>
      </>
    );
  }

  /* ============ CORRER: plan progresivo + registro con GPS ============ */
  const running = state.running || { plan: null, runs: [] };
  const runs = running.runs || [];
  const runPlan = running.plan;
  const runTarget = runPlan ? runTargetKm(runPlan, today) : 0;
  const runKmToday = Math.round(runs.filter((r) => r.date === today).reduce((a, r) => a + (r.km || 0), 0) * 100) / 100;
  const runKcalToday = runs.filter((r) => r.date === today).reduce((a, r) => a + (r.kcal || 0), 0);

  const runActiveMs = (l) => (l ? l.activeMs + (l.status === "running" && l.segStart ? Date.now() - l.segStart : 0) : 0);
  const liveKm = runLive && runLive.points.length ? runLive.points[runLive.points.length - 1].d : 0;

  const onGps = (pos) => {
    const { latitude: lat, longitude: lon, accuracy: acc } = pos.coords;
    setGpsInfo({ acc: Math.round(acc), err: null });
    setRunLive((l) => {
      if (!l || l.status !== "running") return l;
      const t = pos.timestamp || Date.now();
      const pt = { lat, lon, t, acc };
      const prev = l.points[l.points.length - 1];
      if (!acceptPoint(l.gap ? null : prev, pt)) return l;
      // después de una pausa el primer punto no suma distancia (no "teletransporta")
      const d = (prev ? prev.d : 0) + (prev && !l.gap ? haversineKm(prev, pt) : 0);
      return { ...l, gap: false, points: [...l.points, { lat: +lat.toFixed(6), lon: +lon.toFixed(6), t, a: runActiveMs(l), d }] };
    });
  };
  const requestWake = () => {
    try { navigator.wakeLock?.request("screen").then((w) => { wakeRef.current = w; }).catch(() => {}); } catch (e) { /* sin wake lock */ }
  };
  const startWatch = () => {
    if (!navigator.geolocation) { flash("Este dispositivo no tiene GPS disponible"); return false; }
    watchRef.current = navigator.geolocation.watchPosition(onGps, (e) => setGpsInfo({
      acc: null, err: e.code === 1 ? "Permiso de ubicación denegado: habilitalo en Ajustes → Privacidad → Ubicación" : "Buscando señal de GPS…",
    }), { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 });
    requestWake();
    return true;
  };
  const stopWatch = () => {
    if (watchRef.current != null && navigator.geolocation) navigator.geolocation.clearWatch(watchRef.current);
    watchRef.current = null;
    try { wakeRef.current?.release(); } catch (e) { /* ya liberado */ }
    wakeRef.current = null;
  };
  const runStart = () => {
    if (!startWatch()) return;
    setGpsInfo(null);
    setRunLive({ status: "running", startedAt: Date.now(), activeMs: 0, segStart: Date.now(), points: [], gap: false });
  };
  const runPause = () => { stopWatch(); setRunLive((l) => ({ ...l, status: "paused", activeMs: runActiveMs(l), segStart: null, gap: true })); };
  const runResume = () => {
    if (watchRef.current == null && !startWatch()) return;
    setRunLive((l) => ({ ...l, status: "running", segStart: Date.now(), gap: true }));
  };
  const runDiscard = () => {
    if (!confirm("¿Descartar esta salida? No se guarda nada.")) return;
    stopWatch(); setRunLive(null);
  };
  const runFinish = () => {
    const l = runLive;
    stopWatch();
    const sec = Math.round(runActiveMs(l) / 1000);
    const km = Math.round(liveKm * 100) / 100;
    if (km < 0.05) {
      if (confirm("Casi no se registró distancia (¿sin señal de GPS?). ¿Descartar la salida?")) { setRunLive(null); return; }
      setRunLive({ ...l, status: "paused", activeMs: runActiveMs(l), segStart: null, gap: true });
      return;
    }
    const run = {
      id: uid(), date: dstr(new Date(l.startedAt)), startedAt: l.startedAt, km, sec,
      splits: computeSplits(l.points.map((p) => ({ t: p.a, d: p.d }))),
      route: downsample(l.points).map((p) => [p.lat, p.lon]),
      kcal: runKcal(km, bodyWeight), source: "gps",
    };
    up((s) => {
      s.running = s.running || { plan: null, runs: [] };
      s.running.runs = [...(s.running.runs || []), run];
      return s;
    });
    setRunLive(null);
    setRunOpen(run.id);
    flash(`🏃 Salida guardada: ${km} km en ${fmtDur(sec)} (${fmtPace(sec / km)} /km)`);
  };

  // Mientras corre: refresco del cronómetro cada segundo y wake lock al volver a la app
  useEffect(() => {
    if (runLive?.status !== "running") return;
    const iv = setInterval(() => setRunTick((x) => x + 1), 1000);
    const onVis = () => { if (document.visibilityState === "visible") requestWake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(iv); document.removeEventListener("visibilitychange", onVis); };
  }, [runLive?.status]);
  // Si la app se recargó con una salida a medias, queda en pausa: el GPS se retoma al tocar "Seguir".
  useEffect(() => {
    try {
      if (!runLive) { localStorage.removeItem(RUN_LIVE_KEY); return; }
      if (runLive.status === "running" && Date.now() - runSaveRef.current < 8000) return;
      runSaveRef.current = Date.now();
      localStorage.setItem(RUN_LIVE_KEY, JSON.stringify({ ...runLive, activeMs: runActiveMs(runLive), segStart: null }));
    } catch (e) { /* almacenamiento lleno */ }
  }, [runLive]);

  const saveRunPlan = (d) => {
    const p = {
      startDate: d.startDate || today,
      startKm: Number(d.startKm) || RUN_DEFAULTS.startKm,
      stepKm: Number(d.stepKm) || 0,
      everyDays: Math.max(1, Number(d.everyDays) || RUN_DEFAULTS.everyDays),
      maxKm: Number(d.maxKm) || 0,
    };
    up((s) => { s.running = s.running || { plan: null, runs: [] }; s.running.plan = p; return s; });
    setRunPlanDraft(null);
  };

  function Correr() {
    const info = runPlan ? runLevelInfo(runPlan, today) : null;
    const pct = runTarget ? Math.min(1, runKmToday / runTarget) : 0;
    const liveSec = runActiveMs(runLive) / 1000;
    const pts = runLive ? runLive.points : [];
    // ritmo del último ~500 m
    const recentPace = (() => {
      if (pts.length < 2) return null;
      const last = pts[pts.length - 1];
      let j = pts.length - 1;
      while (j > 0 && last.d - pts[j].d < 0.5) j--;
      const dd = last.d - pts[j].d;
      return dd > 0.05 ? (last.a - pts[j].a) / 1000 / dd : null;
    })();
    // km por semana (lunes a domingo), últimas 8 semanas
    const monday = new Date(today + "T00:00:00");
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    const weeksKm = Array.from({ length: 8 }, (_, i) => {
      const a = new Date(monday); a.setDate(a.getDate() - (7 - i) * 7);
      const b = new Date(a); b.setDate(b.getDate() + 6);
      const ka = dstr(a), kb = dstr(b);
      const km = runs.filter((r) => r.date >= ka && r.date <= kb).reduce((s, r) => s + (r.km || 0), 0);
      return { label: `${a.getDate()}/${a.getMonth() + 1}`, title: `Semana del ${a.getDate()}/${a.getMonth() + 1}`, value: Math.round(km * 10) / 10 };
    });
    const totalKm = Math.round(runs.reduce((s, r) => s + (r.km || 0), 0) * 10) / 10;
    const daysHit = new Set(runs.filter((r) => runPlan && r.date >= runPlan.startDate).map((r) => r.date))
      .size;
    const big = { fontSize: 30, fontWeight: 900, letterSpacing: -1, fontVariantNumeric: "tabular-nums", lineHeight: 1.05 };
    const small = { fontSize: 11.5, fontWeight: 800, color: C.sub, letterSpacing: 0.4 };
    const draft = runPlanDraft;
    const ib = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 };

    return (
      <>
        <PageHeader title="Correr" subtitle="Running" />

        {(!runPlan || draft) && (
          <Card style={{ marginBottom: 10 }}>
            <div style={{ fontWeight: 800, fontSize: 15.5, marginBottom: 4 }}>Plan progresivo</div>
            <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.45, marginBottom: 10 }}>
              Arrancás con {draft?.startKm || RUN_DEFAULTS.startKm} km por día y cada {draft?.everyDays || RUN_DEFAULTS.everyDays} días sumás {draft?.stepKm ?? RUN_DEFAULTS.stepKm} km más.
            </div>
            {(() => {
              const d = draft || { startDate: today, ...RUN_DEFAULTS };
              const set = (k) => (v) => setRunPlanDraft({ ...d, [k]: v });
              return (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                    <LabeledNum label="Km por día al inicio" value={d.startKm} step={0.5} onChange={set("startKm")} />
                    <LabeledNum label="Sumar km" value={d.stepKm} step={0.5} onChange={set("stepKm")} />
                    <LabeledNum label="Cada (días)" value={d.everyDays} onChange={set("everyDays")} />
                    <LabeledNum label="Tope km (0 = sin tope)" value={d.maxKm} step={0.5} onChange={set("maxKm")} />
                  </div>
                  <div style={lblStyle}>Fecha de inicio</div>
                  <Input type="date" value={d.startDate} onChange={(e) => setRunPlanDraft({ ...d, startDate: e.target.value })} style={{ marginBottom: 10 }} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn onClick={() => saveRunPlan(d)}>{runPlan ? "Guardar plan" : "Empezar plan"}</Btn>
                    {runPlan && <Btn kind="ghost" onClick={() => setRunPlanDraft(null)}>Cancelar</Btn>}
                  </div>
                </>
              );
            })()}
          </Card>
        )}

        {runPlan && !draft && (
          <div style={{
            borderRadius: 22, padding: 18, marginBottom: 10, display: "flex", alignItems: "center", gap: 16,
            background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`, boxShadow: `0 8px 24px ${C.primaryGlow}`, color: "#fff",
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 1.2, opacity: 0.85 }}>HOY · NIVEL {info.level}</div>
              <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: -1 }}>{runKmToday} <span style={{ fontSize: 16, opacity: 0.85 }}>/ {runTarget} km</span></div>
              <div style={{ fontSize: 12.5, fontWeight: 600, opacity: 0.9 }}>
                {runKmToday >= runTarget ? "✅ Meta del día cumplida" : `Te faltan ${Math.round((runTarget - runKmToday) * 100) / 100} km`}
                {info.nextKm > runTarget ? ` · en ${info.daysLeft} día${info.daysLeft === 1 ? "" : "s"} pasás a ${info.nextKm} km` : ""}
              </div>
              <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.25)", overflow: "hidden", marginTop: 10 }}>
                <div style={{ width: `${pct * 100}%`, height: "100%", background: "#fff", borderRadius: 4 }} />
              </div>
            </div>
            <button onClick={() => setRunPlanDraft({ ...RUN_DEFAULTS, ...runPlan })} aria-label="Editar plan" style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 12, width: 36, height: 36, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Pencil size={16} />
            </button>
          </div>
        )}

        <SectionTitle>{runLive ? (runLive.status === "running" ? "Corriendo 🟢" : "En pausa ⏸️") : "Nueva salida"}</SectionTitle>
        <Card>
          {runLive ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, textAlign: "center", marginBottom: 12 }}>
                <div><div style={big}>{liveKm.toFixed(2)}</div><div style={small}>KM</div></div>
                <div><div style={big}>{fmtDur(liveSec)}</div><div style={small}>TIEMPO</div></div>
                <div><div style={big}>{fmtPace(liveKm > 0.05 ? liveSec / liveKm : null)}</div><div style={small}>RITMO /KM</div></div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: C.sub, fontWeight: 600, marginBottom: 10 }}>
                <span>Ritmo actual: <b style={{ color: C.ink }}>{fmtPace(recentPace)}</b> /km</span>
                <span>🔥 {runKcal(liveKm, bodyWeight)} kcal</span>
                <span style={{ color: gpsInfo?.err ? C.red : gpsInfo?.acc > 25 ? C.amberInk : C.sub }}>
                  {gpsInfo?.err ? "GPS ⚠️" : gpsInfo?.acc ? `GPS ±${gpsInfo.acc} m` : runLive.status === "running" ? "GPS…" : ""}
                </span>
              </div>
              {gpsInfo?.err && <div style={{ background: C.amberSoft, color: C.amberInk, borderRadius: 10, padding: 10, fontSize: 12.5, fontWeight: 600, marginBottom: 10 }}>{gpsInfo.err}</div>}
              <RouteSvg points={pts.map((p) => [p.lat, p.lon])} live={runLive.status === "running"} />
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                {runLive.status === "running"
                  ? <Btn kind="soft" onClick={runPause} style={{ ...ib, flex: 1 }}><Pause size={15} /> Pausa</Btn>
                  : <Btn kind="soft" onClick={runResume} style={{ ...ib, flex: 1 }}><Play size={15} /> Seguir</Btn>}
                <Btn onClick={runFinish} style={{ ...ib, flex: 1 }}><Square size={14} /> Terminar</Btn>
                <Btn kind="danger" small onClick={runDiscard}><Trash2 size={15} /></Btn>
              </div>
            </>
          ) : (
            <>
              <Btn onClick={runStart} style={{ ...ib, width: "100%", padding: "14px 0", fontSize: 16 }}><Footprints size={18} /> Empezar a correr con GPS</Btn>
              <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.45, marginTop: 8 }}>
                Dejá la app abierta mientras corrés (la pantalla se mantiene prendida): en iPhone el GPS de una app web se corta si bloqueás el teléfono.
              </div>
              <div style={{ borderTop: `1px solid ${C.line}`, marginTop: 12, paddingTop: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 8 }}>O cargala a mano (cinta, otra app)</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Input type="number" placeholder="km" value={runManual.km} onChange={(e) => setRunManual({ ...runManual, km: e.target.value })} />
                  <Input type="number" placeholder="minutos" value={runManual.min} onChange={(e) => setRunManual({ ...runManual, min: e.target.value })} />
                  <Btn onClick={() => {
                    const km = Number(String(runManual.km).replace(",", "."));
                    const sec = Math.round((Number(runManual.min) || 0) * 60);
                    if (!(km > 0)) { flash("Poné los km"); return; }
                    up((s) => {
                      s.running = s.running || { plan: null, runs: [] };
                      s.running.runs = [...(s.running.runs || []), { id: uid(), date: today, startedAt: Date.now(), km, sec, splits: [], route: [], kcal: runKcal(km, bodyWeight), source: "manual" }];
                      return s;
                    });
                    setRunManual({ km: "", min: "" });
                  }}>＋</Btn>
                </div>
              </div>
            </>
          )}
        </Card>

        {runs.length > 0 && (
          <>
            <SectionTitle>Km por semana</SectionTitle>
            <Card>
              <BarChart data={weeksKm} unit="km" refLine={runPlan ? runTarget * 7 : 0} refLabel={runPlan ? `meta ${runTarget * 7} km/sem` : ""} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12 }}>
                {[[`${totalKm} km`, "TOTAL"], [runs.length, "SALIDAS"], [daysHit, "DÍAS CORRIDOS"]].map(([v, l]) => (
                  <div key={l} style={{ background: C.soft, borderRadius: 12, padding: "10px 8px", textAlign: "center" }}>
                    <div style={{ fontSize: 17, fontWeight: 900 }}>{v}</div><div style={small}>{l}</div>
                  </div>
                ))}
              </div>
            </Card>

            <SectionTitle>Historial</SectionTitle>
            {[...runs].sort((a, b) => b.startedAt - a.startedAt).slice(0, 30).map((r) => {
              const open = runOpen === r.id;
              const hit = runPlan && r.date >= runPlan.startDate
                ? runs.filter((x) => x.date === r.date).reduce((s, x) => s + x.km, 0) >= runTargetKm(runPlan, r.date) : false;
              return (
                <Card key={r.id} style={{ marginBottom: 8 }} onClick={() => setRunOpen(open ? null : r.id)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 12, background: C.primarySoft, color: C.primary, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {r.source === "gps" ? <MapPin size={18} /> : <Footprints size={18} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 15 }}>{r.km} km {hit && <span title="Meta del día cumplida">✅</span>}</div>
                      <div style={{ fontSize: 12.5, color: C.sub, fontWeight: 600, textTransform: "capitalize" }}>
                        {fmtDate(r.date)} · {r.sec ? `${fmtDur(r.sec)} · ${fmtPace(r.sec / r.km)} /km` : "sin tiempo"} · {r.kcal} kcal
                      </div>
                    </div>
                  </div>
                  {open && (
                    <div style={{ marginTop: 12 }} onClick={(e) => e.stopPropagation()}>
                      {r.route?.length > 1 && <RouteSvg points={r.route} height={160} />}
                      {r.splits?.length > 0 && (
                        <div style={{ marginTop: 10 }}>
                          <div style={{ ...small, marginBottom: 4 }}>PARCIALES</div>
                          {r.splits.map((s, i) => {
                            const best = Math.min(...r.splits);
                            return (
                              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, padding: "3px 0" }}>
                                <span style={{ width: 40, color: C.sub }}>Km {i + 1}</span>
                                <div style={{ flex: 1, height: 8, borderRadius: 4, background: C.line, overflow: "hidden" }}>
                                  <div style={{ width: `${(best / s) * 100}%`, height: "100%", background: C.primary, borderRadius: 4 }} />
                                </div>
                                <span style={{ width: 44, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtPace(s)}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <div style={{ textAlign: "right", marginTop: 8 }}>
                        <Btn kind="danger" small style={ib} onClick={() => {
                          if (!confirm("¿Borrar esta salida?")) return;
                          up((s) => { s.running.runs = s.running.runs.filter((x) => x.id !== r.id); return s; });
                        }}><Trash2 size={14} /> Borrar</Btn>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </>
        )}
      </>
    );
  }

  /* ============ DIETA ============ */
  const [newMeal, setNewMeal] = useState({ name: "", kcal: "", protein: "", carbs: "", fat: "" });
  const [saveToLib, setSaveToLib] = useState(false);
  const [foodEst, setFoodEst] = useState(null); // resultado del estimador de kcal
  const [bodyDraft, setBodyDraft] = useState({ neck: "", waist: "", hip: "", bf: "", muscle: "" });
  const [weightView, setWeightView] = useState("dias"); // dias | meses
  const [newWeight, setNewWeight] = useState("");
  const [newMeas, setNewMeas] = useState({ waist: "", chest: "", arm: "" });
  const [calc, setCalc] = useState({ sex: "m", age: 18, height: 175, weight: 70, activity: 1.55, goal: 0 });
  const [startBf, setStartBf] = useState("");
  const [newBf, setNewBf] = useState("");

  const startCut = () => {
    const v = Number(startBf);
    if (!v || v < 5 || v > 60) {
      setBanner("Ingresá tu % de grasa estimado (entre 5 y 60)");
      setTimeout(() => setBanner(null), 4000);
      return;
    }
    up((s) => {
      s.cut = {
        startDate: today, startBf: v, bfLog: { [today]: v }, manual: {},
        lastPhase: v > 15 ? 0 : v > 12 ? 1 : 2,
      };
      if (!s.reminders.some((r) => r.cut)) {
        s.reminders.push(
          { id: uid(), cut: true, text: "📝 ¿Ya registraste tu almuerzo? Mantené el conteo al día", time: "14:00", days: [0, 1, 2, 3, 4, 5, 6] },
          { id: uid(), cut: true, text: "💪 ¿Cómo va el entreno? Marcá tus ejercicios en la rutina", time: "19:00", days: [1, 2, 3, 4, 5] },
          { id: uid(), cut: true, text: "🔢 Cerrá el día: registrá todas tus calorías de hoy", time: "21:45", days: [0, 1, 2, 3, 4, 5, 6] },
        );
      }
      return s;
    });
    setStartBf("");
    setBanner("🎮 ¡Plan Cut activado! Arrancás en la Fase " + (v > 15 ? 1 : v > 12 ? 2 : 3));
    setTimeout(() => setBanner(null), 6000);
  };

  /* ============ PLAN CUT (vista) ============ */
  function CutPlan() {
    if (!cut) {
      return (
        <>
          <SectionTitle>Plan Cut 🎮</SectionTitle>
          <Card>
            <div style={{ fontWeight: 800, fontSize: 15.5, marginBottom: 6 }}>De donde estés hoy → 8% de grasa</div>
            <div style={{ fontSize: 13.5, color: C.sub, lineHeight: 1.5, marginBottom: 12 }}>
              Un plan por niveles basado en la guía de Oswal Candela: 3 fases con misiones diarias,
              y calculadoras que se desbloquean a medida que bajás tu % de grasa.
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <Input type="number" placeholder="Tu % de grasa estimado (ej: 30)" value={startBf} onChange={(e) => setStartBf(e.target.value)} />
              <Btn onClick={startCut}>Empezar</Btn>
            </div>
            <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.4, marginBottom: 10 }}>
              Estimalo con fotos de referencia o una báscula con bioimpedancia; no hace falta que sea exacto.
            </div>
            <a href={CUT_VIDEO_URL} target="_blank" rel="noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: C.primary, textDecoration: "none" }}>
              <Video size={14} /> Ver la guía completa en video →
            </a>
          </Card>
        </>
      );
    }

    return (
      <>
        <SectionTitle right={
          <a href={CUT_VIDEO_URL} target="_blank" rel="noreferrer" style={{ fontSize: 12.5, fontWeight: 700, color: C.primary, textDecoration: "none" }}>
            Guía en video →
          </a>
        }>Plan Cut 🎮</SectionTitle>

        <div style={{
          borderRadius: 22, padding: "18px 18px 16px", marginBottom: 10,
          background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
          boxShadow: `0 8px 24px ${C.primaryGlow}`,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 11.5, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase" }}>
              Nivel {cutPhaseIdx + 1} de 3
            </div>
            <div style={{ color: "#fff", fontSize: 12.5, fontWeight: 800 }}>⚡ {cutXp} XP</div>
          </div>
          <div style={{ color: "#fff", fontSize: 22, fontWeight: 800, letterSpacing: -0.4, margin: "4px 0 2px" }}>
            {cutDone ? "🏆 Plan completado" : `${cutPhase.emoji} ${cutPhase.name}`}
          </div>
          <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 12.5, fontWeight: 600, marginBottom: 10 }}>
            {cutDone ? "Llegaste al 8%. Ahora el juego es mantenerlo." : `${cutPhase.range} · vas ${cutBf}% → meta ${cutPhase.target}%`}
          </div>
          <div style={{ height: 10, borderRadius: 5, background: "rgba(255,255,255,0.25)", overflow: "hidden" }}>
            <div style={{ width: `${(cutDone ? 1 : cutPhasePct) * 100}%`, height: "100%", background: "#fff", borderRadius: 5, transition: "width 0.5s" }} />
          </div>
        </div>

        <SectionTitle>Misiones de hoy ({cutMissionsDone}/{cutMissions.length})</SectionTitle>
        <Card style={{ padding: 8 }}>
          {cutMissions.map((m) => (
            <Row key={m.id} title={m.text}
              sub={m.auto ? "Se completa sola al registrar en la app" : "Marcala vos al final del día"}
              right={<Check done={m.done} onClick={() => {
                if (m.auto) {
                  setBanner("Esta misión se completa sola cuando registrás 😉");
                  setTimeout(() => setBanner(null), 3500);
                } else toggleCutManual(m.id);
              }} />} />
          ))}
        </Card>

        <SectionTitle>Reglas de la fase</SectionTitle>
        <Card>
          {cutPhase.rules.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 8, padding: "6px 0", fontSize: 13.5, lineHeight: 1.45, fontWeight: 500 }}>
              <span style={{ color: C.primary, fontWeight: 800 }}>›</span><span>{r}</span>
            </div>
          ))}
        </Card>

        <SectionTitle>Tu % de grasa</SectionTitle>
        <Card>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <Input type="number" placeholder="% de grasa estimado hoy" value={newBf} onChange={(e) => setNewBf(e.target.value)} />
            <Btn onClick={() => {
              const v = Number(newBf);
              if (!v || v < 3 || v > 60) return;
              up((s) => { s.cut.bfLog = s.cut.bfLog || {}; s.cut.bfLog[today] = v; return s; });
              setNewBf("");
            }}>Guardar</Btn>
          </div>
          {cutBfEntries.slice(-5).reverse().map(([d, v]) => (
            <div key={d} style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, fontWeight: 600, padding: "5px 0", borderTop: `1px solid ${C.line}` }}>
              <span style={{ color: C.sub }}>{fmtDate(d)}</span><span>{v}%</span>
            </div>
          ))}
          <div style={{ fontSize: 12, color: C.sub, marginTop: 8, lineHeight: 1.4 }}>
            Actualizalo cada 1–2 semanas: es lo que te hace subir de nivel.
          </div>
        </Card>

        <SectionTitle>Desbloqueos</SectionTitle>
        {CUT_PHASES.map((p, i) => {
          const open = cutPhaseIdx >= i || cutDone;
          return (
            <Card key={i} style={{ marginBottom: 8, opacity: open ? 1 : 0.45 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 14 }}>
                {open ? <Unlock size={15} color={C.primary} /> : <Lock size={15} color={C.sub} />}
                {p.unlock}
              </div>
              {!open && <div style={{ fontSize: 12.5, color: C.sub, fontWeight: 600, marginTop: 4 }}>Se desbloquea en la Fase {i + 1} ({p.range}).</div>}
              {open && i === 0 && (
                bodyWeight ? (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ background: C.primarySoft, borderRadius: 12, padding: 12, fontSize: 14, color: C.primaryInk, fontWeight: 600, lineHeight: 1.5, marginBottom: 10 }}>
                      Con tus {bodyWeight} kg: <b>{Math.round(bodyWeight * 22)}–{Math.round(bodyWeight * 24)} kcal</b> · Proteína <b>{Math.round(bodyWeight * 1.5)}–{Math.round(bodyWeight * 2)} g</b>
                    </div>
                    <Btn small onClick={() => up((s) => {
                      s.goals = { ...s.goals, kcal: Math.round(bodyWeight * 23), protein: Math.round(bodyWeight * 1.8) };
                      return s;
                    })}>Aplicar a mis metas</Btn>
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: C.sub, marginTop: 6 }}>Registrá tu peso corporal (más abajo) para calcular tus calorías.</div>
                )
              )}
              {open && i === 1 && (
                <div style={{ marginTop: 10 }}>
                  <Btn small kind="soft" onClick={() => setShowCalc(true)}>Abrir calculadora completa ↓</Btn>
                  <div style={{ fontSize: 12.5, color: C.sub, marginTop: 6, lineHeight: 1.4 }}>Aparece más abajo como "Calculadora de metas". Desde esta fase el conteo es obligatorio.</div>
                </div>
              )}
              {open && i === 2 && (
                <div style={{ fontSize: 13, lineHeight: 1.5, marginTop: 8, fontWeight: 500 }}>
                  Protocolo sugerido de ayuno 16/8: ventana de comida de 8 h (ej: 13:00–21:00).
                  Marcá la misión "Ayuno intermitente" los días que lo uses.
                  <div style={{ background: C.amberSoft, color: C.amberInk, borderRadius: 10, padding: 10, marginTop: 8, fontSize: 12.5, fontWeight: 600, lineHeight: 1.45 }}>
                    Recordá lo que dice la guía: con 12–15% ya tenés un cuerpo estético y sostenible. El 8% es un extra opcional, no una obligación.
                  </div>
                </div>
              )}
            </Card>
          );
        })}

        <div style={{ textAlign: "right", margin: "4px 4px 0" }}>
          <Btn kind="ghost" small onClick={() => {
            if (confirm("¿Abandonar el Plan Cut? Se borran sus recordatorios y tu registro de % de grasa.")) {
              up((s) => { s.cut = null; s.reminders = s.reminders.filter((r) => !r.cut); return s; });
            }
          }}>Abandonar plan</Btn>
        </div>
      </>
    );
  }

  function Dieta() {
    const last = weightEntriesAll.slice(-30);
    const months = monthly(state.weightLog);
    // Composición corporal: % grasa de mediciones (cinta/balanza) + las del Plan Cut
    const profile = { sex: "m", ...(state.profile || {}) };
    const navyBf = navyBodyFat({ sex: profile.sex, height: profile.height, neck: bodyDraft.neck, waist: bodyDraft.waist, hip: bodyDraft.hip });
    const bfLog = { ...((cut && cut.bfLog) || {}) };
    Object.entries(state.bodyComp || {}).forEach(([d, v]) => { if (v && v.bf) bfLog[d] = v.bf; });
    const weightAt = (d) => {
      let w = 0;
      for (const [k, v] of weightEntriesAll) { if (k <= d) w = Number(v); else break; }
      return w || (weightEntriesAll[0] ? Number(weightEntriesAll[0][1]) : 0);
    };
    const comps = Object.keys(bfLog).sort().map((d) => {
      const w = weightAt(d);
      const c = composition(w, bfLog[d], (state.bodyComp || {})[d]?.muscle);
      return c ? { d, bf: bfLog[d], w, c } : null;
    }).filter(Boolean);
    const latestComp = comps[comps.length - 1] || null;
    const bfMonths = monthly(bfLog);
    const compSeries = [
      { name: "% grasa", color: C.amber, points: comps.map((x) => ({ x: x.d, y: x.bf })) },
      { name: "% músculo", color: C.primary, points: comps.map((x) => ({ x: x.d, y: x.c.musclePct })) },
    ];

    const bmr = calc.sex === "m"
      ? 10 * calc.weight + 6.25 * calc.height - 5 * calc.age + 5
      : 10 * calc.weight + 6.25 * calc.height - 5 * calc.age - 161;
    const tdee = Math.round(bmr * calc.activity);
    const targetKcal = Math.round(tdee + Number(calc.goal));
    const targetProt = Math.round(calc.weight * 1.8);
    const targetFat = Math.round((targetKcal * 0.25) / 9);
    const targetCarbs = Math.round((targetKcal - targetProt * 4 - targetFat * 9) / 4);

    return (
      <>
        <PageHeader title="Dieta" subtitle="Nutrición" />
        {CutPlan()}
        <Card style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <MacroBox label="Calorías" value={kcal} goal={state.goals.kcal} unit="kcal" color={C.amber} />
          <MacroBox label="Proteína" value={prot} goal={state.goals.protein} unit="g" color={C.primary} />
          <MacroBox label="Carbos" value={carbs} goal={state.goals.carbs} unit="g" color={C.blue} />
          <MacroBox label="Grasas" value={fat} goal={state.goals.fat} unit="g" color={C.red} />
          {runKcalToday > 0 && (
            <div style={{ gridColumn: "1 / -1", fontSize: 13, fontWeight: 600, color: C.sub, borderTop: `1px solid ${C.line}`, paddingTop: 10 }}>
              🏃 Quemaste <b style={{ color: C.ink }}>{runKcalToday} kcal</b> corriendo · te quedan <b style={{ color: C.ink }}>{Math.max(0, state.goals.kcal + runKcalToday - kcal)} kcal</b> para hoy
            </div>
          )}
        </Card>

        {state.mealLibrary.length > 0 && (
          <>
            <SectionTitle>Comidas frecuentes (tocá para agregar)</SectionTitle>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {state.mealLibrary.map((m) => (
                <button key={m.id} onClick={() => up((s) => {
                  s.meals[today] = s.meals[today] || [];
                  s.meals[today].push({ ...m, id: uid() });
                  return s;
                })}
                  style={{
                    border: "none", borderRadius: 12, padding: "8px 12px", cursor: "pointer",
                    background: C.card, color: C.ink, fontFamily: FONT, fontSize: 13.5, fontWeight: 700,
                    boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                  }}>
                  ⭐ {m.name} <span style={{ color: C.sub, fontWeight: 600 }}>{m.kcal} kcal</span>
                </button>
              ))}
            </div>
          </>
        )}

        <SectionTitle>Comidas de hoy</SectionTitle>
        <Card style={{ padding: 8 }}>
          {mealsToday.length === 0 && <Empty text="Todavía no registraste comidas hoy." />}
          {mealsToday.map((m) => (
            <Row key={m.id} title={m.name}
              sub={`${m.kcal || 0} kcal · P ${m.protein || 0} · C ${m.carbs || 0} · G ${m.fat || 0}`}
              right={
                <div style={{ display: "flex", gap: 4 }}>
                  {!state.mealLibrary.some((x) => x.name === m.name) && (
                    <Btn kind="ghost" small onClick={() => up((s) => {
                      s.mealLibrary.push({ id: uid(), name: m.name, kcal: m.kcal, protein: m.protein, carbs: m.carbs, fat: m.fat });
                      return s;
                    })}>⭐</Btn>
                  )}
                  <Btn kind="danger" small onClick={() => up((s) => {
                    s.meals[today] = (s.meals[today] || []).filter((x) => x.id !== m.id); return s;
                  })}><X size={14} /></Btn>
                </div>
              } />
          ))}
        </Card>

        <Card style={{ marginTop: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Registrar comida</div>
          {fastNow.active && (
            <div style={{ background: C.amberSoft, color: C.amberInk, borderRadius: 10, padding: 10, fontSize: 12.5, fontWeight: 600, marginBottom: 10 }}>
              ⏳ Estás en ayuno hasta las {hhmm(fastNow.active.end)}. Si comiste igual, registralo: el conteo tiene que ser honesto.
            </div>
          )}
          <div style={{ display: "grid", gap: 8 }}>
            <Input placeholder="Qué comiste (ej: 2 empanadas y una coca)" value={newMeal.name} onChange={(e) => { setNewMeal({ ...newMeal, name: e.target.value }); setFoodEst(null); }} />
            <Btn kind="soft" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }} onClick={() => {
              if (!newMeal.name.trim()) { flash("Escribí qué comiste para estimar"); return; }
              const est = estimateFood(newMeal.name);
              setFoodEst(est);
              if (est.items.length) {
                const t = est.total;
                setNewMeal({ ...newMeal, kcal: String(t.kcal), protein: String(t.protein), carbs: String(t.carbs), fat: String(t.fat) });
              }
            }}><Sparkles size={15} /> Estimar kcal</Btn>
            {foodEst && (
              <div style={{ background: foodEst.items.length ? C.primarySoft : C.amberSoft, borderRadius: 12, padding: 10, fontSize: 13, fontWeight: 600, lineHeight: 1.5, color: foodEst.items.length ? C.primaryInk : C.amberInk }}>
                {foodEst.items.map((it, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ textTransform: "capitalize" }}>{it.name} <span style={{ opacity: 0.75 }}>· {it.label}</span></span>
                    <b>{it.kcal} kcal</b>
                  </div>
                ))}
                {foodEst.items.length > 0 && (
                  <div style={{ borderTop: `1px solid ${C.line}`, marginTop: 4, paddingTop: 4, display: "flex", justifyContent: "space-between" }}>
                    <span>Estimado total</span><b>{foodEst.total.kcal} kcal</b>
                  </div>
                )}
                {foodEst.unknown.length > 0 && (
                  <div style={{ marginTop: 4, fontSize: 12.5 }}>
                    No reconocí: <b>{foodEst.unknown.join(", ")}</b>. {foodEst.items.length ? "Sumalo a mano si hace falta." : "Poné las kcal directamente abajo."}
                  </div>
                )}
                {foodEst.items.length > 0 && <div style={{ fontSize: 11.5, opacity: 0.8, marginTop: 4 }}>Porciones típicas. Podés escribir cantidades ("200 g de arroz", "3 huevos") y corregir los números abajo.</div>}
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <Input type="number" placeholder="kcal" value={newMeal.kcal} onChange={(e) => setNewMeal({ ...newMeal, kcal: e.target.value })} />
              <Input type="number" placeholder="proteína g" value={newMeal.protein} onChange={(e) => setNewMeal({ ...newMeal, protein: e.target.value })} />
              <Input type="number" placeholder="carbos g" value={newMeal.carbs} onChange={(e) => setNewMeal({ ...newMeal, carbs: e.target.value })} />
              <Input type="number" placeholder="grasas g" value={newMeal.fat} onChange={(e) => setNewMeal({ ...newMeal, fat: e.target.value })} />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 600, color: C.sub, cursor: "pointer" }}>
              <input type="checkbox" checked={saveToLib} onChange={(e) => setSaveToLib(e.target.checked)} />
              Guardar como comida frecuente ⭐
            </label>
            <Btn onClick={() => {
              if (!newMeal.name.trim() && !Number(newMeal.kcal)) { flash("Escribí qué comiste o poné las kcal"); return; }
              const meal = { ...newMeal, name: newMeal.name.trim() || "Comida" };
              up((s) => {
                s.meals[today] = s.meals[today] || [];
                s.meals[today].push({ id: uid(), ...meal });
                if (saveToLib && !s.mealLibrary.some((x) => x.name === meal.name))
                  s.mealLibrary.push({ id: uid(), ...meal });
                return s;
              });
              setNewMeal({ name: "", kcal: "", protein: "", carbs: "", fat: "" });
              setSaveToLib(false);
              setFoodEst(null);
            }}>Agregar comida</Btn>
          </div>
        </Card>

        <SectionTitle right={<Btn kind="ghost" small onClick={() => setShowCalc(!showCalc)}>{showCalc ? "Ocultar" : "Abrir"}</Btn>}>
          Calculadora de metas
        </SectionTitle>
        {showCalc && (
          <Card>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
              <div>
                <div style={lblStyle}>Sexo</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[["m", "Hombre"], ["f", "Mujer"]].map(([v, l]) => (
                    <button key={v} onClick={() => setCalc({ ...calc, sex: v })} style={{
                      flex: 1, padding: "9px 0", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: FONT, fontWeight: 700, fontSize: 13,
                      background: calc.sex === v ? C.primarySoft : C.soft, color: calc.sex === v ? C.primaryInk : C.sub,
                    }}>{l}</button>
                  ))}
                </div>
              </div>
              <LabeledNum label="Edad" value={calc.age} onChange={(v) => setCalc({ ...calc, age: v })} />
              <LabeledNum label="Altura (cm)" value={calc.height} onChange={(v) => setCalc({ ...calc, height: v })} />
              <LabeledNum label="Peso (kg)" value={calc.weight} onChange={(v) => setCalc({ ...calc, weight: v })} />
            </div>
            <div style={lblStyle}>Actividad</div>
            <select value={calc.activity} onChange={(e) => setCalc({ ...calc, activity: Number(e.target.value) })}
              style={{ width: "100%", padding: 10, borderRadius: 12, border: `1.5px solid ${C.line}`, fontFamily: FONT, fontSize: 14, background: C.input, color: C.ink, marginBottom: 10 }}>
              <option value={1.2}>Sedentario</option>
              <option value={1.375}>Ligero (1-3 días/sem)</option>
              <option value={1.55}>Moderado (3-5 días/sem)</option>
              <option value={1.725}>Alto (6-7 días/sem)</option>
            </select>
            <div style={lblStyle}>Objetivo</div>
            <select value={calc.goal} onChange={(e) => setCalc({ ...calc, goal: Number(e.target.value) })}
              style={{ width: "100%", padding: 10, borderRadius: 12, border: `1.5px solid ${C.line}`, fontFamily: FONT, fontSize: 14, background: C.input, color: C.ink, marginBottom: 12 }}>
              <option value={-300}>Bajar grasa (déficit suave)</option>
              <option value={0}>Mantener</option>
              <option value={300}>Ganar músculo (superávit suave)</option>
            </select>
            <div style={{ background: C.primarySoft, borderRadius: 12, padding: 12, fontSize: 14, color: C.primaryInk, fontWeight: 600, lineHeight: 1.5, marginBottom: 10 }}>
              Sugerencia: <b>{targetKcal} kcal</b> · Proteína <b>{targetProt} g</b> · Carbos <b>{targetCarbs} g</b> · Grasas <b>{targetFat} g</b>
            </div>
            <Btn onClick={() => up((s) => {
              s.goals = { ...s.goals, kcal: targetKcal, protein: targetProt, carbs: targetCarbs, fat: targetFat };
              return s;
            })}>Aplicar a mis metas</Btn>
            <div style={{ fontSize: 12, color: C.sub, marginTop: 8, lineHeight: 1.4 }}>
              Estimación orientativa (Mifflin-St Jeor). Ajustala según cómo responda tu cuerpo, y ante dudas consultá a un profesional de la nutrición.
            </div>
          </Card>
        )}

        <SectionTitle>Metas diarias</SectionTitle>
        <Card style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <GoalInput label="kcal" value={state.goals.kcal} onChange={(v) => up((s) => { s.goals.kcal = v; return s; })} />
          <GoalInput label="proteína g" value={state.goals.protein} onChange={(v) => up((s) => { s.goals.protein = v; return s; })} />
          <GoalInput label="carbos g" value={state.goals.carbs} onChange={(v) => up((s) => { s.goals.carbs = v; return s; })} />
          <GoalInput label="grasas g" value={state.goals.fat} onChange={(v) => up((s) => { s.goals.fat = v; return s; })} />
        </Card>

        <SectionTitle>Peso corporal</SectionTitle>
        <Card>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <Input type="number" placeholder="Tu peso hoy (kg)" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} />
            <Btn onClick={() => {
              const v = Number(String(newWeight).replace(",", "."));
              if (!v) return;
              up((s) => { s.weightLog[today] = v; return s; });
              setNewWeight("");
            }}>Guardar</Btn>
          </div>
          <div style={{ marginBottom: 12 }}>
            <Segmented options={[["dias", "Últimos días"], ["meses", "Por mes"]]} value={weightView} onChange={setWeightView} />
          </div>
          {weightView === "dias" ? (
            last.length >= 2
              ? <TrendChart unit=" kg" series={[{ name: "Peso", color: C.primary, points: last.map(([d, v]) => ({ x: d, y: Number(v) })) }]} />
              : <div style={{ fontSize: 13, color: C.sub }}>Registrá tu peso al menos 2 días para ver el gráfico. También se usa en el análisis de fuerza y en las kcal de correr.</div>
          ) : months.length ? (
            <>
              <BarChart unit="kg" fmt={(v) => v.toLocaleString("es-AR")}
                data={months.slice(-8).map((m, i, arr) => {
                  const prev = i > 0 ? arr[i - 1].avg : null;
                  const delta = prev != null ? Math.round((m.avg - prev) * 10) / 10 : null;
                  return {
                    label: MONTHS[Number(m.ym.slice(5)) - 1].slice(0, 3), title: ymLabel(m.ym), value: m.avg,
                    note: delta == null ? `${m.n} pesada${m.n === 1 ? "" : "s"}` : `${delta > 0 ? "+" : ""}${delta} kg vs mes anterior`,
                  };
                })} />
              <div style={{ marginTop: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr", fontSize: 11, fontWeight: 800, color: C.sub, letterSpacing: 0.3, padding: "4px 0" }}>
                  <span>MES</span><span style={{ textAlign: "right" }}>PESO</span><span style={{ textAlign: "right" }}>CAMBIO</span><span style={{ textAlign: "right" }}>% GRASA</span>
                </div>
                {months.slice(-6).reverse().map((m) => {
                  const idx = months.indexOf(m);
                  const prev = idx > 0 ? months[idx - 1].avg : null;
                  const delta = prev != null ? Math.round((m.avg - prev) * 10) / 10 : null;
                  const bfM = bfMonths.find((b) => b.ym === m.ym);
                  return (
                    <div key={m.ym} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr", fontSize: 13, fontWeight: 600, padding: "6px 0", borderTop: `1px solid ${C.line}` }}>
                      <span style={{ color: C.sub }}>{ymLabel(m.ym).split(" ")[0]}</span>
                      <span style={{ textAlign: "right", fontWeight: 800 }}>{m.avg} kg</span>
                      <span style={{ textAlign: "right" }}>{delta == null ? "–" : `${delta > 0 ? "▲ +" : delta < 0 ? "▼ " : ""}${delta} kg`}</span>
                      <span style={{ textAlign: "right" }}>{bfM ? `${bfM.avg} %` : "–"}</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div style={{ fontSize: 13, color: C.sub }}>Todavía no hay pesadas registradas.</div>
          )}
        </Card>

        <SectionTitle>Grasa y músculo</SectionTitle>
        <Card>
          {latestComp ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                {[
                  [`${latestComp.bf} %`, "GRASA", `${latestComp.c.fatKg} kg`],
                  [`${latestComp.c.musclePct} %`, latestComp.c.muscleEstimated ? "MÚSCULO*" : "MÚSCULO", `${latestComp.c.muscleKg} kg`],
                  [`${latestComp.c.leanKg} kg`, "MASA MAGRA", `de ${latestComp.w} kg`],
                ].map(([v, l, sub]) => (
                  <div key={l} style={{ background: C.soft, borderRadius: 12, padding: "10px 6px", textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: -0.4 }}>{v}</div>
                    <div style={{ fontSize: 10.5, fontWeight: 800, color: C.sub, letterSpacing: 0.4 }}>{l}</div>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: C.sub }}>{sub}</div>
                  </div>
                ))}
              </div>
              {/* barra de composición: grasa vs masa magra */}
              <div style={{ display: "flex", height: 12, borderRadius: 6, overflow: "hidden", gap: 2, marginBottom: 6 }}>
                <div style={{ width: `${latestComp.bf}%`, background: C.amber }} />
                <div style={{ flex: 1, background: C.primary }} />
              </div>
              <div style={{ display: "flex", gap: 14, fontSize: 12, fontWeight: 700, color: C.sub, marginBottom: 12 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: C.amber }} />Grasa</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: C.primary }} />Masa magra (músculo, huesos, agua)</span>
              </div>
              {compSeries[0].points.length >= 2 && <TrendChart unit=" %" series={compSeries} />}
            </>
          ) : (
            <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.45, marginBottom: 10 }}>
              Cargá tus medidas con cinta (cuello y cintura) o los números de una balanza de bioimpedancia para ver tu % de grasa y músculo mes a mes.
            </div>
          )}

          <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 12, marginTop: 4 }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 8 }}>Medición de hoy</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <div>
                <div style={lblStyle}>Sexo</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[["m", "Hombre"], ["f", "Mujer"]].map(([v, l]) => (
                    <button key={v} onClick={() => up((s) => { s.profile = { ...(s.profile || {}), sex: v }; return s; })} style={{
                      flex: 1, padding: "9px 0", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: FONT, fontWeight: 700, fontSize: 13,
                      background: profile.sex === v ? C.primarySoft : C.soft, color: profile.sex === v ? C.primaryInk : C.sub,
                    }}>{l}</button>
                  ))}
                </div>
              </div>
              <LabeledNum label="Altura (cm)" value={profile.height || ""} onChange={(v) => up((s) => { s.profile = { ...(s.profile || {}), height: v }; return s; })} />
              <LabeledNum label="Cuello (cm)" step={0.5} value={bodyDraft.neck} onChange={(v) => setBodyDraft({ ...bodyDraft, neck: v })} />
              <LabeledNum label="Cintura al ombligo (cm)" step={0.5} value={bodyDraft.waist} onChange={(v) => setBodyDraft({ ...bodyDraft, waist: v })} />
              {profile.sex === "f" && <LabeledNum label="Cadera (cm)" step={0.5} value={bodyDraft.hip} onChange={(v) => setBodyDraft({ ...bodyDraft, hip: v })} />}
            </div>
            {navyBf != null && (
              <div style={{ background: C.primarySoft, color: C.primaryInk, borderRadius: 10, padding: 10, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                Con la cinta te da <b>{navyBf} % de grasa</b> (método Navy, ±3 %).
              </div>
            )}
            <div style={{ fontSize: 12, color: C.sub, fontWeight: 600, margin: "4px 0 6px" }}>¿Tenés balanza con bioimpedancia? Poné sus valores (opcional, pisan la cinta):</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
              <LabeledNum label="% grasa (balanza)" step={0.1} value={bodyDraft.bf} onChange={(v) => setBodyDraft({ ...bodyDraft, bf: v })} />
              <LabeledNum label="% músculo (balanza)" step={0.1} value={bodyDraft.muscle} onChange={(v) => setBodyDraft({ ...bodyDraft, muscle: v })} />
            </div>
            <Btn style={{ width: "100%" }} onClick={() => {
              const bf = Number(bodyDraft.bf) || navyBf;
              if (!bf) { flash("Poné cuello y cintura (y tu altura), o el % de grasa de la balanza"); return; }
              if (!bodyWeight) { flash("Registrá tu peso primero (arriba)"); return; }
              up((s) => {
                s.bodyComp = s.bodyComp || {};
                s.bodyComp[today] = {
                  bf: Math.round(bf * 10) / 10, muscle: Number(bodyDraft.muscle) || null,
                  neck: Number(bodyDraft.neck) || null, waist: Number(bodyDraft.waist) || null, hip: Number(bodyDraft.hip) || null,
                  method: Number(bodyDraft.bf) ? "balanza" : "cinta",
                };
                // si está el Plan Cut, también sube de nivel con esta medición
                if (s.cut) { s.cut.bfLog = s.cut.bfLog || {}; s.cut.bfLog[today] = Math.round(bf * 10) / 10; }
                return s;
              });
              setBodyDraft({ neck: "", waist: "", hip: "", bf: "", muscle: "" });
              flash(`📊 Guardado: ${Math.round(bf * 10) / 10} % de grasa`);
            }}>Guardar medición</Btn>
            <div style={{ fontSize: 11.5, color: C.sub, lineHeight: 1.45, marginTop: 8 }}>
              Medí siempre en ayunas, a la misma hora, 1 vez cada 2–4 semanas. *El % de músculo sin balanza es una estimación (≈53 % de tu masa magra).
            </div>
          </div>
        </Card>

        <SectionTitle>Medidas corporales</SectionTitle>
        <Card>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 8, alignItems: "end", marginBottom: 10 }}>
            <LabeledNum label="Cintura cm" value={newMeas.waist} onChange={(v) => setNewMeas({ ...newMeas, waist: v })} />
            <LabeledNum label="Pecho cm" value={newMeas.chest} onChange={(v) => setNewMeas({ ...newMeas, chest: v })} />
            <LabeledNum label="Brazo cm" value={newMeas.arm} onChange={(v) => setNewMeas({ ...newMeas, arm: v })} />
            <Btn small onClick={() => {
              if (!newMeas.waist && !newMeas.chest && !newMeas.arm) return;
              up((s) => { s.measurements.push({ id: uid(), date: today, ...newMeas }); return s; });
              setNewMeas({ waist: "", chest: "", arm: "" });
            }}>＋</Btn>
          </div>
          {[...state.measurements].reverse().slice(0, 6).map((m) => (
            <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13.5, padding: "5px 0", borderTop: `1px solid ${C.line}`, fontWeight: 600 }}>
              <span style={{ color: C.sub }}>{fmtDate(m.date)}</span>
              <span>Cint {m.waist || "–"} · Pecho {m.chest || "–"} · Brazo {m.arm || "–"}</span>
              <Btn kind="danger" small style={{ padding: "0 6px" }} onClick={() => up((s) => {
                s.measurements = s.measurements.filter((x) => x.id !== m.id); return s;
              })}><X size={14} /></Btn>
            </div>
          ))}
          {state.measurements.length === 0 && <div style={{ fontSize: 13, color: C.sub }}>Registrá tus medidas para seguir el progreso más allá de la balanza.</div>}
        </Card>
      </>
    );
  }

  /* ============ MÁS ============ */
  const [newRem, setNewRem] = useState({ text: "", time: "18:00" });
  const [newTip, setNewTip] = useState("");
  const [editEvt, setEditEvt] = useState(null);
  const [newEvt, setNewEvt] = useState({ who: "yo", title: "", day: 1, start: "18:00", end: "19:30" });
  const [agendaDay, setAgendaDay] = useState(dow); // día seleccionado en el timeline de Agenda

  /* ============ BONUS: una lectura + un ejercicio por día (previa de Geografía) ============ */
  // Progreso en state.bonus[lessonId] = { leido, respuesta, guia, hecho }
  const bonusIdx = Math.min(Math.max(bonusDayIndex(today), 0), BONUS_LESSONS.length - 1);
  const bonusHoy = BONUS_LESSONS[bonusIdx];
  const bonusProg = (id) => (state.bonus || {})[id] || {};
  const bonusPendHoy = bonusDayIndex(today) < BONUS_LESSONS.length && !bonusProg(bonusHoy.id).hecho;

  function Bonus() {
    const sel = Math.min(Math.max(bonusSel ?? bonusIdx, 0), BONUS_LESSONS.length - 1);
    const L = BONUS_LESSONS[sel];
    const p = bonusProg(L.id);
    const hechos = BONUS_LESSONS.filter((x) => bonusProg(x.id).hecho).length;
    const atrasadas = BONUS_LESSONS.slice(0, bonusIdx).filter((x) => !bonusProg(x.id).hecho);
    const setP = (fn) => up((s) => { s.bonus = s.bonus || {}; s.bonus[L.id] = s.bonus[L.id] || {}; fn(s.bonus[L.id], s); return s; });
    const fechaDe = (i) => {
      const d = new Date(BONUS_START + "T00:00:00");
      d.setDate(d.getDate() + i);
      return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
    };
    const minChars = 120; // obliga a intentar antes de ver la guía
    const largo = (p.respuesta || "").trim().length;
    const navBtn = { width: 36, height: 36, borderRadius: 12, border: "none", cursor: "pointer", background: C.soft, color: C.ink, display: "flex", alignItems: "center", justifyContent: "center" };
    const tag = (bg, color) => ({ fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 999, background: bg, color });
    const boxTitle = { fontSize: 11.5, fontWeight: 800, color: C.sub, letterSpacing: 0.4, marginBottom: 6 };
    // Al terminar se tilda el tema correspondiente en Agenda → Materias
    const terminar = () => setP((x, s) => {
      x.hecho = true;
      if (L.tema != null) {
        const m = (s.subjects || []).find((y) => y.id === BONUS_SUBJECT_ID);
        const t = m && (m.temas || []).find((y) => y.id === `geo2-t${L.tema + 1}`);
        if (t) t.done = true;
      }
    });
    return (
      <>
        <PageHeader title="Bonus" subtitle="Previa de Geografía" />

        <Card style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.sub }}>PROGRESO · {hechos}/{BONUS_LESSONS.length}</div>
            <div style={{ height: 6, borderRadius: 999, background: C.soft, overflow: "hidden", marginTop: 6 }}>
              <div style={{ width: `${(hechos / BONUS_LESSONS.length) * 100}%`, height: "100%", borderRadius: 999, background: C.primary }} />
            </div>
          </div>
          {atrasadas.length > 0 && (
            <Btn kind="soft" small onClick={() => setBonusSel(BONUS_LESSONS.indexOf(atrasadas[0]))}>{atrasadas.length} atrasada{atrasadas.length === 1 ? "" : "s"}</Btn>
          )}
        </Card>

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0 10px" }}>
          <button aria-label="Lección anterior" style={{ ...navBtn, opacity: sel === 0 ? 0.35 : 1 }} disabled={sel === 0} onClick={() => setBonusSel(sel - 1)}><ChevronLeft size={18} /></button>
          <div style={{ flex: 1, textAlign: "center", fontSize: 12.5, fontWeight: 800, color: sel === bonusIdx ? C.primary : C.sub }}>
            {sel === bonusIdx ? "HOY" : sel < bonusIdx ? "DÍA ANTERIOR" : "ADELANTO"} · Día {sel + 1} · {fechaDe(sel)} · {L.unidad}
          </div>
          <button aria-label="Lección siguiente" style={{ ...navBtn, opacity: sel === BONUS_LESSONS.length - 1 ? 0.35 : 1 }} disabled={sel === BONUS_LESSONS.length - 1} onClick={() => setBonusSel(sel + 1)}><ChevronRight size={18} /></button>
        </div>

        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={tag(C.primarySoft, C.theme === "dark" ? C.primaryInk : C.primary)}>📖 LECTURA</span>
            {p.hecho && <span style={tag("rgba(52,199,89,0.14)", "#2e9e4f")}>✓ TERMINADA</span>}
          </div>
          <h2 style={{ margin: "10px 0 8px", fontSize: 21, fontWeight: 800, letterSpacing: -0.4, lineHeight: 1.2 }}>{L.titulo}</h2>
          {L.lectura.map((par, i) => (
            <p key={i} style={{ margin: "0 0 10px", fontSize: 15, lineHeight: 1.55, color: C.ink }}>{par}</p>
          ))}
          <div style={{ background: C.soft, borderRadius: 12, padding: "10px 12px", marginTop: 4 }}>
            <div style={boxTitle}>IDEAS CLAVE</div>
            {L.claves.map((c, i) => <div key={i} style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.5 }}>• {c}</div>)}
          </div>
          {!p.leido && (
            <div style={{ marginTop: 12, textAlign: "right" }}>
              <Btn onClick={() => setP((x) => { x.leido = true; })}>Ya lo leí → ejercicio</Btn>
            </div>
          )}
        </Card>

        {p.leido && (
          <Card style={{ marginTop: 12 }}>
            <span style={tag("rgba(255,149,0,0.14)", C.amber)}>✍️ EJERCICIO</span>
            <p style={{ margin: "10px 0", fontSize: 15, lineHeight: 1.55, fontWeight: 600 }}>{L.ejercicio.consigna}</p>
            <textarea
              placeholder="Escribí tu respuesta acá (se guarda sola)…"
              value={p.respuesta || ""}
              onChange={(e) => setP((x) => { x.respuesta = e.target.value; })}
              style={{
                width: "100%", boxSizing: "border-box", minHeight: 180, resize: "vertical",
                border: `1.5px solid ${C.line}`, borderRadius: 12, padding: 10,
                fontFamily: FONT, fontSize: 14.5, lineHeight: 1.5, background: C.input, color: C.ink, outline: "none",
              }} />
            {!p.guia ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.sub }}>
                  {largo < minChars ? `Escribí un poco más para ver la guía (${largo}/${minChars})` : "Listo, ya podés corregirte"}
                </span>
                <Btn small kind={largo < minChars ? "soft" : "primary"} style={{ opacity: largo < minChars ? 0.5 : 1 }}
                  onClick={() => { if (largo < minChars) { flash("Primero intentá responder 💪"); return; } setP((x) => { x.guia = true; }); }}>Ver guía de corrección</Btn>
              </div>
            ) : (
              <>
                <div style={{ background: C.soft, borderRadius: 12, padding: "10px 12px", marginTop: 10 }}>
                  <div style={boxTitle}>GUÍA DE CORRECCIÓN · ¿TU RESPUESTA TIENE ESTO?</div>
                  {L.ejercicio.guia.map((g, i) => <div key={i} style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.5, marginBottom: 4 }}>☐ {g}</div>)}
                </div>
                <div style={{ marginTop: 12, textAlign: "right" }}>
                  {p.hecho
                    ? <span style={{ fontSize: 13, fontWeight: 800, color: "#2e9e4f" }}>✓ Terminado{L.tema != null ? " · tema tildado en Materias" : ""}</span>
                    : <Btn onClick={() => { terminar(); flash("🧠 Bonus del día completo"); }}>Lo corregí, terminar</Btn>}
                </div>
              </>
            )}
          </Card>
        )}
      </>
    );
  }

  /* ============ AGENDA / CRONOGRAMA ============ */
  function Agenda() {
    const OWNER = {
      yo: { color: C.primary, soft: C.primarySoft, ink: C.primaryInk, label: "Yo" },
      novia: {
        color: "#EC4899",
        soft: state.theme === "dark" ? "rgba(236,72,153,0.16)" : "#FCE7F3",
        ink: state.theme === "dark" ? "#F9A8D4" : "#BE185D",
        label: "Novia",
      },
    };
    const ORDER = [1, 2, 3, 4, 5, 6, 0];
    const evts = state.schedule || [];
    const fmt = (e) => (e.end ? `${e.start}–${e.end}` : e.start);
    const byDay = (d) => evts.filter((e) => e.day === d).sort((a, b) => a.start.localeCompare(b.start));
    const aa = state.agendaAlerts || { on: true, lead: 15 };
    const nowMin = todayDate.getHours() * 60 + todayDate.getMinutes();
    const nextId = evts
      .filter((e) => e.day === dow && e.start)
      .map((e) => ({ id: e.id, min: (e.start.split(":").map(Number)[0]) * 60 + (e.start.split(":").map(Number)[1]) }))
      .filter((e) => e.min >= nowMin)
      .sort((a, b) => a.min - b.min)[0]?.id;

    // helpers llamados inline (no como <Componente/>) para no remontar los inputs y perder el foco
    const daySingle = (value, onPick) => (
      <div style={{ display: "flex", gap: 6 }}>
        {ORDER.map((d) => (
          <button key={d} onClick={() => onPick(d)} style={{
            flex: 1, padding: "8px 0", borderRadius: 10, cursor: "pointer", fontFamily: FONT,
            fontWeight: 800, fontSize: 13,
            border: `1px solid ${value === d ? C.primary : C.line}`,
            background: value === d ? C.primary : C.card,
            color: value === d ? "#fff" : C.sub,
          }}>{DAYS[d]}</button>
        ))}
      </div>
    );

    const editFields = (val, set) => (
      <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
        <Segmented options={[["yo", "Yo"], ["novia", "Novia"]]} value={val.who} onChange={(v) => set({ ...val, who: v })} />
        <Input placeholder="Actividad (ej: Gym, Vóley, INVAP)" value={val.title} onChange={(e) => set({ ...val, title: e.target.value })} />
        {daySingle(val.day, (d) => set({ ...val, day: d }))}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Input type="time" value={val.start} style={{ flex: 1 }} onChange={(e) => set({ ...val, start: e.target.value })} />
          <span style={{ color: C.sub, fontWeight: 700 }}>→</span>
          <Input type="time" value={val.end} style={{ flex: 1 }} onChange={(e) => set({ ...val, end: e.target.value })} />
        </div>
        <div style={{ fontSize: 12, color: C.sub }}>Dejá la hora de fin vacía para un aviso puntual (ej: “sale del colegio”).</div>
      </div>
    );

    const agendaNav = (
      <div style={{ marginBottom: 14 }}>
        <Segmented options={[["cronograma", "Cronograma"], ["materias", "Materias"]]} value={agendaView} onChange={setAgendaView} />
      </div>
    );
    if (agendaView === "materias") return Materias();

    function Materias() {
      const ESTADOS = {
        previa: { label: "Previa", color: C.red, bg: "rgba(255,59,48,0.12)" },
        cursando: { label: "Cursando", color: C.primary, bg: C.primarySoft },
        aprobada: { label: "Aprobada", color: "#2e9e4f", bg: "rgba(52,199,89,0.14)" },
      };
      const ORDEN = { previa: 0, cursando: 1, aprobada: 2 };
      const lista = [...subjects].sort((a, b) =>
        (ORDEN[a.estado] ?? 1) - (ORDEN[b.estado] ?? 1) || (a.examen || "9999").localeCompare(b.examen || "9999"));
      const setSub = (id, fn) => up((s) => { const m = (s.subjects || []).find((x) => x.id === id); if (m) fn(m); return s; });
      const addTema = (id) => {
        const t = (temaDraft[id] || "").trim();
        if (!t) return;
        setSub(id, (m) => { m.temas = m.temas || []; m.temas.push({ id: uid(), text: t, done: false }); });
        setTemaDraft((d) => ({ ...d, [id]: "" }));
      };
      const iconBtn = { width: 30, height: 26, borderRadius: 8, border: "none", cursor: "pointer", background: C.soft, color: C.sub, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };
      const subFields = (val, set) => (
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <Input placeholder="Materia (ej: Geografía)" value={val.name} onChange={(e) => set({ ...val, name: e.target.value })} />
            <Input placeholder="Año" value={val.curso} style={{ width: 90, flexShrink: 0 }} onChange={(e) => set({ ...val, curso: e.target.value })} />
          </div>
          <Segmented options={[["previa", "Previa"], ["cursando", "Cursando"], ["aprobada", "Aprobada"]]} value={val.estado} onChange={(v) => set({ ...val, estado: v })} />
          <div>
            <div style={lblStyle}>FECHA DE EXAMEN (opcional)</div>
            <Input type="date" value={val.examen || ""} onChange={(e) => set({ ...val, examen: e.target.value })} />
          </div>
        </div>
      );
      return (
        <>
          <PageHeader title="Agenda" subtitle="Materias y exámenes" />
          {agendaNav}

          {!lista.length && <Card><div style={{ fontSize: 13, color: C.sub, fontWeight: 600, textAlign: "center" }}>No cargaste materias todavía</div></Card>}

          {lista.map((m) => {
            const est = ESTADOS[m.estado] || ESTADOS.cursando;
            const temas = m.temas || [];
            const hechos = temas.filter((t) => t.done).length;
            const pend = temas.length - hechos;
            const d = m.examen ? daysUntil(m.examen) : null;
            const editing = editSubject === m.id;
            // Ritmo sugerido: repartir los temas pendientes en los días que quedan, dejando el último día para repasar
            const diasEstudio = d != null ? Math.max(1, d - 1) : null;
            const ritmo = pend > 0 && diasEstudio
              ? (pend >= diasEstudio ? `${Math.ceil(pend / diasEstudio)} tema${Math.ceil(pend / diasEstudio) === 1 ? "" : "s"} por día` : `1 tema cada ${Math.floor(diasEstudio / pend)} días`)
              : null;
            return (
              <Card key={m.id} style={{ marginTop: 10, opacity: m.estado === "aprobada" && !editing ? 0.7 : 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: -0.2 }}>{m.name}{m.curso ? <span style={{ color: C.sub, fontWeight: 700, fontSize: 13.5 }}> · {m.curso}</span> : null}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 999, background: est.bg, color: est.color, textTransform: "uppercase", letterSpacing: 0.3 }}>{est.label}</span>
                      {m.examen && m.estado !== "aprobada" && (
                        <span style={{ fontSize: 12.5, fontWeight: 800, color: d < 0 ? C.sub : d <= 7 ? C.red : d <= 14 ? C.amber : C.sub }}>
                          {d < 0 ? `Fue el ${m.examen.slice(8, 10)}/${m.examen.slice(5, 7)}` : d === 0 ? "Examen ¡hoy!" : `Examen ${m.examen.slice(8, 10)}/${m.examen.slice(5, 7)} · faltan ${d} día${d === 1 ? "" : "s"}`}
                        </span>
                      )}
                    </div>
                  </div>
                  <button aria-label={editing ? "Cerrar edición" : "Editar materia"} style={iconBtn} onClick={() => setEditSubject(editing ? null : m.id)}>
                    {editing ? <X size={14} /> : <Pencil size={14} />}
                  </button>
                </div>

                {editing ? (
                  <div style={{ marginTop: 12 }}>
                    {subFields(m, (v) => setSub(m.id, (x) => { x.name = v.name; x.curso = v.curso; x.estado = v.estado; x.examen = v.examen; }))}
                    <div style={{ marginTop: 12, textAlign: "right" }}>
                      <Btn kind="danger" small onClick={() => { setEditSubject(null); up((s) => { s.subjects = s.subjects.filter((x) => x.id !== m.id); return s; }); }}>Borrar materia</Btn>
                    </div>
                  </div>
                ) : m.estado !== "aprobada" && (
                  <>
                    {temas.length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 800, color: C.sub, marginBottom: 6 }}>
                          <span>TEMAS · {hechos}/{temas.length}</span>
                          {ritmo && <span style={{ color: C.primary }}>{ritmo}</span>}
                        </div>
                        <div style={{ height: 6, borderRadius: 999, background: C.soft, overflow: "hidden", marginBottom: 6 }}>
                          <div style={{ width: `${(hechos / temas.length) * 100}%`, height: "100%", borderRadius: 999, background: hechos === temas.length ? "#2e9e4f" : C.primary }} />
                        </div>
                        {temas.map((t) => (
                          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderTop: `1px solid ${C.line}` }}>
                            <Check done={t.done} onClick={() => setSub(m.id, (x) => { const tt = x.temas.find((y) => y.id === t.id); tt.done = !tt.done; })} />
                            <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: t.done ? C.sub : C.ink, textDecoration: t.done ? "line-through" : "none" }}>{t.text}</span>
                            <button aria-label="Borrar tema" style={iconBtn} onClick={() => setSub(m.id, (x) => { x.temas = x.temas.filter((y) => y.id !== t.id); })}><Trash2 size={13} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                    {!temas.length && (
                      <div style={{ fontSize: 12.5, color: C.sub, fontWeight: 600, marginTop: 10, lineHeight: 1.4 }}>
                        Cargá las unidades o temas del programa y andá tachando a medida que los estudiás.
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <Input placeholder="Nuevo tema (ej: Unidad 1 – Relieve)" value={temaDraft[m.id] || ""}
                        onChange={(e) => setTemaDraft({ ...temaDraft, [m.id]: e.target.value })}
                        onKeyDown={(e) => e.key === "Enter" && addTema(m.id)} />
                      <Btn onClick={() => addTema(m.id)}>＋</Btn>
                    </div>
                  </>
                )}
              </Card>
            );
          })}

          <SectionTitle>Agregar</SectionTitle>
          {newSubject ? (
            <Card>
              {subFields(newSubject, setNewSubject)}
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <Btn kind="ghost" style={{ flex: 1 }} onClick={() => setNewSubject(null)}>Cancelar</Btn>
                <Btn style={{ flex: 1 }} onClick={() => {
                  if (!newSubject.name.trim()) { flash("Poné el nombre de la materia"); return; }
                  up((s) => { s.subjects = s.subjects || []; s.subjects.push({ ...newSubject, id: uid(), name: newSubject.name.trim(), temas: [] }); return s; });
                  setNewSubject(null);
                  flash("📚 Materia agregada");
                }}>Crear materia</Btn>
              </div>
            </Card>
          ) : (
            <Btn kind="soft" onClick={() => setNewSubject({ name: "", curso: "", estado: "cursando", examen: "" })}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Plus size={17} /> Agregar materia
            </Btn>
          )}
        </>
      );
    }

    return (
      <>
        <PageHeader title="Agenda" subtitle="Tu cronograma y el de tu novia" />
        {agendaNav}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, margin: "0 4px 12px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 14 }}>
            {Object.values(OWNER).map((o) => (
              <div key={o.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700, color: C.sub }}>
                <span style={{ width: 12, height: 12, borderRadius: 4, background: o.color }} />{o.label}
              </div>
            ))}
          </div>
          <button onClick={() => up((s) => { const a = s.agendaAlerts || { on: true, lead: 15 }; s.agendaAlerts = { ...a, on: !a.on }; return s; })}
            style={{
              display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontFamily: FONT,
              border: `1px solid ${aa.on ? "transparent" : C.line}`, borderRadius: 999, padding: "6px 11px",
              background: aa.on ? C.primarySoft : C.card, color: aa.on ? C.primaryInk : C.sub,
              fontSize: 12, fontWeight: 800, transition: "all 0.2s",
            }}>
            <Bell size={13} /> {aa.on ? `Avisos ${aa.lead}′ antes` : "Avisos off"}
          </button>
        </div>

        {/* selector de días */}
        <div style={{ display: "flex", gap: 6, margin: "0 4px 14px" }}>
          {ORDER.map((d) => {
            const cnt = byDay(d).length;
            const active = d === agendaDay;
            const isToday = d === dow;
            return (
              <button key={d} onClick={() => { setAgendaDay(d); setEditEvt(null); }} style={{
                flex: 1, padding: "8px 0 7px", borderRadius: 12, cursor: "pointer", fontFamily: FONT,
                border: `1px solid ${active ? "transparent" : C.line}`,
                background: active ? `linear-gradient(135deg, ${C.primary}, ${C.accent})` : C.card,
                color: active ? "#fff" : (isToday ? C.primary : C.sub),
                boxShadow: active ? `0 4px 12px ${C.primaryGlow}` : "none",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4, transition: "all 0.15s",
              }}>
                <span style={{ fontSize: 13, fontWeight: 800 }}>{DAYS[d]}</span>
                <span style={{ width: 5, height: 5, borderRadius: 3, background: cnt ? (active ? "#fff" : C.primary) : "transparent" }} />
              </button>
            );
          })}
        </div>

        {(() => {
          const dayEvts = byDay(agendaDay).map((e) => ({
            ...e, s: hm2min(e.start), e2: e.end ? hm2min(e.end) : hm2min(e.start) + 20, punt: !e.end,
          }));
          const selName = DAY_NAMES[agendaDay];
          const isSelToday = agendaDay === dow;
          const header = (
            <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 4px 10px" }}>
              <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: -0.3 }}>{selName}</div>
              {isSelToday && <span style={{ fontSize: 10.5, fontWeight: 800, color: "#fff", background: C.primary, borderRadius: 6, padding: "2px 7px" }}>HOY</span>}
              <span style={{ fontSize: 12.5, color: C.sub, fontWeight: 700, marginLeft: "auto" }}>{dayEvts.length} {dayEvts.length === 1 ? "bloque" : "bloques"}</span>
            </div>
          );
          if (dayEvts.length === 0) {
            return (
              <>
                {header}
                <Card style={{ textAlign: "center", padding: "28px 16px", color: C.sub }}>
                  <Calendar size={26} style={{ opacity: 0.5 }} />
                  <div style={{ fontWeight: 800, fontSize: 15, color: C.ink, marginTop: 8 }}>Día libre</div>
                  <div style={{ fontSize: 13, marginTop: 2 }}>No hay nada agendado para {selName.toLowerCase()}.</div>
                </Card>
              </>
            );
          }
          const minStart = Math.min(...dayEvts.map((x) => x.s));
          const maxEnd = Math.max(...dayEvts.map((x) => x.e2));
          const startH = Math.max(0, Math.floor(minStart / 60));
          let endH = Math.min(24, Math.ceil(maxEnd / 60));
          if (endH <= startH) endH = startH + 1;
          const PXM = 1.0, gutter = 48;
          const totalH = (endH - startH) * 60 * PXM;

          // asignación de columnas para bloques que se solapan
          const cols = {};
          let cluster = [], clusterEnd = -1;
          const flush = () => {
            const ends = [];
            cluster.forEach((ev) => {
              let placed = ends.findIndex((end) => ev.s >= end);
              if (placed < 0) { placed = ends.length; ends.push(0); }
              ends[placed] = ev.e2;
              cols[ev.id] = { col: placed };
            });
            cluster.forEach((ev) => { cols[ev.id].n = ends.length; });
            cluster = []; clusterEnd = -1;
          };
          [...dayEvts].sort((a, b) => a.s - b.s || a.e2 - b.e2).forEach((ev) => {
            if (cluster.length && ev.s >= clusterEnd) flush();
            cluster.push(ev); clusterEnd = Math.max(clusterEnd, ev.e2);
          });
          if (cluster.length) flush();

          const nowTop = isSelToday && nowMin >= startH * 60 && nowMin <= endH * 60
            ? (nowMin - startH * 60) * PXM : null;

          return (
            <>
              {header}
              <Card style={{ padding: "12px 12px 8px", overflow: "hidden" }}>
                <div style={{ position: "relative", height: totalH }}>
                  {Array.from({ length: endH - startH + 1 }, (_, i) => {
                    const h = startH + i, y = i * 60 * PXM;
                    return (
                      <div key={h} style={{ position: "absolute", top: y, left: 0, right: 0, height: 0 }}>
                        <span style={{ position: "absolute", left: 0, top: -7, width: gutter - 10, textAlign: "right", fontSize: 11, fontWeight: 700, color: C.sub, fontVariantNumeric: "tabular-nums" }}>{String(h).padStart(2, "0")}:00</span>
                        <div style={{ position: "absolute", left: gutter, right: 0, top: 0, borderTop: `1px solid ${C.line}` }} />
                      </div>
                    );
                  })}
                  <div style={{ position: "absolute", left: gutter, right: 0, top: 0, bottom: 0 }}>
                    {dayEvts.map((e) => {
                      const o = OWNER[e.who] || OWNER.yo;
                      const { col, n } = cols[e.id];
                      const top = (e.s - startH * 60) * PXM;
                      const bh = Math.max(e.punt ? 30 : 36, (e.e2 - e.s) * PXM - 4);
                      const isNext = e.id === nextId && isSelToday;
                      const w = 100 / n;
                      return (
                        <button key={e.id} onClick={() => setEditEvt(editEvt === e.id ? null : e.id)} style={{
                          position: "absolute", top, height: bh,
                          left: `calc(${col * w}% + 2px)`, width: `calc(${w}% - 4px)`,
                          background: o.soft, borderRadius: 12, cursor: "pointer", padding: 0, overflow: "hidden",
                          textAlign: "left", fontFamily: FONT, display: "flex",
                          border: `1.5px ${e.punt ? "dashed" : "solid"} ${isNext ? C.primary : (e.punt ? o.color : "transparent")}`,
                          boxShadow: isNext ? `0 0 0 3px ${C.primaryGlow}` : "none",
                        }}>
                          <span style={{ width: 4, background: o.color, flexShrink: 0 }} />
                          <span style={{ flex: 1, minWidth: 0, padding: "5px 8px", display: "block" }}>
                            <span style={{ display: "block", fontSize: 12.5, fontWeight: 800, color: o.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.title || "—"}</span>
                            <span style={{ display: "block", fontSize: 10.5, fontWeight: 700, color: o.color, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{fmt(e)}{isNext ? " · PRÓXIMO" : ""}</span>
                          </span>
                        </button>
                      );
                    })}
                    {nowTop != null && (
                      <div style={{ position: "absolute", left: 0, right: 0, top: nowTop, zIndex: 5, pointerEvents: "none" }}>
                        <div style={{ position: "absolute", left: -3, top: -4, width: 8, height: 8, borderRadius: 4, background: C.red }} />
                        <div style={{ position: "absolute", left: 0, right: 0, top: 0, borderTop: `2px solid ${C.red}` }} />
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {editEvt && evts.find((x) => x.id === editEvt) && (() => {
                const e = evts.find((x) => x.id === editEvt);
                return (
                  <Card style={{ marginTop: 12, border: `1.5px solid ${C.primary}` }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ fontWeight: 800, fontSize: 14 }}>Editar bloque</div>
                      <button onClick={() => setEditEvt(null)} style={{ background: C.soft, border: "none", borderRadius: 999, width: 28, height: 28, cursor: "pointer", color: C.sub, display: "flex", alignItems: "center", justifyContent: "center" }}><X size={14} /></button>
                    </div>
                    {editFields(e, (nv) => up((s) => { Object.assign(s.schedule.find((x) => x.id === e.id), nv); return s; }))}
                    <div style={{ marginTop: 8, textAlign: "right" }}>
                      <Btn kind="danger" small onClick={() => { setEditEvt(null); up((s) => { s.schedule = s.schedule.filter((x) => x.id !== e.id); return s; }); }}>Borrar</Btn>
                    </div>
                  </Card>
                );
              })()}
            </>
          );
        })()}

        <SectionTitle>Nuevo bloque</SectionTitle>
        <Card>
          {editFields(newEvt, setNewEvt)}
          <Btn style={{ marginTop: 10, width: "100%" }} onClick={() => {
            if (!newEvt.title.trim()) return;
            up((s) => { s.schedule = [...(s.schedule || []), { id: uid(), ...newEvt, title: newEvt.title.trim() }]; return s; });
            setNewEvt({ who: newEvt.who, title: "", day: newEvt.day, start: "18:00", end: "19:30" });
          }}>Agregar al cronograma</Btn>
        </Card>
      </>
    );
  }

  function Mas() {
    return (
      <>
        <PageHeader title="Más" subtitle="Logros y ajustes" right={
          <Btn kind="soft" small onClick={() => up((s) => { s.theme = s.theme === "dark" ? "light" : "dark"; return s; })}
            style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {state.theme === "dark" ? <Sun size={15} /> : <Moon size={15} />} {state.theme === "dark" ? "Claro" : "Oscuro"}
          </Btn>
        } />

        <SectionTitle>Logros ({achDone}/{ACHIEVEMENTS.length})</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {ACHIEVEMENTS.map((a, i) => (
            <Card key={i} style={{ opacity: a.done ? 1 : 0.45, padding: 12 }}>
              <div>{a.done ? <a.Icon size={24} color={C.primary} /> : <Lock size={24} color={C.sub} />}</div>
              <div style={{ fontWeight: 800, fontSize: 13.5, margin: "4px 0 2px" }}>{a.name}</div>
              <div style={{ fontSize: 11.5, color: C.sub, fontWeight: 500, lineHeight: 1.35 }}>{a.desc}</div>
            </Card>
          ))}
        </div>

        <SectionTitle>Recordatorios</SectionTitle>
        {state.reminders.map((r) => {
          const editing = editRem === r.id;
          return (
            <Card key={r.id} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {editing ? (
                  <Input type="time" value={r.time} style={{ width: 110 }} onChange={(e) => up((s) => {
                    s.reminders.find((x) => x.id === r.id).time = e.target.value; return s;
                  })} />
                ) : (
                  <div style={{ background: C.amberSoft, color: C.amberInk, fontWeight: 800, fontSize: 13, borderRadius: 8, padding: "6px 8px" }}>{r.time}</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {editing ? (
                    <Input value={r.text} onChange={(e) => up((s) => {
                      s.reminders.find((x) => x.id === r.id).text = e.target.value; return s;
                    })} />
                  ) : (
                    <>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{r.text}</div>
                      <div style={{ fontSize: 12.5, color: C.sub }}>{r.days.length === 7 ? "Todos los días" : r.days.map((d) => DAYS[d]).join(" · ")}</div>
                    </>
                  )}
                </div>
                <Btn kind="soft" small onClick={() => setEditRem(editing ? null : r.id)} style={{ display: "flex" }}>{editing ? "Listo" : <Pencil size={14} />}</Btn>
              </div>
              {editing && (
                <div style={{ marginTop: 10 }}>
                  <DayPicker days={r.days} onToggle={(i) => up((s) => {
                    const rr = s.reminders.find((x) => x.id === r.id);
                    rr.days = rr.days.includes(i) ? rr.days.filter((x) => x !== i) : [...rr.days, i];
                    return s;
                  })} />
                  <div style={{ marginTop: 8, textAlign: "right" }}>
                    <Btn kind="danger" small onClick={() => {
                      setEditRem(null);
                      up((s) => { s.reminders = s.reminders.filter((x) => x.id !== r.id); return s; });
                    }}>Borrar</Btn>
                  </div>
                </div>
              )}
            </Card>
          );
        })}

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Nuevo recordatorio</div>
          <div style={{ display: "grid", gap: 8 }}>
            <Input placeholder="Texto (ej: preparar comida de mañana)" value={newRem.text} onChange={(e) => setNewRem({ ...newRem, text: e.target.value })} />
            <Input type="time" value={newRem.time} onChange={(e) => setNewRem({ ...newRem, time: e.target.value })} />
            <Btn onClick={() => {
              if (!newRem.text.trim()) return;
              up((s) => { s.reminders.push({ id: uid(), text: newRem.text.trim(), time: newRem.time, days: [0,1,2,3,4,5,6] }); return s; });
              setNewRem({ text: "", time: "18:00" });
            }}>Agregar</Btn>
          </div>
          <div style={{ fontSize: 12.5, color: C.sub, marginTop: 10, lineHeight: 1.4 }}>
            Los avisos aparecen dentro de la app mientras está abierta.
          </div>
        </Card>

        <SectionTitle>Mis tips personalizados</SectionTitle>
        <Card>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <Input placeholder="Agregá tu propio tip o frase" value={newTip} onChange={(e) => setNewTip(e.target.value)} />
            <Btn onClick={() => {
              if (!newTip.trim()) return;
              up((s) => { s.customTips = [...(s.customTips || []), newTip.trim()]; return s; });
              setNewTip("");
            }}>＋</Btn>
          </div>
          {(state.customTips || []).map((t, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "8px 4px", borderTop: `1px solid ${C.line}`, fontSize: 14 }}>
              <span>⭐ {t}</span>
              <Btn kind="danger" small onClick={() => up((s) => { s.customTips = s.customTips.filter((_, j) => j !== i); return s; })}><X size={14} /></Btn>
            </div>
          ))}
          {(state.customTips || []).length === 0 && <div style={{ fontSize: 13, color: C.sub }}>Tus tips entran en la rotación del "Tip del día".</div>}
        </Card>

        <SectionTitle>Notificaciones push 📲</SectionTitle>
        <Card>
          <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.45, marginBottom: 10 }}>
            Con el mini-servidor desplegado (carpeta <b>worker/</b> del repo), los recordatorios y el
            temporizador de descanso te llegan como notificaciones nativas aunque la app esté cerrada.
            En iPhone la app tiene que estar instalada en la pantalla de inicio (iOS 16.4+).
          </div>
          <div style={{ display: "grid", gap: 8, marginBottom: 10 }}>
            <Input placeholder="URL del servidor (https://nexofit-push….workers.dev)" value={pushCfg.url}
              onChange={(e) => up((s) => { s.push = { ...pushCfg, url: e.target.value }; return s; })} />
            <Input placeholder="Token secreto" value={pushCfg.token}
              onChange={(e) => up((s) => { s.push = { ...pushCfg, token: e.target.value }; return s; })} />
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            {pushCfg.enabled ? (
              <>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.primary, flex: 1 }}>✅ Activadas en este teléfono</span>
                <Btn small kind="soft" onClick={async () => {
                  const r = await pushCall("/test");
                  flash(r && r.ok ? "Enviada: fijate la notificación 📲" : "No se pudo enviar la prueba");
                }}>Probar</Btn>
                <Btn small kind="danger" onClick={disablePush}>Desactivar</Btn>
              </>
            ) : (
              <Btn small onClick={enablePush}>Activar en este teléfono</Btn>
            )}
          </div>
        </Card>

        <SectionTitle>Seguridad</SectionTitle>
        <Card>
          {(() => {
            const hasPin = !!localStorage.getItem(PIN_KEY);
            return (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ flex: "1 1 180px", minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                    {hasPin ? <Lock size={14} /> : <Unlock size={14} />} {hasPin ? "PIN activo" : "Sin PIN"}
                  </div>
                  <div style={{ fontSize: 12.5, color: C.sub, fontWeight: 500, lineHeight: 1.4 }}>
                    {hasPin ? "Se te pide al abrir la app en cada sesión nueva." : "Cualquiera con el link puede abrir la app."}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {hasPin ? (
                    <>
                      <Btn small kind="soft" onClick={() => { localStorage.removeItem(PIN_KEY); setShowPinSetup(true); }}>Cambiar</Btn>
                      <Btn small kind="danger" onClick={() => {
                        if (confirm("¿Quitar el PIN? Cualquiera con el link va a poder abrir la app.")) {
                          localStorage.removeItem(PIN_KEY);
                          localStorage.setItem(PIN_OPTOUT, "1");
                          sessionStorage.removeItem(PIN_SESSION);
                          setBanner("PIN quitado");
                          setTimeout(() => setBanner(null), 3000);
                        }
                      }}>Quitar</Btn>
                    </>
                  ) : (
                    <Btn small onClick={() => setShowPinSetup(true)}>Crear PIN</Btn>
                  )}
                </div>
              </div>
            );
          })()}
        </Card>

        <Card style={{ marginTop: 8 }}>
          {(() => {
            const hasPin = !!localStorage.getItem(PIN_KEY);
            const supported = bioSupported();
            return (
              <>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ flex: "1 1 180px", minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                      <ScanFace size={14} /> Face ID / huella
                    </div>
                    <div style={{ fontSize: 12.5, color: C.sub, fontWeight: 500, lineHeight: 1.4 }}>
                      {!supported
                        ? "No disponible acá. En iPhone instalá la app en la pantalla de inicio (iOS 16.4+)."
                        : bioOn
                        ? "Desbloqueás con tu cara o huella; el PIN queda de respaldo."
                        : "Sumá desbloqueo biométrico además del PIN."}
                    </div>
                  </div>
                  {supported && (bioOn ? (
                    <Btn small kind="danger" onClick={() => { localStorage.removeItem(BIO_KEY); setBioOn(false); flash("Face ID desactivado"); }}>Desactivar</Btn>
                  ) : hasPin ? (
                    <Btn small onClick={async () => {
                      try { await bioEnroll(); setBioOn(true); flash("Face ID activado 🎉"); }
                      catch (e) { flash("No se pudo activar Face ID"); }
                    }}>Activar</Btn>
                  ) : null)}
                </div>
                {supported && !bioOn && !hasPin && (
                  <div style={{ fontSize: 12, color: C.amberInk, marginTop: 8, fontWeight: 700 }}>
                    Creá primero un PIN para poder activar Face ID.
                  </div>
                )}
              </>
            );
          })()}
        </Card>

        <SectionTitle>Datos</SectionTitle>
        <Card>
          <div style={{ fontSize: 12.5, color: C.sub, fontWeight: 600, marginBottom: 10, lineHeight: 1.4 }}>
            Todo vive en este teléfono — si borrás datos de Safari o reinstalás, se pierde. Guardá un backup de vez en cuando.
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <Btn kind="soft" small style={{ flex: 1 }} onClick={exportData}>Exportar backup</Btn>
            <Btn kind="soft" small style={{ flex: 1 }} onClick={() => importFileRef.current?.click()}>Importar backup</Btn>
            <input ref={importFileRef} type="file" accept="application/json" style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files[0]; if (f) importData(f); e.target.value = ""; }} />
          </div>
          {confirmReset ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>¿Seguro? Se borra todo.</span>
              <div style={{ display: "flex", gap: 6 }}>
                <Btn kind="ghost" small onClick={() => setConfirmReset(false)}>Cancelar</Btn>
                <Btn small style={{ background: C.red }} onClick={async () => {
                  setConfirmReset(false);
                  setState(structuredClone(initialState));
                  try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignorar */ }
                }}>Borrar todo</Btn>
              </div>
            </div>
          ) : (
            <Btn kind="danger" small onClick={() => setConfirmReset(true)}>Reiniciar la app (borrar todos los datos)</Btn>
          )}
        </Card>
      </>
    );
  }

  /* ---------- helpers UI ---------- */
  function MiniStat({ label, value, color }) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: 4, background: color }} />
        <div style={{ fontSize: 13, color: C.sub, fontWeight: 600, flex: 1 }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 800 }}>{value}</div>
      </div>
    );
  }

  function BigStat({ value, label, color }) {
    return (
      <div style={{ flex: 1, textAlign: "center" }}>
        <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
        <div style={{ fontSize: 11.5, color: C.sub, fontWeight: 600 }}>{label}</div>
      </div>
    );
  }

  function Row({ left, title, sub, right }) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 8px" }}>
        {left}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{title}</div>
          {sub && <div style={{ fontSize: 12.5, color: C.sub, fontWeight: 500 }}>{sub}</div>}
        </div>
        {right}
      </div>
    );
  }

  function MacroBox({ label, value, goal, unit, color }) {
    const pct = Math.min(1, goal ? value / goal : 0);
    return (
      <div>
        <div style={{ fontSize: 12.5, color: C.sub, fontWeight: 700, marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 18, fontWeight: 800 }}>{value}<span style={{ fontSize: 12, color: C.sub, fontWeight: 600 }}> / {goal} {unit}</span></div>
        <div style={{ height: 8, borderRadius: 4, background: C.line, marginTop: 6, overflow: "hidden" }}>
          <div style={{ width: `${pct * 100}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.4s" }} />
        </div>
      </div>
    );
  }

  function GoalInput({ label, value, onChange }) {
    return (
      <div>
        <div style={lblStyle}>{label}</div>
        <Input type="number" value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} />
      </div>
    );
  }

  function LabeledNum({ label, value, onChange, step = 1 }) {
    return (
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={lblStyle}>{label}</div>
        <Input type="number" step={step} value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} />
      </div>
    );
  }

  function Empty({ text }) {
    return <div style={{ padding: 14, fontSize: 13.5, color: C.sub, textAlign: "center" }}>{text}</div>;
  }

  const lblStyle = { fontSize: 11.5, color: C.sub, fontWeight: 700, marginBottom: 4 };
  const h1Style = { margin: "4px 4px 14px", fontSize: 32, fontWeight: 800, letterSpacing: -0.5 };

  const tabs = [
    { id: "gym", label: "Gym", Icon: Dumbbell },
    { id: "correr", label: "Correr", Icon: Footprints },
    { id: "agenda", label: "Agenda", Icon: Calendar },
    { id: "bonus", label: "Bonus", Icon: Lightbulb },
    { id: "hoy", label: "Hoy", Icon: Sun },
    { id: "salud", label: "Salud", Icon: HeartPulse },
    { id: "habitos", label: "Hábitos", Icon: Target },
    { id: "dieta", label: "Dieta", Icon: Salad },
    { id: "plata", label: "Plata", Icon: Wallet },
    { id: "mas", label: "Más", Icon: Settings },
  ];
  const curTab = tabs.find((t) => t.id === tab) || tabs[0];

  // Navegación tipo Instagram: deslizar horizontal cambia de sección
  const onSwipeStart = (e) => {
    const t = e.touches[0];
    swipeRef.current = { x: t.clientX, y: t.clientY };
  };
  const onSwipeEnd = (e) => {
    if (menuOpen || showChat) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - swipeRef.current.x;
    const dy = t.clientY - swipeRef.current.y;
    // Solo si el gesto es claramente horizontal (no interferir con scroll vertical)
    if (Math.abs(dx) < 65 || Math.abs(dx) < Math.abs(dy) * 1.6) return;
    const idx = tabs.findIndex((tb) => tb.id === tab);
    if (dx < 0 && idx < tabs.length - 1) setTab(tabs[idx + 1].id);
    else if (dx > 0 && idx > 0) setTab(tabs[idx - 1].id);
  };

  if (!loaded) {
    return (
      <div style={{ fontFamily: FONT, background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: C.sub, fontWeight: 600 }}>
        Cargando tus datos…
      </div>
    );
  }

  if (locked) {
    return <PinGate theme={state.theme} onUnlock={() => setLocked(false)} />;
  }

  if (showPinSetup) {
    return <PinGate theme={state.theme} onUnlock={() => setShowPinSetup(false)} />;
  }

  return (
    <div style={{ fontFamily: FONT, background: C.bg, minHeight: "100vh", color: C.ink }}>
      {banner && (
        <div style={{
          position: "fixed", top: "calc(12px + env(safe-area-inset-top))", left: 12, right: 12, zIndex: 50,
          background: C.ink, color: C.bg, borderRadius: 16, padding: "14px 16px",
          fontWeight: 700, fontSize: 14.5, boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
          display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center",
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Bell size={16} />{banner}</span>
          <button onClick={() => setBanner(null)} style={{ background: "none", border: "none", color: C.bg, cursor: "pointer", display: "flex" }}><X size={16} /></button>
        </div>
      )}

      {showChat && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: kbInset, zIndex: 60, background: C.bg, display: "flex", flexDirection: "column", fontFamily: FONT, animation: "norteSlideUp 0.3s cubic-bezier(0.22,1,0.36,1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "calc(12px + env(safe-area-inset-top)) 16px 12px", borderBottom: `1px solid ${C.line}`, background: C.card }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Bot size={20} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>NEXO</div>
              <div style={{ fontSize: 11.5, color: C.sub, fontWeight: 600 }}>Tu asistente</div>
            </div>
            <button onClick={toggleTts} aria-label={ttsOn ? "Silenciar respuestas" : "Leer respuestas en voz alta"}
              style={{ background: "none", border: "none", color: ttsOn ? C.primary : C.sub, cursor: "pointer", display: "flex" }}>
              {ttsOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
            <button onClick={() => setShowChat(false)} style={{ background: "none", border: "none", color: C.sub, cursor: "pointer", display: "flex" }}><X size={22} /></button>
          </div>

          <div ref={chatScrollRef} style={{ flex: 1, overflowY: "auto", padding: "16px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
            {chatMsgs.length === 0 && (
              <div style={{ margin: "auto", textAlign: "center", color: C.sub, maxWidth: 290 }}>
                <Bot size={40} style={{ opacity: 0.5, marginBottom: 10 }} />
                <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.5 }}>
                  Escribile a NEXO. Necesitás el servidor configurado (en <b>Más</b>) y <b>nexo_bridge.py</b> corriendo en tu PC con NEXO prendido.
                </div>
              </div>
            )}
            {chatMsgs.map((m) => (
              <div key={m.id} style={{ alignSelf: m.role === "me" ? "flex-end" : "flex-start", maxWidth: "82%" }}>
                <div onClick={m.role === "nexo" ? () => speak(m.text) : undefined} style={{
                  padding: "10px 13px", borderRadius: 16, fontSize: 14.5, lineHeight: 1.4, whiteSpace: "pre-wrap", wordBreak: "break-word",
                  background: m.role === "me" ? `linear-gradient(135deg, ${C.primary}, ${C.accent})` : C.card,
                  color: m.role === "me" ? "#fff" : C.ink,
                  border: m.role === "me" ? "none" : `1px solid ${C.line}`,
                  borderBottomRightRadius: m.role === "me" ? 4 : 16,
                  borderBottomLeftRadius: m.role === "me" ? 16 : 4,
                  cursor: m.role === "nexo" ? "pointer" : "default",
                }}>{m.text}</div>
              </div>
            ))}
            {chatBusy && (
              <div style={{ alignSelf: "flex-start", color: C.sub, fontSize: 13, fontWeight: 600, padding: "6px 4px" }}>NEXO está pensando…</div>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, padding: "12px 14px calc(12px + env(safe-area-inset-bottom))", borderTop: `1px solid ${C.line}`, background: C.card }}>
            <Input id="norteChatInput" value={chatInput} placeholder="Escribí o hablale a NEXO…" style={{ flex: 1 }}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }} />
            <button
              onClick={toggleMic}
              onMouseDown={(e) => e.preventDefault()}
              disabled={chatBusy}
              aria-label={listening ? "Detener dictado" : "Hablarle a NEXO"}
              style={{
                border: `1.5px solid ${listening ? C.primary : C.line}`, borderRadius: 12, fontFamily: FONT, flexShrink: 0,
                padding: "12px 13px", display: "flex", alignItems: "center", justifyContent: "center",
                background: listening ? `${C.primary}1a` : "transparent", color: listening ? C.primary : C.sub,
                cursor: chatBusy ? "default" : "pointer", opacity: chatBusy ? 0.5 : 1,
                animation: listening ? "nortePulse 1.1s ease-in-out infinite" : "none",
              }}>
              <Mic size={16} />
            </button>
            <button
              onClick={sendChat}
              onMouseDown={(e) => e.preventDefault()}  // no le saca el foco al input: en iOS así el tap sí dispara
              disabled={chatBusy}
              aria-label="Enviar"
              onPointerDown={(e) => { if (!chatBusy) e.currentTarget.style.transform = "scale(0.94)"; }}
              onPointerUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
              onPointerLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
              style={{
                border: "none", borderRadius: 12, fontFamily: FONT, flexShrink: 0,
                padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "center",
                background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`, color: "#fff",
                boxShadow: `0 4px 14px ${C.primaryGlow}`,
                cursor: chatBusy ? "default" : "pointer", opacity: chatBusy ? 0.5 : 1,
                transition: "opacity 0.2s ease, transform 0.12s ease",
              }}>
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Orbe flotante de NEXO: siempre a mano para abrir el chat */}
      {!showChat && (
        <button
          onClick={() => setShowChat(true)}
          aria-label="Hablar con NEXO"
          style={{
            position: "fixed", right: 16,
            bottom: "calc(14px + env(safe-area-inset-bottom))",
            zIndex: 45, width: 56, height: 56, padding: 0, border: "none",
            borderRadius: "50%", background: "transparent", cursor: "pointer",
            animation: "norteFloat 4.5s ease-in-out infinite",
            WebkitTapHighlightColor: "transparent",
          }}
          onPointerDown={(e) => { e.currentTarget.style.transform = "scale(0.9)"; }}
          onPointerUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          onPointerLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          {/* halo verde que respira */}
          <span style={{
            position: "absolute", inset: -4, borderRadius: "50%",
            background: "#22E39A", animation: "norteHalo 2.8s ease-in-out infinite",
          }} />
          {/* cuerpo del orbe: gradiente verde que gira */}
          <span style={{
            position: "absolute", inset: 0, borderRadius: "50%", overflow: "hidden",
            boxShadow: `0 12px 30px rgba(16,185,129,0.45), inset 0 0 0 1px rgba(255,255,255,0.18)`,
          }}>
            <span style={{
              position: "absolute", inset: "-25%", borderRadius: "50%",
              background: `conic-gradient(from 0deg, #10B981, #34D399, #00E676, #059669, #10B981)`,
              animation: "norteOrbSpin 7s linear infinite",
            }} />
          </span>
          {/* brillo superior + ícono */}
          <span style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "radial-gradient(circle at 34% 26%, rgba(255,255,255,0.5), rgba(255,255,255,0) 55%)",
          }}>
            <Bot size={25} color="#fff" strokeWidth={2.2} />
          </span>
        </button>
      )}

      <div onTouchStart={onSwipeStart} onTouchEnd={onSwipeEnd}
        style={{ maxWidth: 520, margin: "0 auto", padding: "calc(14px + env(safe-area-inset-top)) 14px 116px" }}>
        <div key={tab} style={{ animation: "norteFadeUp 0.34s cubic-bezier(0.22,1,0.36,1) both" }}>
          {tab === "hoy" && Hoy()}
          {tab === "salud" && Salud()}
          {tab === "agenda" && Agenda()}
          {tab === "bonus" && Bonus()}
          {tab === "habitos" && Habitos()}
          {tab === "gym" && Gym()}
          {tab === "correr" && Correr()}
          {tab === "dieta" && Dieta()}
          {tab === "plata" && Finanzas()}
          {tab === "mas" && Mas()}
        </div>
      </div>

      {/* Navbar = botón de 3 barritas: al tocar aparecen todas las funciones */}
      <div style={{
        position: "fixed", bottom: "calc(16px + env(safe-area-inset-bottom))",
        left: 0, right: 0, zIndex: 40, display: "flex", justifyContent: "center", pointerEvents: "none",
      }}>
        <button onClick={() => setMenuOpen(true)} aria-label="Abrir menú" style={{
          pointerEvents: "auto", display: "flex", alignItems: "center", gap: 10,
          background: C.navBg, backdropFilter: "blur(24px) saturate(180%)", WebkitBackdropFilter: "blur(24px) saturate(180%)",
          border: `1px solid ${C.line}`, borderRadius: 999, padding: "11px 20px 11px 17px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.06)",
          cursor: "pointer", fontFamily: FONT, transition: "transform 0.12s ease",
        }}
          onPointerDown={(e) => { e.currentTarget.style.transform = "scale(0.94)"; }}
          onPointerUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          onPointerLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}>
          <Menu size={20} color={C.ink} strokeWidth={2.4} />
          <span style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 800, fontSize: 14.5, color: C.ink, letterSpacing: -0.2 }}>
            <curTab.Icon size={16} strokeWidth={2.4} style={{ color: C.theme === "dark" ? C.primaryInk : C.primary }} />
            {curTab.label}
          </span>
        </button>
      </div>

      {/* Hoja con todas las funciones */}
      {menuOpen && (
        <>
          <div onClick={() => setMenuOpen(false)} style={{
            position: "fixed", inset: 0, zIndex: 55, background: "rgba(0,0,0,0.42)",
            backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)", animation: "norteFadeIn 0.2s ease",
          }} />
          <div style={{
            position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 56, maxWidth: 520, margin: "0 auto",
            background: C.card, borderTopLeftRadius: 26, borderTopRightRadius: 26, fontFamily: FONT,
            padding: "10px 16px calc(22px + env(safe-area-inset-bottom))",
            boxShadow: "0 -12px 44px rgba(0,0,0,0.24)", animation: "norteSlideUp 0.32s cubic-bezier(0.22,1,0.36,1)",
          }}>
            <div style={{ width: 40, height: 5, borderRadius: 999, background: C.line, margin: "4px auto 16px" }} />
            <div style={{ fontSize: 11.5, fontWeight: 800, color: C.sub, letterSpacing: 1, textTransform: "uppercase", margin: "0 4px 12px" }}>Ir a</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {tabs.map((t) => {
                const active = tab === t.id;
                return (
                  <button key={t.id} onClick={() => { setTab(t.id); setMenuOpen(false); }} aria-current={active ? "page" : undefined} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "15px 16px", borderRadius: 16, cursor: "pointer",
                    fontFamily: FONT, textAlign: "left", transition: "transform 0.12s ease",
                    border: `1.5px solid ${active ? "transparent" : C.line}`,
                    background: active ? `linear-gradient(135deg, ${C.primary}, ${C.accent})` : C.bg,
                    color: active ? "#fff" : C.ink,
                    boxShadow: active ? `0 6px 18px ${C.primaryGlow}` : "none",
                  }}
                    onPointerDown={(e) => { e.currentTarget.style.transform = "scale(0.96)"; }}
                    onPointerUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                    onPointerLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}>
                    <t.Icon size={22} strokeWidth={2.4} style={{ flexShrink: 0 }} />
                    <span style={{ fontWeight: 800, fontSize: 15 }}>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
