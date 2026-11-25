/**
 * API de precios para agentes de IA — ObraTudela
 *
 * Cobra en céntimos (USDC) con el protocolo abierto x402, versión 2
 * (https://github.com/coinbase/x402). No usa ninguna librería: x402 es solo
 * HTTP con tres cabeceras, y la comprobación del pago la hace un
 * "facilitador" externo.
 *
 * Se despliega como Cloudflare Worker (ver LEEME.md). Toda la configuración
 * está en wrangler.toml. Mientras PAGOS_ACTIVOS no sea "si" y COBRAR_A esté
 * vacío, los servicios de pago responden "servicio no activo" y no se cobra
 * nada.
 *
 * Rutas:
 *   GET  /                      Información gratuita: servicios, precios, contacto
 *   GET  /api/precio?cod=XXX    Una partida con su precio (de pago)
 *   POST /api/oferta            Rellena una petición de oferta completa (de pago)
 */

// USDC en cada red admitida. "extra" es el dominio EIP-712 del contrato:
// tiene que coincidir exactamente con el del token o el pago no valida.
const REDES = {
  'eip155:84532': {
    nombre: 'Base Sepolia (red de pruebas, dinero ficticio)',
    usdc: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    extra: { name: 'USDC', version: '2' }
  },
  'eip155:8453': {
    nombre: 'Base (red real)',
    usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    extra: { name: 'USD Coin', version: '2' }
  }
};

const CONTACTO = {
  empresa: 'Excavaciones y Servicios Arturo S.L.',
  telefono: '+34 607 444 903',
  whatsapp: 'https://wa.me/34607444903',
  email: 'excavacionesart@gmail.com',
  web: 'https://www.obratudela.com'
};

const NOTA_PRECIOS = 'Precios de referencia del banco de precios de la construcción ' +
  'BCEXTREM 2026. Son orientativos: para un presupuesto real de excavación, ' +
  'movimiento de tierras o demolición en la zona de Valladolid, contacte con la empresa.';

const MAX_LINEAS_OFERTA = 100;

// ---------------------------------------------------------------------------
// Datos: la base de precios ligera se descarga de la web y se guarda en
// memoria mientras el Worker siga vivo (solo lectura).
// ---------------------------------------------------------------------------

let datosPromesa = null;

function cargarDatos(env) {
  if (!datosPromesa) {
    datosPromesa = fetch(env.URL_DATOS, { cf: { cacheTtl: 3600 } })
      .then((res) => {
        if (!res.ok) throw new Error('No se pudo descargar la base de precios: ' + res.status);
        return res.json();
      })
      .then((filas) => {
        const porCodigo = new Map();
        const lista = [];
        for (const [cod, uni, precio, res, grupo] of filas) {
          const partida = { cod, uni, precio, res, grupo, palabras: palabras(res) };
          porCodigo.set(cod.toUpperCase(), partida);
          lista.push(partida);
        }
        return { porCodigo, lista };
      })
      .catch((err) => {
        datosPromesa = null; // reintentar en la siguiente petición
        throw err;
      });
  }
  return datosPromesa;
}

function normalizar(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFKD') // quita tildes y convierte "m³" en "m3"
    .replace(/[̀-ͯ]/g, '');
}

// Palabras de más de 2 letras, y también medidas cortas como "8" o "m3"
function palabras(texto) {
  return normalizar(texto).split(/[^a-z0-9]+/).filter((p) => p.length > 2 || /\d/.test(p));
}

// Busca la partida cuyo resumen comparte más palabras con el texto pedido.
function buscarPorTexto(lista, texto) {
  const buscadas = [...new Set(palabras(texto))];
  if (buscadas.length === 0) return null;
  let mejor = null;
  let mejorPuntos = 0;
  for (const partida of lista) {
    let aciertos = 0;
    for (const p of buscadas) {
      if (partida.palabras.includes(p)) aciertos++;
    }
    if (aciertos === 0) continue;
    // Premia cubrir lo buscado y, a igualdad, el resumen más corto (más concreto)
    const puntos = aciertos / buscadas.length - partida.palabras.length * 0.001;
    if (puntos > mejorPuntos) {
      mejorPuntos = puntos;
      mejor = partida;
    }
  }
  if (!mejor) return null;
  return { partida: mejor, confianza: Math.round(Math.max(0, mejorPuntos) * 100) / 100 };
}

function publica(partida) {
  return { cod: partida.cod, uni: partida.uni, res: partida.res, precio: partida.precio, grupo: partida.grupo };
}

// ---------------------------------------------------------------------------
// x402: pedir el pago, verificarlo y liquidarlo a través del facilitador
// ---------------------------------------------------------------------------

function aBase64(objeto) {
  const bytes = new TextEncoder().encode(JSON.stringify(objeto));
  let binario = '';
  for (const b of bytes) binario += String.fromCharCode(b);
  return btoa(binario);
}

function deBase64(texto) {
  const binario = atob(texto);
  const bytes = Uint8Array.from(binario, (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

// "0.01" dólares -> "10000" (USDC tiene 6 decimales)
function aUnidadesUsdc(precio) {
  return String(Math.round(parseFloat(precio) * 1e6));
}

function pagosActivos(env) {
  return env.PAGOS_ACTIVOS === 'si' && /^0x[0-9a-fA-F]{40}$/.test(env.COBRAR_A || '') && REDES[env.RED];
}

function requisitosDePago(env, url, precio, descripcion) {
  const red = REDES[env.RED];
  return {
    x402Version: 2,
    error: 'Hace falta la cabecera PAYMENT-SIGNATURE con el pago',
    resource: {
      url,
      description: descripcion,
      mimeType: 'application/json',
      serviceName: 'ObraTudela precios'
    },
    accepts: [{
      scheme: 'exact',
      network: env.RED,
      amount: aUnidadesUsdc(precio),
      asset: red.usdc,
      payTo: env.COBRAR_A,
      maxTimeoutSeconds: 60,
      extra: red.extra
    }]
  };
}

async function llamarFacilitador(env, ruta, cuerpo) {
  const cabeceras = { 'Content-Type': 'application/json' };
  if (env.FACILITADOR_TOKEN) cabeceras.Authorization = 'Bearer ' + env.FACILITADOR_TOKEN;
  const res = await fetch(env.FACILITADOR.replace(/\/$/, '') + ruta, {
    method: 'POST',
    headers: cabeceras,
    body: JSON.stringify(cuerpo)
  });
  if (!res.ok) throw new Error('Facilitador ' + ruta + ' respondió ' + res.status);
  return res.json();
}

/**
 * Envuelve un servicio de pago. "servir" solo se ejecuta si el pago es
 * válido, y el cobro solo se liquida si "servir" ha funcionado.
 */
async function cobrar(request, env, precio, descripcion, servir) {
  if (!pagosActivos(env)) {
    return json({
      error: 'servicio_no_activo',
      mensaje: 'Este servicio de pago todavía no está activo. Para precios y presupuestos, contacte con la empresa.',
      contacto: CONTACTO
    }, 503);
  }

  const url = new URL(request.url);
  const requisitos = requisitosDePago(env, url.origin + url.pathname, precio, descripcion);
  const firma = request.headers.get('PAYMENT-SIGNATURE');

  if (!firma) {
    return json(requisitos, 402, { 'PAYMENT-REQUIRED': aBase64(requisitos) });
  }

  let pago;
  try {
    pago = deBase64(firma);
  } catch {
    return json({ error: 'pago_ilegible', mensaje: 'La cabecera PAYMENT-SIGNATURE no es base64 de JSON válido' }, 400);
  }

  const peticion = { x402Version: 2, paymentPayload: pago, paymentRequirements: requisitos.accepts[0] };

  const verificacion = await llamarFacilitador(env, '/verify', peticion);
  if (!verificacion.isValid) {
    const r = { ...requisitos, error: verificacion.invalidReason || 'pago_no_valido' };
    return json(r, 402, { 'PAYMENT-REQUIRED': aBase64(r) });
  }

  const respuesta = await servir();

  const liquidacion = await llamarFacilitador(env, '/settle', peticion);
  if (!liquidacion.success) {
    const r = { ...requisitos, error: liquidacion.errorReason || 'cobro_fallido' };
    return json(r, 402, { 'PAYMENT-REQUIRED': aBase64(r) });
  }

  return json(respuesta, 200, { 'PAYMENT-RESPONSE': aBase64(liquidacion) });
}

// ---------------------------------------------------------------------------
// Servicios
// ---------------------------------------------------------------------------

function info(env) {
  const activo = Boolean(pagosActivos(env));
  return json({
    servicio: 'API de precios de construcción de ObraTudela para agentes de IA',
    estado: activo ? 'activo' : 'en preparación (todavía no cobra ni sirve datos de pago)',
    pago: {
      protocolo: 'x402 v2',
      moneda: 'USDC',
      red: REDES[env.RED] ? env.RED + ' — ' + REDES[env.RED].nombre : env.RED
    },
    servicios: [
      {
        ruta: 'GET /api/precio?cod=CODIGO',
        precio_usd: env.PRECIO_CONSULTA,
        descripcion: 'Una partida de obra con unidad y precio de referencia. Si el código no existe, no se cobra.'
      },
      {
        ruta: 'POST /api/oferta',
        precio_usd: env.PRECIO_OFERTA,
        descripcion: 'Rellena una petición de oferta: hasta ' + MAX_LINEAS_OFERTA + ' líneas con código o descripción y cantidad; devuelve precio, importe y total.',
        ejemplo_cuerpo: { lineas: [{ cod: 'M05RN060', cantidad: 8 }, { texto: 'contenedor escombros 8 m3', cantidad: 2 }] }
      }
    ],
    nota: NOTA_PRECIOS,
    contacto: CONTACTO
  });
}

async function precio(request, env) {
  const cod = (new URL(request.url).searchParams.get('cod') || '').trim().toUpperCase();
  if (!cod) return json({ error: 'falta_codigo', mensaje: 'Indique ?cod=CODIGO' }, 400);

  // Comprobar antes de cobrar: si no existe, no se cobra
  const { porCodigo } = await cargarDatos(env);
  const partida = porCodigo.get(cod);
  if (!partida) return json({ error: 'no_encontrada', mensaje: 'No existe la partida ' + cod }, 404);

  return cobrar(request, env, env.PRECIO_CONSULTA, 'Precio de la partida ' + cod, async () => ({
    partida: publica(partida),
    nota: NOTA_PRECIOS,
    contacto: CONTACTO
  }));
}

async function oferta(request, env) {
  let cuerpo;
  try {
    cuerpo = await request.json();
  } catch {
    return json({ error: 'cuerpo_no_valido', mensaje: 'Envíe JSON: {"lineas":[{"cod":"...","cantidad":1}]}' }, 400);
  }
  const lineas = Array.isArray(cuerpo && cuerpo.lineas) ? cuerpo.lineas : null;
  if (!lineas || lineas.length === 0) {
    return json({ error: 'sin_lineas', mensaje: 'El campo "lineas" debe ser una lista no vacía' }, 400);
  }
  if (lineas.length > MAX_LINEAS_OFERTA) {
    return json({ error: 'demasiadas_lineas', mensaje: 'Máximo ' + MAX_LINEAS_OFERTA + ' líneas por oferta' }, 400);
  }

  // Se calcula antes de cobrar (pero solo se entrega tras el pago):
  // si no se encuentra ninguna partida, no se cobra.
  const datos = await cargarDatos(env);
  const calculada = calcularOferta(datos, lineas);
  if (!calculada.lineas.some((l) => l.coincidencia !== 'no_encontrada')) {
    return json({ error: 'nada_encontrado', mensaje: 'No se ha encontrado ninguna de las partidas pedidas; no se cobra.' }, 404);
  }

  return cobrar(request, env, env.PRECIO_OFERTA, 'Oferta de ' + lineas.length + ' líneas', async () => calculada);
}

function calcularOferta(datos, lineas) {
  let total = 0;
  const resultado = lineas.map((linea) => {
    const cantidad = Number(linea && linea.cantidad) || 1;
    const cod = String((linea && linea.cod) || '').trim().toUpperCase();
    let partida = cod ? datos.porCodigo.get(cod) : null;
    let coincidencia = partida ? 'codigo' : null;
    let confianza = partida ? 1 : 0;

    if (!partida && linea && linea.texto) {
      const encontrada = buscarPorTexto(datos.lista, linea.texto);
      if (encontrada) {
        partida = encontrada.partida;
        coincidencia = 'texto';
        confianza = encontrada.confianza;
      }
    }

    if (!partida) return { entrada: linea, coincidencia: 'no_encontrada' };

    const importe = Math.round(partida.precio * cantidad * 100) / 100;
    total += importe;
    return { entrada: linea, ...publica(partida), cantidad, importe, coincidencia, confianza };
  });

  return {
    lineas: resultado,
    total: Math.round(total * 100) / 100,
    moneda_precios: 'EUR',
    nota: NOTA_PRECIOS,
    contacto: CONTACTO
  };
}

// ---------------------------------------------------------------------------
// Entrada
// ---------------------------------------------------------------------------

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, PAYMENT-SIGNATURE',
  'Access-Control-Expose-Headers': 'PAYMENT-REQUIRED, PAYMENT-RESPONSE'
};

function json(cuerpo, estado = 200, cabeceras = {}) {
  return new Response(JSON.stringify(cuerpo, null, 2), {
    status: estado,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS, ...cabeceras }
  });
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    try {
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
      if (request.method === 'GET' && (pathname === '/' || pathname === '/api' || pathname === '/api/')) return info(env);
      if (request.method === 'GET' && pathname === '/api/precio') return await precio(request, env);
      if (request.method === 'POST' && pathname === '/api/oferta') return await oferta(request, env);
      return json({ error: 'no_existe', mensaje: 'Ruta no encontrada. Vea GET / para la lista de servicios.' }, 404);
    } catch (err) {
      console.error(err);
      return json({ error: 'error_interno', mensaje: 'Error del servidor; no se ha cobrado nada si el pago no se liquidó.' }, 500);
    }
  }
};
