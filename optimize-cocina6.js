const sharp = require('sharp');
const fs = require('fs');

const input = 'img/cocina6.jpg';
const basename = 'cocina6';

async function optimize() {
  console.log('Optimizando cocina6.jpg...');

  // Generar versión 400w WebP
  await sharp(input)
    .resize(400, null, { withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(`img/${basename}-400w.webp`);
  console.log('✓ Generado cocina6-400w.webp');

  // Generar versión 800w WebP
  await sharp(input)
    .resize(800, null, { withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile(`img/${basename}-800w.webp`);
  console.log('✓ Generado cocina6-800w.webp');

  console.log('\nImágenes optimizadas correctamente!');

  // Mostrar tamaños
  const size400 = fs.statSync(`img/${basename}-400w.webp`).size;
  const size800 = fs.statSync(`img/${basename}-800w.webp`).size;
  console.log(`  cocina6-400w.webp: ${(size400/1024).toFixed(1)} KB`);
  console.log(`  cocina6-800w.webp: ${(size800/1024).toFixed(1)} KB`);
}

optimize().catch(console.error);
