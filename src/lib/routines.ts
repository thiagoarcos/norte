/* Plantillas de rutina para arrancar rápido, en el formato de programa de NORTE
   (semanas → días → ejercicios con series de peso/reps/RIR). Después se editan a gusto. */
import { uid } from '@/lib/norteData';

type Tpl = { id: string; name: string; desc: string; days: [string, [string, number, string][]][] };

export const TEMPLATES: Tpl[] = [
  {
    id: 'ppl', name: 'Push / Pull / Piernas', desc: '3 días (o 6 repitiendo). El clásico para ganar músculo.',
    days: [
      ['Push · pecho, hombro y tríceps', [['Press banca', 4, '6-8'], ['Press inclinado con mancuernas', 3, '8-10'], ['Press militar', 3, '8-10'], ['Vuelos laterales', 3, '12-15'], ['Extensión de tríceps en polea', 3, '10-12']]],
      ['Pull · espalda y bíceps', [['Dominadas', 4, '6-10'], ['Remo con barra', 3, '8-10'], ['Jalón al pecho', 3, '10-12'], ['Face pull', 3, '12-15'], ['Curl de bíceps', 3, '10-12']]],
      ['Piernas', [['Sentadilla', 4, '5-8'], ['Peso muerto rumano', 3, '8-10'], ['Prensa', 3, '10-12'], ['Curl femoral', 3, '10-12'], ['Gemelos', 4, '12-15']]],
    ],
  },
  {
    id: 'ul', name: 'Torso / Pierna', desc: '4 días. Cada músculo 2 veces por semana.',
    days: [
      ['Torso A', [['Press banca', 4, '5-8'], ['Remo con barra', 4, '6-8'], ['Press militar', 3, '8-10'], ['Jalón al pecho', 3, '10-12'], ['Curl de bíceps', 2, '10-12'], ['Press francés', 2, '10-12']]],
      ['Pierna A', [['Sentadilla', 4, '5-8'], ['Peso muerto rumano', 3, '8-10'], ['Extensión de cuádriceps', 3, '12-15'], ['Gemelos', 4, '12-15'], ['Crunch en polea', 3, '12-15']]],
      ['Torso B', [['Press inclinado con mancuernas', 4, '8-10'], ['Dominadas', 4, '6-10'], ['Vuelos laterales', 4, '12-15'], ['Remo en T', 3, '8-10'], ['Fondos', 3, '8-12']]],
      ['Pierna B', [['Peso muerto', 3, '4-6'], ['Búlgaras', 3, '8-10'], ['Hip thrust', 3, '8-12'], ['Curl femoral', 3, '10-12'], ['Plancha', 3, '45s']]],
    ],
  },
  {
    id: 'fb', name: 'Full body', desc: '3 días. Ideal si recién arrancás o tenés poco tiempo.',
    days: [
      ['Full body A', [['Sentadilla', 3, '6-8'], ['Press banca', 3, '6-8'], ['Remo con barra', 3, '8-10'], ['Vuelos laterales', 2, '12-15'], ['Plancha', 3, '40s']]],
      ['Full body B', [['Peso muerto rumano', 3, '8-10'], ['Press militar', 3, '8-10'], ['Jalón al pecho', 3, '10-12'], ['Zancadas', 2, '10-12'], ['Curl de bíceps', 2, '10-12']]],
      ['Full body C', [['Prensa', 3, '10-12'], ['Press inclinado con mancuernas', 3, '8-10'], ['Dominadas', 3, '6-10'], ['Hip thrust', 3, '8-12'], ['Extensión de tríceps en polea', 2, '10-12']]],
    ],
  },
];

const emptySets = (n: number) => Array.from({ length: n }, () => ({ weight: '', reps: '', rir: '' }));

/* Programa de 4 semanas con la plantilla (cada semana igual, para cargar la progresión). */
export function programFromTemplate(id: string, weeks = 4) {
  const t = TEMPLATES.find((x) => x.id === id) ?? TEMPLATES[0];
  return {
    weeks: Array.from({ length: weeks }, () => ({
      days: t.days.map(([name, exs]) => ({
        name, notes: '',
        exercises: exs.map(([n, sets, reps]) => ({ id: uid(), name: `${n} ${sets}x${reps}`, intensity: '', rest: '', sets: emptySets(sets) })),
      })),
    })),
  };
}

export function emptyProgram(days = 3, weeks = 4) {
  return { weeks: Array.from({ length: weeks }, () => ({ days: Array.from({ length: days }, () => ({ name: '', notes: '', exercises: [] })) })) };
}
