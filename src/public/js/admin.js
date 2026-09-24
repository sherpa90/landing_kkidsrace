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

  // 9. Modo Construcción
  initConstructionManager();
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

document.addEventListener('DOMContentLoaded', () => {
  initRutScanner();
});

// 12. Gestor de Usuarios y Accesos (SOLO Administrador)
function initUsersManager() {
  const openCreateBtn = document.getElementById('btn-open-create-user');
  const cancelBtn = document.getElementById('btn-cancel-user-form');
  const formPanel = document.getElementById('user-form-panel');
  const saveBtn = document.getElementById('btn-save-user');
  const formTitle = document.getElementById('user-form-title');
  const editIdInput = document.getElementById('user-edit-id');
  const nameInput = document.getElementById('user-input-name');
  const usernameInput = document.getElementById('user-input-username');
  const roleInput = document.getElementById('user-input-role');
  const passwordInput = document.getElementById('user-input-password');
  const passwordLabel = document.getElementById('user-label-password');
  const passwordHint = document.getElementById('user-hint-password');
  const container = document.getElementById('users-list-container');

  if (!openCreateBtn || !formPanel) return;

  function resetForm() {
    editIdInput.value = '';
    nameInput.value = '';
    usernameInput.value = '';
    usernameInput.disabled = false;
    roleInput.value = 'editor';
    passwordInput.value = '';
    passwordLabel.textContent = 'Contraseña *';
    passwordHint.classList.add('hidden');
    formTitle.innerHTML = `<i data-lucide="user-plus" class="w-4 h-4 text-emerald-400"></i><span>Crear Nuevo Usuario</span>`;
    if (window.lucide) window.lucide.createIcons();
  }

  openCreateBtn.addEventListener('click', () => {
    resetForm();
    formPanel.classList.remove('hidden');
    formPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  cancelBtn.addEventListener('click', () => {
    formPanel.classList.add('hidden');
    resetForm();
  });

  // Guardar (Crear o Actualizar)
  saveBtn.addEventListener('click', async () => {
    const isEdit = !!editIdInput.value;
    const name = nameInput.value.trim();
    const username = usernameInput.value.trim();
    const role = roleInput.value;
    const password = passwordInput.value;

    if (!name) {
      return showAdminToast('Por favor ingresa el nombre de la persona', 'error');
    }
    if (!isEdit && (!username || username.length < 3)) {
      return showAdminToast('El usuario debe tener al menos 3 caracteres', 'error');
    }
    if (!isEdit && (!password || password.length < 12)) {
      return showAdminToast('La contraseña debe tener al menos 12 caracteres', 'error');
    }
    if (isEdit && password && password.length < 12) {
      return showAdminToast('La nueva contraseña debe tener al menos 12 caracteres', 'error');
    }

    try {
      let url = '/admin/api/users';
      let method = 'POST';
      let body = { name, username, role, password };

      if (isEdit) {
        url = `/admin/api/users/${editIdInput.value}`;
        method = 'PUT';
        body = { name, role };
        if (password) body.password = password;
      }

      const res = await cmsFetch(url, {
        method,
        body: JSON.stringify(body)
      });

      if (res.success) {
        showAdminToast(res.message || 'Usuario guardado exitosamente', 'success');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        showAdminToast(res.error || 'No se pudo guardar el usuario', 'error');
      }
    } catch (err) {
      showAdminToast(err.message || 'Error de conexión', 'error');
    }
  });

  // Delegación para Editar y Eliminar
  if (container) {
    container.addEventListener('click', async (e) => {
      // Editar
      const editBtn = e.target.closest('.btn-edit-user');
      if (editBtn) {
        const id = editBtn.getAttribute('data-id');
        const username = editBtn.getAttribute('data-username');
        const name = editBtn.getAttribute('data-name');
        const role = editBtn.getAttribute('data-role');

        editIdInput.value = id;
        nameInput.value = name;
        usernameInput.value = username;
        usernameInput.disabled = true; // El username es identificador único
        roleInput.value = role;
        passwordInput.value = '';
        passwordLabel.textContent = 'Nueva Contraseña (Opcional)';
        passwordHint.classList.remove('hidden');

        formTitle.innerHTML = `<i data-lucide="edit-3" class="w-4 h-4 text-emerald-400"></i><span>Editar Usuario: @${username}</span>`;
        if (window.lucide) window.lucide.createIcons();

        formPanel.classList.remove('hidden');
        formPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
      }

      // Eliminar
      const deleteBtn = e.target.closest('.btn-delete-user');
      if (deleteBtn) {
        const id = deleteBtn.getAttribute('data-id');
        const username = deleteBtn.getAttribute('data-username');

        if (!confirm(`¿Estás seguro de eliminar el usuario "@${username}"? Esta acción revocará su acceso de inmediato.`)) {
          return;
        }

        try {
          const res = await cmsFetch(`/admin/api/users/${id}`, {
            method: 'DELETE'
          });

          if (res.success) {
            showAdminToast(`Usuario "@${username}" eliminado correctamente`, 'success');
            const card = deleteBtn.closest('.user-card-item');
            if (card) card.remove();
          } else {
            showAdminToast(res.error || 'Error al eliminar usuario', 'error');
          }
        } catch (err) {
          showAdminToast(err.message || 'Error de conexión', 'error');
        }
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initUsersManager();
});

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

  const updateConstructionUI = (enabled) => {
    // 1. Input checkbox nativo
    if (toggle) {
      toggle.checked = enabled;
    }

    // 2. Track & Thumb CSS
    if (toggleTrack) {
      if (enabled) {
        toggleTrack.classList.add('active');
        toggleTrack.setAttribute('aria-checked', 'true');
      } else {
        toggleTrack.classList.remove('active');
        toggleTrack.setAttribute('aria-checked', 'false');
      }
    }

    // 3. Status Pill dentro de la pestaña
    if (statusPill) {
      statusPill.textContent = enabled ? 'ACTIVADO' : 'DESACTIVADO';
      if (enabled) {
        statusPill.className = 'text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 animate-pulse';
      } else {
        statusPill.className = 'text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400';
      }
    }

    // 4. Botones directos Activar / Desactivar
    if (btnActivate) {
      if (enabled) {
        btnActivate.classList.add('opacity-40', 'pointer-events-none');
      } else {
        btnActivate.classList.remove('opacity-40', 'pointer-events-none');
      }
    }
    if (btnDeactivate) {
      if (enabled) {
        btnDeactivate.classList.remove('opacity-40', 'pointer-events-none');
      } else {
        btnDeactivate.classList.add('opacity-40', 'pointer-events-none');
      }
    }

    // 5. Botón de cabecera (Header Toggle)
    if (headerToggleBtn) {
      if (enabled) {
        headerToggleBtn.className = 'text-xs font-bold px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30';
      } else {
        headerToggleBtn.className = 'text-xs font-bold px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white';
      }
    }
    if (headerStatusText) {
      headerStatusText.textContent = enabled ? 'ON' : 'OFF';
      headerStatusText.className = enabled ? 'font-black text-amber-400' : 'font-black text-slate-400';
    }

    // 6. Badge en cabecera
    if (topBadge) {
      if (enabled) {
        topBadge.classList.remove('hidden');
        topBadge.classList.add('flex');
      } else {
        topBadge.classList.add('hidden');
        topBadge.classList.remove('flex');
      }
    }

    // 7. Badge en barra lateral
    if (sidebarBadge) {
      sidebarBadge.textContent = enabled ? 'ACTIVO' : 'OFF';
      if (enabled) {
        sidebarBadge.className = 'text-[9px] px-1.5 py-0.5 rounded-full font-black bg-amber-500 text-slate-950 animate-pulse';
      } else {
        sidebarBadge.className = 'text-[9px] px-1.5 py-0.5 rounded-full font-black bg-slate-800 text-slate-400';
      }
    }
  };

  let isToggling = false;

  const executeToggle = async (desiredState) => {
    if (isToggling) return;
    isToggling = true;

    const currentState = toggle ? toggle.checked : false;
    const targetState = (typeof desiredState === 'boolean') ? desiredState : !currentState;

    // Actualización visual inmediata
    updateConstructionUI(targetState);

    try {
      const res = await cmsFetch('/admin/api/toggle-construction', {
        method: 'POST',
        body: JSON.stringify({ enabled: targetState })
      });

      if (res.success) {
        showAdminToast(res.message, targetState ? 'warning' : 'success');
        updateConstructionUI(res.enabled);
      } else {
        showAdminToast(res.error || 'Error al cambiar estado', 'error');
        updateConstructionUI(currentState);
      }
    } catch (err) {
      showAdminToast(err.message || 'Error de conexión', 'error');
      updateConstructionUI(currentState);
    } finally {
      isToggling = false;
      if (window.lucide) window.lucide.createIcons();
    }
  };

  // Clic en el Switch Container
  if (switchContainer) {
    switchContainer.addEventListener('click', (e) => {
      e.preventDefault();
      executeToggle();
    });
  }

  // Cambio en el input checkbox
  if (toggle) {
    toggle.addEventListener('change', () => {
      executeToggle(toggle.checked);
    });
  }

  // Clic en botón Activar
  if (btnActivate) {
    btnActivate.addEventListener('click', () => {
      executeToggle(true);
    });
  }

  // Clic en botón Desactivar
  if (btnDeactivate) {
    btnDeactivate.addEventListener('click', () => {
      executeToggle(false);
    });
  }

  // Clic en botón de Cabecera
  if (headerToggleBtn) {
    headerToggleBtn.addEventListener('click', () => {
      executeToggle();
    });
  }

  // Guardado de la sección completa
  if (saveSectionBtn) {
    saveSectionBtn.addEventListener('click', async () => {
      const originalText = saveSectionBtn.innerHTML;
      saveSectionBtn.disabled = true;
      saveSectionBtn.innerHTML = '<span class="inline-block animate-spin mr-1.5">⟳</span> Guardando...';

      const getVal = (id) => {
        const el = document.getElementById(id);
        return el ? el.value : '';
      };

      const construction = {
        enabled: toggle ? toggle.checked : false,
        badge: getVal('input-construction-badge'),
        expectedDate: getVal('input-construction-expectedDate'),
        title: getVal('input-construction-title'),
        subtitle: getVal('input-construction-subtitle'),
        targetDate: getVal('input-construction-targetDate'),
        contactWhatsapp: getVal('input-construction-whatsapp'),
        showCountdown: document.getElementById('input-construction-showCountdown')?.checked ?? true,
        notifyForm: document.getElementById('input-construction-notifyForm')?.checked ?? true
      };

      try {
        const res = await cmsFetch('/admin/api/content', {
          method: 'POST',
          body: JSON.stringify({ construction })
        });

        if (res.success) {
          showAdminToast('¡Configuración de Modo Construcción guardada exitosamente!', 'success');
          updateConstructionUI(construction.enabled);
        } else {
          showAdminToast(res.error || 'No se pudo guardar la configuración', 'error');
        }
      } catch (err) {
        showAdminToast(err.message || 'Error de conexión', 'error');
      } finally {
        saveSectionBtn.disabled = false;
        saveSectionBtn.innerHTML = originalText;
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }

  // Sincronizar estado inicial al arrancar
  if (toggle) {
    updateConstructionUI(toggle.checked);
  }
}

// Inicialización de respaldo para Modo Construcción
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initConstructionManager);
} else {
  initConstructionManager();
}


