// Interactividad de la Landing Page para la Corrida Infantil KidsRun

document.addEventListener('DOMContentLoaded', () => {
  // 1. Inicializar iconos Lucide
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // 2. Fondo interactivo de confeti y partículas
  initHeroCanvas();

  // 3. Navbar dinámico al hacer scroll
  initNavbarScroll();

  // 4. Menú móvil
  initMobileMenu();

  // 5. Contador Regresivo en Vivo
  initCountdownTimer();

  // 6. Visor Lightbox y Carrusel para la Galería de Imágenes
  initLightbox();
  initGalleryCarousel();

  // 7. Acordeón de FAQs
  initFaqAccordion();

  // 8. Formulario de Pre-Inscripción / Contacto
  initContactForm();

  // 9. Navegación suave
  initSmoothScroll();

  // 10. Conmutador de Modo Claro / Oscuro (White Mode)
  initThemeToggle();

  // 11. Barra flotante táctil inferior para móviles (Sticky Bottom CTA)
  initMobileStickyCta();
});

// 10. Alternar Tema Claro y Oscuro
function initThemeToggle() {
  const toggleBtns = document.querySelectorAll('#theme-toggle-btn, #theme-toggle-mobile');

  function toggle() {
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('kidsrun_theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('kidsrun_theme', 'dark');
    }
  }

  toggleBtns.forEach(btn => {
    btn.addEventListener('click', toggle);
  });
}

// Sistema de Notificaciones Toast
function showToast(message, type = 'success') {
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
  }, 4500);
}

// 5. Contador Regresivo (Countdown Timer)
function initCountdownTimer() {
  const container = document.getElementById('countdown-timer');
  if (!container) return;

  const targetDateStr = container.getAttribute('data-target');
  const targetDate = new Date(targetDateStr).getTime();

  const daysEl = document.getElementById('cd-days');
  const hoursEl = document.getElementById('cd-hours');
  const minutesEl = document.getElementById('cd-minutes');
  const secondsEl = document.getElementById('cd-seconds');
  const expiredMsg = document.getElementById('countdown-expired');

  function update() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance <= 0) {
      if (daysEl) daysEl.textContent = '00';
      if (hoursEl) hoursEl.textContent = '00';
      if (minutesEl) minutesEl.textContent = '00';
      if (secondsEl) secondsEl.textContent = '00';
      if (expiredMsg) expiredMsg.classList.remove('hidden');
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const pad = (n) => String(n).padStart(2, '0');

    if (daysEl) daysEl.textContent = pad(days);
    if (hoursEl) hoursEl.textContent = pad(hours);
    if (minutesEl) minutesEl.textContent = pad(minutes);
    if (secondsEl) secondsEl.textContent = pad(seconds);
  }

  update();
  setInterval(update, 1000);
}

// 6. Carrusel Interactivo de Galería de Imágenes
function initGalleryCarousel() {
  const track = document.getElementById('gallery-track');
  const prevBtn = document.getElementById('gallery-prev-btn');
  const nextBtn = document.getElementById('gallery-next-btn');
  const counterSlide = document.getElementById('gallery-current-slide');
  const totalSlide = document.getElementById('gallery-total-slides');
  const dots = document.querySelectorAll('.gallery-dot');
  const viewToggle = document.getElementById('gallery-view-toggle');
  const toggleLabel = document.getElementById('gallery-toggle-label');

  if (!track) return;

  const items = track.querySelectorAll('.gallery-item');
  if (totalSlide) totalSlide.textContent = items.length;

  function getStep() {
    const firstItem = track.querySelector('.gallery-item');
    if (!firstItem) return 320;
    return firstItem.offsetWidth + 24; // ancho + gap
  }

  function updateActiveState() {
    const step = getStep();
    if (!step) return;
    const scrollLeft = track.scrollLeft;
    const currentIndex = Math.min(items.length - 1, Math.max(0, Math.round(scrollLeft / step)));

    if (counterSlide) counterSlide.textContent = currentIndex + 1;

    // Actualizar dots
    dots.forEach((dot, idx) => {
      if (idx === currentIndex) {
        dot.classList.add('w-8', 'bg-blue-600', 'dark:bg-yellow-400');
        dot.classList.remove('w-2.5', 'bg-slate-300', 'dark:bg-gray-700');
      } else {
        dot.classList.remove('w-8', 'bg-blue-600', 'dark:bg-yellow-400');
        dot.classList.add('w-2.5', 'bg-slate-300', 'dark:bg-gray-700');
      }
    });

    // Deshabilitar botones en límites
    if (prevBtn) prevBtn.disabled = scrollLeft <= 10;
    if (nextBtn) {
      const maxScroll = track.scrollWidth - track.clientWidth - 10;
      nextBtn.disabled = scrollLeft >= maxScroll;
    }
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      track.scrollBy({ left: -getStep(), behavior: 'smooth' });
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      track.scrollBy({ left: getStep(), behavior: 'smooth' });
    });
  }

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const targetIdx = parseInt(dot.getAttribute('data-slide-to'), 10) || 0;
      track.scrollTo({ left: targetIdx * getStep(), behavior: 'smooth' });
    });
  });

  let scrollTimeout;
  track.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(updateActiveState, 50);
  });

  // Soporte de arrastre táctil y con mouse (Drag-to-Scroll)
  let isDown = false;
  let startX = 0;
  let scrollStart = 0;

  track.addEventListener('mousedown', (e) => {
    isDown = true;
    startX = e.pageX - track.offsetLeft;
    scrollStart = track.scrollLeft;
  });

  window.addEventListener('mouseup', () => {
    if (isDown) {
      isDown = false;
      updateActiveState();
    }
  });

  track.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - track.offsetLeft;
    const walk = (x - startX) * 1.5;
    track.scrollLeft = scrollStart - walk;
  });

  // Alternar entre modo carrusel y modo cuadrícula
  let isGrid = false;
  if (viewToggle) {
    viewToggle.addEventListener('click', () => {
      isGrid = !isGrid;
      const dotsContainer = document.getElementById('gallery-dots');
      const counterBadge = document.getElementById('gallery-counter-badge');
      const prevNextGroup = prevBtn?.parentElement;

      if (isGrid) {
        track.classList.remove('flex', 'overflow-x-auto', 'no-scrollbar', 'snap-x', 'snap-mandatory', 'cursor-grab');
        track.classList.add('grid', 'grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3', 'gap-6');
        items.forEach(it => {
          it.classList.remove('shrink-0', 'w-[85vw]', 'sm:w-[45vw]', 'lg:w-[calc(33.333%-16px)]', 'snap-start');
        });
        if (dotsContainer) dotsContainer.classList.add('hidden');
        if (counterBadge) counterBadge.classList.add('hidden');
        if (prevNextGroup) prevNextGroup.classList.add('hidden');
        viewToggle.innerHTML = '<i data-lucide="sliders-horizontal" class="w-4 h-4"></i><span id="gallery-toggle-label">Ver en carrusel</span>';
      } else {
        track.classList.add('flex', 'overflow-x-auto', 'no-scrollbar', 'snap-x', 'snap-mandatory', 'cursor-grab');
        track.classList.remove('grid', 'grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3', 'gap-6');
        items.forEach(it => {
          it.classList.add('shrink-0', 'w-[85vw]', 'sm:w-[45vw]', 'lg:w-[calc(33.333%-16px)]', 'snap-start');
        });
        if (dotsContainer) dotsContainer.classList.remove('hidden');
        if (counterBadge) counterBadge.classList.remove('hidden');
        if (prevNextGroup) prevNextGroup.classList.remove('hidden');
        viewToggle.innerHTML = '<i data-lucide="layout-grid" class="w-4 h-4"></i><span id="gallery-toggle-label">Ver cuadrícula</span>';
        updateActiveState();
      }
      if (window.lucide) window.lucide.createIcons();
    });
  }

  updateActiveState();
}

// 7. Visor Lightbox con Navegación de Carrusel Completa
function initLightbox() {
  const modal = document.getElementById('lightbox-modal');
  const modalImg = document.getElementById('lightbox-img');
  const modalTitle = document.getElementById('lightbox-title');
  const modalCaption = document.getElementById('lightbox-caption');
  const modalCounter = document.getElementById('lightbox-counter');
  const modalCategory = document.getElementById('lightbox-category');
  const closeBtn = document.getElementById('lightbox-close');
  const prevBtn = document.getElementById('lightbox-prev');
  const nextBtn = document.getElementById('lightbox-next');

  if (!modal || !modalImg) return;

  const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
  let currentIndex = 0;

  function renderSlide(idx) {
    if (galleryItems.length === 0) return;
    if (idx < 0) idx = galleryItems.length - 1;
    if (idx >= galleryItems.length) idx = 0;
    currentIndex = idx;

    const item = galleryItems[currentIndex];
    const src = item.getAttribute('data-img-src');
    const title = item.getAttribute('data-img-title') || '';
    const caption = item.getAttribute('data-img-caption') || '';
    const category = item.getAttribute('data-img-category') || 'KidsRun';

    modalImg.style.opacity = '0.3';
    modalImg.src = src;
    modalImg.onload = () => { modalImg.style.opacity = '1'; };
    modalImg.alt = title;

    if (modalTitle) modalTitle.textContent = title;
    if (modalCaption) modalCaption.textContent = caption;
    if (modalCategory) modalCategory.textContent = category;
    if (modalCounter) modalCounter.textContent = `Foto ${currentIndex + 1} de ${galleryItems.length}`;
  }

  galleryItems.forEach((item, idx) => {
    item.addEventListener('click', () => {
      renderSlide(idx);
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    });
  });

  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      renderSlide(currentIndex - 1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      renderSlide(currentIndex + 1);
    });
  }

  function closeModal() {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    modalImg.src = '';
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.id === 'lightbox-modal') closeModal();
  });

  // Navegación por teclado (Flechas Izquierda / Derecha / Escape)
  document.addEventListener('keydown', (e) => {
    if (modal.classList.contains('hidden')) return;

    if (e.key === 'ArrowLeft') {
      renderSlide(currentIndex - 1);
    } else if (e.key === 'ArrowRight') {
      renderSlide(currentIndex + 1);
    } else if (e.key === 'Escape') {
      closeModal();
    }
  });

  // Soporte de gestos táctiles Swipe en el visor de pantalla completa
  let touchStartX = 0;
  let touchEndX = 0;

  modal.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  modal.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchEndX - touchStartX;
    if (Math.abs(diff) > 45) {
      if (diff > 0) {
        renderSlide(currentIndex - 1); // Deslizó a la derecha -> anterior
      } else {
        renderSlide(currentIndex + 1); // Deslizó a la izquierda -> siguiente
      }
    }
  }, { passive: true });
}

// 2. Canvas interactivo de confeti y partículas deportivas
function initHeroCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];
  let mouse = { x: null, y: null, radius: 140 };

  const colors = [
    'rgba(29, 78, 216, ',   // Azul KidsRun
    'rgba(59, 130, 246, ',  // Azul Claro
    'rgba(250, 204, 21, ',  // Amarillo Oro
    'rgba(239, 68, 68, ',   // Rojo Energía
    'rgba(249, 115, 22, '   // Naranja Sol
  ];

  function resize() {
    width = canvas.width = canvas.parentElement.offsetWidth;
    height = canvas.height = canvas.parentElement.offsetHeight;
    createParticles();
  }

  window.addEventListener('resize', resize);
  resize();

  window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  });

  function createParticles() {
    particles = [];
    const count = Math.min(Math.floor((width * height) / 18000), 55);
    for (let i = 0; i < count; i++) {
      const colorBase = colors[Math.floor(Math.random() * colors.length)];
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        radius: Math.random() * 3 + 1.5,
        color: colorBase + (Math.random() * 0.35 + 0.15) + ')'
      });
    }
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      if (mouse.x !== null && mouse.y !== null) {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouse.radius) {
          const force = (1 - dist / mouse.radius) * 0.7;
          p.x -= (dx / dist) * force;
          p.y -= (dy / dist) * force;
        }
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }

    requestAnimationFrame(animate);
  }

  animate();
}

// 3. Navbar dinámico al hacer scroll
function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      navbar.classList.add('bg-gray-950/85', 'backdrop-blur-md', 'border-b', 'border-white/10', 'shadow-2xl');
      navbar.classList.remove('bg-transparent');
    } else {
      navbar.classList.remove('bg-gray-950/85', 'backdrop-blur-md', 'border-b', 'border-white/10', 'shadow-2xl');
      navbar.classList.add('bg-transparent');
    }
  });
}

// 4. Menú móvil
function initMobileMenu() {
  const btn = document.getElementById('mobile-menu-btn');
  const menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('hidden');
  });

  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.add('hidden');
    });
  });

  // Cerrar al pulsar fuera del menú
  document.addEventListener('click', (e) => {
    if (!menu.classList.contains('hidden') && !menu.contains(e.target) && !btn.contains(e.target)) {
      menu.classList.add('hidden');
    }
  });
}

// 11. Barra flotante táctil inferior para móviles (Sticky Bottom CTA)
function initMobileStickyCta() {
  const ctaBar = document.getElementById('mobile-sticky-cta');
  if (!ctaBar) return;

  const hero = document.getElementById('hero');
  let threshold = 350;

  function calculateThreshold() {
    if (hero) {
      threshold = hero.offsetTop + (hero.offsetHeight * 0.4);
    }
  }

  calculateThreshold();
  window.addEventListener('resize', calculateThreshold, { passive: true });

  let ticking = false;
  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        if (window.scrollY > threshold) {
          ctaBar.classList.remove('translate-y-28', 'opacity-0', 'pointer-events-none');
          ctaBar.classList.add('translate-y-0', 'opacity-100', 'pointer-events-auto');
        } else {
          ctaBar.classList.add('translate-y-28', 'opacity-0', 'pointer-events-none');
          ctaBar.classList.remove('translate-y-0', 'opacity-100', 'pointer-events-auto');
        }
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// 7. Acordeón de FAQs
function initFaqAccordion() {
  document.querySelectorAll('.faq-item').forEach(item => {
    const trigger = item.querySelector('.faq-trigger');
    const content = item.querySelector('.faq-content');
    const icon = item.querySelector('.faq-icon');

    if (!trigger || !content) return;

    trigger.addEventListener('click', () => {
      const isOpen = !content.classList.contains('hidden');

      document.querySelectorAll('.faq-content').forEach(c => c.classList.add('hidden'));
      document.querySelectorAll('.faq-icon').forEach(i => i.style.transform = 'rotate(0deg)');

      if (!isOpen) {
        content.classList.remove('hidden');
        if (icon) icon.style.transform = 'rotate(180deg)';
      }
    });
  });
}

// 8. Formulario de Pre-Inscripción
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <span class="inline-block animate-spin mr-2">⟳</span> Enviando Mensaje...
    `;

    try {
      const csrfToken = form.querySelector('input[name="csrfToken"]')?.value || '';
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify(data)
      });

      const json = await res.json();

      if (res.ok && json.success) {
        showToast(json.message || '¡Mensaje recibido! Te responderemos muy pronto.', 'success');
        form.reset();
      } else {
        showToast(json.error || 'No se pudo enviar el mensaje. Inténtalo nuevamente.', 'error');
      }
    } catch (err) {
      showToast('Error de conexión. Inténtalo nuevamente.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  });
}

// 9. Navegación suave
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}
