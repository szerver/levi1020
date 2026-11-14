/* Keybridge Exit Partners · oldalszintű viselkedés (keretrendszer nélkül) */
(function () {
  'use strict';
  var KB = window.KB || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  };
  /* Ezres tagolás nem törő szóközzel: 2 574 (a hu-HU beépített formázás a négyjegyű számokat nem tagolja) */
  var fmt = function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };

  /* Menü */
  var tg = $('.nav-toggle'), nav = $('#fomenu');
  if (tg && nav) {
    tg.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      tg.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { nav.classList.remove('is-open'); tg.setAttribute('aria-expanded', 'false'); tg.focus(); }
    });
  }
  /* Legördülő főmenü */
  var items = $$('.nav-item');
  var closeAll = function (ex) { items.forEach(function (it) { if (it !== ex) { it.classList.remove('is-open'); $('.nav-btn', it).setAttribute('aria-expanded', 'false'); } }); };
  items.forEach(function (it) {
    var b = $('.nav-btn', it);
    b.addEventListener('click', function () { var o = !it.classList.contains('is-open'); closeAll(it); it.classList.toggle('is-open', o); b.setAttribute('aria-expanded', o ? 'true' : 'false'); });
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('.nav-item')) closeAll(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(); });

  /* Görgetős jelenet: a garázstól a világvállalatig */
  $$('.scrolly').forEach(function (sc) {
    var steps = $$('.sc-step', sc), world = $('#sc-world', sc), chips = $$('.sc-chips li', sc), roles = $$('.sc-role span', sc);
    if (!steps.length || !world) return;
    var Z = [1.55, 1.12, 0.78, 0.36, 0.36], ticking = false;
    sc.classList.add('js');
    var upd = function () {
      ticking = false;
      var mid = window.innerHeight * (window.innerWidth < 900 ? 0.72 : 0.56), f = 0;
      steps.forEach(function (st, i) {
        var r = st.getBoundingClientRect(), c = r.top + r.height / 2;
        if (c < mid) {
          f = i;
          var nx = steps[i + 1];
          if (nx) { var nr = nx.getBoundingClientRect(), nc = nr.top + nr.height / 2; f = i + Math.min(1, Math.max(0, (mid - c) / (nc - c))); }
        }
      });
      var n = Math.min(steps.length, Math.floor(f + 0.5) + 1);
      for (var i = 1; i <= 5; i++) sc.classList.toggle('s' + i, i <= n);
      var a = Math.floor(f), b = Math.min(Z.length - 1, a + 1), z = Z[a] + (Z[b] - Z[a]) * (f - a);
      world.setAttribute('transform', 'translate(400 470) scale(' + z.toFixed(3) + ') translate(-400 -470)');
      steps.forEach(function (st, i) { st.classList.toggle('is-active', i === n - 1); });
      chips.forEach(function (c, i) { c.classList.toggle('is-on', i < n - 1); c.classList.toggle('is-now', i === n - 1); });
      roles.forEach(function (r, i) { r.classList.toggle('is-now', i === n - 1); });
    };
    var req = function () { if (!ticking) { ticking = true; requestAnimationFrame(upd); } };
    window.addEventListener('scroll', req, { passive: true });
    window.addEventListener('resize', req);
    upd();
  });

  /* Megjelenés görgetésre: csak a képernyő alatti elemeknél, hogy az első nézet azonnal teljes legyen */
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target; io.unobserve(el); el.classList.add('in');
        setTimeout(function () { el.classList.remove('rv', 'in'); el.style.removeProperty('--d'); }, 1300);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    $$('main .grid > *, main .steps > li, main .people > *, main .arch-steps > figure, main .contacts > li, main .figure, main .table-wrap').forEach(function (el) {
      if (el.closest('.rail, .tool, .sc-grid') || el.hidden) return;
      if (el.getBoundingClientRect().top < window.innerHeight * 0.95) return;
      var idx = Array.prototype.indexOf.call(el.parentNode.children, el);
      el.style.setProperty('--d', Math.min(idx, 5) * 70 + 'ms');
      el.classList.add('rv'); io.observe(el);
    });
  }

  /* Számláló a nyitó mutatóknál */
  $$('[data-count]').forEach(function (el) {
    var to = parseInt(el.getAttribute('data-count'), 10), t0 = null;
    if (!to || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var step = function (t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / 1100); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });

  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* Olvasási folyamatjelző a cikkeknél */
  var bar = $('.progress'), art = $('article');
  if (bar && art) {
    var onScroll = function () {
      var r = art.getBoundingClientRect(), h = r.height - window.innerHeight;
      var p = h > 0 ? Math.min(1, Math.max(0, -r.top / h)) : 0;
      bar.style.width = (p * 100) + '%';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* Szűrők (Tudástár, Esettár) */
  $$('[data-filters]').forEach(function (box) {
    var target = $(box.getAttribute('data-filters'));
    if (!target) return;
    box.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-filter]');
      if (!b) return;
      $$('button', box).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      var f = b.getAttribute('data-filter');
      $$('[data-cat]', target).forEach(function (it) { it.hidden = !(f === '*' || it.getAttribute('data-cat') === f); });
    });
  });

  /* Fogalomtár kereső */
  var gs = $('#fogalom-kereso');
  if (gs) {
    var items = $$('.gloss > div'), none = $('#fogalom-nincs');
    gs.addEventListener('input', function () {
      var q = gs.value.trim().toLowerCase(), n = 0;
      items.forEach(function (it) { var hit = !q || it.textContent.toLowerCase().indexOf(q) > -1; it.hidden = !hit; if (hit) n++; });
      if (none) none.hidden = n > 0;
    });
  }

  /* Önteszt: nyolc kérdés */
  $$('[data-selftest]').forEach(function (box) {
    var qs = $$('.qlist li', box), out = $('[data-result]', box), meter = $('.meter i', box), cnt = $('[data-count]', box);
    var texts = {
      hi: ['Erős alap', 'A cége már ma is sokat megáll Ön nélkül. A kérdés az, melyik exit út adja a legtöbbet Önnek, és mi az a néhány rés, amelyet egy vevő vagy utód még megtalálna.'],
      mid: ['Van mire építeni', 'Van mire építeni, de egy vevő ma diszkonttal számolna. Ez a legjobb időszak a kezdéshez: a hiányok javíthatók, és van rá idő.'],
      lo: ['A cég ma még Önön áll', 'A cég ma még Önön áll. Ez nem hiba, hanem kiindulópont: van rá idő, ha most indul el. Az első lépés a diagnózis.']
    };
    var update = function () {
      var yes = 0, done = 0, nos = [];
      qs.forEach(function (li, i) {
        var c = $('input:checked', li);
        if (c) { done++; if (c.value === '1') yes++; else nos.push($('.qt', li).textContent); }
      });
      if (meter) meter.style.width = (done / qs.length * 100) + '%';
      if (cnt) cnt.textContent = done + ' / ' + qs.length;
      if (done < qs.length) { out.hidden = true; return; }
      var k = yes >= 7 ? 'hi' : (yes >= 3 ? 'mid' : 'lo');
      $('[data-score]', out).textContent = yes + ' / ' + qs.length;
      $('[data-title]', out).textContent = texts[k][0];
      $('[data-text]', out).textContent = texts[k][1];
      var ul = $('[data-nos]', out);
      ul.innerHTML = '';
      nos.forEach(function (t) { var li = document.createElement('li'); li.textContent = t; ul.appendChild(li); });
      $('[data-nos-wrap]', out).hidden = nos.length === 0;
      out.hidden = false;
      store.set('kb-onteszt', yes + ' igen a 8-ból');
    };
    box.addEventListener('change', update);
    update();
  });

  /* Cégérték-kalkulátor */
  $$('[data-calc]').forEach(function (box) {
    var val = function (k) { return parseFloat($('[data-k="' + k + '"]', box).value); };
    var set = function (k, v) { $$('[data-o="' + k + '"]', box).forEach(function (el) { el.textContent = v; }); };
    var update = function () {
      var e0 = val('ebitda'), m0 = val('mult'), g = val('growth') / 100, dm = val('dmult');
      var e1 = e0 * (1 + g), m1 = m0 + dm;
      var v0 = e0 * m0, fromE = (e1 - e0) * m0, fromM = e1 * dm, v1 = e1 * m1;
      set('ebitda', fmt(e0) + ' M Ft'); set('mult', m0.toLocaleString('hu-HU') + 'x');
      set('growth', '+' + Math.round(g * 100) + '%'); set('dmult', '+' + dm.toLocaleString('hu-HU') + 'x');
      set('v0', fmt(v0) + ' M Ft'); set('v1', fmt(v1) + ' M Ft'); set('gain', '+' + fmt(v1 - v0) + ' M Ft');
      set('e1', fmt(e1) + ' M Ft'); set('m1', m1.toLocaleString('hu-HU') + 'x');
      set('half', fmt(e1 * 0.5) + ' M Ft');
      var wf = $('.wf', box);
      if (wf) {
        var max = Math.max(v1, 1), H = 215;
        var parts = [[v0, 0], [fromE, v0], [fromM, v0 + fromE], [v1, 0]];
        var labels = [fmt(v0), '+' + fmt(fromE), '+' + fmt(fromM), fmt(v1)];
        $$('div', wf).forEach(function (d, i) {
          var h = parts[i][0] / max * H, off = parts[i][1] / max * H;
          var bar = $('i', d), lab = $('b', d);
          bar.style.height = Math.max(h, 2) + 'px'; bar.style.marginBottom = off + 'px';
          lab.textContent = labels[i]; lab.style.bottom = (h + off + 6) + 'px';
        });
      }
    };
    box.addEventListener('input', update);
    update();
  });

  /* Űrlapok */
  var isReal = function (v) { return v && v.charAt(0) !== '['; };
  $$('form[data-form]').forEach(function (form) {
    var status = $('.form-status', form);
    var note = store.get('kb-onteszt'), msg = $('textarea[name="uzenet"]', form);
    if (note && msg && !msg.value) msg.value = 'Önteszt eredményem: ' + note + '.\n';
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.website && form.website.value) return; /* mézesbödön a robotok ellen */
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var data = {};
      $$('input,select,textarea', form).forEach(function (el) {
        if (!el.name || el.name === 'website') return;
        if (el.type === 'checkbox') { data[el.name] = el.checked ? 'igen' : 'nem'; return; }
        if (el.type === 'radio' && !el.checked) return;
        data[el.name] = el.value;
      });
      data.urlap = form.getAttribute('data-form');
      var endpoint = form.getAttribute('data-form') === 'hirlevel' ? (KB.news || KB.form) : KB.form;
      var show = function (html, err) { status.hidden = false; status.className = 'form-status' + (err ? ' err' : ''); status.innerHTML = html; status.focus && status.focus(); };
      if (endpoint) {
        show('Küldés folyamatban…');
        fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(data) })
          .then(function (r) { if (!r.ok) throw new Error(r.status); show('<strong>Köszönjük, megkaptuk.</strong> Hamarosan személyesen jelentkezünk.'); form.reset(); })
          .catch(function () { show('Az üzenetet nem sikerült elküldeni. Kérjük, próbálja újra, vagy írjon közvetlenül nekünk.', true); });
        return;
      }
      /* Nincs beállított űrlapfogadó: levélvázlatot készítünk */
      var lines = Object.keys(data).map(function (k) { return k + ': ' + data[k]; }).join('\n');
      if (isReal(KB.email)) {
        var href = 'mailto:' + KB.email + '?subject=' + encodeURIComponent('Megkeresés a weboldalról') + '&body=' + encodeURIComponent(lines);
        show('<strong>Az üzenete elkészült.</strong> A küldéshez nyissa meg a levelezőprogramját: <a href="' + href + '">levél megnyitása</a>. Ha a hivatkozás nem működik, írjon a(z) ' + KB.email + ' címre.');
      } else {
        show('<strong>Az űrlap még nincs bekötve.</strong> Ez az előnézeti változat: az üzenet nem került elküldésre. Indulás előtt az űrlapfogadó címét a site.json fájlban kell megadni.', true);
      }
    });
  });

  /* Másolás gomb (sajtószoba) */
  $$('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var el = $(b.getAttribute('data-copy')); if (!el) return;
      var t = el.innerText, done = function () { var o = b.textContent; b.textContent = 'Másolva'; setTimeout(function () { b.textContent = o; }, 1600); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(t).then(done).catch(function () { var r = document.createRange(); r.selectNodeContents(el); var s = getSelection(); s.removeAllRanges(); s.addRange(r); });
      } else { var r = document.createRange(); r.selectNodeContents(el); var s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    });
  });
})();
