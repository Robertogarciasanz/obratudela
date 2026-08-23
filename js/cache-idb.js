/**
 * Sistema de caché con IndexedDB (soporta >100 MB)
 * Reemplaza sessionStorage que falla con archivos grandes
 */

const DB_NAME = 'obratudela_cache';
const DB_VERSION = 1;
const STORE_NAME = 'precios';
const CACHE_VERSION = '2026.1';
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

let db = null;

/**
 * Abre/crea la base de datos IndexedDB
 */
async function openDatabase() {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // Crear object store si no existe
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = database.createObjectStore(STORE_NAME, { keyPath: 'key' });
        objectStore.createIndex('timestamp', 'timestamp', { unique: false });
        objectStore.createIndex('version', 'version', { unique: false });
      }
    };
  });
}

/**
 * Guarda datos en IndexedDB
 * @param {string} key - Clave única
 * @param {any} data - Datos a guardar (puede ser muy grande)
 */
export async function saveToCache(key, data) {
  try {
    const database = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);

      const cacheData = {
        key,
        version: CACHE_VERSION,
        data,
        timestamp: Date.now(),
        size: JSON.stringify(data).length // Para diagnóstico
      };

      const request = objectStore.put(cacheData);

      request.onsuccess = () => {
        console.log(`💾 Guardado en IndexedDB: ${key} (${(cacheData.size / 1024 / 1024).toFixed(2)} MB)`);
        resolve();
      };

      request.onerror = () => {
        console.error('Error guardando en IndexedDB:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error en saveToCache:', error);
    // No fallar, continuar sin caché
  }
}

/**
 * Carga datos desde IndexedDB
 * @param {string} key - Clave única
 * @returns {Promise<any|null>} Datos o null si no existe/expiró
 */
export async function loadFromCache(key) {
  try {
    const database = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.get(key);

      request.onsuccess = () => {
        const result = request.result;

        if (!result) {
          resolve(null);
          return;
        }

        // Verificar versión
        if (result.version !== CACHE_VERSION) {
          console.log(`🔄 Caché invalidado por versión: ${result.version} vs ${CACHE_VERSION}`);
          deleteFromCache(key); // Limpiar versión antigua
          resolve(null);
          return;
        }

        // Verificar edad
        const age = Date.now() - result.timestamp;
        if (age > CACHE_MAX_AGE_MS) {
          console.log(`🔄 Caché expirado: ${(age / 1000 / 60 / 60 / 24).toFixed(1)} días`);
          deleteFromCache(key);
          resolve(null);
          return;
        }

        console.log(`💾 Cargado desde IndexedDB: ${key} (${(age / 1000 / 60 / 60).toFixed(1)}h antiguo, ${(result.size / 1024 / 1024).toFixed(2)} MB)`);
        resolve(result.data);
      };

      request.onerror = () => {
        console.error('Error leyendo de IndexedDB:', request.error);
        resolve(null);
      };
    });
  } catch (error) {
    console.error('Error en loadFromCache:', error);
    return null;
  }
}

/**
 * Elimina una entrada de la caché
 */
export async function deleteFromCache(key) {
  try {
    const database = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error en deleteFromCache:', error);
  }
}

/**
 * Limpia toda la caché (útil para depuración)
 */
export async function clearCache() {
  try {
    const database = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.clear();

      request.onsuccess = () => {
        console.log('🗑️ Caché IndexedDB limpiada');
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error en clearCache:', error);
  }
}

/**
 * Obtiene información sobre el uso de la caché
 */
export async function getCacheStats() {
  try {
    const database = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = transaction.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.getAll();

      request.onsuccess = () => {
        const entries = request.result;
        const totalSize = entries.reduce((sum, entry) => sum + (entry.size || 0), 0);

        resolve({
          entries: entries.length,
          totalSize: totalSize,
          totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
          items: entries.map(e => ({
            key: e.key,
            version: e.version,
            age: Date.now() - e.timestamp,
            sizeMB: ((e.size || 0) / 1024 / 1024).toFixed(2)
          }))
        });
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error en getCacheStats:', error);
    return null;
  }
}

/**
 * Verifica si IndexedDB está disponible en el navegador
 */
export function isIndexedDBAvailable() {
  return 'indexedDB' in window;
}
