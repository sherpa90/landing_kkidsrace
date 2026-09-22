/**
 * Módulo de Logging Estructurado para Auditoría y Monitoreo de Seguridad (OWASP A09)
 */

const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  SECURITY: 'SECURITY'
};

function formatMessage(level, event, details = {}) {
  const timestamp = new Date().toISOString();
  return JSON.stringify({
    timestamp,
    level,
    event,
    ...details
  });
}

const logger = {
  info(event, details) {
    console.log(formatMessage(LOG_LEVELS.INFO, event, details));
  },
  warn(event, details) {
    console.warn(formatMessage(LOG_LEVELS.WARN, event, details));
  },
  error(event, details) {
    // Si viene un error, no filtrar stack traces en producción hacia respuestas de usuario
    if (details && details.error instanceof Error) {
      details.errorMessage = details.error.message;
      if (process.env.NODE_ENV !== 'production') {
        details.stack = details.error.stack;
      }
      delete details.error;
    }
    console.error(formatMessage(LOG_LEVELS.ERROR, event, details));
  },
  security(event, details) {
    // Registro de alta prioridad para auditorías de seguridad
    console.warn(formatMessage(LOG_LEVELS.SECURITY, `[SECURITY_AUDIT] ${event}`, details));
  }
};

module.exports = logger;
