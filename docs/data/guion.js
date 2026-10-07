/*
 * GUION DE LA EXPERIENCIA — este es el único archivo que el equipo necesita editar.
 *
 * Todo lo que está entre [corchetes] es un texto pendiente por redactar. Las
 * opciones que ya aparecen escritas vienen del documento de trabajo del equipo.
 *
 * Cómo funciona:
 *  - Cada nodo es un momento del recorrido y tiene una o varias decisiones.
 *  - Cada opción suma "riesgo" (0 = responsable, 1 = de riesgo).
 *  - "lleva" es lo que el viajero carga desde esa decisión (se muestra arriba).
 *  - "imagen" (opcional, en cualquier opción): foto pequeña que acompaña el
 *    texto del botón, por ejemplo imagen: 'assets/images/gaseosa-vidrio.jpg'.
 *  - El estado del territorio sale del riesgo acumulado (ver "estados").
 *  - "foto360": imagen en assets/360/. Puede ser una foto 360° completa o una
 *    panorámica normal de celular; la panorámica se adapta sola. Si el archivo no
 *    existe, se muestra un fondo provisional con el nombre del lugar.
 *  - "giroFoto" (opcional, en cualquier nodo): grados para girar la foto y
 *    escoger hacia dónde queda mirando el viajero al llegar.
 *  - "cobertura" (opcional): grados que abarca la panorámica. Por defecto 360
 *    (vuelta completa). Si giraron media vuelta, pongan cobertura: 180.
 *  - "audio": sonido ambiente en assets/audio/ (opcional).
 */
window.GUION = {
  titulo: '[Título de la experiencia]',
  equipo: 'CreaMente Digital',
  territorio: '[Corredor real: municipio de salida → paradas → páramo de llegada]',
  presentacion: '[Texto de inicio: quién es el viajero, a dónde va y por qué importa ahora]',

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
    filas: 7, // filas de sillas a cada lado del pasillo
    velocidad: 9, // metros por segundo a los que pasa el paisaje cercano
    silla: { modelo: 'assets/modelos/silla.glb', alto: 1.1, giro: 0 }, // debe mirar hacia el frente del bus
    cabina: { modelo: 'assets/modelos/cabina.glb', alto: 1.0, giro: 180 },              // tablero con volante
    sillaConductor: { modelo: 'assets/modelos/silla-conductor.glb', alto: 1.5, giro: 0 },
    conductor: { modelo: 'assets/modelos/conductor-persona.glb', alto: 1.4, giro: 0 },
    escaleras: { modelo: 'assets/modelos/escaleras.glb', alto: 1.3, giro: -90 },         // bajan hacia afuera de la puerta
  },

  // Riesgo acumulado a partir del cual el territorio queda "afectado".
  // Con 0 queda "conservado"; entre 1 y este valor menos 1, "en riesgo".
  umbralAfectado: 3,

  nodos: [
    {
      id: 'tienda',
      lugar: 'Tienda',
      foto360: 'assets/360/nodo0-tienda.jpg',
      audio: 'assets/audio/nodo0-tienda.mp3',
      texto: '[Nodo 0: texto que orienta al viajero a su primera decisión]',
      // El equipo debe dejar 2 o 3 de estos productos (ver sección 5.1 del guion).
      decisiones: [
        {
          pregunta: '[Pregunta o situación de compra 1]',
          opciones: [
            { texto: '[Alternativa responsable a la gaseosa en vidrio]', riesgo: 0, lleva: '[alternativa]' },
            { texto: 'Gaseosa en vidrio', riesgo: 1, lleva: 'Botella de vidrio' },
          ],
        },
        {
          pregunta: '[Pregunta o situación de compra 2]',
          opciones: [
            { texto: '[Alternativa responsable a cigarrillos y encendedor]', riesgo: 0, lleva: '[alternativa]' },
            { texto: 'Cigarrillos y encendedor', riesgo: 1, lleva: 'Cigarrillos' },
          ],
        },
        {
          pregunta: '[Pregunta o situación de compra 3]',
          opciones: [
            { texto: '[Alternativa responsable a la botella plástica]', riesgo: 0, lleva: '[alternativa]' },
            { texto: 'Botella plástica', riesgo: 1, lleva: 'Botella plástica' },
          ],
        },
      ],
    },
    {
      id: 'carretera',
      lugar: 'Carretera',
      interior: true, // este nodo se vive dentro del bus; la foto se ve por las ventanas
      enMovimiento: true, // el bus va andando: pasan postes por las ventanas y tiembla un poco
      giroFoto: 0, // grados para girar la foto hasta que la carretera quede a lo largo del bus
      foto360: 'assets/360/nodo1-carretera.jpg',
      audio: 'assets/audio/nodo1-carretera.mp3',
      texto: '[Nodo 1: situación en el bus, durante el recorrido]',
      decisiones: [
        {
          pregunta: '[Qué hacer con el residuo o elemento]',
          opciones: [
            { texto: 'Guardar la basura', riesgo: 0, consecuencia: '[Consecuencia de guardarla]' },
            { texto: 'Botarla por la ventana', riesgo: 1, consecuencia: '[Consecuencia de botarla, sin alarmismo]' },
          ],
        },
      ],
    },
    {
      id: 'parada',
      lugar: 'Parada de onces',
      foto360: 'assets/360/nodo2-parada.jpg',
      audio: 'assets/audio/nodo2-parada.mp3',
      texto: '[Nodo 2: situación en la parada de onces]',
      decisiones: [
        {
          pregunta: '[Dónde y cómo dejar el elemento]',
          opciones: [
            { texto: 'Clasificar y botar bien', riesgo: 0, consecuencia: '[Consecuencia de la disposición adecuada]' },
            { texto: 'Dejar la basura en el piso', riesgo: 1, consecuencia: '[Consecuencia del abandono, sin alarmismo]' },
          ],
        },
      ],
    },
  ],

  final: {
    lugar: '[Páramo de llegada]',
    foto360: 'assets/360/final-paramo.jpg',
    audio: 'assets/audio/final-paramo.mp3',
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
