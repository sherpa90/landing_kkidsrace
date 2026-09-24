const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const contentStore = require('../services/contentStore');
const auth = require('../services/auth');
const db = require('../services/db');
const { rateLimit } = require('../middleware/rateLimit');
const { validateCsrf } = require('../middleware/csrf');
const imageService = require('../services/imageService');

// Sincronizar usuario de variables de entorno una sola vez al arrancar
auth.syncEnvAdmin();

// Rate limiting para login: 10 intentos cada 15 minutos por IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
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

  const user = auth.verifyCredentials(username, password, req.ip);

  // Cuenta bloqueada por demasiados intentos fallidos
  if (user && user.locked) {
    const mins = Math.ceil(user.waitSeconds / 60);
    const msg = `Cuenta bloqueada temporalmente por múltiples intentos fallidos. Intenta nuevamente en ${mins} minuto${mins !== 1 ? 's' : ''}.`;
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(429).json({ success: false, error: msg });
    }
    return res.render('admin/login', { error: msg, csrfToken: req.session?.csrfToken || '' });
  }

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

  const usersList = auth.getUsers().map(u => ({
    id: u.id,
    username: u.username,
    name: u.name,
    role: u.role,
    createdAt: u.createdAt
  }));

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
    csrfToken,
    usersList
  });
});

// Guardar Actualizaciones de Contenido desde el CMS (CSRF protegido)
router.post('/api/content', auth.requireAuth, validateCsrf, (req, res) => {
  try {
    const newContent = req.body;
    if (!newContent || typeof newContent !== 'object' || Array.isArray(newContent)) {
      return res.status(400).json({ success: false, error: 'Datos no válidos' });
    }

    // Whitelist de claves top-level permitidas en el CMS
    const ALLOWED_KEYS = ['brand', 'hero', 'features', 'pricing', 'testimonials', 'faq', 'faqs', 'contact', 'seo', 'countdown', 'gallery', 'sponsors', 'footer', 'venue', 'sections', 'video', 'construction', 'schedule', 'scheduleSection'];
    const filtered = {};
    for (const key of ALLOWED_KEYS) {
      if (key in newContent) filtered[key] = newContent[key];
    }
    // Sincronizar faq y faqs para evitar discrepancias
    if ('faqs' in newContent) {
      filtered['faqs'] = newContent['faqs'];
      filtered['faq'] = newContent['faqs'];
    } else if ('faq' in newContent) {
      filtered['faqs'] = newContent['faq'];
      filtered['faq'] = newContent['faq'];
    }

    const result = contentStore.saveContent(filtered);
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

// Endpoint rápido para activar/desactivar Modo Construcción
router.post('/api/toggle-construction', auth.requireAuth, validateCsrf, (req, res) => {
  try {
    const current = contentStore.getContent();
    const currentConstruction = current.construction || {};
    const newEnabled = typeof req.body.enabled === 'boolean' 
      ? req.body.enabled 
      : !currentConstruction.enabled;

    const updatedConstruction = {
      ...currentConstruction,
      enabled: newEnabled
    };

    const result = contentStore.saveContent({ construction: updatedConstruction });
    if (result.success) {
      return res.json({
        success: true,
        enabled: newEnabled,
        message: newEnabled 
          ? '🚧 Modo Construcción ACTIVADO. El público general verá la página de lanzamiento.' 
          : '🚀 Modo Construcción DESACTIVADO. La web completa ya está visible para el público.'
      });
    } else {
      return res.status(500).json({ success: false, error: result.error });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint para subir y optimizar imágenes automáticamente con Sharp (WebP)
router.post('/api/upload', auth.requireAdmin, validateCsrf, imageService.upload.single('image'), async (req, res) => {
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

// Endpoint para subir videos cortos (MP4 / WebM) para la sección de video autoplay
const multer = require('multer');
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
const VIDEO_MAX_BYTES = 200 * 1024 * 1024; // 200 MB

const videoUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = imageService.UPLOAD_DIR;
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '') || '.mp4';
      const safe = `video_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
      cb(null, safe);
    }
  }),
  limits: { fileSize: VIDEO_MAX_BYTES },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de video no permitido. Solo se aceptan MP4, WebM y OGG.'));
    }
  }
});

router.post('/api/upload-video', auth.requireAdmin, validateCsrf, videoUpload.single('video'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No se ha proporcionado ningún archivo de video.' });
    }
    const publicUrl = `/uploads/${req.file.filename}`;
    return res.json({
      success: true,
      message: 'Video subido correctamente.',
      data: { url: publicUrl, filename: req.file.filename, sizeBytes: req.file.size }
    });
  } catch (err) {
    console.error('Error subiendo video:', err);
    return res.status(500).json({ success: false, error: err.message || 'Error al subir el video.' });
  }
});

// Crear/Editar Corrida (Permitido SOLO para rol Administrador)
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
    const result = contentStore.updateRaceStatus(id, 'active');
    if (result.success) {
      const active = contentStore.getActiveRace();
      return res.json({
        success: true,
        message: `Corrida "${active?.name || id}" activada como oficial para la landing page.`,
        activeRace: active,
        races: contentStore.getRaces()
      });
    } else {
      return res.status(404).json({ success: false, error: result.error || 'Corrida no encontrada' });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Cambiar estado de corrida: pausar, activar, desactivar (SOLO Administrador)
router.post('/api/races/:id/status', auth.requireAdmin, validateCsrf, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['active', 'paused', 'inactive', 'planned'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Estado de corrida inválido.' });
    }

    const result = contentStore.updateRaceStatus(id, status);
    if (result.success) {
      const statusLabels = {
        active: 'activada en la web',
        paused: 'pausada temporalmente',
        inactive: 'desactivada de la web',
        planned: 'marcada como programada'
      };
      return res.json({
        success: true,
        message: `Corrida ${statusLabels[status] || status} exitosamente.`,
        races: contentStore.getRaces(),
        activeRace: contentStore.getActiveRace()
      });
    } else {
      return res.status(404).json({ success: false, error: result.error || 'Corrida no encontrada' });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Modificar o agregar cupos a una corrida (SOLO Administrador)
router.post('/api/races/:id/capacity', auth.requireAdmin, validateCsrf, (req, res) => {
  try {
    const { id } = req.params;
    const { add, maxParticipants } = req.body;

    const result = contentStore.updateRaceCapacity(id, { add, maxParticipants });
    if (result.success) {
      const races = contentStore.getRaces();
      const updated = races.find(r => r.id === id);
      return res.json({
        success: true,
        message: `Cupo de la corrida actualizado a ${updated?.maxParticipants || 'nuevo valor'} participantes.`,
        races,
        race: updated
      });
    } else {
      return res.status(404).json({ success: false, error: result.error || 'Corrida no encontrada' });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Eliminar una corrida (SOLO Administrador)
router.delete('/api/races/:id', auth.requireAdmin, validateCsrf, (req, res) => {
  try {
    const { id } = req.params;
    const races = contentStore.getRaces();
    const race = races.find(r => r.id === id);

    if (!race) {
      return res.status(404).json({ success: false, error: 'Corrida no encontrada.' });
    }

    const result = contentStore.deleteRace(id);
    if (result.success) {
      return res.json({
        success: true,
        message: `Corrida "${race.name}" eliminada correctamente del sistema.`,
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

// Obtener Lista de Inscripciones (Accesible para Administrador y Editor)
router.get('/api/leads', auth.requireAuth, async (req, res) => {
  const leads = await db.getInscriptions();
  res.json({ success: true, leads });
});

// Helper para mitigar CSV Formula Injection (neutralizar =, +, -, @, tab, cr)
function sanitizeCsvCell(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  const dangerousChars = ['=', '+', '-', '@', '\t', '\r'];
  const sanitized = (str.length > 0 && dangerousChars.includes(str.charAt(0))) ? `'${str}` : str;
  return `"${sanitized.replace(/"/g, '""')}"`;
}

// Exportar Base de Datos de Participantes a CSV (Para Acreditación / Mesa del Evento)
router.get('/api/inscriptions/export', auth.requireAuth, async (req, res) => {
  const leads = await db.getInscriptions();

  // Encabezados limpios respetando privacidad
  const headers = ['Dorsal', 'Corrida', 'Nombre Pupilo/a', 'Edad', 'Distancia/Circuito', 'Nombre Tutor', 'Email Contacto', 'Telefono Emergencia', 'Comprobante URL', 'Consentimiento', 'Fecha Registro'];
  
  const rows = leads.map(l => [
    sanitizeCsvCell(l.bibNumber || ''),
    sanitizeCsvCell(l.raceName || 'KidsRun 2026'),
    sanitizeCsvCell(l.kidName || ''),
    sanitizeCsvCell(l.kidAge || ''),
    sanitizeCsvCell(l.distance || ''),
    sanitizeCsvCell(l.name || ''),
    sanitizeCsvCell(l.email || ''),
    sanitizeCsvCell(l.phone || l.emergencyContact || ''),
    sanitizeCsvCell(l.paymentProof || ''),
    sanitizeCsvCell(l.consentGiven ? 'SI' : 'NO'),
    sanitizeCsvCell(new Date(l.createdAt).toLocaleString('es-ES'))
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');

  res.header('Content-Type', 'text/csv; charset=utf-8');
  res.attachment(`inscripciones_kidsrun_${new Date().toISOString().split('T')[0]}.csv`);
  res.send(csvContent);
});

// Servir Comprobantes de Pago de forma Segura (SOLO Administradores y Editores autenticados)
router.get('/api/proofs/:filename', auth.requireAuth, (req, res) => {
  const { filename } = req.params;

  // Whitelist estricta contra Path Traversal: solo alfanuméricos, guiones y extensión .webp
  if (!filename || !/^[a-zA-Z0-9_-]+\.webp$/.test(filename)) {
    return res.status(400).send('Nombre de archivo inválido.');
  }

  // Buscar primero en el directorio privado, con fallback al directorio de uploads para retrocompatibilidad
  const privatePath = path.join(imageService.PRIVATE_UPLOAD_DIR, filename);
  const publicFallbackPath = path.join(imageService.UPLOAD_DIR, filename);

  let targetPath = null;
  if (fs.existsSync(privatePath)) {
    targetPath = privatePath;
  } else if (fs.existsSync(publicFallbackPath)) {
    targetPath = publicFallbackPath;
  }

  if (!targetPath) {
    return res.status(404).send('Comprobante no encontrado.');
  }

  res.setHeader('Content-Type', 'image/webp');
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  return res.sendFile(targetPath);
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


// ─── Gestión de Usuarios y Accesos (SOLO Administrador) ───────────────────────

// Listar usuarios (JSON)
router.get('/api/users', auth.requireAdmin, (req, res) => {
  const users = auth.getUsers().map(u => ({
    id: u.id,
    username: u.username,
    name: u.name,
    role: u.role,
    createdAt: u.createdAt
  }));
  res.json({ success: true, users });
});

// Crear nuevo usuario (Admin o Editor)
router.post('/api/users', auth.requireAdmin, validateCsrf, (req, res) => {
  const { username, name, role, password } = req.body;
  const result = auth.createUser({ username, name, role, password });
  if (result.success) {
    res.json({ success: true, message: 'Usuario creado exitosamente.', user: result.user });
  } else {
    res.status(400).json({ success: false, error: result.error });
  }
});

// Modificar usuario existente
router.put('/api/users/:id', auth.requireAdmin, validateCsrf, (req, res) => {
  const { id } = req.params;
  const { name, role, password } = req.body;
  const result = auth.updateUser(id, { name, role, password });
  if (result.success) {
    res.json({ success: true, message: 'Usuario actualizado exitosamente.', user: result.user });
  } else {
    res.status(400).json({ success: false, error: result.error });
  }
});

// Eliminar usuario
router.delete('/api/users/:id', auth.requireAdmin, validateCsrf, (req, res) => {
  const { id } = req.params;
  const currentAdmin = req.session.username;
  const result = auth.deleteUser(id, currentAdmin);
  if (result.success) {
    res.json({ success: true, message: result.message });
  } else {
    res.status(400).json({ success: false, error: result.error });
  }
});

module.exports = router;
