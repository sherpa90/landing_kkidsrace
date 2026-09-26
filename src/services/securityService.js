const crypto = require('crypto');

const SECRET_KEY = process.env.SESSION_SECRET || 'kidsrace_security_secret_2026';
const MIN_SUBMISSION_TIME_MS = 4000; // 4 segundos mínimo para un humano
const MAX_SUBMISSION_TIME_MS = 24 * 60 * 60 * 1000; // 24 horas máximo

/**
 * Genera un token con timestamp firmado con HMAC para prevenir envíos instantáneos de bots (Time-Trap).
 */
function generateTimeToken() {
  const now = Date.now().toString();
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(now).digest('hex');
  return `${now}.${signature}`;
}

/**
 * Valida el token de tiempo (Time-Trap).
 * Retorna { valid: true } o { valid: false, error: '...' }
 */
function validateTimeToken(token) {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Token de seguridad temporal ausente. Por favor recarga el formulario.' };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'Token de seguridad temporal inválido.' };
  }

  const [timestampStr, receivedSig] = parts;
  const expectedSig = crypto.createHmac('sha256', SECRET_KEY).update(timestampStr).digest('hex');

  // Comparación segura contra ataques de tiempo
  const receivedBuf = Buffer.from(receivedSig);
  const expectedBuf = Buffer.from(expectedSig);
  if (receivedBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(receivedBuf, expectedBuf)) {
    return { valid: false, error: 'Firma de seguridad temporal alterada o inválida.' };
  }

  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) {
    return { valid: false, error: 'Marca de tiempo inválida.' };
  }

  const elapsed = Date.now() - timestamp;

  if (elapsed < MIN_SUBMISSION_TIME_MS) {
    return {
      valid: false,
      error: 'El formulario fue enviado con demasiada rapidez. Por favor tómate un momento para revisar los datos antes de enviar.'
    };
  }

  if (elapsed > MAX_SUBMISSION_TIME_MS) {
    return {
      valid: false,
      error: 'La sesión del formulario expiró. Por favor recarga la página e intenta de nuevo.'
    };
  }

  return { valid: true, elapsedMs: elapsed };
}

/**
 * Valida el token de Cloudflare Turnstile contra la API oficial.
 * Si no hay Secret Key configurada, permite continuar en modo de desarrollo / degradación elegante.
 */
async function verifyTurnstileToken(token, clientIp, secretKey) {
  const secret = secretKey || process.env.TURNSTILE_SECRET_KEY;

  // Si no está configurada la Secret Key, omitir verificación (modo passthrough)
  if (!secret) {
    return { success: true, bypassed: true };
  }

  if (!token) {
    return {
      success: false,
      error: 'Por favor completa la verificación de seguridad (Turnstile).'
    };
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secret);
    formData.append('response', token);
    if (clientIp) {
      formData.append('remoteip', clientIp);
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const data = await response.json();

    if (data.success) {
      return { success: true };
    }

    console.warn('[security] Falla de verificación Turnstile:', data['error-codes'] || data);
    return {
      success: false,
      error: 'Verificación de seguridad fallida. Por favor recarga la página e intenta nuevamente.'
    };
  } catch (err) {
    console.error('[security] Error de conexión con Cloudflare Turnstile:', err.message);
    // En caso de caída de conectividad de Cloudflare, permitir continuar para no congelar el negocio
    return { success: true, warning: 'Turnstile check skipped due to network error' };
  }
}

module.exports = {
  generateTimeToken,
  validateTimeToken,
  verifyTurnstileToken
};
