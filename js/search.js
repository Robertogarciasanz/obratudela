/**
 * Módulo de búsqueda inteligente de partidas
 * Implementa búsqueda semántica con sinónimos, contexto y scoring avanzado
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
  const stopwords = ['de', 'del', 'la', 'el', 'los', 'las', 'a', 'en', 'con', 'para', 'por', 'y', 'o', 'un', 'una', 'unos', 'unas'];

  // Diccionario ampliado de sinónimos y términos relacionados
  const sinonimos = {
    // Demolición y retirada
    'demolicion': ['demolicion', 'demol', 'levantado', 'levant', 'picado', 'arranque', 'retirada', 'desmontaje', 'derribo', 'desmolicion', 'corte', 'recorte', 'sierra'],
    'demoler': ['demoler', 'demolicion', 'levantado', 'arranque', 'retirada', 'derribar', 'desmontar', 'corte', 'recorte'],
    'picado': ['picado', 'picar', 'levantado', 'demolicion', 'fresado', 'corte'],
    'levantado': ['levantado', 'levantar', 'picado', 'demolicion', 'retirada', 'arranque'],
    'corte': ['corte', 'recorte', 'sierra', 'disco', 'serrado'],

    // Pavimentos y aceras
    'acera': ['acera', 'acerado', 'vial', 'calzada', 'peatonal', 'banqueta'],
    'pavimento': ['pavimento', 'pav', 'solado', 'firme', 'solera', 'adoquin', 'asfalto', 'loseta'],
    'asfalto': ['asfalto', 'aglomerado', 'asfaltico', 'mbc', 'bituminoso'],
    'baldosa': ['baldosa', 'loseta', 'losa', 'solado', 'pavimento'],

    // Excavación
    'excavacion': ['excavacion', 'excav', 'vaciado', 'zanja', 'movimiento', 'tierras', 'desmonte'],
    'excavar': ['excavar', 'excavacion', 'vaciado', 'zanja'],
    'zanja': ['zanja', 'excavacion', 'canaliz'],
    'tierras': ['tierras', 'tierra', 'terreno', 'suelo'],

    // Muros y tabiques
    'tabique': ['tabique', 'tabiqu', 'particion', 'division', 'cerramiento', 'pared'],
    'muro': ['muro', 'pared', 'tapia', 'cerramiento'],
    'ladrillo': ['ladrillo', 'rasilla', 'ceramico'],
    'pladur': ['pladur', 'carton', 'yeso', 'placa'],

    // Piscinas
    'piscina': ['piscina', 'pisci', 'vaso', 'estanque', 'natacion'],

    // Cimentación
    'zapata': ['zapata', 'cimentacion', 'fundacion'],
    'cimiento': ['cimiento', 'cimentacion', 'fundacion', 'zapata'],

    // Saneamiento
    'arqueta': ['arqueta', 'registro', 'pozo'],
    'tuberia': ['tuberia', 'tubo', 'conducto', 'canalizacion', 'colector'],
    'saneamiento': ['saneamiento', 'alcantarillado', 'evacuacion', 'residual'],

    // Cubierta
    'cubierta': ['cubierta', 'tejado', 'azotea', 'techo'],
    'teja': ['teja', 'cobertura', 'cubricion'],

    // Carpintería
    'puerta': ['puerta', 'carpinteria', 'hoja'],
    'ventana': ['ventana', 'carpinteria', 'hueco'],

    // Instalaciones
    'electricidad': ['electricidad', 'electrica', 'electrico', 'instalacion'],
    'fontaneria': ['fontaneria', 'fontanero', 'agua', 'abastecimiento'],
    'calefaccion': ['calefaccion', 'climatizacion', 'radiador'],

    // Acabados
    'enfoscado': ['enfoscado', 'mortero', 'revoco', 'revestimiento'],
    'pintura': ['pintura', 'pintado', 'revestimiento'],
    'alicatado': ['alicatado', 'azulejo', 'revestimiento', 'ceramica']
  };

  // Normalizar texto: eliminar acentos y convertir a minúsculas
  const normalizar = (texto) => {
    return texto.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // quitar acentos
      .replace(/\./g, ' ')
      .replace(/[,;:]/g, ' ');
  };

  // Stemming simple: convertir plurales a singular
  const stemming = (palabra) => {
    // Si termina en 's' y tiene más de 3 letras, quitar la 's'
    if (palabra.length > 3 && palabra.endsWith('s') && !palabra.endsWith('ss')) {
      return palabra.slice(0, -1);
    }
    return palabra;
  };

  // Expandir keywords con sinónimos - buscar coincidencias parciales
  const expandirConSinonimos = (palabra) => {
    const variantes = new Set([palabra]); // Incluir la palabra original

    for (const [clave, valores] of Object.entries(sinonimos)) {
      // Si la palabra contiene la clave o viceversa
      if (palabra.includes(clave) || clave.includes(palabra)) {
        valores.forEach(v => variantes.add(v));
      }
      // Si la palabra coincide con algún sinónimo
      if (valores.some(v => palabra.includes(v) || v.includes(palabra))) {
        valores.forEach(v => variantes.add(v));
      }
    }

    return Array.from(variantes);
  };

  // Limpiar y dividir keywords
  console.log('🔍 Buscar:', descripcion);
  const keywordsRaw = normalizar(descripcion)
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopwords.includes(word)); // Palabras de 3+ letras

  // Aplicar stemming: incluir tanto palabra original como stemmed
  const keywords = [];
  const keywordsSet = new Set();

  for (const word of keywordsRaw) {
    keywords.push(word);
    keywordsSet.add(word);

    const stemmed = stemming(word);
    if (stemmed !== word && !keywordsSet.has(stemmed)) {
      keywords.push(stemmed);
      keywordsSet.add(stemmed);
    }
  }

  console.log('📋 Keywords normalizadas:', keywords);

  // Si no hay keywords válidas, buscar por la descripción completa
  if (keywords.length === 0) {
    console.warn('⚠️ No hay keywords válidas después de filtrar');
    return [];
  }

  // Pre-expandir keywords con sinónimos (solo una vez)
  const keywordsExpandidas = new Map();
  for (const keyword of keywordsRaw) {
    const variantes = expandirConSinonimos(keyword);
    keywordsExpandidas.set(keyword, variantes);
    console.log(`  "${keyword}" → ${variantes.length} variantes`);
  }

  const resultados = [];
  const startTime = performance.now();

  // Procesar solo hasta encontrar suficientes buenos candidatos
  const candidatosNecesarios = maxResults * 5; // 5x el máximo para tener margen

  for (const partida of preciosDB) {
    // Early exit si ya tenemos suficientes candidatos de alta calidad
    if (resultados.length >= candidatosNecesarios) {
      break;
    }

    const resNorm = normalizar(partida.res);
    const descNorm = normalizar(partida.desc || '');
    const codNorm = normalizar(partida.cod);

    let score = 0;
    let keywordsEncontradas = 0;
    let palabrasExactas = 0;

    for (const keyword of keywordsRaw) {
      const variantes = keywordsExpandidas.get(keyword);
      let encontradaVariante = false;
      let mejorScore = 0;

      for (const variante of variantes) {
        // Búsqueda rápida primero en res (más importante)
        const enRes = resNorm.includes(variante);
        const enDesc = !enRes && descNorm.includes(variante);
        const enCod = !enRes && !enDesc && codNorm.includes(variante);

        if (enRes || enDesc || enCod) {
          encontradaVariante = true;
          const esExacta = variante === keyword;
          let scoreVariante = 0;

          if (enRes) {
            scoreVariante += esExacta ? 10 : 5;
            if (resNorm.startsWith(variante)) scoreVariante += 15;
            // Palabra completa (sin regex, más rápido)
            if (resNorm.indexOf(variante) > 0) {
              const charAntes = resNorm[resNorm.indexOf(variante) - 1];
              if (charAntes === ' ') scoreVariante += 5;
            }
          } else if (enDesc) {
            scoreVariante += esExacta ? 3 : 2;
          } else if (enCod) {
            scoreVariante += 8;
          }

          // Peso por longitud
          if (variante.length > 7) scoreVariante += 5;
          else if (variante.length > 5) scoreVariante += 3;

          mejorScore = Math.max(mejorScore, scoreVariante);
          if (esExacta) palabrasExactas++;
        }
      }

      if (encontradaVariante) {
        keywordsEncontradas++;
        score += mejorScore;
      }
    }

    // Solo incluir si encontró al menos 1 keyword
    if (keywordsEncontradas > 0) {
      // BONUS MASIVO si encontró TODAS las keywords
      if (keywordsEncontradas === keywordsRaw.length) {
        score += 50;
        if (palabrasExactas === keywordsRaw.length) score += 30;
      }

      // Bonus proporcional
      score += Math.floor((keywordsEncontradas / keywordsRaw.length) * 20);

      resultados.push({ ...partida, score });
    }
  }

  const searchTime = Math.round(performance.now() - startTime);

  // Ordenar por relevancia
  resultados.sort((a, b) => b.score - a.score);

  console.log(`✅ ${resultados.length} partidas en ${searchTime}ms`);
  if (resultados.length > 0) {
    console.log('  Top 3:', resultados.slice(0, 3).map(p => `${p.cod} (${p.score})`));
    return resultados.slice(0, maxResults);
  }

  // Fallback: búsqueda fuzzy con Fuse.js cuando no hay resultados exactos
  console.log('⚠️ No hay resultados exactos, intentando búsqueda fuzzy...');

  if (typeof Fuse === 'undefined') {
    console.warn('⚠️ Fuse.js no está cargado, intentando búsqueda parcial...');
    // Fallback sin Fuse.js: búsqueda más permisiva
    const fallbackResults = [];
    for (const partida of preciosDB) {
      const resNorm = normalizar(partida.res);
      const descNorm = normalizar(partida.desc || '');
      let matches = 0;

      for (const keyword of keywordsRaw) {
        if (resNorm.includes(keyword) || descNorm.includes(keyword)) {
          matches++;
        }
      }

      if (matches > 0) {
        fallbackResults.push({ ...partida, score: matches * 10 });
      }
    }

    fallbackResults.sort((a, b) => b.score - a.score);
    const topResults = fallbackResults.slice(0, maxResults);

    if (topResults.length > 0) {
      console.log('✨ Resultados parciales encontrados:', topResults.length);
    }

    return topResults;
  }

  // Optimización: Limitar Fuse.js a primeras 10,000 partidas para ser más rápido
  // (las partidas están ordenadas por relevancia general)
  const fuzzyStartTime = performance.now();
  const datasetLimitado = preciosDB.slice(0, 10000);

  const fuse = new Fuse(datasetLimitado, {
    keys: ['res', 'desc'],
    threshold: 0.4,
    includeScore: true,
    ignoreLocation: true,
    minMatchCharLength: 3,
    distance: 100
  });

  const fuzzyResults = fuse.search(descripcion)
    .slice(0, maxResults)
    .map(r => ({
      ...r.item,
      score: Math.round((1 - r.score) * 100)
    }));

  const fuzzyTime = Math.round(performance.now() - fuzzyStartTime);

  if (fuzzyResults.length > 0) {
    console.log(`✨ Fuzzy: ${fuzzyResults.length} resultados en ${fuzzyTime}ms`);
    console.log('  Top 3:', fuzzyResults.slice(0, 3).map(p => p.cod));
    return fuzzyResults;
  }

  // Si ni siquiera fuzzy encuentra resultados, generar sugerencias
  console.log('💡 Generando sugerencias basadas en sinónimos...');
  const sugerencias = new Set();

  for (const keyword of keywordsRaw) {
    const variantes = expandirConSinonimos(keyword);
    variantes.slice(0, 5).forEach(v => sugerencias.add(v));
  }

  if (sugerencias.size > 0) {
    console.log('💡 Sugerencias:', Array.from(sugerencias).slice(0, 10).join(', '));
  }

  return [];
}
