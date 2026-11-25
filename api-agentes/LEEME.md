# API de precios para agentes de IA (cobro x402)

Servicio para que **programas y agentes de IA** consulten la base de precios
pagando céntimos, sin registrarse ni pedir claves. Usa el protocolo abierto
**x402 (versión 2)**: el pago va dentro de la propia petición web, en USDC
(una moneda digital que vale siempre 1 dólar).

> **Estado: EN PRUEBAS (dinero ficticio).** Desplegado en
> https://obratudela-api-agentes.excavacionesart.workers.dev con la red de
> pruebas Base Sepolia (`RED = "eip155:84532"`). Pide pagos de USDC ficticio:
> no se cobra dinero real. Para dinero real, ver el paso 1 (papeleo) y el
> paso 4. Probado de principio a fin el 25/11/2026: un agente de prueba pagó
> 0,01 USDC ficticio y llegó a la wallet de cobro.
>
> Esta carpeta se publica en GitHub y en obratudela.com como el resto del
> repositorio: **la dirección de cobro y cualquier clave van solo en
> `.dev.vars` (Git lo ignora) y en los secretos de Cloudflare**, nunca aquí.

## Qué ofrece

| Ruta | Precio | Qué devuelve |
|---|---|---|
| `GET /` | Gratis | Lista de servicios, precios y contacto de la empresa |
| `GET /api/precio?cod=M05RN060` | 0,01 $ | Una partida: unidad, descripción y precio de referencia |
| `POST /api/oferta` | 0,50 $ | Rellena una petición de oferta de hasta 100 líneas (por código o por descripción) con precio, importe y total |

No se cobra si el código no existe o si en la oferta no se encuentra ninguna
partida. Cada respuesta incluye el **teléfono y WhatsApp de la empresa**,
para que una consulta pueda acabar en un encargo real.

Ejemplo de cuerpo para `/api/oferta`:

```json
{ "lineas": [
  { "cod": "M05RN060", "cantidad": 8 },
  { "texto": "contenedor escombros 8 m3", "cantidad": 2 }
] }
```

## Archivos

- `worker.js` — todo el programa, sin librerías. Comentado en español.
- `wrangler.toml` — **la configuración: aquí se rellenan los datos.**
- Los precios salen de `data/base-precios-ligero.json`. Si cambia la base de
  precios, regenerarla con `python scripts/generar-base-ligera.py`.

## Cómo activarlo, paso a paso

### 1. Papeleo (antes de cobrar nada real)
- **Si cobra una sociedad activa:** no hace falta alta de autónomo; es un
  ingreso más de la sociedad, con su IVA.
- **Si cobra un particular:** cobrar de forma repetida es una actividad
  económica. Normalmente pide alta en Hacienda (modelo 036/037), declarar
  los ingresos en la renta y, según los ingresos y la habitualidad, alta en
  autónomos. Con los ingresos previstos (pocos euros al mes) la cuota de
  autónomos costaría más de lo que se cobra: **mientras no compense, dejar
  el cobro apagado.**
- En cualquier caso, preguntar al gestor (facturación a compradores
  anónimos, IVA, actividad en Hacienda) **antes** de activar la red real.
- Probar en la red de pruebas (paso 3) no genera ingresos ni obligaciones.

### 2. Cuenta de cobro
Se necesitan dos piezas:

- **Una wallet propia para recibir** (por ejemplo Coinbase Wallet, MetaMask o
  Rabby). Su dirección (empieza por `0x` y tiene 42 caracteres) es la que va
  en `COBRAR_A`. Recibe los pagos de céntimos de uno en uno, sin mínimos.
  **Guardar la frase de recuperación en papel**: quien la tiene, tiene el dinero.
- **Un exchange para pasar a euros** (Coinbase, Nexo u otro regulado en la UE
  bajo MiCA, a nombre de la S.L.). De vez en cuando se envía lo acumulado
  desde la wallet al exchange, se vende por euros y se retira por SEPA.

No conviene poner como `COBRAR_A` la dirección de depósito de un exchange:
muchos tienen **mínimo de depósito** y pagos de 0,01 $ pueden no abonarse.
Y antes de enviar al exchange, comprobar que **admite USDC en la red Base**:
enviar por una red que no admite puede hacer perder el dinero.

### 3. Probar primero con dinero ficticio
1. Crear una cuenta gratuita en Cloudflare (si no se tiene ya).
2. La dirección de cobro **no va en `wrangler.toml`**: va en el archivo
   privado `.dev.vars` de esta carpeta (Git lo ignora), para que nunca acabe
   publicada en la web. En `wrangler.toml`: `PAGOS_ACTIVOS = "si"` y
   `RED = "eip155:84532"` (red de pruebas).
3. Desde esta carpeta, en PowerShell:
   ```
   npx wrangler login
   npx wrangler deploy
   npx wrangler secret put COBRAR_A
   ```
   (el último pide la dirección `0x…`: pegar la misma que hay en `.dev.vars`).
   Cloudflare dará una dirección del estilo
   `https://obratudela-api-agentes.<cuenta>.workers.dev`.
4. Pagar una consulta de prueba con una wallet de pruebas y USDC ficticio
   (Circle los regala en su "faucet" para Base Sepolia).

### 4. Pasar a dinero real
- Cambiar `RED = "eip155:8453"` (Base, red real).
- Cambiar `FACILITADOR` por uno que funcione en la red real: **el de
  x402.org solo admite redes de prueba** (comprobado el 25/11/2026). El de
  Coinbase (CDP) pide claves de API: estas **nunca** se escriben en
  `wrangler.toml` (esta carpeta es pública en la web); se guardan como
  secreto con `npx wrangler secret put`. El de Coinbase pide una firma (JWT)
  en cada llamada que este Worker **todavía no hace**: hay que añadirla antes
  de dar este paso.
- Comprobar en la documentación de x402 que la dirección de USDC y el
  `extra` de la red real que hay en `worker.js` (`REDES`) siguen vigentes.
- Opcional: poner la API en `api.obratudela.com` (en Cloudflare: Workers →
  el Worker → Dominios).

### 5. Darlo a conocer
- Añadir una sección "API para agentes" en `/llms.txt` con la dirección del
  servicio y sus precios.

### 6. Cobrar en el banco
- El dinero llega en USDC a la wallet de cobro. Para pasarlo a euros: enviar
  lo acumulado al exchange (red Base), vender USDC → EUR y retirar por
  transferencia SEPA a la cuenta de la empresa. Descargar los extractos de la
  wallet y del exchange para el gestor.

## ¿Y PayPal?

x402 **no funciona con una cuenta normal de PayPal**: los agentes pagan con
monedas digitales desde una wallet, no con PayPal. PayPal tiene su propia
moneda digital (PYUSD), que técnicamente sirve en x402, pero solo está
disponible en algunos países y hay que comprobar si en España se puede usar.

Donde PayPal sí encaja es como **segunda puerta, para personas**: por
ejemplo, un botón "Comprar oferta rellena — 2 €" en la web. Sería otra pieza
distinta (un botón de PayPal más una comprobación del pago en este mismo
Worker), que se puede añadir más adelante sin tocar lo de x402.

## Comprobar que funciona sin desplegar

`worker.js` se puede probar en el ordenador con Node, simulando el
facilitador. Se probaron: servicio apagado (503), sin pago (402 con la
cabecera `PAYMENT-REQUIRED`), pago válido (200 y recibo en
`PAYMENT-RESPONSE`), pago sin fondos (402 sin cobrar), código inexistente
(404 sin cobrar) y oferta por código y por descripción.
