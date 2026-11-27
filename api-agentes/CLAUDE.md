# API para agentes de IA — detalles (ACTIVA CON DINERO REAL)

Cloudflare Worker sin dependencias que vende consultas a la base de precios
por céntimos con el protocolo x402 v2 (USDC). Desplegado aparte con
`npx wrangler deploy` (no con GitHub Pages) en
`obratudela-api-agentes.excavacionesart.workers.dev`, en la **red real** Base
desde el 25/11/2026 (el dueño lo consultó con su gestor) y con el facilitador
de PayAI. Los cambios en `worker.js` o `wrangler.toml` afectan a cobros
reales: pruébalos antes en local o con `RED = "eip155:84532"`.
La dirección de cobro va en `api-agentes/.dev.vars` y en los secretos de
Cloudflare, nunca en `wrangler.toml`. Pasos y estado en `api-agentes/LEEME.md`. Lee
`data/base-precios-ligero.json`: si cambias `base-precios.json`, regenérala con
`python scripts/generar-base-ligera.py`. La carpeta se publica en GitHub Pages
como el resto del repo: nunca pongas claves en `wrangler.toml` (usa
`wrangler secret put`).
