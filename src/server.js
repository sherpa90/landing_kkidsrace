require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const cookieSession = require('cookie-session');
const morgan = require('morgan');
const { ensureCsrfToken, validateCsrf } = require('./middleware/csrf');
const { rateLimit } = require('./middleware/rateLimit');

const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de compresión para máxima velocidad y SEO
app.use(compression());

// Headers de seguridad con Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.tailwindcss.com",
          "https://unpkg.com"
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'", // Necesario para Tailwind CDN — eliminar al migrar a build local
          "https://fonts.googleapis.com",
          "https://cdn.tailwindcss.com"
        ],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: [
          "'self'",
          "data:",
          "https://images.unsplash.com",
          "https://fonts.gstatic.com"
        ],
        connectSrc: ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false, // Mantener false para compatibilidad con Tailwind CDN
    // Deshabilitar features del navegador no usadas
  })
);

// Permissions-Policy: deshabilitar APIs sensibles no requeridas
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=(), payment=()');
  next();
});

// Logging de peticiones — siempre activo (formato compacto en dev, combinado en producción)
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Configurar trust proxy para obtener la IP real del cliente detrás de reverse proxies / Docker
app.set('trust proxy', 1);

// Procesamiento de datos de formularios y JSON
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Gestión de sesiones — 8 horas de vida, no 7 días
// secure: solo sobre HTTPS (activar COOKIE_SECURE=true en producción detrás de SSL/TLS)
const isSecureCookie = process.env.COOKIE_SECURE === 'true';
app.use(
  cookieSession({
    name: 'landing_cms_session',
    keys: [process.env.SESSION_SECRET || 'modern_cms_default_secret_key_change_me'],
    maxAge: 8 * 60 * 60 * 1000, // 8 horas
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureCookie
  })
);

// Generar token CSRF en toda sesión (después de cookie-session)
app.use(ensureCsrfToken);

// Motor de plantillas EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
// Servir uploads persistentes optimizados del CMS con caché eficiente
app.use('/uploads', express.static(path.resolve(__dirname, '../data/uploads'), {
  maxAge: '1d'
}));

// Rutas
app.use('/', publicRoutes);
app.use('/admin', adminRoutes);

// Manejo de Error 404
app.use((req, res) => {
  const contentStore = require('./services/contentStore');
  res.status(404).render('index', {
    content: contentStore.getContent(),
    theme: contentStore.getTheme(),
    siteUrl: `${req.protocol}://${req.get('host')}`,
    jsonLd: '{}',
    csrfToken: req.session?.csrfToken || '',
    activeRace: null,
    races: [],
    constructionAdminBypass: false
  });
});

// Manejo de Errores Globales — no exponer stack traces en producción
app.use((err, req, res, next) => {
  const errorId = Date.now().toString(36);
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[error:${errorId}]`, err);
  } else {
    console.error(`[error:${errorId}] ${err.message}`);
  }
  res.status(500).json({ success: false, error: `Error interno del servidor. Referencia: ${errorId}` });
});

// Iniciar servidor solo si se ejecuta directamente
if (require.main === module) {
  // Advertencia de seguridad si se usan credenciales por defecto
  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin';
  if (adminUser === 'admin' && adminPass === 'admin') {
    console.warn('====================================================');
    console.warn('⚠️  ADVERTENCIA DE SEGURIDAD:');
    console.warn('   Se están usando credenciales por defecto (admin/admin).');
    console.warn('   Esto es INSEGURO para producción. Define ADMIN_USERNAME');
    console.warn('   y ADMIN_PASSWORD en tu entorno o .env.');
    console.warn('====================================================');
  }

  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret || sessionSecret === 'kidsrun_cms_super_secret_key_change_in_production' || sessionSecret === 'modern_cms_default_secret_key_change_me') {
    console.warn('⚠️  ADVERTENCIA DE SEGURIDAD (SESSION_SECRET):');
    console.warn('   SESSION_SECRET no está configurado o usa el valor predeterminado.');
    console.warn('   Para un entorno seguro en producción, define SESSION_SECRET con una clave única.');
    console.warn('====================================================');
  }

  app.listen(PORT, () => {
    console.log('====================================================');
    console.log(`🚀 Landing Page & CMS corriendo en http://localhost:${PORT}`);
    console.log(`🔑 Panel de Administración: http://localhost:${PORT}/admin`);
    console.log(`⚡ Modo: ${process.env.NODE_ENV || 'development (default)'}`);
    console.log('====================================================');
  });
}

module.exports = app;
