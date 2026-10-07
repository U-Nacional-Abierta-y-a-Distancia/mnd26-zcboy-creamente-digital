/* Motor del recorrido. El contenido vive en data/guion.js. */
(function () {
  'use strict';

  const G = window.GUION;
  const $ = (id) => document.getElementById(id);
  const el = {
    barra: $('barra'), ruta: $('ruta'), estadoNombre: $('estado-nombre'), mochila: $('mochila'),
    lugar: $('lugar'), titulo: $('titulo'), texto: $('texto'), pregunta: $('pregunta'),
    opciones: $('opciones'), dato: $('dato'), acciones: $('acciones'),
    cielo: $('cielo'), ambiente: $('ambiente'), tarjeta: $('tarjeta'), bus: $('bus'), interior: $('interior'), escena: $('escena'), viajero: $('viajero'),
    caminar: $('caminar'), adelante: $('caminar-adelante'), atras: $('caminar-atras'),
    camara: $('camara'), video: $('video'), camaraEstado: $('camara-estado'), camaraCerrar: $('camara-cerrar'),
    fuentes: $('fuentes'), fuentesLista: $('fuentes-lista'),
  };

  // Tinte del cielo por estado: también se ve dentro de un visor de realidad virtual,
  // donde los filtros CSS no aplican.
  const TINTE = { conservado: '#ffffff', riesgo: '#ead9bd', afectado: '#b9966c' };

  const paradas = G.nodos.map((n) => n.lugar).concat([G.final.lugar]);
  let s; // estado de la partida

  function reiniciar() {
    s = { nodo: 0, decision: 0, riesgo: 0, lleva: [] };
    pintarEstado();
    pantallaInicio();
  }

  function estadoActual() {
    if (s.riesgo === 0) return 'conservado';
    return s.riesgo >= G.umbralAfectado ? 'afectado' : 'riesgo';
  }

  function pintarEstado() {
    const e = estadoActual();
    document.body.dataset.estado = e;
    el.estadoNombre.textContent = G.estados[e].nombre;
    materialCielo().color.set(TINTE[e]);
    el.mochila.replaceChildren(...s.lleva.map((t) => crear('li', t)));
  }

  function pintarRuta(actual) {
    el.ruta.replaceChildren(...paradas.map((nombre, i) => {
      const li = crear('li', nombre);
      if (i < actual) li.className = 'hecho';
      if (i === actual) { li.className = 'actual'; li.setAttribute('aria-current', 'step'); }
      return li;
    }));
  }

  // ---------- Pantallas ----------
  function pantallaInicio() {
    document.body.dataset.pantalla = 'inicio';
    el.barra.hidden = true;
    mostrarInterior(false);
    ponerEscena(G.nodos[0]);
    escribir({ lugar: G.territorio, titulo: G.titulo, texto: G.presentacion });
    botones(el.acciones, [
      { texto: 'Comenzar el recorrido', clase: 'principal', alHacer: () => { sonar(G.nodos[0].audio); irANodo(0); } },
      { texto: 'Ver fuentes', clase: 'discreto', alHacer: abrirFuentes },
    ]);
  }

  function irANodo(i) {
    s.nodo = i; s.decision = 0;
    document.body.dataset.pantalla = 'nodo';
    el.barra.hidden = false;
    pintarRuta(i);
    const llegar = () => {
      mostrarInterior(!!G.nodos[i].interior, !!G.nodos[i].enMovimiento);
      sonar(G.nodos[i].audio);
      pantallaDecision();
    };
    mostrarInterior(false);
    if (i === 0) { ponerEscena(G.nodos[i]); llegar(); return; }
    viajar(() => ponerEscena(G.nodos[i])).then(llegar);
  }

  function pantallaDecision() {
    const nodo = G.nodos[s.nodo];
    const d = nodo.decisiones[s.decision];
    escribir({ lugar: nodo.lugar, texto: s.decision === 0 ? nodo.texto : '', pregunta: d.pregunta });
    el.opciones.className = d.opciones.length === 2 ? 'pares' : '';
    // El orden se baraja para que la opción responsable no esté siempre en el mismo sitio.
    botones(el.opciones, barajar(d.opciones).map((o) => ({ texto: o.texto, imagen: o.imagen, alHacer: () => elegir(o) })));
  }

  function elegir(opcion) {
    s.riesgo += opcion.riesgo || 0;
    if (opcion.lleva) s.lleva.push(opcion.lleva);
    pintarEstado();
    if (opcion.consecuencia) {
      escribir({ lugar: G.nodos[s.nodo].lugar, texto: opcion.consecuencia });
      botones(el.acciones, [{ texto: 'Continuar', clase: 'principal', alHacer: avanzar }]);
    } else {
      avanzar();
    }
  }

  function avanzar() {
    const nodo = G.nodos[s.nodo];
    if (s.decision + 1 < nodo.decisiones.length) { s.decision += 1; pantallaDecision(); return; }
    if (s.nodo + 1 < G.nodos.length) { irANodo(s.nodo + 1); return; }
    pantallaFinal();
  }

  function pantallaFinal() {
    const e = estadoActual();
    document.body.dataset.pantalla = 'final';
    pintarRuta(paradas.length - 1);
    mostrarInterior(false);
    viajar(() => ponerEscena(G.final)).then(() => mostrarFinal(e));
  }

  function mostrarFinal(e) {
    sonar(G.final.audio);
    escribir({ lugar: G.final.lugar, titulo: G.estados[e].nombre, texto: G.estados[e].mensaje });
    el.dato.hidden = false;
    el.dato.replaceChildren(document.createTextNode(G.final.dato), crear('small', G.final.fuenteDato));
    botones(el.acciones, [
      { texto: 'Continuar', clase: 'principal', alHacer: pantallaLlamado },
      { texto: 'Ver este estado en mi entorno (cámara)', alHacer: abrirCamara },
    ]);
  }

  function pantallaLlamado() {
    document.body.dataset.pantalla = 'llamado';
    escribir({ titulo: G.llamado.titulo, texto: G.llamado.texto });
    const lista = [];
    if (G.llamado.enlace) lista.push({ texto: G.llamado.boton, clase: 'principal', alHacer: () => window.open(G.llamado.enlace, '_blank', 'noopener') });
    lista.push({ texto: 'Repetir el recorrido', clase: G.llamado.enlace ? '' : 'principal', alHacer: reiniciar });
    lista.push({ texto: 'Ver fuentes', clase: 'discreto', alHacer: abrirFuentes });
    botones(el.acciones, lista);
  }

  // ---------- Utilidades de interfaz ----------
  function escribir({ lugar = '', titulo = '', texto = '', pregunta = '' }) {
    el.lugar.textContent = lugar;
    el.titulo.textContent = titulo;
    el.texto.textContent = texto;
    el.pregunta.textContent = pregunta;
    el.opciones.replaceChildren();
    el.acciones.replaceChildren();
    el.dato.hidden = true;
  }

  function botones(contenedor, lista) {
    contenedor.replaceChildren(...lista.map((b) => {
      const boton = crear('button', b.texto);
      boton.type = 'button';
      if (b.clase) boton.className = b.clase;
      if (b.imagen) {
        const foto = document.createElement('img');
        foto.src = b.imagen; foto.alt = '';
        foto.onerror = () => foto.remove(); // si la foto aún no existe, queda solo el texto
        boton.prepend(foto);
        boton.classList.add('con-foto');
      }
      boton.addEventListener('click', b.alHacer);
      return boton;
    }));
    const primero = contenedor.querySelector('button');
    if (primero) primero.focus({ preventScroll: true });
  }

  function crear(etiqueta, texto) {
    const n = document.createElement(etiqueta);
    n.textContent = texto;
    return n;
  }

  function barajar(lista) {
    const copia = lista.slice();
    for (let i = copia.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
  }

  // ---------- Escena 360° ----------
  let pedidoCielo = 0;
  const materialCielo = () => el.cielo.getObject3D('mesh').material;

  function ponerEscena(nodo) {
    el.cielo.setAttribute('rotation', `0 ${-90 + (nodo.giroFoto || 0)} 0`);
    const mio = ++pedidoCielo; // si llega otra escena antes de cargar esta, se descarta
    const img = new Image();
    img.onload = () => {
      if (mio !== pedidoCielo) return;
      // Una foto 360° completa mide el doble de ancho que de alto. Cualquier otra
      // proporción se trata como panorámica de celular y se adapta.
      const completa = Math.abs(img.width / img.height - 2) < 0.05;
      aplicarCielo(completa ? img : panoramicaA360(img, nodo.cobertura || 360));
    };
    img.onerror = () => { if (mio === pedidoCielo) aplicarCielo(fondoProvisional(nodo.lugar)); };
    img.src = nodo.foto360;
  }

  // Pone una imagen o un lienzo como textura del cielo.
  function aplicarCielo(fuente) {
    const material = materialCielo();
    const textura = new THREE.Texture(fuente);
    textura.colorSpace = THREE.SRGBColorSpace;
    textura.needsUpdate = true;
    if (material.map) material.map.dispose();
    material.map = textura;
    material.needsUpdate = true;
  }

  // Convierte una panorámica de celular en una imagen 360°: la foto queda como una
  // franja a la altura de los ojos, y arriba y abajo se rellena con los colores
  // del borde de la propia foto (cielo y suelo). "cobertura" son los grados que
  // abarca la panorámica; si no da la vuelta completa, se repite en espejo.
  function panoramicaA360(img, cobertura) {
    const W = 4096, H = 2048;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const x = c.getContext('2d');

    const anchoFoto = Math.round(W * Math.min(cobertura, 360) / 360);
    const campoVertical = 2 * Math.atan((img.height / img.width) * (cobertura * Math.PI / 180) / 2);
    const altoFoto = Math.min(H, Math.round(H * campoVertical / Math.PI));
    const arriba = Math.round((H - altoFoto) / 2);

    const [colorCielo, colorSuelo] = coloresDeBorde(img);
    x.fillStyle = colorCielo; x.fillRect(0, 0, W, H / 2);
    x.fillStyle = colorSuelo; x.fillRect(0, H / 2, W, H / 2);

    for (let px = 0, espejo = false; px < W; px += anchoFoto, espejo = !espejo) {
      x.save();
      if (espejo) { x.translate(px + anchoFoto, 0); x.scale(-1, 1); x.drawImage(img, 0, arriba, anchoFoto, altoFoto); }
      else x.drawImage(img, px, arriba, anchoFoto, altoFoto);
      x.restore();
    }

    // Difumina la unión entre la foto y el relleno.
    const borde = Math.round(altoFoto * 0.12);
    const sup = x.createLinearGradient(0, arriba, 0, arriba + borde);
    sup.addColorStop(0, colorCielo); sup.addColorStop(1, transparente(colorCielo));
    x.fillStyle = sup; x.fillRect(0, arriba, W, borde);
    const inf = x.createLinearGradient(0, arriba + altoFoto - borde, 0, arriba + altoFoto);
    inf.addColorStop(0, transparente(colorSuelo)); inf.addColorStop(1, colorSuelo);
    x.fillStyle = inf; x.fillRect(0, arriba + altoFoto - borde, W, borde);

    return c;
  }

  // Color promedio de la franja superior e inferior de la foto.
  function coloresDeBorde(img) {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(img, 0, 0, 64, 64);
    const promedio = (y) => {
      const d = x.getImageData(0, y, 64, 3).data;
      let r = 0, g = 0, b = 0;
      for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
      const n = d.length / 4;
      return `rgb(${Math.round(r / n)}, ${Math.round(g / n)}, ${Math.round(b / n)})`;
    };
    return [promedio(0), promedio(61)];
  }
  const transparente = (rgb) => rgb.replace('rgb(', 'rgba(').replace(')', ', 0)');

  // Fondo de reemplazo mientras el equipo toma la foto 360° del lugar.
  function fondoProvisional(nombre) {
    const c = document.createElement('canvas');
    c.width = 2048; c.height = 1024;
    const x = c.getContext('2d');
    const cielo = x.createLinearGradient(0, 0, 0, 560);
    cielo.addColorStop(0, '#7fb2d9'); cielo.addColorStop(1, '#dfeef5');
    x.fillStyle = cielo; x.fillRect(0, 0, 2048, 560);
    const suelo = x.createLinearGradient(0, 520, 0, 1024);
    suelo.addColorStop(0, '#7da35f'); suelo.addColorStop(1, '#3f6b3a');
    x.fillStyle = suelo; x.fillRect(0, 520, 2048, 504);
    x.fillStyle = '#5b8a6a';
    x.beginPath(); x.moveTo(0, 540);
    for (let i = 0; i <= 2048; i += 64) x.lineTo(i, 470 + 55 * Math.sin(i / 163) + 30 * Math.sin(i / 71));
    x.lineTo(2048, 540); x.closePath(); x.fill();
    x.fillStyle = 'rgba(20,33,28,.8)'; x.font = '600 44px system-ui, sans-serif'; x.textAlign = 'center';
    [512, 1536].forEach((px) => {
      x.fillText('Foto 360° pendiente', px, 380);
      x.fillText(nombre, px, 436);
    });
    return c;
  }

  // ---------- Bus entre paradas ----------
  const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function prepararBus() {
    const b = G.bus || {};
    ponerModelo(el.bus, { modelo: b.modelo, giro: b.giro, largo: b.largo || 6.5 }, busProvisional);
  }

  // Bus de reemplazo, hecho con cajas, mientras llega el modelo 3D.
  function busProvisional(padre) {
    pieza(padre, 'a-box', { position: '0 1.5 0', width: 6, height: 2.1, depth: 2.2, color: '#ece7da' });
    pieza(padre, 'a-box', { position: '0 0.95 0', width: 6.02, height: 0.45, depth: 2.22, color: '#1f5c4a' });
    pieza(padre, 'a-box', { position: '0.2 1.95 0', width: 5.2, height: 0.75, depth: 2.24, color: '#27343a' });
    [-1.9, 1.9].forEach((x) => [-1.05, 1.05].forEach((z) => {
      pieza(padre, 'a-cylinder', { position: `${x} 0.45 ${z}`, radius: 0.45, height: 0.3, rotation: '90 0 0', color: '#1b1b1b' });
    }));
  }

  // ---------- Modelos 3D ----------
  const THREE = window.AFRAME.THREE;
  const existe = {};

  function pieza(padre, tipo, atributos) {
    const n = document.createElement(tipo);
    Object.entries(atributos).forEach(([k, v]) => n.setAttribute(k, v));
    padre.appendChild(n);
    return n;
  }

  function hayArchivo(ruta) {
    if (!ruta) return Promise.resolve(false);
    if (!existe[ruta]) existe[ruta] = fetch(ruta, { method: 'HEAD' }).then((r) => r.ok).catch(() => false);
    return existe[ruta];
  }

  // Coloca un modelo GLB dentro de "padre" y lo ajusta al tamaño real indicado en
  // "cfg" (alto o largo, en metros), centrado y apoyado en el suelo. Si el archivo
  // no existe, llama a "provisional" para dibujar un reemplazo con figuras simples.
  function ponerModelo(padre, cfg, provisional, posicion) {
    const soporte = pieza(padre, 'a-entity', { rotation: `0 ${cfg.giro || 0} 0`, position: posicion || '0 0 0' });
    hayArchivo(cfg.modelo).then((si) => {
      if (!si) { if (provisional) provisional(soporte); return; }
      const modelo = document.createElement('a-entity');
      modelo.addEventListener('model-loaded', () => ajustarTamano(modelo, cfg));
      modelo.setAttribute('gltf-model', cfg.modelo);
      soporte.appendChild(modelo);
    });
    return soporte;
  }

  function ajustarTamano(modelo, cfg) {
    const obj = modelo.getObject3D('mesh');
    el.escena.object3D.updateMatrixWorld(true);
    const caja = new THREE.Box3().setFromObject(obj);
    caja.applyMatrix4(new THREE.Matrix4().copy(modelo.object3D.matrixWorld).invert());
    const t = caja.getSize(new THREE.Vector3());
    const c = caja.getCenter(new THREE.Vector3());
    const k = cfg.alto ? cfg.alto / t.y : cfg.largo / Math.max(t.x, t.z);
    obj.scale.multiplyScalar(k);
    obj.position.multiplyScalar(k).sub(new THREE.Vector3(c.x * k, caja.min.y * k, c.z * k));
  }

  // ---------- Interior del bus ----------
  // Medidas en metros. El frente del bus queda hacia +Z y la puerta a la izquierda
  // de quien entra mirando hacia el fondo. La cámara queda parada junto a la entrada.
  function prepararInterior() {
    const I = G.interior;
    if (!I) return;
    const raiz = el.interior;
    raiz.setAttribute('position', '0.45 0 -0.9');

    const paso = 0.85, ancho = 2.4, techo = 2.15;
    const frente = 2.4, fondo = -(0.3 + I.filas * paso + 0.3);
    const largo = frente - fondo, medio = (frente + fondo) / 2;
    const caja = (x, y, z, w, h, d, color) => pieza(raiz, 'a-box', {
      position: `${x} ${y} ${z}`, width: w, height: h, depth: d, material: `color: ${color}; roughness: 0.9`,
    });

    caja(0, -0.05, medio, ancho, 0.1, largo, '#2c3136');            // piso
    caja(0, 0.005, medio, 0.55, 0.01, largo, '#3c434a');            // pasillo
    caja(0, techo + 0.05, medio, ancho, 0.1, largo, '#e9e5db');     // techo
    caja(0, techo / 2, fondo, ancho, techo, 0.08, '#d9d4c7');       // pared del fondo
    caja(0, 0.5, frente, ancho, 1.0, 0.08, '#3a3f45');              // frente, bajo el parabrisas
    caja(0, techo - 0.15, frente, ancho, 0.3, 0.08, '#d9d4c7');     // frente, sobre el parabrisas

    // Paredes laterales: franja baja, franja alta y parales. Entre ellas quedan
    // las ventanas abiertas, por donde se ve la foto del lugar.
    const pared = (x, z0, z1) => {
      const m = (z0 + z1) / 2, l = z1 - z0;
      caja(x, 0.475, m, 0.08, 0.95, l, '#d9d4c7');
      caja(x, techo - 0.175, m, 0.08, 0.35, l, '#d9d4c7');
      for (let z = z0; z <= z1 + 0.01; z += 1.3) caja(x, 1.375, z, 0.08, 0.85, 0.1, '#c7c1b3');
    };
    pared(ancho / 2, fondo, frente);
    pared(-ancho / 2, fondo, 0.35);       // la puerta ocupa de z = 0.35 a z = 1.65
    pared(-ancho / 2, 1.65, frente);
    caja(-ancho / 2, techo - 0.175, 1.0, 0.08, 0.35, 1.3, '#d9d4c7');

    [-0.32, 0.32].forEach((x) => pieza(raiz, 'a-cylinder', {  // pasamanos del techo
      position: `${x} ${techo - 0.2} ${medio}`, radius: 0.018, height: largo - 0.6, rotation: '90 0 0',
      material: 'color: #c9cdd1; metalness: 0.7; roughness: 0.35',
    }));
    const largoRejilla = -fondo - 0.2; // portaequipajes, sobre las sillas
    [-0.93, 0.93].forEach((x) => caja(x, 1.8, fondo + largoRejilla / 2, 0.5, 0.04, largoRejilla, '#bdb7a8'));

    for (let i = 0; i < I.filas; i += 1) {
      const z = -0.3 - i * paso;
      [-0.72, 0.72].forEach((x) => ponerModelo(raiz, I.silla, sillaProvisional, `${x} 0 ${z}`));
    }
    // Puesto del conductor, al frente a la izquierda del bus: tablero contra el
    // parabrisas, y detrás la silla con el conductor mirando hacia adelante.
    ponerModelo(raiz, I.cabina, cabinaProvisional, '0.5 0 1.93');
    if (I.sillaConductor) ponerModelo(raiz, I.sillaConductor, null, '0.82 0 1.33');
    ponerModelo(raiz, I.conductor, null, '0.82 0 1.47');
    caja(0.82, 0.25, 1.36, 0.52, 0.5, 0.56, '#26292d'); // base de la silla del conductor
    prepararCamino(fondo);
    prepararPaisaje(raiz);
    // Las escaleras quedan por fuera de la puerta, bajando desde el nivel del piso.
    hayArchivo(I.escaleras.modelo).then((si) => {
      ponerModelo(raiz, I.escaleras, escalerasProvisional, si ? '-1.75 -0.55 1.0' : '-0.98 0 1.0');
    });
  }

  // ---------- Caminar por el bus ----------
  // El viajero se mueve por un camino fijo: de la entrada al pasillo y por el
  // pasillo hasta el fondo. "avance" son los metros recorridos sobre ese camino.
  let camino = [[0, 0]], largoCamino = 0, avance = 0, meta = 0, andando = false;
  const PASO = 1.7; // metros por cada toque: dos filas de sillas

  function prepararCamino(fondo) {
    // Puntos (x, z) de la escena: entrada, inicio del pasillo y fondo del bus.
    camino = [[0, 0], [0.45, -0.7], [0.45, fondo + 0.3]];
    largoCamino = 0;
    for (let i = 1; i < camino.length; i += 1) largoCamino += distancia(camino[i - 1], camino[i]);
    el.adelante.addEventListener('click', () => caminar(PASO));
    el.atras.addEventListener('click', () => caminar(-largoCamino));
    document.addEventListener('keydown', (ev) => {
      if (el.caminar.hidden) return;
      if (ev.key === 'ArrowUp' || ev.key === 'w') caminar(PASO);
      if (ev.key === 'ArrowDown' || ev.key === 's') caminar(-PASO);
    });
  }

  const distancia = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);

  function puntoDelCamino(metros) {
    let resto = metros;
    for (let i = 1; i < camino.length; i += 1) {
      const tramo = distancia(camino[i - 1], camino[i]);
      if (resto <= tramo || i === camino.length - 1) {
        const t = tramo ? Math.min(1, resto / tramo) : 0;
        return [camino[i - 1][0] + (camino[i][0] - camino[i - 1][0]) * t, camino[i - 1][1] + (camino[i][1] - camino[i - 1][1]) * t];
      }
      resto -= tramo;
    }
    return camino[0];
  }

  function ubicarViajero() {
    const [x, z] = puntoDelCamino(avance);
    el.viajero.setAttribute('position', { x, y: 0, z });
    el.adelante.disabled = meta >= largoCamino - 0.01;
    el.atras.disabled = meta <= 0.01;
  }

  function caminar(metros) {
    meta = Math.max(0, Math.min(largoCamino, meta + metros));
    if (sinMovimiento) { avance = meta; ubicarViajero(); return; }
    if (andando) return;
    andando = true;
    let antes = performance.now();
    (function cuadro(ahora) {
      const paso = 1.6 * (ahora - antes) / 1000; // velocidad: 1,6 metros por segundo
      antes = ahora;
      avance = Math.abs(meta - avance) <= paso ? meta : avance + Math.sign(meta - avance) * paso;
      ubicarViajero();
      if (avance !== meta) { requestAnimationFrame(cuadro); return; }
      andando = false;
    }(antes));
  }

  // Muestra u oculta el interior. Al salir, el viajero vuelve al punto de partida.
  function mostrarInterior(si, enMovimiento) {
    el.interior.setAttribute('visible', si);
    const arrancar = !!(si && enMovimiento && !sinMovimiento);
    if (arrancar && !enViaje) { enViaje = true; animarViaje(performance.now()); }
    enViaje = arrancar;
    el.caminar.hidden = !si || largoCamino === 0;
    avance = 0; meta = 0;
    ubicarViajero();
  }

  // ---------- Bus en movimiento ----------
  // La foto del paisaje es fija; la sensación de avance la dan postes que pasan
  // por fuera de las ventanas, de adelante hacia atrás, y un temblor leve.
  const pasantes = [];
  let enViaje = false;

  function prepararPaisaje(raiz) {
    const grupo = pieza(raiz, 'a-entity', {});
    // Postes al borde de la vía: cerca por el lado de la puerta y lejos por el otro,
    // para que ninguno quede sobre el carril contrario.
    for (let i = 0; i < 8; i += 1) {
      [[-3.1, 0], [7.5, 6]].forEach(([x, desfase]) => {
        pasantes.push(pieza(grupo, 'a-cylinder', {
          position: `${x} 1.6 ${-48 + i * 12 + desfase}`, radius: 0.09, height: 5.2, material: 'color: #5b4a3a; roughness: 1',
        }));
      });
    }
    pasantes.forEach((o) => o.setAttribute('visible', false));
  }

  function animarViaje(antes) {
    requestAnimationFrame((ahora) => {
      const cuerpo = el.viajero.object3D;
      pasantes.forEach((o) => { o.object3D.visible = enViaje; });
      if (!enViaje) { cuerpo.position.y = 0; cuerpo.rotation.z = 0; return; }
      const dt = Math.min(0.05, (ahora - antes) / 1000);
      const velocidad = (G.interior && G.interior.velocidad) || 9; // metros por segundo
      pasantes.forEach((o) => {
        const pos = o.object3D.position;
        pos.z -= velocidad * dt;
        if (pos.z < -48) pos.z += 96;
      });
      const t = ahora / 1000;
      cuerpo.position.y = 0.006 * Math.sin(t * 17) + 0.004 * Math.sin(t * 31);
      cuerpo.rotation.z = 0.0025 * Math.sin(t * 2.3);
      animarViaje(ahora);
    });
  }

  function sillaProvisional(padre) {
    const tela = 'color: #3f6b8c; roughness: 1';
    pieza(padre, 'a-box', { position: '0 0.45 0.02', width: 0.92, height: 0.12, depth: 0.46, material: tela });
    pieza(padre, 'a-box', { position: '0 0.82 -0.22', width: 0.92, height: 0.7, depth: 0.1, material: tela });
    pieza(padre, 'a-box', { position: '0 0.2 0', width: 0.8, height: 0.38, depth: 0.06, material: 'color: #8b9096; metalness: 0.6' });
  }

  function cabinaProvisional(padre) {
    sillaProvisional(pieza(padre, 'a-entity', { scale: '0.55 1 1', position: '0 0 -0.25' }));
    pieza(padre, 'a-box', { position: '0 0.85 0.62', width: 1.1, height: 0.45, depth: 0.35, material: 'color: #2a2e33; roughness: 0.8' });
    pieza(padre, 'a-torus', { position: '0 1.05 0.3', radius: 0.2, 'radius-tubular': 0.02, rotation: '-55 0 0', material: 'color: #15171a' });
  }

  function escalerasProvisional(padre) {
    pieza(padre, 'a-box', { position: '0 0.01 0', width: 0.4, height: 0.02, depth: 1.2, material: 'color: #e2b93b' });
    pieza(padre, 'a-cylinder', { position: '-0.12 1.0 0.6', radius: 0.02, height: 2.0, material: 'color: #c9cdd1; metalness: 0.7; roughness: 0.35' });
  }

  // Hace cruzar el bus de izquierda a derecha. "aMitad" se ejecuta cuando el bus
  // tapa el centro de la vista: ahí se cambia la foto del lugar.
  function viajar(aMitad) {
    const b = G.bus || {};
    if (sinMovimiento) { aMitad(); return Promise.resolve(); }
    el.tarjeta.hidden = true;
    el.bus.setAttribute('visible', true);
    const duracion = b.duracion || 3500;
    const inicio = performance.now();
    let cambiado = false;
    return new Promise((resolver) => {
      (function cuadro(ahora) {
        const t = Math.min(1, (ahora - inicio) / duracion);
        const suave = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        el.bus.setAttribute('position', { x: -16 + 32 * suave, y: b.altura || 0, z: -7 });
        if (!cambiado && t >= 0.5) { cambiado = true; aMitad(); }
        if (t < 1) { requestAnimationFrame(cuadro); return; }
        el.bus.setAttribute('visible', false);
        el.tarjeta.hidden = false;
        resolver();
      }(inicio));
    });
  }

  // ---------- Sonido ambiente (opcional) ----------
  function sonar(ruta) {
    if (!ruta || el.ambiente.dataset.ruta === ruta) return;
    el.ambiente.dataset.ruta = ruta;
    el.ambiente.src = ruta;
    el.ambiente.volume = 0.6;
    el.ambiente.play().catch(() => {}); // si el archivo no existe o el navegador lo bloquea, se sigue sin sonido
  }

  // ---------- Vista con cámara ----------
  let flujo = null;
  async function abrirCamara() {
    const e = estadoActual();
    try {
      flujo = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
    } catch (err) {
      el.texto.textContent = 'No fue posible abrir la cámara en este dispositivo. Puedes continuar el recorrido sin ella.';
      return;
    }
    el.video.srcObject = flujo;
    el.video.play();
    el.camara.dataset.estado = e;
    el.camaraEstado.textContent = G.estados[e].nombre;
    el.camara.hidden = false;
    el.camaraCerrar.focus();
  }
  function cerrarCamara() {
    if (flujo) flujo.getTracks().forEach((t) => t.stop());
    flujo = null;
    el.video.srcObject = null;
    el.camara.hidden = true;
  }
  el.camaraCerrar.addEventListener('click', cerrarCamara);

  // ---------- Fuentes ----------
  function abrirFuentes() {
    el.fuentesLista.replaceChildren(...G.fuentes.map((f) => {
      const li = crear('li', f.dato + '. ' + f.fuente + '. ');
      if (f.url) {
        const a = crear('a', 'Abrir fuente');
        a.href = f.url; a.target = '_blank'; a.rel = 'noopener';
        li.appendChild(a);
      }
      return li;
    }));
    el.fuentes.showModal();
  }

  document.title = G.equipo;
  // Todo arranca cuando la escena 3D ya existe: antes de eso no se pueden
  // cargar modelos ni tocar el cielo.
  const arrancar = () => { prepararBus(); prepararInterior(); reiniciar(); };
  if (el.escena.hasLoaded) arrancar(); else el.escena.addEventListener('loaded', arrancar);
}());
