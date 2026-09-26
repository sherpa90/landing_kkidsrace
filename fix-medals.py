import json
import os

# Fix JSON first
path = 'data/site-content.json'
with open(path, 'r') as f:
    content = json.load(f)

if 'gallery' in content and 'items' in content['gallery']:
    for g in content['gallery']['items']:
        if 'Todos' in g.get('title', '') and 'Medalla' in g.get('title', ''):
            g['title'] = 'Medallas para los Primeros Lugares'
        if 'Cada niño recibe' in g.get('caption', ''):
            g['caption'] = 'Los primeros lugares reciben su medalla grabada.'

if 'registrationForm' in content:
    if content['registrationForm'].get('badge1Sub') == '100% garantizada':
        content['registrationForm']['badge1Sub'] = '100% original'

with open(path, 'w') as f:
    json.dump(content, f, indent=2, ensure_ascii=False)

# Now fix the EJS and JS files
replacements = {
    'src/views/index.ejs': [
        ('Reserva su cupo y medalla oficial', 'Reserva su cupo y polera oficial')
    ],
    'src/views/admin/dashboard.ejs': [
        ('Medalla finisher al cruzar la meta', 'Opción a medalla para primeros lugares'),
        ("value=\"<%= rf.badge1Sub || '100% garantizada' %>\"", "value=\"<%= rf.badge1Sub || '100% original' %>\""),
        ('100% garantizada', '100% original')
    ],
    'src/views/inscribir.ejs': [
        ('100% garantizada', '100% original')
    ],
    'src/public/js/admin.js': [
        ('medalla finisher y seguro', 'polera oficial y seguro'),
        ('Medalla finisher al cruzar la meta', 'Opción a medalla para primeros lugares')
    ]
}

for filepath, reps in replacements.items():
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r') as f:
        data = f.read()
    for old, new in reps:
        data = data.replace(old, new)
    with open(filepath, 'w') as f:
        f.write(data)

print("Done")
