function rateLimit(options = {}) {
  const {
    windowMs = 15 * 60 * 1000,
    max = 50,
    message = 'Demasiadas solicitudes. Inténtalo más tarde.',
    keyGenerator = (req) => req.ip
  } = options;

  const store = new Map();

  // Limpieza periódica cada 10 minutos para evitar fuga de memoria
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetTime) {
        store.delete(key);
      }
    }
  }, 10 * 60 * 1000);
  if (cleanupInterval.unref) cleanupInterval.unref();

  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();
    let entry = store.get(key);

    if (!entry || now > entry.resetTime) {
      entry = { count: 1, resetTime: now + windowMs };
      store.set(key, entry);
    } else {
      entry.count++;
    }

    const remaining = Math.max(0, max - entry.count);
    const resetSeconds = Math.ceil((entry.resetTime - now) / 1000);

    // Cabeceras estándar de Rate Limiting
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetSeconds);

    if (entry.count > max) {
      res.setHeader('Retry-After', resetSeconds);
      return res.status(429).json({
        success: false,
        error: message
      });
    }

    next();
  };
}

module.exports = { rateLimit };
