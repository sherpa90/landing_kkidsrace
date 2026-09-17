const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.resolve(__dirname, '../../data');
const CONTENT_FILE = path.join(DATA_DIR, 'site-content.json');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');

// Garantizar que exista el directorio data
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Inicializar leads.json si no existe
if (!fs.existsSync(LEADS_FILE)) {
  fs.writeFileSync(LEADS_FILE, JSON.stringify([], null, 2), 'utf-8');
}

// Cache en memoria para lecturas ultrarrápidas
let cachedContent = null;

function loadContent() {
  try {
    if (fs.existsSync(CONTENT_FILE)) {
      const raw = fs.readFileSync(CONTENT_FILE, 'utf-8');
      cachedContent = JSON.parse(raw);
      return cachedContent;
    }
  } catch (err) {
    console.error('Error leyendo site-content.json:', err);
  }
  return cachedContent || {};
}

function getContent() {
  if (!cachedContent) {
    return loadContent();
  }
  return cachedContent;
}

function saveContent(newContent) {
  try {
    // Mezcla profunda recursiva para preservar campos no incluidos en el payload
    cachedContent = deepMerge(cachedContent || {}, newContent);

    // Escritura atómica
    const tempFile = `${CONTENT_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(cachedContent, null, 2), 'utf-8');
    fs.renameSync(tempFile, CONTENT_FILE);
    return { success: true, content: cachedContent };
  } catch (err) {
    console.error('Error guardando site-content.json:', err);
    return { success: false, error: err.message };
  }
}

// Mezcla recursiva: combina objetos y arreglos, preservando propiedades existentes
function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] !== null &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      typeof result[key] === 'object' &&
      result[key] !== null
    ) {
      result[key] = deepMerge(result[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

// Gestión de Leads / Contactos recibidos
function getLeads() {
  try {
    if (fs.existsSync(LEADS_FILE)) {
      const raw = fs.readFileSync(LEADS_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error leyendo leads.json:', err);
  }
  return [];
}

function addLead(leadData) {
  try {
    const leads = getLeads();
    const newLead = {
      id: crypto.randomUUID ? crypto.randomUUID() : `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: (leadData.name || leadData.tutorName || '').trim(),
      email: (leadData.email || '').trim(),
      phone: (leadData.phone || '').trim(),
      kidName: String(leadData.kidName || '').trim(),
      kidAge: String(leadData.kidAge ?? '').trim(),
      distance: String(leadData.distance || leadData.category || '').trim(),
      subject: (leadData.subject || (leadData.distance ? `Inscripción - ${leadData.distance}` : '')).trim(),
      message: (leadData.message || '').trim(),
      createdAt: new Date().toISOString(),
      read: false
    };

    leads.unshift(newLead);
    
    // Guardar atómicamente
    const tempFile = `${LEADS_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(leads, null, 2), 'utf-8');
    fs.renameSync(tempFile, LEADS_FILE);

    return { success: true, lead: newLead };
  } catch (err) {
    console.error('Error guardando lead:', err);
    return { success: false, error: err.message };
  }
}

function deleteLead(id) {
  try {
    let leads = getLeads();
    leads = leads.filter(l => l.id !== id);
    const tempFile = `${LEADS_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(leads, null, 2), 'utf-8');
    fs.renameSync(tempFile, LEADS_FILE);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Configuración de Paletas de Colores para el tema moderno
// Colores corporativos: Rojo (#ef4444), Verde (#10b981), Amarillo (#facc15)
const COLOR_THEMES = {
  green_yellow: {
    name: 'Rojo, Verde y Amarillo Corporativo',
    primary: 'emerald-500',
    primaryHex: '#10b981',
    secondaryHex: '#facc15',
    accentHex: '#ef4444',
    gradient: 'from-red-500 via-emerald-400 to-yellow-400',
    gradientDark: 'from-red-300 via-emerald-300 to-yellow-300',
    glow: 'rgba(16, 185, 129, 0.5)',
    solidBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold',
    solidBtnSecondary: 'bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold',
    solidBtnDanger: 'bg-red-500 hover:bg-red-600 text-white font-bold',
    badgePrimary: 'bg-emerald-600 text-white',
    badgeSecondary: 'bg-yellow-400 text-gray-900',
    badgeDanger: 'bg-red-500 text-white',
    badgeBorder: 'border-emerald-600 text-emerald-700 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-950',
    cardBorder: 'border-emerald-500',
    cardHover: 'hover:border-red-400'
  },
  indigo: {
    name: 'Índigo Cibernético',
    primary: 'indigo-500',
    primaryHex: '#6366f1',
    secondaryHex: '#facc15',
    accentHex: '#ef4444',
    gradient: 'from-indigo-500 via-purple-500 to-red-400',
    gradientDark: 'from-indigo-400 via-purple-400 to-red-300',
    glow: 'rgba(99, 102, 241, 0.5)',
    solidBtn: 'bg-indigo-600 hover:bg-indigo-700 text-white font-bold',
    solidBtnSecondary: 'bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold',
    solidBtnDanger: 'bg-red-500 hover:bg-red-600 text-white font-bold',
    badgePrimary: 'bg-indigo-600 text-white',
    badgeSecondary: 'bg-yellow-400 text-gray-900',
    badgeDanger: 'bg-red-500 text-white',
    badgeBorder: 'border-indigo-500 text-indigo-700 dark:text-indigo-200 bg-indigo-100 dark:bg-indigo-950',
    cardBorder: 'border-indigo-500',
    cardHover: 'hover:border-red-400'
  },
  violet: {
    name: 'Violeta Eléctrico',
    primary: 'violet-500',
    primaryHex: '#8b5cf6',
    secondaryHex: '#facc15',
    accentHex: '#ef4444',
    gradient: 'from-violet-500 via-fuchsia-500 to-yellow-400',
    gradientDark: 'from-violet-400 via-fuchsia-400 to-yellow-300',
    glow: 'rgba(139, 92, 246, 0.5)',
    solidBtn: 'bg-violet-600 hover:bg-violet-700 text-white font-bold',
    solidBtnSecondary: 'bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold',
    solidBtnDanger: 'bg-red-500 hover:bg-red-600 text-white font-bold',
    badgePrimary: 'bg-violet-600 text-white',
    badgeSecondary: 'bg-yellow-400 text-gray-900',
    badgeDanger: 'bg-red-500 text-white',
    badgeBorder: 'border-violet-500 text-violet-700 dark:text-violet-200 bg-violet-100 dark:bg-violet-950',
    cardBorder: 'border-violet-500',
    cardHover: 'hover:border-red-400'
  },
  cyan: {
    name: 'Cian Neón',
    primary: 'cyan-500',
    primaryHex: '#06b6d4',
    secondaryHex: '#facc15',
    accentHex: '#ef4444',
    gradient: 'from-cyan-400 via-teal-500 to-red-400',
    gradientDark: 'from-cyan-300 via-teal-400 to-red-300',
    glow: 'rgba(6, 182, 212, 0.5)',
    solidBtn: 'bg-cyan-600 hover:bg-cyan-700 text-white font-bold',
    solidBtnSecondary: 'bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold',
    solidBtnDanger: 'bg-red-500 hover:bg-red-600 text-white font-bold',
    badgePrimary: 'bg-cyan-600 text-white',
    badgeSecondary: 'bg-yellow-400 text-gray-900',
    badgeDanger: 'bg-red-500 text-white',
    badgeBorder: 'border-cyan-500 text-cyan-700 dark:text-cyan-200 bg-cyan-100 dark:bg-cyan-950',
    cardBorder: 'border-cyan-500',
    cardHover: 'hover:border-red-400'
  },
  emerald: {
    name: 'Esmeralda Aurora',
    primary: 'emerald-500',
    primaryHex: '#10b981',
    secondaryHex: '#facc15',
    accentHex: '#ef4444',
    gradient: 'from-emerald-400 via-teal-500 to-red-400',
    gradientDark: 'from-emerald-300 via-teal-400 to-red-300',
    glow: 'rgba(16, 185, 129, 0.5)',
    solidBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold',
    solidBtnSecondary: 'bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold',
    solidBtnDanger: 'bg-red-500 hover:bg-red-600 text-white font-bold',
    badgePrimary: 'bg-emerald-600 text-white',
    badgeSecondary: 'bg-yellow-400 text-gray-900',
    badgeDanger: 'bg-red-500 text-white',
    badgeBorder: 'border-emerald-500 text-emerald-700 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-950',
    cardBorder: 'border-emerald-500',
    cardHover: 'hover:border-red-400'
  },
  rose: {
    name: 'Rosa Cósmico',
    primary: 'rose-500',
    primaryHex: '#f43f5e',
    secondaryHex: '#facc15',
    accentHex: '#ef4444',
    gradient: 'from-rose-500 via-pink-500 to-yellow-400',
    gradientDark: 'from-rose-400 via-pink-400 to-yellow-300',
    glow: 'rgba(244, 63, 94, 0.5)',
    solidBtn: 'bg-rose-600 hover:bg-rose-700 text-white font-bold',
    solidBtnSecondary: 'bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold',
    solidBtnDanger: 'bg-red-500 hover:bg-red-600 text-white font-bold',
    badgePrimary: 'bg-rose-600 text-white',
    badgeSecondary: 'bg-yellow-400 text-gray-900',
    badgeDanger: 'bg-red-500 text-white',
    badgeBorder: 'border-rose-500 text-rose-700 dark:text-rose-200 bg-rose-100 dark:bg-rose-950',
    cardBorder: 'border-rose-500',
    cardHover: 'hover:border-yellow-400'
  },
  amber: {
    name: 'Ámbar Solar',
    primary: 'amber-500',
    primaryHex: '#f59e0b',
    secondaryHex: '#10b981',
    accentHex: '#ef4444',
    gradient: 'from-amber-400 via-orange-500 to-red-400',
    gradientDark: 'from-amber-300 via-orange-400 to-red-300',
    glow: 'rgba(245, 158, 11, 0.5)',
    solidBtn: 'bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold',
    solidBtnSecondary: 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold',
    solidBtnDanger: 'bg-red-500 hover:bg-red-600 text-white font-bold',
    badgePrimary: 'bg-yellow-500 text-gray-900',
    badgeSecondary: 'bg-emerald-600 text-white',
    badgeDanger: 'bg-red-500 text-white',
    badgeBorder: 'border-amber-500 text-amber-700 dark:text-amber-200 bg-amber-100 dark:bg-amber-950',
    cardBorder: 'border-amber-500',
    cardHover: 'hover:border-red-400'
  }
};

function getTheme(accentColor = 'green_yellow') {
  return COLOR_THEMES[accentColor] || COLOR_THEMES.green_yellow;
}

module.exports = {
  getContent,
  saveContent,
  getLeads,
  addLead,
  deleteLead,
  COLOR_THEMES,
  getTheme
};
