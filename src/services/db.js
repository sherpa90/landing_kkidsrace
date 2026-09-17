const { Pool } = require('pg');
const crypto = require('crypto');
const contentStore = require('./contentStore');

let pool = null;
let isConnected = false;
let initPromise = null;

// Inicializar conexión a PostgreSQL (async, espera a que termine)
function initDb() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.log('ℹ️ DATABASE_URL no configurada. Usando almacenamiento persistente local.');
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    try {
      pool = new Pool({
        connectionString: databaseUrl,
        connectionTimeoutMillis: 3000,
        idleTimeoutMillis: 10000,
        max: 10
      });

      pool.query('SELECT NOW() as now', (err, res) => {
        if (err) {
          console.warn('⚠️ No se pudo conectar a PostgreSQL en este momento. Se usará almacenamiento local de respaldo:', err.message);
          isConnected = false;
          resolve();
        } else {
          isConnected = true;
          console.log('🐘 Conectado exitosamente a PostgreSQL.');
          createTableIfNotExists().then(() => resolve()).catch(() => resolve());
        }
      });

      pool.on('error', (err) => {
        console.warn('⚠️ Error en pool de PostgreSQL:', err.message);
        isConnected = false;
      });
    } catch (err) {
      console.warn('⚠️ Error inicializando pool de PostgreSQL:', err.message);
      isConnected = false;
      resolve();
    }
  });
}

async function createTableIfNotExists() {
  if (!pool || !isConnected) return;
  const sql = `
    CREATE TABLE IF NOT EXISTS inscriptions (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      kid_name VARCHAR(255),
      kid_age INT,
      distance VARCHAR(100),
      subject VARCHAR(255),
      message TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      read BOOLEAN DEFAULT FALSE
    );
  `;
  try {
    await pool.query(sql);
    console.log('✅ Tabla "inscriptions" verificada en PostgreSQL.');
  } catch (err) {
    console.error('Error creando tabla inscriptions:', err);
  }
}

// Inicializar al cargar (async, no bloquea)
initPromise = initDb();

// Guardar nueva inscripción (PostgreSQL con respaldo local SOLO si falla)
async function saveInscription(data) {
  const id = crypto.randomUUID ? crypto.randomUUID() : `insc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const name = (data.name || data.tutorName || '').trim();
  const email = (data.email || '').trim();
  const phone = (data.phone || '').trim();
  const kidName = (data.kidName || '').trim();
  const kidAge = parseInt(data.kidAge, 10) || null;
  const distance = (data.distance || data.category || '').trim();
  const subject = (data.subject || (distance ? `Inscripción - ${distance}` : 'KidsRun')).trim();
  const message = (data.message || '').trim();
  const now = new Date().toISOString();

  // Esperar a que termine la inicialización del pool si está en progreso
  if (initPromise) {
    await initPromise;
  }

  // Intentar guardar en PostgreSQL si está disponible
  if (pool && isConnected) {
    try {
      const sql = `
        INSERT INTO inscriptions (id, name, email, phone, kid_name, kid_age, distance, subject, message, created_at, read)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false)
        RETURNING *;
      `;
      const values = [id, name, email, phone, kidName, kidAge, distance, subject, message, now];
      const result = await pool.query(sql, values);
      return { success: true, lead: result.rows[0], source: 'postgresql' };
    } catch (err) {
      console.error('Error guardando en PostgreSQL, guardado en respaldo local:', err.message);
      // Fallback: guardar en local
      contentStore.addLead({
        id, name, email, phone, kidName, kidAge, distance, subject, message
      });
      return { success: true, source: 'local_backup' };
    }
  }

  // Sin PostgreSQL: guardar en local
  contentStore.addLead({
    id, name, email, phone, kidName, kidAge, distance, subject, message
  });
  return { success: true, source: 'local' };
}

// Obtener todas las inscripciones
async function getInscriptions() {
  // Esperar a que termine la inicialización del pool si está en progreso
  if (initPromise) {
    await initPromise;
  }

  if (pool && isConnected) {
    try {
      const sql = `SELECT * FROM inscriptions ORDER BY created_at DESC;`;
      const result = await pool.query(sql);
      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        kidName: row.kid_name,
        kidAge: row.kid_age,
        distance: row.distance,
        subject: row.subject,
        message: row.message,
        createdAt: row.created_at,
        read: row.read,
        source: 'postgresql'
      }));
    } catch (err) {
      console.warn('Fallo consulta a PostgreSQL, usando respaldo local:', err.message);
    }
  }

  // Respaldo local
  return contentStore.getLeads().map(l => ({ ...l, source: 'local' }));
}

// Eliminar una inscripción
async function deleteInscription(id) {
  // Esperar a que termine la inicialización del pool si está en progreso
  if (initPromise) {
    await initPromise;
  }

  contentStore.deleteLead(id);

  if (pool && isConnected) {
    try {
      await pool.query('DELETE FROM inscriptions WHERE id = $1;', [id]);
      return { success: true };
    } catch (err) {
      console.error('Error eliminando en PostgreSQL:', err.message);
      return { success: false, error: err.message };
    }
  }

  return { success: true };
}

function isPostgresConnected() {
  return isConnected;
}

module.exports = {
  saveInscription,
  getInscriptions,
  deleteInscription,
  isPostgresConnected,
  initDb
};
