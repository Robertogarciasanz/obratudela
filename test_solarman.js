// Test Solarman V5 protocol - busca el logger en la red local
const net = require('net');

// Logger PN: Q0047462933640, SN completo: Q0047462933640191005
// El serial numérico del protocolo Solarman se extrae del SN
const LOGGER_SN = 47462933640; // parte numérica del PN

// IPs a probar en red de casa
const IPS = ['192.168.0.12', '192.168.0.14', '192.168.0.17', '192.168.88.88'];

function buildSolarmanRequest(serialNumber) {
  // Solarman V5 frame para solicitar datos del inversor
  const frame = Buffer.alloc(36);
  frame[0] = 0xA5; // start
  frame[1] = 0x11; frame[2] = 0x00; // length 17
  frame[3] = 0x45; frame[4] = 0x03; // control: data request
  frame[5] = 0x00; frame[6] = 0x00; // sequence
  // logger serial (4 bytes LE)
  frame.writeUInt32LE(serialNumber & 0xFFFFFFFF, 7);
  frame[11] = 0x02; // data field type
  // timestamp (4 bytes)
  const ts = Math.floor(Date.now() / 1000);
  frame.writeUInt32LE(ts, 12);
  frame[16] = 0x00; frame[17] = 0x00; frame[18] = 0x00; frame[19] = 0x00;
  // checksum
  let cs = 0;
  for (let i = 1; i < 34; i++) cs += frame[i];
  frame[34] = cs & 0xFF;
  frame[35] = 0x15; // end
  return frame.slice(0, 36);
}

function testSolarman(ip) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(5000);
    let received = '';

    socket.connect(8899, ip, () => {
      console.log(`✅ ${ip}:8899 CONECTADO — enviando handshake Solarman...`);
      const req = buildSolarmanRequest(LOGGER_SN);
      socket.write(req);
    });

    socket.on('data', (data) => {
      received += data.toString('hex');
      console.log(`📦 ${ip} respuesta: ${data.toString('hex')}`);
      socket.destroy();
      resolve({ ip, data: received });
    });

    socket.on('error', (e) => { resolve(null); });
    socket.on('timeout', () => { socket.destroy(); resolve(null); });
    socket.on('close', () => { if (!received) resolve(null); });
  });
}

async function main() {
  console.log('Buscando Solarman Wi-Fi Plug Pro en la red...\n');
  for (const ip of IPS) {
    console.log(`Probando ${ip}:8899...`);
    const r = await testSolarman(ip);
    if (r) {
      console.log(`\n✅ LOGGER ENCONTRADO en ${r.ip}`);
      return;
    }
  }
  console.log('\n❌ No se encontró el logger por protocolo Solarman V5.');
  console.log('Prueba: desinstala el Cloudflare WARP y vuelve a intentarlo.');
}

main();
