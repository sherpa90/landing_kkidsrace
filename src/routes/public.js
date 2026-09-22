const express = require('express');
const router = express.Router();
const contentStore = require('../services/contentStore');
const db = require('../services/db');

// Página Principal (Landing Page Deportiva con SSR y SEO Dinámico)
router.get('/', (req, res) => {
  const content = contentStore.getContent();
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
    jsonLd: JSON.stringify(jsonLd)
  });
});

// Página Dedicada de Inscripción Mobile-First
router.get('/inscribir', (req, res) => {
  const content = contentStore.getContent();
  const theme = contentStore.getTheme(content.brand?.accentColor || 'green_yellow');
  const themeMode = content.brand?.themeMode || 'light';
  const siteUrl = content.seo?.canonicalUrl || `${req.protocol}://${req.get('host')}`;
  const activeRace = contentStore.getActiveRace();

  res.render('inscribir', {
    content,
    theme,
    themeMode,
    siteUrl,
    activeRace
  });
});

// Endpoint público para subir y optimizar captura de comprobante de pago
const imageService = require('../services/imageService');
router.post('/api/upload-proof', imageService.upload.single('proof'), async (req, res) => {
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
    console.error('Error procesando comprobante:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Error procesando el comprobante.'
    });
  }
});

// Endpoint Dinámico de Sitemap XML
router.get('/sitemap.xml', (req, res) => {
  const content = contentStore.getContent();
  const siteUrl = content.seo?.canonicalUrl || `${req.protocol}://${req.get('host')}`;
  const today = new Date().toISOString().split('T')[0];

  res.header('Content-Type', 'application/xml; charset=utf-8');
  res.render('sitemap', { siteUrl, today });
});

// Endpoint Dinámico de Robots.txt
router.get('/robots.txt', (req, res) => {
  const content = contentStore.getContent();
  const siteUrl = content.seo?.canonicalUrl || `${req.protocol}://${req.get('host')}`;
  const allowIndex = content.seo?.enableRobotsIndex !== false;

  res.header('Content-Type', 'text/plain; charset=utf-8');
  res.render('robots', { siteUrl, allowIndex });
});

// Endpoint para Consultas Generales de Contacto (Sección Contacto Portada)
router.post('/api/inquiry', async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

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

  // Guardar consulta en la base de datos o registro
  await db.saveInscription({
    name: name.trim(),
    email: email.trim(),
    phone: (phone || '').trim(),
    kidName: 'Consulta General',
    subject: (subject || 'Consulta Web').trim(),
    message: message.trim(),
    distance: 'Contacto General'
  });

  return res.json({
    success: true,
    message: '¡Gracias por contactarnos! Tu mensaje fue recibido y te responderemos a la brevedad.'
  });
});

// Endpoint para Inscripciones y Contacto Familiar (Cumplimiento de Protección de Datos)
router.post('/api/contact', async (req, res) => {
  const {
    raceId,
    name,
    email,
    phone,
    kidName,
    kidAge,
    distance,
    emergencyContact,
    medicalNotes,
    consentGiven,
    paymentProof,
    tutorRut
  } = req.body;

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

  // Validación de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'Por favor introduce un correo electrónico válido.'
    });
  }

  const activeRace = contentStore.getActiveRace();
  const targetRaceId = raceId || (activeRace ? activeRace.id : 'race-2026-primavera');
  const targetRaceName = activeRace ? activeRace.name : 'KidsRun 2026';

  const result = await db.saveInscription({
    raceId: targetRaceId,
    raceName: targetRaceName,
    name,
    email,
    phone,
    tutorRut: tutorRut || '',
    kidName,
    kidAge: parseInt(kidAge, 10) || null,
    distance: distance || '500m (3-5 años)',
    emergencyContact: emergencyContact || phone,
    medicalNotes,
    paymentProof: paymentProof || '',
    consentGiven: Boolean(consentGiven === 'true' || consentGiven === true || consentGiven === 'on'),
    subject: `Inscripción ${distance || 'General'} - Pupilo: ${kidName}`
  });

  if (result.success) {
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
