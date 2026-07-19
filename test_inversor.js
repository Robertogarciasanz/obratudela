// Test de conexión al módulo WiFi Solarman del inversor Easun
// Serial: Q0047462933640191005

const net = require('net');
const dgram = require('dgram');

const IP = '192.168.88.88';
const SERIAL = 'Q0047462933640191005';

// Intentar TCP en varios puertos
function testTCP(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(3000);
    socket.connect(port, IP, () => {
      console.log(`✅ TCP puerto ${port} ABIERTO`);
      socket.destroy();
      resolve(true);
    });
    socket.on('error', () => { resolve(false); });
    socket.on('timeout', () => { socket.destroy(); resolve(false); });
  });
}

// Enviar paquete de descubrimiento UDP Solarman (broadcast)
function testUDP() {
  return new Promise((resolve) => {
    const client = dgram.createSocket('udp4');
    client.bind(() => {
      client.setBroadcast(true);
      // Paquete de descubrimiento Solarman
      const msg = Buffer.from('WIFIKIT-214028-READ', 'ascii');
      client.send(msg, 0, msg.length, 48899, '255.255.255.255', () => {
        console.log('UDP broadcast enviado al puerto 48899...');
      });
      client.send(msg, 0, msg.length, 48899, IP, () => {
        console.log(`UDP enviado a ${IP}:48899...`);
      });
      setTimeout(() => {
        client.close();
        resolve();
      }, 3000);
      client.on('message', (msg, rinfo) => {
        console.log(`✅ Respuesta UDP de ${rinfo.address}:${rinfo.port}: ${msg.toString('hex')}`);
      });
    });
  });
}

async function main() {
  console.log(`Buscando inversor en ${IP}...\n`);

  const puertos = [8899, 48899, 502, 80, 8080, 23];
  for (const p of puertos) {
    await testTCP(p);
  }

  console.log('\nProbando descubrimiento UDP...');
  await testUDP();

  console.log('\nFin del test.');
}

main();
