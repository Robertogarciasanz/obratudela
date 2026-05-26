const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const tasks = [
  // bobcat.png → WebP (LCP crítico) + tamaños responsive
  { src: 'img/bobcat.png',       dst: 'img/bobcat-1200w.webp', width: 1200, quality: 80 },
  { src: 'img/bobcat.png',       dst: 'img/bobcat-800w.webp',  width: 800,  quality: 80 },
  { src: 'img/bobcat.png',       dst: 'img/bobcat-400w.webp',  width: 400,  quality: 80 },

  // retrogrande.jpg → WebP responsive
  { src: 'img/retrogrande.jpg',  dst: 'img/retrogrande-800w.webp', width: 800, quality: 80 },
  { src: 'img/retrogrande.jpg',  dst: 'img/retrogrande-400w.webp', width: 400, quality: 80 },

  // yanmar.jpg → WebP responsive
  { src: 'img/yanmar.jpg',       dst: 'img/yanmar-800w.webp',  width: 800, quality: 80 },
  { src: 'img/yanmar.jpg',       dst: 'img/yanmar-400w.webp',  width: 400, quality: 80 },
];

// Fotos de anuncios: redimensionar a max 1200px y convertir a WebP
function getAnuncioPhotos() {
  const anunciosDir = 'img/anuncios';
  const photos = [];
  for (const folder of fs.readdirSync(anunciosDir)) {
    const folderPath = path.join(anunciosDir, folder);
    if (!fs.statSync(folderPath).isDirectory()) continue;
    for (const file of fs.readdirSync(folderPath)) {
      if (/\.(jpg|jpeg|png)$/i.test(file)) {
        const src = path.join(anunciosDir, folder, file);
        const dstName = file.replace(/\.(jpg|jpeg|png)$/i, '.webp');
        const dst = path.join(anunciosDir, folder, dstName);
        photos.push({ src, dst, width: 1200, quality: 80 });
      }
    }
  }
  return photos;
}

async function optimize(task) {
  const { src, dst, width, quality } = task;
  try {
    const info = await sharp(src)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality })
      .toFile(dst);
    const srcKB = Math.round(fs.statSync(src).size / 1024);
    const dstKB = Math.round(fs.statSync(dst).size / 1024);
    const pct = Math.round((1 - dstKB / srcKB) * 100);
    console.log(`✓ ${dst} — ${srcKB}KB → ${dstKB}KB (-${pct}%)`);
  } catch (e) {
    console.error(`✗ ${src}: ${e.message}`);
  }
}

(async () => {
  const allTasks = [...tasks, ...getAnuncioPhotos()];
  for (const t of allTasks) await optimize(t);
  console.log('\nListo. Ahora actualiza los <img> en el HTML para usar los nuevos .webp con srcset.');
})();
