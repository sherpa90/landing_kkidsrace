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

  res.render('index', {
    content,
    theme,
    themeMode,
    siteUrl,
    jsonLd: JSON.stringify(jsonLd)
  });
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

// Endpoint para Inscripciones y Contacto Familiar (PostgreSQL + Local Fallback)
router.post('/api/contact', async (req, res) => {
  const { name, email, phone, kidName, kidAge, distance, subject, message } = req.body;

  if (!name || !email) {
    return res.status(400).json({
      success: false,
      error: 'Por favor ingresa tu Nombre (Padre/Tutor) y Correo Electrónico.'
    });
  }

  // Validación básica de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'Por favor introduce un correo electrónico válido.'
    });
  }

  const result = await db.saveInscription({
    name,
    email,
    phone,
    kidName,
    kidAge,
    distance,
    subject: subject || (distance ? `Inscripción ${distance} - Niño: ${kidName || 'N/A'}` : 'Consulta KidsRun'),
    message: message || `Pre-inscripción realizada para el niño/a ${kidName || 'No indicado'} (${kidAge ? kidAge + ' años' : ''}) en distancia ${distance || 'General'}.`
  });

  if (result.success) {
    return res.json({
      success: true,
      message: '¡Inscripción registrada con éxito en la base de datos! Te contactaremos con los detalles del kit.',
      source: result.source
    });
  } else {
    return res.status(500).json({
      success: false,
      error: 'Ocurrió un error al procesar tu solicitud. Inténtalo nuevamente más tarde.'
    });
  }
});

module.exports = router;
