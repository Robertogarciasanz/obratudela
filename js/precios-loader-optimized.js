/**
 * Módulo de carga optimizado de precios
 * - Usa IndexedDB en lugar de sessionStorage (soporta >100 MB)
 * - Descomprime en Web Worker para no bloquear UI
 * - Usa índice invertido pre-generado para búsquedas O(1)
 * - Soporte correcto para .br y .gz
 */

import { loadFromCache, saveToCache } from './cache-idb.js';

// Partidas de emergencia (fallback offline)
export const PARTIDAS_FALLBACK = [
  {cod:'D02AA100',res:'Excavación zanja en terreno flojo, retroexcavadora',uni:'m3',precio:7.23},
  {cod:'D02HF100',res:'Excavación de piscina en terreno flojo, retroexcavadora',uni:'m3',precio:6.80},
  {cod:'D01DB010',res:'Demol. tabique ladrillo hueco sencillo, medios manuales',uni:'m2',precio:4.80},
  {cod:'D01NB010',res:'Demol. pav. asfáltico e<7cm, fresadora',uni:'m2',precio:3.80},
  {cod:'U01CRL030',res:'Levantado compresor acera',uni:'m2',precio:3.18}
];

const CACHE_KEY_INDEX = 'precios_index';
const CACHE_KEY_DATA = 'precios_data';

/**
 * Carga el índice invertido para búsquedas rápidas
 * Índice: { palabra: [cod1, cod2, ...] }
 */
export async function loadSearchIndex(onMessage) {
  try {
    // Intentar caché
    const cached = await loadFromCache(CACHE_KEY_INDEX);
    if (cached) {
      onMessage('system', `✅ Índice de búsqueda cargado desde caché`);
      return cached;
    }

    onMessage('system', '⏳ Cargando índice de búsqueda...');

    // Cargar índice comprimido
    const data = await fetchAndDecompress('/data/precios-busqueda.json.gz');

    // Guardar en caché
    await saveToCache(CACHE_KEY_INDEX, data);

    onMessage('system', `✅ Índice cargado: ${Object.keys(data).length.toLocaleString()} términos indexados`);
    return data;

  } catch (error) {
    console.error('Error cargando índice:', error);
    onMessage('system', '⚠️ Índice de búsqueda no disponible. Usando búsqueda básica.');
    return null;
  }
}

/**
 * Carga la base de datos completa de precios
 */
export async function loadPrecios(onMessage) {
  try {
    // Intentar caché IndexedDB
    const cached = await loadFromCache(CACHE_KEY_DATA);
    if (cached) {
      onMessage('system', `✅ Base de datos cargada desde caché: ${cached.length.toLocaleString()} partidas`);
      return cached;
    }

    onMessage('system', '⏳ Cargando base de precios (primera carga, puede tardar un momento)...');

    // Cargar y descomprimir en Web Worker
    const data = await fetchAndDecompress('/data/base-precios.json.gz');

    // Guardar en IndexedDB (async, no bloqueante)
    saveToCache(CACHE_KEY_DATA, data).catch(err => {
      console.warn('No se pudo guardar en caché:', err);
    });

    onMessage('system', `✅ Base de datos cargada: ${data.length.toLocaleString()} partidas`);
    return data;

  } catch (error) {
    console.error('Error cargando base de datos:', error);
    onMessage('system', `⚠️ Modo offline: ${PARTIDAS_FALLBACK.length} partidas disponibles`);
    return PARTIDAS_FALLBACK;
  }
}

/**
 * Descarga y descomprime un archivo (.gz o .br)
 * Usa DecompressionStream nativo si está disponible (más eficiente)
 * Fallback a pako en Web Worker para navegadores antiguos
 */
async function fetchAndDecompress(url) {
  // Intentar diferentes formatos
  const urls = [
    url, // .gz original
    url.replace('.gz', '.br'), // Brotli si existe
    url.replace('.json.gz', '.json') // Sin comprimir como fallback
  ];

  let response = null;
  let usedUrl = null;

  for (const tryUrl of urls) {
    try {
      response = await fetch(tryUrl);
      if (response.ok) {
        usedUrl = tryUrl;
        break;
      }
    } catch (e) {
      console.warn(`Falló ${tryUrl}:`, e.message);
    }
  }

  if (!response || !response.ok) {
    throw new Error('No se pudo descargar ningún formato');
  }

  // Manejar diferentes formatos
  if (usedUrl.endsWith('.gz')) {
    // Intentar DecompressionStream nativo (Chrome 80+, Firefox 102+)
    if ('DecompressionStream' in window) {
      try {
        const stream = response.body.pipeThrough(new DecompressionStream('gzip'));
        const text = await new Response(stream).text();
        return JSON.parse(text);
      } catch (e) {
        console.warn('DecompressionStream falló, usando pako:', e);
        // Fallback a pako si falla
      }
    }

    // Fallback: Descomprimir con pako en Web Worker
    const arrayBuffer = await response.arrayBuffer();
    return await decompressInWorker(arrayBuffer, 'gzip');

  } else if (usedUrl.endsWith('.br')) {
    // Brotli solo funciona si el servidor envía Content-Encoding: br
    // Intentar DecompressionStream nativo
    if ('DecompressionStream' in window) {
      try {
        const stream = response.body.pipeThrough(new DecompressionStream('deflate-raw'));
        const text = await new Response(stream).text();
        return JSON.parse(text);
      } catch (e) {
        // Si falla, asumir que ya está descomprimido
        return await response.json();
      }
    } else {
      // Asumir que el servidor descomprimió
      return await response.json();
    }

  } else {
    // JSON sin comprimir
    return await response.json();
  }
}

/**
 * Descomprime datos en un Web Worker (no bloquea la UI)
 */
async function decompressInWorker(arrayBuffer, format) {
  return new Promise((resolve, reject) => {
    // Crear worker inline
    const workerCode = `
      importScripts('https://cdnjs.cloudflare.com/ajax/libs/pako/2.1.0/pako.min.js');

      self.onmessage = function(e) {
        try {
          const { data, format } = e.data;
          let result;

          if (format === 'gzip') {
            const decompressed = pako.ungzip(new Uint8Array(data), { to: 'string' });
            result = JSON.parse(decompressed);
          }

          self.postMessage({ success: true, result });
        } catch (error) {
          self.postMessage({ success: false, error: error.message });
        }
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);

    worker.onmessage = (e) => {
      URL.revokeObjectURL(workerUrl);
      worker.terminate();

      if (e.data.success) {
        resolve(e.data.result);
      } else {
        reject(new Error(e.data.error));
      }
    };

    worker.onerror = (error) => {
      URL.revokeObjectURL(workerUrl);
      worker.terminate();
      reject(error);
    };

    worker.postMessage({ data: arrayBuffer, format });
  });
}

/**
 * Búsqueda usando el índice invertido (O(1) en lugar de O(N))
 * @param {string} query - Búsqueda del usuario
 * @param {Object} searchIndex - Índice invertido
 * @param {Array} baseDatos - Base de datos completa
 * @param {number} maxResults - Máximo de resultados
 */
export function buscarConIndice(query, searchIndex, baseDatos, maxResults = 10) {
  if (!searchIndex) {
    // Fallback a búsqueda lineal si no hay índice
    return buscarSinIndice(query, baseDatos, maxResults);
  }

  // Normalizar query
  const keywords = query.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .split(/\s+/)
    .filter(w => w.length > 2);

  // Obtener códigos que coinciden con cada keyword
  const codigosPorKeyword = keywords.map(kw =>
    searchIndex[kw] || []
  );

  // Intersección de resultados (partidas que contienen TODAS las keywords)
  let codigosComunes = codigosPorKeyword[0] || [];
  for (let i = 1; i < codigosPorKeyword.length; i++) {
    const set = new Set(codigosPorKeyword[i]);
    codigosComunes = codigosComunes.filter(cod => set.has(cod));
  }

  // Obtener partidas completas
  const codigosSet = new Set(codigosComunes.slice(0, maxResults));
  const resultados = baseDatos.filter(p => codigosSet.has(p.cod));

  // Si no hay resultados con el índice, intentar fallback fuzzy
  if (resultados.length === 0) {
    console.log('⚠️ Índice no encontró resultados, usando búsqueda fuzzy...');
    return buscarConFuzzy(query, baseDatos, maxResults);
  }

  return resultados;
}

/**
 * Búsqueda fuzzy con Fuse.js (fallback cuando no hay resultados)
 */
function buscarConFuzzy(query, baseDatos, maxResults) {
  if (typeof Fuse === 'undefined') {
    console.error('❌ Fuse.js no está cargado, usando búsqueda lineal básica');
    return buscarSinIndice(query, baseDatos, maxResults);
  }

  const fuse = new Fuse(baseDatos, {
    keys: ['res', 'desc', 'cod'],
    threshold: 0.4,
    includeScore: true,
    ignoreLocation: true,
    minMatchCharLength: 3
  });

  const fuzzyResults = fuse.search(query)
    .slice(0, maxResults)
    .map(r => r.item);

  if (fuzzyResults.length > 0) {
    console.log('✨ Resultados fuzzy encontrados:', fuzzyResults.length);
    console.log('  Top 3:', fuzzyResults.slice(0, 3).map(p => p.cod));
  }

  return fuzzyResults;
}

/**
 * Búsqueda lineal (fallback si no hay índice)
 */
function buscarSinIndice(query, baseDatos, maxResults) {
  const queryLower = query.toLowerCase();

  return baseDatos
    .filter(p => {
      const texto = `${p.cod} ${p.res} ${p.desc || ''}`.toLowerCase();
      return texto.includes(queryLower);
    })
    .slice(0, maxResults);
}
