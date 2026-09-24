const express = require('express');
const router = express.Router();
const contentStore = require('../services/contentStore');
const db = require('../services/db');
const { validateCsrf } = require('../middleware/csrf');
const { rateLimit } = require('../middleware/rateLimit');

// Rate limiters para endpoints públicos de inscripción y contacto
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
  message: 'Has enviado demasiados formularios. Inténtalo nuevamente en 15 minutos.'
});

const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 5,
  message: 'Demasiados intentos de subida. Inténtalo nuevamente en 10 minutos.'
});

// Distancias permitidas (whitelist para evitar datos arbitrarios en BD)
const ALLOWED_DISTANCES = [
  '500 Metros (3-5 años)',
  '1 Kilómetro (6-8 años)',
  '2 Kilómetros (9-11 años)',
  '3 Kilómetros (12-14 años)',
  'Contacto General'
];

/**
 * Sanitiza un campo de texto: trunca a maxLen, elimina caracteres de control
 * y retorna string vacío si el valor no es string.
 */
function sanitizeField(value, maxLen = 255) {
  if (typeof value !== 'string') return '';
  // Eliminar caracteres de control (excepto tab y salto de línea) y truncar
  return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').substring(0, maxLen).trim();
}

/**
 * Valida formato de RUT chileno (con o sin puntos, con guión).
 * Acepta también formatos sin puntos: 12345678-9
 */
function isValidRut(rut) {
  if (!rut || typeof rut !== 'string') return false;
  const clean = rut.replace(/\./g, '').replace(/-/g, '').trim().toUpperCase();
  if (!/^\d{7,8}[0-9K]$/.test(clean)) return false;
  const body = clean.slice(0, -1);
  let dv = clean.slice(-1);
  let sum = 0;
  let mul = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * mul;
    mul = mul === 7 ? 2 : mul + 1;
  }
  const expected = 11 - (sum % 11);
  const expectedDv = expected === 11 ? '0' : expected === 10 ? 'K' : String(expected);
  return dv === expectedDv;
}

// ─── Modo Construcción & Previsualización ────────────────────────────────────

function renderConstructionView(req, res, content, isPreview = false) {
  const theme = contentStore.getTheme(content.brand?.accentColor || 'blue_sport');
  const themeMode = content.brand?.themeMode || 'light';
  const siteUrl = content.seo?.canonicalUrl || `${req.protocol}://${req.get('host')}`;
  const isStaff = !!(req.session && (req.session.isAdmin || req.session.isEditor));

  return res.render('construction', {
    content,
    theme,
    themeMode,
    siteUrl,
    isStaff,
    isPreview,
    csrfToken: req.session?.csrfToken || ''
  });
}

// Ruta de previsualización explícita del modo construcción para organizadores
router.get('/preview-construction', (req, res) => {
  const content = contentStore.getContent();
  return renderConstructionView(req, res, content, true);
});

// Captura de interesados durante el modo construcción
router.post('/api/notify-launch', (req, res) => {
  try {
    const contact = (req.body.contact || '').trim();
    if (!contact || contact.length < 5) {
      return res.status(400).json({ success: false, error: 'Por favor ingresa un correo o WhatsApp válido.' });
    }

    contentStore.addLead({
      name: 'Interesado Lanzamiento',
      email: contact.includes('@') ? contact : '',
      phone: !contact.includes('@') ? contact : '',
      subject: 'Aviso Pre-Lanzamiento (Modo Construcción)',
      message: `Contacto registrado desde la pantalla de construcción: ${contact}`
    });

    return res.json({
      success: true,
      message: '¡Excelente! Te avisaremos apenas abran las inscripciones.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Página Principal ────────────────────────────────────────────────────────

router.get('/', (req, res) => {
  const content = contentStore.getContent();
  const isConstruction = content.construction && content.construction.enabled === true;
  const isStaff = !!(req.session && (req.session.isAdmin || req.session.isEditor));

  // Si está en modo construcción y el usuario NO es staff, mostrar la vista de construcción
  if (isConstruction && !isStaff) {
    return renderConstructionView(req, res, content, false);
  }

  const theme = contentStore.getTheme(content.brand?.accentColor || 'green_yellow');
  const themeMode = content.brand?.themeMode || 'light';
  const siteUrl = content.seo?.canonicalUrl || `${req.protocol}://${req.get('host')}`;

  // Esquema JSON-LD estructurado de Schema.org para Google SportsEvent
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SportsEvent",
        "@id": `${siteUrl}/#sportsevent`,
        "name": content.brand?.name || "KidsRun 2026",
        "description": content.seo?.metaDescription || "",
        "startDate": content.countdown?.targetDate || "2026-11-15T09:00:00",
        "eventStatus": "https://schema.org/EventScheduled",
        "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
        "location": {
          "@type": "Place",
          "name": content.countdown?.locationName || "Parque Bicentenario",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": content.countdown?.locationCity || "Santiago",
            "addressCountry": "CL"
          }
        },
        "image": [
          content.seo?.ogImage || "https://images.unsplash.com/photo-1517649763962-0c623266ddc0"
        ],
        "offers": (content.pricing?.plans || []).map(plan => ({
          "@type": "Offer",
          "name": plan.name,
          "price": plan.priceMonthly,
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock",
          "url": `${siteUrl}/#pricing`
        }))
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        "url": siteUrl,
        "name": content.brand?.name || "KidsRun 2026",
        "description": content.seo?.metaDescription || "",
        "inLanguage": "es"
      }
    ]
  };

  const activeRace = contentStore.getActiveRace();
  const races = contentStore.getRaces();

  res.render('index', {
    content,
    theme,
    themeMode,
    siteUrl,
    activeRace,
    races,
    jsonLd: JSON.stringify(jsonLd),
    csrfToken: req.session?.csrfToken || '',
    constructionAdminBypass: isConstruction && isStaff
  });
});

// ─── Página de Inscripción ───────────────────────────────────────────────────

router.get('/inscribir', (req, res) => {
  const content = contentStore.getContent();
  const isConstruction = content.construction && content.construction.enabled === true;
  const isStaff = !!(req.session && (req.session.isAdmin || req.session.isEditor));

  // Si está en modo construcción y el usuario NO es staff, mostrar la vista de construcción
  if (isConstruction && !isStaff) {
    return renderConstructionView(req, res, content, false);
  }

  const theme = contentStore.getTheme(content.brand?.accentColor || 'green_yellow');
  const themeMode = content.brand?.themeMode || 'light';
  const siteUrl = content.seo?.canonicalUrl || `${req.protocol}://${req.get('host')}`;
  const activeRace = contentStore.getActiveRace();

  res.render('inscribir', {
    content,
    theme,
    themeMode,
    siteUrl,
    activeRace,
    csrfToken: req.session?.csrfToken || '',
    constructionAdminBypass: isConstruction && isStaff
  });
});

// ─── Upload de Comprobante de Pago ──────────────────────────────────────────

const imageService = require('../services/imageService');
const emailService = require('../services/emailService');
router.post('/api/upload-proof', uploadLimiter, validateCsrf, imageService.upload.single('proof'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No se ha adjuntado ningún archivo de comprobante.' });
    }

    const result = await imageService.processAndSaveImage(req.file.buffer, req.file.originalname, 'payment_proof');
    return res.json({
      success: true,
      message: 'Comprobante guardado y optimizado con éxito.',
      data: result
    });
  } catch (err) {
    console.error('[upload-proof] Error procesando comprobante:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Error procesando el comprobante. Verifica que sea una imagen válida.'
    });
  }
});

// ─── Sitemap y Robots ────────────────────────────────────────────────────────

router.get('/sitemap.xml', (req, res) => {
  const content = contentStore.getContent();
  const siteUrl = content.seo?.canonicalUrl || `${req.protocol}://${req.get('host')}`;
  const today = new Date().toISOString().split('T')[0];

  res.header('Content-Type', 'application/xml; charset=utf-8');
  res.render('sitemap', { siteUrl, today });
});

router.get('/robots.txt', (req, res) => {
  const content = contentStore.getContent();
  const siteUrl = content.seo?.canonicalUrl || `${req.protocol}://${req.get('host')}`;
  const allowIndex = content.seo?.enableRobotsIndex !== false;

  res.header('Content-Type', 'text/plain; charset=utf-8');
  res.render('robots', { siteUrl, allowIndex });
});

// ─── Contacto General ────────────────────────────────────────────────────────

router.post('/api/inquiry', contactLimiter, validateCsrf, async (req, res) => {
  const name    = sanitizeField(req.body.name, 100);
  const email   = sanitizeField(req.body.email, 254);
  const phone   = sanitizeField(req.body.phone, 30);
  const subject = sanitizeField(req.body.subject, 150);
  const message = sanitizeField(req.body.message, 1000);

  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      error: 'Por favor completa tu nombre, correo electrónico y mensaje.'
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'Por favor introduce un correo electrónico válido.'
    });
  }

  await db.saveInscription({
    name,
    email,
    phone,
    kidName: 'Consulta General',
    subject: subject || 'Consulta Web',
    message,
    distance: 'Contacto General'
  });

  // Reenvío opcional a FormSubmit.co (100% gratis y externo)
  try {
    const content = contentStore.getContent();
    const destinationEmail = content.contact?.forwardEmail || process.env.CONTACT_DESTINATION_EMAIL;
    if (destinationEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destinationEmail)) {
      // Disparo asíncrono hacia FormSubmit sin bloquear respuesta al usuario
      fetch(`https://formsubmit.co/ajax/${encodeURIComponent(destinationEmail)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: `[KidsRun Contacto] ${subject || 'Nueva consulta web'}`,
          Nombre: name,
          Email: email,
          Telefono: phone || 'No informado',
          Asunto: subject || 'Consulta General',
          Mensaje: message,
          _template: 'table'
        })
      }).then(r => r.json()).then(resData => {
        console.log('[FormSubmit] Envío de correo completado:', resData);
      }).catch(err => {
        console.warn('[FormSubmit] No se pudo enviar notificación externa:', err.message);
      });
    }
  } catch (err) {
    console.warn('[FormSubmit] Excepción al procesar correo externo:', err.message);
  }

  return res.json({
    success: true,
    message: '¡Gracias por contactarnos! Tu mensaje fue recibido y te responderemos a la brevedad.'
  });
});

// ─── Inscripción Familiar ────────────────────────────────────────────────────

router.post('/api/contact', contactLimiter, validateCsrf, async (req, res) => {
  // Honeypot: si el campo trampa tiene contenido, es un bot — responder 200 falso
  if (req.body.website_url) {
    return res.json({ success: true, message: '¡Inscripción recibida!' });
  }

  const raceId          = sanitizeField(req.body.raceId, 64);
  const raceName        = sanitizeField(req.body.raceName, 255);
  const name            = sanitizeField(req.body.name, 100);
  const email           = sanitizeField(req.body.email, 254);
  const phone           = sanitizeField(req.body.phone, 30);
  const kidName         = sanitizeField(req.body.kidName, 100);
  const emergencyContact = sanitizeField(req.body.emergencyContact, 30);
  const medicalNotes    = sanitizeField(req.body.medicalNotes, 500);
  const tutorRut        = sanitizeField(req.body.tutorRut, 20);
  const paymentProof    = sanitizeField(req.body.paymentProof, 500);
  const consentGiven    = req.body.consentGiven;

  // Validar distancia contra whitelist
  const rawDistance = sanitizeField(req.body.distance, 100);
  const distance = ALLOWED_DISTANCES.includes(rawDistance) ? rawDistance : null;

  // Validar kidAge como entero en rango
  const kidAge = parseInt(req.body.kidAge, 10);
  const validKidAge = (!isNaN(kidAge) && kidAge >= 2 && kidAge <= 15) ? kidAge : null;

  if (!name || !email) {
    return res.status(400).json({
      success: false,
      error: 'Por favor ingresa tu Nombre (Padre/Tutor) y Correo Electrónico de contacto.'
    });
  }

  if (!kidName) {
    return res.status(400).json({
      success: false,
      error: 'Por favor ingresa el Nombre o Apodo deportivo de tu pupilo.'
    });
  }

  if (!distance) {
    return res.status(400).json({
      success: false,
      error: 'Por favor selecciona una distancia válida.'
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'Por favor introduce un correo electrónico válido.'
    });
  }

  // Validar RUT chileno si fue proporcionado
  if (tutorRut && !isValidRut(tutorRut)) {
    return res.status(400).json({
      success: false,
      error: 'El RUT/DNI ingresado no es válido. Verifica el formato (ej: 12.345.678-9).'
    });
  }

  // Validar que paymentProof sea una URL propia del servidor si fue proporcionada
  if (paymentProof && !paymentProof.startsWith('/admin/api/proofs/') && !paymentProof.startsWith('/uploads/')) {
    return res.status(400).json({
      success: false,
      error: 'El comprobante de pago no es válido. Por favor sube el archivo nuevamente.'
    });
  }

  const activeRace = contentStore.getActiveRace();
  if (activeRace && activeRace.status === 'paused') {
    return res.status(400).json({
      success: false,
      error: 'Las inscripciones para esta corrida se encuentran temporalmente pausadas. Por favor intenta más tarde o comunícate con la organización.'
    });
  }
  if (activeRace && activeRace.status === 'inactive') {
    return res.status(400).json({
      success: false,
      error: 'No hay inscripciones abiertas en este momento para esta corrida.'
    });
  }

  const targetRaceId = raceId || (activeRace ? activeRace.id : 'race-2026-primavera');
  const targetRaceName = raceName || (activeRace ? activeRace.name : 'KidsRun 2026');

  const result = await db.saveInscription({
    raceId: targetRaceId,
    raceName: targetRaceName,
    name,
    email,
    phone,
    tutorRut,
    kidName,
    kidAge: validKidAge,
    distance,
    emergencyContact: emergencyContact || phone,
    medicalNotes,
    paymentProof: paymentProof || '',
    consentGiven: Boolean(consentGiven === 'true' || consentGiven === true || consentGiven === 'on'),
    subject: `Inscripción ${distance} - Pupilo: ${kidName}`
  });

  if (result.success) {
    // Despacho asíncrono de correo de confirmación al usuario (Resend)
    try {
      emailService.sendInscriptionConfirmation({
        raceName: targetRaceName,
        name,
        email,
        kidName,
        kidAge: validKidAge,
        distance,
        tutorRut
      }).catch(err => {
        console.warn('[emailService] No se pudo enviar confirmación a ' + email + ':', err.message);
      });
    } catch (mailErr) {
      console.warn('[emailService] Excepción disparando correo:', mailErr.message);
    }

    return res.json({
      success: true,
      message: '¡Inscripción confirmada con éxito! Sus datos están debidamente protegidos y se ha reservado el cupo y kit oficial.',
      source: result.source
    });
  } else {
    return res.status(500).json({
      success: false,
      error: 'Ocurrió un error al procesar la inscripción. Por favor inténtalo nuevamente.'
    });
  }
});

module.exports = router;
