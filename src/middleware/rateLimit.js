function rateLimit(options = {}) {
  const {
    windowMs = 15 * 60 * 1000,
    max = 50,
    message = 'Demasiadas solicitudes. Inténtalo más tarde.',
    keyGenerator = (req) => req.ip
  } = options;

  const store = new Map();

  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();
    const entry = store.get(key);

    if (!entry) {
      store.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (now > entry.resetTime) {
      entry.count = 1;
      entry.resetTime = now + windowMs;
      return next();
    }

    if (entry.count >= max) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      res.set('Retry-After', retryAfter);
      return res.status(429).json({ error: message });
    }

    entry.count++;
    next();
  };
}

module.exports = { rateLimit };
