import json

path = './data/site-content.json'
with open(path, 'r') as f:
    content = json.load(f)

if 'seo' in content:
    content['seo']['metaDescription'] = content['seo']['metaDescription'].replace(', medalla finisher garantizada para todos, ', ' y ')

if 'hero' in content:
    content['hero']['subheadline'] = content['hero']['subheadline'].replace(' y medalla finisher garantizada para todos', '')
    content['hero']['statsNotice'] = content['hero']['statsNotice'].replace('🏅 Medalla finisher de metal garantizada para todos los niños', '🏆 Premiación con medallas para los primeros lugares')

if 'metrics' in content:
    for m in content['metrics']:
        if m.get('label') == 'Medallas Finisher Garantizadas':
            m['label'] = 'Premiación Primeros Lugares'

if 'gallery' in content and 'items' in content['gallery']:
    for g in content['gallery']['items']:
        if g.get('title') == 'Medallas de Metal para Todos':
            g['title'] = 'Medallas para los Primeros Lugares'
            g['caption'] = 'Los primeros lugares reciben su medalla grabada.'

if 'pricing' in content:
    content['pricing']['subtitle'] = content['pricing']['subtitle'].replace(' y medalla finisher de metal garantizada', '')
    if 'plans' in content['pricing']:
        for p in content['pricing']['plans']:
            if 'features' in p:
                new_features = []
                for f in p['features']:
                    if 'Medalla finisher de metal oficial garantizada' in f or 'Medalla finisher garantizada al cruzar la meta' in f:
                        new_features.append('Opción a medalla para primeros lugares')
                    else:
                        new_features.append(f)
                p['features'] = new_features

if 'testimonials' in content:
    for t in content['testimonials']:
        if 'medalla que durmió con ella' in t.get('quote', ''):
            t['quote'] = t['quote'].replace('medalla que durmió con ella', 'participación que durmió con la polera')

if 'faq' in content:
    for f in content['faq']:
        if '¿Todos los participantes reciben medalla?' in f.get('question', ''):
            f['question'] = '¿Quiénes reciben medalla?'
            f['answer'] = 'Los primeros lugares de cada categoría recibirán una medalla de metal oficial durante la premiación general a las 13:10 horas.'

if 'faqs' in content:
    for f in content['faqs']:
        if '¿Todos los participantes reciben medalla?' in f.get('question', ''):
            f['question'] = '¿Quiénes reciben medalla?'
            f['answer'] = 'Los primeros lugares de cada categoría recibirán una medalla de metal oficial durante la premiación general a las 13:10 horas.'

if 'construction' in content:
    if 'subtitle' in content['construction']:
        content['construction']['subtitle'] = content['construction']['subtitle'].replace(', medallas y diversión', ' y mucha diversión')

if 'bases' in content:
    if 'closingBannerText' in content['bases']:
        content['bases']['closingBannerText'] = content['bases']['closingBannerText'].replace(', medalla oficial', '')

if 'registrationForm' in content:
    if content['registrationForm'].get('badge1Text') == 'Medalla Finisher':
        content['registrationForm']['badge1Text'] = 'Polera Oficial'

with open(path, 'w') as f:
    json.dump(content, f, indent=2, ensure_ascii=False)

print("JSON updated successfully")
