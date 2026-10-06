/* ============ BONUS · Previa de Geografía (2° año) ============
   Una lección por día desde BONUS_START hasta el día antes del examen: una lectura corta
   y un ejercicio de análisis (consigna + guía de corrección para autoevaluarse).
   `tema` = índice (0-based) del tema en el checklist de la materia "sub-geo2"; al terminar
   el ejercicio se tilda ese tema. Los integradores/simulacros no tienen tema (null).
   Datos: INDEC (Censo 2022), IGN, USGS, leyes nacionales citadas en cada lección. */

export const BONUS_SUBJECT_ID = "sub-geo2";
export const BONUS_START = "2026-10-05";

export const BONUS_LESSONS = [
  /* ---------------- UNIDAD 1 ---------------- */
  {
    id: "geo-01", unidad: "U1", tema: 0,
    titulo: "América: ubicación, límites y formas de dividirla",
    lectura: [
      "América es el segundo continente más grande del planeta: ocupa unos 42 millones de km² y se extiende desde el océano Glacial Ártico (más de 70° de latitud norte) hasta el cabo de Hornos (56° sur). Es el continente con mayor extensión en sentido norte-sur, por eso tiene casi todos los climas del mundo.",
      "Sus límites son naturales: al norte el océano Glacial Ártico, al este el océano Atlántico, al oeste el océano Pacífico y al sur el pasaje de Drake, que lo separa de la Antártida. Está entero en el hemisferio occidental y lo cruzan el ecuador y los dos trópicos.",
      "Hay dos maneras de dividirlo. La división estructural (o física) mira el relieve y la forma del territorio: América del Norte, América Central (el istmo más las islas del Caribe o Antillas) y América del Sur. El istmo de Panamá es el punto de unión.",
      "La división socio-cultural mira la historia, el idioma y la colonización: América Anglosajona (Estados Unidos y Canadá, colonizados sobre todo por ingleses) y América Latina (desde México hacia el sur, colonizada por españoles, portugueses y franceses, con lenguas derivadas del latín). Por eso México es América del Norte en lo físico pero América Latina en lo cultural.",
      "Ninguna división es «la verdadera»: cada una responde a una pregunta distinta. La estructural sirve para estudiar relieve y climas; la socio-cultural, para entender desigualdades económicas, idiomas y relaciones de poder entre países.",
    ],
    claves: [
      "≈42 millones de km², del Ártico al cabo de Hornos",
      "Límites: Ártico (N), Atlántico (E), Pacífico (O), pasaje de Drake (S)",
      "Estructural: Norte / Central / Sur — Socio-cultural: Anglosajona / Latina",
      "México: Norte en lo físico, Latina en lo cultural",
    ],
    ejercicio: {
      consigna: "Un compañero dice: «México está en América del Norte, así que tiene que tener una economía parecida a la de Estados Unidos y Canadá». (a) Explicá por qué el razonamiento es incorrecto usando las dos divisiones de América. (b) Nombrá otro país cuya ubicación cambie según el criterio que uses y justificá. (c) ¿Qué criterio usarías para estudiar por qué Haití es mucho más pobre que Canadá? Argumentá.",
      guia: [
        "Distingue la división estructural (relieve/forma) de la socio-cultural (historia, colonización, idioma).",
        "Explica que estar en el mismo bloque físico no implica el mismo desarrollo: México comparte con América Latina un pasado colonial español y una economía dependiente.",
        "(b) Ejemplos válidos: Guatemala, Panamá o Cuba (Central en lo físico, Latina en lo cultural); también Belice o Guyana como casos especiales por su colonización inglesa.",
        "(c) Elige el socio-cultural y lo justifica con colonización (francesa en Haití, inglesa en Canadá), esclavitud, deuda y dependencia económica.",
        "Responde las tres partes con oraciones completas, no con una sola palabra.",
      ],
    },
  },
  {
    id: "geo-02", unidad: "U1", tema: 1,
    titulo: "Cómo se armaron los territorios: originarios, coloniales y estatales",
    lectura: [
      "Los territorios de América se fueron construyendo en tres grandes etapas, y cada una dejó marcas que todavía se ven.",
      "1) Territorios de los pueblos originarios. Antes de 1492 había sociedades muy distintas: imperios con ciudades y caminos (aztecas en México, mayas en Centroamérica, incas en los Andes, con el Qhapaq Ñan que llegaba hasta el noroeste argentino) y pueblos cazadores-recolectores o agricultores (guaraníes, mapuches, tehuelches, qom, wichís). Organizaban el espacio según sus recursos y su forma de vida, sin fronteras fijas como las actuales.",
      "2) Territorios coloniales. España y Portugal se repartieron el continente con el Tratado de Tordesillas (1494). España lo organizó en virreinatos: Nueva España (1535), Perú (1542), Nueva Granada (1717) y Río de la Plata (1776, con capital en Buenos Aires). La economía colonial era extractiva: la plata de Potosí, por ejemplo, salía hacia Europa. Se impusieron ciudades, caminos y puertos pensados para sacar recursos, no para conectar a la población local.",
      "3) Territorios estatales. Entre 1804 (Haití) y fines del siglo XIX los países se independizaron y armaron sus Estados nacionales. Las fronteras se definieron con tratados, arbitrajes y también guerras: la Guerra de la Triple Alianza contra Paraguay (1864-1870) o la Guerra del Pacífico (1879-1884), en la que Bolivia perdió su salida al mar.",
      "Un Estado necesita territorio, población, gobierno y soberanía. Construirlo implicó ocupar tierras, muchas veces a costa de los pueblos originarios, que hoy reclaman el reconocimiento de sus territorios.",
    ],
    claves: [
      "Originario → colonial → estatal",
      "Tordesillas 1494; virreinato del Río de la Plata 1776",
      "Economía colonial extractiva (Potosí)",
      "Fronteras estatales: tratados, arbitrajes y guerras",
    ],
    ejercicio: {
      consigna: "Bolivia no tiene salida al mar y la economía de Potosí fue la más rica de América en el siglo XVII. (a) Explicá qué rol cumplió Potosí en el territorio colonial y hacia dónde iban sus riquezas. (b) Explicá cómo y cuándo Bolivia perdió su costa. (c) Relacioná las dos cosas: ¿por qué un territorio que fue tan rico es hoy uno de los países con menos ingresos de Sudamérica? Usá al menos dos de las tres etapas de conformación territorial.",
      guia: [
        "(a) Potosí: centro minero de plata del virreinato del Perú y luego del Río de la Plata; la plata salía hacia España (economía extractiva, la riqueza no quedaba en el lugar).",
        "(b) Guerra del Pacífico (1879-1884) contra Chile: Bolivia pierde el litoral de Antofagasta.",
        "(c) Conecta la herencia colonial extractiva con la etapa estatal: dependencia de la exportación de materias primas, mediterraneidad que encarece el comercio, pérdida de recursos (salitre, cobre).",
        "Usa vocabulario de la unidad: territorio colonial, Estado, soberanía, frontera, extractivismo.",
      ],
    },
  },
  {
    id: "geo-03", unidad: "U1", tema: 2,
    titulo: "Argentina: ubicación, límites y formación del Estado",
    lectura: [
      "Argentina está en el sur de América del Sur, en los hemisferios sur y occidental. Es un país bicontinental: tiene 2.791.810 km² en el continente americano y reclama 969.464 km² en la Antártida, lo que da un total de 3.761.274 km². Por superficie continental es el octavo país más grande del mundo.",
      "Su posición tiene ventajas y desventajas: tiene una salida enorme al océano Atlántico (Mar Argentino) y está lejos de los grandes centros económicos del hemisferio norte, lo que encarece el comercio. Como se extiende mucho en latitud (del trópico de Capricornio hasta los 55° sur), tiene climas muy variados.",
      "Limita con cinco países: Chile (al oeste, el límite más largo, unos 5.300 km sobre la cordillera de los Andes), Bolivia y Paraguay (al norte), Brasil y Uruguay (al noreste y este, en buena parte por ríos). En total son unos 9.376 km de fronteras con países y unos 5.117 km de litoral sobre el Río de la Plata y el Mar Argentino. Además, mantiene el reclamo de soberanía sobre las islas Malvinas, Georgias y Sandwich del Sur.",
      "Formación del Estado: después de la Revolución de Mayo (1810) y la independencia (1816) hubo décadas de guerras civiles. Recién con la Constitución de 1853 y la unificación con Buenos Aires (1862) se consolidó el Estado nacional. Entre 1878 y 1885 las campañas militares (la llamada «Conquista del Desierto» en la Patagonia y las del Chaco) ocuparon territorios de pueblos originarios. En 1884 se crearon los Territorios Nacionales, que se fueron convirtiendo en provincias sobre todo en la década de 1950.",
      "Poblamiento: entre 1870 y 1930 llegaron millones de inmigrantes europeos (sobre todo italianos y españoles) atraídos por el modelo agroexportador. El ferrocarril, con forma de abanico que converge en el puerto de Buenos Aires, orientó el poblamiento hacia la región pampeana y explica en parte por qué la población está tan concentrada.",
    ],
    claves: [
      "Bicontinental: 2.791.810 km² americanos + 969.464 km² antárticos",
      "5 países limítrofes; el límite más largo es con Chile",
      "Estado: 1853 Constitución, 1862 unificación, 1884 Territorios Nacionales",
      "Inmigración 1870-1930 + ferrocarril en abanico → concentración pampeana",
    ],
    ejercicio: {
      consigna: "Una empresa quiere exportar vino desde Mendoza a Europa. (a) Usando la ubicación de Argentina, explicá una ventaja y una desventaja que tiene para ese comercio. (b) Explicá por qué la mayoría de las exportaciones salen por la zona Rosario-Buenos Aires y no por un puerto patagónico, relacionándolo con la red ferroviaria del modelo agroexportador. (c) Un turista dice que «Argentina siempre tuvo los límites que tiene hoy». Refutalo con dos hechos con fecha.",
      guia: [
        "(a) Ventaja: salida al Atlántico, litoral extenso. Desventaja: lejanía de los centros del hemisferio norte, costo de flete; o cruzar los Andes si fuese por Chile.",
        "(b) Ferrocarril en abanico convergente en Buenos Aires (capital británico, modelo agroexportador 1870-1930), concentración de puertos, población e infraestructura en la región pampeana.",
        "(c) Hechos válidos: campañas militares 1878-1885 sobre territorios originarios; Territorios Nacionales 1884 y provincialización en 1950s; definición de límites con Chile (Tratado de 1881, laudo de 1902) o cuestión Malvinas.",
        "Responde con relaciones causa-consecuencia, no solo con datos sueltos.",
      ],
    },
  },
  {
    id: "geo-04", unidad: "U1", tema: 3,
    titulo: "Relieve de América y de Argentina",
    lectura: [
      "El relieve de América tiene una estructura bastante simple: al oeste, montañas jóvenes y altas (Montañas Rocosas en el norte, Sierra Madre en México y cordillera de los Andes en el sur); al este, macizos antiguos y desgastados (los Apalaches, el macizo de las Guayanas, el macizo de Brasilia); y en el medio, grandes llanuras (Llanura Central de EE. UU., llanuras del Amazonas, del Orinoco y Chaco-Pampeana).",
      "Las montañas del oeste son jóvenes porque están en el borde de las placas tectónicas: la placa de Nazca se mete debajo de la placa Sudamericana (subducción). Por eso hay volcanes y terremotos en Chile, Perú y el oeste argentino (San Juan y Mendoza son zonas de alta sismicidad).",
      "En Argentina se distinguen: la cordillera de los Andes, con el Aconcagua (6.961 m), el pico más alto de América; la Puna, una meseta de altura (más de 3.500 m) en Jujuy, Salta y Catamarca; las Sierras Subandinas y las Sierras Pampeanas (Córdoba, San Luis, La Rioja); la llanura Chaco-Pampeana, muy plana y con los mejores suelos; la Mesopotamia (Misiones, Corrientes, Entre Ríos), con lomadas y la meseta misionera; la meseta Patagónica, escalonada y árida; y los sistemas de Tandilia y Ventania en Buenos Aires, de los más antiguos del país.",
      "El punto más bajo de América también está en Argentina: la laguna del Carbón, en Santa Cruz, a 105 m bajo el nivel del mar.",
      "El relieve no es solo «paisaje»: condiciona dónde vive la gente, por dónde pasan rutas y ferrocarriles, qué se cultiva y qué riesgos hay (sismos, aludes, inundaciones en llanuras).",
    ],
    claves: [
      "Oeste joven y alto / Este antiguo y bajo / Centro de llanuras",
      "Subducción de Nazca → volcanes y sismos",
      "Aconcagua 6.961 m (techo de América); laguna del Carbón −105 m",
      "Unidades: Andes, Puna, Sierras, llanura Chaco-Pampeana, Mesopotamia, Patagonia",
    ],
    ejercicio: {
      consigna: "(a) Explicá por qué en San Juan hay terremotos fuertes (como el de 1944, que destruyó la ciudad) y en Buenos Aires prácticamente no. Usá el concepto de placas tectónicas. (b) Elegí dos unidades de relieve argentinas muy distintas y comparalas en tres aspectos: altura, actividad económica principal y densidad de población. (c) ¿Por qué la llanura Chaco-Pampeana concentra la producción de granos? Da dos razones, una natural y una histórica.",
      guia: [
        "(a) San Juan está cerca del borde de placas (Nazca bajo Sudamericana, zona andina joven); Buenos Aires está sobre la parte estable y antigua de la placa, lejos del borde.",
        "(b) Comparación ordenada en los tres aspectos (ej.: Puna: >3.500 m, minería/litio, muy poco poblada vs. llanura pampeana: <200 m, agricultura e industria, muy poblada).",
        "(c) Natural: relieve plano, suelos fértiles, clima templado húmedo. Histórica: modelo agroexportador, ferrocarril y puertos, inmigración.",
      ],
    },
  },
  {
    id: "geo-05", unidad: "U1", tema: 3,
    titulo: "Climas, ríos y biomas",
    lectura: [
      "El clima depende de factores: la latitud (cuanto más lejos del ecuador, más frío), la altitud (cada 1.000 m baja unos 6 °C), la distancia al mar (continentalidad: el interior tiene más amplitud térmica), las corrientes marinas (la corriente fría de Malvinas enfría la costa patagónica) y el relieve (los Andes frenan la humedad del Pacífico y dejan seco el oeste argentino).",
      "En Argentina hay climas cálidos en el norte (subtropical sin estación seca en Misiones; tropical con estación seca en el Chaco), templados en la región pampeana (húmedo al este, más seco al oeste), áridos en el oeste y la meseta patagónica, y fríos en el sur y en la alta montaña. Hay vientos locales famosos: el Zonda (seco y cálido, baja de los Andes en Cuyo), el Pampero (frío, del sudoeste) y la Sudestada (que hace crecer el Río de la Plata).",
      "Hidrografía: la cuenca del Plata (ríos Paraná, Uruguay y Paraguay) es una de las más grandes del mundo y desemboca en el Atlántico a través del Río de la Plata. En la Patagonia los ríos nacen en los Andes y cruzan la meseta árida (ríos alóctonos como el Negro o el Colorado), lo que permite el riego del Alto Valle. En el oeste hay cuencas endorreicas, que no llegan al mar.",
      "Los biomas combinan clima, suelo, vegetación y fauna: selva paranaense (Misiones), yungas (selva de montaña en Salta, Jujuy y Tucumán), parque chaqueño, espinal, pastizal pampeano, monte (arbustos en zonas secas), estepa patagónica, bosque andino-patagónico y puna. Casi todos están modificados por la actividad humana: el pastizal pampeano, por ejemplo, fue reemplazado casi por completo por cultivos.",
    ],
    claves: [
      "Factores: latitud, altitud, continentalidad, corrientes, relieve",
      "Andes = barrera de humedad → oeste árido",
      "Cuenca del Plata; ríos alóctonos patagónicos; cuencas endorreicas",
      "Biomas: selva paranaense, yungas, chaqueño, pampeano, monte, estepa, bosque andino",
    ],
    ejercicio: {
      consigna: "Mendoza recibe unos 200 mm de lluvia al año, pero es una de las principales zonas productoras de vino y frutas del país. (a) Explicá con dos factores del clima por qué llueve tan poco. (b) Explicá de dónde sale el agua que permite cultivar (pensá en los Andes y en los ríos). (c) Planteá un problema que podría tener Mendoza en el futuro si los glaciares siguen retrocediendo, y una medida para enfrentarlo.",
      guia: [
        "(a) Barrera de los Andes que frena la humedad del Pacífico; continentalidad (lejos del Atlántico); vientos secos (Zonda).",
        "(b) Ríos de deshielo de nieve y glaciares andinos (Mendoza, Tunuyán); oasis de riego con canales y diques (Potrerillos).",
        "(c) Menos agua de deshielo → conflicto por el agua entre consumo urbano, agricultura e industria/minería; medidas: riego por goteo, Ley de Glaciares, cuidado del agua.",
        "Relaciona clima, hidrografía y actividad económica (pensamiento geográfico integrado).",
      ],
    },
  },
  {
    id: "geo-06", unidad: "U1", tema: null,
    titulo: "Integrador Unidad 1",
    lectura: [
      "Hoy no hay tema nuevo: es día de repaso. La Unidad 1 tiene una idea central: el territorio es naturaleza más sociedad. Las condiciones naturales (relieve, clima, ríos, biomas) ofrecen posibilidades y límites, pero lo que se hace con ellas depende de la historia: quién ocupó el lugar, con qué objetivos y con qué tecnología.",
      "Repasá en voz alta, sin mirar: (1) los límites de América y sus dos divisiones; (2) las tres etapas de conformación territorial con un ejemplo de cada una; (3) los cinco países limítrofes de Argentina y su superficie; (4) cinco unidades de relieve; (5) tres factores del clima y tres biomas.",
      "Para la mesa, lo que más suma es relacionar: por ejemplo, «la región pampeana concentra población porque tiene llanura fértil y clima templado (natural), pero también porque ahí convergieron el ferrocarril, los puertos y la inmigración del modelo agroexportador (histórico)».",
    ],
    claves: [
      "Territorio = condiciones naturales + procesos históricos",
      "Siempre que puedas, explicá con una causa natural y una social",
    ],
    ejercicio: {
      consigna: "Escribí un texto de 12 a 15 líneas titulado «¿Por qué casi un tercio de los argentinos vive alrededor de Buenos Aires?». Tiene que incluir: al menos dos condiciones naturales (relieve, clima, ríos), al menos dos procesos históricos (colonial y/o estatal) y una consecuencia actual de esa concentración. Usá conectores causales (porque, por eso, en consecuencia).",
      guia: [
        "Condiciones naturales: llanura, clima templado húmedo, Río de la Plata como puerto natural, suelos fértiles.",
        "Procesos históricos: puerto colonial y capital del virreinato (1776); ferrocarril en abanico y modelo agroexportador; inmigración europea 1870-1930; industrialización en el siglo XX.",
        "Consecuencia actual: macrocefalia/desequilibrio territorial, congestión, villas, regiones despobladas.",
        "Texto con introducción, desarrollo y cierre; conectores causales bien usados.",
      ],
    },
  },

  /* ---------------- UNIDAD 2 ---------------- */
  {
    id: "geo-07", unidad: "U2", tema: 4,
    titulo: "Recursos naturales: qué son y cómo se clasifican",
    lectura: [
      "Un recurso natural es un elemento de la naturaleza que una sociedad valora y usa para satisfacer necesidades. La clave está en «una sociedad valora»: algo se vuelve recurso según la cultura, la tecnología y la economía de cada época. El petróleo no era un recurso para los pueblos originarios; el litio casi no importaba hace 40 años y hoy es estratégico por las baterías.",
      "Clasificación según su renovación: (1) renovables: se regeneran en tiempos humanos si se usan bien (bosques, suelo, fauna, pesca, agua dulce); si se explotan más rápido de lo que se regeneran, se agotan. (2) No renovables: existen en cantidades fijas y tardan millones de años en formarse (petróleo, gas, carbón, minerales). (3) Perennes o inagotables: no se agotan por usarlos (energía solar, viento, mareas).",
      "Recursos actuales y potenciales: un recurso actual ya se explota; uno potencial se conoce pero todavía no se aprovecha, por falta de tecnología, inversión o mercado. Ejemplo: los vientos de la Patagonia fueron durante mucho tiempo un recurso potencial; con los parques eólicos se convirtieron en actual.",
      "Por último, no todos los recursos son iguales para todos: su valor depende de quién los controla. Por eso se habla de recursos estratégicos (agua, litio, hidrocarburos), que generan disputas entre países, empresas y comunidades.",
    ],
    claves: [
      "Recurso = elemento natural valorado por una sociedad (cambia con la historia)",
      "Renovables / no renovables / perennes",
      "Actual vs. potencial",
      "Recursos estratégicos → conflictos",
    ],
    ejercicio: {
      consigna: "(a) Clasificá estos recursos como renovable, no renovable o perenne, y para los renovables explicá en qué caso se podrían agotar: merluza del Mar Argentino, gas de Vaca Muerta, viento patagónico, bosque nativo chaqueño, cobre, energía solar en la Puna. (b) El litio era casi irrelevante en 1980 y hoy es «oro blanco». Explicá con este ejemplo por qué decimos que los recursos son una construcción social. (c) Nombrá un recurso potencial de Argentina y qué haría falta para que se vuelva actual.",
      guia: [
        "(a) Merluza: renovable, se agota por sobrepesca. Gas: no renovable. Viento: perenne. Bosque nativo: renovable, se agota por deforestación más rápida que la regeneración. Cobre: no renovable. Solar: perenne.",
        "(b) El valor depende de la tecnología y la demanda (baterías de celulares y autos eléctricos, transición energética); el mineral siempre estuvo, cambió la sociedad.",
        "(c) Ejemplos: energía mareomotriz en Santa Cruz, hidrógeno verde, más energía solar; requiere inversión, tecnología, infraestructura (líneas de transmisión) o mercado.",
      ],
    },
  },
  {
    id: "geo-08", unidad: "U2", tema: 5,
    titulo: "Manejo de recursos: extractivismo y sustentabilidad",
    lectura: [
      "No alcanza con saber qué recursos hay: importa cómo se usan. Hay distintas formas de manejo.",
      "Extractivismo: es un modelo basado en extraer grandes volúmenes de recursos naturales, con poco o ningún procesamiento, para exportarlos. Es la forma en que se insertó América Latina en la economía mundial desde la colonia (plata, azúcar, guano, carne) y sigue hoy con la megaminería, el petróleo y gas no convencional (Vaca Muerta, en Neuquén, con la técnica de fractura hidráulica o fracking) y el agronegocio sojero. Trae divisas y empleo, pero también dependencia de los precios internacionales, impactos ambientales y conflictos con comunidades locales.",
      "Desarrollo sustentable: según el Informe Brundtland (ONU, 1987) es el que «satisface las necesidades del presente sin comprometer la capacidad de las generaciones futuras de satisfacer las propias». Tiene tres dimensiones que deben equilibrarse: ambiental, económica y social.",
      "Herramientas de cuidado en Argentina: la Ley General del Ambiente (25.675, de 2002), la Ley de Bosques (26.331, de 2007), que ordena el territorio con colores (rojo: no se puede desmontar; amarillo: uso sustentable; verde: se puede transformar), la Ley de Glaciares (26.639, de 2010) y las evaluaciones de impacto ambiental, que deben hacerse antes de un proyecto, con audiencias públicas.",
      "Un buen análisis no es «extracción = malo». Pregunta: ¿quién se beneficia?, ¿quién paga los costos ambientales?, ¿se controla?, ¿qué pasa cuando el recurso se termina?",
    ],
    claves: [
      "Extractivismo: mucho volumen, poco procesamiento, para exportar",
      "Sustentable (Brundtland 1987): presente sin comprometer el futuro",
      "Leyes: 25.675 Ambiente, 26.331 Bosques, 26.639 Glaciares",
      "Preguntas clave: quién gana, quién paga, qué pasa después",
    ],
    ejercicio: {
      consigna: "En una localidad de Neuquén se discute ampliar la explotación de Vaca Muerta. Hay cuatro actores: la empresa petrolera, el gobierno provincial, los productores de frutas del Alto Valle y una comunidad mapuche. (a) Escribí qué interés tiene cada actor (uno por actor). (b) Indicá dos beneficios y dos riesgos del proyecto. (c) Proponé tres condiciones concretas para que el proyecto sea más sustentable, cada una vinculada a una de las tres dimensiones (ambiental, económica, social).",
      guia: [
        "(a) Empresa: ganancia y producción. Gobierno: regalías, empleo, energía. Fruticultores: agua y suelo para riego, competencia por el territorio. Comunidad mapuche: territorio ancestral, consulta previa, ambiente.",
        "(b) Beneficios: divisas, empleo, autoabastecimiento energético. Riesgos: uso masivo de agua en el fracking, contaminación, sismos inducidos, conflictos territoriales, dependencia de un recurso no renovable.",
        "(c) Ambiental: control y tratamiento del agua, evaluación de impacto con audiencia pública. Económica: parte de las regalías a un fondo para diversificar la economía. Social: consulta previa libre e informada a las comunidades, empleo local.",
      ],
    },
  },
  {
    id: "geo-09", unidad: "U2", tema: 6,
    titulo: "Recursos minerales en América y en Argentina",
    lectura: [
      "América es uno de los continentes con más recursos minerales, pero su explotación muestra la desigualdad entre América Anglosajona y América Latina.",
      "América Latina: Chile es el mayor productor de cobre del mundo (minas como Chuquicamata y Escondida); Perú produce cobre, plata, oro y zinc; Brasil tiene enormes yacimientos de hierro (Carajás); Bolivia tuvo plata (Potosí) y estaño, y hoy litio; México es uno de los mayores productores de plata. En general, los minerales se exportan en bruto o con poco procesamiento, y la transformación industrial (que agrega más valor) se hace en otros países.",
      "América Anglosajona: Canadá y Estados Unidos también extraen mucho (níquel, uranio, potasio y oro en Canadá; carbón y cobre en EE. UU.), pero tienen industrias propias que los transforman, por lo que retienen más valor.",
      "El triángulo del litio: Argentina, Bolivia y Chile concentran más de la mitad de los recursos mundiales de litio en salares de la Puna (Hombre Muerto en Catamarca-Salta, Uyuni en Bolivia, Atacama en Chile). En Argentina se extrae en Catamarca, Salta y Jujuy. Se obtiene evaporando salmuera, lo que usa mucha agua en una zona muy árida: ahí está el conflicto con comunidades que viven del pastoreo y de las salinas.",
      "Otros minerales en Argentina: oro y plata en San Juan (Veladero) y Santa Cruz; cobre (Bajo de la Alumbrera, en Catamarca, funcionó hasta 2018, y hay grandes proyectos en San Juan). La megaminería a cielo abierto usa explosivos, mucha agua y químicos; por eso varias provincias (como Mendoza y Chubut) tienen leyes que la restringen.",
    ],
    claves: [
      "Chile cobre · Brasil hierro · Perú/México plata · Bolivia estaño/litio",
      "Latina exporta en bruto; Anglosajona industrializa (más valor agregado)",
      "Triángulo del litio: Argentina + Bolivia + Chile (Puna, salares)",
      "Megaminería a cielo abierto: agua, explosivos, químicos → conflictos",
    ],
    ejercicio: {
      consigna: "Argentina exporta carbonato de litio y luego importa celulares y baterías que contienen ese litio. (a) Explicá qué es el valor agregado y quién se queda con la mayor parte en esta cadena. (b) Compará esta situación con la de Canadá en la minería: ¿qué diferencia hay? (c) Una comunidad de la Puna jujeña se opone a un nuevo proyecto de litio. Explicá su argumento central (pensá en el clima de la Puna y en cómo se extrae el litio) y proponé una alternativa que permita aprovechar el recurso sin ignorar ese reclamo.",
      guia: [
        "(a) Valor agregado = valor que se suma al transformar una materia prima; la mayor parte queda en los países que fabrican baterías y celulares (China, Corea, EE. UU.), no en el que extrae.",
        "(b) Canadá extrae y además industrializa/tiene tecnología propia; Argentina se especializa en la etapa extractiva (inserción primaria, patrón latinoamericano).",
        "(c) Argumento: la extracción por evaporación de salmuera usa grandes cantidades de agua en un ambiente árido, afectando pastoreo, vegas y la forma de vida. Alternativa: consulta previa, tecnologías de extracción directa con menos agua, industrialización local, participación en beneficios.",
      ],
    },
  },
  {
    id: "geo-10", unidad: "U2", tema: 7,
    titulo: "Agua, suelo y biodiversidad",
    lectura: [
      "Agua: América tiene algunas de las mayores reservas de agua dulce del mundo: el río Amazonas (el de mayor caudal del planeta), los Grandes Lagos (entre EE. UU. y Canadá), la cuenca del Plata y el acuífero Guaraní, una enorme reserva subterránea compartida por Argentina, Brasil, Paraguay y Uruguay. Pero el agua está mal distribuida: en Argentina, cerca de dos tercios del territorio es árido o semiárido, y el agua se concentra en el noreste. Por eso en el oeste se vive en oasis de riego.",
      "Suelo: es un recurso renovable pero de formación muy lenta (puede tardar siglos en formarse unos centímetros). La región pampeana tiene suelos de los más fértiles del mundo, pero sufren erosión y pérdida de nutrientes por la agricultura continua (monocultivo de soja). En la Patagonia, el sobrepastoreo de ovejas durante más de un siglo provocó desertificación: el suelo queda sin cobertura y el viento se lo lleva.",
      "Biodiversidad: es la variedad de seres vivos y ecosistemas. América tiene varios de los países «megadiversos» (Brasil, Colombia, México, Perú, Ecuador). La principal amenaza es la pérdida de hábitat por la deforestación para agricultura y ganadería: en la Amazonía y en el Gran Chaco americano (Argentina, Paraguay, Bolivia), que es uno de los lugares con más desmonte del mundo. En Argentina, la Ley de Bosques (2007) intenta frenar ese proceso, pero su aplicación es despareja y con poco presupuesto.",
      "Los tres recursos están conectados: si se desmonta el bosque, se erosiona el suelo, se altera el ciclo del agua (más inundaciones abajo) y se pierde biodiversidad.",
    ],
    claves: [
      "Amazonas, Grandes Lagos, cuenca del Plata, acuífero Guaraní",
      "Argentina: 2/3 árido o semiárido; oasis de riego",
      "Suelo: erosión pampeana (monocultivo), desertificación patagónica (sobrepastoreo)",
      "Biodiversidad: desmonte en Amazonía y Gran Chaco; Ley de Bosques",
    ],
    ejercicio: {
      consigna: "En 2024 hubo fuertes inundaciones en zonas del norte argentino que antes eran bosque chaqueño y hoy son campos de soja. (a) Armá una cadena de causas y consecuencias (mínimo 5 eslabones) que vaya del desmonte a la inundación. (b) Explicá por qué esto muestra que agua, suelo y biodiversidad no se pueden analizar por separado. (c) Según la Ley de Bosques, ¿qué color debería tener una zona de bosque nativo muy valiosa y qué implica? ¿Por qué igual se sigue desmontando?",
      guia: [
        "(a) Cadena lógica: demanda de soja/ganado → desmonte → suelo sin cobertura → menos infiltración y más escorrentía → crecida de ríos/anegamiento → inundaciones, pérdida de cosechas y viviendas.",
        "(b) El bosque regula el agua y protege el suelo; al perderlo se afectan los tres a la vez (sistema).",
        "(c) Rojo: no se puede desmontar. Se sigue desmontando por controles débiles, poco presupuesto, recategorizaciones provinciales, desmontes ilegales e incendios, presión económica.",
      ],
    },
  },
  {
    id: "geo-11", unidad: "U2", tema: null,
    titulo: "Integrador Unidad 2",
    lectura: [
      "Repaso de la Unidad 2. La idea central: los recursos naturales son una construcción social y su manejo genera conflictos entre actores con intereses distintos.",
      "Repasá sin mirar: (1) la definición de recurso natural y por qué cambia con la historia; (2) la clasificación renovable / no renovable / perenne y actual / potencial; (3) qué es el extractivismo y tres ejemplos latinoamericanos; (4) la definición de desarrollo sustentable y sus tres dimensiones; (5) tres leyes ambientales argentinas con su número aproximado o año; (6) el triángulo del litio; (7) un problema de agua, uno de suelo y uno de biodiversidad en Argentina.",
      "En la mesa suelen pedir un análisis de caso con actores. Un esquema que sirve siempre: recurso → quién lo explota y para qué → beneficios → costos e impactos → quiénes se oponen y por qué → propuestas.",
    ],
    claves: [
      "Esquema de caso: recurso → actores → beneficios → impactos → conflicto → propuestas",
    ],
    ejercicio: {
      consigna: "Elegí UN caso: minería de oro en San Juan, litio en la Puna, fracking en Vaca Muerta o desmonte en el Chaco. Escribí un análisis completo siguiendo el esquema: (1) recurso y clasificación; (2) quién lo explota y a dónde va; (3) dos beneficios; (4) dos impactos ambientales y uno social; (5) actores en conflicto y sus posturas; (6) dos propuestas sustentables. Mínimo 15 líneas.",
      guia: [
        "Clasifica bien el recurso (renovable/no renovable) y lo ubica en el mapa (provincia/región).",
        "Identifica el destino (exportación) y lo relaciona con el extractivismo.",
        "Distingue impactos ambientales (agua, suelo, biodiversidad) de sociales (salud, empleo, desplazamientos, comunidades originarias).",
        "Presenta al menos tres actores con intereses distintos.",
        "Propuestas concretas, no genéricas («cuidar el ambiente» no alcanza).",
      ],
    },
  },

  /* ---------------- UNIDAD 3 ---------------- */
  {
    id: "geo-12", unidad: "U3", tema: 8,
    titulo: "Población: crecimiento e indicadores",
    lectura: [
      "América tiene algo más de 1.000 millones de habitantes. Para estudiar una población se usan indicadores demográficos, que casi siempre se expresan cada 1.000 habitantes (‰).",
      "Tasa de natalidad: nacimientos por cada 1.000 habitantes en un año. Tasa de mortalidad: defunciones por cada 1.000 habitantes. Crecimiento natural (o vegetativo) = natalidad − mortalidad. Crecimiento total = crecimiento natural + saldo migratorio (inmigrantes − emigrantes). Mortalidad infantil: muertes de menores de 1 año por cada 1.000 nacidos vivos; es uno de los mejores indicadores de las condiciones de vida y del sistema de salud. Esperanza de vida: cantidad de años que se espera que viva, en promedio, una persona al nacer.",
      "La transición demográfica explica cómo cambian estas tasas: (1) natalidad y mortalidad altas, crecimiento lento; (2) baja la mortalidad (vacunas, agua potable, medicina) y la población crece muy rápido; (3) baja también la natalidad (urbanización, educación de las mujeres, anticonceptivos); (4) ambas bajas, crecimiento lento y envejecimiento. Canadá y EE. UU. están en la última etapa; Argentina, Uruguay y Chile también; otros países latinoamericanos, como Haití o Guatemala, todavía tienen natalidad más alta.",
      "Argentina según el Censo 2022: 46.234.830 habitantes, un 15,2 % más que en 2010 (40.117.096). La natalidad cayó muchísimo en la última década: los nacimientos anuales bajaron más de un tercio entre 2014 y 2022, y el promedio de hijos por mujer quedó por debajo de 2. Resultado: la población envejece y la pirámide de población se angosta en la base.",
      "Las pirámides de población muestran la estructura por edad y sexo: base ancha y punta fina = población joven (alta natalidad); forma de urna o campana = población envejecida.",
    ],
    claves: [
      "Crecimiento natural = natalidad − mortalidad; total = natural + saldo migratorio",
      "Mortalidad infantil = muertes <1 año cada 1.000 nacidos vivos",
      "Transición demográfica en 4 etapas",
      "Argentina 2022: 46.234.830 hab.; natalidad en fuerte caída → envejecimiento",
    ],
    ejercicio: {
      consigna: "Un país tiene en un año: 500.000 nacimientos, 340.000 defunciones, 3.000 muertes de menores de 1 año, 60.000 inmigrantes y 20.000 emigrantes, y una población de 40.000.000. (a) Calculá la tasa de natalidad, la de mortalidad, el crecimiento natural (en ‰ y en personas), la mortalidad infantil y el crecimiento total en personas. Mostrá las cuentas. (b) ¿En qué etapa de la transición demográfica lo ubicarías y por qué? (c) Si la natalidad siguiera cayendo como en Argentina, nombrá dos consecuencias para el país dentro de 30 años.",
      guia: [
        "(a) Natalidad = 500.000/40.000.000 × 1.000 = 12,5 ‰. Mortalidad = 340.000/40.000.000 × 1.000 = 8,5 ‰. Crecimiento natural = 4 ‰ = 160.000 personas. Mortalidad infantil = 3.000/500.000 × 1.000 = 6 ‰. Crecimiento total = 160.000 + (60.000 − 20.000) = 200.000 personas.",
        "(b) Etapa avanzada (3 tardía/4): natalidad y mortalidad bajas, crecimiento natural bajo, mortalidad infantil baja.",
        "(c) Consecuencias: envejecimiento, presión sobre jubilaciones y salud, menos población en edad de trabajar, cierre de escuelas o cambio de servicios, mayor importancia de la inmigración.",
        "Muestra las fórmulas, no solo los resultados.",
      ],
    },
  },
  {
    id: "geo-13", unidad: "U3", tema: 9,
    titulo: "Distribución, densidad y migraciones",
    lectura: [
      "La población no se distribuye de forma pareja. La densidad de población es la cantidad de habitantes por km² (población ÷ superficie). Argentina tiene unos 16-17 hab/km², un valor bajo, pero ese promedio esconde enormes diferencias: la Ciudad de Buenos Aires tiene más de 15.000 hab/km² y Santa Cruz menos de 2 hab/km².",
      "Según el Censo 2022, las provincias más pobladas son Buenos Aires (17,5 millones), Córdoba (3,8 millones), Santa Fe (3,5 millones) y Mendoza (2 millones). El Área Metropolitana de Buenos Aires (AMBA) concentra cerca de un tercio de la población del país. Esto se llama macrocefalia urbana: una ciudad principal desproporcionadamente grande respecto de las demás. Pasa en buena parte de América Latina (México D. F., Lima, Santiago). Además, más del 90 % de los argentinos vive en ciudades: es uno de los países más urbanizados del mundo.",
      "En América, la población se concentra en las costas y en ciertas zonas templadas (la costa este de EE. UU., el sudeste de Brasil, la región pampeana), mientras que la Amazonía, el norte de Canadá, la Patagonia y los desiertos están casi vacíos.",
      "Migraciones: son desplazamientos de población con cambio de residencia. Pueden ser internas (dentro de un país, como el éxodo rural hacia las ciudades en Argentina desde la década de 1930) o internacionales. Causas: expulsión (pobreza, violencia, desempleo, desastres) y atracción (trabajo, salarios, estudio, familia). En Argentina la inmigración pasó de ser mayormente europea (1870-1930) a ser principalmente de países limítrofes y Perú (paraguayos, bolivianos, peruanos, venezolanos en los últimos años). El gran flujo del continente es de América Latina hacia Estados Unidos: la frontera con México es una de las más cruzadas del mundo.",
    ],
    claves: [
      "Densidad = habitantes ÷ km²; Argentina ≈ 16-17 hab/km²",
      "AMBA ≈ 1/3 de la población → macrocefalia; >90 % urbana",
      "Migraciones internas (campo → ciudad) e internacionales; expulsión/atracción",
      "Inmigración argentina: europea (1870-1930) → limítrofe y latinoamericana",
    ],
    ejercicio: {
      consigna: "(a) Calculá la densidad de una provincia con 1.400.000 habitantes y 77.000 km², y la de otra con 340.000 habitantes y 244.000 km². Mostrá las cuentas y explicá qué región de Argentina podría ser cada una. (b) Explicá por qué el promedio nacional de densidad es engañoso. (c) Una familia de Bolivia se muda a la periferia del AMBA para trabajar en quintas hortícolas. Identificá dos factores de expulsión y dos de atracción, y explicá un aporte y una dificultad que puede enfrentar en el lugar de llegada.",
      guia: [
        "(a) 1.400.000 ÷ 77.000 ≈ 18,2 hab/km² (provincia de densidad media, típica del norte o del centro). 340.000 ÷ 244.000 ≈ 1,4 hab/km² (Patagonia, ej. Santa Cruz).",
        "(b) Un promedio mezcla áreas superpobladas (AMBA, CABA) con áreas casi vacías (Patagonia, Puna); no muestra la concentración.",
        "(c) Expulsión: bajos ingresos, falta de trabajo, pocas oportunidades. Atracción: trabajo hortícola, redes familiares/comunidad boliviana, salarios en pesos, educación y salud públicas.",
        "Aporte: trabajo en el cinturón hortícola (abastece de verduras a la ciudad), cultura. Dificultad: discriminación, informalidad laboral, vivienda precaria.",
      ],
    },
  },
  {
    id: "geo-14", unidad: "U3", tema: 10,
    titulo: "Actividades económicas: agropecuarias y extractivas",
    lectura: [
      "Las actividades económicas se clasifican en sectores: primario (obtiene recursos de la naturaleza: agricultura, ganadería, pesca, forestación, minería, petróleo), secundario (transforma materias primas: industria, construcción, energía) y terciario (servicios: comercio, transporte, educación, salud, turismo, finanzas). A veces se suma un cuaternario (información, investigación y tecnología).",
      "En América, los países latinoamericanos tienen gran peso del sector primario en sus exportaciones. Estados Unidos, Canadá, Brasil y Argentina están entre los mayores productores agropecuarios del mundo, pero con diferencias en cómo se procesa y se vende esa producción.",
      "En Argentina, la región pampeana concentra la agricultura de granos (soja, maíz, trigo, girasol) y la ganadería bovina. Desde los años 90 se expandió el agronegocio: siembra directa, soja transgénica, glifosato, grandes empresas y pools de siembra que alquilan tierras. Esta «sojización» aumentó muchísimo la producción y las exportaciones, pero también desplazó otras producciones (tambos, ganadería) hacia zonas extrapampeanas, impulsó el desmonte y concentró la tierra.",
      "Fuera de la región pampeana están las economías regionales: vid y vino en Mendoza y San Juan, caña de azúcar en Tucumán y Salta-Jujuy, yerba mate y té en Misiones y Corrientes, algodón en el Chaco, frutas de pepita (peras y manzanas) en el Alto Valle de Río Negro y Neuquén, tabaco en Salta y Jujuy, cítricos en Tucumán y Entre Ríos, ganadería ovina en la Patagonia. Suelen tener muchos pequeños productores con problemas de precios y dependencia de la agroindustria que compra la producción.",
      "Las actividades extractivas (minería, hidrocarburos, pesca) completan el sector primario: Vaca Muerta en Neuquén, minería en la cordillera y la Puna, pesca en el Mar Argentino (merluza, langostino).",
    ],
    claves: [
      "Primario / secundario / terciario (+ cuaternario)",
      "Pampa: granos y ganadería; agronegocio y sojización desde los 90",
      "Economías regionales: vid, caña, yerba, algodón, peras y manzanas, tabaco",
      "Extractivas: hidrocarburos, minería, pesca",
    ],
    ejercicio: {
      consigna: "Seguí el recorrido de una manzana del Alto Valle de Río Negro desde la chacra hasta un supermercado de Buenos Aires. (a) Nombrá al menos cinco etapas y clasificá cada una en sector primario, secundario o terciario. (b) El productor recibe una parte muy chica del precio final. Explicá por qué, usando los conceptos de cadena productiva y actores con distinto poder. (c) Compará esta economía regional con la producción de soja pampeana en dos aspectos: tamaño de los productores y destino principal de la producción.",
      guia: [
        "(a) Cultivo/cosecha (primario), empaque y frigorífico, jugo o sidra (secundario), transporte, distribución mayorista, venta en supermercado, exportación (terciario).",
        "(b) Los intermediarios (empacadoras, exportadoras, supermercados) concentran el poder de fijar precios; el pequeño productor está atomizado, depende de quien le compra y carga con los costos y riesgos climáticos.",
        "(c) Manzana: muchos pequeños y medianos productores, mercado interno y exportación de fruta fresca. Soja: grandes empresas y pools de siembra, mayormente exportación (granos, harina y aceite).",
      ],
    },
  },
  {
    id: "geo-15", unidad: "U3", tema: 11,
    titulo: "Industria, comercio y servicios",
    lectura: [
      "Industria en América: Estados Unidos fue la gran potencia industrial; su núcleo histórico fue el Manufacturing Belt del noreste (acero, autos en Detroit), que entró en crisis desde los años 70 (Rust Belt, «cinturón del óxido») mientras crecía el Sun Belt del sur y el oeste (tecnología, aeroespacial, Silicon Valley). México desarrolló maquiladoras en la frontera norte: plantas que ensamblan productos con mano de obra barata para exportar a EE. UU. Brasil tiene el polo industrial más grande de Latinoamérica en São Paulo.",
      "Industria en Argentina: se desarrolló sobre todo desde la década de 1930 con la sustitución de importaciones. Hoy se concentra en el eje fluvial-industrial que va de Rosario a La Plata, sobre el Paraná y el Río de la Plata (agroindustria, petroquímica, siderurgia, automotriz), más Córdoba (automotriz y metalmecánica) y Mendoza. Tierra del Fuego tiene un régimen de promoción industrial (Ley 19.640, de 1972) que impulsó el armado de electrónica para poblar una zona estratégica.",
      "Comercio: los países se agrupan en bloques para comerciar con menos aranceles. El Mercosur se creó en 1991 con el Tratado de Asunción (Argentina, Brasil, Paraguay y Uruguay; luego se sumó Bolivia). En América del Norte rige el T-MEC (EE. UU., México y Canadá), que en 2020 reemplazó al NAFTA. Argentina exporta sobre todo productos primarios y manufacturas de origen agropecuario (harina y aceite de soja, maíz, carne) y energía, e importa bienes industriales y tecnología.",
      "Servicios: es el sector que más empleo genera en casi todo el continente. Incluye desde trabajos muy calificados (software, finanzas) hasta empleos precarios e informales (venta ambulante, delivery). Argentina tiene un sector de servicios basados en conocimiento (software, diseño) que exporta, y un turismo importante (Iguazú, Bariloche, glaciares).",
      "Estudio de casos: para analizar una industria o servicio, preguntate dónde se ubica y por qué (materia prima, mano de obra, mercado, puertos, leyes de promoción), qué empleo genera y a dónde vende.",
    ],
    claves: [
      "EE. UU.: Manufacturing/Rust Belt → Sun Belt; México: maquiladoras",
      "Argentina: sustitución de importaciones; eje Rosario–La Plata; Córdoba",
      "Mercosur 1991 (Tratado de Asunción); T-MEC 2020",
      "Factores de localización: materia prima, mano de obra, mercado, transporte, promoción",
    ],
    ejercicio: {
      consigna: "Caso: una fábrica de celulares en Río Grande (Tierra del Fuego). (a) Explicá por qué una fábrica de electrónica está a más de 3.000 km de Buenos Aires, donde están los consumidores. Mencioná la ley y el objetivo geopolítico. (b) Analizá dos factores de localización que la perjudican y uno que la favorece. (c) Comparala con una maquiladora de la frontera norte de México: ¿en qué se parecen y en qué se diferencian (mercado al que venden, motivo de la localización)?",
      guia: [
        "(a) Ley 19.640 (1972) de promoción: beneficios impositivos y aduaneros; objetivo: poblar y afirmar soberanía en una zona estratégica y alejada (cercanía a Malvinas, Antártida, frontera con Chile).",
        "(b) Perjudican: lejanía del mercado y altos costos de transporte, insumos importados, clima. Favorece: beneficios fiscales, puerto.",
        "(c) Parecidos: ensamblado de piezas importadas, dependen de beneficios especiales. Diferencias: la maquiladora exporta a EE. UU. y se ubica por mano de obra barata y cercanía al mercado; la fueguina vende al mercado interno argentino y se ubica por una política estatal de promoción.",
      ],
    },
  },
  {
    id: "geo-16", unidad: "U3", tema: null,
    titulo: "Integrador Unidad 3",
    lectura: [
      "Repaso de la Unidad 3. La idea central: la población y las actividades económicas se distribuyen de manera desigual, y esa desigualdad tiene explicaciones naturales, históricas y económicas.",
      "Repasá sin mirar: (1) las fórmulas de natalidad, mortalidad, crecimiento natural y total, mortalidad infantil y densidad; (2) las etapas de la transición demográfica; (3) la población de Argentina en 2022 y las cuatro provincias más pobladas; (4) qué es la macrocefalia urbana; (5) causas de expulsión y de atracción de las migraciones; (6) los tres sectores económicos con ejemplos; (7) la sojización y tres economías regionales; (8) el eje industrial argentino, Mercosur y T-MEC.",
      "Truco para la mesa: cuando te pidan «explicar», no enumeres; usá la fórmula «X sucede porque A, y eso provoca B».",
    ],
    claves: [
      "Fórmulas + transición demográfica + distribución + sectores + bloques",
    ],
    ejercicio: {
      consigna: "Compará Argentina con Estados Unidos en un cuadro de doble entrada con estas filas: población aproximada, etapa de la transición demográfica, principal destino de los migrantes que llegan, peso del sector primario en las exportaciones, región industrial principal, bloque comercial al que pertenece. Después escribí un párrafo de 8 a 10 líneas que explique la diferencia más importante que encontraste y sus causas.",
      guia: [
        "Cuadro completo: Argentina ≈46 millones / EE. UU. ≈330-340 millones; ambos en etapa avanzada; migrantes limítrofes y latinoamericanos hacia el AMBA vs. latinoamericanos y asiáticos hacia EE. UU.; Argentina con exportaciones primarias y agroindustriales vs. EE. UU. diversificado e industrial/tecnológico; eje Rosario–La Plata vs. Manufacturing Belt/Sun Belt; Mercosur vs. T-MEC.",
        "El párrafo elige una diferencia (ej.: inserción primaria vs. industrial) y la explica con causas históricas (colonización, modelo agroexportador, industrialización temprana de EE. UU., capitales, tecnología).",
        "Usa conectores y vocabulario de la unidad.",
      ],
    },
  },

  /* ---------------- UNIDAD 4 ---------------- */
  {
    id: "geo-17", unidad: "U4", tema: 12,
    titulo: "Problemas ambientales (1): qué son y cómo analizarlos",
    lectura: [
      "Un problema ambiental es una alteración del ambiente provocada (o agravada) por la acción de la sociedad, que afecta la calidad de vida de las personas y los ecosistemas. Ojo: «ambiente» no es solo naturaleza; es la relación entre la naturaleza y la sociedad.",
      "Para analizarlos se usan cinco preguntas: (1) ¿cuál es el problema y dónde ocurre? (escala local, regional, nacional o global); (2) ¿cuáles son las causas? (naturales y sociales: económicas, políticas, tecnológicas); (3) ¿quiénes son los actores? (Estado, empresas, comunidades, ONG, científicos) y ¿qué intereses tienen?; (4) ¿cuáles son las consecuencias y quiénes las sufren más? (casi siempre los sectores más pobres, lo que se llama vulnerabilidad social); (5) ¿qué soluciones se proponen y quién las debe aplicar?",
      "Diferencia clave entre amenaza, vulnerabilidad y riesgo: la amenaza es el fenómeno peligroso (una lluvia muy intensa, un sismo); la vulnerabilidad es qué tan preparada está una población para resistirlo (calidad de las viviendas, infraestructura, ingresos); el riesgo combina las dos. Una misma lluvia es un desastre en un barrio sin desagües y una molestia en otro con infraestructura.",
      "Caso emblemático en Argentina: la cuenca Matanza-Riachuelo, uno de los ríos más contaminados de América Latina, con desechos industriales y cloacales y millones de personas viviendo en su cuenca. En 2008 la Corte Suprema, en el «fallo Mendoza» (por Beatriz Mendoza, una vecina que demandó), obligó al Estado nacional, la Provincia y la Ciudad de Buenos Aires a sanearlo y creó ACUMAR, el organismo encargado. Hubo avances (relocalización de familias, control de industrias), pero el problema sigue.",
    ],
    claves: [
      "Problema ambiental = naturaleza + sociedad; escalas",
      "5 preguntas: qué/dónde, causas, actores, consecuencias, soluciones",
      "Riesgo = amenaza × vulnerabilidad",
      "Riachuelo: fallo Mendoza (2008) → ACUMAR",
    ],
    ejercicio: {
      consigna: "Dos barrios de una misma ciudad reciben la misma tormenta de 150 mm en un día. En uno se inundan casas y hay evacuados; en el otro solo se cortan algunas calles. (a) Explicá la diferencia usando amenaza, vulnerabilidad y riesgo. (b) Nombrá tres factores sociales que pueden hacer más vulnerable al primer barrio. (c) Aplicá las cinco preguntas de análisis al caso del Riachuelo (una o dos oraciones por pregunta).",
      guia: [
        "(a) La amenaza es la misma (tormenta); cambia la vulnerabilidad, por lo tanto el riesgo y las consecuencias.",
        "(b) Viviendas precarias, ubicación en zonas bajas o cerca de arroyos, falta de desagües pluviales/cloacas, impermeabilización del suelo, pobreza, falta de planificación urbana.",
        "(c) Qué/dónde: contaminación del río en el AMBA (escala local-regional). Causas: industrias, basurales, cloacas, urbanización sin control. Actores: industrias, vecinos, Estado nacional/provincial/porteño, Corte Suprema, ACUMAR. Consecuencias: enfermedades, pérdida de biodiversidad, afecta más a barrios pobres. Soluciones: fallo Mendoza 2008, ACUMAR, control industrial, cloacas, relocalización.",
      ],
    },
  },
  {
    id: "geo-18", unidad: "U4", tema: 12,
    titulo: "Problemas ambientales (2): deforestación, incendios y cambio climático",
    lectura: [
      "Deforestación: es la pérdida de bosques nativos, sobre todo para ampliar la frontera agropecuaria. En América los casos más graves son la Amazonía (Brasil, Perú, Bolivia, Colombia) y el Gran Chaco. En Argentina, Santiago del Estero, Salta, Chaco y Formosa concentran la mayor parte del desmonte. Consecuencias: pérdida de biodiversidad, desplazamiento de comunidades campesinas e indígenas, erosión, inundaciones y más emisiones de dióxido de carbono.",
      "Incendios: muchos son provocados para «limpiar» terrenos y ganar campo. En 2020 y 2022 se quemaron grandes superficies del Delta del Paraná (afectando humedales, que regulan las inundaciones) y de Córdoba y Corrientes. La sequía y las altas temperaturas los agravan.",
      "Cambio climático: el aumento de la temperatura media del planeta causado sobre todo por la emisión de gases de efecto invernadero (dióxido de carbono, metano) por quemar combustibles fósiles, deforestar y por algunas actividades agropecuarias. En América sus efectos se ven en el retroceso de los glaciares andinos y patagónicos (reservas de agua dulce), sequías más intensas (como la de 2022-2023 en la región pampeana, que hizo perder buena parte de la cosecha), olas de calor, huracanes más fuertes en el Caribe e inundaciones.",
      "Es un problema global con responsabilidades desiguales: los países más industrializados (EE. UU., Europa, China) emitieron históricamente la mayor parte de los gases, mientras que muchos países latinoamericanos emiten menos pero son muy vulnerables a los efectos. Respuestas: el Acuerdo de París (2015), que busca limitar el calentamiento a 1,5-2 °C; la transición a energías renovables; y, a nivel local, la protección de bosques y humedales.",
      "Residuos urbanos: las ciudades latinoamericanas generan mucha basura y gran parte termina en basurales a cielo abierto. Reciclar, separar en origen y reconocer el trabajo de los recuperadores urbanos (cartoneros) son parte de la solución.",
    ],
    claves: [
      "Deforestación: Amazonía y Gran Chaco (Sgo. del Estero, Salta, Chaco, Formosa)",
      "Incendios del Delta (humedales) 2020 y 2022",
      "Cambio climático: gases de efecto invernadero → glaciares, sequías, calor",
      "Responsabilidades desiguales; Acuerdo de París 2015",
    ],
    ejercicio: {
      consigna: "Un diario titula: «La sequía 2022-2023 hizo perder buena parte de la cosecha de soja argentina». (a) Explicá por qué la sequía puede considerarse en parte un problema ambiental y no solo un fenómeno natural (pensá en el cambio climático y en el uso del suelo). (b) Explicá la paradoja de que la expansión de la soja contribuya al problema que después la perjudica. (c) Escribí una carta breve (8-10 líneas) a un diputado proponiendo dos medidas concretas: una de escala nacional y otra de escala local, justificando cada una.",
      guia: [
        "(a) La sequía es una amenaza natural, pero el cambio climático (causado por la sociedad) la hace más frecuente e intensa, y el desmonte y la degradación del suelo reducen su capacidad de retener agua.",
        "(b) La expansión agrícola deforesta (emite CO₂, altera lluvias y el ciclo del agua) y degrada suelos, lo que aumenta la vulnerabilidad de la propia producción.",
        "(c) Medidas concretas con escala: nacional (cumplimiento y presupuesto de la Ley de Bosques, ley de humedales, energías renovables, seguros agrícolas); local (rotación de cultivos, cortinas forestales, ordenamiento del uso del suelo, manejo del agua).",
        "Formato de carta: destinatario, propuesta, justificación y cierre.",
      ],
    },
  },
  {
    id: "geo-19", unidad: "U4", tema: null,
    titulo: "Integrador Unidad 4",
    lectura: [
      "Repaso de la Unidad 4. La idea central: los problemas ambientales son problemas sociales, tienen causas múltiples, actores con intereses en conflicto y consecuencias desiguales.",
      "Repasá sin mirar: (1) definición de problema ambiental y de ambiente; (2) las cinco preguntas de análisis; (3) amenaza, vulnerabilidad y riesgo con un ejemplo; (4) el caso del Riachuelo (fallo Mendoza 2008, ACUMAR); (5) deforestación del Gran Chaco y Ley de Bosques; (6) incendios en humedales; (7) causas y efectos del cambio climático en América; (8) Acuerdo de París.",
      "Esta unidad conecta con todo lo anterior: el relieve y el clima (U1) definen las amenazas; el manejo de los recursos (U2) genera los problemas; la distribución de la población y las actividades económicas (U3) explican quiénes son más vulnerables.",
    ],
    claves: [
      "U4 conecta U1 (amenazas), U2 (manejo de recursos) y U3 (vulnerabilidad)",
    ],
    ejercicio: {
      consigna: "Elegí un problema ambiental que no sea el Riachuelo (por ejemplo: incendios en el Delta, desmonte en Santiago del Estero, retroceso de glaciares, basurales a cielo abierto, contaminación por agroquímicos). Hacé una ficha completa con: localización y escala; causas naturales y sociales; mínimo cuatro actores con sus intereses; consecuencias ambientales y sociales (indicando quiénes son más vulnerables); dos soluciones con el actor responsable de cada una; y una relación con un tema de la Unidad 2 o 3.",
      guia: [
        "Localiza con precisión (provincia/región) e indica la escala.",
        "Distingue causas naturales de sociales y no confunde causa con consecuencia.",
        "Actores con intereses distintos y en conflicto (no solo «la gente»).",
        "Explica la vulnerabilidad desigual.",
        "Soluciones con responsable concreto (Estado nacional, provincia, municipio, empresas, ciudadanía).",
        "Conexión explícita con otra unidad (recursos, población o actividades económicas).",
      ],
    },
  },

  /* ---------------- SIMULACROS ---------------- */
  {
    id: "geo-20", unidad: "Simulacro", tema: null,
    titulo: "Simulacro de mesa (1): preguntas cortas",
    lectura: [
      "Hoy simulás la parte de preguntas cortas de la mesa. Poné un cronómetro de 30 minutos y respondé sin mirar ninguna lectura. Después corregí con la guía y volvé a leer las lecciones de los temas en los que fallaste.",
      "Consejo para el examen: leé todas las consignas antes de empezar, arrancá por las que sabés seguro y dejá tiempo al final para releer. En las preguntas de «explicar» o «relacionar», siempre escribí causas y consecuencias, no solo definiciones.",
    ],
    claves: [
      "30 minutos, sin mirar",
      "Corregí y volvé a leer lo que fallaste",
    ],
    ejercicio: {
      consigna: "Respondé en 2-3 líneas cada una: (1) ¿Cuáles son las dos divisiones de América y qué criterio usa cada una? (2) Nombrá las tres etapas de conformación de los territorios americanos. (3) ¿Por qué Argentina es bicontinental? Da las dos superficies. (4) ¿Qué es un río alóctono? Da un ejemplo. (5) Diferencia entre recurso renovable y no renovable, con un ejemplo de cada uno. (6) Definí extractivismo. (7) ¿Qué países forman el triángulo del litio? (8) Fórmula del crecimiento total de una población. (9) ¿Qué es la macrocefalia urbana? (10) ¿Qué establece la Ley de Bosques con la categoría roja? (11) Diferencia entre amenaza y vulnerabilidad. (12) ¿Qué fue el fallo Mendoza?",
      guia: [
        "(1) Estructural (relieve/forma: Norte, Central, Sur) y socio-cultural (historia/colonización/idioma: Anglosajona, Latina).",
        "(2) Originarios, coloniales y estatales.",
        "(3) Tiene territorio en América (2.791.810 km²) y reclama territorio en la Antártida (969.464 km²).",
        "(4) Río que nace en una zona húmeda y atraviesa una árida sin recibir afluentes importantes; ej.: Negro, Colorado, Chubut.",
        "(5) Renovable se regenera si se usa bien (bosque, pesca, suelo); no renovable tiene cantidad fija (petróleo, cobre).",
        "(6) Extracción de grandes volúmenes de recursos naturales con poco procesamiento, para exportar.",
        "(7) Argentina, Bolivia y Chile.",
        "(8) Crecimiento total = (nacimientos − defunciones) + (inmigrantes − emigrantes).",
        "(9) Una ciudad principal desproporcionadamente grande respecto del resto (AMBA ≈ 1/3 de la población).",
        "(10) Bosques de muy alto valor de conservación que no se pueden desmontar.",
        "(11) Amenaza: el fenómeno peligroso. Vulnerabilidad: la capacidad de una población de resistirlo (o su fragilidad).",
        "(12) Fallo de la Corte Suprema de 2008 que obligó a sanear el Riachuelo y creó ACUMAR.",
        "Meta: 10 de 12 o más. Menos de 8 → repasar los integradores.",
      ],
    },
  },
  {
    id: "geo-21", unidad: "Simulacro", tema: null,
    titulo: "Simulacro de mesa (2): desarrollo integrador",
    lectura: [
      "Último bonus antes de la mesa. Hoy toca el ejercicio más difícil: un desarrollo que cruza las cuatro unidades. Es el tipo de pregunta que distingue un 6 de un 9.",
      "Hacelo con 40 minutos de cronómetro. Planificá 5 minutos antes de escribir: anotá en un borrador las ideas de cada unidad que vas a usar y en qué orden.",
      "Después de esto: repasá las «ideas clave» de todas las lecciones, dormí bien y andá con calma. Ya estudiaste los 13 temas del programa.",
    ],
    claves: [
      "40 minutos, planificá 5 antes de escribir",
      "Mañana o pasado: repaso liviano de las ideas clave",
    ],
    ejercicio: {
      consigna: "Desarrollá: «La región del Noroeste argentino (Jujuy, Salta, Catamarca, Tucumán) tiene grandes riquezas naturales pero muchos de sus habitantes viven en condiciones de pobreza.» Explicá esta afirmación usando: (1) sus condiciones naturales (relieve, clima, biomas) — U1; (2) su conformación histórica (Qhapaq Ñan, colonia, Potosí, formación del Estado) — U1; (3) sus recursos y su manejo (litio, minería, agua) — U2; (4) su población y sus actividades económicas (caña de azúcar, tabaco, migraciones) — U3; (5) un problema ambiental de la región — U4. Cerrá con una conclusión propia de 3-4 líneas.",
      guia: [
        "U1 natural: Puna, Sierras Subandinas, valles, yungas; clima árido en la Puna y húmedo en las yungas.",
        "U1 histórica: región integrada al mundo andino (Qhapaq Ñan) y al eje colonial Potosí-Lima; pierde centralidad cuando la economía se orienta al puerto de Buenos Aires y al modelo agroexportador.",
        "U2: litio y minería con poco valor agregado local; conflicto por el agua en la Puna; comunidades originarias.",
        "U3: economías regionales (caña de azúcar, tabaco, cítricos) con trabajo estacional y concentración de la tierra; migraciones hacia otras regiones; menor densidad fuera de las capitales.",
        "U4: desmonte de yungas y del Chaco salteño, uso del agua en salares, incendios.",
        "Conclusión propia que relacione riqueza natural con desigualdad (dónde queda el valor, quién decide).",
        "Texto organizado con introducción, desarrollo por partes y conclusión.",
      ],
    },
  },
];

/* Índice de la lección de un día (0 = BONUS_START). Puede ser negativo o pasarse del final. */
export function bonusDayIndex(today) {
  return Math.round((new Date(today + "T00:00:00") - new Date(BONUS_START + "T00:00:00")) / 86400000);
}
