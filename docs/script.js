/* Motor del recorrido. El contenido vive en data/guion.js. */
(function () {
  'use strict';

  const G = window.GUION;
  const $ = (id) => document.getElementById(id);
  const el = {
    barra: $('barra'), ruta: $('ruta'), estadoNombre: $('estado-nombre'), mochila: $('mochila'),
    lugar: $('lugar'), titulo: $('titulo'), texto: $('texto'), pregunta: $('pregunta'),
    opciones: $('opciones'), dato: $('dato'), acciones: $('acciones'),
    cielo: $('cielo'), ambiente: $('ambiente'), tarjeta: $('tarjeta'), bus: $('bus'), interior: $('interior'), entorno: $('entorno'), escena: $('escena'), viajero: $('viajero'),
    caminar: $('caminar'), adelante: $('caminar-adelante'), atras: $('caminar-atras'),
    camara: $('camara'), video: $('video'), camaraEstado: $('camara-estado'), camaraCerrar: $('camara-cerrar'),
    fuentes: $('fuentes'), fuentesLista: $('fuentes-lista'),
    puntos: $('puntos'), medidor: $('medidor'), relleno: $('medidor-relleno'), aviso: $('aviso'),
    saludo: $('saludo'), nombre: $('nombre'),
    puntosInteres: $('puntos-interes'), sonido: $('sonido'), logo: $('logo'), pistas: $('pistas'),
    vitrina: $('vitrina'), vitrinaTitulo: $('vitrina-titulo'), vitrinaCuenta: $('vitrina-cuenta'),
    vitrinaProductos: $('vitrina-productos'), vitrinaListo: $('vitrina-listo'),
  };

  // Puntos del territorio: se empieza en 100 y cada decisión resta o suma.
  const P = Object.assign({ inicio: 100, conservado: 80, riesgo: 40 }, G.puntos);
  const COLOR_SANO = new window.AFRAME.THREE.Color('#ffffff');
  const COLOR_DANO = new window.AFRAME.THREE.Color('#b9966c');

  const paradas = G.nodos.map((n) => n.lugar).concat([G.final.lugar]);
  let s; // estado de la partida

  // Nombre del viajero. Se pide al empezar y reemplaza a {nombre} en cualquier texto
  // del guion. Solo vive en esta página: no se guarda ni se envía a ningún lado.
  let nombre = G.nombrePorDefecto || 'viajero';
  const conNombre = (texto) => String(texto == null ? '' : texto).replace(/\{nombre\}/g, nombre);

  function reiniciar() {
    s = { nodo: 0, decision: 0, puntos: P.inicio, lleva: [], abierta: false };
    pintarEstado();
    pantallaInicio();
  }

  function estadoActual() {
    if (s.puntos >= P.conservado) return 'conservado';
    return s.puntos >= P.riesgo ? 'riesgo' : 'afectado';
  }

  // El paisaje se apaga de forma gradual: por encima de "conservado" se ve intacto
  // y de ahí hacia abajo pierde color hasta llegar a 0 puntos.
  function pintarEstado() {
    const e = estadoActual();
    const dano = Math.max(0, Math.min(1, (P.conservado - s.puntos) / P.conservado));
    document.body.dataset.estado = e;
    document.body.style.setProperty('--dano', dano.toFixed(3));
    el.estadoNombre.textContent = G.estados[e].nombre;
    el.puntos.textContent = `${s.puntos} / 100`;
    el.medidor.setAttribute('aria-valuenow', s.puntos);
    el.relleno.style.width = `${s.puntos}%`;
    // El tinte del cielo también se ve dentro de un visor de realidad virtual,
    // donde los filtros CSS no aplican.
    materialCielo().color.copy(COLOR_SANO).lerp(COLOR_DANO, dano);
    el.mochila.replaceChildren(...s.lleva.map((t) => crear('li', t)));
  }

  function sumarPuntos(cantidad) {
    if (!cantidad) return;
    s.puntos = Math.max(0, Math.min(100, s.puntos + cantidad));
    pintarEstado();
    avisar(`${cantidad > 0 ? '+' : '−'}${Math.abs(cantidad)} puntos`, cantidad > 0 ? 'bien' : 'mal');
  }

  let relojAviso = 0;
  function avisar(texto, clase) {
    el.aviso.textContent = texto;
    el.aviso.className = clase || '';
    el.aviso.hidden = false;
    clearTimeout(relojAviso);
    relojAviso = setTimeout(() => { el.aviso.hidden = true; }, 1800);
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
    quitarPuntosDeInteres();
    ponerEscena(G.portada || G.nodos[0]);
    callar();
    escribir({ lugar: G.territorio, titulo: G.titulo, texto: G.presentacion });
    botones(el.acciones, [
      { texto: 'Comenzar el recorrido', clase: 'principal', alHacer: pantallaNombre },
      { texto: 'Ver fuentes', clase: 'discreto', alHacer: abrirFuentes },
    ]);
  }

  // Saludo: pregunta el nombre y lo usa durante todo el recorrido.
  function pantallaNombre() {
    document.body.dataset.pantalla = 'nombre';
    // El saludo ocurre ya dentro de la tienda, con el tendero de fondo.
    ponerEscena(G.nodos[0]);
    sonarLugar(G.nodos[0]);
    escribir({ lugar: G.nodos[0].lugar, texto: G.saludo || '' });
    el.saludo.hidden = false;
    el.nombre.focus({ preventScroll: true });
  }

  el.saludo.addEventListener('submit', (ev) => {
    ev.preventDefault();
    // Se toma solo el primer nombre, con mayúscula inicial.
    const primero = el.nombre.value.trim().split(/\s+/)[0] || '';
    if (primero) nombre = primero.charAt(0).toUpperCase() + primero.slice(1).toLowerCase();
    irANodo(0);
  });

  function irANodo(i) {
    s.nodo = i; s.decision = 0; s.abierta = false;
    document.body.dataset.pantalla = 'nodo';
    el.barra.hidden = false;
    pintarRuta(i);
    const llegar = () => {
      mostrarInterior(!!G.nodos[i].interior, !!G.nodos[i].enMovimiento);
      ponerPuntosDeInteres(G.nodos[i]);
      sonarLugar(G.nodos[i]);
      pantallaDecision();
    };
    mostrarInterior(false);
    quitarPuntosDeInteres();
    if (i === 0) { ponerEscena(G.nodos[i]); llegar(); return; }
    viajar(() => ponerEscena(G.nodos[i])).then(llegar);
  }

  // Si el nodo tiene un punto de tipo "abrir" (por ejemplo, la tienda), la decisión
  // no aparece de una vez: el viajero la abre tocando ese punto en la escena. El
  // botón de la tarjeta hace lo mismo, para quien no lo encuentre.
  function pantallaDecision() {
    const nodo = G.nodos[s.nodo];
    const puerta = s.decision === 0 && (nodo.puntosDeInteres || []).find((p) => p.tipo === 'abrir');
    if (puerta && !s.abierta) {
      escribir({ lugar: nodo.lugar, texto: nodo.texto, pregunta: puerta.pista || '' });
      botones(el.acciones, [{ texto: puerta.etiqueta, clase: 'principal', alHacer: abrirDecision }]);
      return;
    }
    const d = nodo.decisiones[s.decision];
    if (d.tipo === 'vitrina') { abrirVitrina(nodo, d); return; }
    escribir({ lugar: nodo.lugar, texto: s.decision === 0 ? nodo.texto : '', pregunta: d.pregunta });
    el.opciones.className = d.opciones.length === 2 ? 'pares' : '';
    // El orden se baraja para que la opción responsable no esté siempre en el mismo sitio.
    botones(el.opciones, barajar(d.opciones).map((o) => ({ texto: o.texto, imagen: o.imagen, alHacer: () => elegir(o) })));
  }

  function abrirDecision() {
    if (document.body.dataset.pantalla !== 'nodo' || s.abierta) return;
    s.abierta = true;
    quitarPuntosDeInteres('abrir');
    pantallaDecision();
  }

  function elegir(opcion) {
    if (opcion.lleva) s.lleva.push(opcion.lleva);
    sumarPuntos(opcion.puntos || 0);
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

  // ---------- Vitrina: ventana con productos para escoger ----------
  // La vitrina tiene dos modos:
  //  - "grupos": cada grupo es una necesidad (qué tomar, qué llevar...) con sus
  //    opciones lado a lado, la responsable junto a las de riesgo. Se elige una por grupo.
  //  - "productos": lista suelta, de la que se elige entre "minimo" y "maximo".
  function abrirVitrina(nodo, d) {
    const grupos = d.grupos || [{ opciones: d.productos, varios: true }];
    const elegidos = grupos.map(() => new Set());
    escribir({ lugar: nodo.lugar, texto: nodo.texto });
    el.vitrinaTitulo.textContent = conNombre(d.pregunta);

    const actualizar = () => {
      if (d.grupos) {
        const faltan = elegidos.filter((e) => e.size === 0).length;
        el.vitrinaCuenta.textContent = faltan ? `Elige una opción en cada fila. Faltan ${faltan}.` : 'Listo: ya elegiste en todas las filas.';
        el.vitrinaListo.disabled = faltan > 0;
      } else {
        el.vitrinaCuenta.textContent = `Elige entre ${d.minimo} y ${d.maximo}. Llevas ${elegidos[0].size}.`;
        el.vitrinaListo.disabled = elegidos[0].size < d.minimo;
      }
    };

    const tarjetaDe = (p, g, fila) => {
      const tarjeta = document.createElement('button');
      tarjeta.type = 'button';
      tarjeta.className = 'producto';
      tarjeta.setAttribute('aria-pressed', 'false');
      const foto = document.createElement('img');
      foto.alt = '';
      foto.onerror = () => foto.replaceWith(crear('span', p.texto.replace('[', '').charAt(0).toUpperCase()));
      foto.src = p.imagen || 'assets/images/sin-foto';
      tarjeta.append(foto, crear('strong', conNombre(p.texto)), crear('em', 'Llevar'));
      tarjeta.addEventListener('click', () => {
        const grupo = grupos[g], mios = elegidos[g];
        if (mios.has(p)) mios.delete(p);
        else if (!grupo.varios) { mios.clear(); mios.add(p); }       // una sola por fila
        else if (mios.size < d.maximo) mios.add(p);
        else { avisar(`Máximo ${d.maximo}`, ''); return; }
        fila.querySelectorAll('.producto').forEach((t) => {
          const dentro = mios.has(t.producto);
          t.setAttribute('aria-pressed', String(dentro));
          t.querySelector('em').textContent = dentro ? 'En la mochila' : 'Llevar';
        });
        actualizar();
      });
      tarjeta.producto = p;
      return tarjeta;
    };

    el.vitrinaProductos.replaceChildren(...grupos.map((grupo, g) => {
      const seccion = document.createElement('section');
      seccion.className = 'fila-productos';
      if (grupo.titulo) seccion.append(crear('h3', conNombre(grupo.titulo)));
      const fila = document.createElement('div');
      fila.className = 'tarjetas';
      // Se barajan para que la opción responsable no quede siempre en el mismo lugar.
      fila.append(...barajar(grupo.opciones).map((p) => tarjetaDe(p, g, fila)));
      seccion.append(fila);
      return seccion;
    }));
    actualizar();

    el.vitrinaListo.onclick = () => {
      el.vitrina.close();
      let total = 0;
      elegidos.forEach((mios) => mios.forEach((p) => { if (p.lleva) s.lleva.push(p.lleva); total += p.puntos || 0; }));
      sumarPuntos(total);
      pintarEstado();
      avanzar();
    };
    el.vitrina.showModal();
  }
  el.vitrina.addEventListener('cancel', (ev) => ev.preventDefault()); // no se cierra con Esc: hay que escoger

  // ---------- Puntos de interés dentro de la escena ----------
  // Marcas que se pueden tocar: "abrir" lanza la decisión del nodo (la tienda) y
  // "recoger" es un residuo que el viajero puede levantar para sumar puntos.
  window.AFRAME.registerComponent('mira-al-viajero', {
    tick() {
      const camara = this.el.sceneEl.camera;
      if (camara) this.el.object3D.lookAt(camara.getWorldPosition(new window.AFRAME.THREE.Vector3()));
    },
  });

  function ponerPuntosDeInteres(nodo) {
    quitarPuntosDeInteres();
    (nodo.puntosDeInteres || []).forEach((p) => {
      const raiz = pieza(el.puntosInteres, 'a-entity', { position: posicionDe(p) });
      raiz.dataset.tipo = p.tipo;
      if (p.tipo === 'recoger') residuo(raiz, p);
      const marca = pieza(raiz, 'a-entity', { 'mira-al-viajero': '', position: p.tipo === 'recoger' ? '0 0.55 0' : '0 0 0' });
      pieza(marca, 'a-ring', {
        'radius-inner': 0.3, 'radius-outer': 0.36, material: 'shader: flat; color: #ffffff; opacity: 0.95; transparent: true',
        animation: 'property: scale; from: 1 1 1; to: 1.25 1.25 1.25; dir: alternate; loop: true; dur: 850; easing: easeInOutSine',
      });
      const boton = pieza(marca, 'a-circle', { class: 'tocable', radius: 0.26, material: 'shader: flat; color: #f2c14e' });
      rotulo(marca, p.etiqueta);
      boton.addEventListener('click', () => tocarPunto(p, raiz));
    });
  }

  function quitarPuntosDeInteres(tipo) {
    [...el.puntosInteres.children].forEach((n) => { if (!tipo || n.dataset.tipo === tipo) n.remove(); });
  }

  // "posicion" ubica el punto en metros dentro de la escena (sirve dentro del bus).
  // Si no hay, se usa "angulo" (0 = al frente, positivo hacia la derecha) y "altura"
  // en grados, sobre una esfera alrededor del viajero.
  function posicionDe(p) {
    if (p.posicion) return p.posicion;
    const a = (p.angulo || 0) * Math.PI / 180, h = (p.altura || 0) * Math.PI / 180, d = p.distancia || 6;
    return `${(d * Math.sin(a) * Math.cos(h)).toFixed(2)} ${(1.6 + d * Math.sin(h)).toFixed(2)} ${(-d * Math.cos(a) * Math.cos(h)).toFixed(2)}`;
  }

  function residuo(padre, p) {
    if (p.modelo) { ponerModelo(padre, { modelo: p.modelo, alto: p.alto || 0.25 }, null); return; }
    if (p.forma === 'botella') {
      pieza(padre, 'a-cylinder', { radius: 0.045, height: 0.26, rotation: '0 30 90', position: '0 0.045 0', material: 'color: #5d8f6b; opacity: 0.85; transparent: true; roughness: 0.2' });
    } else {
      pieza(padre, 'a-icosahedron', { radius: 0.09, position: '0 0.09 0', material: 'color: #f1efe8; roughness: 1; flatShading: true' });
    }
  }

  // Letrero con el nombre del punto, dibujado en un lienzo para no depender de fuentes externas.
  function rotulo(padre, texto) {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 128;
    const x = c.getContext('2d');
    x.fillStyle = 'rgba(15, 23, 20, 0.82)';
    x.beginPath(); x.roundRect(8, 16, 496, 96, 48); x.fill();
    x.fillStyle = '#ffffff'; x.font = '600 52px system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(texto, 256, 66, 460);
    const plano = pieza(padre, 'a-plane', { class: 'tocable', width: 1.5, height: 0.375, position: '0 -0.6 0', material: 'shader: flat; transparent: true' });
    plano.addEventListener('loaded', () => {
      const material = plano.getObject3D('mesh').material;
      material.map = new THREE.CanvasTexture(c);
      material.map.colorSpace = THREE.SRGBColorSpace;
      material.needsUpdate = true;
    });
    plano.addEventListener('click', () => padre.querySelector('a-circle').emit('click'));
  }

  function tocarPunto(p, raiz) {
    if (p.tipo === 'abrir') { abrirDecision(); return; }
    if (p.cerca) {
      const lejos = raiz.object3D.getWorldPosition(new THREE.Vector3()).distanceTo(el.viajero.object3D.position.clone().setY(0));
      if (lejos > p.cerca) { avisar('Acércate para recogerlo', ''); return; }
    }
    raiz.remove();
    if (p.lleva) s.lleva.push(p.lleva);
    sumarPuntos(p.puntos || 0);
    pintarEstado();
  }

  function pantallaFinal() {
    const e = estadoActual();
    document.body.dataset.pantalla = 'final';
    pintarRuta(paradas.length - 1);
    mostrarInterior(false);
    quitarPuntosDeInteres();
    // Si hay una imagen distinta para cada estado, se usa la del estado alcanzado.
    const foto = (G.final.fotoPorEstado || {})[e] || G.final.foto360;
    viajar(() => ponerEscena(Object.assign({}, G.final, { foto360: foto }))).then(() => mostrarFinal(e));
  }

  function mostrarFinal(e) {
    sonarLugar(G.final);
    escribir({ lugar: G.final.lugar, titulo: `${G.estados[e].nombre} · ${s.puntos} de 100`, texto: G.estados[e].mensaje });
    el.dato.hidden = false;
    el.dato.replaceChildren(document.createTextNode(conNombre(G.final.dato)), crear('small', G.final.fuenteDato));
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
    el.lugar.textContent = conNombre(lugar);
    el.titulo.textContent = conNombre(titulo);
    el.texto.textContent = conNombre(texto);
    el.pregunta.textContent = conNombre(pregunta);
    el.saludo.hidden = true;
    el.opciones.replaceChildren();
    el.acciones.replaceChildren();
    el.dato.hidden = true;
  }

  function botones(contenedor, lista) {
    contenedor.replaceChildren(...lista.map((b) => {
      const boton = crear('button', conNombre(b.texto));
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
  const materialCielo = () => {
    const material = el.cielo.getObject3D('mesh').material;
    material.fog = false; // la neblina del entorno no debe tapar el cielo
    return material;
  };

  function ponerEscena(nodo) {
    el.cielo.setAttribute('rotation', `0 ${-90 + (nodo.giroFoto || 0)} 0`);
    const mio = ++pedidoCielo; // si llega otra escena antes de cargar esta, se descarta
    // Con entorno 3D no hay foto: solo cielo y montañas lejanas pintados.
    if (nodo.entorno) { aplicarCielo(fondoProvisional('', true)); return; }
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
  function fondoProvisional(nombre, sinRotulo) {
    const c = document.createElement('canvas');
    c.width = 2048; c.height = 1024;
    const x = c.getContext('2d');
    const cielo = x.createLinearGradient(0, 0, 0, 560);
    cielo.addColorStop(0, '#7fb2d9'); cielo.addColorStop(1, '#dfeef5');
    x.fillStyle = cielo; x.fillRect(0, 0, 2048, 560);
    const suelo = x.createLinearGradient(0, 520, 0, 1024);
    suelo.addColorStop(0, sinRotulo ? '#cfdccf' : '#7da35f'); suelo.addColorStop(1, '#3f6b3a');
    x.fillStyle = suelo; x.fillRect(0, 520, 2048, 504);
    x.fillStyle = '#5b8a6a';
    x.beginPath(); x.moveTo(0, 540);
    for (let i = 0; i <= 2048; i += 64) x.lineTo(i, 470 + 55 * Math.sin(i / 163) + 30 * Math.sin(i / 71));
    x.lineTo(2048, 540); x.closePath(); x.fill();
    x.fillStyle = 'rgba(20,33,28,.8)'; x.font = '600 44px system-ui, sans-serif'; x.textAlign = 'center';
    if (!sinRotulo) [512, 1536].forEach((px) => {
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
  // Si existe un modelo del interior completo, se usa ese; si no, el interior se
  // arma por piezas con código (piso, paredes, sillas, conductor, escaleras).
  function prepararInterior() {
    const I = G.interior;
    if (!I) return;
    const completo = I.completo || {};
    hayArchivo(completo.modelo).then((si) => {
      if (!si) { interiorPorPiezas(); return; }
      el.interior.setAttribute('position', completo.posicion || '0 0 0');
      const soporte = ponerModelo(el.interior, completo, null);
      // Un modelo pensado para verse desde afuera no dibuja sus caras internas:
      // se fuerzan las dos caras para poder estar adentro.
      soporte.addEventListener('model-loaded', (ev) => {
        ev.detail.model.traverse((o) => { if (o.material) o.material.side = THREE.DoubleSide; });
      });
      prepararCamino(-((completo.largo || 9) - 2.4));
    });
  }

  function interiorPorPiezas() {
    const I = G.interior;
    const raiz = el.interior;
    raiz.setAttribute('position', '0.1 0 -0.9');

    const paso = 0.85, ancho = 2.4, techo = 2.15;
    const frente = 2.4, fondo = -(0.3 + I.filas * paso + 0.3);
    const largo = frente - fondo, medio = (frente + fondo) / 2;
    const caja = (x, y, z, w, h, d, color) => pieza(raiz, 'a-box', {
      position: `${x} ${y} ${z}`, width: w, height: h, depth: d, material: `color: ${color}; roughness: 0.9`,
    });

    // Piso, con un hueco junto a la puerta para la escalera (x de -1.2 a -0.28, z de 0.35 a 1.65).
    const piso = '#2c3136';
    caja(0, -0.05, (fondo + 0.35) / 2, ancho, 0.1, 0.35 - fondo, piso);
    caja(0.46, -0.05, 1.0, 1.48, 0.1, 1.3, piso);
    caja(0, -0.05, (1.65 + frente) / 2, ancho, 0.1, frente - 1.65, piso);
    caja(-0.74, -0.67, 1.0, 0.92, 0.06, 1.3, '#1f2327');           // fondo del hueco de la escalera
    caja(-0.28, -0.33, 1.0, 0.04, 0.66, 1.3, '#23272b');           // pared del hueco, del lado del pasillo
    caja(-0.74, -0.33, 0.35, 0.92, 0.66, 0.04, '#23272b');         // paredes delantera y trasera del hueco
    caja(-0.74, -0.33, 1.65, 0.92, 0.66, 0.04, '#23272b');
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
    // Escaleras dentro del bus: bajan por un hueco del piso, desde el pasillo hacia
    // la puerta. El último peldaño queda a ras de la pared.
    hayArchivo(I.escaleras.modelo).then((si) => {
      ponerModelo(raiz, I.escaleras, escalerasProvisional, si ? '-0.74 -0.62 1.0' : '-0.98 0 1.0');
    });
    // Puerta plegable, abierta y recogida contra el marco delantero.
    if (I.puerta) ponerModelo(raiz, I.puerta, null, I.puerta.posicion || '-1.16 -0.62 1.4');
  }

  // ---------- Caminar por el bus ----------
  // El viajero se mueve por un camino fijo: de la entrada al pasillo y por el
  // pasillo hasta el fondo. "avance" son los metros recorridos sobre ese camino.
  let camino = [[0, 0]], largoCamino = 0, avance = 0, meta = 0, andando = false;
  const PASO = 1.7; // metros por cada toque: dos filas de sillas

  function prepararCamino(fondo) {
    // Puntos (x, z) de la escena: entrada, inicio del pasillo y fondo del bus.
    camino = [[0, 0], [0.1, -0.7], [0.1, fondo + 0.3]];
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
    // El entorno 3D de carretera acompaña al bus en movimiento. La neblina lejana
    // disimula el borde del terreno.
    const conEntorno = !!(si && enMovimiento);
    el.entorno.setAttribute('visible', conEntorno);
    if (conEntorno) el.escena.setAttribute('fog', 'type: linear; color: #cfdccf; near: 70; far: 290');
    else el.escena.removeAttribute('fog');
    const arrancar = conEntorno && !sinMovimiento;
    if (arrancar && !enViaje) { enViaje = true; animarViaje(performance.now()); }
    enViaje = arrancar;
    el.caminar.hidden = !si || largoCamino === 0;
    avance = 0; meta = 0;
    ubicarViajero();
  }

  // ---------- Bus en movimiento: carretera en 3D ----------
  // En los nodos con "entorno", el paisaje no es una foto: es un suelo de pasto y
  // una vía que se desplazan de verdad bajo el bus, con arbustos, árboles, postes
  // y animales al borde que pasan de adelante hacia atrás. Las texturas se dibujan
  // por código, así que no dependen de archivos ni de terceros.
  const pasantes = [];
  let texturasMoviles = [];
  let enViaje = false;
  const SUELO = -1.0;        // el piso del bus queda un metro sobre el terreno
  const CENTRO_VIA = 1.85;   // el bus va por el carril derecho
  const TRAMO = 96;          // metros de borde de vía que se reciclan

  function prepararEntorno() {
    const grupo = new THREE.Group();
    const pasto = repetir(lienzoPasto(), 75, 75);
    const suelo = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshBasicMaterial({ map: pasto }));
    suelo.rotation.x = -Math.PI / 2;
    suelo.position.y = SUELO;
    const asfalto = repetir(lienzoVia(), 1, 75);
    const via = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 600), new THREE.MeshBasicMaterial({ map: asfalto }));
    via.rotation.x = -Math.PI / 2;
    via.position.set(CENTRO_VIA, SUELO + 0.02, 0);
    grupo.add(suelo, via);
    el.entorno.setObject3D('terreno', grupo);
    texturasMoviles = [pasto, asfalto]; // cada repetición mide 8 metros

    // Borde derecho (lado de la puerta) cerca, borde izquierdo al otro lado de la vía.
    const azar = sembrar(7);
    for (let z = -TRAMO / 2; z < TRAMO / 2; z += 6) {
      [[-1, CENTRO_VIA - 5.2], [1, CENTRO_VIA + 5.2]].forEach(([lado, borde]) => {
        const x = borde + lado * (0.5 + azar() * 7);
        const nodo = pieza(el.entorno, 'a-entity', { position: `${x.toFixed(2)} ${SUELO} ${(z + azar() * 4).toFixed(2)}` });
        const tipo = azar();
        if (tipo < 0.45) arbusto(nodo, azar);
        else if (tipo < 0.8) arbol(nodo, azar);
        else poste(nodo);
        pasantes.push(nodo);
      });
    }
    // Animales al borde derecho, repartidos a lo largo del tramo.
    const animales = (G.interior && G.interior.animales) || [];
    animales.forEach((a, i) => {
      const z = -TRAMO / 2 + (i + 0.5) * (TRAMO / animales.length);
      const nodo = pieza(el.entorno, 'a-entity', { position: `${(CENTRO_VIA - 6.5 - (i % 2) * 2).toFixed(2)} ${SUELO} ${z.toFixed(2)}` });
      ponerModelo(nodo, Object.assign({ giro: 90 }, a), (padre) => animalProvisional(padre, a));
      pasantes.push(nodo);
    });
  }

  function repetir(lienzo, x, y) {
    const t = new THREE.CanvasTexture(lienzo);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(x, y);
    t.anisotropy = 4;
    return t;
  }

  // Generador de números repetible: el paisaje sale igual cada vez.
  function sembrar(semilla) {
    let n = semilla;
    return () => { n = (n * 16807) % 2147483647; return (n % 10000) / 10000; };
  }

  function lienzoPasto() {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const x = c.getContext('2d');
    x.fillStyle = '#6f9a4c'; x.fillRect(0, 0, 256, 256);
    const azar = sembrar(11);
    ['#5f8a41', '#7daa57', '#8bb565', '#557d3a', '#9a9d55'].forEach((color) => {
      x.fillStyle = color;
      for (let i = 0; i < 520; i += 1) x.fillRect(azar() * 256, azar() * 256, 1 + azar() * 3, 2 + azar() * 6);
    });
    return c;
  }

  function lienzoVia() {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    const x = c.getContext('2d');
    x.fillStyle = '#4a4d50'; x.fillRect(0, 0, 256, 256);
    const azar = sembrar(23);
    for (let i = 0; i < 1400; i += 1) {
      x.fillStyle = azar() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)';
      x.fillRect(azar() * 256, azar() * 256, 2, 2);
    }
    x.fillStyle = '#e9e6dc'; x.fillRect(10, 0, 5, 256); x.fillRect(241, 0, 5, 256); // líneas de borde
    x.fillStyle = '#e2b93b'; x.fillRect(125, 0, 6, 130);                             // línea central a trazos
    return c;
  }

  function arbusto(padre, azar) {
    const verde = ['#4f7a3a', '#5d8a45', '#466e36'][Math.floor(azar() * 3)];
    for (let i = 0; i < 3; i += 1) {
      const r = 0.45 + azar() * 0.45;
      pieza(padre, 'a-sphere', {
        position: `${(azar() - 0.5).toFixed(2)} ${(r * 0.8).toFixed(2)} ${(azar() - 0.5).toFixed(2)}`, radius: r.toFixed(2),
        'segments-width': 8, 'segments-height': 6, material: `color: ${verde}; roughness: 1; flatShading: true`,
      });
    }
  }

  function arbol(padre, azar) {
    const alto = 3 + azar() * 3;
    pieza(padre, 'a-cylinder', { position: `0 ${(alto * 0.25).toFixed(2)} 0`, radius: 0.16, height: (alto * 0.5).toFixed(2), 'segments-radial': 7, material: 'color: #6a5038; roughness: 1' });
    pieza(padre, 'a-cone', { position: `0 ${(alto * 0.7).toFixed(2)} 0`, 'radius-bottom': (alto * 0.3).toFixed(2), 'radius-top': 0, height: (alto * 0.75).toFixed(2), 'segments-radial': 8, material: 'color: #3f6b3a; roughness: 1; flatShading: true' });
  }

  function poste(padre) {
    pieza(padre, 'a-cylinder', { position: '0 2.6 0', radius: 0.09, height: 5.2, 'segments-radial': 6, material: 'color: #5b4a3a; roughness: 1' });
  }

  // Animal de reemplazo, hecho con cajas, mientras llega su modelo 3D.
  function animalProvisional(padre, a) {
    const k = (a.alto || 1.3) / 1.3;
    const m = `color: ${a.color || '#d9d2c4'}; roughness: 1`;
    const p = (x, y, z, w, h, d) => pieza(padre, 'a-box', { position: `${x * k} ${y * k} ${z * k}`, width: w * k, height: h * k, depth: d * k, material: m });
    p(0, 0.85, 0, 1.5, 0.65, 0.6);                               // cuerpo
    p(0.9, 1.05, 0, 0.45, 0.4, 0.4);                             // cabeza
    [[-0.55, 0.2], [-0.55, -0.2], [0.55, 0.2], [0.55, -0.2]].forEach(([x, z]) => p(x, 0.28, z, 0.16, 0.56, 0.16)); // patas
  }

  function animarViaje(antes) {
    requestAnimationFrame((ahora) => {
      const cuerpo = el.viajero.object3D;
      if (!enViaje) { cuerpo.position.y = 0; cuerpo.rotation.z = 0; return; }
      const dt = Math.min(0.05, (ahora - antes) / 1000);
      const avanceBus = ((G.interior && G.interior.velocidad) || 9) * dt; // metros en este cuadro
      pasantes.forEach((o) => {
        const pos = o.object3D.position;
        pos.z -= avanceBus;
        if (pos.z < -TRAMO / 2) pos.z += TRAMO;
      });
      texturasMoviles.forEach((t) => { t.offset.y -= avanceBus / 8; });
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

  // ---------- Sonido ambiente ----------
  // Cada lugar puede traer su grabación ("audio"). Si el archivo no existe, se usa
  // un ambiente hecho por código ("ambiente": 'pueblo', 'motor' o 'paramo'), que no
  // depende de archivos ni de terceros.
  let audioCtx = null, sintetico = null, sonidoActivo = true, lugarSonando = null;

  function sonarLugar(lugar) {
    lugarSonando = lugar;
    callar();
    if (!sonidoActivo || !lugar) return;
    hayArchivo(lugar.audio).then((si) => {
      if (lugarSonando !== lugar || !sonidoActivo) return;
      if (si) {
        el.ambiente.src = lugar.audio;
        el.ambiente.volume = 0.6;
        el.ambiente.play().catch(() => {});
      } else if (lugar.ambiente) {
        sintetico = sintetizar(lugar.ambiente);
      }
    });
  }

  function callar() {
    el.ambiente.pause();
    if (sintetico) { sintetico.parar(); sintetico = null; }
  }

  el.sonido.addEventListener('click', () => {
    sonidoActivo = !sonidoActivo;
    el.sonido.textContent = sonidoActivo ? 'Sonido: sí' : 'Sonido: no';
    el.sonido.setAttribute('aria-pressed', String(sonidoActivo));
    if (sonidoActivo) sonarLugar(lugarSonando); else callar();
  });

  function sintetizar(tipo) {
    const Contexto = window.AudioContext || window.webkitAudioContext;
    if (!Contexto) return null;
    audioCtx = audioCtx || new Contexto();
    audioCtx.resume();
    const ctx = audioCtx, ahora = ctx.currentTime;
    const salida = ctx.createGain();
    salida.gain.setValueAtTime(0, ahora);
    salida.gain.linearRampToValueAtTime(0.5, ahora + 1.5);
    salida.connect(ctx.destination);
    const fuentes = [], relojes = [];

    // Ruido de fondo: dos segundos de ruido blanco en bucle, que luego se filtra.
    const ruido = () => {
      const bufer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const datos = bufer.getChannelData(0);
      for (let i = 0; i < datos.length; i += 1) datos[i] = Math.random() * 2 - 1;
      const n = ctx.createBufferSource();
      n.buffer = bufer; n.loop = true; n.start();
      fuentes.push(n);
      return n;
    };
    const cadena = (origen, tipoFiltro, frecuencia, volumen, q) => {
      const filtro = ctx.createBiquadFilter();
      filtro.type = tipoFiltro; filtro.frequency.value = frecuencia; filtro.Q.value = q || 0.7;
      const g = ctx.createGain(); g.gain.value = volumen;
      origen.connect(filtro); filtro.connect(g); g.connect(salida);
      return { filtro, g };
    };
    const oscilador = (forma, frecuencia) => {
      const o = ctx.createOscillator();
      o.type = forma; o.frequency.value = frecuencia; o.start();
      fuentes.push(o);
      return o;
    };
    const vaiven = (destino, frecuencia, cantidad) => { // mueve despacio un valor: da vida al sonido
      const g = ctx.createGain(); g.gain.value = cantidad;
      oscilador('sine', frecuencia).connect(g); g.connect(destino);
    };
    const trino = () => { // canto corto de ave
      const t = ctx.currentTime, base = 2400 + Math.random() * 1600;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(base, t);
      o.frequency.linearRampToValueAtTime(base * 1.3, t + 0.07);
      o.frequency.linearRampToValueAtTime(base * 0.9, t + 0.16);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.05, t + 0.02);
      g.gain.linearRampToValueAtTime(0, t + 0.18);
      o.connect(g); g.connect(salida);
      o.start(t); o.stop(t + 0.2);
    };
    const aves = (cada) => {
      const cantar = () => {
        const veces = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < veces; i += 1) setTimeout(trino, i * 230);
        relojes.push(setTimeout(cantar, cada * (0.5 + Math.random())));
      };
      relojes.push(setTimeout(cantar, 1200));
    };

    if (tipo === 'motor') {
      const grave = cadena(oscilador('sawtooth', 48), 'lowpass', 170, 0.22);
      cadena(oscilador('sawtooth', 72.5), 'lowpass', 170, 0.12);
      cadena(ruido(), 'lowpass', 420, 0.1);
      vaiven(grave.g.gain, 8.5, 0.05);
    } else if (tipo === 'paramo') {
      const viento = cadena(ruido(), 'bandpass', 520, 0.2, 0.5);
      vaiven(viento.filtro.frequency, 0.11, 240);
      vaiven(viento.g.gain, 0.07, 0.08);
      aves(5200);
    } else { // pueblo: murmullo leve y aves de vez en cuando
      const murmullo = cadena(ruido(), 'lowpass', 850, 0.05);
      vaiven(murmullo.g.gain, 0.2, 0.02);
      aves(7000);
    }

    return {
      parar() {
        relojes.forEach(clearTimeout);
        const t = ctx.currentTime;
        salida.gain.cancelScheduledValues(t);
        salida.gain.setValueAtTime(salida.gain.value, t);
        salida.gain.linearRampToValueAtTime(0, t + 0.6);
        setTimeout(() => { fuentes.forEach((f) => { try { f.stop(); } catch (e) { /* ya detenida */ } }); salida.disconnect(); }, 800);
      },
    };
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
    el.camaraEstado.textContent = `${G.estados[e].nombre} · ${s.puntos} de 100`;
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

  document.title = `${G.titulo} · ${G.equipo}`;
  if (G.logo) { el.logo.onload = () => { el.logo.hidden = false; }; el.logo.src = G.logo; }
  // Todo arranca cuando la escena 3D ya existe: antes de eso no se pueden
  // cargar modelos ni tocar el cielo.
  const arrancar = () => { prepararBus(); prepararInterior(); prepararEntorno(); reiniciar(); };
  if (el.escena.hasLoaded) arrancar(); else el.escena.addEventListener('loaded', arrancar);
}());
