import re
import json

# 1. FIX JSON
with open('data/site-content.json', 'r') as f:
    content = json.load(f)

if 'bases' in content:
    b = content['bases']
    # Remove ticketera stuff
    b.pop('ticketeraUrl', None)
    b.pop('showTicketeraButton', None)
    b.pop('ticketeraButtonText', None)
    b.pop('showNavTicketeraButton', None)
    b.pop('navTicketeraButtonText', None)
    
    if 'registrationProcess' in b:
        b['registrationProcess']['exclusiveNotice'] = "Las inscripciones se realizan de forma oficial a través del formulario de esta página. El pago se realiza vía transferencia electrónica directa a la organización."
        b['registrationProcess']['instructions'] = "Para inscribirte, dirígete a la sección de 'Inscribir' en nuestro sitio oficial. Completa el formulario con los datos del corredor y apoderado. Luego adjunta el comprobante de transferencia."
        b['registrationProcess']['commissionNote'] = "La inscripción no tiene costo adicional ni comisiones de plataformas externas."

with open('data/site-content.json', 'w') as f:
    json.dump(content, f, indent=2, ensure_ascii=False)

# 2. FIX bases.ejs
with open('src/views/bases.ejs', 'r') as f:
    ejs = f.read()

# Replace Navbar CTA
ejs = re.sub(
    r'<!-- Botón Comprar Ticketera \(navbar\) -->.*?</a>\s*<% } %>',
    r'''<!-- Botón Inscribir (navbar) -->
        <a href="/inscribir" class="px-4 py-2 rounded-xl text-xs sm:text-sm font-black text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-600/20 active:scale-95 transition-all flex items-center gap-1.5 whitespace-nowrap">
          <i data-lucide="user-plus" class="w-3.5 h-3.5"></i>
          <span>Inscribirse Aquí</span>
        </a>''',
    ejs, flags=re.DOTALL
)

# Replace Mobile Menu CTA
ejs = re.sub(
    r'<% if \(content\.bases\?\.showTicketeraButton !== false && ticketeraLink\) \{ %>.*?Comprar Entrada \(Ticketera\).*?</a>\s*<% \} %>',
    r'''<a href="/inscribir" class="px-5 py-3 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-gray-950 text-xs sm:text-sm font-black shadow-lg shadow-yellow-400/20 transition-transform active:scale-95 flex items-center gap-2">
            <i data-lucide="user-plus" class="w-4 h-4"></i>
            <span>Inscribirse Oficial</span>
          </a>''',
    ejs, flags=re.DOTALL
)

# Replace Footer Ticketera Link
ejs = re.sub(
    r'<% if \(content\.bases\?\.showTicketeraButton !== false && ticketeraLink\) \{ %>\s*<a href="<%= ticketeraLink %>" target="_blank" rel="noopener noreferrer" class="hover:text-blue-600 dark:hover:text-yellow-400 font-bold transition-colors">Ticketera</a>\s*<% \} %>',
    r'''<a href="/inscribir" class="hover:text-blue-600 dark:hover:text-yellow-400 font-bold transition-colors">Inscripción</a>''',
    ejs
)

# Replace Bottom Ticketera Button
ejs = re.sub(
    r'<% if \(content\.bases\?\.showTicketeraButton !== false && ticketeraLink\) \{ %>\s*<a href="<%= ticketeraLink %>".*?>.*?<span>.*?Comprar Entrada Oficial.*?</span>.*?</a>\s*<% \} %>',
    r'''<a href="/inscribir" class="px-6 py-3 rounded-2xl text-sm font-black text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-transform active:scale-95 flex items-center gap-2">
          <span>Ir al Formulario de Inscripción</span>
          <i data-lucide="arrow-right" class="w-4 h-4"></i>
        </a>''',
    ejs, flags=re.DOTALL
)

# Replace the whole SECTION 3
new_section3 = r'''<!-- SECCIÓN 3: PROCESO DE INSCRIPCIÓN OFICIAL -->
    <section class="p-6 sm:p-8 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200/90 dark:border-white/10 shadow-sm space-y-6">
      <div class="pb-4 border-b border-slate-100 dark:border-gray-800">
        <div class="flex items-center gap-2 text-xs font-black text-blue-600 dark:text-yellow-400 uppercase tracking-wider">
          <i data-lucide="user-plus" class="w-4 h-4"></i>
          <span>Plataforma Oficial de Compra</span>
        </div>
        <h2 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">Proceso de Inscripción</h2>
      </div>

      <!-- Cuadro de Proceso Oficial -->
      <div class="p-5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-start gap-4">
        <div class="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
          <i data-lucide="info" class="w-5 h-5"></i>
        </div>
        <div class="text-xs leading-relaxed space-y-1">
          <strong class="text-sm font-black text-blue-950 dark:text-blue-200 block">Nota Importante:</strong>
          <p class="text-blue-900 dark:text-blue-300">
            <%= content.bases?.registrationProcess?.exclusiveNotice || 'Las inscripciones se realizan de forma oficial a través del formulario de esta página. El pago se realiza vía transferencia electrónica directa a la organización.' %>
          </p>
        </div>
      </div>

      <!-- Detalle paso a paso -->
      <div class="space-y-4 text-xs sm:text-sm text-slate-700 dark:text-gray-300 leading-relaxed">
        <p>
          <%= content.bases?.registrationProcess?.instructions || 'Para inscribirte, dirígete a la sección de Inscribir en nuestro sitio oficial. Completa el formulario con los datos del corredor y apoderado. Luego adjunta el comprobante de transferencia.' %>
        </p>
        <p class="text-slate-500 dark:text-gray-400 italic">
          <%= content.bases?.registrationProcess?.commissionNote || 'La inscripción no tiene costo adicional ni comisiones de plataformas externas.' %>
        </p>
      </div>

      <!-- Soporte y CTA -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-gray-800">
        <div class="flex items-center gap-2 text-xs text-slate-500 dark:text-gray-400">
          <i data-lucide="headphones" class="w-4 h-4 text-blue-500"></i>
          <span>¿Necesitas ayuda con la inscripción? Contacta soporte:</span>
          <% const supportEmail = content.bases?.supportEmail || 'soporte@kkidsrace.cl'; %>
          <a href="mailto:<%= supportEmail %>" class="font-bold text-blue-600 dark:text-yellow-400 hover:underline"><%= supportEmail %></a>
        </div>

        <a href="/inscribir" class="px-6 py-3 rounded-2xl text-xs sm:text-sm font-black text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/30 active:scale-95 transition-all flex items-center justify-center gap-2">
          <span>Ir a Inscribirse</span>
          <i data-lucide="arrow-right" class="w-4 h-4"></i>
        </a>
      </div>
    </section>'''

ejs = re.sub(
    r'<!-- SECCIÓN 3: PROCESO DE INSCRIPCIÓN EXCLUSIVO POR TICKETERA -->.*?</section>',
    new_section3,
    ejs, flags=re.DOTALL
)

with open('src/views/bases.ejs', 'w') as f:
    f.write(ejs)

print("Ticketera references removed successfully")
