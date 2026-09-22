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

  if (!token) {
    return res.status(403).json({ error: 'Token CSRF ausente o expirado.' });
  }

  const sessionBuf = Buffer.from(req.session.csrfToken);
  const tokenBuf = Buffer.from(token);

  if (sessionBuf.length !== tokenBuf.length || !crypto.timingSafeEqual(tokenBuf, sessionBuf)) {
    // Si falla el token en un POST normal, devolver mensaje amigable
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(403).json({ error: 'Token CSRF inválido o expirado.' });
    }
    // Para navegación normal por formulario, regenerar token y permitir login si es en /admin/login
    if (req.path === '/login') {
      return next();
    }
    return res.status(403).send('Token CSRF inválido. Por favor recarga la página.');
  }
  next();
}

module.exports = { ensureCsrfToken, validateCsrf };
