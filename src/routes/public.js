const express = require('express');
const router = express.Router();
const contentStore = require('../services/contentStore');
const db = require('../services/db');
const { validateCsrf } = require('../middleware/csrf');
const { rateLimit } = require('../middleware/rateLimit');
const emailService = require('../services/emailService');

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

// Distancias permitidas: se construyen dinámicamente desde el CMS para evitar datos arbitrarios en BD
function getAllowedDistances() {
  const content = contentStore.getContent();
  const dynamic = (content.categories || []).map(c => `${c.distance} (${c.badge})`);
  const dynamicRaw = (content.categories || []).map(c => c.distance);
  // Agregar valores oficiales y de respaldo para máxima compatibilidad
  const fallback = [
    '250 Metros babykidsrace (0 a 3 años)',
    '250 Metros planos (4 y 5 años)',
    '500 Metros planos (6 y 7 años)',
    '500 Metros NEE (4 a 9 años NEE)',
    '1 Kilómetro (8 y 9 años)',
    '1 Kilómetro NEE (10 a 14 años NEE)',
    '2 Kilómetros (10 a 12 años)',
    '4 Kilómetros (13 y 14 años)',
    '250 Metros babykidsrace',
    '250 Metros planos',
    '500 Metros planos',
    '500 Metros NEE',
    '1 Kilómetro',
    '1 Kilómetro NEE',
    '2 Kilómetros',
    '4 Kilómetros',
    '500 Metros (3-5 años)',
    '1 Kilómetro (6-8 años)',
    '2 Kilómetros (9-11 años)',
    '3 Kilómetros (12-14 años)',
    'Contacto General'
  ];
  const all = new Set([...dynamic, ...dynamicRaw, ...fallback]);
  return Array.from(all);
}

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
        "name": content.brand?.name || "Kids Race 2026",
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
        "name": content.brand?.name || "Kids Race 2026",
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

// ─── Página Oficial de Bases, Recorridos y Reglamento ───────────────────────

router.get('/bases', (req, res) => {
  const content = contentStore.getContent();
  const isConstruction = content.construction && content.construction.enabled === true;
  const isStaff = !!(req.session && (req.session.isAdmin || req.session.isEditor));

  if (isConstruction && !isStaff) {
    return renderConstructionView(req, res, content, false);
  }

  const theme = contentStore.getTheme(content.brand?.accentColor || 'green_yellow');
  const themeMode = content.brand?.themeMode || 'light';
  const siteUrl = content.seo?.canonicalUrl || `${req.protocol}://${req.get('host')}`;
  const activeRace = contentStore.getActiveRace();

  res.render('bases', {
    content,
    theme,
    themeMode,
    siteUrl,
    activeRace,
    csrfToken: req.session?.csrfToken || '',
    constructionAdminBypass: isConstruction && isStaff
  });
});

router.get('/reglamento', (req, res) => {
  res.redirect(301, '/bases');
});

// ─── Upload de Comprobante de Pago ──────────────────────────────────────────

const imageService = require('../services/imageService');
router.post('/api/upload-proof', uploadLimiter, validateCsrf, imageService.upload.single('proof'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No se ha adjuntado ningún archivo de comprobante.' });
    }

    // Límite estricto de 3 MB para la captura
    if (req.file.size > 3 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: 'El comprobante supera el tamaño máximo permitido de 3 MB. Por favor adjunta una imagen o captura más liviana.'
      });
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
          _subject: `[Kids Race Contacto] ${subject || 'Nueva consulta web'}`,
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

  const raceId           = sanitizeField(req.body.raceId, 64);
  const raceName         = sanitizeField(req.body.raceName, 255);
  const tutorFirstName   = sanitizeField(req.body.tutorFirstName, 60);
  const tutorLastName    = sanitizeField(req.body.tutorLastName, 60);
  let name               = sanitizeField(req.body.name, 120);
  if (!name && (tutorFirstName || tutorLastName)) {
    name = `${tutorFirstName} ${tutorLastName}`.trim();
  }

  const email            = sanitizeField(req.body.email, 254);
  const phone            = sanitizeField(req.body.phone, 30);
  const emergencyContact = sanitizeField(req.body.emergencyContact, 30) || phone;
  const tutorRut         = sanitizeField(req.body.tutorRut, 20);
  const paymentProof     = sanitizeField(req.body.paymentProof, 500);
  const consentGiven     = req.body.consentGiven;

  // Validación de campos obligatorios del apoderado/tutor
  if (!tutorFirstName || !tutorLastName) {
    return res.status(400).json({
      success: false,
      error: 'Por favor ingresa tanto el Nombre como el Apellido del padre o tutor.'
    });
  }

  if (!tutorRut) {
    return res.status(400).json({
      success: false,
      error: 'El RUN / RUT del apoderado o tutor es obligatorio como número identificatorio.'
    });
  }

  if (!isValidRut(tutorRut)) {
    return res.status(400).json({
      success: false,
      error: 'El RUT/RUN ingresado no es válido. Verifica el dígito verificador (ej: 12.345.678-9).'
    });
  }

  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'El correo electrónico de contacto es obligatorio.'
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'Por favor introduce un correo electrónico válido.'
    });
  }

  if (!phone) {
    return res.status(400).json({
      success: false,
      error: 'El teléfono / WhatsApp de contacto es obligatorio.'
    });
  }

  if (!paymentProof) {
    return res.status(400).json({
      success: false,
      error: 'Por favor adjunta la captura o comprobante de pago/transferencia (máx. 3 MB).'
    });
  }

  // Validar que paymentProof sea una URL propia del servidor
  if (!paymentProof.startsWith('/admin/api/proofs/') && !paymentProof.startsWith('/uploads/')) {
    return res.status(400).json({
      success: false,
      error: 'El comprobante de pago no es válido. Por favor sube el archivo nuevamente.'
    });
  }

  if (!consentGiven || consentGiven === 'false') {
    return res.status(400).json({
      success: false,
      error: 'Debes confirmar la autorización y consentimiento informado para participar.'
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
  const targetRaceName = raceName || (activeRace ? activeRace.name : 'Kids Race 2026');

  const allowedDistances = getAllowedDistances();
  const ALLOWED_SHIRT_SIZES = ['2', '4', '8', '12', '16', 'S', 'M'];

  // ── Multi-child: si viene array de children, procesar cada uno ──────────────
  let childrenArray = [];
  if (Array.isArray(req.body.children) && req.body.children.length > 0) {
    childrenArray = req.body.children;
  } else {
    // Compatibilidad hacia atrás: un solo hijo con campos legacy
    childrenArray = [{
      kidFirstName: req.body.kidFirstName || req.body.kidName,
      kidLastName: req.body.kidLastName || '',
      kidName: req.body.kidName,
      kidAge: req.body.kidAge,
      shirtSize: req.body.shirtSize || '4',
      distance: req.body.distance,
      medicalNotes: req.body.medicalNotes
    }];
  }

  if (childrenArray.length === 0) {
    return res.status(400).json({ success: false, error: 'Debes ingresar al menos un hijo/a a inscribir.' });
  }

  const results = [];
  for (let idx = 0; idx < childrenArray.length; idx++) {
    const child = childrenArray[idx];
    const kidFirstName = sanitizeField(child.kidFirstName, 60);
    const kidLastName  = sanitizeField(child.kidLastName, 60);
    let kidName        = sanitizeField(child.kidName, 120);
    if (!kidName && (kidFirstName || kidLastName)) {
      kidName = `${kidFirstName} ${kidLastName}`.trim();
    }

    if (!kidFirstName || !kidLastName) {
      return res.status(400).json({
        success: false,
        error: `Por favor ingresa tanto el Nombre como el Apellido para el corredor #${idx + 1}.`
      });
    }

    const shirtSize = sanitizeField(child.shirtSize, 10);
    if (!shirtSize || !ALLOWED_SHIRT_SIZES.includes(shirtSize)) {
      return res.status(400).json({
        success: false,
        error: `Por favor selecciona una talla de polera válida (2, 4, 8, 12, 16, S o M) para "${kidName}".`
      });
    }

    const rawDistance  = sanitizeField(child.distance, 100);
    const distance     = allowedDistances.includes(rawDistance) ? rawDistance : null;
    if (!distance) {
      return res.status(400).json({
        success: false,
        error: `Distancia o circuito no válido para el participante "${kidName}". Selecciona un circuito válido.`
      });
    }

    const kidAge       = parseInt(child.kidAge, 10);
    if (isNaN(kidAge) || kidAge < 0 || kidAge > 14) {
      return res.status(400).json({
        success: false,
        error: `La edad del participante "${kidName}" debe estar en el rango de 0 a 14 años.`
      });
    }
    const validKidAge  = kidAge;

    const medicalNotes = sanitizeField(child.medicalNotes, 500) || 'Ninguna';

    const result = await db.saveInscription({
      raceId: targetRaceId,
      raceName: targetRaceName,
      tutorFirstName,
      tutorLastName,
      name,
      email,
      phone,
      tutorRut,
      kidFirstName,
      kidLastName,
      kidName,
      kidAge: validKidAge,
      shirtSize,
      distance,
      emergencyContact: emergencyContact || phone,
      medicalNotes,
      paymentProof: paymentProof || '',
      consentGiven: Boolean(consentGiven === 'true' || consentGiven === true || consentGiven === 'on'),
      subject: `Inscripción ${distance} - Pupilo: ${kidName}`
    });

    const assignedBib = result.bibNumber || (result.lead ? result.lead.bib_number : '0100');

    results.push({
      kidName,
      kidFirstName,
      kidLastName,
      kidAge: validKidAge,
      distance,
      shirtSize,
      bibNumber: assignedBib,
      inscriptionNumber: assignedBib,
      success: result.success
    });

    if (result.success) {
      // Despacho asíncrono de correo de confirmación al usuario (Resend)
      try {
        emailService.sendInscriptionConfirmation({
          raceName: targetRaceName,
          name,
          tutorFirstName,
          tutorLastName,
          email,
          kidName,
          kidFirstName,
          kidLastName,
          kidAge: validKidAge,
          shirtSize,
          bibNumber: assignedBib,
          distance,
          tutorRut
        }).catch(err => {
          console.warn('[emailService] No se pudo enviar confirmación a ' + email + ':', err.message);
        });
      } catch (mailErr) {
        console.warn('[emailService] Excepción disparando correo:', mailErr.message);
      }
    }
  }

  const allOk = results.every(r => r.success);
  if (allOk) {
    return res.json({
      success: true,
      count: results.length,
      tutorRut,
      tutorName: name,
      message: results.length > 1
        ? `¡${results.length} inscripciones confirmadas con éxito! Sus datos están debidamente protegidos y se han reservado los cupos y kits oficiales.`
        : '¡Inscripción confirmada con éxito! Sus datos están debidamente protegidos y se ha reservado el cupo y kit oficial.',
      children: results
    });
  } else {
    return res.status(500).json({
      success: false,
      error: 'Ocurrió un error al procesar una o más inscripciones. Por favor inténtalo nuevamente.'
    });
  }
});

module.exports = router;

