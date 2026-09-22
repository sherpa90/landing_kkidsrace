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

  // 6. Visor Lightbox para la Galería de Imágenes
  initLightbox();

  // 7. Acordeón de FAQs
  initFaqAccordion();

  // 8. Formulario de Pre-Inscripción / Contacto
  initContactForm();

  // 9. Navegación suave
  initSmoothScroll();

  // 10. Conmutador de Modo Claro / Oscuro (White Mode)
  initThemeToggle();
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

// 6. Visor Lightbox para la Galería de Imágenes
function initLightbox() {
  const modal = document.getElementById('lightbox-modal');
  const modalImg = document.getElementById('lightbox-img');
  const modalTitle = document.getElementById('lightbox-title');
  const modalCaption = document.getElementById('lightbox-caption');
  const closeBtn = document.getElementById('lightbox-close');

  if (!modal || !modalImg) return;

  document.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', () => {
      const src = item.getAttribute('data-img-src');
      const title = item.getAttribute('data-img-title');
      const caption = item.getAttribute('data-img-caption');

      modalImg.src = src;
      modalImg.alt = title;
      if (modalTitle) modalTitle.textContent = title;
      if (modalCaption) modalCaption.textContent = caption;

      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeModal() {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    modalImg.src = '';
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      closeModal();
    }
  });
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

  btn.addEventListener('click', () => {
    menu.classList.toggle('hidden');
  });

  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.add('hidden');
    });
  });
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
