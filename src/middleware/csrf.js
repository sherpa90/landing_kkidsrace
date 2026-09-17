const crypto = require('crypto');

function ensureCsrfToken(req, res, next) {
  if (!req.session) {
    req.session = {};
  }
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  next();
}

function validateCsrf(req, res, next) {
  if (!req.session || !req.session.csrfToken) {
    return res.status(403).json({ error: 'Sesión inválida. Recarga la página e intenta nuevamente.' });
  }

  const headerToken = req.headers['x-csrf-token'];
  const bodyToken = req.body && req.body.csrfToken;
  const token = headerToken || bodyToken;

  if (!token || !crypto.timingSafeEqual(Buffer.from(token), Buffer.from(req.session.csrfToken))) {
    return res.status(403).json({ error: 'Token CSRF inválido o expirado.' });
  }
  next();
}

module.exports = { ensureCsrfToken, validateCsrf };
