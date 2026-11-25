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

import SUPERFICIES_BICI from './bici-superficies.js';

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

const ICONO = 'https://www.obratudela.com/img/icon-192x192.png';

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

// Las N partidas que mejor encajan con el texto (para el buscador gratuito)
function buscarVarias(lista, texto, cuantas) {
  const buscadas = [...new Set(palabras(texto))];
  if (buscadas.length === 0) return [];
  const mejores = [];
  for (const partida of lista) {
    let aciertos = 0;
    for (const p of buscadas) {
      if (partida.palabras.includes(p)) aciertos++;
    }
    if (aciertos === 0) continue;
    const puntos = aciertos / buscadas.length - partida.palabras.length * 0.001;
    if (mejores.length < cuantas || puntos > mejores[mejores.length - 1].puntos) {
      mejores.push({ partida, puntos });
      mejores.sort((a, b) => b.puntos - a.puntos);
      if (mejores.length > cuantas) mejores.pop();
    }
  }
  return mejores.map(({ partida, puntos }) => ({
    cod: partida.cod,
    uni: partida.uni,
    res: partida.res,
    grupo: partida.grupo,
    coincidencia: Math.round(Math.max(0, puntos) * 100) / 100
  }));
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

// Ficha de cada servicio para los directorios de APIs x402 ("Bazaar" de
// PayAI y Coinbase): qué hace, qué recibe y qué devuelve. Va en la
// respuesta 402, en extensions.bazaar (especificación x402 v2).
const ESQUEMA_JSON = 'https://json-schema.org/draft/2020-12/schema';

const FICHAS = {
  '/api/precio': {
    descripcion: 'Spanish construction unit price lookup (BCEXTREM 2026 + BCCA, 63,447 items). ' +
      'Use when you need the reference price in EUR, unit and description of a Spanish building or ' +
      'civil-works item by its BC3 code, e.g. excavation, demolition, machinery hire. ' +
      'Precio de referencia de una partida de obra por su código BC3.',
    tags: ['construction', 'prices', 'spain', 'bc3', 'civil-works'],
    bazaar: {
      info: {
        input: { type: 'http', method: 'GET', queryParams: { cod: 'M12O013' } },
        output: {
          type: 'json',
          example: { partida: { cod: 'M12O013', uni: 'ud', res: 'Contenedor para escombros 8 m3', precio: 215, grupo: 'MAQUINARIA' } }
        }
      },
      schema: {
        $schema: ESQUEMA_JSON,
        type: 'object',
        properties: {
          input: {
            type: 'object',
            properties: {
              type: { type: 'string', const: 'http' },
              method: { type: 'string', enum: ['GET', 'HEAD', 'DELETE'] },
              queryParams: {
                type: 'object',
                properties: { cod: { type: 'string', description: 'Código BC3 de la partida, p. ej. M12O013' } },
                required: ['cod']
              }
            },
            required: ['type', 'method'],
            additionalProperties: false
          },
          output: { type: 'object', properties: { type: { type: 'string' }, example: { type: 'object' } }, required: ['type'] }
        },
        required: ['input']
      }
    }
  },
  '/api/oferta': {
    descripcion: 'Prices a Spanish construction bill of quantities: up to 100 lines by BC3 code or free-text ' +
      'description (Spanish) with quantity; returns unit price, amount and total in EUR from BCEXTREM 2026 + BCCA. ' +
      'Rellena una petición de oferta de obra con precios de referencia.',
    tags: ['construction', 'quote', 'spain', 'bill-of-quantities', 'prices'],
    bazaar: {
      info: {
        input: {
          type: 'http',
          method: 'POST',
          bodyType: 'json',
          body: { lineas: [{ cod: 'M05RN060', cantidad: 8 }, { texto: 'contenedor escombros 8 m3', cantidad: 2 }] }
        },
        output: {
          type: 'json',
          example: { lineas: [{ cod: 'M05RN060', res: 'Mini retroexcavadora', precio: 31.9, cantidad: 8, importe: 255.2 }], total: 685.2, moneda_precios: 'EUR' }
        }
      },
      schema: {
        $schema: ESQUEMA_JSON,
        type: 'object',
        properties: {
          input: {
            type: 'object',
            properties: {
              type: { type: 'string', const: 'http' },
              method: { type: 'string', enum: ['POST', 'PUT', 'PATCH'] },
              bodyType: { type: 'string', enum: ['json'] },
              body: {
                type: 'object',
                properties: {
                  lineas: {
                    type: 'array',
                    maxItems: 100,
                    items: {
                      type: 'object',
                      properties: {
                        cod: { type: 'string', description: 'Código BC3 (opcional si hay texto)' },
                        texto: { type: 'string', description: 'Descripción en español (si no hay código)' },
                        cantidad: { type: 'number' }
                      }
                    }
                  }
                },
                required: ['lineas']
              }
            },
            required: ['type', 'method', 'bodyType', 'body'],
            additionalProperties: false
          },
          output: { type: 'object', properties: { type: { type: 'string' }, example: { type: 'object' } }, required: ['type'] }
        },
        required: ['input']
      }
    }
  }
};

// Fichas de los servicios de la bici en 3D (cenital.org)
const ESQUEMA_ID_PIEZA = { type: 'string', description: 'Id de la pieza (ver /api/piezas), p. ej. Buje_cuerpo_1' };

Object.assign(FICHAS, {
  '/api/pieza': {
    descripcion: 'Technical data sheet of one part of an open-licence 3D road bicycle (113 parts, SolidWorks 2020, cenital.org): ' +
      'size in mm, volume, surface, weight in steel/aluminium/titanium/carbon/PLA, whether it fits a 256 mm 3D printer, and links to its STL, ' +
      'dimensioned PDF drawing and SolidWorks file. Ficha técnica de una pieza de la bici en 3D.',
    tags: ['3d-models', 'stl', 'cad', 'bicycle', 'solidworks'],
    bazaar: {
      info: {
        input: { type: 'http', method: 'GET', queryParams: { id: 'Buje_cuerpo_1' } },
        output: {
          type: 'json',
          example: { pieza: { id: 'Buje_cuerpo_1', nombre: 'Buje cuerpo', medidas_mm: { x: 50, y: 50, z: 75.5 }, volumen_cm3: 51.17, peso_g_segun_material: { aluminio: 138.2, PLA: 63.5 } } }
        }
      },
      schema: {
        $schema: ESQUEMA_JSON,
        type: 'object',
        properties: {
          input: {
            type: 'object',
            properties: {
              type: { type: 'string', const: 'http' },
              method: { type: 'string', enum: ['GET', 'HEAD', 'DELETE'] },
              queryParams: { type: 'object', properties: { id: ESQUEMA_ID_PIEZA }, required: ['id'] }
            },
            required: ['type', 'method'],
            additionalProperties: false
          },
          output: { type: 'object', properties: { type: { type: 'string' }, example: { type: 'object' } }, required: ['type'] }
        },
        required: ['input']
      }
    }
  },
  '/api/imprimir': {
    descripcion: '3D printing estimate for one part of an open-licence 3D road bicycle (cenital.org): filament grams, metres, ' +
      'approximate print time and cost for PLA, PETG, ABS or TPU at a given infill, and whether it fits a 256 mm printer (Elegoo Centuri Carbon). ' +
      'Cálculo de impresión 3D de una pieza.',
    tags: ['3d-printing', 'stl', 'filament', 'estimate', 'bicycle'],
    bazaar: {
      info: {
        input: { type: 'http', method: 'GET', queryParams: { id: 'Buje_cuerpo_1', material: 'PLA', relleno: '20' } },
        output: {
          type: 'json',
          example: { impresion: { pieza: 'Buje_cuerpo_1', material: 'PLA', relleno_pct: 20, gramos: 30.1, metros_filamento: 10.1, horas_aprox: 0.5, coste_eur_aprox: 0.6, cabe_en_impresora: true } }
        }
      },
      schema: {
        $schema: ESQUEMA_JSON,
        type: 'object',
        properties: {
          input: {
            type: 'object',
            properties: {
              type: { type: 'string', const: 'http' },
              method: { type: 'string', enum: ['GET', 'HEAD', 'DELETE'] },
              queryParams: {
                type: 'object',
                properties: {
                  id: ESQUEMA_ID_PIEZA,
                  material: { type: 'string', enum: ['PLA', 'PETG', 'ABS', 'TPU'], description: 'Filamento (por defecto PLA)' },
                  relleno: { type: 'string', description: 'Relleno en % de 0 a 100 (por defecto 20)' }
                },
                required: ['id']
              }
            },
            required: ['type', 'method'],
            additionalProperties: false
          },
          output: { type: 'object', properties: { type: { type: 'string' }, example: { type: 'object' } }, required: ['type'] }
        },
        required: ['input']
      }
    }
  }
});

function requisitosDePago(env, url, precio, ruta) {
  const red = REDES[env.RED];
  const ficha = FICHAS[ruta];
  return {
    x402Version: 2,
    error: 'Hace falta la cabecera PAYMENT-SIGNATURE con el pago',
    resource: {
      url,
      description: ficha.descripcion,
      mimeType: 'application/json',
      serviceName: 'ObraTudela precios',
      tags: ficha.tags,
      iconUrl: ICONO
    },
    accepts: [{
      scheme: 'exact',
      network: env.RED,
      amount: aUnidadesUsdc(precio),
      asset: red.usdc,
      payTo: env.COBRAR_A,
      maxTimeoutSeconds: 60,
      extra: red.extra
    }],
    extensions: { bazaar: ficha.bazaar }
  };
}

// --- Firma para el facilitador de Coinbase (CDP) -------------------------
// Coinbase pide en cada llamada un JWT firmado con la clave secreta de API
// (tipo Ed25519, la que da por defecto). Los secretos CDP_API_KEY_ID y
// CDP_API_KEY_SECRET se guardan en Cloudflare con "npx wrangler secret put".

function aBase64Url(bytes) {
  let binario = '';
  for (const b of bytes) binario += String.fromCharCode(b);
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const jsonABase64Url = (objeto) => aBase64Url(new TextEncoder().encode(JSON.stringify(objeto)));

let clavePromesa = null;

function claveCoinbase(env) {
  if (!clavePromesa) {
    // La clave secreta Ed25519 de Coinbase son 64 bytes en base64: los 32
    // primeros son la semilla privada. WebCrypto la importa en formato PKCS#8.
    const bytes = Uint8Array.from(atob(env.CDP_API_KEY_SECRET.trim()), (c) => c.charCodeAt(0));
    if (bytes.length !== 64) {
      throw new Error('CDP_API_KEY_SECRET no parece una clave Ed25519 de Coinbase (64 bytes en base64)');
    }
    const cabeceraPkcs8 = [0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x04, 0x22, 0x04, 0x20];
    const pkcs8 = new Uint8Array([...cabeceraPkcs8, ...bytes.slice(0, 32)]);
    clavePromesa = crypto.subtle.importKey('pkcs8', pkcs8, { name: 'Ed25519' }, false, ['sign'])
      .catch((err) => {
        clavePromesa = null;
        throw err;
      });
  }
  return clavePromesa;
}

async function jwtCoinbase(env, metodo, url) {
  const { host, pathname } = new URL(url);
  const ahora = Math.floor(Date.now() / 1000);
  const nonce = [...crypto.getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, '0')).join('');
  const cabecera = { alg: 'EdDSA', typ: 'JWT', kid: env.CDP_API_KEY_ID, nonce };
  const datos = {
    sub: env.CDP_API_KEY_ID,
    iss: 'cdp',
    aud: ['cdp_service'],
    nbf: ahora,
    exp: ahora + 120,
    uri: metodo + ' ' + host + pathname
  };
  const entrada = jsonABase64Url(cabecera) + '.' + jsonABase64Url(datos);
  const firma = await crypto.subtle.sign({ name: 'Ed25519' }, await claveCoinbase(env), new TextEncoder().encode(entrada));
  return entrada + '.' + aBase64Url(new Uint8Array(firma));
}

async function llamarFacilitador(env, ruta, cuerpo) {
  const url = env.FACILITADOR.replace(/\/$/, '') + ruta;
  const cabeceras = { 'Content-Type': 'application/json' };
  if (env.CDP_API_KEY_ID && env.CDP_API_KEY_SECRET && new URL(url).host === 'api.cdp.coinbase.com') {
    cabeceras.Authorization = 'Bearer ' + await jwtCoinbase(env, 'POST', url);
  } else if (env.FACILITADOR_TOKEN) {
    cabeceras.Authorization = 'Bearer ' + env.FACILITADOR_TOKEN;
  }
  const res = await fetch(url, { method: 'POST', headers: cabeceras, body: JSON.stringify(cuerpo) });
  const texto = await res.text();
  let datos = null;
  try { datos = JSON.parse(texto); } catch { /* respuesta que no es JSON */ }
  if (res.ok && datos) return datos;
  // Algunos facilitadores responden a un pago inválido con un error HTTP
  // (400) en vez de {isValid:false}: se trata como pago rechazado.
  if (res.status >= 400 && res.status < 500 && datos && (datos.isValid === false || datos.success === false || datos.invalidReason || datos.errorReason)) {
    return { isValid: false, success: false, invalidReason: datos.invalidReason || datos.errorReason || 'pago_no_valido', errorReason: datos.errorReason || datos.invalidReason || 'pago_no_valido' };
  }
  if (res.status === 400) {
    return { isValid: false, success: false, invalidReason: 'pago_no_valido', errorReason: 'pago_no_valido' };
  }
  // El detalle va solo al registro de Cloudflare, no al cliente
  console.error('Facilitador', ruta, res.status, texto.slice(0, 500));
  throw new Error('Facilitador ' + ruta + ' respondió ' + res.status);
}

/**
 * Envuelve un servicio de pago. "servir" solo se ejecuta si el pago es
 * válido, y el cobro solo se liquida si "servir" ha funcionado.
 */
async function cobrar(request, env, precio, servir) {
  if (!pagosActivos(env)) {
    return json({
      error: 'servicio_no_activo',
      mensaje: 'Este servicio de pago todavía no está activo. Para precios y presupuestos, contacte con la empresa.',
      contacto: CONTACTO
    }, 503);
  }

  const url = new URL(request.url);
  const requisitos = requisitosDePago(env, url.origin + url.pathname, precio, url.pathname);
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
        ruta: 'GET /api/piezas?q=TEXTO',
        precio_usd: '0',
        descripcion: 'Gratis. Catálogo de las 113 piezas de la bici en 3D de cenital.org (licencia libre): id, nombre, conjunto y medidas.'
      },
      {
        ruta: 'GET /api/pieza?id=ID',
        precio_usd: env.PRECIO_PIEZA,
        descripcion: 'Ficha técnica de una pieza: medidas, volumen, superficie, peso en 5 materiales, si cabe en una impresora de 256 mm y enlaces a STL, plano PDF y SolidWorks.'
      },
      {
        ruta: 'GET /api/imprimir?id=ID&material=PLA&relleno=20',
        precio_usd: env.PRECIO_IMPRESION,
        descripcion: 'Cálculo de impresión 3D de una pieza: gramos y metros de filamento, horas y coste aproximados (PLA, PETG, ABS o TPU).'
      },
      {
        ruta: 'GET /api/buscar?q=TEXTO',
        precio_usd: '0',
        descripcion: 'Gratis. Busca partidas por texto en español y devuelve sus códigos BC3, unidad y descripción (sin precio).'
      },
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

// ---------------------------------------------------------------------------
// Bici en 3D de cenital.org: 113 piezas con STL, plano PDF y SolidWorks.
// Los datos salen de cenital.org/bici/datos.json (público, licencia libre);
// la superficie de cada pieza, de bici-superficies.js.
// ---------------------------------------------------------------------------

// Densidades en g/cm³ (las mismas que el visor de cenital.org)
const MATERIALES_PESO = { acero: 7.85, aluminio: 2.70, titanio: 4.51, fibra_carbono: 1.60, PLA: 1.24 };

// Filamentos para el cálculo de impresión: densidad g/cm³ y precio orientativo €/kg
const FILAMENTOS = {
  PLA: { densidad: 1.24, eur_kg: 20 },
  PETG: { densidad: 1.27, eur_kg: 22 },
  ABS: { densidad: 1.04, eur_kg: 22 },
  TPU: { densidad: 1.21, eur_kg: 30 }
};

// Impresora de referencia: Elegoo Centuri Carbon (volumen 256 × 256 × 256 mm)
const IMPRESORA = { nombre: 'Elegoo Centuri Carbon', volumen_mm: [256, 256, 256], caudal_mm3_s: 15 };
const PARED_MM = 1.2; // paredes: 3 perímetros de 0,4 mm más capas superior e inferior
const DIAMETRO_FILAMENTO_MM = 1.75;

let biciPromesa = null;

function cargarBici(env) {
  if (!biciPromesa) {
    biciPromesa = fetch(env.URL_BICI, { cf: { cacheTtl: 3600 } })
      .then((res) => {
        if (!res.ok) throw new Error('No se pudo descargar datos.json de la bici: ' + res.status);
        return res.json();
      })
      .then((datos) => ({
        base: new URL('./', env.URL_BICI).href,
        licencia: datos.licencia,
        autor: datos.autor,
        web: datos.web,
        piezas: datos.piezas,
        porId: new Map(datos.piezas.map((p) => [p.id.toLowerCase(), p]))
      }))
      .catch((err) => {
        biciPromesa = null;
        throw err;
      });
  }
  return biciPromesa;
}

const redondear = (n, d = 1) => Math.round(n * 10 ** d) / 10 ** d;

function cabeEnImpresora(caja) {
  const pieza = [...caja].sort((a, b) => a - b);
  const vol = [...IMPRESORA.volumen_mm].sort((a, b) => a - b);
  return pieza.every((m, i) => m <= vol[i]);
}

function archivosPieza(bici, p) {
  return {
    stl: bici.base + p.stl,
    plano_pdf: p.pdf ? bici.base + p.pdf : null,
    solidworks: p.sw ? bici.base + p.sw : null,
    visor: 'https://cenital.org/bici/'
  };
}

// Catálogo GRATUITO de piezas (para encontrarlas); la ficha completa es de pago
async function catalogoBici(request, env) {
  const url = new URL(request.url);
  const q = normalizar(url.searchParams.get('q') || '');
  const bici = await cargarBici(env);
  const piezas = bici.piezas
    .filter((p) => !q || normalizar(p.nombre + ' ' + p.conjunto + ' ' + p.id + ' ' + (p.codigo || '')).includes(q))
    .map((p) => ({ id: p.id, nombre: p.nombre, conjunto: p.conjunto, codigo: p.codigo || null, medidas_mm: p.caja }));
  return json({
    modelo: 'Bicicleta de carretera completa en 3D (SolidWorks 2020), cenital.org',
    licencia: bici.licencia,
    autor: bici.autor,
    total: piezas.length,
    piezas,
    siguiente_paso: 'Ficha completa (volumen, superficie, peso en 5 materiales, archivos): GET ' + url.origin + '/api/pieza?id=ID (' +
      env.PRECIO_PIEZA + ' USD). Cálculo de impresión 3D: GET ' + url.origin + '/api/imprimir?id=ID&material=PLA&relleno=20 (' +
      env.PRECIO_IMPRESION + ' USD). Pago x402.',
    descargas_gratis: 'https://cenital.org/bici/'
  });
}

function fichaPieza(bici, p) {
  const area = SUPERFICIES_BICI[p.id] || null;
  const pesos = {};
  for (const [m, d] of Object.entries(MATERIALES_PESO)) pesos[m] = redondear(p.vol * d, 1);
  return {
    id: p.id,
    nombre: p.nombre,
    conjunto: p.conjunto,
    subconjunto: p.subconjunto || null,
    codigo: p.codigo || null,
    clasificacion: p.clasificacion || null,
    norma: p.norma || null,
    designacion: p.designacion || null,
    material_diseno: p.material || null,
    masa_diseno_g: p.masa_g,
    medidas_mm: { x: p.caja[0], y: p.caja[1], z: p.caja[2] },
    volumen_cm3: p.vol,
    superficie_cm2: area ? redondear(area / 100, 1) : null,
    triangulos: p.triangulos,
    peso_g_segun_material: pesos,
    densidades_g_cm3: MATERIALES_PESO,
    cabe_en_impresora: { impresora: IMPRESORA.nombre, volumen_mm: IMPRESORA.volumen_mm, cabe: cabeEnImpresora(p.caja) },
    archivos: archivosPieza(bici, p),
    licencia: bici.licencia,
    autor: bici.autor
  };
}

async function pieza(request, env) {
  const id = (new URL(request.url).searchParams.get('id') || '').trim();
  if (!id) {
    // Sin id y sin pago: 402 con la ficha (para directorios y agentes)
    if (!request.headers.get('PAYMENT-SIGNATURE')) return cobrar(request, env, env.PRECIO_PIEZA, null);
    return json({ error: 'falta_id', mensaje: 'Indique ?id=ID (ver /api/piezas)' }, 400);
  }
  const bici = await cargarBici(env);
  const p = bici.porId.get(id.toLowerCase());
  if (!p) return json({ error: 'no_encontrada', mensaje: 'No existe la pieza ' + id + '. Lista gratis en /api/piezas' }, 404);
  return cobrar(request, env, env.PRECIO_PIEZA, async () => ({ pieza: fichaPieza(bici, p) }));
}

function calculoImpresion(p, material, relleno) {
  const f = FILAMENTOS[material];
  const volumen = p.vol * 1000; // mm³
  const area = SUPERFICIES_BICI[p.id] || 0; // mm²
  const paredes = Math.min(volumen, area * PARED_MM);
  const interior = Math.max(0, volumen - paredes) * (relleno / 100);
  const plastico = paredes + interior; // mm³
  const gramos = plastico / 1000 * f.densidad;
  const seccion = Math.PI * (DIAMETRO_FILAMENTO_MM / 2) ** 2;
  const horas = plastico / IMPRESORA.caudal_mm3_s / 3600;
  const cabe = cabeEnImpresora(p.caja);
  return {
    pieza: p.id,
    nombre: p.nombre,
    material,
    relleno_pct: relleno,
    gramos: redondear(gramos, 1),
    metros_filamento: redondear(plastico / seccion / 1000, 2),
    horas_aprox: redondear(horas, 1),
    coste_eur_aprox: redondear(gramos / 1000 * f.eur_kg, 2),
    precio_filamento_eur_kg: f.eur_kg,
    impresora: IMPRESORA.nombre,
    cabe_en_impresora: cabe,
    aviso: cabe ? null : 'La pieza (' + p.caja.join(' × ') + ' mm) no cabe entera en ' + IMPRESORA.volumen_mm.join(' × ') +
      ' mm: hay que dividirla o escalarla.',
    supuestos: 'Estimación orientativa: paredes de ' + PARED_MM + ' mm, relleno ' + relleno + ' %, filamento de ' +
      DIAMETRO_FILAMENTO_MM + ' mm, caudal medio de ' + IMPRESORA.caudal_mm3_s + ' mm³/s, sin soportes.',
    stl: 'https://cenital.org/bici/' + p.stl
  };
}

async function imprimir(request, env) {
  const url = new URL(request.url);
  const id = (url.searchParams.get('id') || '').trim();
  if (!id) {
    if (!request.headers.get('PAYMENT-SIGNATURE')) return cobrar(request, env, env.PRECIO_IMPRESION, null);
    return json({ error: 'falta_id', mensaje: 'Indique ?id=ID (ver /api/piezas)' }, 400);
  }
  const material = (url.searchParams.get('material') || 'PLA').toUpperCase();
  if (!FILAMENTOS[material]) {
    return json({ error: 'material_no_valido', mensaje: 'Materiales: ' + Object.keys(FILAMENTOS).join(', ') }, 400);
  }
  const relleno = url.searchParams.has('relleno') ? Number(url.searchParams.get('relleno')) : 20;
  if (!Number.isFinite(relleno) || relleno < 0 || relleno > 100) {
    return json({ error: 'relleno_no_valido', mensaje: 'El relleno va de 0 a 100 (%)' }, 400);
  }
  const bici = await cargarBici(env);
  const p = bici.porId.get(id.toLowerCase());
  if (!p) return json({ error: 'no_encontrada', mensaje: 'No existe la pieza ' + id + '. Lista gratis en /api/piezas' }, 404);
  return cobrar(request, env, env.PRECIO_IMPRESION, async () => ({ impresion: calculoImpresion(p, material, relleno) }));
}

// Buscador GRATUITO: encuentra códigos BC3 por texto, sin precios. Los
// agentes no suelen conocer los códigos; con esto los encuentran y luego
// piden el precio (/api/precio) o la oferta completa (/api/oferta).
const MAX_RESULTADOS = 20;

async function buscar(request, env) {
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim().slice(0, 200);
  const limite = Math.min(MAX_RESULTADOS, Math.max(1, parseInt(url.searchParams.get('limite'), 10) || 10));
  if (!q) {
    return json({ error: 'falta_texto', mensaje: 'Indique ?q=texto, p. ej. ?q=contenedor escombros 8 m3', ejemplo: url.origin + '/api/buscar?q=zanja' }, 400);
  }
  const { lista } = await cargarDatos(env);
  return json({
    consulta: q,
    resultados: buscarVarias(lista, q, limite),
    siguiente_paso: 'Precio de una partida: GET ' + url.origin + '/api/precio?cod=CODIGO (' + env.PRECIO_CONSULTA +
      ' USD). Varias líneas con cantidades: POST ' + url.origin + '/api/oferta (' + env.PRECIO_OFERTA + ' USD). Pago x402.',
    contacto: CONTACTO
  });
}

// llms.txt de la propia API, para agentes que llegan directamente aquí
function llmsTxt(request, env) {
  const o = new URL(request.url).origin;
  const red = REDES[env.RED] ? REDES[env.RED].nombre : env.RED;
  const texto = [
    '# ObraTudela precios — API para agentes de IA',
    '',
    '> Precios de referencia de construcción en España (BCEXTREM 2026 + BCCA, 63.447 partidas con código BC3), de Excavaciones y Servicios Arturo S.L. (Tudela de Duero, Valladolid). Búsqueda gratuita; precios de pago por uso con x402 v2, en USDC (' + red + '), sin registro ni claves.',
    '',
    '## Cómo usarla',
    '',
    '1. Buscar códigos (gratis): `GET ' + o + '/api/buscar?q=contenedor escombros 8 m3` → lista de partidas con código, unidad y descripción.',
    '2. Precio de una partida (' + env.PRECIO_CONSULTA + ' USD): `GET ' + o + '/api/precio?cod=M12O013`.',
    '3. Oferta completa (' + env.PRECIO_OFERTA + ' USD): `POST ' + o + '/api/oferta` con `{"lineas":[{"cod":"M05RN060","cantidad":8},{"texto":"contenedor escombros 8 m3","cantidad":2}]}` (hasta ' + MAX_LINEAS_OFERTA + ' líneas, por código o descripción). Devuelve precio, importe y total en EUR.',
    '',
    '## Modelos 3D: bicicleta de carretera de cenital.org (113 piezas, licencia libre)',
    '',
    '1. Catálogo (gratis): `GET ' + o + '/api/piezas?q=buje` → id, nombre, conjunto y medidas de cada pieza.',
    '2. Ficha de una pieza (' + env.PRECIO_PIEZA + ' USD): `GET ' + o + '/api/pieza?id=Buje_cuerpo_1` → medidas, volumen, superficie, peso en acero, aluminio, titanio, carbono y PLA, si cabe en una impresora de 256 mm, y enlaces a STL, plano PDF y SolidWorks.',
    '3. Cálculo de impresión 3D (' + env.PRECIO_IMPRESION + ' USD): `GET ' + o + '/api/imprimir?id=Buje_cuerpo_1&material=PLA&relleno=20` → gramos, metros de filamento, horas y coste aproximados.',
    '',
    'Los servicios de pago responden 402 con la cabecera PAYMENT-REQUIRED (x402 v2); se repite la petición con la cabecera PAYMENT-SIGNATURE. Si no existe el código o no se encuentra ninguna partida, no se cobra.',
    '',
    '## Documentos',
    '',
    '- [OpenAPI](' + o + '/openapi.json)',
    '- [Descubrimiento x402](' + o + '/.well-known/x402)',
    '- [Información y precios (JSON)](' + o + '/)',
    '- [Web de la empresa](https://www.obratudela.com) y su [llms.txt](https://www.obratudela.com/llms.txt)',
    '',
    '## Contacto',
    '',
    'Para un presupuesto real de excavación, movimiento de tierras o demolición en la zona de Valladolid: ' + CONTACTO.telefono + ', WhatsApp ' + CONTACTO.whatsapp + ', ' + CONTACTO.email + '.',
    ''
  ].join('\n');
  return new Response(texto, { headers: { 'Content-Type': 'text/plain; charset=utf-8', ...CORS } });
}

// Documento de descubrimiento OpenAPI (lo leen x402scan y otros directorios)
function openapi(request, env) {
  const origen = new URL(request.url).origin;
  const pago = (precio) => ({
    price: { mode: 'fixed', currency: 'USD', amount: parseFloat(precio).toFixed(6) },
    protocols: [{ x402: {} }]
  });
  const respuestas = (esquema, ejemplo) => ({
    200: { description: 'Successful response', content: { 'application/json': { schema: esquema, example: ejemplo } } },
    402: { description: 'Payment Required' }
  });
  const partida = {
    type: 'object',
    properties: {
      cod: { type: 'string' }, uni: { type: 'string' }, res: { type: 'string' },
      precio: { type: 'number', description: 'EUR' }, grupo: { type: 'string' }
    },
    required: ['cod', 'uni', 'res', 'precio']
  };
  return {
    openapi: '3.1.0',
    info: {
      title: 'ObraTudela precios',
      version: '1.0.0',
      description: 'Precios de referencia de construcción en España (BCEXTREM 2026 + BCCA, 63.447 partidas) para agentes de IA, con pago por uso x402. ' +
        'Spanish construction reference prices for AI agents, pay-per-use with x402 (USDC on Base).',
      'x-guidance': 'If you do not know the BC3 code, first use the FREE GET /api/buscar?q=TEXT (Spanish text, e.g. "contenedor escombros 8 m3") to find it. ' +
        'Use GET /api/precio?cod=CODE for the reference price (EUR) of one Spanish construction item by its BC3 code (e.g. M12O013). ' +
        'Use POST /api/oferta with a JSON body {"lineas":[{"cod":"M05RN060","cantidad":8},{"texto":"contenedor escombros 8 m3","cantidad":2}]} ' +
        'to price up to 100 lines by code or Spanish description; returns unit price, amount and total. Nothing is charged if no item is found. ' +
        '3D MODELS: GET /api/piezas (FREE) lists the 113 parts of an open-licence 3D road bicycle; GET /api/pieza?id=ID returns its data sheet ' +
        '(size, volume, weight by material, STL/PDF/SolidWorks links); GET /api/imprimir?id=ID&material=PLA&relleno=20 estimates 3D printing grams, time and cost.',
      contact: { name: CONTACTO.empresa, email: CONTACTO.email, url: CONTACTO.web }
    },
    servers: [{ url: origen }],
    paths: {
      '/api/buscar': {
        get: {
          operationId: 'buscarPartidas',
          summary: 'Buscar partidas (gratis) - Find Spanish construction items and their BC3 codes by text',
          description: 'Free search, no payment. Returns BC3 codes, units and descriptions (no prices) to use with /api/precio or /api/oferta. Búsqueda gratuita de partidas por texto en español.',
          tags: ['Construction prices'],
          security: [],
          parameters: [
            { name: 'q', in: 'query', required: true, description: 'Texto a buscar en español, p. ej. "contenedor escombros 8 m3"', schema: { type: 'string', example: 'zanja' } },
            { name: 'limite', in: 'query', required: false, description: 'Número de resultados (1-' + MAX_RESULTADOS + ', por defecto 10)', schema: { type: 'integer', minimum: 1, maximum: MAX_RESULTADOS } }
          ],
          responses: {
            200: {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      consulta: { type: 'string' },
                      resultados: {
                        type: 'array',
                        items: { type: 'object', properties: { cod: { type: 'string' }, uni: { type: 'string' }, res: { type: 'string' }, grupo: { type: 'string' }, coincidencia: { type: 'number' } }, required: ['cod', 'res'] }
                      }
                    },
                    required: ['resultados']
                  }
                }
              }
            },
            400: { description: 'Missing q parameter' }
          }
        }
      },
      '/api/piezas': {
        get: {
          operationId: 'catalogoPiezasBici',
          summary: 'Catálogo de piezas (gratis) - List the 113 parts of an open-licence 3D road bicycle',
          description: 'Free, no payment. Parts of a complete road bicycle modelled in SolidWorks 2020 (cenital.org): id, name, assembly, code and size in mm. Optional text filter q.',
          tags: ['3D models'],
          security: [],
          parameters: [{ name: 'q', in: 'query', required: false, description: 'Filtro de texto, p. ej. "buje" o "pedal"', schema: { type: 'string' } }],
          responses: {
            200: {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      total: { type: 'integer' },
                      piezas: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, nombre: { type: 'string' }, conjunto: { type: 'string' }, medidas_mm: { type: 'array', items: { type: 'number' } } }, required: ['id', 'nombre'] } }
                    },
                    required: ['piezas']
                  }
                }
              }
            }
          }
        }
      },
      '/api/pieza': {
        get: {
          operationId: 'fichaPiezaBici',
          summary: 'Ficha de pieza - Technical data sheet of one 3D bicycle part (size, volume, weight by material, STL/PDF/SolidWorks links)',
          description: FICHAS['/api/pieza'].descripcion,
          tags: ['3D models'],
          parameters: [{ name: 'id', in: 'query', required: true, description: ESQUEMA_ID_PIEZA.description, schema: { type: 'string', example: 'Buje_cuerpo_1' } }],
          responses: respuestas({ type: 'object', properties: { pieza: { type: 'object' } }, required: ['pieza'] }, FICHAS['/api/pieza'].bazaar.info.output.example),
          'x-payment-info': pago(env.PRECIO_PIEZA)
        }
      },
      '/api/imprimir': {
        get: {
          operationId: 'impresionPiezaBici',
          summary: 'Cálculo de impresión - 3D printing estimate (grams, metres, hours, cost) for one bicycle part',
          description: FICHAS['/api/imprimir'].descripcion,
          tags: ['3D models'],
          parameters: [
            { name: 'id', in: 'query', required: true, description: ESQUEMA_ID_PIEZA.description, schema: { type: 'string', example: 'Buje_cuerpo_1' } },
            { name: 'material', in: 'query', required: false, description: 'Filamento: PLA (por defecto), PETG, ABS o TPU', schema: { type: 'string', enum: Object.keys(FILAMENTOS) } },
            { name: 'relleno', in: 'query', required: false, description: 'Relleno en % (0-100, por defecto 20)', schema: { type: 'number', minimum: 0, maximum: 100 } }
          ],
          responses: respuestas({ type: 'object', properties: { impresion: { type: 'object' } }, required: ['impresion'] }, FICHAS['/api/imprimir'].bazaar.info.output.example),
          'x-payment-info': pago(env.PRECIO_IMPRESION)
        }
      },
      '/api/precio': {
        get: {
          operationId: 'precioPartida',
          summary: 'Precio de partida - Spanish construction item reference price by BC3 code',
          description: FICHAS['/api/precio'].descripcion,
          tags: ['Construction prices'],
          parameters: [{
            name: 'cod', in: 'query', required: true,
            description: 'Código BC3 de la partida, p. ej. M12O013',
            schema: { type: 'string', example: 'M12O013' }
          }],
          responses: respuestas({
            type: 'object',
            properties: { partida: partida, nota: { type: 'string' }, contacto: { type: 'object' } },
            required: ['partida']
          }, FICHAS['/api/precio'].bazaar.info.output.example),
          'x-payment-info': pago(env.PRECIO_CONSULTA)
        }
      },
      '/api/oferta': {
        post: {
          operationId: 'rellenarOferta',
          summary: 'Rellenar oferta - Price a Spanish construction bill of quantities',
          description: FICHAS['/api/oferta'].descripcion,
          tags: ['Construction prices'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: FICHAS['/api/oferta'].bazaar.schema.properties.input.properties.body,
                example: FICHAS['/api/oferta'].bazaar.info.input.body
              }
            }
          },
          responses: respuestas({
            type: 'object',
            properties: {
              lineas: { type: 'array', items: { type: 'object' } },
              total: { type: 'number', description: 'EUR' },
              moneda_precios: { type: 'string' }
            },
            required: ['lineas', 'total']
          }, FICHAS['/api/oferta'].bazaar.info.output.example),
          'x-payment-info': pago(env.PRECIO_OFERTA)
        }
      }
    }
  };
}

async function precio(request, env) {
  const cod = (new URL(request.url).searchParams.get('cod') || '').trim().toUpperCase();
  if (!cod) {
    // Sin código y sin pago: se responde el 402 con la ficha, para que los
    // directorios y agentes vean el precio y cómo usarlo. Con pago y sin
    // código: error, para no cobrar por nada.
    if (!request.headers.get('PAYMENT-SIGNATURE')) return cobrar(request, env, env.PRECIO_CONSULTA, null);
    return json({ error: 'falta_codigo', mensaje: 'Indique ?cod=CODIGO' }, 400);
  }

  // Comprobar antes de cobrar: si no existe, no se cobra
  const { porCodigo } = await cargarDatos(env);
  const partida = porCodigo.get(cod);
  if (!partida) return json({ error: 'no_encontrada', mensaje: 'No existe la partida ' + cod }, 404);

  return cobrar(request, env, env.PRECIO_CONSULTA, async () => ({
    partida: publica(partida),
    nota: NOTA_PRECIOS,
    contacto: CONTACTO
  }));
}

async function oferta(request, env) {
  // Sin pago: 402 con la ficha antes de mirar el cuerpo (así lo prueban los
  // directorios). Con pago: se valida y calcula antes de cobrar.
  if (!request.headers.get('PAYMENT-SIGNATURE')) return cobrar(request, env, env.PRECIO_OFERTA, null);
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

  return cobrar(request, env, env.PRECIO_OFERTA, async () => calculada);
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
  'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
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
      // HEAD como GET: el robot de los directorios prueba primero con HEAD
      if ((request.method === 'GET' || request.method === 'HEAD') && pathname === '/api/precio') {
        const r = await precio(request, env);
        return request.method === 'HEAD' ? new Response(null, { status: r.status, headers: r.headers }) : r;
      }
      if (request.method === 'POST' && pathname === '/api/oferta') return await oferta(request, env);
      if (request.method === 'GET' && pathname === '/api/buscar') return await buscar(request, env);
      if (request.method === 'GET' && pathname === '/api/piezas') return await catalogoBici(request, env);
      if ((request.method === 'GET' || request.method === 'HEAD') && (pathname === '/api/pieza' || pathname === '/api/imprimir')) {
        const r = pathname === '/api/pieza' ? await pieza(request, env) : await imprimir(request, env);
        return request.method === 'HEAD' ? new Response(null, { status: r.status, headers: r.headers }) : r;
      }
      if (request.method === 'GET' && pathname === '/llms.txt') return llmsTxt(request, env);
      if (request.method === 'GET' && pathname === '/openapi.json') return json(openapi(request, env));
      // Icono para directorios: el de la web de ObraTudela
      if ((request.method === 'GET' || request.method === 'HEAD') && (pathname === '/favicon.ico' || pathname === '/favicon.png')) {
        return Response.redirect(ICONO, 302);
      }
      if (request.method === 'GET' && pathname === '/.well-known/x402') {
        const origen = new URL(request.url).origin;
        return json({
          version: 1,
          resources: [origen + '/api/precio', origen + '/api/oferta'],
          instructions: 'Spec OpenAPI completa en ' + origen + '/openapi.json. Pago x402 v2 en USDC (Base).'
        });
      }
      return json({ error: 'no_existe', mensaje: 'Ruta no encontrada. Vea GET / para la lista de servicios.' }, 404);
    } catch (err) {
      console.error(err);
      return json({ error: 'error_interno', mensaje: 'Error del servidor; no se ha cobrado nada si el pago no se liquidó.' }, 500);
    }
  }
};
