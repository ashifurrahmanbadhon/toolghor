/* ==========================================================================
   ToolGhor All-In-One Single-Page Application (SPA) Engine for Android & Web
   ========================================================================== */
(function () {
  'use strict';

  var CFG = window.SITE_CONFIG || {};
  var REG = window.REGISTRY || { categories: [], tools: [], bySlug: {} };
  var UI = window.UI || {};

  // Current Language: stored in localStorage or default 'bn' / 'en'
  var LANG = 'bn';
  try {
    var savedLang = localStorage.getItem('lang');
    if (savedLang === 'en' || savedLang === 'bn') LANG = savedLang;
  } catch (e) {}

  UI.lang = LANG;
  UI.digits = LANG === 'bn' ? 'bn' : 'en';
  UI.locale = LANG === 'bn' ? 'bn-BD' : 'en-GB';
  UI.numLocale = LANG === 'bn' ? 'bn-BD' : 'en-IN';
  UI.tr = function (bn, en) { return LANG === 'bn' ? bn : en; };
  window.tr = UI.tr;

  function tname(t) { return LANG === 'bn' ? t.bn : t.en; }
  function tdesc(t) { return LANG === 'bn' ? t.desc : (t.descEn || t.desc); }
  function tintro(t) { return LANG === 'bn' ? t.intro : (t.introEn || t.intro); }
  function tsteps(t) { return LANG === 'bn' ? t.steps : (t.stepsEn || t.steps); }
  function cname(c) { return LANG === 'bn' ? c.bn : c.en; }
  function cdesc(c) { return LANG === 'bn' ? c.desc : (c.descEn || c.desc); }
  function catOf(t) { return t.cats && t.cats[0] ? t.cats[0] : 'documents'; }

  // Search indexing
  function hay(t) { return [t.bn, t.en, t.desc, t.descEn, t.keywords].join(' ').toLowerCase(); }
  REG.tools.forEach(function (t) {
    t._h = hay(t);
    t._name = (t.bn + ' ' + t.en).toLowerCase();
  });

  function searchTools(q) {
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

  /* --------------------------------------------------------------------------
     DOM Elements Cache
     -------------------------------------------------------------------------- */
  var homeView = null;
  var toolView = null;
  var toolRoot = null;
  var currentSlug = null;

  /* --------------------------------------------------------------------------
     Navigation & Routing
     -------------------------------------------------------------------------- */
  function navigateToTool(slug) {
    location.hash = '#tool/' + slug;
  }

  function navigateToHome(catId) {
    if (catId) {
      location.hash = '#cat-' + catId;
    } else {
      location.hash = '';
    }
  }

  function goBack() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      location.hash = '';
    }
  }

  /* --------------------------------------------------------------------------
     Tool View Renderer
     -------------------------------------------------------------------------- */
  function renderTool(slug) {
    var tool = REG.bySlug[slug];
    if (!tool) {
      showHomeView();
      return;
    }

    currentSlug = slug;
    document.body.setAttribute('data-tool', slug);

    // Hide home, show tool
    if (homeView) homeView.hidden = true;
    if (toolView) toolView.hidden = false;

    // Update document title
    document.title = tname(tool) + ' | ' + CFG.name;

    // Find category info
    var catId = catOf(tool);
    var catInfo = null;
    REG.categories.forEach(function (c) { if (c.id === catId) catInfo = c; });

    // Breadcrumbs
    var crumbEl = document.getElementById('tool-crumb');
    if (crumbEl) {
      crumbEl.innerHTML = '';
      var homeLink = UI.el('a', { href: '#', onclick: function (e) { e.preventDefault(); location.hash = ''; } }, UI.tr('হোম', 'Home'));
      var catLink = UI.el('a', { href: '#cat-' + catId, onclick: function (e) { e.preventDefault(); location.hash = '#cat-' + catId; } }, catInfo ? cname(catInfo) : catId);
      crumbEl.appendChild(homeLink);
      crumbEl.appendChild(document.createTextNode(' / '));
      crumbEl.appendChild(catLink);
      crumbEl.appendChild(document.createTextNode(' / '));
      crumbEl.appendChild(UI.el('span', {}, tname(tool)));
    }

    // Title & Lead
    var titleEl = document.getElementById('tool-title');
    if (titleEl) {
      titleEl.className = 'tool-title c-' + catId;
      titleEl.textContent = tname(tool);
    }
    var leadEl = document.getElementById('tool-lead');
    if (leadEl) leadEl.textContent = tintro(tool);

    // Trust Message
    var trustEl = document.getElementById('tool-trust-text');
    if (trustEl) {
      trustEl.textContent = UI.tr(
        'আপনার ফাইল বা তথ্য কোথাও আপলোড হয় না। সম্পূর্ণ প্রসেসিং সরাসরি আপনার ডিভাইসে সম্পন্ন হয়।',
        'Your files and data are processed 100% locally in your device. Never uploaded to any server.'
      );
    }

    // How-To Steps
    var stepsList = document.getElementById('tool-steps-list');
    if (stepsList) {
      stepsList.innerHTML = '';
      var steps = tsteps(tool) || [];
      steps.forEach(function (s) {
        var li = document.createElement('li');
        li.textContent = s;
        stepsList.appendChild(li);
      });
    }

    // Related Tools
    var relatedGrid = document.getElementById('tool-related-grid');
    if (relatedGrid) {
      relatedGrid.innerHTML = '';
      var related = REG.tools.filter(function (t) { return catOf(t) === catId && t.slug !== slug; }).slice(0, 4);
      related.forEach(function (rt) {
        var card = createToolCard(rt, catId);
        relatedGrid.appendChild(card);
      });
    }

    // Render AI Banner
    if (window._renderToolAiBar && toolRoot) {
      window._renderToolAiBar(toolRoot);
    }

    // Mount Tool Component
    if (toolRoot) {
      UI.clear(toolRoot);
      if (window.Tools && window.Tools[slug]) {
        try {
          window.Tools[slug](toolRoot);
        } catch (err) {
          console.error('Error mounting tool ' + slug, err);
          toolRoot.appendChild(UI.notice('err', UI.tr('টুলটি চালু করতে সমস্যা হয়েছে: ', 'Failed to launch tool: ') + (err.message || err)));
        }
      } else {
        toolRoot.appendChild(UI.notice('err', UI.tr('টুল স্ক্রিপ্ট পাওয়া যায়নি।', 'Tool module could not be loaded.')));
      }
    }

    // Scroll smoothly to top
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function showHomeView(catToExpand) {
    currentSlug = null;
    document.body.removeAttribute('data-tool');

    if (toolView) toolView.hidden = true;
    if (homeView) homeView.hidden = false;

    // Reset document title
    document.title = CFG.name + ' – ' + (LANG === 'bn' ? CFG.tagline : (CFG.taglineEn || CFG.tagline));

    if (catToExpand) {
      var targetSec = document.getElementById('cat-' + catToExpand);
      if (targetSec && window._toolghorExpandCategory) {
        window._toolghorExpandCategory(targetSec);
        var y = targetSec.getBoundingClientRect().top + window.pageYOffset - 75;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      }
    }
  }

  function handleRoute() {
    var hash = (location.hash || '').replace('#', '').trim();
    if (hash.indexOf('tool/') === 0) {
      var slug = hash.replace('tool/', '').trim();
      renderTool(slug);
    } else if (hash.indexOf('cat-') === 0) {
      var catId = hash.replace('cat-', '').trim();
      showHomeView(catId);
    } else if (hash === 'all') {
      showHomeView();
      if (window._toolghorExpandAll) window._toolghorExpandAll();
    } else {
      showHomeView();
    }
  }

  /* --------------------------------------------------------------------------
     Tool Card Component Generator
     -------------------------------------------------------------------------- */
  function createToolCard(t, catId) {
    var a = UI.el('a', {
      class: 'tool cat-' + catId,
      href: '#tool/' + t.slug,
      'data-slug': t.slug,
      onclick: function (e) {
        e.preventDefault();
        navigateToTool(t.slug);
      }
    },
      UI.el('span', { class: 'ico' }, UI.icon(t.icon, 24)),
      UI.el('span', {},
        UI.el('b', {}, tname(t)),
        UI.el('p', {}, tdesc(t))
      )
    );
    return a;
  }

  /* --------------------------------------------------------------------------
     Home View Category & Tools Builder
     -------------------------------------------------------------------------- */
  function buildCategories() {
    var catsContainer = document.getElementById('cats-container');
    if (!catsContainer) return;
    UI.clear(catsContainer);

    REG.categories.forEach(function (cat) {
      var catTools = REG.tools.filter(function (t) { return catOf(t) === cat.id; });

      var section = UI.el('section', {
        class: 'cat cat-' + cat.id + ' collapsed',
        id: 'cat-' + cat.id,
        'aria-labelledby': 'h-' + cat.id
      });

      var head = UI.el('div', {
        class: 'cat-head',
        role: 'button',
        tabindex: '0',
        'aria-expanded': 'false'
      },
        UI.el('div', { class: 'cat-head-info' },
          UI.el('div', { class: 'cat-head-title-row' },
            UI.el('h2', { id: 'h-' + cat.id },
              UI.el('span', { class: 'cat-head-sym' }, cat.symbol),
              document.createTextNode(' ' + cname(cat))
            ),
            UI.el('span', { class: 'cat-badge-count' }, catTools.length + ' ' + UI.tr('টুল', 'tools'))
          ),
          UI.el('p', {}, cdesc(cat))
        ),
        UI.el('button', { type: 'button', class: 'btn-cat-toggle', 'aria-expanded': 'false' },
          UI.el('span', { class: 'btn-toggle-text' }, UI.tr('খুলুন', 'Expand')),
          UI.el('span', { class: 'btn-toggle-arrow', 'aria-hidden': 'true' }, '▼')
        )
      );

      var grid = UI.el('div', { class: 'grid' });
      catTools.forEach(function (t) {
        grid.appendChild(createToolCard(t, cat.id));
      });

      section.appendChild(head);
      section.appendChild(grid);
      catsContainer.appendChild(section);
    });
  }

  /* --------------------------------------------------------------------------
     AI Tool Enhancer Banner
     -------------------------------------------------------------------------- */
  window._renderToolAiBar = function (root) {
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
  };

  /* --------------------------------------------------------------------------
     Live Search Autocomplete & Filter
     -------------------------------------------------------------------------- */
  function bindSearch() {
    var searchBox = document.getElementById('search-wrap');
    if (!searchBox) return;
    var input = document.getElementById('q');
    var list = document.getElementById('sugg');
    if (!input || !list) return;

    var active = -1, results = [];

    function renderSugg() {
      var q = input.value.trim();
      results = searchTools(q);
      list.innerHTML = '';
      active = -1;

      if (!q) {
        list.hidden = true;
        filterGrid('');
        return;
      }

      if (!results.length) {
        var li = UI.el('li', { class: 'none' }, UI.tr('কোনো টুল পাওয়া যায়নি। অন্য শব্দে চেষ্টা করুন (যেমন: pdf, ছবি, qr)।', 'No tool found. Try another word (e.g. pdf, image, qr).'));
        list.appendChild(li);
      } else {
        results.slice(0, 8).forEach(function (t) {
          var a = UI.el('a', {
            href: '#tool/' + t.slug,
            class: 'c-' + catOf(t),
            onclick: function (e) {
              e.preventDefault();
              list.hidden = true;
              navigateToTool(t.slug);
            }
          },
            UI.el('span', { class: 'mini-ico' }, UI.icon(t.icon, 18)),
            UI.el('span', {},
              UI.el('b', {}, tname(t)),
              UI.el('small', {}, LANG === 'bn' ? t.en : t.bn)
            )
          );
          list.appendChild(UI.el('li', {}, a));
        });
      }

      list.hidden = false;
      filterGrid(q);
    }

    function filterGrid(q) {
      var set = {};
      var has = q.trim().length > 0;
      var res = has ? searchTools(q) : REG.tools;
      res.forEach(function (t) { set[t.slug] = 1; });

      document.querySelectorAll('.tool[data-slug]').forEach(function (a) {
        a.hidden = !set[a.getAttribute('data-slug')];
      });

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

      if (allExpandBar) allExpandBar.hidden = has;
      var em = document.getElementById('emptyMsg');
      if (em) em.hidden = any;
    }

    input.addEventListener('input', renderSugg);
    input.addEventListener('focus', function () { if (input.value.trim()) renderSugg(); });
    document.addEventListener('click', function (e) {
      if (!searchBox.contains(e.target)) list.hidden = true;
    });

    input.addEventListener('keydown', function (e) {
      var items = list.querySelectorAll('a');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (items.length) {
          active = (active + 1) % items.length;
          items.forEach(function (a, k) { a.classList.toggle('on', k === active); });
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (items.length) {
          active = (active - 1 + items.length) % items.length;
          items.forEach(function (a, k) { a.classList.toggle('on', k === active); });
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (active >= 0 && items[active]) {
          items[active].click();
        } else if (results.length) {
          navigateToTool(results[0].slug);
          list.hidden = true;
        }
      } else if (e.key === 'Escape') {
        list.hidden = true;
      }
    });
  }

  /* --------------------------------------------------------------------------
     Language Switcher
     -------------------------------------------------------------------------- */
  function switchLanguage(targetLang) {
    if (targetLang === LANG) return;
    LANG = targetLang;
    try { localStorage.setItem('lang', LANG); } catch (e) {}
    UI.lang = LANG;
    UI.digits = LANG === 'bn' ? 'bn' : 'en';

    document.documentElement.setAttribute('lang', LANG);

    // Update Language Pills
    var langEn = document.getElementById('lang-btn-en');
    var langBn = document.getElementById('lang-btn-bn');
    if (langEn) langEn.classList.toggle('on', LANG === 'en');
    if (langBn) langBn.classList.toggle('on', LANG === 'bn');

    // Rebuild Categories & Re-render Current View
    buildCategories();
    bindCategoryAccordion();

    // Update Header labels
    UI.ensureTopHeaderButtons();

    // Update Static text
    updateStaticText();

    if (currentSlug) {
      renderTool(currentSlug);
    } else {
      handleRoute();
    }
  }

  function setName(e) {
    var n = CFG.name || 'ToolGhor', a = CFG.nameAccent;
    e.textContent = '';
    if (a && n.length > a.length && n.slice(-a.length) === a) {
      e.appendChild(document.createTextNode(n.slice(0, -a.length)));
      var sp = document.createElement('span'); sp.className = 'acc'; sp.textContent = a; e.appendChild(sp);
    } else e.textContent = n;
  }

  function applyConfig() {
    document.querySelectorAll('[data-cfg="name"]').forEach(setName);
    document.querySelectorAll('[data-cfg="tagline"]').forEach(function (e) {
      e.textContent = LANG === 'bn' ? CFG.tagline : (CFG.taglineEn || CFG.tagline);
    });
    document.querySelectorAll('img[data-cfg="logo"]').forEach(function (e) {
      e.src = 'assets/' + (CFG.logo || 'logo.png').replace(/^assets\//, '');
      e.alt = CFG.name || 'ToolGhor';
    });
    document.querySelectorAll('source[data-cfg="logoDark"]').forEach(function (e) {
      e.srcset = 'assets/' + (CFG.logoDark || CFG.logo || 'logo-dark.png').replace(/^assets\//, '');
    });
    var num = String((CFG.whatsapp && CFG.whatsapp.number) || '').replace(/\D/g, '');
    var text = LANG === 'bn' ? (CFG.whatsapp && CFG.whatsapp.text) : (CFG.whatsapp && (CFG.whatsapp.textEn || CFG.whatsapp.text));
    document.querySelectorAll('a[data-cfg="wa"]').forEach(function (e) {
      e.href = 'https://wa.me/' + num + '?text=' + encodeURIComponent(text || '');
    });
  }

  function updateStaticText() {
    applyConfig();
    var tagEl = document.getElementById('hero-tagline');
    if (tagEl) tagEl.textContent = LANG === 'bn' ? CFG.tagline : (CFG.taglineEn || CFG.tagline);

    var searchInput = document.getElementById('q');
    if (searchInput) {
      searchInput.placeholder = UI.tr('কোন টুল খুঁজছেন? যেমন: পিডিএফ, ছবি, কিউআর, বয়স…', 'What do you need? e.g. PDF, image, QR, age…');
    }

    var expandAllText = document.getElementById('all-toggle-label');
    if (expandAllText) {
      expandAllText.textContent = UI.tr('সবগুলো খুলুন', 'Expand All');
    }

    var catInfoCount = document.getElementById('all-expand-count');
    if (catInfoCount) {
      catInfoCount.textContent = UI.tr('ক্যাটাগরি (৬টি ক্যাটাগরি, ২৪টি টুল)', 'Categories (6 categories, 24 tools)');
    }

    var backBtnText = document.getElementById('btn-back-text');
    if (backBtnText) {
      backBtnText.textContent = UI.tr('সবগুলো টুল', 'All Tools');
    }

    var howToTitle = document.getElementById('how-to-title');
    if (howToTitle) {
      howToTitle.textContent = UI.tr('কীভাবে ব্যবহার করবেন', 'How to use');
    }

    var relatedTitle = document.getElementById('related-tools-title');
    if (relatedTitle) {
      relatedTitle.textContent = UI.tr('আরও প্রয়োজনীয় টুলস', 'More useful tools');
    }
  }

  /* --------------------------------------------------------------------------
     Category Accordion System
     -------------------------------------------------------------------------- */
  function bindCategoryAccordion() {
    var catSections = document.querySelectorAll('main .cat');
    var btnAllToggle = document.getElementById('btnAllToggle');
    var chips = document.querySelectorAll('.chips .chip[data-cat]');

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
        if (textEl) textEl.textContent = expanded ? UI.tr('বন্ধ করুন', 'Collapse') : UI.tr('খুলুন', 'Expand');
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
        textEl.textContent = isAllExpanded ? UI.tr('সবগুলো বন্ধ করুন', 'Collapse All') : UI.tr('সবগুলো খুলুন', 'Expand All');
      }
      btnAllToggle.setAttribute('aria-expanded', isAllExpanded ? 'true' : 'false');

      var chipAll = document.querySelector('.chips .chip[data-cat="all"]');
      if (chipAll) chipAll.classList.toggle('on', isAllExpanded);
    }

    function collapseAll() {
      catSections.forEach(function (sec) { setCategoryState(sec, false); });
      updateAllToggleBtn();
    }

    function expandAll() {
      catSections.forEach(function (sec) { setCategoryState(sec, true); });
      updateAllToggleBtn();
    }

    function expandOnlyCategory(targetSec, shouldScroll) {
      catSections.forEach(function (sec) {
        setCategoryState(sec, sec === targetSec);
      });
      updateAllToggleBtn();

      if (shouldScroll) {
        var headerEl = document.querySelector('.top');
        var offset = (headerEl ? headerEl.offsetHeight : 65) + 12;
        var y = targetSec.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      }
    }

    catSections.forEach(function (sec) {
      setCategoryState(sec, false);
      var head = sec.querySelector('.cat-head');
      if (!head) return;

      head.addEventListener('click', function (e) {
        if (e.target.closest('a')) return;
        var isExpanded = sec.classList.contains('expanded');
        if (isExpanded) {
          setCategoryState(sec, false);
          updateAllToggleBtn();
        } else {
          expandOnlyCategory(sec, false);
        }
      });
    });

    if (btnAllToggle) {
      btnAllToggle.onclick = function () {
        var total = catSections.length;
        var expandedCount = 0;
        catSections.forEach(function (sec) {
          if (sec.classList.contains('expanded')) expandedCount++;
        });
        if (expandedCount === total) collapseAll(); else expandAll();
      };
    }

    // Chips
    chips.forEach(function (chip) {
      chip.onclick = function (e) {
        e.preventDefault();
        var cat = chip.getAttribute('data-cat');
        if (cat === 'all') {
          var total = catSections.length;
          var expandedCount = 0;
          catSections.forEach(function (sec) {
            if (sec.classList.contains('expanded')) expandedCount++;
          });
          if (expandedCount === total) collapseAll(); else expandAll();
        } else {
          var targetSec = document.getElementById('cat-' + cat);
          if (targetSec) expandOnlyCategory(targetSec, true);
        }
      };
    });

    window._toolghorExpandCategory = expandOnlyCategory;
    window._toolghorCollapseAll = collapseAll;
    window._toolghorExpandAll = expandAll;
  }

  /* --------------------------------------------------------------------------
     Initialization
     -------------------------------------------------------------------------- */
  function initApp() {
    homeView = document.getElementById('home-view');
    toolView = document.getElementById('tool-view');
    toolRoot = document.getElementById('tool-root');

    // Language pills setup
    var langEn = document.getElementById('lang-btn-en');
    var langBn = document.getElementById('lang-btn-bn');
    if (langEn) langEn.onclick = function (e) { e.preventDefault(); switchLanguage('en'); };
    if (langBn) langBn.onclick = function (e) { e.preventDefault(); switchLanguage('bn'); };
    if (langEn) langEn.classList.toggle('on', LANG === 'en');
    if (langBn) langBn.classList.toggle('on', LANG === 'bn');

    // Back button in Tool View
    var backBtn = document.getElementById('btn-tool-back');
    if (backBtn) {
      backBtn.onclick = function (e) {
        e.preventDefault();
        goBack();
      };
    }

    buildCategories();
    bindCategoryAccordion();
    bindSearch();
    updateStaticText();

    // Listen to hash changes (Android back button, links, bookmarks)
    window.addEventListener('hashchange', handleRoute);

    // Initial Route
    handleRoute();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

  window.ToolGhorApp = {
    navigateToTool: navigateToTool,
    navigateToHome: navigateToHome,
    switchLanguage: switchLanguage
  };
})();
