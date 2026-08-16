/**
 * Módulo de búsqueda heurística de partidas
 * Implementa búsqueda por palabras clave con scoring y ranking
 */

/**
 * Busca partidas relevantes en la base de datos
 * Utiliza un algoritmo de scoring basado en coincidencias de palabras clave
 * @param {string} descripcion - Texto de búsqueda del usuario
 * @param {Array} preciosDB - Base de datos de precios
 * @param {number} maxResults - Número máximo de resultados (por defecto 10)
 * @returns {Array} Array de partidas ordenadas por relevancia
 */
export function buscarPartidas(descripcion, preciosDB, maxResults = 10) {
  // Palabras a ignorar (stopwords en español)
  const stopwords = ['de', 'del', 'la', 'el', 'los', 'las', 'a', 'en', 'con', 'para', 'por', 'y', 'o', 'un', 'una'];

  // Limpiar puntos y caracteres especiales, luego dividir
  const keywords = descripcion.toLowerCase()
    .replace(/\./g, ' ')  // Reemplazar puntos por espacios
    .replace(/[,;:]/g, ' ')  // Reemplazar otros separadores
    .split(/\s+/)
    .filter(word => word.length > 1 && !stopwords.includes(word)); // Aceptar palabras de 2+ letras

  const resultados = [];

  for (const partida of preciosDB) {
    const searchText = `${partida.res} ${partida.desc || ''} ${partida.cod}`.toLowerCase();
    let score = 0;

    for (const keyword of keywords) {
      if (searchText.includes(keyword)) {
        // Dar más peso si la palabra es larga (más específica)
        score += keyword.length > 5 ? 2 : 1;

        // Bonus si está en el código
        if (partida.cod.toLowerCase().includes(keyword)) {
          score += 3;
        }
      }
    }

    if (score > 0) {
      resultados.push({ ...partida, score });
    }
  }

  // Ordenar por relevancia
  resultados.sort((a, b) => b.score - a.score);
  return resultados.slice(0, maxResults);
}
