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

  // 8. Manejo de Subida y Optimización de Imágenes
  initImageUploadHandlers();
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
        b.classList.remove('bg-blue-600', 'text-white', 'shadow-md');
        b.classList.add('text-gray-400', 'hover:text-white', 'hover:bg-gray-900');
      });
      btn.classList.add('bg-blue-600', 'text-white', 'shadow-md');
      btn.classList.remove('text-gray-400', 'hover:text-white', 'hover:bg-gray-900');

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
    gallery,
    categories,
    pricing: { plans },
    testimonials,
    faqs,
    footer,
    sponsors,
    venue,
    sections,
    contact: {
      forwardEmail: getVal('input-contactForwardEmail'),
      email: getVal('input-contactEmail'),
      phone: getVal('input-contactPhone'),
      location: getVal('input-contactLocation'),
      resendApiKey: getVal('input-contactResendApiKey'),
      resendFromEmail: getVal('input-contactResendFromEmail')
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
function initRacesManager() {
  const openBtn = document.getElementById('btn-open-new-race');
  const cancelBtn = document.getElementById('btn-cancel-new-race');
  const panel = document.getElementById('new-race-panel');
  const submitBtn = document.getElementById('btn-submit-new-race');

  if (openBtn && panel) {
    openBtn.addEventListener('click', () => {
      panel.classList.remove('hidden');
      panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  if (cancelBtn && panel) {
    cancelBtn.addEventListener('click', () => {
      panel.classList.add('hidden');
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      const name = document.getElementById('input-newRaceName')?.value.trim();
      const date = document.getElementById('input-newRaceDate')?.value;
      const time = document.getElementById('input-newRaceTime')?.value.trim() || '09:00 AM';
      const location = document.getElementById('input-newRaceLocation')?.value.trim();
      const maxParticipants = document.getElementById('input-newRaceMax')?.value || 500;
      const isActive = document.getElementById('input-newRaceActive')?.checked;

      if (!name || !date) {
        showAdminToast('Por favor completa el nombre y la fecha de la corrida', 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Guardando...';

      try {
        const json = await cmsFetch('/admin/api/races', {
          method: 'POST',
          body: JSON.stringify({
            name,
            date,
            time,
            location,
            status: isActive ? 'active' : 'planned',
            maxParticipants
          })
        });

        if (json.success) {
          showAdminToast(json.message, 'success');
          setTimeout(() => window.location.reload(), 1200);
        } else {
          showAdminToast(json.error || 'No se pudo crear la corrida', 'error');
        }
      } catch (err) {
        showAdminToast('Error de conexión al guardar corrida', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Guardar y Publicar Corrida';
      }
    });
  }

  // Botones para activar corrida
  document.querySelectorAll('.btn-activate-race').forEach(btn => {
    btn.addEventListener('click', async () => {
      const raceId = btn.getAttribute('data-race-id');
      if (!confirm('¿Deseas activar esta corrida como la oficial visible en la portada y el formulario?')) return;

      try {
        const json = await cmsFetch(`/admin/api/races/${raceId}/activate`, {
          method: 'POST'
        });

        if (json.success) {
          showAdminToast(json.message, 'success');
          setTimeout(() => window.location.reload(), 1000);
        } else {
          showAdminToast(json.error || 'No se pudo activar la corrida', 'error');
        }
      } catch (err) {
        showAdminToast('Error de conexión', 'error');
      }
    });
  });
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

// Registrar initRacesManager al cargar DOM
document.addEventListener('DOMContentLoaded', () => {
  initRacesManager();
});

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

      // Si es un logo, auto-guardar inmediatamente para reemplazar el logo por defecto en la web
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
        showAdminToast('Logo limpiado. Presiona "Guardar" para confirmar.', 'info');
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

document.addEventListener('DOMContentLoaded', () => {
  initSponsorsManager();
});

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

document.addEventListener('DOMContentLoaded', () => {
  initSectionsManager();
});

