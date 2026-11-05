# Geliştirme yardımcısı: python3 dev/i18n-add.py dosya.json — {"tr": {...}, "en": {...}} anahtarlarını
# i18n.js sözlüklerinin sonuna ('nowebgl' satırından önce) ekler.
import json, re, sys
add = json.load(open(sys.argv[1], encoding='utf-8'))
p = 'js/ui/i18n.js'
s = open(p, encoding='utf-8').read()
def lit(v):
    return "'" + v.replace('\\', '\\\\').replace("'", "\\'") + "'"
for lang in ('tr', 'en'):
    block = ''.join(f"    {lit(k)}: {lit(v)},\n" for k, v in add[lang].items())
    head = s.index(f'  {lang}: {{')
    i = s.index("    'nowebgl'", head)
    s = s[:i] + block + s[i:]
open(p, 'w', encoding='utf-8').write(s)
print('eklendi:', len(add['tr']), len(add['en']))
