const dgram = require('dgram');
const net = require('net');

const IP = '192.168.88.88';

// Probar UDP en varios puertos
function testUDP(port, msg) {
  return new Promise((resolve) => {
    const client = dgram.createSocket('udp4');
    client.bind(() => {
      client.setBroadcast(true);
      client.send(msg, 0, msg.length, port, IP);
      client.send(msg, 0, msg.length, port, '255.255.255.255');
    });
    client.on('message', (data, rinfo) => {
      console.log(`✅ UDP respuesta en puerto ${port} de ${rinfo.address}: ${data.toString('hex')} | ${data.toString()}`);
      client.close();
      resolve(true);
    });
    client.on('error', () => resolve(false));
    setTimeout(() => { try { client.close(); } catch(e){} resolve(false); }, 2000);
  });
}

async function main() {
  console.log('Probando UDP...\n');

  // Paquetes de descubrimiento conocidos para loggers chinos
  const paquetes = [
    { nombre: 'Solarman discovery', data: Buffer.from('WIFIKIT-214028-READ') },
    { nombre: 'SolarmanV5 hello',   data: Buffer.from([0xa5,0x01,0x00,0x10,0x47,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x02,0x01,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x15]) },
    { nombre: 'Easun hello',        data: Buffer.from('hello') },
    { nombre: 'AT command',         data: Buffer.from('AT+\r\n') },
    { nombre: 'broadcast',          data: Buffer.from([0xff,0xff,0xff,0xff]) },
  ];

  const puertos = [8899, 48899, 58899, 6607, 6608, 6709, 5555];

  for (const p of puertos) {
    for (const pq of paquetes) {
      const r = await testUDP(p, pq.data);
      if (r) console.log(`  -> ${pq.nombre} en puerto ${p}`);
    }
  }

  console.log('\nFin.');
}

main();
