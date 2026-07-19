const net = require('net');

const IP = '192.168.88.88';
const CONCURRENCIA = 50;
const TIMEOUT = 1500;

function testPort(port) {
  return new Promise((resolve) => {
    const s = new net.Socket();
    s.setTimeout(TIMEOUT);
    s.connect(port, IP, () => { s.destroy(); resolve(port); });
    s.on('error', () => resolve(null));
    s.on('timeout', () => { s.destroy(); resolve(null); });
  });
}

async function scanRango(inicio, fin) {
  const abiertos = [];
  for (let i = inicio; i <= fin; i += CONCURRENCIA) {
    const lote = [];
    for (let j = i; j < Math.min(i + CONCURRENCIA, fin + 1); j++) lote.push(testPort(j));
    const resultados = await Promise.all(lote);
    resultados.filter(Boolean).forEach(p => {
      console.log(`✅ Puerto ${p} ABIERTO`);
      abiertos.push(p);
    });
    if (i % 1000 === 0) process.stdout.write(`\rEscaneando... ${i}/${fin}`);
  }
  return abiertos;
}

async function main() {
  console.log(`Escaneando ${IP} puertos 1-65535...\n`);
  const abiertos = await scanRango(1, 65535);
  console.log(`\n\nResultado: ${abiertos.length > 0 ? 'Puertos abiertos: ' + abiertos.join(', ') : 'Ningún puerto TCP abierto'}`);
}

main();
