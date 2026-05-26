// Panel de administración local — ObraTudela
// Uso: node admin-server.js  →  abre http://localhost:3000
const http   = require('http');
const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');
const { exec } = require('child_process');

const PORT          = 3000;
const ROOT          = __dirname;
const ANUNCIOS_FILE = path.join(ROOT, 'anuncios.json');
const IMG_DIR       = path.join(ROOT, 'img', 'anuncios');

if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });

// Ruta de git — prueba varias ubicaciones conocidas de Windows
const GIT_CANDIDATES = [
  'git',
  'C:\\Program Files\\Git\\cmd\\git.exe',
  'C:\\Program Files (x86)\\Git\\cmd\\git.exe',
];
// GitHub Desktop incluye su propio git — buscarlo dinámicamente sin depender de la versión exacta
const ghDesktopBase = path.join(process.env.LOCALAPPDATA || '', 'GitHubDesktop');
if (fs.existsSync(ghDesktopBase)) {
  try {
    fs.readdirSync(ghDesktopBase)
      .filter(d => d.startsWith('app-'))
      .forEach(app => {
        GIT_CANDIDATES.push(path.join(ghDesktopBase, app, 'resources', 'app', 'git', 'cmd', 'git.exe'));
      });
  } catch {}
}
let GIT_CMD = null;
for (const g of GIT_CANDIDATES) {
  try {
    require('child_process').execSync(`"${g}" --version`, { stdio: 'pipe' });
    GIT_CMD = g;
    console.log(`  Git encontrado: ${g}`);
    break;
  } catch {}
}
if (!GIT_CMD) console.warn('  AVISO: git no encontrado. El botón "Subir a la web" no funcionará.');

function readAnuncios() {
  try { return JSON.parse(fs.readFileSync(ANUNCIOS_FILE, 'utf8')); }
  catch { return []; }
}
function saveAnuncios(data) {
  fs.writeFileSync(ANUNCIOS_FILE, JSON.stringify(data, null, 2), 'utf8');
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
      catch(e) { reject(e); }
    });
  });
}

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css',
  '.js': 'application/javascript', '.json': 'application/json',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml', '.xml': 'application/xml', '.txt': 'text/plain',
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  // Panel admin
  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/admin')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(adminHTML());
    return;
  }

  // API: listar anuncios
  if (req.method === 'GET' && url.pathname === '/api/anuncios') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(readAnuncios()));
    return;
  }

  // API: nuevo anuncio
  if (req.method === 'POST' && url.pathname === '/api/anuncio') {
    try {
      const body = await readBody(req);
      const id = Date.now().toString(36) + crypto.randomBytes(3).toString('hex');
      const fotos = [];

      if (body.fotos && body.fotos.length) {
        const dir = path.join(IMG_DIR, id);
        fs.mkdirSync(dir, { recursive: true });
        body.fotos.forEach((f, i) => {
          const ext = (f.name || 'foto.jpg').split('.').pop().toLowerCase() || 'jpg';
          const fname = `foto${i + 1}.${ext}`;
          const data = f.data.replace(/^data:image\/[^;]+;base64,/, '');
          fs.writeFileSync(path.join(dir, fname), data, 'base64');
          fotos.push(`img/anuncios/${id}/${fname}`);
        });
      }

      const anuncio = {
        id, titulo: body.titulo, descripcion: body.descripcion || '',
        precio: Number(body.precio) || 0, categoria: body.categoria || 'Maquinaria',
        provincia: body.provincia || 'Valladolid', telefono: body.telefono || '607 444 903',
        emoji: body.emoji || '🏗️', destacado: !!body.destacado, fotos,
        fecha: new Date().toISOString()
      };

      const arr = readAnuncios();
      arr.unshift(anuncio);
      saveAnuncios(arr);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, id, anuncio }));
    } catch(e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: e.message }));
    }
    return;
  }

  // API: editar anuncio
  if (req.method === 'PUT' && url.pathname.startsWith('/api/anuncio/')) {
    try {
      const id = url.pathname.replace('/api/anuncio/', '');
      const body = await readBody(req);
      const arr = readAnuncios();
      const idx = arr.findIndex(a => a.id === id);
      
      if (idx === -1) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'No encontrado' }));
        return;
      }

      const anuncio = arr[idx];
      anuncio.titulo = body.titulo;
      anuncio.descripcion = body.descripcion || '';
      anuncio.precio = Number(body.precio) || 0;
      anuncio.categoria = body.categoria || 'Maquinaria';
      anuncio.provincia = body.provincia || 'Valladolid';
      anuncio.telefono = body.telefono || '607 444 903';
      anuncio.emoji = body.emoji || '🏗️';
      anuncio.destacado = !!body.destacado;

      // Si vienen fotos nuevas (son dataUrls), procesarlas
      if (body.fotos && body.fotos.length > 0 && body.fotos[0].data) {
        const dir = path.join(IMG_DIR, id);
        if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
        fs.mkdirSync(dir, { recursive: true });
        const nuevasFotos = [];
        body.fotos.forEach((f, i) => {
          const ext = (f.name || 'foto.jpg').split('.').pop().toLowerCase() || 'jpg';
          const fname = `foto${i + 1}.${ext}`;
          const data = f.data.replace(/^data:image\/[^;]+;base64,/, '');
          fs.writeFileSync(path.join(dir, fname), data, 'base64');
          nuevasFotos.push(`img/anuncios/${id}/${fname}`);
        });
        anuncio.fotos = nuevasFotos;
      }

      saveAnuncios(arr);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, anuncio }));
    } catch(e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: e.message }));
    }
    return;
  }

  // API: eliminar anuncio
  if (req.method === 'DELETE' && url.pathname.startsWith('/api/anuncio/')) {
    const id = url.pathname.replace('/api/anuncio/', '');
    const arr = readAnuncios();
    const idx = arr.findIndex(a => a.id === id);
    if (idx !== -1) {
      arr.splice(idx, 1);
      saveAnuncios(arr);
      const dir = path.join(IMG_DIR, id);
      if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // API: subir a la web (git push)
  if (req.method === 'POST' && url.pathname === '/api/publicar') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });

    if (!GIT_CMD) {
      res.end('ERROR: Git no encontrado. Sube los archivos manualmente desde VS Code o GitHub Desktop.');
      return;
    }

    res.write('Preparando archivos...\n');
    const g = `"${GIT_CMD}"`;
    const steps = [
      `${g} -C "${ROOT}" add anuncios.json img/anuncios`,
      `${g} -C "${ROOT}" commit -m "Actualizar anuncios"`,
      `${g} -C "${ROOT}" push origin main`,
    ];

    let i = 0;
    function runNext() {
      if (i >= steps.length) { res.end('OK: Publicado en obratudela.com'); return; }
      const step = steps[i++];
      exec(step, { timeout: 60000 }, (err, stdout, stderr) => {
        const msg = (stderr + stdout).trim();
        if (err) {
          if (msg.includes('nothing to commit') || msg.includes('nothing added')) {
            runNext();
          } else if (msg.includes('up to date')) {
            res.end('OK_NADA: La web ya estaba actualizada.');
          } else {
            res.end('ERROR: ' + msg);
          }
        } else {
          res.write(msg ? msg + '\n' : '');
          runNext();
        }
      });
    }
    runNext();
    return;
  }

  // Archivos estáticos
  const filePath = path.join(ROOT, url.pathname === '/' ? 'index.html' : url.pathname);
  const ext = path.extname(filePath).toLowerCase();
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, () => {
  console.log('');
  console.log('  ObraTudela — Panel de administracion local');
  console.log('  ───────────────────────────────────────────');
  console.log(`  Panel admin:   http://localhost:${PORT}`);
  console.log(`  Vista previa:  http://localhost:${PORT}/anuncios.html`);
  console.log('  Pulsa Ctrl+C para cerrar.');
  console.log('');
  // Abrir Edge automáticamente al arrancar
  const edge = '"C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"';
  exec(`${edge} --app=http://localhost:${PORT} --window-size=900,820`, () => {});
});

function adminHTML() {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Admin — ObraTudela</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{--p:#ff6b00;--neg:#0D0D0D;--s:#1a1a1a;--b:#333;--t:#eee;--m:rgba(255,255,255,.45);--g:#2ecc71;--r:#e74c3c}
body{font-family:"Segoe UI",system-ui,sans-serif;background:#111;color:var(--t);min-height:100vh}
header{background:rgba(13,13,13,.97);border-bottom:2px solid var(--p);padding:16px 24px;display:flex;align-items:center;justify-content:space-between}
header h1{font-size:20px;font-weight:800}header h1 span{color:var(--p)}
.badge{background:var(--p);color:var(--neg);font-size:11px;font-weight:800;padding:3px 10px;border-radius:20px;letter-spacing:1px}
.btn-subir{background:var(--g);color:#fff;border:none;border-radius:8px;padding:10px 20px;font-size:14px;font-weight:800;cursor:pointer;transition:filter .2s}
.btn-subir:hover{filter:brightness(1.15)}
.btn-subir:disabled{opacity:.5;cursor:default}
.main{max-width:860px;margin:0 auto;padding:24px 16px}
.card{background:var(--s);border:1px solid var(--b);border-radius:10px;padding:24px;margin-bottom:24px}
.card-title{font-size:13px;font-weight:800;letter-spacing:2px;color:var(--p);text-transform:uppercase;margin-bottom:20px}
label{display:block;font-size:12px;color:var(--m);margin:12px 0 4px;font-weight:600;text-transform:uppercase;letter-spacing:.5px}
input[type=text],input[type=number],select,textarea{width:100%;padding:10px 12px;border:1px solid var(--b);border-radius:7px;font-size:14px;background:#111;color:var(--t);outline:none;font-family:inherit;transition:border-color .2s}
input:focus,select:focus,textarea:focus{border-color:var(--p)}
select option{background:#1a1a1a}
textarea{resize:vertical;min-height:80px}
.r2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.r3{display:grid;grid-template-columns:1fr 1fr 90px;gap:16px}
.chk{display:flex;align-items:center;gap:8px;margin-top:14px;cursor:pointer;font-size:14px;color:rgba(255,255,255,.6)}
.chk input{width:auto;cursor:pointer}
.drop{border:2px dashed var(--b);border-radius:8px;padding:24px;text-align:center;cursor:pointer;transition:border-color .2s;margin-top:4px}
.drop:hover,.drop.over{border-color:var(--p);background:rgba(255,107,0,.05)}
.drop input{display:none}
.drop p{font-size:13px;color:var(--m);margin-top:6px}
.prev{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.pi{position:relative}
.pi img{width:80px;height:80px;object-fit:cover;border-radius:6px;border:2px solid var(--b)}
.pi button{position:absolute;top:-6px;right:-6px;background:var(--r);border:none;width:20px;height:20px;border-radius:50%;color:#fff;font-size:13px;cursor:pointer;line-height:20px;text-align:center}
.prog{font-size:12px;color:var(--m);margin-top:6px;min-height:18px}
.btn-pub{width:100%;background:var(--p);color:#fff;border:none;border-radius:8px;padding:16px;font-size:17px;font-weight:800;cursor:pointer;margin-top:20px;transition:filter .2s;letter-spacing:.5px}
.btn-pub:hover{filter:brightness(1.15)}
.btn-pub:disabled{opacity:.5;cursor:default}
.warn{background:rgba(255,193,7,.1);border:1px solid rgba(255,193,7,.4);border-radius:6px;padding:8px 12px;font-size:13px;color:#ffc107;margin-bottom:10px;display:none}
.warn.v{display:block}
.err{display:none;background:rgba(231,76,60,.1);border:1px solid rgba(231,76,60,.3);border-radius:6px;padding:10px 12px;font-size:13px;color:var(--r);margin-bottom:10px}
.err.v{display:block}
/* Overlay de confirmación */
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.85);display:none;align-items:center;justify-content:center;z-index:1000}
.overlay.v{display:flex}
.confirm-box{background:var(--s);border:2px solid var(--g);border-radius:16px;padding:40px 32px;text-align:center;max-width:420px;width:90%}
.confirm-icon{font-size:64px;margin-bottom:16px}
.confirm-titulo{font-size:22px;font-weight:800;color:var(--g);margin-bottom:8px}
.confirm-sub{font-size:14px;color:var(--m);margin-bottom:28px}
.confirm-btns{display:flex;gap:12px;flex-direction:column}
.btn-otro{background:transparent;border:2px solid var(--b);color:var(--t);border-radius:8px;padding:12px;font-size:15px;font-weight:700;cursor:pointer;transition:border-color .2s}
.btn-otro:hover{border-color:var(--p)}
.btn-web{background:var(--g);color:#fff;border:none;border-radius:8px;padding:14px;font-size:16px;font-weight:800;cursor:pointer;transition:filter .2s}
.btn-web:hover{filter:brightness(1.15)}
.btn-web:disabled{opacity:.6;cursor:default}
.subir-log{font-size:13px;color:var(--m);margin-top:12px;min-height:20px;font-family:monospace}
/* Lista anuncios */
.ai{display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid var(--b)}
.ai:last-child{border-bottom:none}
.at{width:60px;height:60px;border-radius:6px;background:#222;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:24px;overflow:hidden}
.at img{width:60px;height:60px;object-fit:cover;border-radius:6px}
.ainfo{flex:1}
.atit{font-weight:700;font-size:15px}
.amet{font-size:12px;color:var(--m);margin-top:2px}
.apre{font-weight:800;color:var(--p);font-size:15px;margin-right:12px;white-space:nowrap}
.bdel{background:rgba(231,76,60,.15);border:1px solid rgba(231,76,60,.3);color:var(--r);border-radius:6px;padding:6px 12px;cursor:pointer;font-size:13px;font-weight:700;white-space:nowrap}
.bdel:hover{background:rgba(231,76,60,.3)}
.bedit{background:rgba(46,204,113,.15);border:1px solid rgba(46,204,113,.3);color:var(--g);border-radius:6px;padding:6px 12px;cursor:pointer;font-size:13px;font-weight:700;white-space:nowrap;margin-right:8px}
.bedit:hover{background:rgba(46,204,113,.3)}
.empty{text-align:center;padding:32px;color:var(--m);font-size:14px}
@media(max-width:600px){.r2,.r3{grid-template-columns:1fr}}
</style>
</head>
<body>
<header>
  <div style="display:flex;align-items:center;gap:12px">
    <h1>Obra<span>Tudela</span></h1>
    <span class="badge">ADMIN</span>
  </div>
  <button class="btn-subir" id="btnSubirHeader" onclick="subirALaWeb()">📤 Subir todo a la web</button>
</header>

<div class="main">
  <div class="card">
    <div class="card-title" id="formTitulo">➕ Nuevo artículo</div>
    <div class="warn" id="warn">⚠️ Ya existe un anuncio con un título similar. ¿Seguro que quieres añadirlo?</div>
    <div class="err" id="err"></div>
    <input type="hidden" id="fId">

    <label>Título del artículo *</label>
    <input type="text" id="fT" placeholder="Ej: Hormigonera 500L — buen estado" oninput="checkDuplicado()">

    <div class="r2">
      <div>
        <label>Precio € <small style="text-transform:none;letter-spacing:0">(pon 0 si es "A convenir")</small></label>
        <input type="number" id="fP" min="0" value="0">
      </div>
      <div>
        <label>Categoría</label>
        <select id="fC">
          <option>Maquinaria</option><option>Herramientas</option>
          <option>Materiales</option><option>Vehículos</option>
          <option>Electrónica</option><option>Otros</option>
        </select>
      </div>
    </div>

    <div class="r3">
      <div>
        <label>Provincia</label>
        <select id="fPr">
          <option>Valladolid</option><option>Ávila</option><option>Burgos</option>
          <option>León</option><option>Palencia</option><option>Salamanca</option>
          <option>Segovia</option><option>Soria</option><option>Zamora</option>
        </select>
      </div>
      <div>
        <label>Teléfono</label>
        <input type="text" id="fTel" value="607 444 903">
      </div>
      <div>
        <label>Emoji</label>
        <input type="text" id="fE" value="🏗️" maxlength="2">
      </div>
    </div>

    <label>Descripción <small style="text-transform:none;letter-spacing:0">(estado, características, horas de uso...)</small></label>
    <textarea id="fD" placeholder="Ej: Buen estado, 1200 horas, revisión reciente..."></textarea>

    <label class="chk"><input type="checkbox" id="fDest"> ⭐ Marcar como Destacado</label>

    <label style="margin-top:18px">📷 Fotos <small style="text-transform:none;letter-spacing:0">(máx. 5)</small></label>
    <div class="drop" id="dropZone">
      <div style="font-size:40px">📷</div>
      <p>Haz clic para seleccionar · arrastra aquí · o copia y pega con <strong>Ctrl+V</strong></p>
      <input type="file" id="fF" multiple accept="image/*">
    </div>
    <p class="prog" id="prog"></p>
    <div class="prev" id="prev"></div>

    <button class="btn-pub" id="btnPub">✅ Guardar anuncio</button>
    <button class="btn-otro" id="btnCancel" style="display:none;width:100%;margin-top:10px" onclick="resetForm()">❌ Cancelar edición</button>
  </div>

  <div class="card">
    <div class="card-title" id="tituloLista">📋 Anuncios activos</div>
    <div id="lista"><div class="empty">Cargando...</div></div>
  </div>
</div>

<!-- OVERLAY CONFIRMACIÓN -->
<div class="overlay" id="overlay">
  <div class="confirm-box">
    <div class="confirm-icon">✅</div>
    <div class="confirm-titulo">¡Anuncio guardado!</div>
    <div class="confirm-sub" id="confirmSub">El artículo se ha guardado en tu ordenador.<br>Ahora puedes subirlo a la web.</div>
    <div class="confirm-btns">
      <button class="btn-web" id="btnWebOverlay" onclick="subirDesdeOverlay()">📤 Publicar en obratudela.com ahora</button>
      <button class="btn-otro" onclick="cerrarOverlay()">➕ Añadir otro anuncio</button>
    </div>
    <div class="subir-log" id="subirLog"></div>
  </div>
</div>

<script>
var fotosData = [];
var editMode = false;

// Evitar que el navegador abra archivos arrastrados fuera de la zona
document.addEventListener('dragover', function(e) { e.preventDefault(); });
document.addEventListener('drop', function(e) { e.preventDefault(); });

// Pegar imagen con Ctrl+V desde cualquier app (WhatsApp Web, Google Keep, web...)
document.addEventListener('paste', function(e) {
  var items = e.clipboardData && e.clipboardData.items;
  if (!items) return;
  var files = [];
  for (var i = 0; i < items.length; i++) {
    if (items[i].type.indexOf('image') !== -1) {
      var f = items[i].getAsFile();
      if (f) files.push(f);
    }
  }
  if (files.length) { document.getElementById('prog').textContent = 'Imagen pegada, procesando…'; procesarFotos(files); }
});

// Drag & drop
var drop = document.getElementById('dropZone');
drop.addEventListener('click', function() { document.getElementById('fF').click(); });
drop.addEventListener('dragover', function(e) { e.preventDefault(); drop.classList.add('over'); });
drop.addEventListener('dragleave', function() { drop.classList.remove('over'); });
drop.addEventListener('drop', function(e) {
  e.preventDefault(); drop.classList.remove('over');
  var dt = e.dataTransfer;
  if (dt && dt.files.length) procesarFotos(dt.files);
});
document.getElementById('fF').addEventListener('change', function() { procesarFotos(this.files); });
document.getElementById('btnPub').addEventListener('click', publicar);

var checkTimeout;
function checkDuplicado() {
  clearTimeout(checkTimeout);
  checkTimeout = setTimeout(function() {
    var titulo = document.getElementById('fT').value.trim().toLowerCase();
    if (!titulo || editMode) { document.getElementById('warn').className = 'warn'; return; }
    fetch('/api/anuncios').then(function(r){return r.json();}).then(function(data){
      var dup = data.some(function(a){ return a.titulo.toLowerCase().includes(titulo) || titulo.includes(a.titulo.toLowerCase()); });
      document.getElementById('warn').className = dup ? 'warn v' : 'warn';
    }).catch(function(){});
  }, 400);
}

function comprimir(file) {
  return new Promise(function(resolve) {
    var reader = new FileReader();
    reader.onload = function(e) {
      var img = new Image();
      img.onload = function() {
        var MAX = 1200, w = img.width, h = img.height;
        if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
        var c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        c.toBlob(function(blob) { resolve(blob); }, 'image/jpeg', 0.82);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

async function procesarFotos(fileList) {
  var prog = document.getElementById('prog');
  var prev = document.getElementById('prev');
  var remaining = 5 - fotosData.length;
  if (remaining <= 0) { prog.textContent = 'Ya tienes 5 fotos (máximo).'; return; }
  var files = Array.from(fileList).slice(0, remaining);
  if (!files.length) return;
  document.getElementById('btnPub').disabled = true;
  for (var i = 0; i < files.length; i++) {
    prog.textContent = 'Procesando ' + (i + 1) + '/' + files.length + '…';
    var blob = await comprimir(files[i]);
    var dataUrl = await new Promise(function(r) {
      var rd = new FileReader(); rd.onload = function(e) { r(e.target.result); }; rd.readAsDataURL(blob);
    });
    var entry = { name: files[i].name, data: dataUrl };
    fotosData.push(entry);
    var wrap = document.createElement('div'); wrap.className = 'pi';
    var imgEl = document.createElement('img'); imgEl.src = dataUrl;
    var btn = document.createElement('button'); btn.textContent = 'x';
    (function(e, w) {
      btn.addEventListener('click', function() {
        fotosData = fotosData.filter(function(x) { return x !== e; });
        w.remove();
        var t = fotosData.length;
        prog.textContent = t ? t + ' foto' + (t > 1 ? 's' : '') + '.' : '';
      });
    })(entry, wrap);
    wrap.appendChild(imgEl); wrap.appendChild(btn); prev.appendChild(wrap);
  }
  var total = fotosData.length;
  prog.textContent = total + ' foto' + (total > 1 ? 's' : '') + ' lista' + (total > 1 ? 's' : '') + '.';
  document.getElementById('btnPub').disabled = false;
}

async function publicar() {
  var id = document.getElementById('fId').value;
  var titulo = document.getElementById('fT').value.trim();
  var err = document.getElementById('err');
  if (!titulo) { err.textContent = 'El título es obligatorio.'; err.className = 'err v'; document.getElementById('fT').focus(); return; }
  err.className = 'err';
  var btn = document.getElementById('btnPub');
  btn.disabled = true; btn.textContent = 'Guardando…';
  try {
    var method = editMode ? 'PUT' : 'POST';
    var url = editMode ? '/api/anuncio/' + id : '/api/anuncio';
    
    var res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: titulo,
        precio: parseFloat(document.getElementById('fP').value) || 0,
        categoria: document.getElementById('fC').value,
        provincia: document.getElementById('fPr').value,
        telefono: document.getElementById('fTel').value.trim(),
        descripcion: document.getElementById('fD').value.trim(),
        emoji: document.getElementById('fE').value || '🏗️',
        destacado: document.getElementById('fDest').checked,
        fotos: fotosData
      })
    });
    var data = await res.json();
    if (!data.ok) throw new Error(data.error);
    
    var msg = editMode ? '¡Anuncio actualizado!' : '¡Anuncio guardado!';
    document.querySelector('.confirm-titulo').textContent = msg;
    
    resetForm();
    cargarLista();
    
    // Mostrar overlay
    document.getElementById('confirmSub').textContent = '"' + titulo + '" ' + (editMode ? 'actualizado' : 'guardado') + '. ¿Lo subimos a la web ahora?';
    document.getElementById('subirLog').textContent = '';
    document.getElementById('btnWebOverlay').disabled = false;
    document.getElementById('btnWebOverlay').textContent = '📤 Publicar en obratudela.com ahora';
    document.getElementById('overlay').className = 'overlay v';
  } catch(e) {
    err.textContent = 'Error: ' + e.message; err.className = 'err v';
  }
  btn.disabled = false; btn.textContent = editMode ? '✅ Actualizar anuncio' : '✅ Guardar anuncio';
}

function resetForm() {
  editMode = false;
  document.getElementById('fId').value = '';
  document.getElementById('fT').value = '';
  document.getElementById('fD').value = '';
  document.getElementById('fP').value = '0';
  document.getElementById('fC').value = 'Maquinaria';
  document.getElementById('fDest').checked = false;
  document.getElementById('fF').value = '';
  document.getElementById('prev').innerHTML = '';
  document.getElementById('prog').textContent = '';
  document.getElementById('warn').className = 'warn';
  document.getElementById('formTitulo').textContent = '➕ Nuevo artículo';
  document.getElementById('btnPub').textContent = '✅ Guardar anuncio';
  document.getElementById('btnCancel').style.display = 'none';
  fotosData = [];
}

async function cargarParaEditar(id) {
  try {
    var res = await fetch('/api/anuncios');
    var data = await res.json();
    var a = data.find(function(x) { return x.id === id; });
    if (!a) return;

    editMode = true;
    document.getElementById('fId').value = a.id;
    document.getElementById('fT').value = a.titulo;
    document.getElementById('fD').value = a.descripcion;
    document.getElementById('fP').value = a.precio;
    document.getElementById('fC').value = a.categoria;
    document.getElementById('fPr').value = a.provincia;
    document.getElementById('fTel').value = a.telefono;
    document.getElementById('fE').value = a.emoji || '🏗️';
    document.getElementById('fDest').checked = !!a.destacado;
    
    document.getElementById('formTitulo').textContent = '📝 Editando: ' + a.titulo;
    document.getElementById('btnPub').textContent = '✅ Actualizar anuncio';
    document.getElementById('btnCancel').style.display = 'block';
    
    // Cargar fotos existentes (solo visualmente, si se editan se sobreescriben)
    var prev = document.getElementById('prev');
    prev.innerHTML = '';
    fotosData = []; // Empezamos vacío para que si no se tocan, el backend mantenga las viejas
    
    if (a.fotos && a.fotos.length) {
      a.fotos.forEach(function(f) {
        var wrap = document.createElement('div'); wrap.className = 'pi';
        var imgEl = document.createElement('img'); imgEl.src = '/' + f;
        wrap.appendChild(imgEl); prev.appendChild(wrap);
      });
      document.getElementById('prog').textContent = 'Fotos actuales cargadas. Si subes nuevas, se reemplazarán todas.';
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch(e) { alert('Error al cargar datos.'); }
}

function cerrarOverlay() {
  document.getElementById('overlay').className = 'overlay';
  document.getElementById('fT').focus();
}

async function subirDesdeOverlay() {
  var btn = document.getElementById('btnWebOverlay');
  btn.disabled = true; btn.textContent = '⏳ Subiendo…';
  var log = document.getElementById('subirLog');
  log.textContent = 'Conectando con GitHub…';
  await subirInterno(function(msg, ok) {
    log.textContent = msg;
    if (ok !== null) {
      btn.textContent = ok ? '✅ ¡Publicado en obratudela.com!' : '❌ Error al subir';
      if (ok) setTimeout(cerrarOverlay, 3000);
      else btn.disabled = false;
    }
  });
}

async function subirALaWeb() {
  var btn = document.getElementById('btnSubirHeader');
  btn.disabled = true; btn.textContent = '⏳ Subiendo…';
  await subirInterno(function(msg, ok) {
    btn.textContent = ok === null ? '⏳ ' + msg : (ok ? '✅ Publicado' : '❌ Error');
    if (ok !== null) setTimeout(function() { btn.disabled = false; btn.textContent = '📤 Subir todo a la web'; }, 3000);
  });
}

function subirInterno(onStatus) {
  return new Promise(function(resolve) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/publicar');
    xhr.onprogress = function() { onStatus(xhr.responseText.split('\\n').pop() || '…', null); };
    xhr.onload = function() {
      var txt = xhr.responseText;
      var last = txt.split('\\n').filter(function(l){return l.trim();}).pop() || txt;
      if (last.startsWith('OK_NADA') || txt.startsWith('OK_NADA')) { onStatus('La web ya estaba actualizada.', true); }
      else if (last.startsWith('OK') || txt.startsWith('OK')) { onStatus('¡Publicado en obratudela.com!', true); }
      else { onStatus(last.replace('ERROR: ','') || txt, false); }
      resolve();
    };
    xhr.onerror = function() { onStatus('Error de red.', false); resolve(); };
    xhr.send();
  });
}

async function eliminar(id, titulo) {
  if (!confirm('¿Eliminar "' + titulo + '"?')) return;
  try {
    var res = await fetch('/api/anuncio/' + id, { method: 'DELETE' });
    var data = await res.json();
    if (data.ok) cargarLista();
    else alert('El servidor no pudo eliminar el anuncio.');
  } catch(e) {
    alert('Error: no hay conexión con el servidor.\nEjecuta iniciar-admin.bat y vuelve a intentarlo.');
  }
}

async function cargarLista() {
  var lista = document.getElementById('lista');
  var data;
  try {
    var ctrl = new AbortController();
    var t = setTimeout(function() { ctrl.abort(); }, 4000);
    var res = await fetch('/api/anuncios', { signal: ctrl.signal });
    clearTimeout(t);
    data = await res.json();
  } catch(e) {
    lista.innerHTML = '<div class="empty" style="color:#e74c3c;line-height:1.6;">⚠️ El servidor no responde.<br>Cierra Edge, ejecuta <strong>iniciar-admin.bat</strong> y vuelve a abrir el panel.<br><br><button onclick="cargarLista()" style="background:#e74c3c;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:13px;">🔄 Reintentar</button></div>';
    document.getElementById('tituloLista').textContent = '📋 Sin conexión';
    return;
  }
  document.getElementById('tituloLista').textContent = '📋 Anuncios activos (' + data.length + ')';
  if (!data.length) { lista.innerHTML = '<div class="empty">No hay anuncios todavía.</div>'; return; }
  lista.innerHTML = '';
  data.forEach(function(a) {
    var foto = a.fotos && a.fotos.length ? a.fotos[0] : null;
    var precio = a.precio > 0 ? a.precio.toLocaleString('es-ES') + '€' : 'A convenir';
    var row = document.createElement('div'); row.className = 'ai';
    var thumb = document.createElement('div'); thumb.className = 'at';
    if (foto) { var img = document.createElement('img'); img.src = '/' + foto; img.alt = ''; thumb.appendChild(img); }
    else { thumb.textContent = a.emoji || '🏗️'; }
    var info = document.createElement('div'); info.className = 'ainfo';
    info.innerHTML = '<div class="atit">' + a.titulo + '</div><div class="amet">' + a.categoria + ' · ' + a.provincia + ' · ' + (a.fotos ? a.fotos.length : 0) + ' foto(s)</div>';
    var pre = document.createElement('span'); pre.className = 'apre'; pre.textContent = precio;
    var edit = document.createElement('button'); edit.className = 'bedit'; edit.textContent = '📝 Editar';
    edit.dataset.id = a.id;
    edit.addEventListener('click', function() { cargarParaEditar(this.dataset.id); });
    var del = document.createElement('button'); del.className = 'bdel'; del.textContent = '✕ Eliminar';
    del.dataset.id = a.id; del.dataset.titulo = a.titulo;
    del.addEventListener('click', function() { eliminar(this.dataset.id, this.dataset.titulo); });
    row.appendChild(thumb); row.appendChild(info); row.appendChild(pre); row.appendChild(edit); row.appendChild(del);
    lista.appendChild(row);
  });
}

cargarLista();
</script>
</body>
</html>`;
}
