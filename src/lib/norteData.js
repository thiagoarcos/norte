/* Datos y utilidades de NORTE (copiados tal cual de la PWA): tips, Plan Cut, base de
   ejercicios por músculo con técnica, análisis de fuerza, importador de rutinas .xlsx y
   formato de plata. */

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
async function parseRoutineWorkbook(buf) {
  const XLSX = await import("xlsx");
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


export {
  DAYS, DAY_NAMES, MONTHS, EMOJIS, TIPS, CUT_VIDEO_URL, CUT_PHASES, CUT_TIPS, EXDB, FRONT_MUSCLES, BACK_MUSCLES, dstr, dayOfYear, lastNDays, uid, fmtDate, ytLink, fmtClock, hm2min, analyzeLift, tonnage, parseRoutineWorkbook, parseMoney, INGRESO_CATS, ymLabel, shiftYm, fmtMoney,
};
