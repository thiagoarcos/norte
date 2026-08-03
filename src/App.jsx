import { useState, useEffect, useRef, useMemo } from "react";
import {
  Target, Dumbbell, Sun, Moon, Salad, Settings, Trophy, Flame, Zap, Droplet,
  TrendingUp, Apple, Sprout, Lock, Unlock, Bell, Lightbulb, Smartphone, X, Calendar,
  Upload, Award, PersonStanding, Check as CheckIcon, Video, Pencil, AlertTriangle, ScanFace,
  Bot, Send, Pause, Play, Clock, Menu,
} from "lucide-react";
import { buildDefaultProgram } from "./defaultProgram";

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
};
const DARK = {
  bg: "#08090C", card: "#101116", ink: "#F5F6F8", sub: "#8B8F9A",
  line: "#1E2028", soft: "#16171D", input: "#16171D",
  primary: "#4B7BFF", primarySoft: "#132048", primaryInk: "#A9C0FF",
  primaryGlow: "rgba(75,123,255,0.45)", accent: "#22DAFF",
  amber: "#FBBF24", amberSoft: "#3A2A0B", amberInk: "#FCD34D",
  blue: "#22DAFF", blueSoft: "#0E2A3B", red: "#F87171",
  navBg: "rgba(8,9,12,0.75)", body: "#1E2028",
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
   OJO: este repo es PÚBLICO — el token y el PIN quedan visibles. Rotar el token si hace falta. */
const RELAY_URL = "https://nexofit-push.arcossz.workers.dev";
const RELAY_TOKEN = "8r3UIJNxdzJaDk6DVoHGMevRpPPUXXEY";
// PIN por defecto 4444 = SHA-256 de "nexofit-salt:4444". Se provisiona en el primer
// arranque si no hay PIN y no lo desactivaste a propósito (podés cambiarlo en Más → Seguridad).
const DEFAULT_PIN_HASH = "0dfd3b448fe1bc90a4d2b1a2e2bb8332d924380758640fbd83553cf82e9274e6";
try {
  if (typeof localStorage !== "undefined" && !localStorage.getItem(PIN_KEY) && localStorage.getItem(PIN_OPTOUT) !== "1") {
    localStorage.setItem(PIN_KEY, DEFAULT_PIN_HASH);
  }
} catch (e) {}

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
    { id: "h2", name: "Tomar 2L de agua", icon: "💧", days: [0, 1, 2, 3, 4, 5, 6], history: {} },
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
  water: {},
  weightLog: {},
  measurements: [],
  notes: {},
  reminders: [
    { id: uid(), text: "Hora de entrenar 💪", time: "18:00", days: [1, 2, 3, 4, 5] },
    { id: uid(), text: "Registrá tu cena 🍽️", time: "21:30", days: [0, 1, 2, 3, 4, 5, 6] },
  ],
  goals: { kcal: 2500, protein: 140, carbs: 300, fat: 80, water: 8 },
  customTips: [],
  cut: null,
  push: { url: RELAY_URL, token: RELAY_TOKEN, enabled: false },
  agendaAlerts: { on: true, lead: 15 }, // avisar `lead` minutos antes de cada bloque
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

async function loadState() {
  for (const key of [STORAGE_KEY, "nexofit-state-v3", "nexofit-state-v2", "nexofit-state-v1"]) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
  }
  return null;
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

/* ============ MAPA MUSCULAR ============ */
function BodyMap({ side, selected, onSelect }) {
  const sel = (id) => selected === id;
  const P = (id) => ({
    fill: sel(id) ? C.accent : C.primary,
    opacity: sel(id) ? 1 : 0.55,
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
  const [showCalc, setShowCalc] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [kbInset, setKbInset] = useState(0); // alto del teclado en iOS (visualViewport)
  const swipeRef = useRef({ x: 0, y: 0 });
  const [chatMsgs, setChatMsgs] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
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
        return {
          ...prev, ...s,
          goals: { ...prev.goals, ...(s.goals || {}) },
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
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
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
    };
    const iv = setInterval(check, 20000);
    check();
    return () => clearInterval(iv);
  }, [state.reminders, state.schedule, state.agendaAlerts]);

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

  // Chat con NEXO (asistente) vía el relay del worker. Requiere el bridge corriendo en la PC.
  const sendChat = async () => {
    const text = chatInput.trim();
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
          if (rep.id === id) { setChatMsgs((m) => [...m, { id: uid(), role: "nexo", text: rep.text }]); answered = true; }
        }
      }
      if (!answered) setChatMsgs((m) => [...m, { id: uid(), role: "nexo", text: "NEXO no respondió. ¿Está corriendo nexo_bridge.py en tu PC (con NEXO prendido)?" }]);
    } catch (e) {
      setChatMsgs((m) => [...m, { id: uid(), role: "nexo", text: "Error de conexión." }]);
    }
    setChatBusy(false);
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
    }
  };

  useEffect(() => {
    if (!pushReady) return;
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
  }, [pushReady]);

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
  const water = state.water[today] || 0;

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
    { id: "water", auto: true, text: "Completá tu meta de agua", done: water >= state.goals.water },
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
        agua: { hoy: water, meta: state.goals.water },
        nutricion: { kcal, kcalMeta: state.goals.kcal, proteina: prot, proteinaMeta: state.goals.protein, carbs, grasa: fat, comidas: mealsToday.length },
        habitos: habitsToday.map((h) => ({ nombre: h.name, hecho: !!h.history[today] })),
        peso: bodyWeight || null,
        cut: cut ? { activo: true, bf: cutBf, fase: cutPhase?.name, objetivo: cutPhase?.target, misiones: `${cutMissionsDone}/${cutMissions.length}` } : { activo: false },
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
    parts.push(Math.min(1, water / state.goals.water));
    return parts.reduce((a, b) => a + b, 0) / parts.length;
  }, [habitsDone, habitsToday.length, exDone, exTotal, water, state.goals.water]);

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
    { Icon: Droplet, name: "Hidratado", desc: "Meta de agua cumplida hoy", done: water >= state.goals.water },
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
        s.sessionLog[today].push({ id: ex.id, name: ex.name, setsCount: ex.sets.length, tonnage: tonnage(ex) });
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
              try { localStorage.setItem("nexofit-install-hidden", "1"); } catch (e) {}
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
              <MiniStat label="Agua" value={`${water}/${state.goals.water}`} color={C.blue} />
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

        <SectionTitle>Agua</SectionTitle>
        <Card>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
            {Array.from({ length: state.goals.water }).map((_, i) => (
              <div key={i} onClick={() => up((s) => { s.water[today] = i + 1 === water ? i : i + 1; return s; })}
                style={{
                  width: 34, height: 42, borderRadius: 10, cursor: "pointer",
                  background: i < water ? C.blue : C.blueSoft,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                {i < water ? <Droplet size={17} color="#fff" fill="#fff" /> : null}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 13, color: C.sub, fontWeight: 500 }}>Tocá un vaso para registrar.</div>
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

        <SectionTitle right={<Btn kind="ghost" small onClick={() => setTab("dieta")}>Registrar →</Btn>}>Dieta de hoy</SectionTitle>
        <Card style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <MacroBox label="Calorías" value={kcal} goal={state.goals.kcal} unit="kcal" color={C.amber} />
          <MacroBox label="Proteína" value={prot} goal={state.goals.protein} unit="g" color={C.primary} />
          <MacroBox label="Carbos" value={carbs} goal={state.goals.carbs} unit="g" color={C.blue} />
          <MacroBox label="Grasas" value={fat} goal={state.goals.fat} unit="g" color={C.red} />
        </Card>

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
  function Musculos() {
    const muscles = mapSide === "front" ? FRONT_MUSCLES : BACK_MUSCLES;
    const md = muscle ? EXDB[muscle] : null;

    return (
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

  /* ============ DIETA ============ */
  const [newMeal, setNewMeal] = useState({ name: "", kcal: "", protein: "", carbs: "", fat: "" });
  const [saveToLib, setSaveToLib] = useState(false);
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
    const last = weightEntriesAll.slice(-14);
    const vals = last.map(([, v]) => Number(v));
    const min = Math.min(...vals), max = Math.max(...vals);
    const range = max - min || 1;

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
          <div style={{ display: "grid", gap: 8 }}>
            <Input placeholder="Qué comiste (ej: milanesa con ensalada)" value={newMeal.name} onChange={(e) => setNewMeal({ ...newMeal, name: e.target.value })} />
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
              if (!newMeal.name.trim()) return;
              const meal = { ...newMeal, name: newMeal.name.trim() };
              up((s) => {
                s.meals[today] = s.meals[today] || [];
                s.meals[today].push({ id: uid(), ...meal });
                if (saveToLib && !s.mealLibrary.some((x) => x.name === meal.name))
                  s.mealLibrary.push({ id: uid(), ...meal });
                return s;
              });
              setNewMeal({ name: "", kcal: "", protein: "", carbs: "", fat: "" });
              setSaveToLib(false);
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
          <GoalInput label="vasos agua" value={state.goals.water} onChange={(v) => up((s) => { s.goals.water = v; return s; })} />
        </Card>

        <SectionTitle>Peso corporal</SectionTitle>
        <Card>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <Input type="number" placeholder="Tu peso hoy (kg)" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} />
            <Btn onClick={() => {
              const v = Number(newWeight);
              if (!v) return;
              up((s) => { s.weightLog[today] = v; return s; });
              setNewWeight("");
            }}>Guardar</Btn>
          </div>
          {last.length >= 2 ? (
            <>
              <svg viewBox="0 0 300 80" style={{ width: "100%", height: 80 }}>
                <polyline fill="none" stroke={C.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  points={last.map(([, v], i) => {
                    const x = (i / (last.length - 1)) * 290 + 5;
                    const y = 70 - ((Number(v) - min) / range) * 55;
                    return `${x},${y}`;
                  }).join(" ")} />
                {last.map(([, v], i) => {
                  const x = (i / (last.length - 1)) * 290 + 5;
                  const y = 70 - ((Number(v) - min) / range) * 55;
                  return <circle key={i} cx={x} cy={y} r="3" fill={C.primary} />;
                })}
              </svg>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.sub, fontWeight: 600 }}>
                <span>{last[0][0].slice(5)}</span>
                <span style={{ color: C.ink, fontWeight: 800 }}>Último: {last[last.length - 1][1]} kg</span>
                <span>{last[last.length - 1][0].slice(5)}</span>
              </div>
            </>
          ) : (
            <div style={{ fontSize: 13, color: C.sub }}>Registrá tu peso al menos 2 días para ver el gráfico. También se usa en el análisis de fuerza del mapa muscular.</div>
          )}
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

    return (
      <>
        <PageHeader title="Agenda" subtitle="Tu cronograma y el de tu novia" />
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
          {confirmReset ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>¿Seguro? Se borra todo.</span>
              <div style={{ display: "flex", gap: 6 }}>
                <Btn kind="ghost" small onClick={() => setConfirmReset(false)}>Cancelar</Btn>
                <Btn small style={{ background: C.red }} onClick={async () => {
                  setConfirmReset(false);
                  setState(structuredClone(initialState));
                  try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
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
    { id: "agenda", label: "Agenda", Icon: Calendar },
    { id: "hoy", label: "Hoy", Icon: Sun },
    { id: "habitos", label: "Hábitos", Icon: Target },
    { id: "dieta", label: "Dieta", Icon: Salad },
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
                <div style={{
                  padding: "10px 13px", borderRadius: 16, fontSize: 14.5, lineHeight: 1.4, whiteSpace: "pre-wrap", wordBreak: "break-word",
                  background: m.role === "me" ? `linear-gradient(135deg, ${C.primary}, ${C.accent})` : C.card,
                  color: m.role === "me" ? "#fff" : C.ink,
                  border: m.role === "me" ? "none" : `1px solid ${C.line}`,
                  borderBottomRightRadius: m.role === "me" ? 4 : 16,
                  borderBottomLeftRadius: m.role === "me" ? 16 : 4,
                }}>{m.text}</div>
              </div>
            ))}
            {chatBusy && (
              <div style={{ alignSelf: "flex-start", color: C.sub, fontSize: 13, fontWeight: 600, padding: "6px 4px" }}>NEXO está pensando…</div>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, padding: "12px 14px calc(12px + env(safe-area-inset-bottom))", borderTop: `1px solid ${C.line}`, background: C.card }}>
            <Input value={chatInput} placeholder="Escribí un mensaje…" style={{ flex: 1 }}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }} />
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
          {tab === "agenda" && Agenda()}
          {tab === "habitos" && Habitos()}
          {tab === "gym" && Gym()}
          {tab === "dieta" && Dieta()}
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
