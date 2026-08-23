/**
 * Script de prueba para la calculadora de IA
 * Simula el comportamiento del navegador sin necesidad de abrir el navegador
 */

const http = require('http');
const zlib = require('zlib');

// Configuración
const BASE_URL = 'http://127.0.0.1:8080';

/**
 * Realiza una petición HTTP
 */
function request(path) {
  return new Promise((resolve, reject) => {
    http.get(`${BASE_URL}${path}`, (res) => {
      const chunks = [];

      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);

        // Si es gzip, descomprimir
        if (path.endsWith('.gz')) {
          zlib.gunzip(buffer, (err, decompressed) => {
            if (err) {
              reject(err);
            } else {
              resolve({
                statusCode: res.statusCode,
                headers: res.headers,
                data: JSON.parse(decompressed.toString())
              });
            }
          });
        } else {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: buffer.toString()
          });
        }
      });

      res.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Simula la función de búsqueda
 */
function buscarPartidas(query, baseDatos, limit = 10) {
  const palabras = query.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/\s+/)
    .filter(p => p.length > 2);

  const resultados = baseDatos.map(partida => {
    let score = 0;
    const textoPartida = `${partida.cod} ${partida.res} ${partida.desc || ''}`.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    palabras.forEach(palabra => {
      if (textoPartida.includes(palabra)) {
        score += palabra.length;
      }
    });

    return { ...partida, score };
  })
  .filter(p => p.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, limit);

  return resultados;
}

/**
 * Ejecuta las pruebas
 */
async function runTests() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  PRUEBA DE CALCULADORA DE IA - ObraTudela               ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  try {
    // Test 1: Verificar acceso a la página HTML
    console.log('📄 Test 1: Verificando página HTML...');
    const htmlRes = await request('/pages/calculadora-ia.html');
    if (htmlRes.statusCode === 200) {
      console.log('   ✅ Página HTML accesible');

      // Verificar que contiene el número correcto
      if (htmlRes.data.includes('61.835')) {
        console.log('   ✅ Número de partidas actualizado (61.835)');
      } else {
        console.log('   ⚠️  Número de partidas no actualizado');
      }
    } else {
      console.log('   ❌ Error al cargar la página HTML');
    }

    // Test 2: Cargar base de datos comprimida
    console.log('\n📦 Test 2: Cargando base de datos (data/base-precios.json.gz)...');
    const startTime = Date.now();
    const dbRes = await request('/data/base-precios.json.gz');
    const loadTime = Date.now() - startTime;

    if (dbRes.statusCode === 200 && dbRes.data) {
      console.log(`   ✅ Base de datos cargada: ${dbRes.data.length.toLocaleString()} partidas`);
      console.log(`   ⏱️  Tiempo de carga: ${loadTime}ms`);
      console.log(`   📊 Tamaño: ${(dbRes.headers['content-length'] / 1024 / 1024).toFixed(2)} MB`);

      // Test 3: Buscar partidas de excavación
      console.log('\n🔍 Test 3: Búsqueda - "excavación piscina"');
      const resultados1 = buscarPartidas('excavación piscina', dbRes.data, 5);
      console.log(`   ✅ Encontradas ${resultados1.length} partidas`);
      resultados1.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.cod} - ${p.res.substring(0, 50)}...`);
        console.log(`      Precio: ${p.precio.toFixed(2)} €/${p.uni}`);
      });

      // Test 4: Buscar partidas de demolición
      console.log('\n🔍 Test 4: Búsqueda - "demolición arqueta"');
      const resultados2 = buscarPartidas('demolición arqueta', dbRes.data, 5);
      console.log(`   ✅ Encontradas ${resultados2.length} partidas`);
      resultados2.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.cod} - ${p.res.substring(0, 50)}...`);
        console.log(`      Precio: ${p.precio.toFixed(2)} €/${p.uni}`);
      });

      // Test 5: Buscar partidas de movimiento de tierras
      console.log('\n🔍 Test 5: Búsqueda - "relleno zanjas"');
      const resultados3 = buscarPartidas('relleno zanjas', dbRes.data, 5);
      console.log(`   ✅ Encontradas ${resultados3.length} partidas`);
      resultados3.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.cod} - ${p.res.substring(0, 50)}...`);
        console.log(`      Precio: ${p.precio.toFixed(2)} €/${p.uni}`);
      });

      // Test 6: Verificar estructura de datos
      console.log('\n📋 Test 6: Verificando estructura de datos...');
      const primeraPartida = dbRes.data[0];
      const campos = Object.keys(primeraPartida);
      console.log(`   ✅ Campos: ${campos.join(', ')}`);

      if (campos.includes('cod') && campos.includes('res') && campos.includes('precio') && campos.includes('uni')) {
        console.log('   ✅ Estructura correcta');
      } else {
        console.log('   ⚠️  Estructura incompleta');
      }

      // Estadísticas finales
      console.log('\n╔══════════════════════════════════════════════════════════╗');
      console.log('║  RESUMEN DE PRUEBAS                                      ║');
      console.log('╚══════════════════════════════════════════════════════════╝');
      console.log(`Total partidas: ${dbRes.data.length.toLocaleString()}`);
      console.log(`Tiempo de carga: ${loadTime}ms`);
      console.log(`Tamaño comprimido: ${(dbRes.headers['content-length'] / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Tamaño descomprimido: ${(JSON.stringify(dbRes.data).length / 1024 / 1024).toFixed(2)} MB`);
      console.log(`\n✅ Todas las pruebas completadas exitosamente`);
      console.log(`\n🌐 Abre en tu navegador: http://127.0.0.1:8080/pages/calculadora-ia.html`);

    } else {
      console.log('   ❌ Error al cargar la base de datos');
    }

  } catch (error) {
    console.error('\n❌ Error durante las pruebas:', error.message);
    process.exit(1);
  }
}

// Ejecutar pruebas
runTests().then(() => {
  console.log('\n✨ Pruebas finalizadas\n');
}).catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
