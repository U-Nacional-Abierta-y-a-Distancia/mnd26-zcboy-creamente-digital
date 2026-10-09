<p align="center">
  <img src="assets/encabezado.png" alt="UNAD, Universidad Nacional Abierta y a Distancia, y Segundas Olimpiadas Unadistas 2026" width="560">
</p>

# Próxima parada: Iguaque

> Maratón de Innovación en Narrativas Digitales · Segundas Olimpiadas Unadistas 2026 · Fase zonal

| Campo | Respuesta |
|---|---|
| Equipo | CreaMente Digital |
| Zona / Centro(s) | ZCBOY (Zona Centro Boyacá) / CEAD Tunja |
| Tipo de producto (Tabla 1 del documento técnico) | Realidad extendida: recorrido 360° / realidad virtual en web, con narrativa interactiva |
| Integrantes (solo nombres completos) | Adriana Fernanda González Guerrero, Andrés Felipe Morales Vega, Cesar David Monroy Rodríguez |
| Enlace al demo web (si aplica) | https://u-nacional-abierta-y-a-distancia.github.io/mnd26-zcboy-creamente-digital/ |

**No escriba aquí cédulas, teléfonos ni correos.** Este repositorio se hace público el viernes 9 de octubre a las 12:00 m.

## ¿De qué trata? (máximo 5 líneas)

Responde al reto «Territorios frente a "El Niño"», en el eje de prevención de incendios de la cobertura vegetal. Es un recorrido interactivo en 360° por Boyacá: el viajero compra en una tienda de Tunja, viaja en bus, para cerca de Chíquiza y llega al Santuario de Fauna y Flora Iguaque. Está pensado para turistas de 18 a 35 años que visitan áreas naturales. Cada decisión (qué lleva, qué hace con la basura, si avisa cuando ve una fogata) suma o resta puntos al territorio, y el santuario se ve conservado, en riesgo o afectado según cómo llegó. Busca que el visitante piense qué lleva, regrese con su basura y avise a tiempo.

## Cifras que sustentan el proyecto

| Cifra | Fuente |
|---|---|
| 90 % de probabilidad de fenómeno de El Niño a partir de septiembre de 2026 | IDEAM y Minambiente, 11 de abril de 2026 |
| 114 municipios del país en alerta por amenaza de incendios de la cobertura vegetal | IDEAM, en Radio Nacional de Colombia, 2026 |
| 2.317 incendios de cobertura vegetal en Boyacá entre 2019 y 2025: 3 de cada 4 emergencias registradas (3.065) | Observatorio, con registros de la UNGRD y Corpoboyacá |
| Unas 32.394 hectáreas afectadas en Boyacá en ese periodo | Observatorio, con registros de la UNGRD y Corpoboyacá |
| 96 % de probabilidad de que El Niño continúe entre noviembre de 2026 y enero de 2027 | Minambiente, 11 de junio de 2026 |
| 438 incendios en 191 municipios de 19 departamentos, con unas 7.153 hectáreas, entre el 16 de junio y el 6 de agosto de 2026 | UNGRD, 6 de agosto de 2026 |
| 1.340 hectáreas de afectación preliminar por el incendio que empezó el 19 de septiembre de 2026 en Villa de Leyva y alcanzó el Santuario de Iguaque. Causa en investigación | Gobernación de Boyacá y UNGRD, en RTVC Noticias, 23 de septiembre de 2026 |

Los enlaces de las fuentes principales están en el botón «Fuentes» de la demo.

## Cómo ver o probar el producto

- **Demo web:** abrir el enlace de arriba en el navegador del celular o del computador. No requiere instalación.
- **Recorrido:** Tunja (tienda), carretera dentro del bus, parada cerca de Chíquiza y Santuario de Fauna y Flora Iguaque. El territorio empieza en 100 puntos y cada decisión suma o resta. Con 80 o más se llega a un territorio conservado, entre 50 y 79 en riesgo y con menos de 50 afectado; el paisaje cambia según el puntaje.
- **Controles:** arrastrar para mirar alrededor y tocar los puntos que laten en la escena; dentro del bus, los botones de la derecha permiten caminar por el pasillo. Al final, el estado del territorio se puede ver sobre la cámara del celular.
- **Sonido y video:** tiene música y sonido ambiente (botón «Sonido» para apagarlos). El video de la pantalla final se reproduce desde YouTube y necesita conexión a internet.
- **Fuentes de los datos:** botón «Fuentes» en la portada y al cierre (IDEAM, UNGRD, Gobernación de Boyacá).
- **Archivos pesados** (video del pitch): en el Release **entrega-zonal** (botón *Releases*, a la derecha).
- Instrucciones para ejecutarlo en un computador: dentro de la carpeta `docs/`, ejecutar `python -m http.server` y abrir `http://localhost:8000`.

## Cómo está organizado

| Carpeta | Contenido | Etapa |
|---|---|---|
| `fuentes/01-preproduccion/` | Ficha de concepto, guion por nodos, storyboard y fuentes verificadas | Preproducción |
| `fuentes/02-proceso/` | Capturas y fotos del proceso de trabajo del equipo | Producción |
| `docs/` | Demo web: página, estilos, motor del recorrido, guion (`data/guion.js`) y piezas (`assets/`) | Producción |
| `producto/` | Piezas finales del prototipo que no hacen parte de la demo web | Producción |
| `pitch/` | Diapositivas del pitch en PDF | Posproducción |
| Release `entrega-zonal` | Video del pitch (`pitch_<equipo>.mp4`) | Posproducción |

## Créditos de recursos de terceros

| Recurso | Autor | Licencia o autorización |
|---|---|---|
| A-Frame 1.6.0 (biblioteca para la vista 360° y los modelos 3D) | A-Frame authors | Licencia MIT |
| Foto de botellas de vidrio (tienda) | mockupbee, en Pexels | Licencia de Pexels |
| Foto de botella plástica (tienda) | nerea arance, en Pexels | Licencia de Pexels |
| Foto de termo de acero (tienda) | Mikhail Nilov, en Pexels | Licencia de Pexels |
| Foto de bolsa de residuos (tienda) | Suparerg Suksai, en Pexels | Licencia de Pexels |
| Foto de cigarrillos (tienda) | Uitbundig, en Pexels | Licencia de Pexels |
| Foto de lonchera (tienda) | Jacob Yavin, en Pexels | Licencia de Pexels |
| Foto de fruta (tienda) | alleksana, en Pexels | Licencia de Pexels |
| Foto de papas de paquete (tienda) | Srattha Nualsate, en Pexels | Licencia de Pexels |
| Foto de vasos desechables (tienda) | Mikhail Nilov, en Pexels | Licencia de Pexels |
| Foto de carbón (tienda) | Lukas Blazek, en Pexels | Licencia de Pexels |
| Foto de bengala (tienda) | Francis Seura, en Pexels | Licencia de Pexels |
| Música de fondo «Charango improv» | Bmangelo, en Freesound | Creative Commons 0 |
| Video «Santuario de Iguaque se quema: 800 hectáreas protegidas afectadas y animales atrapados por el fuego» (pantalla final) | Oscar Bueno, en YouTube | Todos los derechos son de su autor. No se copia: se reproduce incrustado desde su canal (https://www.youtube.com/watch?v=NrDgOUcdggg) |
| Tipografías Barlow y Caveat Brush | Jeremy Tribby; Impallari Type | SIL Open Font License |

## Derechos

Todos los derechos reservados a sus autores. Publicado por la Universidad Nacional Abierta y a Distancia (UNAD) con autorización de los autores, conforme a la sección 7 del formato de identificación de la maratón.
