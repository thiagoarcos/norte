/* ============ Vamo · lógica de fitness ============
   - Estimador de calorías a partir de texto libre ("2 empanadas y una coca")
   - Plan de running progresivo (+2 km/día cada 15 días)
   - Utilidades de GPS (distancia, ritmo, parciales, trazado)
   - Carga muscular: series semanales por músculo (hipertrofia) y saturación/fatiga
   - Composición corporal: % grasa (Navy), masa magra, músculo estimado
   Todo es estimativo: sirve para orientarse, no reemplaza una balanza ni un nutricionista.
======================================================= */

/* ---------- texto ---------- */
export const norm = (s) =>
  String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/* ---------- base de alimentos ----------
   Cada alimento = una porción típica argentina: g (o ml) de la porción, kcal y macros
   de ESA porción. Si escribís gramos ("200 g de arroz") se escala por g. */
const F = (keys, unit, g, kcal, p, c, f) => ({ keys, unit, g, kcal, p, c, f });
export const FOODS = [
  // carnes y proteínas
  F(["milanesa napolitana", "milanesa a la napolitana"], "unidad", 220, 560, 38, 24, 34),
  F(["milanesa de pollo", "suprema"], "unidad", 150, 340, 30, 16, 17),
  F(["milanesa", "mila"], "unidad", 150, 380, 28, 18, 22),
  F(["bife de chorizo", "bife", "churrasco", "lomo", "carne asada", "carne"], "porción", 200, 440, 56, 0, 24),
  F(["carne picada"], "porción", 150, 360, 30, 0, 26),
  F(["asado", "vacio", "costilla", "matambre"], "porción", 250, 700, 55, 0, 52),
  F(["choripan"], "unidad", 220, 550, 20, 35, 36),
  F(["chorizo", "morcilla"], "unidad", 100, 300, 14, 2, 26),
  F(["pechuga", "pollo a la plancha", "pollo grillado"], "porción", 150, 250, 46, 0, 6),
  F(["pollo", "pata muslo", "pollo al horno"], "porción", 180, 330, 42, 0, 17),
  F(["nuggets", "patitas"], "porción", 100, 290, 14, 18, 18),
  F(["cerdo", "bondiola", "carre"], "porción", 150, 360, 38, 0, 22),
  F(["pescado", "merluza", "filet"], "porción", 150, 150, 30, 0, 2),
  F(["salmon"], "porción", 150, 310, 31, 0, 20),
  F(["atun"], "lata", 120, 150, 30, 0, 2),
  F(["huevo frito"], "unidad", 50, 110, 6, 0, 9),
  F(["huevo", "huevos revueltos", "huevo duro", "clara"], "unidad", 50, 72, 6, 0, 5),
  F(["omelette", "tortilla de papa", "tortilla"], "porción", 150, 300, 12, 20, 19),
  F(["jamon crudo", "jamon cocido", "jamon", "fiambre", "salame"], "2 fetas", 40, 60, 8, 1, 3),
  F(["queso crema", "casancrem", "ricota"], "cucharada", 30, 75, 2, 1, 7),
  F(["queso"], "porción", 30, 110, 7, 0, 9),
  F(["proteina", "whey", "scoop"], "scoop", 30, 120, 24, 3, 2),
  F(["lentejas", "porotos", "garbanzos"], "plato", 200, 260, 18, 40, 2),
  F(["tofu"], "porción", 100, 80, 9, 2, 5),
  // comidas armadas
  F(["empanada", "empanada de carne", "empanada de pollo", "empanada de jamon y queso", "empanada de verdura", "empanada de humita", "empanada de caprese"], "unidad", 90, 260, 10, 25, 13),
  F(["pizza", "porcion de pizza", "fugazzeta", "muzzarella"], "porción", 120, 285, 12, 33, 11),
  F(["hamburguesa", "burger"], "unidad", 220, 520, 28, 40, 27),
  F(["lomito", "lomo completo"], "unidad", 350, 750, 45, 55, 38),
  F(["pancho", "hot dog", "salchicha"], "unidad", 110, 290, 10, 25, 17),
  F(["tostado", "sandwich de jamon y queso", "carlitos"], "unidad", 150, 380, 20, 35, 17),
  F(["sandwich", "sanguche", "wrap"], "unidad", 200, 400, 20, 40, 17),
  F(["tarta", "pascualina", "quiche"], "porción", 150, 380, 11, 30, 24),
  F(["lasagna", "lasaña", "canelones"], "porción", 300, 500, 27, 40, 25),
  F(["ravioles", "sorrentinos", "noquis", "gnocchi"], "plato", 250, 420, 14, 70, 9),
  F(["guiso", "estofado", "locro"], "plato", 350, 470, 25, 45, 19),
  F(["sopa", "caldo"], "plato", 300, 120, 5, 15, 4),
  F(["sushi", "roll", "pieza de sushi"], "pieza", 35, 45, 2, 7, 1),
  F(["arroz con pollo"], "plato", 350, 520, 35, 60, 12),
  F(["fideos con salsa", "fideos con tuco", "spaghetti con salsa"], "plato", 300, 420, 14, 75, 7),
  // guarniciones y carbohidratos
  F(["papas fritas", "papa frita"], "porción", 150, 470, 5, 55, 25),
  F(["pure", "pure de papa"], "porción", 200, 220, 4, 30, 9),
  F(["papa", "papas", "papa al horno", "papa hervida"], "porción", 200, 170, 4, 38, 0),
  F(["batata", "boniato"], "porción", 200, 170, 3, 40, 0),
  F(["arroz"], "plato", 200, 260, 5, 56, 1),
  F(["fideos", "pasta", "spaghetti", "tallarines", "mostachol", "tirabuzones"], "plato", 250, 330, 12, 66, 2),
  F(["quinoa", "cuscus"], "porción", 180, 220, 8, 39, 4),
  F(["choclo"], "unidad", 150, 130, 5, 29, 2),
  F(["pan lactal", "lactal", "pan integral"], "rebanada", 25, 65, 3, 12, 1),
  F(["pan", "pancito", "mignon", "flauta"], "unidad", 50, 135, 4, 27, 1),
  F(["tostada", "galleta de arroz", "grisin"], "unidad", 15, 55, 2, 11, 0),
  F(["medialuna", "factura", "croissant", "vigilante"], "unidad", 50, 180, 3, 20, 10),
  F(["bizcocho", "bizcochito", "chipa"], "unidad", 25, 110, 2, 12, 6),
  F(["avena"], "porción", 40, 150, 5, 27, 3),
  F(["granola"], "porción", 40, 180, 4, 26, 7),
  F(["cereales", "copos", "corn flakes"], "porción", 30, 115, 2, 25, 0),
  F(["galletitas", "galletita", "oreo", "criollitas", "crackers"], "3 unidades", 30, 140, 2, 20, 6),
  // verduras y frutas
  F(["ensalada"], "bowl", 200, 110, 2, 8, 8),
  F(["verduras", "verdura", "vegetales", "zapallo", "zapallito", "berenjena", "espinaca", "acelga"], "porción", 200, 70, 3, 12, 1),
  F(["brocoli", "coliflor"], "porción", 150, 50, 4, 8, 0),
  F(["lechuga", "rucula"], "porción", 50, 8, 1, 1, 0),
  F(["tomate", "zanahoria", "pepino", "morron", "cebolla"], "unidad", 120, 30, 1, 6, 0),
  F(["palta", "aguacate"], "media unidad", 100, 160, 2, 9, 15),
  F(["banana"], "unidad", 120, 105, 1, 27, 0),
  F(["manzana", "pera"], "unidad", 180, 95, 0, 25, 0),
  F(["naranja", "mandarina", "durazno", "kiwi"], "unidad", 150, 65, 1, 15, 0),
  F(["frutillas", "uvas", "arandanos", "fruta"], "taza", 150, 80, 1, 19, 0),
  // lácteos y bebidas
  F(["cafe con leche", "cortado", "lagrima", "capuchino"], "taza", 250, 110, 6, 9, 5),
  F(["leche descremada"], "vaso", 250, 90, 8, 12, 0),
  F(["leche", "chocolatada"], "vaso", 250, 150, 8, 12, 8),
  F(["yogur", "yogurt"], "pote", 190, 160, 6, 26, 3),
  F(["licuado", "batido", "smoothie"], "vaso", 300, 220, 7, 40, 4),
  F(["gaseosa", "coca", "coca cola", "sprite", "fanta", "pepsi"], "vaso", 250, 105, 0, 27, 0),
  F(["coca zero", "gaseosa light", "gaseosa zero", "agua", "soda", "mate", "te", "cafe", "cafe solo", "mate cocido"], "vaso", 250, 2, 0, 0, 0),
  F(["jugo", "exprimido"], "vaso", 250, 110, 1, 26, 0),
  F(["cerveza", "birra"], "vaso", 330, 145, 1, 12, 0),
  F(["fernet", "fernet con coca"], "vaso", 300, 250, 0, 30, 0),
  F(["vino"], "copa", 150, 125, 0, 4, 0),
  F(["gatorade", "powerade", "isotonica"], "botella", 500, 125, 0, 32, 0),
  F(["energizante", "monster", "red bull", "speed"], "lata", 473, 210, 0, 54, 0),
  // dulces, snacks y extras
  F(["alfajor", "alfajores"], "unidad", 55, 250, 3, 34, 11),
  F(["chocolate", "barrita de chocolate"], "barrita", 25, 135, 2, 15, 8),
  F(["helado", "bocha de helado"], "porción", 150, 300, 5, 36, 15),
  F(["torta", "budin", "brownie", "bizcochuelo"], "porción", 100, 350, 5, 48, 16),
  F(["flan", "postre"], "porción", 120, 180, 5, 28, 5),
  F(["dulce de leche", "nutella"], "cucharada", 20, 63, 1, 11, 2),
  F(["mermelada", "miel"], "cucharada", 20, 55, 0, 14, 0),
  F(["azucar"], "cucharadita", 5, 20, 0, 5, 0),
  F(["manteca", "mantequilla"], "porción", 10, 72, 0, 0, 8),
  F(["aceite", "aceite de oliva"], "cucharada", 10, 88, 0, 0, 10),
  F(["mayonesa", "salsa golf"], "cucharada", 15, 100, 0, 1, 11),
  F(["ketchup", "mostaza", "salsa"], "cucharada", 15, 15, 0, 3, 0),
  F(["mani", "nueces", "almendras", "frutos secos", "castanas"], "puñado", 30, 180, 6, 6, 15),
  F(["papas de paquete", "chizitos", "palitos", "snack"], "bolsita", 40, 210, 3, 22, 13),
  F(["barrita de cereal", "barra de cereal"], "unidad", 25, 100, 1, 18, 3),
  F(["barrita proteica", "barra proteica"], "unidad", 50, 200, 20, 18, 6),
];

const WORD_NUM = { un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, diez: 10, media: 0.5, medio: 0.5, doble: 2 };
const CONTAINERS = "porcion|porciones|plato|platos|vaso|vasos|taza|tazas|unidad|unidades|feta|fetas|cucharada|cucharadas|cucharadita|cucharaditas|lata|latas|pote|potes|rodaja|rodajas|pedazo|pedazos|bocha|bochas|copa|copas|botella|botellas|pieza|piezas|punado|punados|bowl|bol|scoop|scoops|rebanada|rebanadas";
const QTY_RE = new RegExp(
  `(?<![a-z0-9])(\\d+(?:[.,]\\d+)?|${Object.keys(WORD_NUM).join("|")})\\s*(kg|gramos|grs|gr|g|ml|cc|litros|litro|l)?\\s*(?:de\\s+)?(?:(?:${CONTAINERS})\\s+(?:de\\s+)?)?(?:la\\s+|el\\s+|los\\s+|las\\s+)?$`
);
const STOP = new Set("con de y la el los las un una unos unas al a en mas sin poco poca mucho mucha porcion porciones plato platos vaso vasos taza tazas unidad unidades grande grandes chico chica chicos chicas mediano mediana comi desayune almorce cene merende tome hoy media medio dos tres cuatro cinco seis gramos gr grs kg ml cc".split(" "));

const KEY_INDEX = FOODS.flatMap((food) => food.keys.map((k) => ({ key: norm(k), food })))
  .sort((a, b) => b.key.length - a.key.length);

/* Estima kcal y macros de un texto. Devuelve { items, total, unknown }. */
export function estimateFood(text) {
  let t = " " + norm(text).replace(/[^a-z0-9.,\s]/g, " ").replace(/\s+/g, " ") + " ";
  const items = [];
  for (const { key, food } of KEY_INDEX) {
    // cada palabra admite plural ("empanadas de carne" ↔ "empanada de carne")
    const pat = key.split(" ").map((w) => (w.length > 2 ? `${w}(?:s|es)?` : w)).join("\\s+");
    const re = new RegExp(`(^|[^a-z])(${pat})(?=[^a-z]|$)`, "g");
    let m;
    while ((m = re.exec(t))) {
      const start = m.index + m[1].length;
      const end = start + m[2].length;
      const before = t.slice(Math.max(0, start - 28), start);
      const after = t.slice(end, end + 14);
      const q = before.match(QTY_RE);
      let factor = 1, label = `1 ${food.unit}`;
      if (q) {
        const n = WORD_NUM[q[1]] ?? Number(q[1].replace(",", "."));
        const u = q[2];
        if (u && n > 0) {
          const grams = u === "kg" ? n * 1000 : u.startsWith("l") ? n * 1000 : n;
          factor = grams / food.g;
          label = `${Math.round(grams)} ${u === "ml" || u === "cc" || u.startsWith("l") ? "ml" : "g"}`;
        } else if (n > 0) {
          factor = n;
          label = `${n} ${food.unit}`;
        }
      }
      if (/^\s*(grande|grandes|doble|abundante)/.test(after)) { factor *= 1.4; label += " (grande)"; }
      else if (/^\s*(chic[oa]s?|pequen[oa]s?|mini)/.test(after)) { factor *= 0.7; label += " (chico)"; }
      items.push({
        name: food.keys[0], label,
        kcal: Math.round(food.kcal * factor), protein: Math.round(food.p * factor),
        carbs: Math.round(food.c * factor), fat: Math.round(food.f * factor),
      });
      // consumimos el texto (alimento + cantidad) para no contarlo dos veces
      const qStart = q ? start - q[0].length : start;
      t = t.slice(0, qStart) + " ".repeat(end - qStart) + t.slice(end);
      re.lastIndex = end;
    }
  }
  const unknown = t.split(" ").filter((w) => w.length > 2 && !STOP.has(w) && !/^\d/.test(w));
  const total = items.reduce((a, i) => ({
    kcal: a.kcal + i.kcal, protein: a.protein + i.protein, carbs: a.carbs + i.carbs, fat: a.fat + i.fat,
  }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });
  return { items, total, unknown: [...new Set(unknown)] };
}

/* ---------- plan de running ----------
   Arranca en `startKm` por día y suma `stepKm` cada `everyDays` (15 = quincenal). */
export const RUN_DEFAULTS = { startKm: 2, stepKm: 2, everyDays: 15, maxKm: 0 };

export function runTargetKm(plan, dateKey) {
  if (!plan || !plan.startDate) return 0;
  const p = { ...RUN_DEFAULTS, ...plan };
  const days = Math.max(0, Math.floor((new Date(dateKey + "T00:00:00") - new Date(p.startDate + "T00:00:00")) / 86400000));
  const level = Math.floor(days / p.everyDays);
  const km = Number(p.startKm) + level * Number(p.stepKm);
  return p.maxKm > 0 ? Math.min(km, Number(p.maxKm)) : km;
}

export function runLevelInfo(plan, dateKey) {
  const p = { ...RUN_DEFAULTS, ...plan };
  const days = Math.max(0, Math.floor((new Date(dateKey + "T00:00:00") - new Date(p.startDate + "T00:00:00")) / 86400000));
  const level = Math.floor(days / p.everyDays);
  const daysLeft = p.everyDays - (days % p.everyDays);
  const next = new Date(dateKey + "T00:00:00");
  next.setDate(next.getDate() + daysLeft);
  return { level: level + 1, daysLeft, nextKm: runTargetKm(p, dstrLocal(next)) };
}

const dstrLocal = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/* ---------- GPS ---------- */
export function haversineKm(a, b) {
  const R = 6371;
  const rad = (x) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/* ¿Aceptamos este punto? Filtra lecturas imprecisas y saltos imposibles (>30 km/h). */
export function acceptPoint(prev, pt) {
  if (pt.acc && pt.acc > 35) return false;
  if (!prev) return true;
  const d = haversineKm(prev, pt);
  if (d < 0.004) return false; // <4 m: ruido de GPS parado
  const dt = (pt.t - prev.t) / 3600000;
  if (dt > 0 && d / dt > 30) return false;
  return true;
}

export const fmtPace = (secPerKm) => {
  if (!secPerKm || !Number.isFinite(secPerKm) || secPerKm > 3600) return "–:––";
  const s = Math.round(secPerKm);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};
export const fmtDur = (sec) => {
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}` : `${m}:${String(r).padStart(2, "0")}`;
};

/* Parciales por km a partir de puntos con t (ms) y la distancia acumulada `d` (km). */
export function computeSplits(points) {
  const splits = [];
  let nextKm = 1, lastT = points.length ? points[0].t : 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    while (b.d >= nextKm && a.d < nextKm) {
      const f = (nextKm - a.d) / (b.d - a.d || 1);
      const tAt = a.t + f * (b.t - a.t);
      splits.push(Math.round((tAt - lastT) / 1000));
      lastT = tAt;
      nextKm++;
    }
  }
  return splits;
}

/* Achica la lista de puntos para guardar (localStorage es chico). */
export function downsample(points, max = 400) {
  if (points.length <= max) return points;
  const step = points.length / max;
  const out = [];
  for (let i = 0; i < max; i++) out.push(points[Math.floor(i * step)]);
  out.push(points[points.length - 1]);
  return out;
}

/* kcal de correr ≈ 1 kcal × kg × km (regla clásica, independiente del ritmo). */
export const runKcal = (km, kg) => Math.round(km * (kg || 70) * 1.0);

/* ---------- carga muscular ----------
   Reglas: regex sobre el nombre del ejercicio → músculos con peso (1 = principal, 0.3–0.6 = secundario). */
const MR = (re, muscles, not) => ({ re, muscles, not });
const MUSCLE_RULES = [
  MR(/peso muerto rumano|rumano|rdl|stiff|hiperextension/, { isquios: 1, gluteos: 0.6, lumbar: 0.5 }),
  MR(/peso muerto/, { isquios: 0.6, gluteos: 0.6, lumbar: 0.6, espalda: 0.5, trapecio: 0.3, cuadriceps: 0.3 }, /rumano/),
  MR(/sentadilla|squat|hack|prensa/, { cuadriceps: 1, gluteos: 0.5, aductores: 0.3 }),
  MR(/bulgar|zancada|estocada|lunge|step ?up/, { cuadriceps: 1, gluteos: 0.7, aductores: 0.3 }),
  MR(/extension(es)? de cuadriceps|sillon de cuadriceps|cuadriceps/, { cuadriceps: 1 }),
  MR(/curl femoral|femoral|isquio/, { isquios: 1 }, /rumano|hiperextension/),
  MR(/hip thrust|puente de gluteo|gluteo|patada de gluteo/, { gluteos: 1, isquios: 0.3 }, /hiperextension|isquio/),
  MR(/gemelo|pantorrilla|calf|soleo/, { gemelos: 1 }),
  MR(/aductor|abductor/, { aductores: 1 }),
  MR(/kaz press/, { triceps: 1, pecho: 0.5 }),
  MR(/press (de )?banca|press (de )?pecho|press inclinado|press declinado|peck ?fly|pec ?deck(?! posterior)|apertura|cruce de poleas|fondos|flexiones|chest/, { pecho: 1, triceps: 0.5, hombros: 0.4 }, /posterior|vuelos posteriores/),
  MR(/press militar|press de hombro|press arnold|press hombro|overhead/, { hombros: 1, triceps: 0.5 }),
  MR(/vuelos laterales|elevacion(es)? lateral|laterales/, { hombros: 1 }),
  MR(/vuelos posteriores|posterior|face ?pull|pajaro/, { hombros: 0.7, trapecio: 0.4, espalda: 0.3 }),
  MR(/jalon|dominada|pull ?down|pull ?up|chin ?up/, { espalda: 1, biceps: 0.4 }),
  MR(/remo/, { espalda: 1, trapecio: 0.4, biceps: 0.3 }),
  MR(/pullover/, { espalda: 1 }),
  MR(/espalda alta/, { trapecio: 0.5 }),
  MR(/encogimiento|shrug|trapecio/, { trapecio: 1 }),
  MR(/curl martillo|martillo/, { biceps: 1, antebrazos: 0.6 }),
  MR(/curl|biceps/, { biceps: 1, antebrazos: 0.3 }, /femoral|martillo/),
  MR(/press frances|katana|extension lateral de codo|extension (de|con|en) (triceps|soga|polea)|triceps|patada de triceps|copa/, { triceps: 1 }),
  MR(/crunch|abdominal|plancha|elevacion(es)? de piernas|rueda abdominal|ab ?wheel/, { abdomen: 1, oblicuos: 0.3 }),
  MR(/oblicuo|rusos|lenador|pallof/, { oblicuos: 1, abdomen: 0.4 }),
  MR(/antebrazo|muneca|farmer/, { antebrazos: 1 }),
  MR(/lumbar|buenos dias/, { lumbar: 1 }),
];

export const MUSCLE_KEYS = ["pecho", "espalda", "hombros", "biceps", "triceps", "antebrazos", "trapecio", "abdomen", "oblicuos", "cuadriceps", "isquios", "gluteos", "aductores", "gemelos", "lumbar"];

export function musclesFor(name) {
  const n = norm(name);
  if (/movilidad|movimientos dinamicos|calentamiento|estiramiento/.test(n)) return {};
  const out = {};
  for (const r of MUSCLE_RULES) {
    if (r.re.test(n) && !(r.not && r.not.test(n))) {
      for (const [m, w] of Object.entries(r.muscles)) out[m] = Math.max(out[m] || 0, w);
    }
  }
  return out;
}

/* Series de trabajo de una entrada: las cargadas con reps, o "3x8" del nombre, o setsCount. */
export function workSetsOf(entry) {
  if (entry.workSets > 0) return entry.workSets;
  const matches = [...norm(entry.name).matchAll(/(\d+)\s*x\s*\d+/g)];
  if (matches.length) return matches.reduce((a, m) => a + Number(m[1]), 0);
  return Math.min(entry.setsCount || 3, 4);
}

/* Landmarks de volumen semanal (series/semana): MEV, rango óptimo (MAV) y MRV. */
export const VOLUME = { mev: 8, mavLo: 12, mavHi: 20, mrv: 24 };

/* Series semanales por músculo para los 7 días que terminan en `endKey`. */
export function weeklySets(sessionLog, endKey, offsetWeeks = 0) {
  const end = new Date(endKey + "T00:00:00");
  end.setDate(end.getDate() - offsetWeeks * 7);
  const out = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(end); d.setDate(end.getDate() - i);
    for (const e of sessionLog[dstrLocal(d)] || []) {
      const sets = workSetsOf(e);
      for (const [m, w] of Object.entries(musclesFor(e.name))) out[m] = (out[m] || 0) + sets * w;
    }
  }
  return out;
}

/* Series semanales planeadas por la rutina (una semana del programa). */
export function plannedSets(week) {
  const out = {};
  for (const day of week?.days || []) {
    for (const ex of day.exercises || []) {
      const sets = workSetsOf({ name: ex.name, setsCount: 3 });
      for (const [m, w] of Object.entries(musclesFor(ex.name))) out[m] = (out[m] || 0) + sets * w;
    }
  }
  return out;
}

/* Saturación (fatiga residual) 0–1 por músculo: cada serie decae exponencialmente
   (τ = 36 h → a las 48 h queda ~26 %). 1 = ~12 series efectivas recién hechas.
   El running suma fatiga a piernas (≈ 1 serie de cuádriceps por cada 2 km). */
export function saturation(sessionLog, runs, now = new Date()) {
  const fat = {};
  const add = (m, v) => { fat[m] = (fat[m] || 0) + v; };
  for (let i = 0; i < 6; i++) {
    const d = new Date(now); d.setDate(now.getDate() - i);
    const key = dstrLocal(d);
    const at = new Date(key + "T19:00:00");
    const hours = Math.max(0, (now - at) / 3600000);
    const decay = Math.exp(-hours / 36);
    for (const e of sessionLog[key] || []) {
      const sets = workSetsOf(e);
      for (const [m, w] of Object.entries(musclesFor(e.name))) add(m, sets * w * decay);
    }
    const km = (runs || []).filter((r) => r.date === key).reduce((a, r) => a + (r.km || 0), 0);
    if (km) {
      add("cuadriceps", (km / 2) * decay);
      add("gemelos", (km / 2) * decay);
      add("isquios", (km / 4) * decay);
      add("gluteos", (km / 4) * decay);
    }
  }
  const out = {};
  for (const m of MUSCLE_KEYS) out[m] = Math.min(1, (fat[m] || 0) / 12);
  return out;
}

/* ---------- composición corporal ----------
   % grasa por el método de la Marina de EE.UU. (cinta métrica). cm. */
export function navyBodyFat({ sex, height, waist, neck, hip }) {
  const h = Number(height), w = Number(waist), n = Number(neck), hp = Number(hip);
  if (!h || !w || !n) return null;
  let bf;
  if (sex === "f") {
    if (!hp || w + hp - n <= 0) return null;
    bf = 495 / (1.29579 - 0.35004 * Math.log10(w + hp - n) + 0.221 * Math.log10(h)) - 450;
  } else {
    if (w - n <= 0) return null;
    bf = 495 / (1.0324 - 0.19077 * Math.log10(w - n) + 0.15456 * Math.log10(h)) - 450;
  }
  return Number.isFinite(bf) && bf > 2 && bf < 60 ? Math.round(bf * 10) / 10 : null;
}

/* Desglose de una pesada: grasa, masa magra y músculo esquelético (estimado ≈ 53 % de la
   masa magra si no viene de una balanza de bioimpedancia). */
export function composition(weight, bf, musclePct) {
  const w = Number(weight) || 0;
  if (!w || !bf) return null;
  const fatKg = (w * bf) / 100;
  const leanKg = w - fatKg;
  const muscleKg = musclePct ? (w * musclePct) / 100 : leanKg * 0.53;
  return {
    fatKg: Math.round(fatKg * 10) / 10,
    leanKg: Math.round(leanKg * 10) / 10,
    muscleKg: Math.round(muscleKg * 10) / 10,
    musclePct: Math.round((muscleKg / w) * 1000) / 10,
    muscleEstimated: !musclePct,
  };
}

/* Agrupa un log { fecha: valor } por mes → [{ ym, avg, first, last, n }]. */
export function monthly(log) {
  const by = {};
  for (const [d, v] of Object.entries(log || {}).sort((a, b) => a[0].localeCompare(b[0]))) {
    const num = Number(v);
    if (!num) continue;
    const ym = d.slice(0, 7);
    (by[ym] = by[ym] || []).push(num);
  }
  return Object.entries(by).map(([ym, vals]) => ({
    ym, n: vals.length,
    avg: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10,
    first: vals[0], last: vals[vals.length - 1],
  }));
}

/* ---------- ayuno ----------
   Cada ventana = { id, days: [0..6], start: "HH:MM", end: "HH:MM" }: el ayuno EMPIEZA a `start`
   en cada día marcado y termina a `end` (al día siguiente si end <= start). */
export function fastIntervals(windows, now = new Date(), from = -1, to = 8) {
  const out = [];
  for (let i = from; i <= to; i++) {
    const d = new Date(now); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + i);
    for (const w of windows || []) {
      if (!w.start || !w.end || !(w.days || []).includes(d.getDay())) continue;
      const [sh, sm] = w.start.split(":").map(Number);
      const [eh, em] = w.end.split(":").map(Number);
      const start = new Date(d); start.setHours(sh || 0, sm || 0, 0, 0);
      const end = new Date(d); end.setHours(eh || 0, em || 0, 0, 0);
      if (end <= start) end.setDate(end.getDate() + 1);
      out.push({ w, start, end });
    }
  }
  return out.sort((a, b) => a.start - b.start);
}

export function fastStatus(windows, now = new Date()) {
  const iv = fastIntervals(windows, now);
  const active = iv.find((x) => x.start <= now && now < x.end) || null;
  const next = iv.find((x) => x.start > now) || null;
  return { active, next };
}

export const fastHours = (w) => {
  const [sh, sm] = w.start.split(":").map(Number), [eh, em] = w.end.split(":").map(Number);
  let m = eh * 60 + em - (sh * 60 + sm);
  if (m <= 0) m += 1440;
  return Math.round((m / 60) * 10) / 10;
};
