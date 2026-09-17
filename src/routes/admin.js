const express = require('express');
const router = express.Router();
const contentStore = require('../services/contentStore');
const auth = require('../services/auth');
const db = require('../services/db');
const { rateLimit } = require('../middleware/rateLimit');
const { validateCsrf } = require('../middleware/csrf');

// Rate limiting estricto para login (5 intentos / 15 min)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Demasiados intentos de inicio de espera. Inténtalo más tarde.',
  keyGenerator: (req) => req.ip
});

// Pantalla de Login
router.get('/login', (req, res) => {
  if (req.session && req.session.isAdmin) {
    return res.redirect('/admin');
  }
  // El middleware ensureCsrfToken ya generó req.session.csrfToken
  res.render('admin/login', { error: null, csrfToken: req.session?.csrfToken || '' });
});

// Procesar Login (protegido contra fuerza bruta y CSRF)
router.post('/login', loginLimiter, validateCsrf, (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(400).json({ success: false, error: 'Usuario y contraseña requeridos' });
    }
    return res.render('admin/login', { error: 'Por favor ingresa usuario y contraseña.', csrfToken: req.session?.csrfToken || '' });
  }

  const isValid = auth.verifyCredentials(username, password);
  if (isValid) {
    req.session.isAdmin = true;
    req.session.username = username;
    // Regenerar token CSRF tras login exitoso
    req.session.csrfToken = require('crypto').randomBytes(32).toString('hex');

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ success: true, redirect: '/admin' });
    }
    return res.redirect('/admin');
  }

  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
  }
  return res.render('admin/login', { error: 'Credenciales incorrectas. Verifica tu usuario y clave.', csrfToken: req.session?.csrfToken || '' });
});

// Cerrar Sesión
router.all('/logout', (req, res) => {
  req.session = null;
  res.redirect('/admin/login');
});

// Dashboard Principal del CMS (Protegido)
router.get('/', auth.requireAuth, async (req, res) => {
  const content = contentStore.getContent();
  const leads = await db.getInscriptions();
  const themes = contentStore.COLOR_THEMES;
  const username = req.session.username || 'admin';
  const isPostgres = db.isPostgresConnected();
  const csrfToken = req.session?.csrfToken || '';

  res.render('admin/dashboard', {
    content,
    leads,
    themes,
    username,
    isPostgres,
    csrfToken
  });
});

// Guardar Actualizaciones de Contenido desde el CMS (CSRF protegido)
router.post('/api/content', auth.requireAuth, validateCsrf, (req, res) => {
  try {
    const newContent = req.body;
    if (!newContent || typeof newContent !== 'object') {
      return res.status(400).json({ success: false, error: 'Datos no válidos' });
    }

    const result = contentStore.saveContent(newContent);
    if (result.success) {
      return res.json({
        success: true,
        message: '¡Cambios guardados con éxito! Se reflejan de inmediato en la landing page.'
      });
    } else {
      return res.status(500).json({ success: false, error: result.error });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Obtener Lista de Leads / Mensajes
router.get('/api/leads', auth.requireAuth, async (req, res) => {
  const leads = await db.getInscriptions();
  res.json({ success: true, leads });
});

// Eliminar un Lead (CSRF protegido)
router.delete('/api/leads/:id', auth.requireAuth, validateCsrf, async (req, res) => {
  const { id } = req.params;
  const result = await db.deleteInscription(id);
  if (result.success) {
    res.json({ success: true, message: 'Inscripción eliminada correctamente.' });
  } else {
    res.status(500).json({ success: false, error: result.error });
  }
});

// Cambiar Contraseña del Administrador (CSRF protegido)
router.post('/api/change-password', auth.requireAuth, validateCsrf, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const result = auth.changePassword(currentPassword, newPassword);
  if (result.success) {
    res.json({ success: true, message: 'Contraseña actualizada con éxito.' });
  } else {
    res.status(400).json({ success: false, error: result.error });
  }
});

module.exports = router;
