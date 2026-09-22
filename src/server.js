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
const db = require('./services/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de compresión para máxima velocidad y SEO
app.use(compression());

// Headers de seguridad con Helmet (con CSP permisivo para Tailwind, Google Fonts e imágenes Unsplash)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          "https://cdn.tailwindcss.com",
          "https://unpkg.com"
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://cdn.tailwindcss.com"
        ],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "http:"],
        connectSrc: ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

// Logging de peticiones en entorno de desarrollo
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Procesamiento de datos de formularios y JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Gestión de sesiones con cookie-session
app.use(
  cookieSession({
    name: 'landing_cms_session',
    keys: [process.env.SESSION_SECRET || 'modern_cms_default_secret_key_change_me'],
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
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
  maxAge: '7d',
  immutable: true
}));

// Rutas
app.use('/', publicRoutes);
app.use('/admin', adminRoutes);

// Manejo de Error 404
app.use((req, res) => {
  res.status(404).render('index', {
    content: require('./services/contentStore').getContent(),
    theme: require('./services/contentStore').getTheme(),
    siteUrl: `${req.protocol}://${req.get('host')}`,
    jsonLd: '{}'
  });
});

// Manejo de Errores Globales
app.use((err, req, res, next) => {
  console.error('Error interno del servidor:', err);
  res.status(500).send('Error interno del servidor');
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

  app.listen(PORT, () => {
    console.log('====================================================');
    console.log(`🚀 Landing Page & CMS corriendo en http://localhost:${PORT}`);
    console.log(`🔑 Panel de Administración: http://localhost:${PORT}/admin`);
    console.log(`⚡ Modo: ${process.env.NODE_ENV || 'production'}`);
    console.log('====================================================');
  });
}

module.exports = app;
