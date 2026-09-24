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

// Gestión de Leads / Contactos e Inscripciones de Participantes
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
    const content = getContent();
    const activeRace = getActiveRace();

    const newLead = {
      id: leadData.id || (crypto.randomUUID ? crypto.randomUUID() : `insc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`),
      raceId: leadData.raceId || (activeRace ? activeRace.id : 'race-2026-primavera'),
      raceName: leadData.raceName || (activeRace ? activeRace.name : 'KidsRun 2026'),
      // Datos del tutor (minimización de datos)
      name: (leadData.name || leadData.tutorName || '').trim(),
      email: (leadData.email || '').trim(),
      phone: (leadData.phone || '').trim(),
      // Datos del participante menor (mínimos para resguardo y seguridad)
      kidName: String(leadData.kidName || '').trim(),
      kidAge: leadData.kidAge ? parseInt(leadData.kidAge, 10) : null,
      distance: String(leadData.distance || leadData.category || '').trim(),
      emergencyContact: (leadData.emergencyContact || leadData.phone || '').trim(),
      medicalNotes: (leadData.medicalNotes || leadData.message || '').trim(),
      message: (leadData.message || leadData.medicalNotes || '').trim(),
      subject: (leadData.subject || `Inscripción - ${leadData.distance || 'KidsRun'}`).trim(),
      paymentProof: (leadData.paymentProof || '').trim(),
      consentGiven: Boolean(leadData.consentGiven !== false), // Consentimiento de tutor legal
      createdAt: new Date().toISOString(),
      status: 'confirmed',
      bibNumber: generateBibNumber(leads.length + 101)
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

function generateBibNumber(num) {
  return String(num).padStart(4, '0');
}

function getRaces() {
  const content = getContent();
  return content.races || [];
}

function getActiveRace() {
  const races = getRaces();
  return races.find(r => r.status === 'active') || races[0] || null;
}

function saveRace(raceData) {
  const content = getContent();
  let races = content.races || [];

  if (raceData.id) {
    // Editar existente
    const idx = races.findIndex(r => r.id === raceData.id);
    if (idx !== -1) {
      if (raceData.status === 'active') {
        races.forEach(r => { r.status = 'inactive'; });
      }
      races[idx] = { ...races[idx], ...raceData };
    }
  } else {
    // Crear nueva
    const id = `race-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    if (raceData.status === 'active') {
      races.forEach(r => { r.status = 'inactive'; });
    }
    races.unshift({
      id,
      name: raceData.name || 'Nueva Corrida KidsRun',
      year: new Date(raceData.date || Date.now()).getFullYear(),
      date: raceData.date || new Date().toISOString(),
      dateDisplay: raceData.dateDisplay || '',
      time: raceData.time || '09:00 AM',
      location: raceData.location || 'Parque Bicentenario',
      city: raceData.city || 'Sector Central',
      status: raceData.status || 'planned',
      circuits: raceData.circuits || ['500 Metros', '1 Kilómetro', '2 Kilómetros', '3 Kilómetros'],
      maxParticipants: parseInt(raceData.maxParticipants, 10) || 500,
      createdAt: new Date().toISOString()
    });
  }

  // Sincronizar fecha del countdown si la carrera guardada es la activa
  const active = races.find(r => r.status === 'active');
  if (active) {
    content.countdown = {
      ...content.countdown,
      targetDate: active.date,
      eventDateDisplay: active.dateDisplay || content.countdown?.eventDateDisplay,
      eventTime: active.time || content.countdown?.eventTime,
      locationName: active.location || content.countdown?.locationName,
      locationCity: active.city || content.countdown?.locationCity
    };
  }

  content.races = races;
  return saveContent(content);
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
  blue_sport: {
    name: 'Azul Deportivo, Amarillo y Rojo (KidsRun Oficial)',
    primary: 'blue-600',
    primaryHex: '#1d4ed8',
    secondaryHex: '#facc15',
    accentHex: '#ef4444',
    gradient: 'from-blue-600 via-red-500 to-amber-400',
    gradientDark: 'from-blue-400 via-red-400 to-yellow-300',
    glow: 'rgba(29, 78, 216, 0.4)',
    solidBtn: 'bg-blue-600 hover:bg-blue-700 text-white font-bold',
    solidBtnSecondary: 'bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold',
    solidBtnDanger: 'bg-red-600 hover:bg-red-700 text-white font-bold',
    badgePrimary: 'bg-blue-600 text-white',
    badgeSecondary: 'bg-amber-400 text-slate-900',
    badgeDanger: 'bg-red-600 text-white',
    badgeBorder: 'border-blue-600 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950',
    cardBorder: 'border-blue-500',
    cardHover: 'hover:border-red-400'
  },
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

function getTheme(accentColor = 'blue_sport') {
  return COLOR_THEMES[accentColor] || COLOR_THEMES.blue_sport;
}

module.exports = {
  getContent,
  saveContent,
  getLeads,
  addLead,
  deleteLead,
  getRaces,
  getActiveRace,
  saveRace,
  COLOR_THEMES,
  getTheme
};
