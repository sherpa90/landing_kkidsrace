const fs = require('fs');
const path = './data/site-content.json';

const content = JSON.parse(fs.readFileSync(path, 'utf8'));

// SEO
if (content.seo) {
  content.seo.metaDescription = content.seo.metaDescription.replace(', medalla finisher garantizada para todos, ', ' y ');
}

// Hero
if (content.hero) {
  content.hero.subheadline = content.hero.subheadline.replace(' y medalla finisher garantizada para todos', '');
  content.hero.statsNotice = content.hero.statsNotice.replace('🏅 Medalla finisher de metal garantizada para todos los niños', '🏆 Premiación con medallas para los primeros lugares');
}

// Metrics
if (content.metrics) {
  content.metrics.forEach(m => {
    if (m.label === 'Medallas Finisher Garantizadas') {
      m.label = 'Premiación Primeros Lugares';
    }
  });
}

// Gallery
if (content.gallery && content.gallery.items) {
  content.gallery.items.forEach(g => {
    if (g.title === 'Medallas de Metal para Todos') {
      g.title = 'Medallas para los Primeros Lugares';
      g.caption = 'Los primeros lugares reciben su medalla grabada.';
    }
  });
}

// Pricing (Kits)
if (content.pricing) {
  content.pricing.subtitle = content.pricing.subtitle.replace(' y medalla finisher de metal garantizada', '');
  if (content.pricing.plans) {
    content.pricing.plans.forEach(p => {
      if (p.features) {
        p.features = p.features.map(f => {
          if (f.includes('Medalla finisher de metal oficial garantizada')) return 'Opción a medalla para primeros lugares';
          if (f.includes('Medalla finisher garantizada al cruzar la meta')) return 'Opción a medalla para primeros lugares';
          return f;
        });
      }
    });
  }
}

// Testimonials
if (content.testimonials) {
  content.testimonials.forEach(t => {
    if (t.quote.includes('medalla que durmió con ella')) {
      t.quote = t.quote.replace('medalla que durmió con ella', 'participación que durmió con la polera');
    }
  });
}

// FAQs
if (content.faq) {
  content.faq.forEach(f => {
    if (f.question.includes('¿Todos los participantes reciben medalla?')) {
      f.question = '¿Quiénes reciben medalla?';
      f.answer = 'Los primeros lugares de cada categoría recibirán una medalla de metal oficial durante la premiación general a las 13:10 horas.';
    }
  });
}
if (content.faqs) {
  content.faqs.forEach(f => {
    if (f.question.includes('¿Todos los participantes reciben medalla?')) {
      f.question = '¿Quiénes reciben medalla?';
      f.answer = 'Los primeros lugares de cada categoría recibirán una medalla de metal oficial durante la premiación general a las 13:10 horas.';
    }
  });
}

// Construction
if (content.construction) {
  if (content.construction.subtitle) {
    content.construction.subtitle = content.construction.subtitle.replace(', medallas y diversión', ' y mucha diversión');
  }
}

// Bases
if (content.bases) {
  if (content.bases.closingBannerText) {
    content.bases.closingBannerText = content.bases.closingBannerText.replace(', medalla oficial', '');
  }
}

// Reg form
if (content.registrationForm) {
  if (content.registrationForm.badge1Text === 'Medalla Finisher') {
    content.registrationForm.badge1Text = 'Polera Oficial';
  }
}

fs.writeFileSync(path, JSON.stringify(content, null, 2), 'utf8');
console.log('JSON content updated successfully.');
