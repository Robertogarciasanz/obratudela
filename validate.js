const fs = require('fs');
const path = require('path');

try {
  const content = fs.readFileSync(path.join(__dirname, 'datos_precios.js'), 'utf8');
  console.log('Size of datos_precios.js:', content.length);
  
  if (!content.startsWith('const DATA_B64 = "')) {
    fs.writeFileSync('error_log.txt', 'Error: Does not start with const DATA_B64 = "');
    process.exit(1);
  }
  
  if (!content.endsWith('";')) {
    fs.writeFileSync('error_log.txt', 'Error: Does not end with "; - ends with: ' + content.slice(-100));
    process.exit(1);
  }

  // Check if it's valid JS
  try {
    eval(content);
    fs.writeFileSync('error_log.txt', 'Success: Valid JS. DATA_B64 length: ' + DATA_B64.length);
  } catch (e) {
    fs.writeFileSync('error_log.txt', 'Error evaluating JS: ' + e.message);
  }

} catch (err) {
  fs.writeFileSync('error_log.txt', 'Error reading file: ' + err.message);
}
