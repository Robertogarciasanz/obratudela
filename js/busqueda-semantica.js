/**
 * Motor de Búsqueda Semántica con Índice Invertido
 * Búsquedas más inteligentes y relevantes
 */

class BusquedaSemantica {
    constructor() {
        this.indice = null;
        this.partidas = null;
        this.metadata = null;
        this.categorias = null;
        this.cargado = false;
    }

    /**
     * Inicializa el motor de búsqueda
     */
    async inicializar() {
        if (this.cargado) return true;

        try {
            console.log('[BusquedaSemantica] Cargando índice...');

            // Cargar índice invertido
            const respuestaIndice = await fetch('../data/indice-busqueda.json');
            const datos = await respuestaIndice.json();

            this.indice = datos.indice;
            this.metadata = datos.metadata;
            this.categorias = datos.categorias_semanticas;

            // Cargar partidas
            const respuestaPartidas = await fetch('../data/base-precios.json');
            this.partidas = await respuestaPartidas.json();

            this.cargado = true;
            console.log(`[BusquedaSemantica] Índice cargado: ${this.metadata.total_partidas.toLocaleString()} partidas`);

            return true;
        } catch (error) {
            console.error('[BusquedaSemantica] Error al cargar:', error);
            return false;
        }
    }

    /**
     * Normaliza texto para búsqueda
     */
    normalizar(texto) {
        if (!texto) return '';

        return texto.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Quitar acentos
            .replace(/[^\w\s]/g, ' ') // Quitar caracteres especiales
            .replace(/\s+/g, ' ') // Comprimir espacios
            .trim();
    }

    /**
     * Expande términos con sinónimos
     */
    expandirTermino(termino) {
        const terminoNorm = this.normalizar(termino);
        const expandidos = new Set([terminoNorm]);

        // Buscar en categorías semánticas
        for (const [key, info] of Object.entries(this.categorias || {})) {
            if (terminoNorm === key || info.terminos.includes(terminoNorm)) {
                expandidos.add(key);
                info.terminos.forEach(t => expandidos.add(t));
            }
        }

        return Array.from(expandidos);
    }

    /**
     * Busca partidas usando índice invertido
     */
    buscar(query, opciones = {}) {
        if (!this.cargado) {
            console.warn('[BusquedaSemantica] Índice no cargado');
            return [];
        }

        const {
            limite = 100,
            minScore = 0.1,
            categoria = null,
            unidad = null,
            precioMin = null,
            precioMax = null
        } = opciones;

        // Normalizar query
        const queryNorm = this.normalizar(query);
        const terminos = queryNorm.split(' ').filter(t => t.length > 2);

        if (terminos.length === 0) return [];

        // Expandir términos con sinónimos
        const terminosExpandidos = new Set();
        terminos.forEach(t => {
            this.expandirTermino(t).forEach(exp => terminosExpandidos.add(exp));
        });

        console.log(`[BusquedaSemantica] Búsqueda: "${query}" → ${terminosExpandidos.size} términos expandidos`);

        // Obtener candidatos usando índice
        const candidatos = new Map(); // indice_partida -> score

        terminosExpandidos.forEach(termino => {
            const indices = this.indice.palabras[termino] || [];

            indices.forEach(idx => {
                const scoreActual = candidatos.get(idx) || 0;
                candidatos.set(idx, scoreActual + 1);
            });
        });

        // Aplicar filtros
        let resultados = Array.from(candidatos.entries())
            .map(([idx, score]) => ({
                partida: this.partidas[idx],
                score: score / terminosExpandidos.size, // Normalizar score
                idx
            }))
            .filter(r => r.score >= minScore);

        // Filtro por categoría
        if (categoria && this.indice.categorias[categoria]) {
            const indicesCategoria = new Set(this.indice.categorias[categoria]);
            resultados = resultados.filter(r => indicesCategoria.has(r.idx));
        }

        // Filtro por unidad
        if (unidad) {
            resultados = resultados.filter(r =>
                this.normalizar(r.partida.uni) === this.normalizar(unidad)
            );
        }

        // Filtro por precio
        if (precioMin !== null) {
            resultados = resultados.filter(r => r.partida.pre >= precioMin);
        }
        if (precioMax !== null) {
            resultados = resultados.filter(r => r.partida.pre <= precioMax);
        }

        // Ordenar por score (relevancia)
        resultados.sort((a, b) => b.score - a.score);

        // Limitar resultados
        resultados = resultados.slice(0, limite);

        console.log(`[BusquedaSemantica] Encontrados: ${resultados.length} resultados`);

        return resultados.map(r => ({
            ...r.partida,
            _score: r.score,
            _relevancia: Math.round(r.score * 100)
        }));
    }

    /**
     * Busca por código exacto (más rápido)
     */
    buscarPorCodigo(codigo) {
        const codigoNorm = this.normalizar(codigo);
        const idx = this.indice.codigos[codigoNorm];

        if (idx !== undefined) {
            return this.partidas[idx];
        }

        return null;
    }

    /**
     * Obtiene sugerencias de búsqueda
     */
    sugerencias(query, limite = 5) {
        const queryNorm = this.normalizar(query);

        // Buscar palabras que empiecen con el query
        const palabrasCoincidentes = Object.keys(this.indice.palabras)
            .filter(palabra => palabra.startsWith(queryNorm))
            .slice(0, limite);

        return palabrasCoincidentes;
    }

    /**
     * Obtiene partidas por categoría
     */
    buscarPorCategoria(categoria, limite = 50) {
        const indices = this.indice.categorias[categoria] || [];

        return indices
            .slice(0, limite)
            .map(idx => this.partidas[idx])
            .filter(p => p.pre > 0); // Solo con precio
    }

    /**
     * Obtiene estadísticas de la base de datos
     */
    obtenerEstadisticas() {
        return {
            ...this.metadata,
            palabras_indexadas: Object.keys(this.indice.palabras).length,
            categorias_disponibles: Object.keys(this.categorias)
        };
    }
}

// Instancia global
window.busquedaSemantica = new BusquedaSemantica();

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BusquedaSemantica;
}
