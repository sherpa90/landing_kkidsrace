// Interactividad del Panel de Administración CMS para KidsRun

document.addEventListener('DOMContentLoaded', () => {
  // 1. Inicializar iconos
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // 2. Navegación por pestañas
  initAdminTabs();

  // 3. Manejo del formulario de guardado del CMS
  initCmsSaveForm();

  // 4. Selector de color de acento
  initColorThemeSelector();

  // 5. Gestión dinámica de Galería, Testimonios y FAQs
  initDynamicListManagers();

  // 6. Gestión de Inscripciones (Leads)
  initLeadsManager();

  // 7. Cambio de contraseña
  initPasswordChange();
});

// Sistema de Toasts
function showAdminToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✓' : '✕'}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// 2. Pestañas de Navegación del Dashboard
function initAdminTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      tabButtons.forEach(b => {
        b.classList.remove('bg-yellow-500', 'text-white', 'shadow-md');
        b.classList.add('text-gray-400', 'hover:text-white', 'hover:bg-gray-800');
      });
      btn.classList.add('bg-yellow-500', 'text-white', 'shadow-md');
      btn.classList.remove('text-gray-400', 'hover:text-white', 'hover:bg-gray-800');

      tabPanes.forEach(pane => {
        if (pane.id === `tab-${targetTab}`) {
          pane.classList.remove('hidden');
        } else {
          pane.classList.add('hidden');
        }
      });

      if (window.lucide) window.lucide.createIcons();
    });
  });
}

// 4. Selector de color
function initColorThemeSelector() {
  const colorBtns = document.querySelectorAll('.color-choice-btn');
  const hiddenInput = document.getElementById('input-accentColor');

  colorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const color = btn.getAttribute('data-color');
      if (hiddenInput) hiddenInput.value = color;

      colorBtns.forEach(b => b.classList.remove('ring-4', 'ring-white/40', 'scale-110'));
      btn.classList.add('ring-4', 'ring-white/40', 'scale-110');
    });
  });
}

// Helper: obtener token CSRF del meta tag
function getCsrfToken() {
  const meta = document.querySelector('meta[name="csrf-token"]');
  return meta ? meta.getAttribute('content') : '';
}

// Helper: fetch con headers de CSRF y Content-Type
async function cmsFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('X-CSRF-Token', getCsrfToken());
  headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');

  const res = await fetch(url, { ...options, headers });
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(json.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.json = json;
    throw err;
  }
  return json;
}

// 5. Gestores de listas dinámicas
function initDynamicListManagers() {
  // A. Agregar Foto a la Galería
  const addGalleryBtn = document.getElementById('btn-add-gallery');
  if (addGalleryBtn) {
    addGalleryBtn.addEventListener('click', () => {
      const container = document.getElementById('gallery-container');
      const idx = container.querySelectorAll('.gallery-admin-item').length;
      const html = `
        <div class="gallery-admin-item p-4 rounded-xl bg-gray-900/70 border border-gray-800 relative space-y-3">
          <button type="button" class="btn-delete-item absolute top-3 right-3 text-red-400 hover:text-red-300 p-1 bg-red-950/40 rounded-lg" title="Eliminar">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
          <div class="pr-8">
            <label class="block text-[11px] text-gray-400 mb-0.5">Título de la Foto</label>
            <input type="text" name="gallery[${idx}][title]" value="Nueva Foto" class="w-full bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-yellow-400 font-bold">
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[11px] text-gray-400 mb-0.5">Categoría (Tag)</label>
              <input type="text" name="gallery[${idx}][category]" value="Carrera" class="w-full bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-yellow-400">
            </div>
            <div>
              <label class="block text-[11px] text-gray-400 mb-0.5">URL de la Imagen</label>
              <input type="text" name="gallery[${idx}][url]" value="https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80" class="w-full bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-yellow-400">
            </div>
          </div>
          <div>
            <label class="block text-[11px] text-gray-400 mb-0.5">Descripción / Pie de Foto</label>
            <textarea name="gallery[${idx}][caption]" rows="2" class="w-full bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-yellow-400">Descripción de la foto.</textarea>
          </div>
        </div>
      `;
      container.insertAdjacentHTML('beforeend', html);
      if (window.lucide) window.lucide.createIcons();
    });
  }

  // Delegación de eventos para eliminar
  document.addEventListener('click', (e) => {
    const delBtn = e.target.closest('.btn-delete-item');
    if (delBtn) {
      const item = delBtn.closest('.gallery-admin-item, .testimonial-item, .faq-admin-item, .pricing-item');
      if (item && confirm('¿Deseas eliminar este elemento?')) {
        item.remove();
      }
    }
  });
}

// 3. Guardado de todos los datos del CMS
function initCmsSaveForm() {
  const saveBtn = document.getElementById('btn-save-cms');
  if (!saveBtn) return;

  saveBtn.addEventListener('click', async () => {
    const originalText = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML = `
      <span class="inline-block animate-spin mr-2">⟳</span> Guardando...
    `;

    try {
      const payload = collectCmsFormData();
      const json = await cmsFetch('/admin/api/content', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (json.success) {
        showAdminToast('¡Cambios guardados con éxito en la web!', 'success');
      } else {
        showAdminToast(json.error || 'Error al guardar', 'error');
      }
    } catch (err) {
      showAdminToast(err.message || 'Error de conexión al guardar.', 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = originalText;
      if (window.lucide) window.lucide.createIcons();
    }
  });
}

// Recolector de datos del CMS
function collectCmsFormData() {
  const getVal = (id) => {
    const el = document.getElementById(id);
    return el ? el.value : '';
  };

  // 1. Marca
  const brand = {
    name: getVal('input-brandName'),
    tagline: getVal('input-brandTagline'),
    logoText: getVal('input-logoText'),
    logoIcon: getVal('input-logoIcon'),
    logoUrl: getVal('input-logoUrl'),
    themeMode: getVal('input-themeMode') || 'light',
    accentColor: getVal('input-accentColor') || 'green_yellow'
  };

  // 2. Countdown
  const countdown = {
    targetDate: getVal('input-cdTargetDate'),
    eventDateDisplay: getVal('input-cdEventDateDisplay'),
    eventTime: getVal('input-cdEventTime'),
    badge: getVal('input-cdBadge'),
    locationName: getVal('input-cdLocationName'),
    locationCity: getVal('input-cdLocationCity')
  };

  // 3. SEO
  const seo = {
    metaTitle: getVal('input-metaTitle'),
    metaDescription: getVal('input-metaDescription'),
    keywords: getVal('input-keywords'),
    canonicalUrl: getVal('input-canonicalUrl'),
    ogImage: getVal('input-ogImage'),
    ogType: 'website',
    twitterCard: 'summary_large_image',
    enableRobotsIndex: true
  };

  // 4. Hero
  const hero = {
    badgeText: getVal('input-badgeText'),
    badgeLink: getVal('input-badgeLink'),
    headlinePrefix: getVal('input-headlinePrefix'),
    headlineGradient: getVal('input-headlineGradient'),
    subheadline: getVal('input-subheadline'),
    primaryCtaText: getVal('input-primaryCtaText'),
    primaryCtaLink: getVal('input-primaryCtaLink'),
    secondaryCtaText: getVal('input-secondaryCtaText'),
    secondaryCtaLink: getVal('input-secondaryCtaLink'),
    statsNotice: getVal('input-statsNotice')
  };

  // 5. Galería
  const gallery = [];
  document.querySelectorAll('.gallery-admin-item').forEach((item, idx) => {
    gallery.push({
      id: 'gal-' + (idx + 1),
      title: item.querySelector('input[name*="[title]"]')?.value || '',
      category: item.querySelector('input[name*="[category]"]')?.value || 'KidsRun',
      url: item.querySelector('input[name*="[url]"]')?.value || '',
      caption: item.querySelector('textarea[name*="[caption]"]')?.value || ''
    });
  });

  // 6. Categorías / Circuitos
  const categories = [];
  document.querySelectorAll('.category-item').forEach((item, idx) => {
    categories.push({
      id: item.querySelector('input[name*="[id]"]')?.value || ('cat-' + idx),
      distance: item.querySelector('input[name*="[distance]"]')?.value || '',
      badge: item.querySelector('input[name*="[badge]"]')?.value || '',
      title: item.querySelector('input[name*="[title]"]')?.value || '',
      description: item.querySelector('textarea[name*="[description]"]')?.value || '',
      icon: idx === 0 ? 'smile' : (idx === 1 ? 'zap' : (idx === 2 ? 'trophy' : 'flame'))
    });
  });

  // 7. Kits / Precios
  const plans = [];
  document.querySelectorAll('.pricing-item').forEach(item => {
    const rawFeatures = item.querySelector('textarea[name*="[features]"]')?.value || '';
    const featuresList = rawFeatures.split('\n').map(f => f.trim()).filter(Boolean);

    plans.push({
      id: item.querySelector('input[name*="[id]"]')?.value || 'kit',
      name: item.querySelector('input[name*="[name]"]')?.value || '',
      badge: item.querySelector('input[name*="[badge]"]')?.value || '',
      priceMonthly: parseFloat(item.querySelector('input[name*="[priceMonthly]"]')?.value || '0'),
      priceYearly: parseFloat(item.querySelector('input[name*="[priceYearly]"]')?.value || '0'),
      description: item.querySelector('textarea[name*="[description]"]')?.value || '',
      features: featuresList,
      isPopular: item.querySelector('input[name*="[isPopular]"]')?.checked || false,
      ctaText: item.querySelector('input[name*="[ctaText]"]')?.value || 'Inscribir',
      ctaLink: item.querySelector('input[name*="[ctaLink]"]')?.value || '#contact'
    });
  });

  // 8. Testimonios
  const testimonials = [];
  document.querySelectorAll('.testimonial-item').forEach(item => {
    testimonials.push({
      name: item.querySelector('input[name*="[name]"]')?.value || '',
      role: item.querySelector('input[name*="[role]"]')?.value || '',
      avatar: item.querySelector('input[name*="[avatar]"]')?.value || '',
      stars: parseInt(item.querySelector('input[name*="[stars]"]')?.value || '5', 10),
      quote: item.querySelector('textarea[name*="[quote]"]')?.value || ''
    });
  });

  // 9. FAQs
  const faqs = [];
  document.querySelectorAll('.faq-admin-item').forEach(item => {
    faqs.push({
      question: item.querySelector('input[name*="[question]"]')?.value || '',
      answer: item.querySelector('textarea[name*="[answer]"]')?.value || ''
    });
  });

  // 10. Footer Social Links (etiquetas corregidas)
  const footer = {
    socialLinks: {
      instagram: getVal('input-socialInstagram'),
      facebook: getVal('input-socialFacebook'),
      twitter: getVal('input-socialTwitter'),
      youtube: getVal('input-socialYoutube')
    }
  };

  return {
    brand,
    countdown,
    seo,
    hero,
    gallery,
    categories,
    pricing: { plans },
    testimonials,
    faqs,
    footer
  };
}

// 6. Gestión de Inscripciones (Leads)
function initLeadsManager() {
  document.querySelectorAll('.btn-delete-lead').forEach(btn => {
    btn.addEventListener('click', async () => {
      const leadId = btn.getAttribute('data-lead-id');
      if (!confirm('¿Deseas eliminar este registro de inscripción?')) return;

try {
        const json = await cmsFetch(`/admin/api/leads/${leadId}`, {
          method: 'DELETE'
        });
        if (json.success) {
          showAdminToast('Inscripción eliminada', 'success');
          const row = document.getElementById(`lead-row-${leadId}`);
          if (row) row.remove();
        } else {
          showAdminToast(json.error || 'Error al eliminar', 'error');
        }
      } catch (err) {
        showAdminToast(err.message || 'Error de conexión', 'error');
      }
    });
  });
}

// 7. Cambio de contraseña
function initPasswordChange() {
  const form = document.getElementById('form-change-password');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById('input-currentPassword').value;
    const newPassword = document.getElementById('input-newPassword').value;

    try {
      const json = await cmsFetch('/admin/api/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword })
      });

      if (json.success) {
        showAdminToast('Contraseña actualizada con éxito', 'success');
        form.reset();
      } else {
        showAdminToast(json.error || 'No se pudo cambiar la contraseña', 'error');
      }
    } catch (err) {
      showAdminToast(err.message || 'Error de conexión', 'error');
    }
  });
}
