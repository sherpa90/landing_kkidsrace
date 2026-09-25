// Interactividad del Panel de Administración CMS para KidsRun

function initAllAdminModules() {
  const modules = [
    ['Iconos Lucide', () => { if (window.lucide) window.lucide.createIcons(); }],
    ['Pestañas', initAdminTabs],
    ['Guardado CMS', initCmsSaveForm],
    ['Tema Color', initColorThemeSelector],
    ['Listas Dinámicas', initDynamicListManagers],
    ['Inscripciones Leads', initLeadsManager],
    ['Cambio Password', initPasswordChange],
    ['Imágenes', initImageUploadHandlers],
    ['Modo Construcción', initConstructionManager],
    ['Corridas', initRacesManager],
    ['Auspiciadores', initSponsorsManager],
    ['Secciones', initSectionsManager],
    ['Escáner RUT', initRutScanner],
    ['Usuarios', initUsersManager],
    ['Cronograma', initScheduleManager],
    ['Circuitos', initCircuitsManager],
    ['Preguntas Frecuentes', initFaqsManager],
    ['Hero Preview', initHeroLivePreview],
    ['Pestaña Navegador', initBrowserTabLivePreview]
  ];

  modules.forEach(([name, fn]) => {
    try {
      fn();
    } catch (err) {
      console.warn(`[CMS Init Error en ${name}]:`, err);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAllAdminModules);
} else {
  initAllAdminModules();
}

// Sistema de Notificaciones Toast
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

  // Elementos para el modo pantalla completa de participantes
  const sidebarNav = document.getElementById('sidebar-nav');
  const showSidebarBtn = document.getElementById('btn-show-sidebar-leads');
  const layoutWrapper = document.getElementById('main-layout-wrapper');

  // Tabs que deben ocultar el sidebar para maximizar el espacio
  const FULLWIDTH_TABS = new Set(['leads']);

  function hideSidebarForFullWidth() {
    if (!sidebarNav) return;
    // Ocultar sidebar con animación (solo en escritorio md+)
    sidebarNav.style.transition = 'opacity 200ms ease, transform 200ms ease, width 250ms ease, min-width 250ms ease, padding 250ms ease';
    sidebarNav.style.overflow = 'hidden';
    sidebarNav.style.opacity = '0';
    sidebarNav.style.transform = 'translateX(-12px)';
    sidebarNav.style.width = '0';
    sidebarNav.style.minWidth = '0';
    sidebarNav.style.padding = '0';
    // Quitar el gap del contenedor
    if (layoutWrapper) layoutWrapper.style.gap = '0';
    // Mostrar botón flotante en escritorio
    if (showSidebarBtn && window.innerWidth >= 768) {
      showSidebarBtn.classList.remove('hidden');
      showSidebarBtn.classList.add('flex');
    }
  }

  function showSidebarFromFullWidth() {
    if (!sidebarNav) return;
    sidebarNav.style.transition = 'opacity 200ms ease, transform 200ms ease, width 250ms ease, min-width 250ms ease, padding 250ms ease';
    sidebarNav.style.opacity = '1';
    sidebarNav.style.transform = '';
    sidebarNav.style.width = '';
    sidebarNav.style.minWidth = '';
    sidebarNav.style.padding = '';
    sidebarNav.style.overflow = '';
    if (layoutWrapper) layoutWrapper.style.gap = '';
    // Ocultar botón flotante
    if (showSidebarBtn) {
      showSidebarBtn.classList.add('hidden');
      showSidebarBtn.classList.remove('flex');
    }
  }

  // Botón flotante para restaurar el sidebar manualmente
  if (showSidebarBtn) {
    showSidebarBtn.addEventListener('click', () => {
      showSidebarFromFullWidth();
    });
  }

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      if (!targetTab) return;

      tabButtons.forEach(b => {
        b.classList.remove('bg-blue-600', 'text-white', 'shadow-md');
        b.classList.add('text-gray-400', 'hover:text-white', 'hover:bg-gray-900');
      });
      btn.classList.add('bg-blue-600', 'text-white', 'shadow-md');
      btn.classList.remove('text-gray-400', 'hover:text-white', 'hover:bg-gray-900');

      tabPanes.forEach(pane => {
        if (pane.id === `tab-${targetTab}`) {
          pane.classList.remove('hidden');
          pane.style.display = 'block';
        } else {
          pane.classList.add('hidden');
          pane.style.display = 'none';
        }
      });

      // Si se abre la pestaña de usuarios, refrescar la lista de usuarios inmediatamente
      if (targetTab === 'users' && typeof window._loadUsersList === 'function') {
        window._loadUsersList();
      }

      // Controlar visibilidad del sidebar según el tab activo
      if (FULLWIDTH_TABS.has(targetTab)) {
        hideSidebarForFullWidth();
      } else {
        showSidebarFromFullWidth();
      }

      // Asegurar que la pantalla suba al inicio para ver de inmediato todo el contenido
      try {
        window.scrollTo({ top: 0, behavior: 'auto' });
      } catch (_) {}

      // En móviles, cerrar el drawer lateral al pinchar cualquier tab
      if (window.innerWidth < 768) {
        const sidebarBackdrop = document.getElementById('sidebar-backdrop');
        if (sidebarNav) sidebarNav.classList.add('-translate-x-full');
        if (sidebarBackdrop) sidebarBackdrop.classList.add('hidden');
        document.body.style.overflow = '';
      }

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
      const uniqueId = 'gal-new-' + Date.now();
      const html = `
        <div class="gallery-admin-item p-4 rounded-3xl bg-gray-900/70 border border-gray-800 relative space-y-3">
          <button type="button" class="btn-delete-item absolute top-3 right-3 text-red-400 hover:text-red-300 p-1 bg-red-950/40 rounded-xl" title="Eliminar">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
          <div class="flex items-center gap-3">
            <img src="https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80" alt="" class="w-16 h-16 rounded-2xl object-cover border border-gray-800 bg-gray-950 flex-shrink-0">
            <div class="flex-1 min-w-0 pr-8">
              <label class="block text-[11px] text-gray-400 mb-0.5">Título de la Foto</label>
              <input type="text" name="gallery[${idx}][title]" value="Nueva Foto" class="w-full bg-gray-950 border border-gray-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-400 font-bold">
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label class="block text-[11px] text-gray-400 mb-0.5">Categoría (Tag)</label>
              <input type="text" name="gallery[${idx}][category]" value="Carrera" class="w-full bg-gray-950 border border-gray-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-400">
            </div>
            <div>
              <label class="block text-[11px] text-gray-400 mb-0.5">Foto (URL o Subir)</label>
              <div class="flex gap-1.5">
                <input type="text" name="gallery[${idx}][url]" value="https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80" class="gallery-url-input w-full bg-gray-950 border border-gray-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-400" id="${uniqueId}">
                <label class="cursor-pointer bg-blue-600/80 hover:bg-blue-600 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1 whitespace-nowrap transition-all" title="Subir y optimizar foto">
                  <i data-lucide="upload" class="w-3.5 h-3.5"></i>
                  <span>Subir</span>
                  <input type="file" class="hidden file-uploader-input" data-target-input="#${uniqueId}" data-preview-img="img" data-upload-type="standard" accept="image/*">
                </label>
              </div>
            </div>
          </div>
          <div>
            <label class="block text-[11px] text-gray-400 mb-0.5">Descripción / Pie de Foto</label>
            <textarea name="gallery[${idx}][caption]" rows="2" class="w-full bg-gray-950 border border-gray-800 rounded-xl px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-emerald-400">Descripción de la foto.</textarea>
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
      const item = delBtn.closest('.gallery-admin-item, .testimonial-item, .faq-admin-item, .pricing-item, .metric-admin-item');
      if (item && confirm('¿Deseas eliminar este elemento?')) {
        item.remove();
      }
    }
  });

  // M. Agregar y Gestionar Métricas de Impacto
  const addMetricBtn = document.getElementById('btn-add-metric');
  if (addMetricBtn) {
    addMetricBtn.addEventListener('click', () => {
      const container = document.getElementById('metrics-container');
      if (!container) return;
      const idx = container.querySelectorAll('.metric-admin-item').length + 1;
      const html = `
        <div class="metric-admin-item p-4 rounded-3xl bg-gray-900/80 border border-gray-800 relative space-y-3">
          <div class="flex items-center justify-between pb-2 border-b border-gray-800/80">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 metric-icon-preview">
                <i data-lucide="award" class="w-4 h-4"></i>
              </div>
              <span class="text-xs font-bold text-gray-300">Métrica #${idx}</span>
            </div>
            <button type="button" class="btn-delete-item text-red-400 hover:text-red-300 p-1.5 bg-red-950/40 rounded-xl transition-all" title="Eliminar Métrica">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div class="sm:col-span-4">
              <label class="block text-[11px] font-semibold text-gray-400 mb-1">Cifra / Valor</label>
              <input type="text" value="+100" placeholder="+2,500" class="metric-value-input w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white font-black tracking-wide focus:outline-none focus:border-amber-400">
            </div>
            <div class="sm:col-span-5">
              <label class="block text-[11px] font-semibold text-gray-400 mb-1">Etiqueta / Descripción</label>
              <input type="text" value="Nueva Cifra Clave" placeholder="Niños y Familias Corriendo" class="metric-label-input w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400">
            </div>
            <div class="sm:col-span-3">
              <label class="block text-[11px] font-semibold text-gray-400 mb-1">Ícono</label>
              <select class="metric-icon-select w-full bg-gray-950 border border-gray-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400">
                <option value="users">users (Familias / Niños)</option>
                <option value="award" selected>award (Medalla)</option>
                <option value="flag">flag (Circuitos)</option>
                <option value="shield-check">shield-check (Seguridad)</option>
                <option value="trophy">trophy (Trofeo)</option>
                <option value="heart">heart (Corazón / Salud)</option>
                <option value="smile">smile (Alegría)</option>
                <option value="sparkles">sparkles (Magia)</option>
                <option value="zap">zap (Energía)</option>
                <option value="star">star (Estrella)</option>
                <option value="clock">clock (Tiempo)</option>
                <option value="map-pin">map-pin (Ubicación)</option>
                <option value="activity">activity (Deporte)</option>
              </select>
            </div>
          </div>
        </div>
      `;
      container.insertAdjacentHTML('beforeend', html);
      if (window.lucide) window.lucide.createIcons();
    });
  }

  // Cambio de ícono en tiempo real para métricas
  document.addEventListener('change', (e) => {
    if (e.target.matches('.metric-icon-select')) {
      const parent = e.target.closest('.metric-admin-item');
      const preview = parent?.querySelector('.metric-icon-preview');
      if (preview) {
        preview.innerHTML = `<i data-lucide="${e.target.value}" class="w-4 h-4"></i>`;
        if (window.lucide) window.lucide.createIcons();
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
    faviconUrl: getVal('input-faviconUrl'),
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

  // 3. SEO & Título de la Pestaña
  const tabTitle = getVal('input-tabTitle') || getVal('input-metaTitle');
  const seo = {
    metaTitle: tabTitle,
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

  // 4b. Métricas de Impacto
  const metrics = [];
  document.querySelectorAll('.metric-admin-item').forEach(item => {
    const value = item.querySelector('.metric-value-input')?.value.trim() || '';
    const label = item.querySelector('.metric-label-input')?.value.trim() || '';
    const icon = item.querySelector('.metric-icon-select')?.value || 'award';
    if (value || label) {
      metrics.push({ value, label, icon });
    }
  });

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

  // 6. Categorías / Circuitos (usa el gestor de circuitos si está disponible)
  const categories = typeof window._collectCircuits === 'function'
    ? window._collectCircuits()
    : [];

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
    const question = item.querySelector('.faq-question-input')?.value.trim() || item.querySelector('input[name*="[question]"]')?.value.trim() || '';
    const answer = item.querySelector('.faq-answer-input')?.value.trim() || item.querySelector('textarea[name*="[answer]"]')?.value.trim() || '';
    if (question || answer) {
      faqs.push({ question, answer });
    }
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

  // 11. Auspiciadores
  const sponsorsList = [];
  document.querySelectorAll('.sponsor-admin-item').forEach((item, idx) => {
    sponsorsList.push({
      id: 'sp-' + (idx + 1),
      name: item.querySelector('input[name*="[name]"]')?.value || '',
      tier: item.querySelector('select[name*="[tier]"]')?.value || 'bronze',
      website: item.querySelector('input[name*="[website]"]')?.value || '',
      logoUrl: item.querySelector('.sponsor-logo-url-input')?.value || ''
    });
  });
  const sponsors = {
    badge: getVal('input-sponsorsBadge'),
    title: getVal('input-sponsorsTitle'),
    description: getVal('input-sponsorsDescription'),
    list: sponsorsList
  };

  // 12. Lugar del evento
  const venue = {
    badge: getVal('input-venueBadge'),
    title: getVal('input-venueTitle'),
    description: getVal('input-venueDescription'),
    name: getVal('input-venueName'),
    address: getVal('input-venueAddress'),
    lat: parseFloat(getVal('input-venueLat') || '-33.3975'),
    lng: parseFloat(getVal('input-venueLng') || '-70.5787'),
    zoom: parseInt(getVal('input-venueZoom') || '15', 10),
    doorsOpen: getVal('input-venueDoorsOpen'),
    parking: getVal('input-venueParking'),
    transit: getVal('input-venueTransit')
  };

  // 13. Secciones (orden y visibilidad)
  const sectionsOrder = [];
  const sectionsVisibility = {};
  document.querySelectorAll('.section-sortable-item').forEach(item => {
    const sid = item.getAttribute('data-section-id');
    if (sid) {
      sectionsOrder.push(sid);
      const toggle = item.querySelector('.section-visibility-toggle');
      sectionsVisibility[sid] = toggle ? toggle.checked : true;
    }
  });
  const sections = { order: sectionsOrder, visibility: sectionsVisibility };

  return {
    brand,
    countdown,
    seo,
    hero,
    metrics,
    gallery,
    categories,
    pricing: { plans },
    testimonials,
    faqs,
    faq: faqs,
    footer,
    sponsors,
    venue,
    sections,
    construction: {
      enabled: document.getElementById('input-construction-enabled')?.checked || false,
      badge: getVal('input-construction-badge'),
      expectedDate: getVal('input-construction-expectedDate'),
      title: getVal('input-construction-title'),
      subtitle: getVal('input-construction-subtitle'),
      targetDate: getVal('input-construction-targetDate'),
      contactWhatsapp: getVal('input-construction-whatsapp'),
      showCountdown: document.getElementById('input-construction-showCountdown')?.checked ?? true,
      notifyForm: document.getElementById('input-construction-notifyForm')?.checked ?? true
    },
    contact: {
      forwardEmail: getVal('input-contactForwardEmail'),
      email: getVal('input-contactEmail'),
      phone: getVal('input-contactPhone'),
      location: getVal('input-contactLocation'),
      resendApiKey: getVal('input-contactResendApiKey'),
      resendFromEmail: getVal('input-contactResendFromEmail')
    },
    // 14. Cronograma de actividades y cabecera
    schedule: Array.from(document.querySelectorAll('.schedule-admin-item')).map(item => ({
      time: item.querySelector('.schedule-time-input')?.value.trim() || '',
      title: item.querySelector('.schedule-title-input')?.value.trim() || '',
      desc: item.querySelector('.schedule-desc-input')?.value.trim() || ''
    })).filter(it => it.time || it.title || it.desc),
    scheduleSection: {
      badge: getVal('input-scheduleBadge') || 'HORARIOS Y ACTIVIDADES',
      title: getVal('input-scheduleTitle') || 'Cronograma de la Gran Jornada',
      subtitle: getVal('input-scheduleSubtitle') || 'Ven temprano para disfrutar de todas las sorpresas preparadas para la familia.'
    }
  };
}

// 6. Gestión de Inscripciones y Base de Datos de Participantes
function initLeadsManager() {
  // Filtro de Búsqueda en tiempo real
  const searchInput = document.getElementById('filter-search-input');
  const circuitSelect = document.getElementById('filter-circuit-select');
  const rows = document.querySelectorAll('.participant-row');
  const noDesktopRow = document.getElementById('no-participants-row');
  const noSearchResults = document.getElementById('no-search-results');
  const countBadge = document.getElementById('participants-count-badge');

  function applyFilters() {
    const rawTerm = (searchInput?.value || '').toLowerCase().trim();
    // Normalizar quitando puntos y guiones para que buscar "12345678-9" o "12.345.678-9" o "123456789" funcione igual
    const cleanTerm = rawTerm.replace(/[\.\-]/g, '');
    const circuit = circuitSelect?.value || 'all';
    let visibleCount = 0;

    rows.forEach(row => {
      const searchData = (row.getAttribute('data-search') || '').toLowerCase();
      const cleanSearchData = searchData.replace(/[\.\-]/g, '');
      const distanceData = (row.getAttribute('data-distance') || '').toLowerCase();

      const matchesSearch = !rawTerm || searchData.includes(rawTerm) || cleanSearchData.includes(cleanTerm);
      const matchesCircuit = circuit === 'all' || distanceData.includes(circuit.toLowerCase());

      if (matchesSearch && matchesCircuit) {
        row.style.display = '';
        visibleCount++;
      } else {
        row.style.display = 'none';
      }
    });

    if (countBadge) countBadge.textContent = visibleCount;
    if (noSearchResults) {
      noSearchResults.style.display = (visibleCount === 0 && rows.length > 0) ? 'block' : 'none';
    }
    if (noDesktopRow) {
      noDesktopRow.style.display = (visibleCount === 0 && rows.length > 0) ? '' : 'none';
    }
  }

  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (circuitSelect) circuitSelect.addEventListener('change', applyFilters);

  // Modal Lightbox para Comprobante de Pago
  const lightboxModal = document.getElementById('proof-lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxTitle = document.getElementById('lightbox-pupil-title');
  const lightboxSub = document.getElementById('lightbox-tutor-sub');
  const lightboxDownload = document.getElementById('lightbox-download-link');
  const closeLightboxBtn = document.getElementById('btn-close-lightbox');

  function openLightbox(url, pupil, tutor) {
    if (!lightboxModal || !lightboxImg) return;
    lightboxImg.src = url;
    if (lightboxTitle) lightboxTitle.textContent = `Comprobante de Pupilo: ${pupil}`;
    if (lightboxSub) lightboxSub.textContent = `Registrado por Apoderado: ${tutor}`;
    if (lightboxDownload) lightboxDownload.href = url;
    lightboxModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightboxModal) return;
    lightboxModal.classList.add('hidden');
    if (lightboxImg) lightboxImg.src = '';
    document.body.style.overflow = '';
  }

  document.addEventListener('click', (e) => {
    const proofBtn = e.target.closest('.btn-view-proof');
    if (proofBtn) {
      const url = proofBtn.getAttribute('data-proof-url');
      const pupil = proofBtn.getAttribute('data-pupil') || 'Pupilo';
      const tutor = proofBtn.getAttribute('data-tutor') || 'Apoderado';
      if (url) openLightbox(url, pupil, tutor);
    }
  });

  if (closeLightboxBtn) closeLightboxBtn.addEventListener('click', closeLightbox);
  if (lightboxModal) {
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal) closeLightbox();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });

  // Eliminación de participante (solo Administrador)
  document.querySelectorAll('.btn-delete-lead').forEach(btn => {
    btn.addEventListener('click', async () => {
      const leadId = btn.getAttribute('data-lead-id');
      if (!confirm('¿Deseas eliminar este registro de inscripción de la base de datos?')) return;

      try {
        const json = await cmsFetch(`/admin/api/leads/${leadId}`, {
          method: 'DELETE'
        });
        if (json.success) {
          showAdminToast('Inscripción eliminada correctamente', 'success');
          document.querySelectorAll(`[id="lead-row-${leadId}"]`).forEach(el => el.remove());
          btn.closest('.participant-row')?.remove();
          applyFilters();
        } else {
          showAdminToast(json.error || 'Error al eliminar registro', 'error');
        }
      } catch (err) {
        showAdminToast(err.message || 'Error de conexión', 'error');
      }
    });
  });

  // Menú Móvil (Drawer Toggle)
  const toggleMobileBtn = document.getElementById('btn-toggle-mobile-menu');
  const closeMobileBtn = document.getElementById('btn-close-mobile-menu');
  const sidebarNav = document.getElementById('sidebar-nav');
  const sidebarBackdrop = document.getElementById('sidebar-backdrop');

  function openMobileSidebar() {
    if (sidebarNav) sidebarNav.classList.remove('-translate-x-full');
    if (sidebarBackdrop) sidebarBackdrop.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileSidebar() {
    if (sidebarNav) sidebarNav.classList.add('-translate-x-full');
    if (sidebarBackdrop) sidebarBackdrop.classList.add('hidden');
    document.body.style.overflow = '';
  }

  if (toggleMobileBtn) toggleMobileBtn.addEventListener('click', openMobileSidebar);
  if (closeMobileBtn) closeMobileBtn.addEventListener('click', closeMobileSidebar);
  if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', closeMobileSidebar);

  // Cerrar el drawer móvil al pinchar cualquier tab
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (window.innerWidth < 768) {
        closeMobileSidebar();
      }
    });
  });
}

// 8. Gestión y Programación de Corridas (Administrador)
// 8. Gestión y Programación de Corridas (Administrador)
function initRacesManager() {
  const openBtn = document.getElementById('btn-open-new-race');
  const cancelBtn = document.getElementById('btn-cancel-race-form');
  const cancelBtn2 = document.getElementById('btn-cancel-race-form-2');
  const panel = document.getElementById('race-form-panel');
  const submitBtn = document.getElementById('btn-submit-race');
  const submitText = document.getElementById('btn-submit-race-text');
  const formTitle = document.getElementById('race-form-title');

  const editIdInput = document.getElementById('input-editRaceId');
  const nameInput = document.getElementById('input-raceName');
  const dateInput = document.getElementById('input-raceDate');
  const timeInput = document.getElementById('input-raceTime');
  const locInput = document.getElementById('input-raceLocation');
  const cityInput = document.getElementById('input-raceCity');
  const maxInput = document.getElementById('input-raceMax');
  const statusSelect = document.getElementById('input-raceStatus');

  function resetRaceForm() {
    if (editIdInput) editIdInput.value = '';
    if (nameInput) nameInput.value = '';
    if (dateInput) dateInput.value = '';
    if (timeInput) timeInput.value = '09:00 AM';
    if (locInput) locInput.value = 'Parque Bicentenario • Circuito Cerrado';
    if (cityInput) cityInput.value = 'Vitacura, Santiago';
    if (maxInput) maxInput.value = '500';
    if (statusSelect) statusSelect.value = 'active';
    if (formTitle) {
      formTitle.innerHTML = `<i data-lucide="flag" class="w-4 h-4 text-blue-400"></i><span>Crear Nueva Edición de Carrera</span>`;
    }
    if (submitText) submitText.textContent = 'Guardar Corrida';
    if (window.lucide) window.lucide.createIcons();
  }

  function openCreateForm() {
    if (!panel) return;
    resetRaceForm();
    panel.classList.remove('hidden');
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (nameInput) nameInput.focus();
  }

  if (openBtn) openBtn.addEventListener('click', openCreateForm);

  const closeForm = () => {
    if (panel) panel.classList.add('hidden');
    resetRaceForm();
  };
  if (cancelBtn) cancelBtn.addEventListener('click', closeForm);
  if (cancelBtn2) cancelBtn2.addEventListener('click', closeForm);

  // Guardar (Crear o Actualizar) Corrida
  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      const id = editIdInput ? editIdInput.value : '';
      const name = nameInput ? nameInput.value.trim() : '';
      const date = dateInput ? dateInput.value : '';
      const time = timeInput ? timeInput.value.trim() : '09:00 AM';
      const location = locInput ? locInput.value.trim() : '';
      const city = cityInput ? cityInput.value.trim() : '';
      const maxParticipants = maxInput ? parseInt(maxInput.value, 10) || 500 : 500;
      const status = statusSelect ? statusSelect.value : 'active';

      if (!name || !date) {
        showAdminToast('Por favor completa el nombre y la fecha de la corrida', 'error');
        return;
      }

      submitBtn.disabled = true;
      const origHtml = submitBtn.innerHTML;
      submitBtn.innerHTML = '<span class="inline-block animate-spin mr-1.5">⟳</span> Guardando...';

      try {
        const json = await cmsFetch('/admin/api/races', {
          method: 'POST',
          body: JSON.stringify({
            id: id || undefined,
            name,
            date,
            time,
            location,
            city,
            status,
            maxParticipants
          })
        });

        if (json.success) {
          showAdminToast(json.message || 'Corrida guardada exitosamente', 'success');
          setTimeout(() => window.location.reload(), 800);
        } else {
          showAdminToast(json.error || 'No se pudo guardar la corrida', 'error');
        }
      } catch (err) {
        showAdminToast(err.message || 'Error de conexión al guardar corrida', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origHtml;
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }

  // Delegación de eventos para las tarjetas de corridas
  const racesContainer = document.getElementById('races-list-container');
  if (racesContainer) {
    racesContainer.addEventListener('click', async (e) => {
      // 1. EDITAR CORRIDA
      const editBtn = e.target.closest('.btn-edit-race');
      if (editBtn) {
        const id = editBtn.getAttribute('data-id');
        const name = editBtn.getAttribute('data-name');
        const rawDate = editBtn.getAttribute('data-date');
        const time = editBtn.getAttribute('data-time');
        const location = editBtn.getAttribute('data-location');
        const city = editBtn.getAttribute('data-city');
        const max = editBtn.getAttribute('data-max');
        const status = editBtn.getAttribute('data-status');

        if (editIdInput) editIdInput.value = id;
        if (nameInput) nameInput.value = name || '';

        // Formatear fecha para datetime-local (YYYY-MM-DDTHH:mm)
        if (dateInput && rawDate) {
          try {
            const d = new Date(rawDate);
            if (!isNaN(d.getTime())) {
              const pad = n => String(n).padStart(2, '0');
              const localIso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
              dateInput.value = localIso;
            } else {
              dateInput.value = rawDate.slice(0, 16);
            }
          } catch (err) {
            dateInput.value = rawDate.slice(0, 16);
          }
        }
        if (timeInput) timeInput.value = time || '09:00 AM';
        if (locInput) locInput.value = location || '';
        if (cityInput) cityInput.value = city || '';
        if (maxInput) maxInput.value = max || 500;
        if (statusSelect) statusSelect.value = status || 'active';

        if (formTitle) {
          formTitle.innerHTML = `<i data-lucide="edit-3" class="w-4 h-4 text-emerald-400"></i><span>Editar Corrida: ${name}</span>`;
        }
        if (submitText) submitText.textContent = 'Actualizar Datos de la Corrida';
        if (window.lucide) window.lucide.createIcons();

        if (panel) {
          panel.classList.remove('hidden');
          panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        if (nameInput) nameInput.focus();
        return;
      }

      // 2. PAUSAR / REANUDAR / ACTIVAR / DESACTIVAR CORRIDA
      const toggleBtn = e.target.closest('.btn-toggle-race-status');
      if (toggleBtn) {
        const raceId = toggleBtn.getAttribute('data-race-id');
        const newStatus = toggleBtn.getAttribute('data-status');

        const actionLabels = {
          active: 'activar como oficial en la web',
          paused: 'pausar temporalmente las inscripciones',
          inactive: 'desactivar de la portada'
        };

        if (!confirm(`¿Estás seguro de ${actionLabels[newStatus] || newStatus} esta corrida?`)) return;

        try {
          const json = await cmsFetch(`/admin/api/races/${raceId}/status`, {
            method: 'POST',
            body: JSON.stringify({ status: newStatus })
          });

          if (json.success) {
            showAdminToast(json.message, 'success');
            setTimeout(() => window.location.reload(), 700);
          } else {
            showAdminToast(json.error || 'No se pudo actualizar el estado de la corrida', 'error');
          }
        } catch (err) {
          showAdminToast(err.message || 'Error de conexión', 'error');
        }
        return;
      }

      // 3. AGREGAR CUPOS RÁPIDO (+50, +100)
      const quickCuposBtn = e.target.closest('.btn-quick-add-cupos');
      if (quickCuposBtn) {
        const raceId = quickCuposBtn.getAttribute('data-race-id');
        const addAmount = parseInt(quickCuposBtn.getAttribute('data-add'), 10) || 50;

        if (!confirm(`¿Deseas agregar ${addAmount} cupos adicionales a esta corrida?`)) return;

        try {
          const json = await cmsFetch(`/admin/api/races/${raceId}/capacity`, {
            method: 'POST',
            body: JSON.stringify({ add: addAmount })
          });

          if (json.success) {
            showAdminToast(json.message, 'success');
            setTimeout(() => window.location.reload(), 700);
          } else {
            showAdminToast(json.error || 'No se pudieron agregar cupos', 'error');
          }
        } catch (err) {
          showAdminToast(err.message || 'Error de conexión', 'error');
        }
        return;
      }

      // 4. AJUSTE PERSONALIZADO DE CUPOS
      const customCuposBtn = e.target.closest('.btn-custom-cupos');
      if (customCuposBtn) {
        const raceId = customCuposBtn.getAttribute('data-race-id');
        const raceName = customCuposBtn.getAttribute('data-race-name');
        const currentMax = customCuposBtn.getAttribute('data-current-max');

        const promptVal = prompt(`Ingresa el nuevo cupo total máximo de inscripciones para "${raceName}":`, currentMax);
        if (promptVal === null) return;
        const newMax = parseInt(promptVal.trim(), 10);
        if (isNaN(newMax) || newMax < 1) {
          showAdminToast('Por favor introduce un número válido mayor a 0', 'error');
          return;
        }

        try {
          const json = await cmsFetch(`/admin/api/races/${raceId}/capacity`, {
            method: 'POST',
            body: JSON.stringify({ maxParticipants: newMax })
          });

          if (json.success) {
            showAdminToast(json.message, 'success');
            setTimeout(() => window.location.reload(), 700);
          } else {
            showAdminToast(json.error || 'No se pudo actualizar el cupo', 'error');
          }
        } catch (err) {
          showAdminToast(err.message || 'Error de conexión', 'error');
        }
        return;
      }

      // 5. ELIMINAR CORRIDA
      const deleteBtn = e.target.closest('.btn-delete-race');
      if (deleteBtn) {
        const raceId = deleteBtn.getAttribute('data-race-id');
        const raceName = deleteBtn.getAttribute('data-race-name');

        if (!confirm(`¿Estás completamente seguro de ELIMINAR la corrida "${raceName}"? Esta acción no se puede deshacer.`)) {
          return;
        }

        try {
          const json = await cmsFetch(`/admin/api/races/${raceId}`, {
            method: 'DELETE'
          });

          if (json.success) {
            showAdminToast(json.message, 'success');
            setTimeout(() => window.location.reload(), 800);
          } else {
            showAdminToast(json.error || 'No se pudo eliminar la corrida', 'error');
          }
        } catch (err) {
          showAdminToast(err.message || 'Error de conexión', 'error');
        }
        return;
      }
    });
  }
}

// 7. Cambio de contraseña
function initPasswordChange() {
  const btn = document.getElementById('btn-submit-change-password');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const currentPassword = document.getElementById('input-currentPassword')?.value;
    const newPassword = document.getElementById('input-newPassword')?.value;

    if (!currentPassword || !newPassword) {
      showAdminToast('Por favor completa ambos campos de contraseña', 'error');
      return;
    }

    if (newPassword.length < 12) {
      showAdminToast('La nueva contraseña debe tener al menos 12 caracteres', 'error');
      return;
    }

    try {
      const json = await cmsFetch('/admin/api/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword })
      });

      if (json.success) {
        showAdminToast('Contraseña actualizada con éxito', 'success');
        document.getElementById('input-currentPassword').value = '';
        document.getElementById('input-newPassword').value = '';
      } else {
        showAdminToast(json.error || 'No se pudo cambiar la contraseña', 'error');
      }
    } catch (err) {
      showAdminToast(err.message || 'Error de conexión', 'error');
    }
  });
}

// 8. Gestor de Subida Asíncrona y Optimización con Sharp (WebP)
function initImageUploadHandlers() {
  document.addEventListener('change', async (e) => {
    const input = e.target.closest('.file-uploader-input');
    if (!input || !input.files || input.files.length === 0) return;

    const file = input.files[0];
    const targetInputSelector = input.getAttribute('data-target-input');
    const previewBoxSelector = input.getAttribute('data-preview-box');
    const previewImgSelector = input.getAttribute('data-preview-img');
    const uploadType = input.getAttribute('data-upload-type') || 'standard';

    // Para sponsor items: buscar relativo al contenedor del item padre
    const sponsorItem = input.closest('.sponsor-admin-item');
    const galleryItem = input.closest('.gallery-admin-item');
    const parentContainer = sponsorItem || galleryItem;
    const targetInput = targetInputSelector
      ? (sponsorItem ? sponsorItem.querySelector(targetInputSelector) : document.querySelector(targetInputSelector))
      : null;
    const previewBox = previewBoxSelector
      ? (sponsorItem ? sponsorItem.querySelector(previewBoxSelector) : document.querySelector(previewBoxSelector))
      : null;
    const previewImg = previewImgSelector && parentContainer ? parentContainer.querySelector(previewImgSelector) : null;

    const labelEl = input.parentElement;
    const originalLabel = labelEl.innerHTML;
    labelEl.innerHTML = `<span class="inline-block animate-spin text-[10px]">⟳</span> Subiendo...`;

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', uploadType);

      const csrfToken = getCsrfToken();
      const res = await fetch('/admin/api/upload', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': csrfToken
        },
        body: formData
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Error al procesar la imagen.');
      }

      const imageUrl = json.data.url;
      const sizeKb = (json.data.sizeBytes / 1024).toFixed(1);

      // Asignar la URL optimizada al campo
      if (targetInput) {
        targetInput.value = imageUrl;
        targetInput.classList.add('border-emerald-500');
        setTimeout(() => targetInput.classList.remove('border-emerald-500'), 2500);
      }

      // Actualizar preview de logo si aplica
      if (previewBox) {
        previewBox.innerHTML = `<img src="${imageUrl}?t=${Date.now()}" alt="Logo" class="max-w-full max-h-full object-contain rounded-xl">`;
      }

      // Actualizar preview de foto en galería si aplica
      if (previewImg) {
        previewImg.src = `${imageUrl}?t=${Date.now()}`;
      }

      // Si es un logo o favicon, auto-guardar inmediatamente para reemplazar en la web
      if (uploadType === 'logo') {
        try {
          const payload = collectCmsFormData();
          payload.brand.logoUrl = imageUrl;
          await cmsFetch('/admin/api/content', {
            method: 'POST',
            body: JSON.stringify(payload)
          });
          showAdminToast(`¡Logo oficial actualizado y publicado con éxito! Reemplazó el logo por defecto (${sizeKb} KB)`, 'success');
        } catch (saveErr) {
          console.warn('Error al auto-guardar logo:', saveErr);
          showAdminToast(`Imagen subida (${sizeKb} KB). Recuerda presionar "Guardar" para publicar el cambio.`, 'info');
        }
      } else if (uploadType === 'favicon') {
        try {
          const payload = collectCmsFormData();
          payload.brand.faviconUrl = imageUrl;
          await cmsFetch('/admin/api/content', {
            method: 'POST',
            body: JSON.stringify(payload)
          });
          const tabFavicon = document.getElementById('preview-tab-favicon');
          if (tabFavicon) tabFavicon.src = `${imageUrl}?t=${Date.now()}`;
          const faviconImg = document.getElementById('preview-favicon-img');
          if (faviconImg) faviconImg.src = `${imageUrl}?t=${Date.now()}`;
          showAdminToast(`¡Favicon de la pestaña actualizado con éxito! (${sizeKb} KB)`, 'success');
        } catch (saveErr) {
          console.warn('Error al auto-guardar favicon:', saveErr);
          showAdminToast(`Favicon subido (${sizeKb} KB). Recuerda presionar "Guardar" para publicar el cambio.`, 'info');
        }
      } else {
        showAdminToast(`¡Imagen optimizada a WebP permanentemente! (${sizeKb} KB)`, 'success');
      }
    } catch (err) {
      console.error('Error subiendo imagen:', err);
      showAdminToast(err.message || 'No se pudo subir la imagen', 'error');
    } finally {
      labelEl.innerHTML = originalLabel;
      if (window.lucide) window.lucide.createIcons();
    }
  });

  // Botón para restablecer y volver al logo/icono por defecto
  const removeLogoBtn = document.getElementById('btn-remove-logo');
  if (removeLogoBtn) {
    removeLogoBtn.addEventListener('click', async () => {
      const logoInput = document.getElementById('input-logoUrl');
      const previewBox = document.getElementById('preview-logo-box');
      if (logoInput) logoInput.value = '';
      if (previewBox) {
        previewBox.innerHTML = `<i data-lucide="trophy" class="w-6 h-6 text-yellow-400"></i>`;
        if (window.lucide) window.lucide.createIcons();
      }
      try {
        const payload = collectCmsFormData();
        payload.brand.logoUrl = '';
        await cmsFetch('/admin/api/content', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        showAdminToast('¡Se restableció el logo e icono por defecto!', 'success');
      } catch (err) {
        console.error('Error al restablecer logo:', err);
      }
    });
  }

  // Botón para restablecer y volver al favicon por defecto
  const removeFaviconBtn = document.getElementById('btn-remove-favicon');
  if (removeFaviconBtn) {
    removeFaviconBtn.addEventListener('click', async () => {
      const faviconInput = document.getElementById('input-faviconUrl');
      const tabFavicon = document.getElementById('preview-tab-favicon');
      const faviconImg = document.getElementById('preview-favicon-img');
      if (faviconInput) faviconInput.value = '';
      if (tabFavicon) tabFavicon.src = '/images/default-favicon.svg';
      if (faviconImg) faviconImg.src = '/images/default-favicon.svg';
      try {
        const payload = collectCmsFormData();
        payload.brand.faviconUrl = '';
        await cmsFetch('/admin/api/content', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        showAdminToast('Favicon de pestaña restablecido al predeterminado.', 'info');
      } catch (err) {
        console.warn('Error restableciendo favicon:', err);
      }
    });
  }
}

// 9. Gestor de Auspiciadores en el CMS
function initSponsorsManager() {
  const container = document.getElementById('sponsors-admin-container');
  if (!container) return;

  let sponsorCount = container.querySelectorAll('.sponsor-admin-item').length;

  // Crear un nuevo item de auspiciador vacío
  function createSponsorItem(idx) {
    const div = document.createElement('div');
    div.className = 'sponsor-admin-item flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl bg-gray-900/60 border border-gray-800 group';
    div.style.animation = 'fadeInUp 0.3s ease forwards';
    div.innerHTML = `
      <div class="relative shrink-0">
        <div class="sponsor-preview-box w-32 h-16 rounded-xl bg-white/5 border border-gray-700 flex items-center justify-center overflow-hidden">
          <i data-lucide="image" class="w-6 h-6 text-gray-600"></i>
        </div>
        <input type="hidden" name="sponsors[${idx}][logoUrl]" value="" class="sponsor-logo-url-input">
      </div>
      <div class="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label class="block text-xs text-gray-400 mb-1">Nombre</label>
          <input type="text" name="sponsors[${idx}][name]" value="" placeholder="Empresa..." class="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white">
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1">Nivel</label>
          <select name="sponsors[${idx}][tier]" class="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white">
            <option value="gold">Gold</option>
            <option value="silver">Silver</option>
            <option value="bronze" selected>Bronze</option>
          </select>
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1">Sitio Web</label>
          <input type="text" name="sponsors[${idx}][website]" value="" placeholder="https://..." class="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white">
        </div>
      </div>
      <div class="flex flex-col gap-2 shrink-0">
        <label class="cursor-pointer bg-blue-600/80 hover:bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all">
          <i data-lucide="upload" class="w-3.5 h-3.5"></i>
          <span>Logo</span>
          <input type="file" class="hidden file-uploader-input" data-target-input=".sponsor-logo-url-input" data-preview-box=".sponsor-preview-box" data-upload-type="sponsor" accept="image/*">
        </label>
        <button type="button" class="btn-remove-sponsor bg-red-900/50 hover:bg-red-800/60 text-red-400 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          <span>Quitar</span>
        </button>
      </div>`;
    return div;
  }

  // Botón agregar auspiciador
  const addBtn = document.getElementById('btn-add-sponsor');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const item = createSponsorItem(sponsorCount++);
      container.appendChild(item);
      if (window.lucide) window.lucide.createIcons();
    });
  }

  // Delegación para botón quitar auspiciador
  container.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.btn-remove-sponsor');
    if (!removeBtn) return;
    const item = removeBtn.closest('.sponsor-admin-item');
    if (item) {
      item.style.animation = 'fadeOut 0.25s ease forwards';
      setTimeout(() => item.remove(), 250);
    }
  });
}

// 10. Gestor de Orden y Visibilidad de Secciones (Drag and Drop nativo)
function initSectionsManager() {
  const list = document.getElementById('sections-sortable-list');
  if (!list) return;

  let draggedItem = null;

  list.addEventListener('dragstart', (e) => {
    const item = e.target.closest('.section-sortable-item');
    if (!item) return;
    draggedItem = item;
    item.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', item.getAttribute('data-section-id') || '');
    } catch (_) {}
  });

  list.addEventListener('dragend', () => {
    if (draggedItem) {
      draggedItem.classList.remove('dragging');
      draggedItem = null;
    }
    list.querySelectorAll('.section-sortable-item').forEach(el => el.classList.remove('drag-over'));
  });

  list.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const target = e.target.closest('.section-sortable-item');
    if (!target || target === draggedItem) return;

    list.querySelectorAll('.section-sortable-item').forEach(el => {
      if (el !== target) el.classList.remove('drag-over');
    });
    target.classList.add('drag-over');
  });

  list.addEventListener('dragleave', (e) => {
    const target = e.target.closest('.section-sortable-item');
    if (target) target.classList.remove('drag-over');
  });

  list.addEventListener('drop', (e) => {
    e.preventDefault();
    const target = e.target.closest('.section-sortable-item');
    if (!target || !draggedItem || target === draggedItem) return;

    target.classList.remove('drag-over');

    const rect = target.getBoundingClientRect();
    const offset = e.clientY - rect.top;
    if (offset > rect.height / 2) {
      target.after(draggedItem);
    } else {
      target.before(draggedItem);
    }
  });
}

// 11. Escáner de Cédula de Identidad (HTML5 QR/Barcode Scanner)
function initRutScanner() {
  const openBtn = document.getElementById('btn-open-scanner');
  const closeBtn = document.getElementById('btn-close-scanner');
  const modal = document.getElementById('scanner-modal');
  const statusText = document.getElementById('scanner-status-text');
  const resultsContainer = document.getElementById('scanner-results-container');
  const resultHeader = document.getElementById('scanner-result-header');
  const pupilsList = document.getElementById('scanner-pupils-list');
  const cameraContainer = document.getElementById('scanner-camera-container');
  const switchCameraBtn = document.getElementById('btn-switch-camera');
  const scanAgainBtn = document.getElementById('btn-scan-again');
  const filterTableBtn = document.getElementById('btn-filter-table-with-rut');
  const manualRutInput = document.getElementById('manual-rut-input');
  const searchManualBtn = document.getElementById('btn-search-manual-rut');
  const searchInput = document.getElementById('filter-search-input');

  if (!openBtn || !modal) return;

  let html5QrCode = null;
  let currentCameraFacing = "environment"; // trasera por defecto en móviles
  let lastScannedRut = '';

  // Función para extraer el RUT desde el texto escaneado
  // Las cédulas chilenas codifican strings como:
  // "RUN=12345678-9" o URLs como "https://portal.sidiv.registrocivil.cl/...&run=12345678-9" o texto crudo "12345678-9"
  function extractRutFromBarcode(text) {
    if (!text) return null;
    const clean = text.trim();

    // 1. Caso parámetro RUN o RUT en URL/texto
    const matchParam = clean.match(/(?:RUN|RUT|run|rut)[=:\s]*([0-9]{7,8}-?[0-9kK])/);
    if (matchParam && matchParam[1]) return matchParam[1].toUpperCase();

    // 2. Caso formato directo con o sin puntos (ej: 12.345.678-9 o 12345678-9 o 123456789)
    const matchDirect = clean.match(/([0-9]{1,2}(?:\.?[0-9]{3}){2}-?[0-9kK])/);
    if (matchDirect && matchDirect[1]) return matchDirect[1].toUpperCase();

    // 3. Caso números de 8 o 9 dígitos continuos
    const matchRaw = clean.match(/([0-9]{7,8}[0-9kK])/);
    if (matchRaw && matchRaw[1]) {
      const r = matchRaw[1].toUpperCase();
      return r.slice(0, -1) + '-' + r.slice(-1);
    }

    return clean;
  }

  // Reproducir un sonido sutil de confirmación (bip) usando Web Audio API
  function playSuccessBeep() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // Nota La5 (880Hz)
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (_) {}
  }

  // Buscar registros correspondientes en la tabla de participantes
  function searchParticipantByRut(rut) {
    lastScannedRut = rut;
    const normalizedRut = rut.replace(/[.\-]/g, '').toLowerCase();

    // Buscar entre las filas de participantes del DOM
        // Buscar entre las filas o tarjetas de participantes del DOM
    const allCards = Array.from(document.querySelectorAll('#participants-mobile-list .participant-row'));
    const allRows = Array.from(document.querySelectorAll('#participants-tbody tr.participant-row'));
    const matchedPupils = [];
    let tutorName = '';

    // Priorizamos tarjetas móviles si existen (o filas de escritorio)
    const elementsToScan = allCards.length > 0 ? allCards : allRows;

    elementsToScan.forEach(el => {
      const searchData = (el.getAttribute('data-search') || '').toLowerCase();
      const cleanSearchData = searchData.replace(/[.\-]/g, '');

      if (cleanSearchData.includes(normalizedRut)) {
        let kidName = 'Pupilo';
        let kidAge = '';
        let distance = 'General';
        let bibNumber = '#---';
        const paymentProofBtn = el.querySelector('.btn-view-proof');

        if (el.tagName.toLowerCase() === 'tr') {
          kidName = el.querySelector('td:nth-child(2)')?.textContent?.trim() || 'Pupilo';
          kidAge = el.querySelector('td:nth-child(3)')?.textContent?.trim() || '';
          distance = el.querySelector('td:nth-child(4)')?.textContent?.trim() || 'General';
          bibNumber = el.querySelector('td:nth-child(1)')?.textContent?.trim() || '#---';
          const tutorRaw = el.querySelector('td:nth-child(5)')?.textContent?.trim() || '';
          tutorName = tutorRaw.split('\\n')[0] || tutorName;
        } else {
          // Tarjeta móvil
          kidName = el.querySelector('h3')?.textContent?.trim() || 'Pupilo';
          const ageEl = el.querySelector('.bg-slate-950\\/60 span.text-xs');
          kidAge = ageEl ? ageEl.textContent.trim() : '';
          const distEl = el.querySelector('.bg-blue-950\\/80 span');
          distance = distEl ? distEl.textContent.trim() : 'General';
          const bibEl = el.querySelector('.bg-amber-950\\/80 span:last-child');
          bibNumber = bibEl ? '#' + bibEl.textContent.trim() : '#---';
          const tutorProof = el.querySelector('.btn-view-proof');
          if (tutorProof) tutorName = tutorProof.getAttribute('data-tutor') || tutorName;
        }

        matchedPupils.push({
          kidName,
          kidAge,
          distance,
          bibNumber,
          tutorName: tutorName || 'Apoderado',
          tutorRut: rut,
          hasProof: !!paymentProofBtn
        });
      }
    });

    renderResults(rut, matchedPupils, tutorName);
  }

  function renderResults(rut, pupils, tutorName) {
    cameraContainer.classList.add('hidden');
    resultsContainer.classList.remove('hidden');

    if (pupils.length > 0) {
      playSuccessBeep();
      resultHeader.className = 'p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300';
      resultHeader.innerHTML = `
        <div class="flex items-center gap-2.5">
          <i data-lucide="check-circle" class="w-5 h-5 text-emerald-400 shrink-0"></i>
          <div>
            <div class="font-bold text-sm text-white flex items-center gap-2">
              <span>${tutorName || 'Apoderado Registrado'}</span>
              <span class="text-xs font-mono bg-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded-lg border border-emerald-500/30">${rut}</span>
            </div>
            <div class="text-xs text-emerald-400 mt-0.5">
              ${pupils.length} pupilo(s) inscrito(s) en la base de datos
            </div>
          </div>
        </div>
      `;

      pupilsList.innerHTML = pupils.map(p => `
        <div class="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="font-mono font-black text-xs text-amber-400 bg-amber-950 px-2 py-0.5 rounded-lg border border-amber-500/30">${p.bibNumber}</span>
              <span class="font-bold text-sm text-white">${p.kidName}</span>
              ${p.kidAge ? `<span class="text-xs text-slate-400">(${p.kidAge})</span>` : ''}
            </div>
            <span class="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-500/40">${p.distance}</span>
          </div>
          <div class="flex items-center justify-between text-xs pt-1 border-t border-slate-700/60 text-slate-300">
            <span class="flex items-center gap-1 text-[11px] ${p.hasProof ? 'text-emerald-400' : 'text-amber-400'}">
              <i data-lucide="${p.hasProof ? 'check' : 'alert-circle'}" class="w-3.5 h-3.5"></i>
              ${p.hasProof ? 'Comprobante Acreditado' : 'Pago en revisión'}
            </span>
            <span class="text-xs font-bold text-blue-400">Listo para entrega de Kit ✅</span>
          </div>
        </div>
      `).join('');
    } else {
      resultHeader.className = 'p-3.5 rounded-2xl bg-red-950/80 border border-red-500/40 text-red-300';
      resultHeader.innerHTML = `
        <div class="flex items-center gap-2.5">
          <i data-lucide="alert-triangle" class="w-5 h-5 text-red-400 shrink-0"></i>
          <div>
            <div class="font-bold text-sm text-white">No Encontrado en la Base de Datos</div>
            <div class="text-xs text-red-400 mt-0.5">El RUT <span class="font-mono font-bold">${rut}</span> no registra inscripciones activas.</div>
          </div>
        </div>
      `;
      pupilsList.innerHTML = `
        <div class="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 text-center text-xs text-slate-400 space-y-1">
          <p>Verifica si el apoderado se inscribió con otro RUT o si el participante fue ingresado con un número de carnet distinto.</p>
        </div>
      `;
    }

    if (window.lucide) window.lucide.createIcons();
  }

  async function startScanner() {
    resultsContainer.classList.add('hidden');
    cameraContainer.classList.remove('hidden');
    statusText.innerHTML = `
      <span class="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
      Cámara activa lista para escanear
    `;

    if (!window.Html5Qrcode) {
      statusText.textContent = 'Librería de escáner no disponible';
      return;
    }

    try {
      if (html5QrCode) {
        try { await html5QrCode.stop(); } catch (_) {}
      }

      html5QrCode = new Html5Qrcode("reader-qr-view");

      const config = {
        fps: 15,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          return {
            width: Math.floor(viewfinderWidth * 0.85),
            height: Math.floor(viewfinderHeight * 0.6)
          };
        },
        aspectRatio: 1.333334
      };

      await html5QrCode.start(
        { facingMode: currentCameraFacing },
        config,
        (decodedText) => {
          console.log('[Scanner] Texto detectado:', decodedText);
          const rut = extractRutFromBarcode(decodedText);
          if (rut) {
            html5QrCode.stop().then(() => {
              searchParticipantByRut(rut);
            }).catch(() => {
              searchParticipantByRut(rut);
            });
          }
        },
        (errorMessage) => {
          // Ignorar frames sin código detectado
        }
      );
    } catch (err) {
      console.warn('[Scanner] Error iniciando cámara:', err.message);
      statusText.innerHTML = `
        <span class="text-amber-400">Permiso de cámara no concedido o no disponible. Puedes ingresar el RUT abajo.</span>
      `;
    }
  }

  async function stopScanner() {
    if (html5QrCode) {
      try {
        await html5QrCode.stop();
        html5QrCode = null;
      } catch (_) {}
    }
  }

  // Abrir Modal y arrancar escáner
  openBtn.addEventListener('click', () => {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    startScanner();
  });

  // Cerrar Modal
  function closeModal() {
    stopScanner();
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
  });

  // Cambiar cámara frontal / trasera
  switchCameraBtn.addEventListener('click', async () => {
    currentCameraFacing = currentCameraFacing === "environment" ? "user" : "environment";
    await stopScanner();
    startScanner();
  });

  // Escanear otra cédula
  scanAgainBtn.addEventListener('click', () => {
    startScanner();
  });

  // Ver en la tabla principal
  filterTableBtn.addEventListener('click', () => {
    closeModal();
    if (searchInput && lastScannedRut) {
      searchInput.value = lastScannedRut;
      searchInput.dispatchEvent(new Event('input'));
      searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  // Búsqueda manual
  function executeManualSearch() {
    const val = (manualRutInput?.value || '').trim();
    if (val) {
      searchParticipantByRut(val);
    }
  }

  if (searchManualBtn) searchManualBtn.addEventListener('click', executeManualSearch);
  if (manualRutInput) {
    manualRutInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        executeManualSearch();
      }
    });
  }
}

// 12. Gestor de Usuarios (SOLO Administrador)
function initUsersManager() {
  const container = document.getElementById('users-list-container');
  if (!container) return; // Si no existe el contenedor (rol no admin), salir sin error

  // Elementos del DOM
  const formCard           = document.getElementById('user-form-card');
  const toggleCreateBtn    = document.getElementById('btn-toggle-create-user');
  const toggleCreateText   = document.getElementById('btn-toggle-create-text');
  const cancelBtnTop       = document.getElementById('btn-cancel-user-form');
  const cancelBtnBottom    = document.getElementById('btn-cancel-user-form-bottom');
  const formTitle          = document.getElementById('user-form-card-title');
  const formSubtitle       = document.getElementById('user-form-card-subtitle');
  const formHeaderIcon     = document.getElementById('form-header-icon');
  const errorBox           = document.getElementById('user-form-error-box');
  const errorMsg           = document.getElementById('user-form-error-msg');

  // Campos
  const editIdInput        = document.getElementById('user-edit-id');
  const nameInput          = document.getElementById('user-input-name');
  const usernameContainer  = document.getElementById('user-username-container');
  const usernameInput      = document.getElementById('user-input-username');
  const roleInput          = document.getElementById('user-input-role');
  const roleCardEditor     = document.getElementById('role-card-editor');
  const roleCardAdmin      = document.getElementById('role-card-admin');

  // Contraseñas
  const passwordInput      = document.getElementById('user-input-password');
  const passwordConfirm    = document.getElementById('user-input-password-confirm');
  const confirmContainer   = document.getElementById('user-confirm-password-container');
  const passwordLabel      = document.getElementById('user-label-password');
  const passwordHint       = document.getElementById('user-hint-password');
  const togglePwBtn        = document.getElementById('btn-toggle-pw-visibility');
  const togglePwText       = document.getElementById('pw-toggle-text');
  const pwBars             = [1,2,3,4].map(i => document.getElementById('pw-bar-' + i));
  const pwStrengthLabel    = document.getElementById('pw-strength-label');
  const pwMatchHint        = document.getElementById('pw-match-hint');

  // Guardar
  const saveBtn            = document.getElementById('btn-save-user');
  const saveBtnText        = document.getElementById('btn-save-user-text');

  // Badges y Contadores
  const totalBadge         = document.getElementById('users-total-badge');
  const adminCountEl       = document.getElementById('users-admin-count');
  const editorCountEl      = document.getElementById('users-editor-count');
  const sidebarCountBadge  = document.getElementById('users-count-badge');
  const emptyState         = document.getElementById('users-empty-state');

  // ---------------------------------------------------------
  // Helper: Request con CSRF
  // ---------------------------------------------------------
  async function apiFetch(url, options = {}) {
    const meta = document.querySelector('meta[name="csrf-token"]');
    const csrf = meta ? meta.getAttribute('content') : '';
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');
    headers.set('Accept', 'application/json');
    if (csrf) headers.set('X-CSRF-Token', csrf);

    const res = await fetch(url, { credentials: 'same-origin', ...options, headers });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  }

  // ---------------------------------------------------------
  // Selector de Rol Visual (Cards)
  // ---------------------------------------------------------
  function setRole(role) {
    if (roleInput) roleInput.value = role;

    if (role === 'editor') {
      if (roleCardEditor) {
        roleCardEditor.className = 'role-card-opt p-4 rounded-2xl border-2 border-amber-500/70 bg-amber-950/20 cursor-pointer transition-all hover:border-amber-400 shadow-sm';
        const badge = roleCardEditor.querySelector('.role-indicator-badge');
        if (badge) { badge.textContent = 'Seleccionado'; badge.classList.remove('hidden'); }
      }
      if (roleCardAdmin) {
        roleCardAdmin.className = 'role-card-opt p-4 rounded-2xl border-2 border-slate-700 bg-slate-950/40 cursor-pointer transition-all hover:border-blue-400 opacity-70';
        const badge = roleCardAdmin.querySelector('.role-indicator-badge');
        if (badge) badge.classList.add('hidden');
      }
    } else {
      if (roleCardAdmin) {
        roleCardAdmin.className = 'role-card-opt p-4 rounded-2xl border-2 border-blue-500/70 bg-blue-950/20 cursor-pointer transition-all hover:border-blue-400 shadow-sm';
        const badge = roleCardAdmin.querySelector('.role-indicator-badge');
        if (badge) { badge.textContent = 'Seleccionado'; badge.classList.remove('hidden'); }
      }
      if (roleCardEditor) {
        roleCardEditor.className = 'role-card-opt p-4 rounded-2xl border-2 border-slate-700 bg-slate-950/40 cursor-pointer transition-all hover:border-amber-400 opacity-70';
        const badge = roleCardEditor.querySelector('.role-indicator-badge');
        if (badge) badge.classList.add('hidden');
      }
    }
  }

  if (roleCardEditor) roleCardEditor.addEventListener('click', () => setRole('editor'));
  if (roleCardAdmin) roleCardAdmin.addEventListener('click', () => setRole('admin'));

  // ---------------------------------------------------------
  // Toggle Ver/Ocultar Contraseña
  // ---------------------------------------------------------
  if (togglePwBtn && passwordInput) {
    togglePwBtn.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      if (passwordConfirm) passwordConfirm.type = isPassword ? 'text' : 'password';
      if (togglePwText) togglePwText.textContent = isPassword ? 'Ocultar' : 'Ver clave';
      const icon = togglePwBtn.querySelector('i');
      if (icon) icon.setAttribute('data-lucide', isPassword ? 'eye-off' : 'eye');
      if (window.lucide) window.lucide.createIcons();
    });
  }

  // ---------------------------------------------------------
  // Medidor de Fortaleza de Contraseña
  // ---------------------------------------------------------
  function calcStrength(pwd) {
    let s = 0;
    if (pwd.length >= 12) s++;
    if (pwd.length >= 16) s++;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) s++;
    if (/[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) s++;
    return s;
  }

  function updateStrength() {
    const pwd = passwordInput ? passwordInput.value : '';
    const s = pwd.length === 0 ? 0 : calcStrength(pwd);
    const colors = ['bg-slate-700', 'bg-red-500', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-400'];
    const labels = ['', 'Débil (mínimo 12 caracteres)', 'Aceptable', 'Buena y segura', 'Excelente'];
    const labelClasses = ['', 'text-red-400', 'text-amber-400', 'text-emerald-400', 'text-emerald-400'];

    pwBars.forEach((bar, i) => {
      if (bar) bar.className = 'h-1 flex-1 rounded-full transition-all ' + (i < s ? colors[s] : 'bg-slate-700');
    });

    if (pwStrengthLabel) {
      pwStrengthLabel.textContent = pwd.length > 0 ? labels[s] : '';
      pwStrengthLabel.className = 'text-[10px] block ' + (labelClasses[s] || 'text-slate-500');
    }

    checkMatch();
  }

  function checkMatch() {
    if (!passwordConfirm || !pwMatchHint) return;
    const p1 = passwordInput ? passwordInput.value : '';
    const p2 = passwordConfirm.value;

    if (!p1 && !p2) {
      pwMatchHint.classList.add('hidden');
      return;
    }

    if (p2.length > 0) {
      if (p1 === p2) {
        pwMatchHint.textContent = '✓ Las contraseñas coinciden perfectamente';
        pwMatchHint.className = 'text-[10px] text-emerald-400 mt-1 block font-medium';
      } else {
        pwMatchHint.textContent = '✗ Las contraseñas aún no coinciden';
        pwMatchHint.className = 'text-[10px] text-red-400 mt-1 block font-medium';
      }
      pwMatchHint.classList.remove('hidden');
    } else {
      pwMatchHint.classList.add('hidden');
    }
  }

  if (passwordInput) passwordInput.addEventListener('input', updateStrength);
  if (passwordConfirm) passwordConfirm.addEventListener('input', checkMatch);

  // ---------------------------------------------------------
  // Errores Inline
  // ---------------------------------------------------------
  function showError(msg) {
    if (errorBox && errorMsg) {
      errorMsg.textContent = msg;
      errorBox.classList.remove('hidden');
      errorBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function hideError() {
    if (errorBox) errorBox.classList.add('hidden');
  }

  // ---------------------------------------------------------
  // Reset del Formulario
  // ---------------------------------------------------------
  function resetForm() {
    hideError();
    if (editIdInput) editIdInput.value = '';
    if (nameInput) nameInput.value = '';
    if (usernameInput) {
      usernameInput.value = '';
      usernameInput.disabled = false;
    }
    if (usernameContainer) usernameContainer.classList.remove('hidden');
    if (passwordInput) {
      passwordInput.value = '';
      passwordInput.type = 'password';
    }
    if (passwordConfirm) {
      passwordConfirm.value = '';
      passwordConfirm.type = 'password';
    }
    if (togglePwText) togglePwText.textContent = 'Ver clave';
    if (passwordLabel) passwordLabel.textContent = 'Contraseña *';
    if (passwordHint) passwordHint.classList.add('hidden');
    if (confirmContainer) confirmContainer.classList.remove('hidden');
    if (pwMatchHint) pwMatchHint.classList.add('hidden');

    pwBars.forEach(b => { if (b) b.className = 'h-1 flex-1 rounded-full bg-slate-700 transition-all'; });
    if (pwStrengthLabel) pwStrengthLabel.textContent = '';

    setRole('editor');

    if (formTitle) formTitle.textContent = 'Crear Nuevo Usuario';
    if (formSubtitle) formSubtitle.textContent = 'Ingresa los datos para otorgar acceso como Administrador o Lector.';
    if (formHeaderIcon) formHeaderIcon.setAttribute('data-lucide', 'user-plus');
    if (saveBtnText) saveBtnText.textContent = 'Guardar Usuario';

    if (window.lucide) window.lucide.createIcons();
  }

  // ---------------------------------------------------------
  // Abrir / Cerrar Form Card
  // ---------------------------------------------------------
  function openForm(isEdit = false) {
    if (!formCard) return;
    formCard.classList.remove('hidden');
    formCard.style.display = 'block';
    if (toggleCreateText) toggleCreateText.textContent = '✕ Ocultar Formulario';
    try { formCard.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (_) {}
    setTimeout(() => { if (nameInput) nameInput.focus(); }, 150);
  }

  function closeForm() {
    if (!formCard) return;
    formCard.classList.add('hidden');
    formCard.style.display = 'none';
    if (toggleCreateText) toggleCreateText.textContent = '+ Agregar Usuario';
    resetForm();
  }

  // Vincular todos los botones con clase .btn-open-user-form (cabecera, lista, vacío, pie)
  const openButtons = document.querySelectorAll('.btn-open-user-form');
  openButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (!formCard) return;
      const isClosed = formCard.classList.contains('hidden');
      const isEditMode = editIdInput && !!editIdInput.value;

      if (isClosed || isEditMode) {
        resetForm();
        openForm(false);
      } else {
        closeForm();
      }
    });
  });

  window._openCreateUserForm = function() {
    resetForm();
    openForm(false);
  };

  if (cancelBtnTop) cancelBtnTop.addEventListener('click', closeForm);
  if (cancelBtnBottom) cancelBtnBottom.addEventListener('click', closeForm);

  // ---------------------------------------------------------
  // Actualizar Contadores en UI
  // ---------------------------------------------------------
  function updateCounts(users) {
    const total = users.length;
    const admins = users.filter(u => u.role === 'admin').length;
    const editors = users.filter(u => u.role === 'editor' || u.role === 'lector').length;

    if (totalBadge) totalBadge.textContent = `${total} cuenta${total === 1 ? '' : 's'} activa${total === 1 ? '' : 's'}`;
    if (adminCountEl) adminCountEl.textContent = admins;
    if (editorCountEl) editorCountEl.textContent = editors;
    if (sidebarCountBadge) sidebarCountBadge.textContent = total;
    if (emptyState) emptyState.classList.toggle('hidden', total > 0);
  }

  // ---------------------------------------------------------
  // Renderizar Tarjetas de Usuario
  // ---------------------------------------------------------
  function renderUsers(users) {
    // Quitar únicamente las tarjetas existentes
    container.querySelectorAll('.user-card-item').forEach(el => el.remove());
    updateCounts(users);

    const currentUserMeta = document.querySelector('meta[name="current-user"]');
    const myUsername = (currentUserMeta ? currentUserMeta.getAttribute('content') : '').trim().toLowerCase();

    users.forEach(u => {
      const isMe = u.username.toLowerCase() === myUsername;
      const isAdmin = u.role === 'admin';
      const initial = (u.name || u.username || 'U')[0].toUpperCase();

      const card = document.createElement('div');
      card.className = 'user-card-item bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4.5 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-md';
      card.dataset.userId = u.id;
      card.dataset.username = u.username;
      card.dataset.name = u.name;
      card.dataset.role = u.role;

      card.innerHTML = `
        <div class="flex items-center gap-3.5">
          <div class="w-11 h-11 rounded-2xl shrink-0 flex items-center justify-center font-black text-sm
               ${isAdmin ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-blue-500/10' : 'bg-amber-600/20 text-amber-400 border border-amber-500/40 shadow-amber-500/10'} shadow-lg">
            ${initial}
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-bold text-sm text-white">${u.name}</span>
              <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg
                   ${isAdmin ? 'bg-blue-950 text-blue-300 border border-blue-500/40' : 'bg-amber-950 text-amber-300 border border-amber-500/40'}">
                ${isAdmin ? 'ADMINISTRADOR' : 'LECTOR'}
              </span>
              ${isMe ? `
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Eres tú
              </span>` : ''}
            </div>
            <p class="text-xs text-slate-400 font-mono mt-0.5">@${u.username}</p>
          </div>
        </div>

        <div class="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button type="button" class="btn-edit-user px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                  data-id="${u.id}" data-username="${u.username}" data-name="${u.name}" data-role="${u.role}">
            <i data-lucide="edit-3" class="w-3.5 h-3.5 text-slate-400"></i>
            <span>Editar</span>
          </button>

          ${!isMe ? `
          <button type="button" class="btn-delete-user p-2 rounded-xl bg-red-950/50 hover:bg-red-900 border border-red-500/30 text-red-300 transition-colors cursor-pointer"
                  data-id="${u.id}" data-username="${u.username}" title="Eliminar usuario">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>` : ''}
        </div>
      `;

      container.appendChild(card);
    });

    if (window.lucide) window.lucide.createIcons();
  }

  // ---------------------------------------------------------
  // Cargar Lista de Usuarios (Sin limpiar antes de la respuesta)
  // ---------------------------------------------------------
  async function loadUsersList() {
    try {
      const { ok, data } = await apiFetch('/admin/api/users');
      if (ok && data.success && Array.isArray(data.users)) {
        renderUsers(data.users);
      }
    } catch (err) {
      console.warn('[users] No se pudo actualizar lista vía API:', err);
    }
  }

  window._loadUsersList = loadUsersList;

  // ---------------------------------------------------------
  // Guardar (Crear o Actualizar)
  // ---------------------------------------------------------
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      hideError();

      const isEdit   = !!(editIdInput && editIdInput.value);
      const name     = (nameInput ? nameInput.value : '').trim();
      const username = (usernameInput ? usernameInput.value : '').trim().toLowerCase();
      const role     = roleInput ? roleInput.value : 'editor';
      const pw       = passwordInput ? passwordInput.value : '';
      const pwConf   = passwordConfirm ? passwordConfirm.value : '';

      // Validaciones básicas del lado del cliente
      if (!name) {
        showError('Por favor ingresa el nombre completo de la persona.');
        return;
      }

      if (!isEdit) {
        if (!username || username.length < 3) {
          showError('El nombre de usuario debe tener al menos 3 caracteres (sin espacios).');
          return;
        }
        if (!/^[a-z0-9_-]+$/.test(username)) {
          showError('El nombre de usuario solo puede contener letras minúsculas, números o guiones.');
          return;
        }
        if (!pw || pw.length < 12) {
          showError('La contraseña debe tener un mínimo de 12 caracteres.');
          return;
        }
        if (pw !== pwConf) {
          showError('Las contraseñas no coinciden. Por favor verifica.');
          return;
        }
      } else {
        if (pw && pw.length < 12) {
          showError('La nueva contraseña debe tener un mínimo de 12 caracteres.');
          return;
        }
      }

      saveBtn.disabled = true;
      const origText = saveBtnText ? saveBtnText.textContent : 'Guardar';
      if (saveBtnText) saveBtnText.textContent = 'Guardando...';

      try {
        const url    = isEdit ? `/admin/api/users/${editIdInput.value}` : '/admin/api/users';
        const method = isEdit ? 'PUT' : 'POST';
        const body   = isEdit
          ? { name, role, ...(pw ? { password: pw } : {}) }
          : { name, username, role, password: pw };

        const { ok, data } = await apiFetch(url, { method, body: JSON.stringify(body) });

        if (ok && data.success) {
          showAdminToast(isEdit ? 'Usuario actualizado exitosamente' : `Usuario @${username} creado con éxito`, 'success');
          closeForm();
          await loadUsersList();
        } else {
          showError(data.error || 'Ocurrió un error al procesar el usuario.');
        }
      } catch (err) {
        showError('Error de conexión con el servidor. Intenta nuevamente.');
      } finally {
        saveBtn.disabled = false;
        if (saveBtnText) saveBtnText.textContent = origText;
      }
    });
  }

  // ---------------------------------------------------------
  // Delegación de Eventos: Editar y Eliminar
  // ---------------------------------------------------------
  container.addEventListener('click', async (e) => {
    // EDITAR
    const editBtn = e.target.closest('.btn-edit-user');
    if (editBtn) {
      const id       = editBtn.getAttribute('data-id');
      const username = editBtn.getAttribute('data-username');
      const name     = editBtn.getAttribute('data-name');
      const role     = editBtn.getAttribute('data-role');

      resetForm();

      if (editIdInput) editIdInput.value = id;
      if (nameInput) nameInput.value = name;
      if (usernameInput) {
        usernameInput.value = username;
        usernameInput.disabled = true;
      }
      if (usernameContainer) usernameContainer.classList.add('hidden');

      setRole(role);

      if (passwordLabel) passwordLabel.textContent = 'Nueva Contraseña (Opcional)';
      if (passwordHint) passwordHint.classList.remove('hidden');
      if (confirmContainer) confirmContainer.classList.add('hidden');

      if (formTitle) formTitle.textContent = `Editar Usuario: @${username}`;
      if (formSubtitle) formSubtitle.textContent = 'Puedes actualizar el nombre, el rol (Administrador o Lector) o asignarle una nueva clave.';
      if (formHeaderIcon) formHeaderIcon.setAttribute('data-lucide', 'edit-3');
      if (saveBtnText) saveBtnText.textContent = 'Guardar Cambios';

      openForm(true);
      return;
    }

    // ELIMINAR
    const deleteBtn = e.target.closest('.btn-delete-user');
    if (deleteBtn) {
      const id       = deleteBtn.getAttribute('data-id');
      const username = deleteBtn.getAttribute('data-username');

      if (!confirm(`¿Estás seguro de eliminar el usuario "@${username}"?\nEsta acción revocará su acceso al panel de administración de inmediato.`)) {
        return;
      }

      deleteBtn.disabled = true;
      try {
        const { ok, data } = await apiFetch(`/admin/api/users/${id}`, { method: 'DELETE' });

        if (ok && data.success) {
          showAdminToast(`Usuario "@${username}" eliminado correctamente`, 'success');
          const card = deleteBtn.closest('.user-card-item');
          if (card) {
            card.remove();
            // Recontar cards restantes
            const remaining = container.querySelectorAll('.user-card-item');
            if (sidebarCountBadge) sidebarCountBadge.textContent = remaining.length;
            if (totalBadge) totalBadge.textContent = `${remaining.length} cuentas activas`;
            if (emptyState) emptyState.classList.toggle('hidden', remaining.length > 0);
          }
        } else {
          showAdminToast(data.error || 'No se pudo eliminar el usuario', 'error');
        }
      } catch (err) {
        showAdminToast('Error de conexión al eliminar usuario', 'error');
      } finally {
        deleteBtn.disabled = false;
      }
    }
  });

  // Re-contar al inicio en base a las tarjetas existentes en el DOM
  const existingCards = container.querySelectorAll('.user-card-item');
  if (sidebarCountBadge) sidebarCountBadge.textContent = existingCards.length;
}
// 14. Gestor de Circuitos y Categorías por Edades (SOLO Administrador)
function initCircuitsManager() {
  const container = document.getElementById('circuits-admin-container');
  const addBtn    = document.getElementById('btn-add-circuit');
  const addBtnBot = document.getElementById('btn-add-circuit-bottom');
  const saveBtn   = document.getElementById('btn-save-circuits');
  const emptyState = document.getElementById('circuits-empty-state');

  if (!container) return;

  // --- Helpers ---
  function renumberItems() {
    container.querySelectorAll('.circuit-admin-item').forEach((el, i) => {
      const numBadge = el.querySelector('.circuit-item-number');
      const numText  = el.querySelector('.circuit-item-num-text');
      if (numBadge) numBadge.textContent = i + 1;
      if (numText)  numText.textContent  = i + 1;
    });
    checkEmpty();
  }

  function checkEmpty() {
    const count = container.querySelectorAll('.circuit-admin-item').length;
    if (emptyState) emptyState.classList.toggle('hidden', count > 0);
  }

  function createCircuitItem(data = {}) {
    const idx = Date.now(); // unique temp key for the item
    const el = document.createElement('div');
    el.className = 'circuit-admin-item p-4 sm:p-5 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-3 group hover:border-gray-700 transition-all';
    el.innerHTML = `
      <input type="hidden" class="circuit-id-input" value="${data.id || ('cat-new-' + idx)}">
      <div class="flex items-center justify-between gap-3 pb-2 border-b border-gray-800/80">
        <div class="flex items-center gap-2">
          <span class="circuit-item-number w-6 h-6 rounded-lg bg-emerald-600/20 text-emerald-400 font-mono text-xs font-bold flex items-center justify-center">?</span>
          <span class="text-xs font-bold text-slate-300">Circuito #<span class="circuit-item-num-text">?</span></span>
        </div>
        <div class="flex items-center gap-1.5">
          <button type="button" class="btn-move-up-circuit p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer" title="Mover arriba">
            <i data-lucide="arrow-up" class="w-3.5 h-3.5"></i>
          </button>
          <button type="button" class="btn-move-down-circuit p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer" title="Mover abajo">
            <i data-lucide="arrow-down" class="w-3.5 h-3.5"></i>
          </button>
          <button type="button" class="btn-remove-circuit p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-red-300 transition-all ml-1 cursor-pointer" title="Eliminar circuito">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label class="block text-xs text-gray-400 mb-1">Distancia (ej: 500 Metros)</label>
          <input type="text" class="circuit-distance w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-emerald-500" value="${data.distance || ''}" placeholder="1 Km">
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1">Rango de Edad</label>
          <input type="text" class="circuit-badge w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" value="${data.badge || ''}" placeholder="6 a 8 años">
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1">Nombre Categoría</label>
          <input type="text" class="circuit-title w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" value="${data.title || ''}" placeholder="Pequeños Rayos">
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1">Icono Lucide</label>
          <input type="text" class="circuit-icon w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500" value="${data.icon || 'flag'}" placeholder="flag">
        </div>
      </div>
      <div>
        <label class="block text-xs text-gray-400 mb-1">Descripción del Circuito</label>
        <textarea class="circuit-description w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500" rows="2" placeholder="Describe el circuito, condiciones y características...">${data.description || ''}</textarea>
      </div>`;
    return el;
  }

  function addNewCircuit(data = {}) {
    const el = createCircuitItem(data);
    container.appendChild(el);
    renumberItems();
    if (window.lucide) window.lucide.createIcons();
    // Scroll suave al nuevo item
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // --- Delegación de eventos (remove + move) ---
  container.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.btn-remove-circuit');
    const upBtn     = e.target.closest('.btn-move-up-circuit');
    const downBtn   = e.target.closest('.btn-move-down-circuit');
    const item      = e.target.closest('.circuit-admin-item');
    if (!item) return;

    if (removeBtn) {
      if (!confirm('¿Eliminar este circuito?')) return;
      item.remove();
      renumberItems();
      showAdminToast('Circuito eliminado. Guarda para aplicar los cambios.', 'info');
      return;
    }
    if (upBtn) {
      const prev = item.previousElementSibling;
      if (prev && prev.classList.contains('circuit-admin-item')) {
        container.insertBefore(item, prev);
        renumberItems();
      }
      return;
    }
    if (downBtn) {
      const next = item.nextElementSibling;
      if (next && next.classList.contains('circuit-admin-item')) {
        container.insertBefore(next, item);
        renumberItems();
      }
    }
  });

  // --- Botones Agregar ---
  if (addBtn)    addBtn.addEventListener('click',    () => addNewCircuit());
  if (addBtnBot) addBtnBot.addEventListener('click', () => addNewCircuit());

  // --- Guardar circuitos ---
  function collectCircuits() {
    const items = container.querySelectorAll('.circuit-admin-item');
    return Array.from(items).map((el, i) => ({
      id:          el.querySelector('.circuit-id-input')?.value || `cat-${i + 1}`,
      distance:    el.querySelector('.circuit-distance')?.value?.trim() || '',
      badge:       el.querySelector('.circuit-badge')?.value?.trim() || '',
      title:       el.querySelector('.circuit-title')?.value?.trim() || '',
      icon:        el.querySelector('.circuit-icon')?.value?.trim() || 'flag',
      description: el.querySelector('.circuit-description')?.value?.trim() || '',
    }));
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      saveBtn.disabled = true;
      const origText = saveBtn.innerHTML;
      saveBtn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 animate-spin"></i><span>Guardando...</span>';
      if (window.lucide) window.lucide.createIcons();

      try {
        const csrf = getCsrfToken();
        const payload = { categories: collectCircuits() };
        const res = await cmsFetch('/admin/api/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success) {
          showAdminToast('Circuitos guardados correctamente ✅', 'success');
        } else {
          showAdminToast(json.error || 'Error al guardar', 'error');
        }
      } catch (err) {
        showAdminToast(err.message || 'Error de conexión', 'error');
      } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = origText;
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }

  // Exponer collector para que collectCmsFormData lo use
  window._collectCircuits = collectCircuits;

  checkEmpty();
}

// 13. Gestor de Cronograma de Actividades (SOLO Administrador)
function initScheduleManager() {
  const container = document.getElementById('schedule-admin-container');
  const addBtn = document.getElementById('btn-add-schedule-item');
  const addBottomBtn = document.getElementById('btn-add-schedule-item-bottom');
  const saveSectionBtn = document.getElementById('btn-save-schedule-section');
  const countBadge = document.getElementById('schedule-count-badge');
  const emptyState = document.getElementById('schedule-empty-state');

  if (!container) return;

  function updateItemNumbers() {
    const items = container.querySelectorAll('.schedule-admin-item');
    items.forEach((item, idx) => {
      const numEl = item.querySelector('.schedule-item-number');
      const textEl = item.querySelector('.schedule-item-num-text');
      if (numEl) numEl.textContent = idx + 1;
      if (textEl) textEl.textContent = idx + 1;

      const timeInput = item.querySelector('.schedule-time-input');
      const titleInput = item.querySelector('.schedule-title-input');
      const descInput = item.querySelector('.schedule-desc-input');
      if (timeInput) timeInput.name = `schedule[${idx}][time]`;
      if (titleInput) titleInput.name = `schedule[${idx}][title]`;
      if (descInput) descInput.name = `schedule[${idx}][desc]`;
    });

    if (countBadge) countBadge.textContent = items.length;
    if (emptyState) {
      emptyState.classList.toggle('hidden', items.length > 0);
    }
  }

  function createScheduleItem(idx, defaultTime = '09:00 AM', defaultTitle = '', defaultDesc = '') {
    const div = document.createElement('div');
    div.className = 'schedule-admin-item p-4 sm:p-5 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-3 group hover:border-gray-700 transition-all';
    div.style.animation = 'fadeInUp 0.25s ease forwards';
    div.innerHTML = `
      <div class="flex items-center justify-between gap-3 pb-2 border-b border-gray-800/80">
        <div class="flex items-center gap-2">
          <span class="schedule-item-number w-6 h-6 rounded-lg bg-blue-600/20 text-blue-400 font-mono text-xs font-bold flex items-center justify-center">
            ${idx + 1}
          </span>
          <span class="text-xs font-bold text-slate-300">Actividad #<span class="schedule-item-num-text">${idx + 1}</span></span>
        </div>
        <div class="flex items-center gap-1.5">
          <button type="button" class="btn-move-up-schedule p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer" title="Mover arriba">
            <i data-lucide="arrow-up" class="w-3.5 h-3.5"></i>
          </button>
          <button type="button" class="btn-move-down-schedule p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer" title="Mover abajo">
            <i data-lucide="arrow-down" class="w-3.5 h-3.5"></i>
          </button>
          <button type="button" class="btn-remove-schedule p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-red-300 transition-all ml-1 cursor-pointer" title="Quitar actividad">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label class="block text-xs text-gray-400 mb-1">Horario / Hora (ej: 08:30 AM)</label>
          <input type="text" name="schedule[${idx}][time]" value="${defaultTime}" placeholder="08:30 AM" class="schedule-time-input w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-blue-500">
        </div>
        <div class="sm:col-span-2">
          <label class="block text-xs text-gray-400 mb-1">Nombre / Título de la Actividad</label>
          <input type="text" name="schedule[${idx}][title]" value="${defaultTitle}" placeholder="Ej: Largada Mini Runners 500m" class="schedule-title-input w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-blue-500">
        </div>
      </div>

      <div>
        <label class="block text-xs text-gray-400 mb-1">Descripción / Detalles para los Asistentes</label>
        <textarea name="schedule[${idx}][desc]" rows="2" placeholder="Detalles de la actividad, quiénes participan, recomendaciones..." class="schedule-desc-input w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500">${defaultDesc}</textarea>
      </div>
    `;
    return div;
  }

  function handleAdd() {
    const idx = container.querySelectorAll('.schedule-admin-item').length;
    const newItem = createScheduleItem(idx, '09:00 AM', '', '');
    container.appendChild(newItem);
    updateItemNumbers();
    newItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    const titleInput = newItem.querySelector('.schedule-title-input');
    if (titleInput) titleInput.focus();
    if (window.lucide) window.lucide.createIcons();
  }

  if (addBtn) addBtn.addEventListener('click', handleAdd);
  if (addBottomBtn) addBottomBtn.addEventListener('click', handleAdd);

  // Delegación de eventos para mover o eliminar items
  container.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.btn-remove-schedule');
    if (removeBtn) {
      const item = removeBtn.closest('.schedule-admin-item');
      if (item) {
        item.style.animation = 'fadeOut 0.2s ease forwards';
        setTimeout(() => {
          item.remove();
          updateItemNumbers();
        }, 200);
      }
      return;
    }

    const moveUpBtn = e.target.closest('.btn-move-up-schedule');
    if (moveUpBtn) {
      const item = moveUpBtn.closest('.schedule-admin-item');
      if (item && item.previousElementSibling && item.previousElementSibling.classList.contains('schedule-admin-item')) {
        item.parentNode.insertBefore(item, item.previousElementSibling);
        updateItemNumbers();
      }
      return;
    }

    const moveDownBtn = e.target.closest('.btn-move-down-schedule');
    if (moveDownBtn) {
      const item = moveDownBtn.closest('.schedule-admin-item');
      if (item && item.nextElementSibling && item.nextElementSibling.classList.contains('schedule-admin-item')) {
        item.parentNode.insertBefore(item.nextElementSibling, item);
        updateItemNumbers();
      }
      return;
    }
  });

  // Guardar solo cronograma
  if (saveSectionBtn) {
    saveSectionBtn.addEventListener('click', async () => {
      const orig = saveSectionBtn.innerHTML;
      saveSectionBtn.disabled = true;
      saveSectionBtn.innerHTML = '<span class="inline-block animate-spin mr-1.5">⟳</span> Guardando...';

      const schedule = [];
      container.querySelectorAll('.schedule-admin-item').forEach(item => {
        const time = item.querySelector('.schedule-time-input')?.value.trim() || '';
        const title = item.querySelector('.schedule-title-input')?.value.trim() || '';
        const desc = item.querySelector('.schedule-desc-input')?.value.trim() || '';
        if (time || title || desc) {
          schedule.push({ time, title, desc });
        }
      });

      const getVal = id => document.getElementById(id)?.value || '';
      const scheduleSection = {
        badge: getVal('input-scheduleBadge') || 'HORARIOS Y ACTIVIDADES',
        title: getVal('input-scheduleTitle') || 'Cronograma de la Gran Jornada',
        subtitle: getVal('input-scheduleSubtitle') || 'Ven temprano para disfrutar de todas las sorpresas preparadas para la familia.'
      };

      try {
        const res = await cmsFetch('/admin/api/content', {
          method: 'POST',
          body: JSON.stringify({ schedule, scheduleSection })
        });
        if (res.success) {
          showAdminToast('¡Cronograma guardado exitosamente!', 'success');
        } else {
          showAdminToast(res.error || 'No se pudo guardar el cronograma', 'error');
        }
      } catch (err) {
        showAdminToast(err.message || 'Error de conexión', 'error');
      } finally {
        saveSectionBtn.disabled = false;
        saveSectionBtn.innerHTML = orig;
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }

  updateItemNumbers();
}

// 16. Gestor de Preguntas Frecuentes (FAQs)
function initFaqsManager() {
  const container = document.getElementById('faqs-container');
  const addBtn = document.getElementById('btn-add-faq');
  const addBottomBtn = document.getElementById('btn-add-faq-bottom');
  const saveSectionBtn = document.getElementById('btn-save-faqs-section');
  const countBadge = document.getElementById('faqs-count-badge');
  const emptyState = document.getElementById('faqs-empty-state');

  if (!container) return;

  function updateFaqNumbers() {
    const items = container.querySelectorAll('.faq-admin-item');
    items.forEach((item, idx) => {
      const numEl = item.querySelector('.faq-item-number');
      const textEl = item.querySelector('.faq-item-num-text');
      if (numEl) numEl.textContent = idx + 1;
      if (textEl) textEl.textContent = idx + 1;

      const qInput = item.querySelector('.faq-question-input');
      const aInput = item.querySelector('.faq-answer-input');
      if (qInput) qInput.name = `faqs[${idx}][question]`;
      if (aInput) aInput.name = `faqs[${idx}][answer]`;
    });

    if (countBadge) countBadge.textContent = items.length;
    if (emptyState) {
      emptyState.classList.toggle('hidden', items.length > 0);
    }
  }

  function createFaqItem(idx, defaultQ = '', defaultA = '') {
    const div = document.createElement('div');
    div.className = 'faq-admin-item p-4 sm:p-5 rounded-3xl bg-gray-900/60 border border-gray-800 space-y-3 hover:border-gray-700 transition-all';
    div.style.animation = 'fadeInUp 0.25s ease forwards';
    div.innerHTML = `
      <div class="flex items-center justify-between pb-2 border-b border-gray-800/80">
        <div class="flex items-center gap-2">
          <span class="faq-item-number w-6 h-6 rounded-lg bg-emerald-600/20 text-emerald-400 font-mono text-xs font-bold flex items-center justify-center">
            ${idx + 1}
          </span>
          <span class="text-xs font-bold text-slate-300">Pregunta #<span class="faq-item-num-text">${idx + 1}</span></span>
        </div>
        <div class="flex items-center gap-1.5">
          <button type="button" class="btn-move-up-faq p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer" title="Mover arriba">
            <i data-lucide="arrow-up" class="w-3.5 h-3.5"></i>
          </button>
          <button type="button" class="btn-move-down-faq p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer" title="Mover abajo">
            <i data-lucide="arrow-down" class="w-3.5 h-3.5"></i>
          </button>
          <button type="button" class="btn-remove-faq p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-red-300 transition-all ml-1 cursor-pointer" title="Eliminar pregunta">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>

      <div>
        <label class="block text-xs text-gray-400 mb-1 font-semibold">Pregunta *</label>
        <input type="text" name="faqs[${idx}][question]" value="${defaultQ}" placeholder="Ej: ¿Qué incluye el kit de corredor?" class="faq-question-input w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-sm text-white font-bold focus:outline-none focus:border-emerald-500">
      </div>
      <div>
        <label class="block text-xs text-gray-400 mb-1 font-semibold">Respuesta *</label>
        <textarea name="faqs[${idx}][answer]" rows="2" placeholder="Detalle claro y tranquilizador para los padres..." class="faq-answer-input w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500">${defaultA}</textarea>
      </div>
    `;
    return div;
  }

  function handleAddFaq() {
    const currentCount = container.querySelectorAll('.faq-admin-item').length;
    const newItem = createFaqItem(currentCount);
    container.appendChild(newItem);
    updateFaqNumbers();
    if (window.lucide) window.lucide.createIcons();
    newItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    const qInput = newItem.querySelector('.faq-question-input');
    if (qInput) qInput.focus();
  }

  if (addBtn) addBtn.addEventListener('click', handleAddFaq);
  if (addBottomBtn) addBottomBtn.addEventListener('click', handleAddFaq);

  // Delegación para mover y eliminar FAQs
  container.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.btn-remove-faq');
    if (removeBtn) {
      const item = removeBtn.closest('.faq-admin-item');
      if (item) {
        item.style.animation = 'fadeOut 0.2s ease forwards';
        setTimeout(() => {
          item.remove();
          updateFaqNumbers();
        }, 200);
      }
      return;
    }

    const moveUpBtn = e.target.closest('.btn-move-up-faq');
    if (moveUpBtn) {
      const item = moveUpBtn.closest('.faq-admin-item');
      if (item && item.previousElementSibling && item.previousElementSibling.classList.contains('faq-admin-item')) {
        item.parentNode.insertBefore(item, item.previousElementSibling);
        updateFaqNumbers();
      }
      return;
    }

    const moveDownBtn = e.target.closest('.btn-move-down-faq');
    if (moveDownBtn) {
      const item = moveDownBtn.closest('.faq-admin-item');
      if (item && item.nextElementSibling && item.nextElementSibling.classList.contains('faq-admin-item')) {
        item.parentNode.insertBefore(item.nextElementSibling, item);
        updateFaqNumbers();
      }
      return;
    }
  });

  // Guardar solo FAQs directamente
  if (saveSectionBtn) {
    saveSectionBtn.addEventListener('click', async () => {
      const orig = saveSectionBtn.innerHTML;
      saveSectionBtn.disabled = true;
      saveSectionBtn.innerHTML = '<span class="inline-block animate-spin mr-1.5">⟳</span> Guardando...';

      const faqs = [];
      container.querySelectorAll('.faq-admin-item').forEach(item => {
        const question = item.querySelector('.faq-question-input')?.value.trim() || item.querySelector('input[name*="[question]"]')?.value.trim() || '';
        const answer = item.querySelector('.faq-answer-input')?.value.trim() || item.querySelector('textarea[name*="[answer]"]')?.value.trim() || '';
        if (question || answer) {
          faqs.push({ question, answer });
        }
      });

      try {
        const res = await cmsFetch('/admin/api/content', {
          method: 'POST',
          body: JSON.stringify({ faqs, faq: faqs })
        });
        if (res.success) {
          showAdminToast('¡Preguntas Frecuentes guardadas exitosamente!', 'success');
          updateFaqNumbers();
        } else {
          showAdminToast(res.error || 'Error al guardar', 'error');
        }
      } catch (err) {
        showAdminToast(err.message || 'Error de conexión', 'error');
      } finally {
        saveSectionBtn.disabled = false;
        saveSectionBtn.innerHTML = orig;
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }

  updateFaqNumbers();
}

// 9. Modo Construcción / Pre-Lanzamiento
function initConstructionManager() {
  const toggle = document.getElementById('input-construction-enabled');
  const toggleTrack = document.getElementById('construction-toggle-track');
  const switchContainer = document.getElementById('construction-switch-container');
  const btnActivate = document.getElementById('btn-construction-activate');
  const btnDeactivate = document.getElementById('btn-construction-deactivate');
  const headerToggleBtn = document.getElementById('btn-header-toggle-construction');
  const headerStatusText = document.getElementById('header-construction-status-text');
  const statusPill = document.getElementById('construction-status-pill');
  const sidebarBadge = document.getElementById('sidebar-construction-badge');
  const topBadge = document.getElementById('top-construction-badge');
  const saveSectionBtn = document.getElementById('btn-save-construction-section');

  var _programmatic = false;
  var _toggling = false;

  function setUI(enabled) {
    if (toggle) {
      _programmatic = true;
      toggle.checked = enabled;
      _programmatic = false;
    }
    if (toggleTrack) {
      toggleTrack.classList.toggle('active', enabled);
      toggleTrack.setAttribute('aria-checked', String(enabled));
    }
    if (statusPill) {
      statusPill.textContent = enabled ? 'ACTIVADO' : 'DESACTIVADO';
      statusPill.className = enabled
        ? 'text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 animate-pulse'
        : 'text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400';
    }
    if (btnActivate) {
      btnActivate.classList.toggle('opacity-40', enabled);
      btnActivate.classList.toggle('pointer-events-none', enabled);
    }
    if (btnDeactivate) {
      btnDeactivate.classList.toggle('opacity-40', !enabled);
      btnDeactivate.classList.toggle('pointer-events-none', !enabled);
    }
    if (headerToggleBtn) {
      headerToggleBtn.className = enabled
        ? 'text-xs font-bold px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30'
        : 'text-xs font-bold px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white';
    }
    if (headerStatusText) {
      headerStatusText.textContent = enabled ? 'ON' : 'OFF';
      headerStatusText.className = enabled ? 'font-black text-amber-400' : 'font-black text-slate-400';
    }
    if (topBadge) {
      topBadge.classList.toggle('hidden', !enabled);
      topBadge.classList.toggle('sm:flex', enabled);
    }
    if (sidebarBadge) {
      sidebarBadge.textContent = enabled ? 'ACTIVO' : 'OFF';
      sidebarBadge.className = enabled
        ? 'text-[9px] px-1.5 py-0.5 rounded-full font-black bg-amber-500 text-slate-950 animate-pulse'
        : 'text-[9px] px-1.5 py-0.5 rounded-full font-black bg-slate-800 text-slate-400';
    }
  }

  async function doToggle(desiredState) {
    if (_toggling) return;
    _toggling = true;

    var current = toggle ? toggle.checked : false;
    var target = (typeof desiredState === 'boolean') ? desiredState : !current;
    setUI(target);

    try {
      var res = await cmsFetch('/admin/api/toggle-construction', {
        method: 'POST',
        body: JSON.stringify({ enabled: target })
      });
      if (res.success) {
        showAdminToast(res.message, target ? 'warning' : 'success');
        setUI(!!res.enabled);
      } else {
        showAdminToast(res.error || 'Error al cambiar estado', 'error');
        setUI(current);
      }
    } catch (err) {
      showAdminToast(err.message || 'Error de conexión', 'error');
      setUI(current);
    } finally {
      _toggling = false;
      if (window.lucide) window.lucide.createIcons();
    }
  }

  function handleSwitchClick(e) {
    if (e.target === toggle) return;
    e.preventDefault();
    e.stopPropagation();
    var currentState = toggle ? toggle.checked : false;
    doToggle(!currentState);
  }

  if (switchContainer) {
    switchContainer.addEventListener('click', handleSwitchClick);
  }

  if (toggle) {
    toggle.addEventListener('change', function() {
      if (_programmatic) return;
      doToggle(toggle.checked);
    });
  }

  if (btnActivate) {
    btnActivate.addEventListener('click', function(e) {
      e.preventDefault();
      doToggle(true);
    });
  }

  if (btnDeactivate) {
    btnDeactivate.addEventListener('click', function(e) {
      e.preventDefault();
      doToggle(false);
    });
  }

  if (headerToggleBtn) {
    headerToggleBtn.addEventListener('click', function(e) {
      e.preventDefault();
      var isCurrentlyOn = toggle ? toggle.checked : (headerStatusText && headerStatusText.textContent.trim() === 'ON');
      doToggle(!isCurrentlyOn);
    });
  }

  if (saveSectionBtn) {
    saveSectionBtn.addEventListener('click', async function() {
      var orig = saveSectionBtn.innerHTML;
      saveSectionBtn.disabled = true;
      saveSectionBtn.innerHTML = '<span class="inline-block animate-spin mr-1.5">⟳</span> Guardando...';
      function gv(id) { var el = document.getElementById(id); return el ? el.value : ''; }
      var construction = {
        enabled: toggle ? toggle.checked : false,
        badge: gv('input-construction-badge'),
        expectedDate: gv('input-construction-expectedDate'),
        title: gv('input-construction-title'),
        subtitle: gv('input-construction-subtitle'),
        targetDate: gv('input-construction-targetDate'),
        contactWhatsapp: gv('input-construction-whatsapp'),
        showCountdown: document.getElementById('input-construction-showCountdown') ? document.getElementById('input-construction-showCountdown').checked : true,
        notifyForm: document.getElementById('input-construction-notifyForm') ? document.getElementById('input-construction-notifyForm').checked : true
      };
      try {
        var res = await cmsFetch('/admin/api/content', { method: 'POST', body: JSON.stringify({ construction: construction }) });
        if (res.success) {
          showAdminToast('¡Configuración de Modo Construcción guardada exitosamente!', 'success');
          setUI(construction.enabled);
        } else {
          showAdminToast(res.error || 'No se pudo guardar', 'error');
        }
      } catch(err) {
        showAdminToast(err.message || 'Error de conexión', 'error');
      } finally {
        saveSectionBtn.disabled = false;
        saveSectionBtn.innerHTML = orig;
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }

  if (toggle) { setUI(toggle.checked); }
}

// 18. Vista Previa en Vivo Interactiva de la Portada (Hero)
function initHeroLivePreview() {
  const prefixInput = document.getElementById('input-headlinePrefix');
  const gradientInput = document.getElementById('input-headlineGradient');
  const subheadlineInput = document.getElementById('input-subheadline');
  const badgeInput = document.getElementById('input-badgeText');
  const noticeInput = document.getElementById('input-statsNotice');

  const prefixPreview = document.getElementById('hero-preview-prefix');
  const gradientPreview = document.getElementById('hero-preview-gradient');
  const subheadlinePreview = document.getElementById('hero-preview-subheadline');
  const badgePreview = document.getElementById('hero-preview-badge');
  const noticePreview = document.getElementById('hero-preview-notice');

  if (prefixInput && prefixPreview) {
    prefixInput.addEventListener('input', () => {
      prefixPreview.textContent = prefixInput.value || 'La Carrera Más Alegre del Año para';
    });
  }
  if (gradientInput && gradientPreview) {
    gradientInput.addEventListener('input', () => {
      gradientPreview.textContent = gradientInput.value || 'Pequeños Campeones & Familias';
    });
  }
  if (subheadlineInput && subheadlinePreview) {
    subheadlineInput.addEventListener('input', () => {
      subheadlinePreview.textContent = subheadlineInput.value || '';
    });
  }
  if (badgeInput && badgePreview) {
    badgeInput.addEventListener('input', () => {
      badgePreview.textContent = badgeInput.value || '';
    });
  }
  if (noticeInput && noticePreview) {
    noticeInput.addEventListener('input', () => {
      noticePreview.textContent = noticeInput.value || '';
    });
  }
}

// 19. Vista Previa en Vivo Interactiva de la Pestaña del Navegador (Browser Tab & Favicon)
function initBrowserTabLivePreview() {
  const tabTitleInput = document.getElementById('input-tabTitle');
  const metaTitleInput = document.getElementById('input-metaTitle');
  const faviconUrlInput = document.getElementById('input-faviconUrl');
  const previewTabTitle = document.getElementById('preview-tab-title');
  const previewTabFavicon = document.getElementById('preview-tab-favicon');
  const previewFaviconImg = document.getElementById('preview-favicon-img');

  function updateTitle(val) {
    const displayVal = val || 'KidsRun 2026 | La Gran Corrida Infantil y Familiar';
    if (previewTabTitle) previewTabTitle.textContent = displayVal;
    if (tabTitleInput && tabTitleInput.value !== val) tabTitleInput.value = val;
    if (metaTitleInput && metaTitleInput.value !== val) metaTitleInput.value = val;
  }

  if (tabTitleInput) {
    tabTitleInput.addEventListener('input', () => updateTitle(tabTitleInput.value));
  }
  if (metaTitleInput) {
    metaTitleInput.addEventListener('input', () => updateTitle(metaTitleInput.value));
  }

  if (faviconUrlInput) {
    faviconUrlInput.addEventListener('input', () => {
      const url = faviconUrlInput.value || '/images/default-favicon.svg';
      if (previewTabFavicon) previewTabFavicon.src = url;
      if (previewFaviconImg) previewFaviconImg.src = url;
    });
  }
}
