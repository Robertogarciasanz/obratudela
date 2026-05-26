// Extrae imágenes base64 de anuncios.json y las guarda como archivos .jpg
// Uso: node extraer-imagenes.js

const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, 'anuncios.json');
const IMG_BASE = path.join(__dirname, 'img', 'anuncios');

const anuncios = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));

let total = 0;

for (const anuncio of anuncios) {
  if (!Array.isArray(anuncio.fotos)) continue;

  const dir = path.join(IMG_BASE, anuncio.id);
  const nuevasFotos = [];

  for (let i = 0; i < anuncio.fotos.length; i++) {
    const foto = anuncio.fotos[i];

    if (foto.startsWith('data:image/')) {
      const match = foto.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!match) { nuevasFotos.push(foto); continue; }

      const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
      const datos = Buffer.from(match[2], 'base64');
      const nombre = `foto${i + 1}.${ext}`;
      const rutaArchivo = path.join(dir, nombre);

      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(rutaArchivo, datos);

      const rutaWeb = `img/anuncios/${anuncio.id}/${nombre}`;
      nuevasFotos.push(rutaWeb);
      console.log(`  Guardada: ${rutaWeb} (${(datos.length / 1024).toFixed(0)} KB)`);
      total++;
    } else {
      nuevasFotos.push(foto);
    }
  }

  anuncio.fotos = nuevasFotos;
}

fs.writeFileSync(JSON_PATH, JSON.stringify(anuncios, null, 2), 'utf8');
console.log(`\nListo. ${total} imagen(es) extraída(s). anuncios.json actualizado.`);
