const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'presupuesto_v2.html');
const jsPath = path.join(__dirname, 'datos_precios.js');

let content = fs.readFileSync(htmlPath, 'utf8');

// Find the start of the DATA_B64 declaration
const startStr = 'const DATA_B64 = "';
const startIdx = content.indexOf(startStr);

if (startIdx === -1) {
    console.error('No se encontró DATA_B64 en el archivo.');
    process.exit(1);
}

// Find the end of the declaration (the closing quote and semicolon)
let endIdx = content.indexOf('";', startIdx);
if (endIdx === -1) {
    console.error('No se encontró el final de DATA_B64.');
    process.exit(1);
}

endIdx += 2; // Include the `";`

const dataB64Str = content.substring(startIdx, endIdx);

// Write it to datos_precios.js
fs.writeFileSync(jsPath, dataB64Str, 'utf8');
console.log('Se extrajo DATA_B64 a datos_precios.js');

// Replace the declaration in HTML with a script tag loading the new JS file
// We need to inject the script tag before the main <script> tag if possible, or we can just leave DATA_B64 as an external global loaded beforehand.
// Actually, it's better to add the <script src="datos_precios.js"></script> in the HTML head or right before the main script.
// Let's replace the `const DATA_B64 = ...` with a comment, and inject the script tag before the main `<script>`.

// First, remove the giant string from the content
content = content.substring(0, startIdx) + '// La base de datos (DATA_B64) ahora se carga desde datos_precios.js' + content.substring(endIdx);

// Now, find the `<script>` tag that encloses this code, which is likely `<script>` at line 1117.
// We can just replace `<script>` with `<script src="datos_precios.js"></script>\n  <script>`
content = content.replace('<script>\n    // ========================\n    // DATA LOADING', '<script src="datos_precios.js"></script>\n  <script>\n    // ========================\n    // DATA LOADING');

fs.writeFileSync(htmlPath, content, 'utf8');
console.log('Se actualizó presupuesto_v2.html exitosamente.');
