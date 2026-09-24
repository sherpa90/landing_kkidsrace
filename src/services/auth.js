const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.resolve(__dirname, '../../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const LEGACY_AUTH_FILE = path.join(DATA_DIR, 'admin-auth.json');

// Mapa en memoria para account lockout: { username -> { attempts, lockedUntil } }
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutos

// Asegurar existencia de directorio de datos
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Cache en memoria — se sincroniza una sola vez al arrancar
let cachedUsers = null;

// Cargar o inicializar la lista de usuarios con roles (admin y editor)
function getUsers() {
  if (cachedUsers) return cachedUsers;

  try {
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, 'utf-8');
      cachedUsers = JSON.parse(raw);

      // Los usuarios registrados en users.json se mantienen intactos

      return cachedUsers;
    }
  } catch (err) {
    console.error('[auth] Error leyendo users.json:', err.message);
  }

  // Si no existe users.json, crear usuarios iniciales desde variables de entorno
  let initialAdminPass = process.env.ADMIN_PASSWORD || 'admin';
  let initialAdminUser = process.env.ADMIN_USERNAME || 'admin';

  if (fs.existsSync(LEGACY_AUTH_FILE)) {
    try {
      const legacy = JSON.parse(fs.readFileSync(LEGACY_AUTH_FILE, 'utf-8'));
      if (legacy && legacy.username) initialAdminUser = legacy.username;
    } catch (e) {}
  }

  const defaultUsers = [
    {
      id: 'usr_admin',
      username: initialAdminUser,
      name: 'Administrador Principal',
      role: 'admin',
      passwordHash: bcrypt.hashSync(initialAdminPass, 12),
      createdAt: new Date().toISOString()
    },
    {
      id: 'usr_editor',
      username: 'editor',
      name: 'Editor de Contenidos',
      role: 'editor',
      passwordHash: bcrypt.hashSync(process.env.EDITOR_PASSWORD || 'editor2026', 12),
      createdAt: new Date().toISOString()
    }
  ];

  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2), 'utf-8');
  } catch (err) {
    console.error('[auth] Error inicializando users.json:', err.message);
  }

  cachedUsers = defaultUsers;
  return cachedUsers;
}

// Sincronizar usuario de variables de entorno una sola vez al arrancar (sin bloquear en cada request)
function syncEnvAdmin() {
  const envUser = (process.env.ADMIN_USERNAME || '').trim();
  const envPass = (process.env.ADMIN_PASSWORD || '').trim();
  if (!envUser || !envPass) return;

  const users = getUsers();
  const existingIdx = users.findIndex(u => u.username.toLowerCase() === envUser.toLowerCase());
  if (existingIdx !== -1) {
    // Solo re-hashear si la contraseña actual no coincide
    if (!bcrypt.compareSync(envPass, users[existingIdx].passwordHash)) {
      users[existingIdx].passwordHash = bcrypt.hashSync(envPass, 12);
      users[existingIdx].role = 'admin';
      saveUsers(users);
    }
  } else {
    users.push({
      id: `usr_${Date.now()}`,
      username: envUser,
      name: 'Administrador Principal',
      role: 'admin',
      passwordHash: bcrypt.hashSync(envPass, 12),
      createdAt: new Date().toISOString()
    });
    saveUsers(users);
  }
}

function saveUsers(users) {
  try {
    const tempFile = `${USERS_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(users, null, 2), 'utf-8');
    fs.renameSync(tempFile, USERS_FILE);
    cachedUsers = users; // Actualizar cache en memoria
    return true;
  } catch (err) {
    console.error('[auth] Error guardando users.json:', err.message);
    return false;
  }
}

// --- Account Lockout helpers ---

function isAccountLocked(username) {
  const entry = loginAttempts.get(username);
  if (!entry) return false;
  if (entry.lockedUntil && Date.now() < entry.lockedUntil) return true;
  // Bloqueo expirado — limpiar
  if (entry.lockedUntil && Date.now() >= entry.lockedUntil) {
    loginAttempts.delete(username);
  }
  return false;
}

function recordFailedAttempt(username) {
  const entry = loginAttempts.get(username) || { attempts: 0, lockedUntil: null };
  entry.attempts += 1;
  if (entry.attempts >= MAX_LOGIN_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
    console.warn(`[security] Cuenta bloqueada por ${MAX_LOGIN_ATTEMPTS} intentos fallidos: "${username}" — hasta ${new Date(entry.lockedUntil).toISOString()}`);
  }
  loginAttempts.set(username, entry);
}

function resetAttempts(username) {
  loginAttempts.delete(username);
}

// Verificar credenciales — único flujo: siempre bcrypt sobre users.json
function verifyCredentials(username, password, clientIp) {
  const cleanUser = (username || '').trim().toLowerCase();
  const cleanPass = (password || '').trim();

  if (!cleanUser || !cleanPass) return null;

  // Comprobar bloqueo de cuenta
  if (isAccountLocked(cleanUser)) {
    const entry = loginAttempts.get(cleanUser);
    const waitSec = Math.ceil((entry.lockedUntil - Date.now()) / 1000);
    console.warn(`[security] Login bloqueado para "${cleanUser}" desde ${clientIp || 'IP desconocida'} — ${waitSec}s restantes`);
    return { locked: true, waitSeconds: waitSec };
  }

  // Buscar usuario en users.json y verificar con bcrypt
  const users = getUsers();
  const user = users.find(u => u.username.toLowerCase() === cleanUser);

  if (!user) {
    console.warn(`[security] Usuario inexistente: "${cleanUser}" desde ${clientIp || 'IP desconocida'}`);
    recordFailedAttempt(cleanUser);
    return null;
  }

  const isValid = bcrypt.compareSync(cleanPass, user.passwordHash);
  if (!isValid) {
    console.warn(`[security] Contraseña incorrecta para "${cleanUser}" desde ${clientIp || 'IP desconocida'}`);
    recordFailedAttempt(cleanUser);
    return null;
  }

  // Login exitoso — resetear contador
  resetAttempts(cleanUser);
  console.info(`[security] Login exitoso: "${cleanUser}" (${user.role}) desde ${clientIp || 'IP desconocida'}`);

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role
  };
}

// Cambiar contraseña de un usuario específico
function changePassword(username, currentPassword, newPassword) {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.username.toLowerCase() === (username || '').trim().toLowerCase());
  if (userIndex === -1) {
    return { success: false, error: 'Usuario no encontrado.' };
  }

  const user = users[userIndex];
  if (!bcrypt.compareSync(currentPassword, user.passwordHash)) {
    return { success: false, error: 'La contraseña actual no es correcta.' };
  }

  if (!newPassword || newPassword.length < 12) {
    return { success: false, error: 'La nueva contraseña debe tener al menos 12 caracteres.' };
  }

  users[userIndex].passwordHash = bcrypt.hashSync(newPassword, 12);
  users[userIndex].updatedAt = new Date().toISOString();

  if (saveUsers(users)) {
    return { success: true };
  } else {
    return { success: false, error: 'Error al guardar los cambios en disco.' };
  }
}

// Middlewares de protección por roles
function requireAuth(req, res, next) {
  if (req.session && (req.session.isAdmin || req.session.isEditor)) {
    return next();
  }

  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(401).json({ error: 'No autorizado. Inicie sesión nuevamente.' });
  }

  return res.redirect('/admin/login');
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.role === 'admin') {
    return next();
  }

  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(403).json({ error: 'Acción permitida únicamente para Administradores.' });
  }

  return res.status(403).render('admin/login', {
    error: 'Acceso restringido a Administradores.',
    csrfToken: req.session?.csrfToken || ''
  });
}


// --- Funciones de Gestión de Usuarios (CRUD para Administrador) ---

function createUser({ username, name, role, password }) {
  const cleanUser = (username || '').trim().toLowerCase();
  const cleanName = (name || '').trim();
  const cleanRole = role === 'admin' ? 'admin' : 'editor';

  if (!cleanUser || cleanUser.length < 3) {
    return { success: false, error: 'El nombre de usuario debe tener al menos 3 caracteres.' };
  }
  if (!cleanName) {
    return { success: false, error: 'El nombre de la persona es obligatorio.' };
  }
  if (!password || password.length < 12) {
    return { success: false, error: 'La contraseña debe tener al menos 12 caracteres.' };
  }

  const users = getUsers();
  if (users.some(u => u.username.toLowerCase() === cleanUser)) {
    return { success: false, error: `El usuario "${cleanUser}" ya existe.` };
  }

  const newUser = {
    id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    username: cleanUser,
    name: cleanName,
    role: cleanRole,
    passwordHash: bcrypt.hashSync(password, 12),
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  if (saveUsers(users)) {
    return {
      success: true,
      user: { id: newUser.id, username: newUser.username, name: newUser.name, role: newUser.role, createdAt: newUser.createdAt }
    };
  }
  return { success: false, error: 'No se pudo guardar el usuario en disco.' };
}

function updateUser(userId, { name, role, password }) {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) {
    return { success: false, error: 'Usuario no encontrado.' };
  }

  const target = users[idx];

  // Si se cambia el nombre
  if (name && name.trim()) {
    target.name = name.trim();
  }

  // Si se cambia el rol (soporta admin, editor y lector)
  if (role && (role === 'admin' || role === 'editor' || role === 'lector')) {
    const finalRole = role === 'admin' ? 'admin' : 'editor';
    // Evitar dejar el sistema sin administradores
    if (target.role === 'admin' && finalRole === 'editor') {
      const adminCount = users.filter(u => u.role === 'admin').length;
      if (adminCount <= 1) {
        return { success: false, error: 'Debe haber al menos un Administrador activo en el sistema.' };
      }
    }
    target.role = finalRole;
  }

  // Si se proporciona nueva contraseña
  if (password && password.trim()) {
    if (password.trim().length < 12) {
      return { success: false, error: 'La nueva contraseña debe tener al menos 12 caracteres.' };
    }
    target.passwordHash = bcrypt.hashSync(password.trim(), 12);
  }

  target.updatedAt = new Date().toISOString();

  if (saveUsers(users)) {
    return {
      success: true,
      user: { id: target.id, username: target.username, name: target.name, role: target.role }
    };
  }
  return { success: false, error: 'Error al actualizar el usuario.' };
}

function deleteUser(userId, currentAdminUsername) {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) {
    return { success: false, error: 'Usuario no encontrado.' };
  }

  const target = users[idx];
  // No permitir auto-eliminarse
  if (target.username.toLowerCase() === (currentAdminUsername || '').toLowerCase()) {
    return { success: false, error: 'No puedes eliminar tu propia cuenta de Administrador activa.' };
  }

  // Asegurar que quede al menos un admin
  if (target.role === 'admin') {
    const adminCount = users.filter(u => u.role === 'admin').length;
    if (adminCount <= 1) {
      return { success: false, error: 'No puedes eliminar al único Administrador del sistema.' };
    }
  }

  users.splice(idx, 1);
  if (saveUsers(users)) {
    return { success: true, message: `Usuario "${target.username}" eliminado con éxito.` };
  }
  return { success: false, error: 'Error al eliminar usuario en disco.' };
}


module.exports = {
  getUsers,
  syncEnvAdmin,
  createUser,
  updateUser,
  deleteUser,
  verifyCredentials,
  changePassword,
  requireAuth,
  requireAdmin
};
