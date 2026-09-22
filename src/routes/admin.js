const express = require('express');
const router = express.Router();
const contentStore = require('../services/contentStore');
const auth = require('../services/auth');
const db = require('../services/db');
const { rateLimit } = require('../middleware/rateLimit');
const { validateCsrf } = require('../middleware/csrf');
const imageService = require('../services/imageService');

// Asegurar que la base de datos de usuarios (Admin/Editor) esté inicializada
auth.getUsers();

// Rate limiting para login (permisivo para pruebas y desarrollo)
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 50,
  message: 'Demasiados intentos de inicio de sesión. Inténtalo más tarde.',
  keyGenerator: (req) => req.ip
});

// Pantalla de Login
router.get('/login', (req, res) => {
  if (req.session && (req.session.isAdmin || req.session.isEditor)) {
    return res.redirect('/admin');
  }
  res.render('admin/login', { error: null, csrfToken: req.session?.csrfToken || '' });
});

// Procesar Login con soporte para roles Admin y Editor
router.post('/login', loginLimiter, validateCsrf, (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(400).json({ success: false, error: 'Usuario y contraseña requeridos' });
    }
    return res.render('admin/login', { error: 'Por favor ingresa usuario y contraseña.', csrfToken: req.session?.csrfToken || '' });
  }

  const user = auth.verifyCredentials(username, password);
  if (user) {
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.name = user.name;
    req.session.role = user.role;
    req.session.isAdmin = user.role === 'admin';
    req.session.isEditor = user.role === 'editor';

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

// Dashboard Principal del CMS (Protegido para Admin y Editor)
router.get('/', auth.requireAuth, async (req, res) => {
  const content = contentStore.getContent();
  const leads = await db.getInscriptions();
  const races = contentStore.getRaces();
  const activeRace = contentStore.getActiveRace();
  const themes = contentStore.COLOR_THEMES;
  const username = req.session.username || 'admin';
  const role = req.session.role || 'admin';
  const name = req.session.name || username;
  const isPostgres = db.isPostgresConnected();
  const csrfToken = req.session?.csrfToken || '';

  res.render('admin/dashboard', {
    content,
    leads,
    races,
    activeRace,
    themes,
    username,
    role,
    name,
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

// Endpoint para subir y optimizar imágenes automáticamente con Sharp (WebP)
router.post('/api/upload', auth.requireAuth, validateCsrf, imageService.upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No se ha proporcionado ningún archivo de imagen.' });
    }

    const type = req.body.type === 'logo' ? 'logo' : 'standard';
    const result = await imageService.processAndSaveImage(req.file.buffer, req.file.originalname, type);

    return res.json({
      success: true,
      message: 'Imagen optimizada y guardada permanentemente con éxito.',
      data: result
    });
  } catch (err) {
    console.error('Error procesando imagen:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Error optimizando la imagen.'
    });
  }
});

// Crear o Actualizar Corridas (Permitido SOLO para rol Administrador)
router.post('/api/races', auth.requireAdmin, validateCsrf, (req, res) => {
  try {
    const { id, name, date, time, location, city, status, circuits, maxParticipants } = req.body;

    if (!name || !date) {
      return res.status(400).json({ success: false, error: 'El nombre y la fecha de la corrida son obligatorios.' });
    }

    // Formatear fecha legible en español
    let dateDisplay = '';
    try {
      const d = new Date(date);
      dateDisplay = d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      dateDisplay = dateDisplay.charAt(0).toUpperCase() + dateDisplay.slice(1);
    } catch (e) {
      dateDisplay = date;
    }

    const raceData = {
      id: id || undefined,
      name,
      date,
      dateDisplay,
      time: time || '09:00 AM',
      location: location || 'Parque Bicentenario • Circuito Deportivo Cerrado',
      city: city || 'Sector Explanada Central',
      status: status || 'planned',
      circuits: Array.isArray(circuits) ? circuits : (typeof circuits === 'string' ? circuits.split(',').map(s => s.trim()).filter(Boolean) : ['500 Metros', '1 Kilómetro', '2 Kilómetros', '3 Kilómetros']),
      maxParticipants: parseInt(maxParticipants, 10) || 500
    };

    const result = contentStore.saveRace(raceData);
    if (result.success) {
      return res.json({
        success: true,
        message: id ? '¡Corrida actualizada correctamente!' : '¡Nueva corrida generada y programada con éxito!',
        races: contentStore.getRaces(),
        activeRace: contentStore.getActiveRace()
      });
    } else {
      return res.status(500).json({ success: false, error: result.error });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Activar una corrida específica (SOLO Administrador)
router.post('/api/races/:id/activate', auth.requireAdmin, validateCsrf, (req, res) => {
  try {
    const { id } = req.params;
    const races = contentStore.getRaces();
    const race = races.find(r => r.id === id);

    if (!race) {
      return res.status(404).json({ success: false, error: 'Corrida no encontrada.' });
    }

    race.status = 'active';
    const result = contentStore.saveRace(race);

    if (result.success) {
      return res.json({
        success: true,
        message: `Corrida "${race.name}" activada como oficial para la landing page.`,
        activeRace: race
      });
    } else {
      return res.status(500).json({ success: false, error: result.error });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Obtener Lista de Inscripciones (Accesible para Administrador y Editor)
router.get('/api/leads', auth.requireAuth, async (req, res) => {
  const leads = await db.getInscriptions();
  res.json({ success: true, leads });
});

// Exportar Base de Datos de Participantes a CSV (Para Acreditación / Mesa del Evento)
router.get('/api/inscriptions/export', auth.requireAuth, async (req, res) => {
  const leads = await db.getInscriptions();

  // Encabezados limpios respetando privacidad
  const headers = ['Dorsal', 'Corrida', 'Nombre Pupilo/a', 'Edad', 'Distancia/Circuito', 'Nombre Tutor', 'Email Contacto', 'Telefono Emergencia', 'Comprobante URL', 'Consentimiento', 'Fecha Registro'];
  
  const rows = leads.map(l => [
    `"${l.bibNumber || ''}"`,
    `"${(l.raceName || 'KidsRun 2026').replace(/"/g, '""')}"`,
    `"${(l.kidName || '').replace(/"/g, '""')}"`,
    `"${l.kidAge || ''}"`,
    `"${(l.distance || '').replace(/"/g, '""')}"`,
    `"${(l.name || '').replace(/"/g, '""')}"`,
    `"${(l.email || '').replace(/"/g, '""')}"`,
    `"${(l.phone || l.emergencyContact || '').replace(/"/g, '""')}"`,
    `"${(l.paymentProof || '').replace(/"/g, '""')}"`,
    `"${l.consentGiven ? 'SI' : 'NO'}"`,
    `"${new Date(l.createdAt).toLocaleString('es-ES')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');

  res.header('Content-Type', 'text/csv; charset=utf-8');
  res.attachment(`inscripciones_kidsrun_${new Date().toISOString().split('T')[0]}.csv`);
  res.send(csvContent);
});

// Eliminar un Registro de Inscripción (SOLO Administrador por resguardo y trazabilidad)
router.delete('/api/leads/:id', auth.requireAdmin, validateCsrf, async (req, res) => {
  const { id } = req.params;
  const result = await db.deleteInscription(id);
  if (result.success) {
    res.json({ success: true, message: 'Registro de inscripción eliminado correctamente.' });
  } else {
    res.status(500).json({ success: false, error: result.error });
  }
});

// Cambiar Contraseña del usuario autenticado (Admin o Editor)
router.post('/api/change-password', auth.requireAuth, validateCsrf, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const username = req.session.username;
  const result = auth.changePassword(username, currentPassword, newPassword);
  if (result.success) {
    res.json({ success: true, message: 'Contraseña actualizada con éxito.' });
  } else {
    res.status(400).json({ success: false, error: result.error });
  }
});

module.exports = router;
