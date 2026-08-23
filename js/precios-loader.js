/**
 * Módulo de carga de precios con caché versionado y fallback
 * Gestiona la descarga, descompresión y almacenamiento de la base de datos de precios
 */

// Partidas de emergencia embebidas (cuando falla el fetch)
export const PARTIDAS_FALLBACK = [
  {cod:'D01AA020',res:'Demol. solera horm. armado e=10cm, medios manuales',uni:'m2',precio:9.82,desc:'Demolición de solera de hormigón armado'},
  {cod:'D01AA030',res:'Demol. solera horm. armado e=15cm, medios mecánicos',uni:'m2',precio:5.14,desc:'Demolición mecánica de solera'},
  {cod:'D02AA100',res:'Excavación zanja en terreno flojo, retroexcavadora',uni:'m3',precio:7.23,desc:'Excavación de zanja'},
  {cod:'D02AA200',res:'Excavación zanja en terreno semiduro, retroexcavadora',uni:'m3',precio:9.85,desc:'Excavación de zanja en terreno semiduro'},
  {cod:'D02AA300',res:'Excavación zanja en roca, martillo picador',uni:'m3',precio:24.10,desc:'Excavación de zanja en roca'},
  {cod:'D02HF001',res:'Excavación vaciado en terreno flojo, medios mecánicos',uni:'m3',precio:3.40,desc:'Excavación vaciado'},
  {cod:'D02HF002',res:'Excavación vaciado en terreno semiduro, medios mecánicos',uni:'m3',precio:5.60,desc:'Excavación vaciado terreno semiduro'},
  {cod:'D02HF100',res:'Excavación de piscina en terreno flojo, retroexcavadora',uni:'m3',precio:6.80,desc:'Excavación piscina'},
  {cod:'D02TE010',res:'Transporte tierras con camión 10t a vertedero <10km',uni:'m3',precio:6.15,desc:'Transporte de tierras a vertedero'},
  {cod:'D02VF001',res:'Relleno y compactado de zanjas con tierras propias',uni:'m3',precio:5.48,desc:'Relleno de zanjas'},
  {cod:'D01KA010',res:'Demol. arqueta ladrillo hasta 40x40 cm, med. manuales',uni:'ud',precio:18.50,desc:'Demolición de arqueta'},
  {cod:'D01KA020',res:'Demol. arqueta ladrillo hasta 60x60 cm, med. manuales',uni:'ud',precio:26.30,desc:'Demolición de arqueta grande'},
  {cod:'D01KA030',res:'Demol. arqueta PVC o pref., med. manuales',uni:'ud',precio:12.20,desc:'Demolición arqueta PVC prefabricada'},
  {cod:'D02CE001',res:'Desbroce y limpieza superficial del terreno, medios mecánicos',uni:'m2',precio:0.68,desc:'Desbroce mecánico de parcela'},
  {cod:'D02CE002',res:'Desbroce y limpieza terreno con arranque de tocones, medios mecánicos',uni:'m2',precio:1.42,desc:'Desbroce con extracción de raíces'},
  {cod:'D04GF010',res:'Solera horm. HA-25/P/20/IIa e=10cm, mallazo 15x15x5',uni:'m2',precio:18.65,desc:'Solera de hormigón armado'},
  {cod:'D04GF020',res:'Solera horm. HA-25/P/20/IIa e=15cm, mallazo 15x15x6',uni:'m2',precio:23.80,desc:'Solera de hormigón armado 15cm'},
  {cod:'D36CE005',res:'Pavimento adoquín horm. 20x10x8cm, cama arena 3cm',uni:'m2',precio:28.40,desc:'Pavimento de adoquín'},
  {cod:'D36CE010',res:'Pavimento loseta horm. 30x30cm, e=6cm',uni:'m2',precio:18.90,desc:'Pavimento de loseta'},
  {cod:'D02SA010',res:'Carga mecánica de tierras con pala cargadora',uni:'m3',precio:1.85,desc:'Carga mecánica de tierras'},
  {cod:'D01DB001',res:'Demol. muro de ladrillo con martillo neumático',uni:'m3',precio:35.20,desc:'Demolición de muro de ladrillo'},
  {cod:'D01DB010',res:'Demol. tabique ladrillo hueco sencillo, medios manuales',uni:'m2',precio:4.80,desc:'Demolición de tabique'},
  {cod:'D02HF300',res:'Nivelación y refino de explanada, motoniveladora',uni:'m2',precio:1.20,desc:'Nivelación de explanada'},
  {cod:'D36GA015',res:'Aglomerado asfáltico en caliente D12, e=5cm',uni:'m2',precio:8.75,desc:'Pavimento asfáltico'},
  {cod:'D36GA020',res:'Aglomerado asfáltico en caliente D12, e=7cm',uni:'m2',precio:11.20,desc:'Pavimento asfáltico 7cm'},
  {cod:'E02SA030',res:'Relleno localizado con material seleccionado de préstamo',uni:'m3',precio:12.40,desc:'Relleno con material de préstamo'},
  {cod:'D02TF001',res:'Canon vertedero tierras limpias',uni:'m3',precio:4.20,desc:'Canon de vertedero'},
  {cod:'D36EE010',res:'Bordillo hormigón recto 10x20cm, mortero M-5',uni:'ml',precio:11.80,desc:'Bordillo de hormigón'},
  {cod:'D36EE020',res:'Bordillo hormigón curvo 10x20cm, mortero M-5',uni:'ml',precio:15.60,desc:'Bordillo curvo'},
  {cod:'D04IC010',res:'Cimentación zapata horm. HA-25 armada',uni:'m3',precio:148.50,desc:'Zapata de cimentación'},
  {cod:'D02HF050',res:'Excavación mecánica vaciado piscina terreno flojo <200m3',uni:'m3',precio:7.50,desc:'Excavación piscina pequeña'},
  {cod:'D39IA001',res:'Plantación árbol de 12-14 cm circunferencia',uni:'ud',precio:85.00,desc:'Plantación de árbol'},
  {cod:'D39QA001',res:'Siembra césped mezcla deportiva, abonado y riego',uni:'m2',precio:4.20,desc:'Siembra de césped'},
  {cod:'D25NA010',res:'Tubería PVC presión PN-10 D=110mm, unión elástica',uni:'ml',precio:9.80,desc:'Tubería PVC 110mm'},
  {cod:'D25NA020',res:'Tubería PVC presión PN-10 D=160mm, unión elástica',uni:'ml',precio:14.20,desc:'Tubería PVC 160mm'},
  {cod:'D03AG010',res:'Arqueta ladrillo M-7 30x30cm, tapa horm.',uni:'ud',precio:85.40,desc:'Arqueta de ladrillo 30x30'},
  {cod:'D03AG020',res:'Arqueta ladrillo M-7 40x40cm, tapa horm.',uni:'ud',precio:110.50,desc:'Arqueta de ladrillo 40x40'},
  {cod:'D03AG030',res:'Arqueta ladrillo M-7 60x60cm, tapa horm.',uni:'ud',precio:165.00,desc:'Arqueta de ladrillo 60x60'},
  {cod:'D03DA010',res:'Colector PVC colgado D=110mm, unión junta elástica',uni:'ml',precio:18.60,desc:'Colector PVC colgado'},
  {cod:'D03DA020',res:'Colector PVC enterrado D=160mm, unión junta elástica',uni:'ml',precio:15.40,desc:'Colector PVC enterrado'},
  {cod:'D01NB010',res:'Demol. pav. asfáltico e<7cm, fresadora',uni:'m2',precio:3.80,desc:'Demolición pavimento asfáltico'},
  {cod:'D01NB020',res:'Demol. pav. adoquín horm., medios mecánicos',uni:'m2',precio:4.20,desc:'Demolición pavimento adoquín'},
  {cod:'D02VM010',res:'Movimiento de tierras en desmontes, motoniveladora',uni:'m3',precio:2.10,desc:'Movimiento de tierras en desmonte'},
  {cod:'D02VM020',res:'Terraplenado y compactado con material propio',uni:'m3',precio:3.85,desc:'Terraplenado con material propio'},
  {cod:'D01AA010',res:'Demol. solera horm. en masa e=10cm, medios manuales',uni:'m2',precio:7.40,desc:'Demolición solera hormigón en masa'},
];

// Configuración de caché
const CACHE_VERSION = '2026.1';  // Actualizar al cambiar base-precios.json
const CACHE_KEY = 'precios_cache_v2';
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;  // 7 días

/**
 * Intenta cargar datos desde sessionStorage
 * @returns {Array|null} Datos cacheados o null si no hay caché válido
 */
function loadFromCache() {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { version, data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;

    // Invalidar si versión antigua o >7 días
    if (version === CACHE_VERSION && age < CACHE_MAX_AGE_MS) {
      console.log(`💾 Cargado desde caché (${(age / 1000 / 60 / 60).toFixed(1)}h antiguo)`);
      return data;
    } else {
      console.log(`🔄 Caché invalidado (versión: ${version} vs ${CACHE_VERSION}, edad: ${(age / 1000 / 60 / 60).toFixed(1)}h)`);
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
  } catch (e) {
    console.warn('Error leyendo caché:', e);
    return null;
  }
}

/**
 * Guarda datos en sessionStorage con versionado
 * @param {Array} data - Datos a guardar
 */
function saveToCache(data) {
  try {
    const cacheData = {
      version: CACHE_VERSION,
      data: data,
      timestamp: Date.now()
    };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    console.log(`💾 Datos guardados en caché (${data.length} partidas)`);
  } catch (e) {
    console.warn('Error guardando en caché (posiblemente lleno):', e);
    // sessionStorage puede estar lleno (~5-10 MB), continuar sin caché
  }
}

/**
 * Carga la base de datos de precios con fallback inteligente
 * Intenta cargar desde varias URLs en orden de preferencia (más ligera primero)
 * @param {Function} onMessage - Callback para mostrar mensajes (type, text)
 * @returns {Promise<Array>} Array de partidas cargadas
 */
export async function loadPrecios(onMessage) {
  try {
    // OPTIMIZACIÓN: Intentar cargar desde caché primero
    const cachedData = loadFromCache();
    if (cachedData) {
      onMessage('system', `✅ Base de datos cargada (caché): ${cachedData.length.toLocaleString()} partidas disponibles`);
      return cachedData;
    }

    onMessage('system', '⏳ Cargando base de precios unificada...');

    // Lista de URLs a intentar en orden de preferencia (más ligera primero)
    const urls = [
      '/data/base-precios.json.gz',      // 1.9 MB (comprimido) - ÓPTIMO
      '/data/base-precios.json.br',      // 1.3 MB (Brotli) - MÁS ÓPTIMO si soportado
      '/data/base-precios.json'          // 21 MB (sin comprimir) - último recurso
    ];

    let response = null;
    let urlUsada = null;

    // Intentar cada URL hasta encontrar una que funcione
    for (const url of urls) {
      try {
        response = await fetch(url);
        if (response.ok) {
          urlUsada = url;
          break;
        }
      } catch (e) {
        console.warn(`No se pudo cargar ${url}, intentando siguiente...`);
      }
    }

    if (!response || !response.ok) {
      throw new Error('No se pudo cargar ninguna versión de la base de precios');
    }

    // Detectar si es archivo .gz y descomprimir con pako
    let data;
    if (urlUsada.endsWith('.gz')) {
      const arrayBuffer = await response.arrayBuffer();
      const decompressed = pako.ungzip(new Uint8Array(arrayBuffer), { to: 'string' });
      data = JSON.parse(decompressed);
      console.log(`🗜️ Archivo descomprimido: ${urlUsada}`);
    } else {
      data = await response.json();
    }

    // OPTIMIZACIÓN: Guardar en caché para próximas visitas
    saveToCache(data);

    onMessage('system', `✅ Base de datos cargada: ${data.length.toLocaleString()} partidas disponibles`);
    console.log(`✅ Base de datos cargada desde ${urlUsada}: ${data.length} partidas`);

    return data;

  } catch (error) {
    console.warn('Fetch fallido, usando partidas embebidas:', error);
    // Fallback: usar partidas embebidas para funcionar offline o en file://
    onMessage('system', `⚠️ Modo offline: ${PARTIDAS_FALLBACK.length} partidas disponibles. Para acceder a la base completa (61.835 partidas), visita obratudela.com`);
    return PARTIDAS_FALLBACK;
  }
}
