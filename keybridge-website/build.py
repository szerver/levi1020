#!/usr/bin/env python3
"""Keybridge Exit Partners weboldal: statikus oldalgenerátor.

Használat:
  python3 build.py            -> dist/     (éles változat, tiszta URL-ekkel: /program/)
  python3 build.py preview    -> preview/  (előnézet: minden hivatkozás index.html-re mutat)

A tartalom az src/pages és src/articles mappában van, a cégadatok a site.json fájlban.
"""
import os, re, sys, json, html, shutil, datetime

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'src')
PREVIEW = len(sys.argv) > 1 and sys.argv[1] == 'preview'
OUT = os.path.join(ROOT, 'preview' if PREVIEW else 'dist')
if len(sys.argv) > 2:
    OUT = os.path.abspath(sys.argv[2])
CFG = json.load(open(os.path.join(ROOT, 'site.json'), encoding='utf8'))
BASE = CFG['url'].rstrip('/')
TODAY = datetime.date.today().isoformat()
MONTHS = ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december']

AUTHORS = {
    'levente': {'name': 'Kohári Levente', 'title': 'Partner, CFA® charterholder, EFA®', 'img': '/assets/img/kohari-levente-320.webp',
                'bio': 'Befektetési tanácsadó, korábban portfóliókezelő az Egyesült Államokban. A Keybridge-nél az értékelés, a tulajdonosi vagyonstratégia és a tranzakciós felkészítés pénzügyi oldaláért felel.',
                'url': '/partnerek/#kohari-levente'},
    'kb': {'name': 'Keybridge Exit Partners', 'title': 'Szerkesztőség', 'img': '',
           'bio': 'A cikket a Keybridge partnerei közösen írták és ellenőrizték. A felhasznált forrásokat a cikk végén soroljuk fel.',
           'url': '/partnerek/'},
}
CATS = {'ertek': 'Érték és értékelés', 'tranzakcio': 'Cégeladás', 'utodlas': 'Utódlás és család', 'mukodes': 'Önjáró cég', 'vagyon': 'Vagyon és jog'}

NAV = [('program', 'Program', '/program/'), ('exit-utak', 'Exit utak', '/exit-utak/'), ('bvk', 'Bizalmi vagyonkezelés', '/bizalmi-vagyonkezeles/'),
       ('tudastar', 'Tudástár', '/tudastar/'), ('partnerek', 'Partnerek', '/partnerek/'), ('kapcsolat', 'Kapcsolat', '/kapcsolat/')]


def esc(s):
    return html.escape(s, quote=True)


def slugify(s):
    s = html.unescape(re.sub(r'<[^>]+>', '', s)).lower()
    for a, b in zip('áéíóöőúüű', 'aeiooouuu'):
        s = s.replace(a, b)
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')[:70]


def hu_date(iso):
    y, m, d = iso.split('-')
    return f'{y}. {MONTHS[int(m) - 1]} {int(d)}.'


def parse(path):
    raw = open(path, encoding='utf8').read()
    head, body = raw.split('\n---\n', 1)
    meta = {}
    for line in head.splitlines():
        if ':' in line:
            k, v = line.split(':', 1)
            meta[k.strip()] = v.strip()
    meta['body'] = body
    return meta


def relurl(target, cur):
    frag = ''
    if '#' in target:
        target, frag = target.split('#', 1)
        frag = '#' + frag
    cur_dir = cur if cur.endswith('/') else cur.rsplit('/', 1)[0] + '/'
    depth = len([p for p in cur_dir.strip('/').split('/') if p])
    t = target.lstrip('/')
    if target.endswith('/'):
        if PREVIEW:
            t += 'index.html'
    out = '../' * depth + t
    if out == '':
        out = './'
    return out + frag


def relink(doc, cur):
    def one(m):
        return f'{m.group(1)}="{relurl(m.group(2), cur)}"'
    doc = re.sub(r'\b(href|src|poster|data-href)="(/(?!/)[^"]*)"', one, doc)

    def srcset(m):
        parts = []
        for p in m.group(1).split(','):
            p = p.strip()
            bits = p.split(' ', 1)
            if bits[0].startswith('/'):
                bits[0] = relurl(bits[0], cur)
            parts.append(' '.join(bits))
        return 'srcset="' + ', '.join(parts) + '"'
    return re.sub(r'srcset="([^"]*)"', srcset, doc)


def text(k):
    v = CFG.get(k, '')
    if not v:
        return ''
    if v.startswith('['):
        return f'<span class="ph-note">{esc(v)}</span>'
    return esc(v)


def fill(s):
    """{{cfg:kulcs}} helyettesítés a tartalomban."""
    return re.sub(r'\{\{cfg:([a-z_]+)\}\}', lambda m: text(m.group(1)), s)


# ---------- betöltés ----------
pages = []
for f in sorted(os.listdir(os.path.join(SRC, 'pages'))):
    if f.endswith('.html'):
        p = parse(os.path.join(SRC, 'pages', f))
        p.setdefault('type', 'page')
        pages.append(p)
articles = []
for f in sorted(os.listdir(os.path.join(SRC, 'articles'))):
    if f.endswith('.html'):
        a = parse(os.path.join(SRC, 'articles', f))
        a['slug'] = f[:-5]
        a['url'] = f'/tudastar/{a["slug"]}/'
        a['type'] = 'article'
        a['nav'] = 'tudastar'
        a.setdefault('author', 'kb')
        a.setdefault('updated', a['date'])
        articles.append(a)
articles.sort(key=lambda a: a['date'], reverse=True)
BYURL = {p['url']: p for p in pages + articles}
SEO = json.load(open(os.path.join(SRC, 'seo.json'), encoding='utf8'))  # keresőcím (max. 60) és leírás (max. 158 karakter) oldalanként


def crumbs_for(p):
    out = [('Főoldal', '/')]
    parts = [x for x in p['url'].strip('/').split('/') if x]
    acc = '/'
    for part in parts[:-1]:
        acc += part + '/'
        if acc in BYURL:
            out.append((BYURL[acc].get('crumb', BYURL[acc]['title']), acc))
    out.append((p.get('crumb', p['title']), p['url']))
    return out


def article_tile(a, dark=False):
    return (f'<a class="tile{" tile--dark" if dark else ""}" href="{a["url"]}" data-cat="{a["cat"]}">'
            f'<span class="meta"><span>{CATS[a["cat"]]}</span><span>{a["read"]} perc</span></span>'
            f'<h3 class="h3">{a["title"]}</h3><p>{a["desc"]}</p><span class="more">Elolvasom →</span></a>')


def org_ld():
    d = {"@type": "ProfessionalService", "@id": BASE + "/#org", "name": CFG['name'], "url": BASE + "/",
         "logo": BASE + "/assets/img/icon-512.png", "image": BASE + "/assets/img/og.jpg", "description": CFG['tagline'],
         "slogan": "A cég, amely Ön nélkül is megáll", "areaServed": {"@type": "Country", "name": "Magyarország"},
         "knowsAbout": ["exit tervezés", "cégeladás", "generációváltás", "családi utódlás", "bizalmi vagyonkezelés", "cégértékelés", "menedzsment kivásárlás"],
         "founder": [{"@type": "Person", "name": n} for n in ["Benkóné Paulovics Anita", "Berényi Mariann", "Duhonyi Andrea", "Kohári Levente"]],
         "address": {"@type": "PostalAddress", "addressLocality": CFG['city'], "addressCountry": "HU"}}
    if CFG.get('linkedin'):
        d['sameAs'] = [CFG['linkedin']]
    if CFG.get('email') and not CFG['email'].startswith('['):
        d['email'] = CFG['email']
    if CFG.get('phone') and not CFG['phone'].startswith('['):
        d['telephone'] = CFG['phone']
    return d


def faq_ld(body):
    qa = re.findall(r'<details[^>]*>\s*<summary>(.*?)</summary>(.*?)</details>', body, flags=re.S)
    if not qa:
        return None
    clean = lambda s: re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', s))).strip()
    return {"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": clean(q), "acceptedAnswer": {"@type": "Answer", "text": clean(a)}} for q, a in qa]}


def build_ld(p, body):
    graph = [org_ld(), {"@type": "WebSite", "@id": BASE + "/#site", "url": BASE + "/", "name": CFG['name'], "inLanguage": "hu-HU", "publisher": {"@id": BASE + "/#org"}}]
    url = BASE + p['url']
    cr = crumbs_for(p)
    if len(cr) > 1:
        graph.append({"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": html.unescape(n), "item": BASE + u} for i, (n, u) in enumerate(cr)]})
    if p['type'] == 'article':
        au = AUTHORS[p['author']]
        author = {"@type": "Person", "name": au['name'], "jobTitle": au['title'], "url": BASE + au['url']} if p['author'] != 'kb' else {"@id": BASE + "/#org"}
        graph.append({"@type": "Article", "headline": html.unescape(p['title']), "description": html.unescape(p['desc']), "inLanguage": "hu-HU",
                      "datePublished": p['date'], "dateModified": p['updated'], "author": author, "publisher": {"@id": BASE + "/#org"},
                      "mainEntityOfPage": url, "image": BASE + p.get('img', '/assets/img/og.jpg'), "articleSection": CATS[p['cat']],
                      "isAccessibleForFree": True, "speakable": {"@type": "SpeakableSpecification", "cssSelector": [".tldr"]}})
    else:
        wp = {"@type": p.get('schema', 'WebPage'), "@id": url + "#page", "url": url, "name": html.unescape(p['title']), "description": html.unescape(p['desc']),
              "inLanguage": p.get('lang', 'hu') + ('-HU' if p.get('lang', 'hu') == 'hu' else ''), "isPartOf": {"@id": BASE + "/#site"}, "about": {"@id": BASE + "/#org"}}
        if p.get('schema') == 'Service':
            wp = {"@type": "Service", "@id": url + "#service", "name": html.unescape(p['title']), "description": html.unescape(p['desc']), "url": url,
                  "provider": {"@id": BASE + "/#org"}, "areaServed": {"@type": "Country", "name": "Magyarország"}, "serviceType": p.get('service', 'Exit tervezés')}
        graph.append(wp)
    f = faq_ld(body)
    if f:
        graph.append(f)
    if p['url'] == '/tudastar/fogalomtar/':
        terms = re.findall(r'<dt[^>]*>(.*?)</dt>\s*<dd>(.*?)</dd>', body, flags=re.S)
        clean = lambda s: re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', s))).strip()
        graph.append({"@type": "DefinedTermSet", "@id": url + "#terms", "name": "Exit és utódlás fogalomtár",
                      "hasDefinedTerm": [{"@type": "DefinedTerm", "name": clean(t), "description": clean(d)} for t, d in terms]})
    if p['url'] == '/partnerek/':
        for n, a in [("Benkóné Paulovics Anita", "benkone-paulovics-anita"), ("Berényi Mariann", "berenyi-mariann"), ("Duhonyi Andrea", "duhonyi-andrea"), ("Kohári Levente", "kohari-levente")]:
            graph.append({"@type": "Person", "@id": url + "#" + a, "name": n, "jobTitle": "Partner", "worksFor": {"@id": BASE + "/#org"}})
    return json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False)


def head(p, body):
    title = html.unescape(p['title'])
    seo = SEO.get(p['url'])
    full = seo[0] if seo else (p.get('seotitle') or f'{title} | {CFG["name"]}')
    desc = seo[1] if seo else p['desc']
    url = BASE + p['url']
    img = BASE + p.get('img', '/assets/img/og.jpg')
    lang = p.get('lang', 'hu')
    h = [f'<title>{esc(html.unescape(full))}</title>']
    if PREVIEW and p['url'] == '/':
        h[0] = '<title>Keybridge Exit Partners weboldal</title>'
        h.append('<meta name="claude:viewport-fit-sides" content="cover">')
    else:
        h.insert(0, '<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">')
    h += [f'<meta name="description" content="{esc(html.unescape(desc))}">',
          f'<link rel="canonical" href="{url}">',
          '<meta name="robots" content="' + ('noindex,follow' if p.get('noindex') else 'index,follow,max-image-preview:large,max-snippet:-1') + '">',
          f'<link rel="alternate" hreflang="hu" href="{BASE}/">' if p['url'] in ('/', '/en/') else '',
          f'<link rel="alternate" hreflang="en" href="{BASE}/en/">' if p['url'] in ('/', '/en/') else '',
          f'<link rel="alternate" hreflang="x-default" href="{BASE}/">' if p['url'] in ('/', '/en/') else '',
          f'<meta property="og:type" content="{"article" if p["type"] == "article" else "website"}">',
          f'<meta property="og:site_name" content="{esc(CFG["name"])}">',
          f'<meta property="og:locale" content="{"hu_HU" if lang == "hu" else "en_GB"}">',
          f'<meta property="og:title" content="{esc(html.unescape(full).split(" | ")[0])}">',
          f'<meta property="og:description" content="{esc(html.unescape(desc))}">',
          f'<meta property="og:url" content="{url}">',
          f'<meta property="og:image" content="{img}">',
          '<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">',
          '<meta name="twitter:card" content="summary_large_image">',
          '<meta name="theme-color" content="#0A2421">',
          '<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">',
          '<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">',
          '<link rel="manifest" href="/site.webmanifest">',
          '<link rel="alternate" type="application/rss+xml" title="Keybridge Tudástár" href="/tudastar/feed.xml">',
          '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
          '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:ital,wght@0,300..700;1,400&family=Newsreader:ital,opsz,wght@0,6..72,400..700;1,6..72,400..600&display=swap">',
          '<link rel="stylesheet" href="/assets/css/site.css">']
    if p['type'] == 'article':
        h.append(f'<meta property="article:published_time" content="{p["date"]}">\n<meta property="article:modified_time" content="{p["updated"]}">\n<meta name="author" content="{esc(AUTHORS[p["author"]]["name"])}">')
    h.append(f'<script type="application/ld+json">{build_ld(p, body)}</script>')
    return '\n'.join(x for x in h if x)


def header(p):
    cur = p.get('nav', '')
    links = ''.join(f'<a href="{u}"{" aria-current=\"page\"" if k == cur else ""}>{n}</a>' for k, n, u in NAV)
    return f'''<a class="skip" href="#tartalom">Ugrás a tartalomra</a>
<header class="site-head">
<div class="wrap">
<a class="brand" href="/" aria-label="Keybridge Exit Partners, főoldal"><img src="/assets/img/logo.svg" alt="Keybridge Exit Partners" width="204" height="46"></a>
<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="fomenu"><span aria-hidden="true"></span>Menü</button>
<nav class="nav" id="fomenu" aria-label="Fő navigáció">{links}<a class="btn" href="/kapcsolat/">Beszélgessünk</a></nav>
<a class="btn head-cta" href="/kapcsolat/">Beszélgessünk</a>
</div>
</header>'''


def footer(p):
    cta = '' if p.get('cta') == 'off' else '''<section class="cta-band" aria-labelledby="zaro-cta">
<div class="wrap band split split--center" style="--l:1.3fr;--r:1fr">
<div class="stack"><span class="eyebrow">Az első lépés</span>
<h2 class="h1" id="zaro-cta" style="color:var(--on-dark)">Beszélgessünk a cégéről, <em style="color:var(--gold)">amíg nem sürgős.</em></h2>
<p class="lead" style="color:var(--on-dark-2)">Az első beszélgetés kötetlen, és semmire nem kötelez. Arról szól, ami Önnek fontos, nem a programról.</p></div>
<div class="stack"><div class="row"><a class="btn btn--brass" href="/kapcsolat/">Időpontot kérek</a><a class="btn btn--ghost" style="color:var(--on-dark);border-color:var(--mist)" href="/eszkozok/onteszt/">Nyolc kérdés, két perc</a></div>
<p class="note" style="color:var(--mist)">Minden megkeresést bizalmasan kezelünk. Kérésre titoktartási nyilatkozatot írunk alá az első találkozó előtt.</p></div>
</div></section>'''
    return cta + f'''
<footer class="site-foot">
<div class="wrap">
<div class="foot-grid">
<div class="foot-brand stack"><a href="/" aria-label="Keybridge Exit Partners, főoldal"><img src="/assets/img/logo-allo-sotet-hatterre.svg" alt="Keybridge Exit Partners" width="118" height="104" loading="lazy"></a><p>A cég, amely Ön nélkül is megáll.</p></div>
<nav aria-label="Program"><h2>Program</h2><ul><li><a href="/program/">Öt év, öt kapu</a></li><li><a href="/diagnozis/">Exit Readiness diagnózis</a></li><li><a href="/modszertan/">Módszertan és kutatás</a></li><li><a href="/bizalmi-vagyonkezeles/">Bizalmi vagyonkezelés</a></li></ul></nav>
<nav aria-label="Exit utak"><h2>Exit utak</h2><ul><li><a href="/exit-utak/">A három út áttekintése</a></li><li><a href="/exit-utak/cegertekesites/">Cégértékesítés</a></li><li><a href="/exit-utak/atadas-menedzsmentnek/">Átadás menedzsmentnek</a></li><li><a href="/exit-utak/csaladi-utodlas/">Családi utódlás</a></li></ul></nav>
<nav aria-label="Tudástár"><h2>Tudástár</h2><ul><li><a href="/tudastar/">Cikkek és elemzések</a></li><li><a href="/tudastar/fogalomtar/">Fogalomtár</a></li><li><a href="/tudastar/esetek/">Esettár</a></li><li><a href="/gyik/">Gyakori kérdések</a></li><li><a href="/eszkozok/onteszt/">Önteszt</a></li><li><a href="/eszkozok/cegertek-kalkulator/">Cégérték-kalkulátor</a></li></ul></nav>
<nav aria-label="Cég"><h2>Cég</h2><ul><li><a href="/partnerek/">Partnerek</a></li><li><a href="/sajto/">Sajtószoba</a></li><li><a href="/kapcsolat/">Kapcsolat</a></li><li><a href="/en/" lang="en" hreflang="en">English</a></li></ul></nav>
</div>
<div class="foot-legal">
<nav aria-label="Jogi információk"><a href="/jogi/#impresszum">Impresszum</a><a href="/jogi/#adatkezeles">Adatkezelési tájékoztató</a><a href="/jogi/#nyilatkozat">Jogi nyilatkozat</a><a href="/jogi/#sutik">Sütik</a></nav>
<p>Az oldal tartalma általános tájékoztatás, nem minősül jogi, adó vagy befektetési tanácsadásnak, sem ajánlattételnek. A jogi és adózási leírások a 2026 őszi állapotot tükrözik. Bizalmi vagyonkezelést üzletszerűen csak MNB engedéllyel rendelkező vagyonkezelő végezhet. A számpéldák illusztrációk, nem ígéretek. A példaként említett cégek nem ügyfeleink. A nemzetközi adatok irányadók.</p>
<p>© <span data-year>2026</span> {esc(CFG["name"])} · {text("legal_name")} · {text("address")}</p>
</div>
</div>
</footer>
<script src="/assets/js/site.js" defer></script>'''


def crumbs_html(p):
    cr = crumbs_for(p)
    li = ''.join(f'<li><a href="{u}">{n}</a></li>' for n, u in cr[:-1]) + f'<li aria-current="page">{cr[-1][0]}</li>'
    return f'<nav aria-label="Morzsamenü"><ol class="crumbs">{li}</ol></nav>'


def add_ids(body):
    toc = []

    def one(m):
        attrs, inner = m.group(1), m.group(2)
        if 'id="' in attrs:
            i = re.search(r'id="([^"]+)"', attrs).group(1)
        else:
            i = slugify(inner)
            attrs += f' id="{i}"'
        toc.append((i, re.sub(r'<[^>]+>', '', inner)))
        return f'<h2{attrs}>{inner}</h2>'
    return re.sub(r'<h2([^>]*)>(.*?)</h2>', one, body, flags=re.S), toc


def render_article(a):
    body, toc = add_ids(a['body'])
    au = AUTHORS[a['author']]
    tldr = ''.join(f'<li>{x.strip()}</li>' for x in a['tldr'].split('|'))
    toc_html = ''.join(f'<li><a href="#{i}">{t}</a></li>' for i, t in toc)
    rel = [x for x in articles if x is not a and x['cat'] == a['cat']] + [x for x in articles if x is not a and x['cat'] != a['cat']]
    related = ''.join(article_tile(x) for x in rel[:3])
    av = f'<img src="{au["img"]}" alt="{esc(au["name"])}" width="84" height="84" loading="lazy">' if au['img'] else '<span class="av" aria-hidden="true">K</span>'
    upd = f'<span>Frissítve: {hu_date(a["updated"])}</span>' if a['updated'] != a['date'] else ''
    return f'''<div class="progress" aria-hidden="true"></div>
<article>
<header class="article-head"><div class="wrap">{crumbs_html(a)}
<span class="eyebrow">{CATS[a["cat"]]}</span>
<h1 class="h1 measure">{a["h1"] if a.get("h1") else a["title"]}</h1>
<p class="lead measure">{a["desc"]}</p>
<div class="byline"><span>Írta: <b>{au["name"]}</b></span><span><time datetime="{a["date"]}">{hu_date(a["date"])}</time></span>{upd}<span>{a["read"]} perc olvasás</span></div>
</div></header>
<div class="wrap article-layout">
<aside class="toc" aria-label="Tartalomjegyzék"><strong>Ebben a cikkben</strong><ol>{toc_html}</ol></aside>
<div class="prose">
<div class="tldr"><strong class="t">Röviden</strong><ul>{tldr}</ul></div>
{body}
<div class="authorbox">{av}<div class="stack stack-s"><span class="h4">{au["name"]}</span><span class="small muted">{au["title"]}</span><p>{au["bio"]} <a href="{au["url"]}">Bemutatkozás</a></p></div></div>
<p class="note">Ez a cikk általános tájékoztatás, nem jogi, adó vagy befektetési tanácsadás. Konkrét ügyben ügyvéddel és bejegyzett adótanácsadóval kell egyeztetni. A számpéldák illusztrációk.</p>
</div>
</div>
</article>
<section class="band band--parchment" aria-labelledby="kapcsolodo"><div class="wrap stack stack-l">
<div class="row" style="justify-content:space-between"><h2 class="h2" id="kapcsolodo">Kapcsolódó <em>olvasnivaló</em></h2><a class="link-arrow" href="/tudastar/">A teljes Tudástár</a></div>
<div class="grid" style="--min:280px">{related}</div></div></section>'''


def render(p):
    body = p['body']
    if p['type'] == 'article':
        main = render_article(p)
    else:
        main = body
        if '{{crumbs}}' in main:
            main = main.replace('{{crumbs}}', crumbs_html(p))
        if '{{articles}}' in main:
            main = main.replace('{{articles}}', ''.join(article_tile(a) for a in articles))
        if '{{latest_articles}}' in main:
            main = main.replace('{{latest_articles}}', ''.join(article_tile(a) for a in articles[:3]))
        if '{{article_count}}' in main:
            main = main.replace('{{article_count}}', str(len(articles)))
        if '{{cat_filters}}' in main:
            main = main.replace('{{cat_filters}}', '<button type="button" aria-pressed="true" data-filter="*">Mind</button>' + ''.join(f'<button type="button" aria-pressed="false" data-filter="{k}">{v}</button>' for k, v in CATS.items()))
    main = fill(main)
    lang = p.get('lang', 'hu')
    cfgjs = json.dumps({'email': CFG['email'], 'form': CFG.get('form_endpoint', ''), 'news': CFG.get('newsletter_endpoint', '')}, ensure_ascii=False)
    inner = f'{header(p)}\n<main id="tartalom">\n{main}\n</main>\n{footer(p)}\n<script>window.KB={cfgjs}</script>'
    if PREVIEW and p['url'] == '/':
        doc = head(p, main) + '\n' + inner
    else:
        doc = f'<!doctype html>\n<html lang="{lang}">\n<head>\n{head(p, main)}\n</head>\n<body>\n{inner}\n</body>\n</html>\n'
    if p['url'] == '/404.html' and not PREVIEW:
        return doc  # a 404 bármilyen mélységből betöltődhet: itt gyökérhöz kötött hivatkozások kellenek
    return relink(doc, p['url'])


def outpath(url):
    return os.path.join(OUT, url.lstrip('/'), 'index.html') if url.endswith('/') else os.path.join(OUT, url.lstrip('/'))


def main():
    if os.path.exists(OUT):
        shutil.rmtree(OUT)
    shutil.copytree(os.path.join(SRC, 'assets'), os.path.join(OUT, 'assets'))
    for p in pages + articles:
        path = outpath(p['url'])
        os.makedirs(os.path.dirname(path), exist_ok=True)
        open(path, 'w', encoding='utf8').write(render(p))
    idx = [p for p in pages + articles if not p.get('noindex') and p['url'] != '/404.html']
    sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for p in idx:
        pr = '1.0' if p['url'] == '/' else ('0.8' if p['url'].count('/') == 2 else '0.6')
        sm.append(f'<url><loc>{BASE}{p["url"]}</loc><lastmod>{p.get("updated", TODAY)}</lastmod><priority>{pr}</priority></url>')
    sm.append('</urlset>')
    open(os.path.join(OUT, 'sitemap.xml'), 'w', encoding='utf8').write('\n'.join(sm) + '\n')
    bots = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended', 'bingbot']
    open(os.path.join(OUT, 'robots.txt'), 'w', encoding='utf8').write(
        'User-agent: *\nAllow: /\n\n' + ''.join(f'User-agent: {b}\nAllow: /\n\n' for b in bots) + f'Sitemap: {BASE}/sitemap.xml\n')
    clean = lambda s: html.unescape(re.sub(r'<[^>]+>', '', s))
    ll = [f'# {CFG["name"]}', '', f'> {CFG["tagline"]}. Három vagy öt év alatt felépítjük azt a működést, amelyben a cég a tulajdonos nélkül is fut, skálázható, és megőrzi az értékét. A végén a tulajdonos dönt: eladja, felkészített menedzsmentnek adja át, vagy a családban viszi tovább.', '',
          'Célcsoport: 1 és 10 milliárd forint közötti árbevételű, magyar magánszemély tulajdonában álló középvállalkozások. Partnerek: Benkóné Paulovics Anita, Berényi Mariann, Duhonyi Andrea, Kohári Levente.', '', '## Fő oldalak', '']
    ll += [f'- [{clean(p["title"])}]({BASE}{p["url"]}): {clean(p["desc"])}' for p in pages if not p.get('noindex') and p['url'] not in ('/404.html',)]
    ll += ['', '## Tudástár: cikkek', ''] + [f'- [{clean(a["title"])}]({BASE}{a["url"]}): {clean(a["desc"])}' for a in articles]
    ll += ['', '## Megjegyzés', '', 'A tartalom általános tájékoztatás, nem jogi, adó vagy befektetési tanácsadás. A jogi és adózási leírások a 2026 őszi magyar állapotot tükrözik.']
    open(os.path.join(OUT, 'llms.txt'), 'w', encoding='utf8').write('\n'.join(ll) + '\n')
    rss = ['<?xml version="1.0" encoding="UTF-8"?>', '<rss version="2.0"><channel>', f'<title>{CFG["name"]} Tudástár</title>', f'<link>{BASE}/tudastar/</link>',
           '<description>Cikkek cégeladásról, utódlásról és az önjáró cégről magyar tulajdonosoknak.</description>', '<language>hu</language>']
    for a in articles:
        d = datetime.date.fromisoformat(a['date']).strftime('%a, %d %b %Y 08:00:00 +0100')
        rss.append(f'<item><title>{esc(clean(a["title"]))}</title><link>{BASE}{a["url"]}</link><guid>{BASE}{a["url"]}</guid><pubDate>{d}</pubDate><description>{esc(clean(a["desc"]))}</description></item>')
    rss.append('</channel></rss>')
    os.makedirs(os.path.join(OUT, 'tudastar'), exist_ok=True)
    open(os.path.join(OUT, 'tudastar', 'feed.xml'), 'w', encoding='utf8').write('\n'.join(rss) + '\n')
    json.dump({"name": CFG['name'], "short_name": "Keybridge", "start_url": "/", "display": "browser", "background_color": "#F5F1E8", "theme_color": "#0A2421", "lang": "hu",
               "icons": [{"src": "/assets/img/icon-512.png", "sizes": "512x512", "type": "image/png"}, {"src": "/assets/img/favicon.svg", "sizes": "any", "type": "image/svg+xml"}]},
              open(os.path.join(OUT, 'site.webmanifest'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    print(f'{len(pages)} oldal + {len(articles)} cikk -> {OUT}')


if __name__ == '__main__':
    main()
