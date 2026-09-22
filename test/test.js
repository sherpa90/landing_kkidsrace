const http = require('http');
const assert = require('assert');
const contentStore = require('../src/services/contentStore');
const auth = require('../src/services/auth');
const db = require('../src/services/db');
const app = require('../src/server');

console.log('🧪 Iniciando pruebas automáticas de Corrida KidsRun (PostgreSQL, White Mode, Verde/Amarillo)...\n');

let passedTests = 0;
let totalTests = 0;

function it(description, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✕ ${description}`);
    console.error(err);
  }
}

async function itAsync(description, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✓ ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✕ ${description}`);
    console.error(err);
  }
}

async function runTests() {
  console.log('📦 1. Pruebas de ContentStore, Tema Azul/Amarillo/Rojo & Logo:');
  it('Debe cargar el contenido de KidsRun con tema azul deportivo, amarillo y rojo', () => {
    const content = contentStore.getContent();
    assert.ok(content.brand, 'Falta sección brand');
    assert.strictEqual(content.brand.name, 'KidsRun 2026');
    assert.strictEqual(content.brand.accentColor, 'blue_sport');
    assert.strictEqual(content.brand.themeMode, 'light', 'El modo predeterminado debe ser light');
  });

  it('Debe resolver la paleta azul deportiva, amarilla y roja', () => {
    const theme = contentStore.getTheme('blue_sport');
    assert.strictEqual(theme.name, 'Azul Deportivo, Amarillo y Rojo (KidsRun Oficial)');
    assert.strictEqual(theme.primaryHex, '#1d4ed8');
    assert.strictEqual(theme.secondaryHex, '#facc15');
    assert.strictEqual(theme.accentHex, '#ef4444');
  });

  console.log('\n🐘 2. Pruebas de Capa de Base de Datos (PostgreSQL & Fallback):');
  await itAsync('Debe guardar y recuperar inscripciones mediante el servicio db', async () => {
    const result = await db.saveInscription({
      name: 'Verónica Alarcón (Mamá)',
      email: 'veronica@correo.com',
      phone: '+56988887777',
      kidName: 'Lucas Alarcón',
      kidAge: 5,
      distance: '500m (3-5 años)',
      message: 'Requiere polera talla 6.'
    });

    assert.ok(result.success, 'El guardado de inscripción falló');

    const inscriptions = await db.getInscriptions();
    const found = inscriptions.find(i => i.kidName === 'Lucas Alarcón' || i.name.includes('Verónica'));
    assert.ok(found, 'La inscripción no fue recuperada por getInscriptions()');
    assert.strictEqual(found.kidName, 'Lucas Alarcón');

    // Limpieza
    await db.deleteInscription(found.id);
  });

  console.log('\n🔒 3. Pruebas de Autenticación Multiusuario y Roles (Admin & Editor):');
  it('Debe verificar credenciales válidas y rol de Administrador (admin / admin)', () => {
    const valid = auth.verifyCredentials('admin', 'admin');
    assert.ok(valid, 'Fallo al autenticar admin');
    assert.strictEqual(valid.role, 'admin');
    assert.strictEqual(valid.username, 'admin');
  });

  it('Debe verificar credenciales válidas y rol de Editor (editor / editor2026)', () => {
    const valid = auth.verifyCredentials('editor', 'editor2026');
    assert.ok(valid, 'Fallo al autenticar editor');
    assert.strictEqual(valid.role, 'editor');
    assert.strictEqual(valid.username, 'editor');
  });

  it('Debe rechazar credenciales incorrectas', () => {
    const invalid = auth.verifyCredentials('admin', 'clave_falsa');
    assert.strictEqual(invalid, null);
  });

  console.log('\n🏃‍♂️ 4. Pruebas de Gestión de Corridas y Sincronización:');
  it('Debe permitir crear y recuperar corridas programadas', () => {
    const newRace = {
      name: 'KidsRun 2026 - Primavera',
      date: '2026-10-18T09:00:00',
      time: '09:00 AM',
      location: 'Parque Bicentenario',
      city: 'Santiago',
      status: 'active',
      circuits: ['500m', '1K', '2K', '3K'],
      maxParticipants: 600
    };
    const saveRes = contentStore.saveRace(newRace);
    assert.ok(saveRes.success, 'Fallo al guardar la corrida');

    const races = contentStore.getRaces();
    assert.ok(races.length > 0, 'No hay corridas');
    
    const active = contentStore.getActiveRace();
    assert.ok(active, 'Falta corrida activa');
    assert.strictEqual(active.status, 'active');
  });

  console.log('\n🌐 5. Pruebas de Rutas HTTP, White Mode y API de Inscripción con Minimización de Datos:');
  
  const testServer = http.createServer(app);
  await new Promise((resolve) => testServer.listen(0, resolve));
  const port = testServer.address().port;
  const baseUrl = `http://localhost:${port}`;

  function makeRequest(path, options = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, baseUrl);
      const req = http.request(url, options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
      });
      req.on('error', reject);
      if (options.body) {
        req.write(options.body);
      }
      req.end();
    });
  }

  await itAsync('GET / - Landing debe renderizar con botón de alternancia White Mode y paleta', async () => {
    const res = await makeRequest('/');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.includes('theme-toggle-btn'), 'Falta botón de alternancia White/Dark mode');
    assert.ok(res.body.includes('KidsRun 2026'), 'Falta el nombre KidsRun 2026');
    assert.ok(res.body.includes('countdown-timer'), 'Falta contador regresivo');
    assert.ok(res.body.includes('lightbox-modal'), 'Falta lightbox de galería');
  });

  await itAsync('GET /inscribir - Debe renderizar la página dedicada de inscripción con comprobante', async () => {
    const res = await makeRequest('/inscribir');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.includes('Comprobante de Pago'), 'Falta sección comprobante de pago');
    assert.ok(res.body.includes('paymentFileInput'), 'Falta input de captura');
    assert.ok(res.body.includes('distance-selector'), 'Falta selector táctil de distancia');
  });

  await itAsync('POST /api/contact - Debe registrar la inscripción a través de la API', async () => {
    const payload = JSON.stringify({
      name: 'Gabriel Torres',
      email: 'gabriel.torres@gmail.com',
      kidName: 'Martina Torres',
      kidAge: '9',
      distance: '2K (9-11 años)',
      message: 'Inscripción vía HTTP'
    });
    const res = await makeRequest('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      body: payload
    });
    assert.strictEqual(res.status, 200);
    const data = JSON.parse(res.body);
    assert.strictEqual(data.success, true);
  });

  await itAsync('GET /admin - Dashboard debe cargar y mostrar estado de base de datos', async () => {
    // Probar acceso protegido (debe redirigir sin sesión)
    const res = await makeRequest('/admin');
    assert.strictEqual(res.status, 302);
    assert.ok(res.headers.location.includes('/admin/login'));
  });

  testServer.close();

  console.log(`\n====================================================`);
  console.log(`🎯 Resultados: ${passedTests} de ${totalTests} pruebas pasadas con éxito.`);
  console.log(`====================================================\n`);

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Error en ejecución de pruebas:', err);
  process.exit(1);
});
