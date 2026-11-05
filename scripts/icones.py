# Gera os PNGs do PWA a partir de public/icons/favicon.svg (uso: python3 scripts/icones.py)
from pathlib import Path
from playwright.sync_api import sync_playwright
svg = Path('public/icons/favicon.svg').read_text()
alvos = [('icon-192.png', 192, False), ('icon-512.png', 512, False), ('icon-maskable-512.png', 512, True), ('apple-touch-icon.png', 180, True)]
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    for nome, tam, cheio in alvos:
        pg = b.new_page(viewport={'width': tam, 'height': tam})
        conteudo = svg.replace('rx="112"', 'rx="0"') if cheio else svg
        escala = 0.8 if nome.startswith('icon-maskable') else 1
        pg.set_content(f'<html><body style="margin:0;background:{"#b24fb8" if cheio else "transparent"}"><div style="width:{tam}px;height:{tam}px;display:grid;place-items:center">'
                       f'<div style="width:{tam*escala}px;height:{tam*escala}px">{conteudo.replace("<svg ", "<svg width=100% height=100% ")}</div></div></body></html>')
        pg.screenshot(path=f'public/icons/{nome}', omit_background=not cheio)
    b.close()
