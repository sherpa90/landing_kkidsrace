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
      race_id VARCHAR(64),
      race_name VARCHAR(255),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      kid_name VARCHAR(255),
      kid_age INT,
      distance VARCHAR(100),
      emergency_contact VARCHAR(100),
      bib_number VARCHAR(20),
      consent_given BOOLEAN DEFAULT TRUE,
      subject VARCHAR(255),
      message TEXT,
      payment_proof VARCHAR(500),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      read BOOLEAN DEFAULT FALSE
    );
    ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS race_id VARCHAR(64);
    ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS race_name VARCHAR(255);
    ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(100);
    ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS bib_number VARCHAR(20);
    ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS consent_given BOOLEAN DEFAULT TRUE;
    ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS payment_proof VARCHAR(500);
    ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS tutor_rut VARCHAR(30);
  `;
  try {
    await pool.query(sql);
    console.log('✅ Tabla "inscriptions" verificada en PostgreSQL (con payment_proof).');
  } catch (err) {
    console.error('Error creando tabla inscriptions:', err);
  }
}

// Inicializar al cargar (async, no bloquea)
initPromise = initDb();

// Guardar nueva inscripción (PostgreSQL con respaldo local)
async function saveInscription(data) {
  const id = data.id || (crypto.randomUUID ? crypto.randomUUID() : `insc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
  const raceId = data.raceId || 'race-2026-primavera';
  const raceName = data.raceName || 'KidsRun 2026';
  const name = (data.name || data.tutorName || '').trim();
  const email = (data.email || '').trim();
  const phone = (data.phone || '').trim();
  const kidName = (data.kidName || '').trim();
  const kidAge = parseInt(data.kidAge, 10) || null;
  const distance = (data.distance || data.category || '').trim();
  const emergencyContact = (data.emergencyContact || phone || '').trim();
  const bibNumber = data.bibNumber || String(Math.floor(100 + Math.random() * 900));
  const consentGiven = Boolean(data.consentGiven !== false);
  const subject = (data.subject || (distance ? `Inscripción - ${distance}` : 'KidsRun')).trim();
  const message = (data.message || data.medicalNotes || '').trim();
  const paymentProof = (data.paymentProof || '').trim();
  const tutorRut = (data.tutorRut || data.rut || '').trim();
  const now = new Date().toISOString();

  // Esperar a que termine la inicialización del pool si está en progreso
  if (initPromise) {
    await initPromise;
  }

  // Intentar guardar en PostgreSQL si está disponible
  if (pool && isConnected) {
    try {
      const sql = `
        INSERT INTO inscriptions (id, race_id, race_name, name, email, phone, kid_name, kid_age, distance, emergency_contact, bib_number, consent_given, subject, message, payment_proof, tutor_rut, created_at, read)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, false)
        RETURNING *;
      `;
      const values = [id, raceId, raceName, name, email, phone, kidName, kidAge, distance, emergencyContact, bibNumber, consentGiven, subject, message, paymentProof, tutorRut, now];
      const result = await pool.query(sql, values);
      return { success: true, lead: result.rows[0], source: 'postgresql' };
    } catch (err) {
      console.error('Error guardando en PostgreSQL, guardado en respaldo local:', err.message);
      // Fallback: guardar en local
      contentStore.addLead({
        id, raceId, raceName, name, email, phone, kidName, kidAge, distance, emergencyContact, bibNumber, consentGiven, subject, message, paymentProof, tutorRut
      });
      return { success: true, source: 'local_backup' };
    }
  }

  // Sin PostgreSQL: guardar en local
  contentStore.addLead({
    id, raceId, raceName, name, email, phone, kidName, kidAge, distance, emergencyContact, bibNumber, consentGiven, subject, message, paymentProof, tutorRut
  });
  return { success: true, source: 'local' };
}

// Obtener todas las inscripciones
async function getInscriptions() {
  if (initPromise) {
    await initPromise;
  }

  if (pool && isConnected) {
    try {
      const sql = `SELECT * FROM inscriptions ORDER BY created_at DESC;`;
      const result = await pool.query(sql);
      const pgInscriptions = result.rows.map(row => ({
        id: row.id,
        raceId: row.race_id,
        raceName: row.race_name,
        name: row.name,
        email: row.email,
        phone: row.phone,
        kidName: row.kid_name,
        kidAge: row.kid_age,
        distance: row.distance,
        emergencyContact: row.emergency_contact,
        bibNumber: row.bib_number,
        consentGiven: row.consent_given,
        subject: row.subject,
        message: row.message,
        paymentProof: row.payment_proof || '',
        tutorRut: row.tutor_rut || '',
        createdAt: row.created_at,
        read: row.read,
        source: 'postgresql'
      }));

      // Incluir también inscripciones guardadas en el respaldo local durante caídas de BD
      const localLeads = contentStore.getLeads();
      if (localLeads.length > 0) {
        const pgIds = new Set(pgInscriptions.map(i => i.id));
        const localPending = localLeads.filter(l => !pgIds.has(l.id)).map(l => ({ ...l, source: 'local_backup' }));
        if (localPending.length > 0) {
          return [...pgInscriptions, ...localPending];
        }
      }

      return pgInscriptions;
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

  if (pool && isConnected) {
    try {
      await pool.query('DELETE FROM inscriptions WHERE id = $1;', [id]);
      // Solo eliminar del store local tras éxito en PostgreSQL
      contentStore.deleteLead(id);
      return { success: true };
    } catch (err) {
      console.error('Error eliminando en PostgreSQL:', err.message);
      return { success: false, error: err.message };
    }
  }

  // Sin PostgreSQL: eliminar del store local
  contentStore.deleteLead(id);
  return { success: true };
}

// Eliminar inscripciones masivamente (por array de IDs o 'ALL')
async function deleteInscriptionsBulk(ids) {
  if (initPromise) {
    await initPromise;
  }

  let deletedCount = 0;
  if (pool && isConnected) {
    try {
      if (ids === 'ALL') {
        const res = await pool.query('DELETE FROM inscriptions;');
        deletedCount = res.rowCount || 0;
      } else if (Array.isArray(ids) && ids.length > 0) {
        const res = await pool.query('DELETE FROM inscriptions WHERE id = ANY($1::text[]);', [ids]);
        deletedCount = res.rowCount || 0;
      }
      // Eliminar también del store local
      contentStore.deleteLeadsBulk(ids);
      return { success: true, count: deletedCount };
    } catch (err) {
      console.error('Error eliminando masivamente en PostgreSQL:', err.message);
      return { success: false, error: err.message };
    }
  }

  // Respaldo local
  return contentStore.deleteLeadsBulk(ids);
}

function isPostgresConnected() {
  return isConnected;
}

module.exports = {
  saveInscription,
  getInscriptions,
  deleteInscription,
  deleteInscriptionsBulk,
  isPostgresConnected,
  initDb
};
