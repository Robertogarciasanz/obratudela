/**
 * Sistema de consentimiento de cookies conforme RGPD
 * Gestiona el consentimiento para Google Tag Manager y Analytics
 */

const COOKIE_CONSENT_KEY = 'cookie_consent';
const COOKIE_CONSENT_VERSION = '1.0';

/**
 * Inicializa el sistema de consentimiento
 */
export function initCookieConsent() {
  const consent = getConsent();

  if (!consent) {
    // No hay consentimiento previo, mostrar banner
    showConsentBanner();
  } else if (consent.accepted) {
    // Usuario ya aceptó, activar GTM
    enableGTM();
  }
  // Si rechazó, no hacer nada (GTM no se activa)
}

/**
 * Muestra el banner de consentimiento
 */
function showConsentBanner() {
  const banner = document.createElement('div');
  banner.id = 'cookie-consent-banner';
  banner.innerHTML = `
    <div class="cookie-banner">
      <div class="cookie-content">
        <p class="cookie-text">
          🍪 Utilizamos cookies propias y de terceros (Google Analytics) para analizar
          el uso del sitio web y mejorar tu experiencia. Puedes aceptar todas las cookies
          o configurarlas según tus preferencias.
        </p>
        <div class="cookie-buttons">
          <button id="cookie-accept" class="btn btn-primary">Aceptar todas</button>
          <button id="cookie-reject" class="btn btn-secondary">Solo necesarias</button>
          <a href="/pages/politica-cookies.html" class="cookie-link">Más información</a>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(banner);

  // Event listeners
  document.getElementById('cookie-accept').addEventListener('click', () => {
    saveConsent(true);
    enableGTM();
    hideBanner();
  });

  document.getElementById('cookie-reject').addEventListener('click', () => {
    saveConsent(false);
    disableGTM();
    hideBanner();
  });
}

/**
 * Oculta el banner
 */
function hideBanner() {
  const banner = document.getElementById('cookie-consent-banner');
  if (banner) {
    banner.style.animation = 'slideDown 0.3s ease-out';
    setTimeout(() => banner.remove(), 300);
  }
}

/**
 * Guarda el consentimiento
 */
function saveConsent(accepted) {
  const consent = {
    accepted,
    version: COOKIE_CONSENT_VERSION,
    timestamp: Date.now()
  };
  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
}

/**
 * Obtiene el consentimiento guardado
 */
function getConsent() {
  try {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!stored) return null;

    const consent = JSON.parse(stored);

    // Verificar versión (si cambia la política, volver a pedir consentimiento)
    if (consent.version !== COOKIE_CONSENT_VERSION) {
      return null;
    }

    return consent;
  } catch (e) {
    console.error('Error leyendo consentimiento:', e);
    return null;
  }
}

/**
 * Activa Google Tag Manager
 */
function enableGTM() {
  // GTM ya está en el HTML, solo necesitamos asegurarnos de que esté activo
  console.log('✅ Google Tag Manager activado');

  // Configurar dataLayer si no existe
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    'event': 'cookie_consent_accepted',
    'consent_timestamp': Date.now()
  });
}

/**
 * Desactiva Google Tag Manager y limpia cookies
 */
function disableGTM() {
  console.log('🚫 Google Tag Manager desactivado');

  // Eliminar cookies de Google Analytics
  deleteCookie('_ga');
  deleteCookie('_gat');
  deleteCookie('_gid');

  // Informar a dataLayer
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    'event': 'cookie_consent_rejected',
    'consent_timestamp': Date.now()
  });
}

/**
 * Elimina una cookie
 */
function deleteCookie(name) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${location.hostname};`;
}

/**
 * Exporta función para cambiar consentimiento desde configuración
 */
export function changeConsent(accepted) {
  saveConsent(accepted);
  if (accepted) {
    enableGTM();
  } else {
    disableGTM();
  }
}

/**
 * Verifica si el usuario ha aceptado cookies
 */
export function hasAcceptedCookies() {
  const consent = getConsent();
  return consent && consent.accepted;
}
