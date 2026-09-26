import os

files_to_update = {
    'src/views/index.ejs': [
        ('con medalla para todos los niños.', 'con premios para los primeros lugares.'),
        ('🏅 Medalla finisher garantizada para todos los niños • Cupos limitados', '🏆 Premiación con medallas para primeros lugares • Cupos limitados'),
        ('<i data-lucide="award" class="w-3.5 h-3.5 text-amber-500"></i> Medalla Finisher', '<i data-lucide="award" class="w-3.5 h-3.5 text-amber-500"></i> Premiación'),
        ('y medalla finisher de metal garantizada.', 'y opción a premiación.'),
        ('Medalla garantizada al cruzar la meta', 'Opción a medalla para primeros lugares'),
        ('🏅 Kit y medalla oficial', '🏅 Kit oficial de corredor')
    ],
    'src/views/admin/dashboard.ejs': [
        ('fotos de la carrera, medallas y familias', 'fotos de la carrera y familias'),
        ('🏅 Medalla finisher garantizada para todos los niños', '🏆 Premiación con medallas para primeros lugares'),
        ('100% Medallas Aseguradas', 'Premiación a Primeros Lugares'),
        ("label: 'Medallas Finisher Aseguradas'", "label: 'Premiación Primeros Lugares'"),
        ('Medalla Finisher', 'Polera Oficial'),
        ('medalla finisher al cruzar la meta', 'opción a medalla para primeros lugares'),
        ('horarios y medallas.', 'horarios y premiación.'),
        ('aventuras, medallas y diversión', 'aventuras y mucha diversión')
    ],
    'src/public/js/admin.js': [
        ('Medalla finisher al cruzar la meta', 'Opción a medalla para primeros lugares')
    ],
    'src/views/construction.ejs': [
        ('aventuras, medallas y diversión', 'aventuras y mucha diversión'),
        ('🏅 MEDALLAS', '🏅 PREMIACIÓN'),
        ('con medalla oficial garantizada.', 'con acceso a premiación.'),
        ('Medalla Finisher', 'Polera Oficial')
    ],
    'src/views/bases.ejs': [
        ('Medalla oficial', 'Premiación primeros lugares'),
        ('cupo, medalla oficial y polera', 'cupo y polera')
    ],
    'src/views/inscribir.ejs': [
        ('asegura su kit con medalla oficial.', 'asegura su kit oficial.'),
        ('Medalla Finisher', 'Polera Oficial')
    ],
    'src/services/emailService.js': [
        ('número y medalla finisher garantizada', 'número y pulsera')
    ]
}

for filepath, replacements in files_to_update.items():
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r') as f:
        content = f.read()
    
    for old, new in replacements:
        content = content.replace(old, new)
        
    with open(filepath, 'w') as f:
        f.write(content)

print("Templates updated successfully")
