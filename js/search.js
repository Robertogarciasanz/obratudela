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
  const keywords = normalizar(descripcion)
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopwords.includes(word)); // Palabras de 3+ letras

  // Si no hay keywords válidas, buscar por la descripción completa
  if (keywords.length === 0) {
    return [];
  }

  const resultados = [];

  for (const partida of preciosDB) {
    const resNorm = normalizar(partida.res);
    const descNorm = normalizar(partida.desc || '');
    const codNorm = normalizar(partida.cod);
    const searchText = `${resNorm} ${descNorm}`;

    let score = 0;
    let keywordsEncontradas = 0;
    let palabrasExactas = 0;

    for (const keyword of keywords) {
      // Expandir keyword con sinónimos
      const variantes = expandirConSinonimos(keyword);
      let encontradaVariante = false;
      let mejorScore = 0;

      for (const variante of variantes) {
        if (searchText.includes(variante)) {
          encontradaVariante = true;
          const esExacta = variante === keyword;
          let scoreVariante = 0;

          // Bonus si la palabra aparece en la descripción corta (res)
          if (resNorm.includes(variante)) {
            scoreVariante += esExacta ? 10 : 5; // Priorizar palabras exactas

            // Bonus ENORME si aparece al inicio (suele ser lo más relevante)
            if (resNorm.startsWith(variante)) {
              scoreVariante += 15;
            }

            // Bonus si es una palabra completa (no parte de otra)
            const regex = new RegExp(`\\b${variante}\\b`);
            if (regex.test(resNorm)) {
              scoreVariante += 5;
            }
          }

          // Bonus si aparece en la descripción larga
          if (descNorm.includes(variante)) {
            scoreVariante += esExacta ? 3 : 2;
          }

          // Bonus si está en el código
          if (codNorm.includes(variante)) {
            scoreVariante += 8;
          }

          // Dar más peso a palabras largas (más específicas)
          if (variante.length > 5) {
            scoreVariante += 3;
          } else if (variante.length > 7) {
            scoreVariante += 5;
          }

          // Guardar el mejor score de todas las variantes
          mejorScore = Math.max(mejorScore, scoreVariante);

          if (esExacta) {
            palabrasExactas++;
          }
        }
      }

      if (encontradaVariante) {
        keywordsEncontradas++;
        score += mejorScore;
      }
    }

    // Solo incluir si encontró al menos 1 keyword
    if (keywordsEncontradas > 0) {
      // BONUS MASIVO si encontró TODAS las keywords (búsqueda MUY precisa)
      if (keywordsEncontradas === keywords.length) {
        score += 50;

        // Bonus adicional si todas son palabras exactas
        if (palabrasExactas === keywords.length) {
          score += 30;
        }
      }

      // Bonus proporcional por porcentaje de keywords encontradas
      const porcentaje = keywordsEncontradas / keywords.length;
      score += Math.floor(porcentaje * 20);

      resultados.push({ ...partida, score });
    }
  }

  // Ordenar por relevancia
  resultados.sort((a, b) => b.score - a.score);
  return resultados.slice(0, maxResults);
}
