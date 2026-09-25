with open("src/views/inscribir.ejs", "r") as f:
    text = f.read()

old = """        <!-- BOTONES DE ACCIÓN POST-INSCRIPCIÓN: DESCARGAR TICKET / COMPARTIR -->
        <div class="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">"""

new = """        <!-- BOTONES DE ACCIÓN POST-INSCRIPCIÓN: DESCARGAR TICKET / COMPARTIR -->
        <div class="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">"""

# Add the extra buttons block after the closing button div
old_end = """        </div>
      </div>
    </form>"""

new_end = """        </div>

        <!-- BOTÓN PARA INSCRIBIR MÁS HIJOS DEL MISMO APODERADO -->
        <div class="pt-4 border-t border-white/20 mt-4">
          <p class="text-xs text-white/60 mb-3 text-center">¿Tienes más hijos que inscribir con el mismo apoderado?</p>
          <button type="button" id="btn-register-more-kids"
            class="w-full inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-black text-sm px-6 py-4 rounded-2xl border border-white/30 transition-all cursor-pointer active:scale-95 backdrop-blur-md">
            <i data-lucide="user-plus" class="w-5 h-5 text-amber-300"></i>
            <span>Inscribir más hijos con el mismo apoderado</span>
          </button>
        </div>
      </div>
    </form>"""

text = text.replace(old_end, new_end, 1)

with open("src/views/inscribir.ejs", "w") as f:
    f.write(text)

