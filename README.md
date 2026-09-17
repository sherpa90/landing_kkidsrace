# Modern Landing Page & CMS (Docker Ready & SEO Optimized)

Una solución web moderna, ultraligera y de alto rendimiento: **Landing page premium de alta conversión** con efectos visuales modernos (glassmorphism, animaciones fluidas, canvas interactivo y estilo dark SaaS), acompañada de un **CMS integrado** para gestionar contenidos, precios, testimonios, FAQs y capturar leads en tiempo real, todo empaquetado bajo **Docker**.

---

## ✨ Características Principales

### 🚀 Landing Page Premium
- **Diseño Ultra-Moderno**: Estética SaaS (estilo Linear / Stripe / Vercel), modo oscuro elegante con gradientes dinámicos y acentos luminosos.
- **Efectos Visuales**: Canvas con partículas interactivas que reaccionan sutilmente al cursor, micro-interacciones a 60 FPS, badges flotantes y efecto glassmorphism.
- **100% Responsive**: Experiencia optimizada para móviles, tablets y monitores de alta resolución.
- **Componentes de Alta Conversión**:
  - Hero Section con llamadas a la acción duales y vista previa en vivo.
  - Barra de métricas y social proof.
  - Grid de características con iconos modernos Lucide.
  - Sección Showcase interactiva.
  - Testimonios con valoraciones en estrellas.
  - Selector de Precios dinámico (Mensual / Anual con cálculo de descuento instantáneo).
  - Acordeón interactivo de Preguntas Frecuentes (FAQ).
  - Formulario de Contacto / Lead Capture con validación y confirmación visual inmediata.

### 🛠️ CMS Integrado (`/admin`)
- **Panel Intuitivo**: Permite al administrador editar cualquier sección sin tocar una sola línea de código.
- **Persistencia en Tiempo Real**: Los cambios se aplican de inmediato en la landing page.
- **Bandeja de Contactos / Leads**: Todos los mensajes enviados por los visitantes desde la landing se almacenan y pueden revisarse o eliminarse desde el panel.
- **Selector de Paleta de Colores**: Cambia el tema cromático del sitio (Índigo, Violeta, Cian, Esmeralda, Ámbar o Rosa) con un clic.
- **Seguridad**: Autenticación protegida con sesiones y contraseñas cifradas con `bcrypt`.

### 🔍 SEO Nativo de Primer Nivel
- **Server-Side Rendering (SSR)**: El contenido y los metadatos se renderizan en el servidor, garantizando que Googlebot y los rastreadores web indexen el 100% del contenido.
- **OpenGraph & Twitter Cards**: Vistas previas perfectas al compartir enlaces en WhatsApp, Telegram, LinkedIn, Facebook y Twitter/X.
- **Sitemap Dinámico**: Disponible automáticamente en `/sitemap.xml`.
- **Robots.txt Dinámico**: Disponible en `/robots.txt` con control de indexación desde el CMS.
- **Schema.org JSON-LD**: Datos estructurados para Google Rich Snippets (WebSite, Organization, SoftwareApplication).
- **Inyección de Analítica**: Soporte para insertar scripts de Google Analytics 4, Tag Manager o Meta Pixel desde el CMS.

---

## 🐳 Despliegue Rápido con Docker

El proyecto está diseñado para correr bajo Docker sin complicaciones:

### 1. Iniciar con Docker Compose
```bash
docker compose up -d --build
```
*(O `docker-compose up -d --build` si usas versiones anteriores).*

### 2. Acceder a la Aplicación
- **Landing Page Pública**: [http://localhost:3000](http://localhost:3000)
- **Panel Administrativo (CMS)**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **Sitemap XML**: [http://localhost:3000/sitemap.xml](http://localhost:3000/sitemap.xml)
- **Robots.txt**: [http://localhost:3000/robots.txt](http://localhost:3000/robots.txt)

### 3. Credenciales de Administrador por Defecto
- **Usuario**: `admin`
- **Contraseña**: `admin`
*(Puedes cambiar la contraseña directamente desde la pestaña "Seguridad" en el panel del CMS o en tu archivo `.env`).*

### 4. Persistencia de Datos
El volumen Docker `./data:/app/data` garantiza que todos los cambios que guardes en el CMS y los mensajes de clientes recibidos permanezcan guardados en tu máquina local, incluso si detienes o actualizas el contenedor.

---

## 💻 Ejecución Local (Opcional sin Docker)

Si dispones de Node.js instalado localmente:

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor
npm start

# O en modo desarrollo con auto-reload:
npm run dev
```

---

## 📁 Estructura del Proyecto

```
modern-landing-cms/
├── Dockerfile                  # Contenedor Node.js 20 Alpine multi-stage (<90MB)
├── docker-compose.yml          # Configuración de servicios y volúmenes
├── package.json                # Dependencias ligeras (Express, EJS, Helmet, Bcrypt)
├── .env.example                # Variables de entorno modelo
├── data/                       # Almacenamiento persistente
│   ├── site-content.json       # Datos y contenidos del CMS
│   └── leads.json              # Mensajes y contactos recibidos
├── src/
│   ├── server.js               # Servidor Express, compresión y seguridad
│   ├── routes/
│   │   ├── public.js           # Rutas públicas (Landing, SEO, Contacto)
│   │   └── admin.js            # Rutas protegidas del CMS (/admin)
│   ├── services/
│   │   ├── contentStore.js     # Gestor de persistencia atómica y temas
│   │   └── auth.js             # Autenticación y hash de contraseñas
│   ├── views/
│   │   ├── index.ejs           # Landing page completa con SSR
│   │   ├── sitemap.ejs         # Generador de sitemap XML
│   │   ├── robots.ejs          # Generador de robots.txt
│   │   └── admin/
│   │       ├── login.ejs       # Login moderno al CMS
│   │       └── dashboard.ejs   # Panel completo con pestañas y guardado AJAX
│   └── public/
│       ├── css/custom.css      # Animaciones, glassmorphism y estilos
│       └── js/
│           ├── landing.js      # Interactividad de la landing (canvas, scroll, FAQ)
│           └── admin.js        # Lógica del CMS, guardado en vivo y leads
```

---

## ⚙️ Variables de Entorno

| Variable | Descripción | Valor por Defecto |
| :--- | :--- | :--- |
| `PORT` | Puerto de escucha del servidor | `3000` |
| `NODE_ENV` | Entorno de ejecución (`production` / `development`) | `production` |
| `SESSION_SECRET` | Clave secreta para firmar sesiones y cookies | `modern_landing_cms_secret` |
| `ADMIN_USERNAME` | Usuario administrador inicial | `admin` |
| `ADMIN_PASSWORD` | Contraseña administrador inicial | `admin` |
| `SITE_URL` | Dominio canónico para etiquetas SEO y Sitemap | `http://localhost:3000` |
