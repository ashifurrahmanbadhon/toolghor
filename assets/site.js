/* সাইট-জুড়ে স্ক্রিপ্ট: কনফিগ, ভাষা, সার্চ, টুল চালু করা */
(function () {
  var CFG = window.SITE_CONFIG, REG = window.REGISTRY, UI = window.UI, tr = UI.tr, LANG = UI.lang;
  var ROOT = document.body.getAttribute('data-root') || '';
  var PREFIX = LANG === 'bn' ? 'bn/' : '';

  function toolHref(slug) { return ROOT + PREFIX + 'tools/' + slug + '/index.html'; }
  function catOf(tool) { return tool.cats[0]; }
  function tname(t) { return LANG === 'bn' ? t.bn : t.en; }
  function tother(t) { return LANG === 'bn' ? t.en : t.bn; }

  /* ---------- কনফিগ প্রয়োগ ---------- */
  function setName(e) {
    var n = CFG.name, a = CFG.nameAccent;
    e.textContent = '';
    if (a && n.length > a.length && n.slice(-a.length) === a) {
      e.appendChild(document.createTextNode(n.slice(0, -a.length)));
      var sp = document.createElement('span'); sp.className = 'acc'; sp.textContent = a; e.appendChild(sp);
    } else e.textContent = n;
  }
  function applyConfig() {
    document.querySelectorAll('[data-cfg="name"]').forEach(setName);
    document.querySelectorAll('[data-cfg="tagline"]').forEach(function (e) { e.textContent = LANG === 'bn' ? CFG.tagline : (CFG.taglineEn || CFG.tagline); });
    document.querySelectorAll('[data-cfg="fbname"]').forEach(function (e) { e.textContent = CFG.facebook.name; });
    document.querySelectorAll('img[data-cfg="logo"]').forEach(function (e) { e.src = ROOT + CFG.logo; e.alt = CFG.name + tr(' লোগো', ' logo'); });
    document.querySelectorAll('source[data-cfg="logoDark"]').forEach(function (e) { e.srcset = ROOT + (CFG.logoDark || CFG.logo); });
    document.querySelectorAll('img[data-cfg="logoIcon"]').forEach(function (e) { e.src = ROOT + CFG.logoIcon; });
    document.querySelectorAll('a[data-cfg="fb"]').forEach(function (e) { e.href = CFG.facebook.url; });
    var num = String(CFG.whatsapp.number || '').replace(/\D/g, '');
    var text = LANG === 'bn' ? CFG.whatsapp.text : (CFG.whatsapp.textEn || CFG.whatsapp.text);
    document.querySelectorAll('a[data-cfg="wa"]').forEach(function (e) { e.href = 'https://wa.me/' + num + '?text=' + encodeURIComponent(text || ''); });
    var t = document.body.getAttribute('data-title');
    if (t) document.title = t + ' | ' + CFG.name;
    else if (document.body.getAttribute('data-home') === '1') document.title = CFG.name + ' – ' + (LANG === 'bn' ? CFG.tagline : (CFG.taglineEn || CFG.tagline));
  }

  /* ---------- ভাষা বদল: পছন্দ মনে রাখা ---------- */
  function bindLang() {
    document.querySelectorAll('a[data-setlang]').forEach(function (a) {
      a.addEventListener('click', function () { try { localStorage.setItem('lang', a.getAttribute('data-setlang')); } catch (e) { } });
    });
  }

  /* ---------- সার্চ ---------- */
  function hay(t) { return [t.bn, t.en, t.desc, t.descEn, t.keywords].join(' ').toLowerCase(); }
  REG.tools.forEach(function (t) { t._h = hay(t); t._name = (t.bn + ' ' + t.en).toLowerCase(); });

  function search(q) {
    var tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!tokens.length) return [];
    var out = [];
    REG.tools.forEach(function (t) {
      var ok = tokens.every(function (tk) { return t._h.indexOf(tk) !== -1; });
      if (!ok) return;
      var score = 0;
      tokens.forEach(function (tk) {
        if (t._name.indexOf(tk) === 0) score += 4;
        else if (t._name.indexOf(tk) !== -1) score += 3;
        else score += 1;
      });
      out.push({ t: t, s: score });
    });
    out.sort(function (a, b) { return b.s - a.s; });
    return out.map(function (x) { return x.t; });
  }

  function bindSearch() {
    var wrap = document.querySelector('.search');
    if (!wrap) return;
    var input = wrap.querySelector('input');
    var list = wrap.querySelector('.sugg');
    var isHome = document.body.getAttribute('data-home') === '1';
    var active = -1, results = [];

    function filterGrid(q) {
      if (!isHome) return;
      var set = {};
      var has = q.trim().length > 0;
      var res = has ? search(q) : REG.tools;
      res.forEach(function (t) { set[t.slug] = 1; });
      document.querySelectorAll('.tool[data-slug]').forEach(function (a) { a.hidden = !set[a.getAttribute('data-slug')]; });
      var any = false;
      var allExpandBar = document.getElementById('allExpandBar');

      document.querySelectorAll('.cat').forEach(function (sec) {
        var visTools = sec.querySelectorAll('.tool:not([hidden])').length > 0;
        if (has) {
          sec.hidden = !visTools;
          if (visTools) {
            any = true;
            if (window._toolghorExpandCategory) window._toolghorExpandCategory(sec);
          }
        } else {
          sec.hidden = false;
          any = true;
        }
      });

      if (has) {
        if (allExpandBar) allExpandBar.hidden = true;
      } else {
        if (allExpandBar) allExpandBar.hidden = false;
        if (window._toolghorCollapseAll) window._toolghorCollapseAll();
      }

      var em = document.getElementById('emptyMsg');
      if (em) em.hidden = any;
    }

    window._toolghorResetFilter = function () {
      filterGrid('');
    };

    function render() {
      var q = input.value;
      results = search(q);
      list.innerHTML = '';
      active = -1;
      if (!q.trim()) { list.hidden = true; filterGrid(''); return; }
      if (!results.length) {
        var li = document.createElement('li'); li.className = 'none';
        li.textContent = tr('কোনো টুল পাওয়া যায়নি। অন্য শব্দে চেষ্টা করুন (যেমন: pdf, ছবি, qr)।', 'No tool found. Try another word (e.g. pdf, image, qr).');
        list.appendChild(li);
      }
      results.slice(0, 8).forEach(function (t) {
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = toolHref(t.slug);
        a.className = 'c-' + catOf(t);
        a.appendChild(UI.el('span', { class: 'mini-ico' }, UI.icon(t.icon, 18)));
        a.appendChild(UI.el('span', {}, UI.el('b', {}, tname(t)), UI.el('small', {}, tother(t))));
        li.appendChild(a); list.appendChild(li);
      });
      list.hidden = false;
      filterGrid(q);
    }
    function setActive(i) {
      var items = list.querySelectorAll('a');
      if (!items.length) return;
      active = (i + items.length) % items.length;
      items.forEach(function (a, k) { a.classList.toggle('on', k === active); });
    }
    input.addEventListener('input', render);
    input.addEventListener('focus', function () { if (input.value.trim()) render(); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
      else if (e.key === 'Escape') { list.hidden = true; }
      else if (e.key === 'Enter') {
        e.preventDefault();
        var items = list.querySelectorAll('a');
        if (active >= 0 && items[active]) location.href = items[active].href;
        else if (results.length) location.href = toolHref(results[0].slug);
      }
    });
    document.addEventListener('click', function (e) { if (!wrap.contains(e.target)) list.hidden = true; });
  }

  /* ---------- ক্যাটাগরি Expand & Collapse সিস্টেম ---------- */
  function bindCategoryAccordion() {
    var isHome = document.body.getAttribute('data-home') === '1';
    if (!isHome) return;

    var catSections = document.querySelectorAll('main .cat');
    var btnAllToggle = document.getElementById('btnAllToggle');
    var chips = document.querySelectorAll('.chips .chip[data-cat]');
    var qInput = document.getElementById('q');

    function setCategoryState(sec, expanded) {
      if (expanded) {
        sec.classList.remove('collapsed');
        sec.classList.add('expanded');
      } else {
        sec.classList.add('collapsed');
        sec.classList.remove('expanded');
      }

      var head = sec.querySelector('.cat-head');
      if (head) head.setAttribute('aria-expanded', expanded ? 'true' : 'false');

      var btn = sec.querySelector('.btn-cat-toggle');
      if (btn) {
        btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        var textEl = btn.querySelector('.btn-toggle-text');
        var arrowEl = btn.querySelector('.btn-toggle-arrow');
        if (textEl) textEl.textContent = expanded ? 'Collapse' : 'Expand';
        if (arrowEl) arrowEl.textContent = expanded ? '▲' : '▼';
      }
    }

    function updateAllToggleBtn() {
      if (!btnAllToggle) return;
      var total = catSections.length;
      var expandedCount = 0;
      catSections.forEach(function (sec) {
        if (sec.classList.contains('expanded')) expandedCount++;
      });

      var isAllExpanded = expandedCount === total && total > 0;
      var textEl = btnAllToggle.querySelector('.all-toggle-text');
      if (textEl) {
        textEl.textContent = isAllExpanded ? 'Collapse All' : 'Expand All';
      }
      btnAllToggle.setAttribute('aria-expanded', isAllExpanded ? 'true' : 'false');

      var chipAll = document.querySelector('.chips .chip[data-cat="all"]');
      if (chipAll) {
        chipAll.classList.toggle('on', isAllExpanded);
      }
    }

    function updateActiveChip(activeCatId) {
      chips.forEach(function (c) {
        var cat = c.getAttribute('data-cat');
        var isOn = cat === activeCatId;
        c.classList.toggle('on', isOn);
        c.setAttribute('aria-selected', isOn ? 'true' : 'false');
        if (isOn && window.innerWidth <= 768) {
          try { c.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); } catch (err) {}
        }
      });
    }

    function collapseAll() {
      catSections.forEach(function (sec) {
        setCategoryState(sec, false);
      });
      updateAllToggleBtn();
      updateActiveChip(null);
    }

    function expandAll() {
      catSections.forEach(function (sec) {
        setCategoryState(sec, true);
      });
      updateAllToggleBtn();
      updateActiveChip('all');
    }

    function expandOnlyCategory(targetSec, shouldScroll) {
      catSections.forEach(function (sec) {
        if (sec === targetSec) {
          setCategoryState(sec, true);
        } else {
          setCategoryState(sec, false);
        }
      });
      updateAllToggleBtn();

      var catKey = targetSec.id ? targetSec.id.replace('cat-', '') : '';
      updateActiveChip(catKey);

      if (shouldScroll) {
        var headerEl = document.querySelector('.top');
        var offset = (headerEl ? headerEl.offsetHeight : 65) + 10;
        var y = targetSec.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      }
    }

    function toggleCategory(sec) {
      var isCurrentlyExpanded = sec.classList.contains('expanded');
      if (isCurrentlyExpanded) {
        setCategoryState(sec, false);
        updateAllToggleBtn();
        updateActiveChip(null);
      } else {
        expandOnlyCategory(sec, false);
      }
    }

    // Initialize: all categories collapsed by default
    catSections.forEach(function (sec) {
      setCategoryState(sec, false);

      var head = sec.querySelector('.cat-head');
      if (!head) return;

      head.addEventListener('click', function (e) {
        if (e.target.closest('a')) return;
        toggleCategory(sec);
      });

      head.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleCategory(sec);
        }
      });
    });

    updateAllToggleBtn();

    // Bind All Expand/Collapse button
    if (btnAllToggle) {
      btnAllToggle.addEventListener('click', function () {
        var total = catSections.length;
        var expandedCount = 0;
        catSections.forEach(function (sec) {
          if (sec.classList.contains('expanded')) expandedCount++;
        });

        if (expandedCount === total) {
          collapseAll();
        } else {
          expandAll();
        }
      });
    }

    // Bind top category chips
    chips.forEach(function (chip) {
      chip.addEventListener('click', function (e) {
        e.preventDefault();
        var cat = chip.getAttribute('data-cat');
        if (qInput && qInput.value.trim()) {
          qInput.value = '';
          var sugg = document.getElementById('sugg');
          if (sugg) sugg.hidden = true;
          window._toolghorResetFilter && window._toolghorResetFilter();
        }

        if (cat === 'all') {
          var total = catSections.length;
          var expandedCount = 0;
          catSections.forEach(function (sec) {
            if (sec.classList.contains('expanded')) expandedCount++;
          });
          if (expandedCount === total) {
            collapseAll();
          } else {
            expandAll();
            var bar = document.getElementById('allExpandBar');
            if (bar) {
              var headerEl = document.querySelector('.top');
              var offset = (headerEl ? headerEl.offsetHeight : 65) + 10;
              var y = bar.getBoundingClientRect().top + window.pageYOffset - offset;
              window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
            }
          }
          try { history.replaceState(null, '', '#all'); } catch (err) {}
        } else {
          var targetSec = document.getElementById('cat-' + cat);
          if (targetSec) {
            expandOnlyCategory(targetSec, true);
            try { history.replaceState(null, '', '#cat-' + cat); } catch (err) {}
          }
        }
      });
    });

    // Always keep all categories collapsed by default on page load
    collapseAll();
    if (location.hash === '#all') {
      try { history.replaceState(null, '', location.pathname + location.search); } catch (err) {}
    }

    window.addEventListener('hashchange', function () {
      var h = (location.hash || '').replace('#', '');
      if (h === 'all') {
        expandAll();
      } else if (h.indexOf('cat-') === 0) {
        var t = document.getElementById(h);
        if (t) expandOnlyCategory(t, true);
      }
    });

    window._toolghorExpandCategory = function (sec) { setCategoryState(sec, true); };
    window._toolghorCollapseAll = collapseAll;
    window._toolghorExpandAll = expandAll;
    window._toolghorUpdateToggleBtn = updateAllToggleBtn;
  }

  /* ---------- টুল চালু ---------- */
  function renderToolAiBar(root) {
    var existing = document.getElementById('tool-ai-bar');
    if (existing) existing.remove();

    var provs = UI.getActiveAIProviders ? UI.getActiveAIProviders() : [];
    var hasKey = provs.length > 0;

    var bar = UI.el('div', { class: 'tool-ai-banner ' + (hasKey ? 'active' : 'idle'), id: 'tool-ai-bar' });
    var left = UI.el('div', { class: 'tool-ai-banner-left' },
      UI.el('span', { class: 'ai-sparkle-ico' }, '✨'),
      UI.el('div', {},
        UI.el('div', { class: 'tool-ai-banner-title' },
          hasKey
            ? (LANG === 'bn' ? ('⚡ AI রেজাল্ট এনহ্যান্সার সক্রিয় (' + provs.join(' ও ') + ')') : ('⚡ AI Result Enhancer Active (' + provs.join(' & ') + ')'))
            : (LANG === 'bn' ? '✨ টুলটিতে AI সাপোর্ট যুক্ত আছে' : '✨ AI Support is Available on this Tool')
        ),
        UI.el('div', { class: 'tool-ai-banner-sub' },
          hasKey
            ? (LANG === 'bn' ? 'টুলটির ফলাফলগুলো আপনার কানেক্টেড API দিয়ে স্বয়ংক্রিয়ভাবে আরও নির্ভুল ও বিস্তারিত হবে।' : 'Outputs on this tool are supercharged with your connected AI API.')
            : (LANG === 'bn' ? 'উন্নত ও কাস্টমাইজড ফলাফলের জন্য আপনার Google Gemini বা OpenAI API কী কানেক্ট করুন।' : 'Connect your Google Gemini or OpenAI API Key for live personalized AI results.')
        )
      )
    );

    var btn = UI.el('button', {
      type: 'button',
      class: 'tool-ai-banner-btn',
      onclick: function () { UI.openAiKeysModal(); }
    },
      UI.icon('key', 14),
      document.createTextNode(hasKey ? (LANG === 'bn' ? 'API কী সেটিংস' : 'API Settings') : (LANG === 'bn' ? 'API কী কানেক্ট করুন' : 'Connect API Key'))
    );

    bar.appendChild(left);
    bar.appendChild(btn);

    if (root && root.parentNode) {
      root.parentNode.insertBefore(bar, root);
    }
  }

  window.addEventListener('th-api-keys-updated', function () {
    var root = document.getElementById('tool-root');
    if (root) renderToolAiBar(root);
  });

  function mountTool() {
    var slug = document.body.getAttribute('data-tool');
    if (!slug) return;
    var root = document.getElementById('tool-root');
    if (!root) return;
    if (!window.Tools[slug]) { root.appendChild(UI.notice('err', tr('টুলটি লোড হয়নি। পেজ রিফ্রেশ করে দেখুন।', 'The tool did not load. Please refresh the page.'))); return; }
    renderToolAiBar(root);
    UI.clear(root);
    try { window.Tools[slug](root); }
    catch (e) { console.error(e); root.appendChild(UI.notice('err', tr('একটি সমস্যা হয়েছে: ', 'Something went wrong: ') + UI.err(e))); }
  }

  function init() { applyConfig(); bindLang(); bindSearch(); bindCategoryAccordion(); mountTool(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
