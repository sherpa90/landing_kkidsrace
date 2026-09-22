const http = require('http');
const assert = require('assert');
const contentStore = require('../src/services/contentStore');
const auth = require('../src/services/auth');
const db = require('../src/services/db');
const app = require('../src/server');

console.log('🧪 Iniciando suite de pruebas de seguridad y funcionalidad OWASP KidsRun...\n');

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
  console.log('📦 1. Pruebas de ContentStore & Paleta Visual:');
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

  console.log('\n🐘 2. Pruebas de Capa de Persistencia y Base de Datos:');
  await itAsync('Debe guardar y recuperar inscripciones mediante el servicio db', async () => {
    const result = await db.saveInscription({
      name: 'Verónica Alarcón (Mamá)',
      email: 'veronica@correo.com',
      phone: '+56988887777',
      kidName: 'Lucas Alarcón',
      kidAge: 5,
      distance: '500 Metros (3-5 años)',
      message: 'Requiere polera talla 6.'
    });

    assert.ok(result.success, 'El guardado de inscripción falló');

    const inscriptions = await db.getInscriptions();
    const found = inscriptions.find(i => i.kidName === 'Lucas Alarcón' || (i.name && i.name.includes('Verónica')));
    assert.ok(found, 'La inscripción no fue recuperada por getInscriptions()');
    assert.strictEqual(found.kidName, 'Lucas Alarcón');

    // Limpieza
    await db.deleteInscription(found.id);
  });

  console.log('\n🔒 3. Pruebas de Seguridad OWASP - Autenticación y Control de Acceso:');
  it('OWASP A01/A07: Debe autenticar credenciales legítimas de admin con bcrypt', () => {
    const valid = auth.verifyCredentials('admin', 'admin', '127.0.0.1');
    assert.ok(valid, 'Fallo al autenticar admin');
    assert.strictEqual(valid.role, 'admin');
    assert.strictEqual(valid.username, 'admin');
  });

  it('OWASP A07: Debe rechazar intento de acceso con credencial hardcodeada root/root', () => {
    const invalidRoot = auth.verifyCredentials('root', 'root', '127.0.0.1');
    assert.strictEqual(invalidRoot, null, 'El usuario root no debe existir ni autenticar');
  });

  it('OWASP A07: Debe rechazar contraseñas inválidas', () => {
    const invalid = auth.verifyCredentials('admin', 'password_incorrecta_123', '127.0.0.1');
    assert.strictEqual(invalid, null);
  });

  it('OWASP A07: Debe aplicar Account Lockout tras múltiples intentos fallidos', () => {
    const testTarget = 'editor_test_lockout_' + Date.now();
    for (let i = 0; i < 5; i++) {
      auth.verifyCredentials(testTarget, 'wrong', '127.0.0.1');
    }
    const lockedRes = auth.verifyCredentials(testTarget, 'wrong', '127.0.0.1');
    assert.ok(lockedRes && lockedRes.locked, 'La cuenta debió ser bloqueada tras 5 intentos fallidos');
  });

  console.log('\n🏃‍♂️ 4. Pruebas de Gestión de Corridas:');
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

  console.log('\n🌐 5. Pruebas de Seguridad HTTP, Formularios y Protección CSRF:');
  
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

  await itAsync('GET / - Landing debe renderizar correctamente y emitir sesión con cabeceras de seguridad', async () => {
    const res = await makeRequest('/');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.includes('theme-toggle-btn'), 'Falta botón de alternancia White/Dark mode');
    assert.ok(res.body.includes('KidsRun 2026'), 'Falta el nombre KidsRun 2026');
    assert.ok(res.headers['content-security-policy'], 'Debe tener cabecera CSP activa');
    assert.ok(res.headers['permissions-policy'], 'Debe tener cabecera Permissions-Policy');
  });

  let sessionCookies = '';
  let extractedCsrfToken = '';

  await itAsync('GET /inscribir - Debe renderizar página con token CSRF y campos de protección', async () => {
    const res = await makeRequest('/inscribir');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.includes('name="csrfToken"'), 'Debe incluir input con token CSRF');
    assert.ok(res.body.includes('name="website_url"'), 'Debe incluir campo Honeypot invisible');

    if (res.headers['set-cookie']) {
      sessionCookies = res.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
    }

    const match = res.body.match(/id="csrfTokenField"\s+name="csrfToken"\s+value="([^"]+)"/);
    if (match) {
      extractedCsrfToken = match[1];
    }
    assert.ok(extractedCsrfToken.length > 10, 'El token CSRF debe ser una cadena segura no vacía');
  });

  await itAsync('OWASP A01: POST /api/contact sin CSRF token debe ser rechazado con HTTP 403', async () => {
    const payload = JSON.stringify({
      name: 'Atacante CSRF',
      email: 'hacker@malicious.com',
      kidName: 'Sin Token',
      distance: '500 Metros (3-5 años)'
    });
    const res = await makeRequest('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      body: payload
    });
    assert.strictEqual(res.status, 403, 'Petición sin CSRF token debe retornar 403');
  });

  await itAsync('OWASP A03/A04: POST /api/contact con RUT chileno inválido debe ser rechazado', async () => {
    const payload = JSON.stringify({
      name: 'Juan Perez',
      email: 'juan@valido.cl',
      kidName: 'Tomas Perez',
      kidAge: 6,
      distance: '500 Metros (3-5 años)',
      tutorRut: '11.111.111-0' // Dígito verificador inválido
    });
    const res = await makeRequest('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Cookie': sessionCookies,
        'X-CSRF-Token': extractedCsrfToken
      },
      body: payload
    });
    assert.strictEqual(res.status, 400, 'RUT inválido debe retornar 400');
    const data = JSON.parse(res.body);
    assert.ok(data.error.includes('RUT'), 'El mensaje debe indicar error en el RUT');
  });

  await itAsync('OWASP A04: POST /api/contact con Honeypot lleno debe descartar envío simulando éxito', async () => {
    const payload = JSON.stringify({
      name: 'Spam Bot',
      email: 'spammer@botnet.ru',
      kidName: 'BotKid',
      distance: '500 Metros (3-5 años)',
      website_url: 'http://spam-link.ru' // Honeypot activo
    });
    const res = await makeRequest('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Cookie': sessionCookies,
        'X-CSRF-Token': extractedCsrfToken
      },
      body: payload
    });
    assert.strictEqual(res.status, 200);
    const data = JSON.parse(res.body);
    assert.strictEqual(data.success, true);
  });

  await itAsync('POST /api/contact con datos válidos y CSRF token debe registrar la inscripción', async () => {
    const payload = JSON.stringify({
      name: 'Gabriel Torres',
      email: 'gabriel.torres@gmail.com',
      phone: '+56912345678',
      tutorRut: '11.111.111-1', // RUT válido
      kidName: 'Martina Torres',
      kidAge: 9,
      distance: '1 Kilómetro (6-8 años)',
      consentGiven: true
    });
    const res = await makeRequest('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Cookie': sessionCookies,
        'X-CSRF-Token': extractedCsrfToken
      },
      body: payload
    });
    assert.strictEqual(res.status, 200);
    const data = JSON.parse(res.body);
    assert.strictEqual(data.success, true);
  });

  await itAsync('GET /admin - Dashboard debe protegerse y redirigir al login si no hay sesión', async () => {
    const res = await makeRequest('/admin');
    assert.strictEqual(res.status, 302);
    assert.ok(res.headers.location.includes('/admin/login'));
  });

  await itAsync('Logo Oficial: Debe reemplazar el logo/icono por defecto en la portada cuando brand.logoUrl está configurado', async () => {
    // 1. Guardar logo personalizado
    const testLogoUrl = '/uploads/test-brand-logo.webp';
    contentStore.saveContent({ brand: { logoUrl: testLogoUrl } });

    // 2. Comprobar que el HTML renderizado en la portada contiene la etiqueta <img src="/uploads/test-brand-logo.webp">
    const res = await makeRequest('/');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.includes(testLogoUrl), 'El HTML de la portada debe contener la URL del logo personalizado');

    // 2b. Comprobar que el bloque de texto con el lema en el header fue ocultado
    assert.ok(!res.body.includes('Corrida Infantil & Familiar') || !res.body.includes('group-hover:text-blue-600'), 'El texto/lema al lado del logo no debe mostrarse si hay logo personalizado');

    // 3. Restaurar logo para no alterar el estado por defecto
    contentStore.saveContent({ brand: { logoUrl: '' } });
    const resRestored = await makeRequest('/');
    assert.strictEqual(resRestored.status, 200);
    assert.ok(!resRestored.body.includes(testLogoUrl), 'Al limpiar logoUrl, debe volver a mostrar el logo/icono por defecto');
  });

  testServer.close();

  console.log(`\n====================================================`);
  
// ==========================================
// 6. Pruebas de Secciones Dinámicas (Orden y Visibilidad)
// ==========================================
console.log('\n🧩 6. Pruebas de Secciones Dinámicas (Page Builder):');
try {
  // Test contentStore save and retrieve sections
  const contentStore = require('../src/services/contentStore');
  const current = contentStore.getContent();
  const testOrder = ["venue", "sponsors", "countdown", "hero", "circuits", "schedule", "gallery", "kits", "testimonials", "faq", "contact"];
  
  const saved = contentStore.saveContent({
    sections: {
      order: testOrder,
      visibility: {
        venue: true,
        sponsors: false,
        countdown: true
      }
    }
  });
  
  const updated = contentStore.getContent();
  if (updated.sections && updated.sections.order[0] === 'venue' && updated.sections.visibility.sponsors === false) {
    console.log('  ✓ Debe guardar y recuperar el orden y visibilidad de secciones');
  } else {
    throw new Error('Fallo al persistir orden o visibilidad de secciones');
  }
  
  // Restore original
  if (current.sections) {
    contentStore.saveContent({ sections: current.sections });
  }
} catch (e) {
  console.error('  ✕ Error en pruebas de secciones:', e.message);
  process.exit(1);
}


// ==========================================
// 7. Pruebas de Servicio de Email (Resend)
// ==========================================
console.log('\n📧 7. Pruebas de Servicio de Email (Auto-responder):');
try {
  const emailService = require('../src/services/emailService');
  // Prueba modo simulado cuando no hay API Key configurada
  const result = await emailService.sendInscriptionConfirmation({
    raceName: 'KidsRun 2026 Test',
    name: 'Familia Test',
    email: 'test@familia.cl',
    kidName: 'Lucas Runner',
    kidAge: 6,
    distance: '1 Kilómetro',
    tutorRut: '12.345.678-9'
  });
  if (result.success && result.simulated) {
    console.log('  ✓ Debe procesar plantilla de confirmación de inscripción en modo seguro');
  } else {
    throw new Error('Fallo al generar plantilla o procesar envío seguro');
  }
} catch (e) {
  console.error('  ✕ Error en prueba de emailService:', e.message);
  process.exit(1);
}

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
