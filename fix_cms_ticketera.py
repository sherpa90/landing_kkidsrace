import re

with open('src/views/admin/dashboard.ejs', 'r') as f:
    ejs = f.read()

# Remove ticketera fields from CMS
ejs = re.sub(
    r'<label class="block text-xs font-semibold text-gray-300 mb-1\.5">Enlace Comprar Entrada \(Ticketera\).*?</label>\s*<input type="url" id="input-basesTicketeraUrl".*?>',
    '', ejs, flags=re.DOTALL
)

ejs = re.sub(
    r'<!-- Botón Comprar Ticketera Hero -->.*?<!-- Botón Comprar Ticketera Navbar -->',
    '<!-- Botón Comprar Ticketera Navbar -->', ejs, flags=re.DOTALL
)

ejs = re.sub(
    r'<!-- Botón Comprar Ticketera Navbar -->.*?</div>\s*</div>',
    '', ejs, flags=re.DOTALL
)

ejs = re.sub(
    r'Administra la información de la página dedicada <a href="/bases" target="_blank" class="text-amber-400 hover:underline font-mono">/bases</a> \(enlace a PDF, Ticketera, largadas y retiro de kits\)\.',
    r'Administra la información de la página dedicada <a href="/bases" target="_blank" class="text-amber-400 hover:underline font-mono">/bases</a> (enlace a PDF, largadas y retiro de kits).',
    ejs
)

ejs = re.sub(
    r'<!-- Proceso de Inscripción & Exclusividad Ticketera -->.*?<div class="space-y-4">',
    r'<!-- Proceso de Inscripción -->\n              <div class="space-y-4">',
    ejs, flags=re.DOTALL
)

ejs = re.sub(
    r'<label class="block text-xs font-semibold text-gray-300 mb-1\.5">Aviso de Exclusividad Ticketera \(Caja de Alerta\)</label>',
    r'<label class="block text-xs font-semibold text-gray-300 mb-1.5">Aviso Importante (Caja de Alerta)</label>',
    ejs
)

ejs = re.sub(
    r'<%= content\.bases\?\.registrationProcess\?\.exclusiveNotice \|\| \'.*?\' %>',
    r'<%= content.bases?.registrationProcess?.exclusiveNotice || \'Las inscripciones se realizan de forma oficial a través del formulario de esta página. El pago se realiza vía transferencia electrónica directa a la organización.\' %>',
    ejs
)

ejs = re.sub(
    r'<%= content\.bases\?\.registrationProcess\?\.instructions \|\| \'.*?\' %>',
    r'<%= content.bases?.registrationProcess?.instructions || \'Para inscribirte, dirígete a la sección de Inscribir en nuestro sitio oficial. Completa el formulario con los datos del corredor y apoderado. Luego adjunta el comprobante de transferencia.\' %>',
    ejs
)

ejs = re.sub(
    r'<%= content\.bases\?\.registrationProcess\?\.commissionNote \|\| \'.*?\' %>',
    r'<%= content.bases?.registrationProcess?.commissionNote || \'La inscripción no tiene costo adicional ni comisiones de plataformas externas.\' %>',
    ejs
)

with open('src/views/admin/dashboard.ejs', 'w') as f:
    f.write(ejs)


with open('src/public/js/admin.js', 'r') as f:
    js = f.read()

js = re.sub(
    r'ticketeraUrl: getVal\(\'input-basesTicketeraUrl\'\),.*?navTicketeraButtonText: getVal\(\'input-bases-navTicketeraButtonText\'\) \|\| \'Comprar Entrada\',',
    '', js, flags=re.DOTALL
)

with open('src/public/js/admin.js', 'w') as f:
    f.write(js)

print("CMS ticketera references fixed!")
