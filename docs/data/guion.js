/*
 * GUION DE LA EXPERIENCIA — este es el único archivo que el equipo necesita editar.
 *
 * Todo lo que está entre [corchetes] es un texto pendiente por redactar. Las
 * opciones que ya aparecen escritas vienen del documento de trabajo del equipo.
 *
 * Cómo funciona:
 *  - Cada nodo es un momento del recorrido y tiene una o varias decisiones.
 *  - El territorio empieza en 100 puntos. Cada opción tiene "puntos": 0 si es
 *    responsable, o un número negativo que resta. Las primeras paradas restan
 *    poco y las últimas restan más (ver la tabla de "puntos").
 *  - tipo: 'vitrina' abre una ventana con productos para escoger varios.
 *  - "puntosDeInteres": marcas que se tocan dentro de la escena. tipo 'abrir'
 *    lanza la decisión del nodo; tipo 'recoger' es un residuo que suma puntos.
 *    Se ubican con "angulo" y "altura" (grados) o con "posicion" (metros).
 *  - El viajero escribe su nombre al empezar. En cualquier texto se puede poner
 *    {nombre} y aparece su primer nombre: 'Buen viaje, {nombre}'.
 *  - "lleva" es lo que el viajero carga desde esa decisión (se muestra arriba).
 *  - "imagen" (opcional, en cualquier opción): foto pequeña que acompaña el
 *    texto del botón, por ejemplo imagen: 'assets/images/gaseosa-vidrio.jpg'.
 *  - El estado del territorio sale de los puntos (ver "puntos" y "estados").
 *  - "foto360": imagen en assets/360/. Puede ser una foto 360° completa o una
 *    panorámica normal de celular; la panorámica se adapta sola. Si el archivo no
 *    existe, se muestra un fondo provisional con el nombre del lugar.
 *  - "giroFoto" (opcional, en cualquier nodo): grados para girar la foto y
 *    escoger hacia dónde queda mirando el viajero al llegar.
 *  - "cobertura" (opcional): grados que abarca la panorámica. Por defecto 360
 *    (vuelta completa). Si giraron media vuelta, pongan cobertura: 180.
 *  - "audio": grabación de ambiente en assets/audio/ (opcional). Si el archivo no
 *    existe, suena el ambiente hecho por código indicado en "ambiente":
 *    'pueblo' (murmullo y aves), 'motor' (bus andando) o 'paramo' (viento y aves).
 */
window.GUION = {
  titulo: '4 Paradas',
  equipo: 'CreaMente Digital',
  logo: 'assets/images/logo.png', // aparece en la pantalla de inicio si el archivo existe
  territorio: 'Tunja → Chíquiza → Santuario de Fauna y Flora Iguaque · Boyacá',
  presentacion: '[Texto de inicio: quién es el viajero, a dónde va y por qué importa ahora]',

  // Saludo en la tienda, antes de pedir el nombre. Si el viajero no escribe
  // nada, se le llama con "nombrePorDefecto".
  saludo: 'Buenas, bienvenido. ¿Cómo se llama?',
  nombrePorDefecto: 'vecino',

  // Imagen de fondo de la pantalla de inicio. "cobertura" son los grados que
  // abarca una imagen que no es panorámica: 120 la muestra sin estirarla.
  portada: { lugar: 'Inicio', foto360: 'assets/360/portada.jpg', cobertura: 120 },

  // Bus que cruza la escena entre una parada y la siguiente. Si el archivo del
  // modelo no existe, se dibuja un bus provisional hecho con cajas.
  // Los modelos van en formato GLB. El tamaño se ajusta solo a la medida indicada
  // (en metros); "giro" son los grados para corregir hacia dónde mira el modelo.
  bus: {
    modelo: 'assets/modelos/bus.glb',
    largo: 6.5,       // metros de largo
    giro: 180,        // debe quedar mirando hacia la derecha
    altura: 0,        // subir o bajar si las ruedas no tocan el suelo de la foto
    duracion: 3500,   // milisegundos que tarda en cruzar
  },

  // Interior del bus. Piso, paredes, ventanas, techo y pasamanos se dibujan por
  // código; estos modelos son las piezas que se colocan adentro. Si un archivo no
  // existe, se dibuja un reemplazo con cajas (el conductor simplemente no aparece).
  interior: {
    // Interior en una sola pieza (opcional). Si este archivo existe, reemplaza todo
    // el interior armado por piezas. "largo" en metros; "giro" para que el frente
    // del bus quede hacia atrás del viajero; "posicion" para acomodarlo.
    completo: { modelo: 'assets/modelos/bus-interior.glb', largo: 9, giro: 0, posicion: '0 0 -3' },
    filas: 7, // filas de sillas a cada lado del pasillo
    velocidad: 9, // metros por segundo a los que avanza el bus
    // Animales al borde de la vía. Si existe el modelo GLB se usa; si no, se dibuja
    // uno provisional con cajas. "alto" en metros.
    animales: [
      { nombre: 'vaca', modelo: 'assets/modelos/vaca.glb', alto: 1.4, color: '#e8e2d6' },
      { nombre: 'oveja', modelo: 'assets/modelos/oveja.glb', alto: 0.9, color: '#d8d0bd' },
      { nombre: 'perro', modelo: 'assets/modelos/perro.glb', alto: 0.6, color: '#8a6a48' },
    ],
    silla: { modelo: 'assets/modelos/silla.glb', alto: 1.1, giro: 0 }, // debe mirar hacia el frente del bus
    cabina: { modelo: 'assets/modelos/cabina.glb', alto: 1.0, giro: 180 },              // tablero con volante
    sillaConductor: { modelo: 'assets/modelos/silla-conductor.glb', alto: 1.5, giro: 0 },
    conductor: { modelo: 'assets/modelos/conductor-persona.glb', alto: 1.4, giro: 0 },
    escaleras: { modelo: 'assets/modelos/escaleras.glb', largo: 1.15, giro: -90 },       // bajan del pasillo hacia la puerta
    puerta: { modelo: 'assets/modelos/puerta.glb', alto: 2.3, giro: 0, posicion: '-0.78 -0.62 1.6' }, // plegada contra el marco delantero, sin tapar la entrada
  },

  // Puntos del territorio. De 80 a 100 sigue verde (conservado); de 40 a 79 está
  // en riesgo; por debajo de 40, afectado. El paisaje se apaga de forma gradual.
  // Reparto actual de lo que se puede perder: tienda 20, carretera 30, parada 50.
  puntos: { inicio: 100, conservado: 80, riesgo: 40 },

  nodos: [
    {
      id: 'tienda',
      lugar: 'Tunja · Tienda',
      foto360: 'assets/360/nodo0-tienda.jpg',
      cobertura: 120,
      audio: 'assets/audio/nodo0-tienda.mp3',
      ambiente: 'pueblo',
      texto: '[Nodo 0: texto que orienta al viajero a su primera decisión]',
      // La tienda se abre tocando el punto "Comprar" dentro de la escena.
      puntosDeInteres: [
        { tipo: 'abrir', etiqueta: 'Comprar', pista: '[Pista para que el viajero toque la tienda]', angulo: 0, altura: 8 },
      ],
      decisiones: [
        {
          tipo: 'vitrina',
          pregunta: '¿Qué se le ofrece, {nombre}?',
          // Cada grupo es una fila: la opción responsable al lado de las de riesgo.
          // El viajero elige una por fila. "puntos" resta (negativo) o no afecta (0).
          // "imagen": foto en assets/images/; si no existe, sale la inicial.
          // Las alternativas salen de las recomendaciones de Parques Nacionales
          // (elementos reutilizables y bolsa para sacar los residuos).
          grupos: [
            {
              titulo: 'Para tomar',
              opciones: [
                { texto: 'Termo reutilizable', puntos: 0, lleva: 'Termo', imagen: 'assets/images/termo.jpg' },
                { texto: 'Gaseosa en vidrio', puntos: -5, lleva: 'Botella de vidrio', imagen: 'assets/images/gaseosa-vidrio.jpg' },
                { texto: 'Botella plástica', puntos: -5, lleva: 'Botella plástica', imagen: 'assets/images/botella-plastica.jpg' },
              ],
            },
            {
              titulo: 'Para el camino',
              opciones: [
                { texto: 'No llevar', puntos: 0, imagen: 'assets/images/no-llevar.svg' },
                { texto: 'Cigarrillos y encendedor', puntos: -10, lleva: 'Cigarrillos', imagen: 'assets/images/cigarrillos.jpg' },
              ],
            },
            {
              titulo: 'Para los residuos',
              opciones: [
                { texto: 'Bolsa para sacar la basura', puntos: 0, lleva: 'Bolsa para residuos', imagen: 'assets/images/bolsa-residuos.jpg' },
                { texto: 'No llevar', puntos: -5, imagen: 'assets/images/no-llevar.svg' },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'carretera',
      lugar: 'Carretera',
      interior: true, // este nodo se vive dentro del bus; la foto se ve por las ventanas
      enMovimiento: true, // el bus va andando
      entorno: 'carretera', // paisaje en 3D que se mueve: vía, pasto, árboles y animales (no usa la foto)
      foto360: 'assets/360/nodo1-carretera.jpg',
      cobertura: 120,
      audio: 'assets/audio/nodo1-carretera.mp3',
      ambiente: 'motor',
      texto: '[Nodo 1: situación en el bus, durante el recorrido]',
      // Un residuo en el pasillo: hay que caminar hasta él para recogerlo.
      puntosDeInteres: [
        { tipo: 'recoger', etiqueta: 'Recoger', forma: 'papel', posicion: '0.1 0.02 -4.6', cerca: 2.5, puntos: 5 },
      ],
      decisiones: [
        {
          pregunta: '[Qué hacer con el residuo o elemento]',
          opciones: [
            { texto: 'Guardar la basura', puntos: 0, consecuencia: '[Consecuencia de guardarla]' },
            { texto: 'Botarla por la ventana', puntos: -30, consecuencia: '[Consecuencia de botarla, sin alarmismo]' },
          ],
        },
      ],
    },
    {
      id: 'parada',
      lugar: 'Parada cerca de Chíquiza',
      foto360: 'assets/360/nodo2-parada.jpg',
      cobertura: 120,
      audio: 'assets/audio/nodo2-parada.mp3',
      ambiente: 'pueblo',
      texto: '[Nodo 2: situación en la parada de onces]',
      puntosDeInteres: [
        { tipo: 'recoger', etiqueta: 'Recoger', forma: 'botella', angulo: -35, altura: -22, distancia: 4, puntos: 5 },
      ],
      decisiones: [
        {
          pregunta: '[Dónde y cómo dejar el elemento]',
          opciones: [
            { texto: 'Clasificar y botar bien', puntos: 0, consecuencia: '[Consecuencia de la disposición adecuada]' },
            { texto: 'Dejar la basura en el piso', puntos: -50, consecuencia: '[Consecuencia del abandono, sin alarmismo]' },
          ],
        },
      ],
    },
  ],

  final: {
    lugar: 'Santuario de Iguaque',
    foto360: 'assets/360/final-conservado.jpg',
    cobertura: 120,
    // Una imagen por estado. Si se borra este bloque, se usa siempre "foto360"
    // y el cambio de estado lo da solo el filtro de color.
    fotoPorEstado: {
      conservado: 'assets/360/final-conservado.jpg',
      riesgo: 'assets/360/final-riesgo.jpg',
      afectado: 'assets/360/final-afectado.jpg',
    },
    audio: 'assets/audio/final-paramo.mp3',
    ambiente: 'paramo',
    // Dato verificado que da sentido al resultado (con su fuente).
    dato: '[Dato territorial verificado]',
    fuenteDato: '[Fuente y año]',
  },

  // El mensaje de cada estado es texto de pantalla: lo redacta el equipo.
  estados: {
    conservado: { nombre: 'Territorio conservado', mensaje: '[Mensaje del estado conservado]' },
    riesgo: { nombre: 'Territorio en riesgo', mensaje: '[Mensaje del estado en riesgo]' },
    afectado: { nombre: 'Territorio afectado', mensaje: '[Mensaje del estado afectado]' },
  },

  llamado: {
    titulo: '[Llamado a la acción]',
    texto: '[Acción concreta que el viajero puede hacer después del recorrido]',
    boton: '[Texto del botón]',
    enlace: '', // URL del canal institucional, si aplica
  },

  // Solo fuentes que un integrante haya abierto y verificado.
  fuentes: [
    { dato: '90 % de probabilidad de El Niño a partir de septiembre de 2026', fuente: 'IDEAM y Minambiente, 11 de abril de 2026', url: 'https://www.ideam.gov.co/sala-de-prensa/noticia/ideam-y-minambiente-alertan-de-90-de-probabilidad-de-llegada-del-fenomeno-de-el-nino-para-septiembre' },
    { dato: 'Línea gratuita de la UNGRD: 01-8000-113200', fuente: 'UNGRD, 6 de agosto de 2026', url: 'https://portal.gestiondelriesgo.gov.co/Paginas/Noticias/2026/Incendios-forestales-en-Colombia-el-SNGRD-actua-en-el-marco-del-Decreto-de-Desastre-Nacional.aspx' },
  ],
};
