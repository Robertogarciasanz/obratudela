/**
 * Módulo de carga incremental de precios (lazy loading por capítulos)
 * Reduce la carga inicial de 19 MB a ~2 MB cargando solo lo necesario
 */

// Índice ligero de partidas (solo códigos, resumen y precio)
let indicePartidas = [];
let capitulosCargados = new Set();
let baseDatosCompleta = [];

const CACHE_VERSION = '2026.1_lazy';
const CACHE_KEY_INDEX = 'precios_index_v1';
const CACHE_KEY_PREFIX = 'precios_cap_';

/**
 * Estructura de capítulos BCEXTREM
 */
const CAPITULOS = {
  'D': 'Demoliciones',
  'E': 'Edificación',
  'F': 'Fontanería y saneamiento',
  'I': 'Instalaciones',
  'R': 'Rehabilitación',
  'U': 'Urbanización',
  'C': 'Cimentación',
  'P': 'Partidas auxiliares'
};

/**
 * Carga solo el índice ligero inicial (~2 MB)
 * Contiene: código, resumen corto, precio, unidad, capítulo
 */
export async function loadIndice(onMessage) {
  try {
    // Intentar desde caché
    const cached = sessionStorage.getItem(CACHE_KEY_INDEX);
    if (cached) {
      const { version, data, timestamp } = JSON.parse(cached);
      if (version === CACHE_VERSION) {
        indicePartidas = data;
        onMessage('system', `✅ Índice cargado desde caché: ${data.length.toLocaleString()} partidas`);
        return data;
      }
    }

    onMessage('system', '⏳ Cargando índice de precios (primera carga)...');

    // Cargar índice comprimido
    const response = await fetch('/data/precios-index.json.gz');
    if (!response.ok) {
      throw new Error('No se pudo cargar el índice');
    }

    const arrayBuffer = await response.arrayBuffer();
    const decompressed = pako.ungzip(new Uint8Array(arrayBuffer), { to: 'string' });
    indicePartidas = JSON.parse(decompressed);

    // Guardar en caché
    sessionStorage.setItem(CACHE_KEY_INDEX, JSON.stringify({
      version: CACHE_VERSION,
      data: indicePartidas,
      timestamp: Date.now()
    }));

    onMessage('system', `✅ Índice cargado: ${indicePartidas.length.toLocaleString()} partidas`);
    return indicePartidas;

  } catch (error) {
    console.error('Error cargando índice:', error);
    onMessage('system', '⚠️ Error cargando índice. Usando modo reducido.');
    return [];
  }
}

/**
 * Carga un capítulo específico solo cuando se necesita
 * @param {string} capitulo - Letra del capítulo (D, E, F, etc.)
 */
export async function loadCapitulo(capitulo, onMessage) {
  if (capitulosCargados.has(capitulo)) {
    return; // Ya está cargado
  }

  try {
    // Intentar desde caché
    const cacheKey = CACHE_KEY_PREFIX + capitulo;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const { version, data } = JSON.parse(cached);
      if (version === CACHE_VERSION) {
        // Agregar partidas del capítulo a la base completa
        baseDatosCompleta = baseDatosCompleta.concat(data);
        capitulosCargados.add(capitulo);
        onMessage('system', `✅ Capítulo ${capitulo} (${CAPITULOS[capitulo]}) cargado desde caché`);
        return;
      }
    }

    onMessage('system', `⏳ Cargando capítulo ${capitulo} (${CAPITULOS[capitulo]})...`);

    const response = await fetch(`/data/capitulos/${capitulo}.json.gz`);
    if (!response.ok) {
      console.warn(`Capítulo ${capitulo} no disponible`);
      return;
    }

    const arrayBuffer = await response.arrayBuffer();
    const decompressed = pako.ungzip(new Uint8Array(arrayBuffer), { to: 'string' });
    const partidas = JSON.parse(decompressed);

    // Agregar a la base completa
    baseDatosCompleta = baseDatosCompleta.concat(partidas);
    capitulosCargados.add(capitulo);

    // Guardar en caché
    sessionStorage.setItem(cacheKey, JSON.stringify({
      version: CACHE_VERSION,
      data: partidas,
      timestamp: Date.now()
    }));

    onMessage('system', `✅ Capítulo ${capitulo} cargado: ${partidas.length} partidas`);

  } catch (error) {
    console.error(`Error cargando capítulo ${capitulo}:`, error);
  }
}

/**
 * Busca partidas primero en el índice, luego carga capítulos si es necesario
 * @param {string} query - Búsqueda del usuario
 * @param {number} maxResults - Máximo de resultados
 */
export async function buscarConLazyLoad(query, maxResults, onMessage) {
  // 1. Buscar primero en el índice (rápido)
  const resultadosIndice = buscarEnIndice(query, maxResults * 2);

  // 2. Identificar qué capítulos necesitamos cargar
  const capitulosNecesarios = new Set();
  resultadosIndice.forEach(p => {
    const capitulo = p.cod[0];
    if (!capitulosCargados.has(capitulo)) {
      capitulosNecesarios.add(capitulo);
    }
  });

  // 3. Cargar capítulos necesarios (máximo 2 a la vez para no saturar)
  const capitulosArray = Array.from(capitulosNecesarios).slice(0, 2);
  await Promise.all(capitulosArray.map(cap => loadCapitulo(cap, onMessage)));

  // 4. Buscar en los datos completos cargados
  return buscarEnBaseDatos(query, maxResults);
}

/**
 * Búsqueda rápida en el índice (sin descripciones largas)
 */
function buscarEnIndice(query, maxResults) {
  const keywords = query.toLowerCase().split(' ').filter(w => w.length > 2);

  return indicePartidas
    .filter(p => {
      const texto = `${p.cod} ${p.res}`.toLowerCase();
      return keywords.some(k => texto.includes(k));
    })
    .slice(0, maxResults);
}

/**
 * Búsqueda completa en partidas cargadas
 */
function buscarEnBaseDatos(query, maxResults) {
  // Usar el algoritmo de búsqueda existente
  return baseDatosCompleta.slice(0, maxResults);
}

/**
 * Obtiene todas las partidas cargadas actualmente
 */
export function getPartidasCargadas() {
  return baseDatosCompleta;
}

/**
 * Pre-carga los capítulos más comunes
 */
export async function precargarCapitulosComunes(onMessage) {
  const comunes = ['D', 'E', 'U']; // Demoliciones, Edificación, Urbanización

  for (const cap of comunes) {
    await loadCapitulo(cap, onMessage);
  }
}
