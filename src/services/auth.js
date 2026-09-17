const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.resolve(__dirname, '../../data');
const AUTH_FILE = path.join(DATA_DIR, 'admin-auth.json');

// Generar credenciales seguras si no se proporcionan por env
function getEffectiveCredentials() {
  let envUser = process.env.ADMIN_USERNAME;
  let envPass = process.env.ADMIN_PASSWORD;
  let warned = false;

  if (!envUser) {
    envUser = 'admin';
    warned = true;
  }
  if (!envPass) {
    // Generar contraseña aleatoria segura de 16 caracteres
    envPass = crypto.randomBytes(16).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
    warned = true;
  }

  if (warned && process.env.NODE_ENV !== 'test') {
    console.warn('⚠️  ADMIN_USERNAME o ADMIN_PASSWORD no configurados. Usando valores generados/por defecto.');
    console.warn(`   Username: ${envUser}`);
    console.warn(`   Password generada: ${envPass}`);
    console.warn('   ⚠️  ¡Cambia estas credenciales inmediatamente en producción!');
  }

  return { username: envUser, password: envPass };
}

function getStoredAuth() {
  const { username, password } = getEffectiveCredentials();

  try {
    if (fs.existsSync(AUTH_FILE)) {
      const data = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'));
      return data;
    }
  } catch (err) {
    console.error('Error leyendo admin-auth.json:', err);
  }

  // Si no existe el archivo personalizado, usamos los valores de .env
  return {
    username,
    passwordHash: bcrypt.hashSync(password, 10)
  };
}

function verifyCredentials(username, password) {
  const currentAuth = getStoredAuth();
  if (username !== currentAuth.username) {
    return false;
  }
  return bcrypt.compareSync(password, currentAuth.passwordHash);
}

function changePassword(currentPassword, newPassword) {
  const currentAuth = getStoredAuth();
  if (!bcrypt.compareSync(currentPassword, currentAuth.passwordHash)) {
    return { success: false, error: 'La contraseña actual no es correcta.' };
  }

  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'La nueva contraseña debe tener al menos 6 caracteres.' };
  }

  const updatedAuth = {
    username: currentAuth.username,
    passwordHash: bcrypt.hashSync(newPassword, 10),
    updatedAt: new Date().toISOString()
  };

  try {
    fs.writeFileSync(AUTH_FILE, JSON.stringify(updatedAuth, null, 2), 'utf-8');
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Middleware de protección para rutas de administración
function requireAuth(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }

  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(401).json({ error: 'No autorizado. Inicie sesión nuevamente.' });
  }

  return res.redirect('/admin/login');
}

module.exports = {
  verifyCredentials,
  changePassword,
  requireAuth
};
