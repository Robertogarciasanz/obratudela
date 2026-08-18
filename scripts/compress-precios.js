#!/usr/bin/env node
/**
 * Script para generar versiones comprimidas (.gz y .br) de los archivos de precios
 * Uso: node scripts/compress-precios.js
 *
 * Genera:
 * - base-precios.json.gz (gzip nivel 9)
 * - base-precios.json.br (brotli nivel 11)
 * - precios-busqueda.json.gz (gzip nivel 9)
 * - precios-busqueda.json.br (brotli nivel 11)
 */

const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

// Archivos a comprimir
const files = [
  'base-precios.json',
  'precios-busqueda.json'
];

console.log('🗜️  Iniciando compresión de archivos de precios...\n');

files.forEach(filename => {
  const filepath = path.join(process.cwd(), filename);

  if (!fs.existsSync(filepath)) {
    console.log(`⚠️  ${filename} no encontrado, saltando...`);
    return;
  }

  const data = fs.readFileSync(filepath);
  const originalSize = data.length;

  // Generar .gz (gzip nivel 9 = máxima compresión)
  const gzPath = filepath + '.gz';
  const gzData = zlib.gzipSync(data, { level: 9 });
  fs.writeFileSync(gzPath, gzData);
  const gzSize = gzData.length;
  const gzRatio = ((1 - gzSize / originalSize) * 100).toFixed(1);

  console.log(`✅ ${filename}.gz`);
  console.log(`   Original: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Comprimido: ${(gzSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Reducción: ${gzRatio}%\n`);

  // Generar .br (brotli nivel 11 = máxima compresión)
  const brPath = filepath + '.br';
  const brData = zlib.brotliCompressSync(data, {
    params: {
      [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
      [zlib.constants.BROTLI_PARAM_SIZE_HINT]: originalSize
    }
  });
  fs.writeFileSync(brPath, brData);
  const brSize = brData.length;
  const brRatio = ((1 - brSize / originalSize) * 100).toFixed(1);

  console.log(`✅ ${filename}.br`);
  console.log(`   Original: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Comprimido: ${(brSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Reducción: ${brRatio}%`);
  console.log(`   Mejora vs gzip: ${((1 - brSize / gzSize) * 100).toFixed(1)}%\n`);
});

console.log('✅ Compresión completada!\n');
console.log('📝 Archivos generados:');
files.forEach(f => {
  if (fs.existsSync(f)) {
    console.log(`   - ${f}.gz`);
    console.log(`   - ${f}.br`);
  }
});

console.log('\n💡 Nginx/GitHub Pages servirá automáticamente la versión más eficiente');
console.log('   según Accept-Encoding del navegador (br > gz > sin comprimir)');
