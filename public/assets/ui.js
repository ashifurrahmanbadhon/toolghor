/* সব টুলের কমন হেল্পার */
(function () {
  var ROOT = (document.body && document.body.getAttribute('data-root')) || '';
  var UI = {
    ROOT: ROOT,
    getRoot: function () {
      if (document.body && document.body.hasAttribute('data-root')) {
        return document.body.getAttribute('data-root') || '';
      }
      return UI.ROOT || '';
    }
  };
  var BN = '০১২৩৪৫৬৭৮৯';

  /* ভাষা: <html lang="bn|en"> থেকে আসে। বাংলা পেজে বাংলা, বাকিগুলোতে ইংরেজি। */
  var LANG = document.documentElement.getAttribute('lang') === 'bn' ? 'bn' : 'en';
  UI.lang = LANG;
  UI.tr = function (bn, en) {
    var cur = (typeof window !== 'undefined' && window.UI && window.UI.lang) || (document.documentElement && document.documentElement.getAttribute('lang')) || LANG;
    return cur === 'bn' ? bn : en;
  };
  window.tr = UI.tr;
  UI.digits = LANG === 'bn' ? 'bn' : 'en';
  UI.locale = LANG === 'bn' ? 'bn-BD' : 'en-GB';
  UI.numLocale = LANG === 'bn' ? 'bn-BD' : 'en-IN';

  /* সংখ্যাকে বাংলা/ইংরেজি অঙ্কে দেখানো */
  UI.n = function (v) {
    var s = String(v);
    var curDigits = (typeof window !== 'undefined' && window.UI && window.UI.digits) || (UI.lang === 'bn' ? 'bn' : 'en');
    if (curDigits !== 'bn') return s;
    return s.replace(/[0-9]/g, function (d) { return BN.charAt(+d); });
  };
  UI.num = function (v, max) {
    if (v === null || v === undefined || !isFinite(v)) return '—';
    try { return new Intl.NumberFormat(UI.numLocale, { maximumFractionDigits: max == null ? 4 : max }).format(v); }
    catch (e) { return UI.n(Math.round(v * 10000) / 10000); }
  };
  UI.fmtSize = function (b) {
    var u = ['B', 'KB', 'MB', 'GB'], i = 0, v = b;
    while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
    return UI.n((i === 0 ? Math.round(v) : v.toFixed(v >= 100 ? 0 : 1)) + ' ' + u[i]);
  };
  UI.baseName = function (n) { return (n || 'file').replace(/\.[^.]+$/, ''); };
  UI.ext = function (n) { var m = /\.([^.]+)$/.exec(n || ''); return m ? m[1].toLowerCase() : ''; };

  /* DOM বানানোর ছোট হেল্পার */
  UI.el = function (tag, attrs) {
    var e = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') e.className = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') e.addEventListener(k.slice(2), v);
      else if (k === 'value' || k === 'checked' || k === 'disabled' || k === 'selected') e[k] = v;
      else e.setAttribute(k, v === true ? '' : v);
    });
    for (var i = 2; i < arguments.length; i++) UI.add(e, arguments[i]);
    return e;
  };
  UI.add = function (parent, child) {
    if (child === null || child === undefined || child === false) return parent;
    if (Array.isArray(child)) { child.forEach(function (c) { UI.add(parent, c); }); return parent; }
    if (typeof child === 'string' || typeof child === 'number') parent.appendChild(document.createTextNode(String(child)));
    else parent.appendChild(child);
    return parent;
  };
  UI.clear = function (e) { while (e.firstChild) e.removeChild(e.firstChild); return e; };
  UI.icon = function (name, size) {
    var s = size || 20;
    var inner = (window.ICONS && window.ICONS[name]) || '';
    var span = document.createElement('span');
    span.className = 'ic';
    span.setAttribute('aria-hidden', 'true');
    span.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>';
    return span;
  };
  UI.btn = function (label, onclick, opts) {
    opts = opts || {};
    var b = UI.el('button', { type: 'button', class: 'btn' + (opts.cls ? ' ' + opts.cls : ''), onclick: onclick, disabled: !!opts.disabled });
    if (opts.icon) UI.add(b, UI.icon(opts.icon, opts.iconSize || 18));
    if (!label) b.setAttribute('aria-label', opts.aria || tr('ডাউনলোড', "Download"));
    UI.add(b, label);
    return b;
  };
  UI.field = function (label, control, hint, cls) {
    var id = 'f' + Math.random().toString(36).slice(2, 8);
    if (control.setAttribute && !control.id) control.id = id;
    return UI.el('div', { class: 'field' + (cls ? ' ' + cls : '') }, UI.el('label', { for: control.id || id }, label), control, hint ? UI.el('small', {}, hint) : null);
  };
  UI.select = function (options, value, onchange) {
    var s = UI.el('select', { onchange: onchange });
    options.forEach(function (o) {
      var opt = UI.el('option', { value: o.value }, o.label);
      if (String(o.value) === String(value)) opt.selected = true;
      s.appendChild(opt);
    });
    return s;
  };
  /* একটি-বাছাই বোতাম সারি */
  UI.seg = function (options, value, onchange) {
    var wrap = UI.el('div', { class: 'seg', role: 'group' });
    var cur = value;
    function draw() {
      UI.clear(wrap);
      options.forEach(function (o) {
        wrap.appendChild(UI.el('button', {
          type: 'button', 'aria-pressed': String(o.value === cur),
          onclick: function () { cur = o.value; draw(); onchange && onchange(cur); }
        }, o.label));
      });
    }
    draw();
    wrap.get = function () { return cur; };
    wrap.set = function (v) { cur = v; draw(); };
    return wrap;
  };
  UI.notice = function (type, text) { return UI.el('div', { class: 'notice ' + type, role: type === 'err' ? 'alert' : 'status' }, text); };
  UI.progress = function () {
    var bar = UI.el('i');
    var txt = UI.el('small', {}, '');
    var el = UI.el('div', { class: 'progress-wrap' }, UI.el('div', { class: 'progress', role: 'progressbar' }, bar), txt);
    el.set = function (p, t) { bar.style.width = Math.max(0, Math.min(100, p)) + '%'; if (t !== undefined) txt.textContent = t; };
    return el;
  };
  UI.toast = function (msg) {
    var t = UI.el('div', { class: 'toast', role: 'status' }, msg);
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2600);
  };
  UI.yield = function () { return new Promise(function (r) { setTimeout(r, 0); }); };

  UI.getToolSlug = function () {
    var tool = (document.body && document.body.getAttribute('data-tool')) || '';
    if (!tool) {
      var m = (window.location.pathname || '').match(/\/tools\/([^\/\?#]+)/);
      if (m) tool = m[1];
    }
    return tool || '';
  };

  UI.formatDownloadName = function (name) {
    var tool = UI.getToolSlug();
    if (!tool) return name || 'download';

    var raw = (name || '').trim();
    var ext = '';
    var dotIdx = raw.lastIndexOf('.');
    if (dotIdx >= 0) {
      ext = raw.slice(dotIdx);
      raw = raw.slice(0, dotIdx);
    }

    // If already formatted like ToolGhor(...), keep it
    if (/^ToolGhor\(/i.test(raw)) {
      return raw + ext;
    }

    // Check if there is a page or indexed suffix (e.g. -page-01, -page-1, -1, etc.)
    var sub = '';
    var pageMatch = raw.match(/(-page-\d+|-p\d+|\bpage-\d+)/i);
    if (pageMatch) {
      sub = '-' + pageMatch[1].replace(/^-/, '');
    } else {
      var numMatch = raw.match(/-(\d+)$/);
      if (numMatch) {
        sub = '-' + numMatch[1];
      }
    }

    return 'ToolGhor(' + tool + sub + ')' + ext;
  };

  UI.download = function (blob, name) {
    name = UI.formatDownloadName(name);
    var a = document.createElement('a');
    var url = URL.createObjectURL(blob);
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 5000);
  };
  UI.copy = function (text) {
    var done = function () { UI.toast(tr('কপি হয়েছে', "Copied")); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { legacy(); });
    } else legacy();
    function legacy() {
      var ta = UI.el('textarea', { style: { position: 'fixed', opacity: '0' } }); ta.value = text;
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { UI.toast(tr('কপি করা যায়নি', "Could not copy")); }
      ta.remove();
    }
  };

  /* ফাইল-টাইপ মিলছে কিনা */
  function accepted(file, accept) {
    if (!accept) return true;
    var name = (file.name || '').toLowerCase();
    var type = (file.type || '').toLowerCase();
    if (accept.indexOf('image') >= 0) {
      if (/\.(jpe?g|png|webp|bmp|gif|svg|avif|heic|jfif)$/i.test(name)) return true;
    }
    return accept.split(',').some(function (tk) {
      tk = tk.trim().toLowerCase();
      if (!tk) return false;
      if (tk.charAt(0) === '.') return name.slice(-tk.length) === tk;
      if (tk.slice(-2) === '/*') return (file.type || '').indexOf(tk.slice(0, -1)) === 0;
      return file.type === tk;
    });
  }
  UI.dropzone = function (o) {
    var input = UI.el('input', { type: 'file', accept: o.accept || '', multiple: o.multiple ? true : false, hidden: true });
    var box = UI.el('div', { class: 'drop', tabindex: '0', role: 'button' },
      UI.icon('upload', 30),
      UI.el('strong', {}, o.label || tr('ফাইল বেছে নিন', "Choose a file")),
      UI.el('span', { class: 'hint' }, o.hint || tr('অথবা ফাইল এখানে টেনে এনে ছেড়ে দিন', "or drag and drop a file here")),
      input);
    function handle(list) {
      var files = Array.prototype.slice.call(list || []);
      var ok = files.filter(function (f) { return accepted(f, o.accept); });
      if (!ok.length && files.length) { UI.toast(tr('এই ধরনের ফাইল এখানে চলবে না', "This type of file is not supported here")); return; }
      if (!ok.length) return;
      o.onFiles(o.multiple ? ok : [ok[0]]);
    }
    box.addEventListener('click', function (e) { if (e.target !== input) input.click(); });
    box.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
    input.addEventListener('change', function () { handle(input.files); input.value = ''; });
    ['dragenter', 'dragover'].forEach(function (ev) { box.addEventListener(ev, function (e) { e.preventDefault(); box.classList.add('over'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { box.addEventListener(ev, function (e) { e.preventDefault(); box.classList.remove('over'); }); });
    box.addEventListener('drop', function (e) { handle(e.dataTransfer && e.dataTransfer.files); });
    return box;
  };

  /* উপর-নিচ করা যায় এমন ফাইল তালিকা */
  UI.sortList = function (opts) {
    var wrap = UI.el('div', { class: 'slist' });
    function move(i, d) { var it = opts.items.splice(i, 1)[0]; opts.items.splice(i + d, 0, it); draw(); }
    function draw() {
      UI.clear(wrap);
      opts.items.forEach(function (it, i) {
        wrap.appendChild(UI.el('div', { class: 'srow' },
          UI.el('span', { class: 'sidx' }, UI.n(i + 1)),
          opts.label(it, i),
          UI.el('span', { class: 'sbtns' },
            UI.el('button', { type: 'button', class: 'ib', 'aria-label': tr('উপরে নিন', "Move up"), disabled: i === 0, onclick: function () { move(i, -1); } }, UI.icon('arrow-up', 18)),
            UI.el('button', { type: 'button', class: 'ib', 'aria-label': tr('নিচে নিন', "Move down"), disabled: i === opts.items.length - 1, onclick: function () { move(i, 1); } }, UI.icon('arrow-down', 18)),
            UI.el('button', { type: 'button', class: 'ib del', 'aria-label': tr('বাদ দিন', "Remove"), onclick: function () { opts.items.splice(i, 1); draw(); } }, UI.icon('trash-2', 18)))));
      });
      if (opts.onChange) opts.onChange();
    }
    wrap.redraw = draw;
    draw();
    return wrap;
  };

  /* ছবি/ক্যানভাস হেল্পার */
  function dataURItoBlob(dataURI) {
    var parts = dataURI.split(',');
    var byteString = atob(parts[1]);
    var mimeString = parts[0].split(':')[1].split(';')[0];
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  }

  UI.readImage = function (file) {
    return new Promise(function (res, rej) {
      if (!file) return rej(new Error(tr('কোনো ফাইল নির্বাচন করা হয়নি', "No file selected")));
      var reader = new FileReader();
      reader.onload = function (e) {
        var dataUrl = e.target.result;
        var img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function () {
          img._url = dataUrl;
          res(img);
        };
        img.onerror = function () {
          var blobUrl = URL.createObjectURL(file);
          var bImg = new Image();
          bImg.crossOrigin = 'anonymous';
          bImg.onload = function () { bImg._url = blobUrl; res(bImg); };
          bImg.onerror = function () {
            rej(new Error(tr('ছবিটি খোলা যায়নি: ', "Could not open the image: ") + (file.name || '')));
          };
          bImg.src = blobUrl;
        };
        img.src = dataUrl;
      };
      reader.onerror = function () {
        var blobUrl = URL.createObjectURL(file);
        var bImg = new Image();
        bImg.crossOrigin = 'anonymous';
        bImg.onload = function () { bImg._url = blobUrl; res(bImg); };
        bImg.onerror = function () {
          rej(new Error(tr('ছবিটি খোলা যায়নি: ', "Could not open the image: ") + (file.name || '')));
        };
        bImg.src = blobUrl;
      };
      reader.readAsDataURL(file);
    });
  };
  UI.toBlob = function (canvas, type, q) {
    return new Promise(function (res, rej) {
      try {
        canvas.toBlob(function (b) {
          if (b) return res(b);
          try {
            var dataUrl = canvas.toDataURL(type, q);
            res(dataURItoBlob(dataUrl));
          } catch (err) {
            rej(new Error(tr('ছবি তৈরি করা যায়নি (ব্রাউজার এই ফরম্যাট সমর্থন করে না?)', "Could not create the image (your browser may not support this format)")));
          }
        }, type, q);
      } catch (e) {
        try {
          var dataUrl = canvas.toDataURL(type, q);
          res(dataURItoBlob(dataUrl));
        } catch (err) {
          rej(new Error(tr('ছবি তৈরি করা যায়নি: ', "Could not create the image: ") + (e.message || '')));
        }
      }
    });
  };
  UI.canvas = function (w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
  UI.zip = function (entries) {
    var z = new JSZip();
    var used = {};
    entries.forEach(function (e) {
      var n = e.name;
      if (used[n]) { var m = /^(.*?)(\.[^.]+)?$/.exec(n); n = m[1] + '-' + (++used[e.name]) + (m[2] || ''); } else used[n] = 1;
      z.file(n, e.blob);
    });
    return z.generateAsync({ type: 'blob', compression: 'STORE' });
  };
  UI.loadScript = (function () {
    var cache = {};
    return function (src) {
      if (cache[src]) return cache[src];
      cache[src] = new Promise(function (res, rej) {
        var s = document.createElement('script');
        s.src = src; s.onload = res; s.onerror = function () { delete cache[src]; rej(new Error(tr('লোড করা যায়নি: ', "Could not load: ") + src)); };
        document.head.appendChild(s);
      });
      return cache[src];
    };
  })();
  UI.debounce = function (fn, ms) { var t; return function () { var a = arguments, c = this; clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms || 200); }; };
  UI.err = function (e) { return (e && e.message) ? e.message : String(e); };

  /* বাংলা অঙ্ক → ইংরেজি অঙ্ক (ইনপুট পড়ার জন্য) */
  UI.toEn = function (s) { return String(s).replace(/[০-৯]/g, function (d) { return String(BN.indexOf(d)); }); };
  UI.parseNum = function (s) { var v = parseFloat(UI.toEn(s).replace(/,/g, '').trim()); return isFinite(v) ? v : NaN; };
  /* ফলাফল বক্স: নোটিস + ডাউনলোড বোতাম */
  UI.done = function (out, blob, name, msg, extra) {
    name = UI.formatDownloadName(name);
    UI.clear(out);
    out.appendChild(UI.el('div', { class: 'result stack' },
      UI.notice('ok', msg),
      UI.el('div', { class: 'row' },
        UI.btn(tr('ডাউনলোড (', "Download (") + UI.fmtSize(blob.size) + ')', function () { UI.download(blob, name); }, { icon: 'download' }),
        extra)));
  };

  /* ============ AI প্রোভাইডার ও API কি কানেক্টর ============ */
  UI.AI_PROVIDERS = [
    {
      id: 'gemini',
      name: 'Google Gemini API',
      badge: '১৫ RPM ফ্রি কোটা',
      badgeEn: 'Generous Free Tier',
      desc: 'গুগলের শক্তিশালী মাল্টিমোডাল এআই — দ্রুত OCR, ইমেজ ও ডকুমেন্ট অ্যানালাইসিস, এবং বুদ্ধিমান ফলাফল।',
      descEn: 'Google multimodal AI for fast OCR, image & document analysis, and intelligent outputs.',
      keyUrl: 'https://aistudio.google.com/app/apikey',
      urlLabel: '১ মিনিটে ফ্রি Google Gemini API কী তৈরি করুন',
      urlLabelEn: 'Get free Google Gemini API key in 1 min',
      configKey: 'geminiKey',
      placeholder: 'AIzaSy... (Gemini API Key)'
    },
    {
      id: 'openai',
      name: 'OpenAI API',
      badge: 'ChatGPT 4o',
      badgeEn: 'ChatGPT 4o',
      desc: 'ওপেনএআই-এর উন্নত ভিশন মডেল ও বুদ্ধিমান অ্যাসিস্ট্যান্ট — নিখুঁত টুল প্রসেসিং ও কনটেন্ট জেনারেশন।',
      descEn: 'OpenAI advanced vision model and smart assistant for intelligent tool processing.',
      keyUrl: 'https://platform.openai.com/api-keys',
      urlLabel: 'OpenAI একাউন্ট থেকে API কী তৈরি করুন',
      urlLabelEn: 'Create OpenAI API key',
      configKey: 'openaiKey',
      placeholder: 'sk-proj-... (OpenAI API Key)'
    }
  ];

  UI.getApiKeys = function (id) {
    var raw = '';
    try { raw = localStorage.getItem('th_api_' + id) || ''; } catch (e) { }
    raw = (raw || '').trim();
    var keys = [];
    if (raw) {
      try {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          keys = parsed.map(function (k) { return String(k).trim(); }).filter(Boolean);
        } else if (typeof parsed === 'string' && parsed.trim()) {
          keys = [parsed.trim()];
        }
      } catch (e) {
        keys = raw.split(/[\n,]+/).map(function (k) { return k.trim(); }).filter(Boolean);
      }
    }
    if (!keys.length && window.SITE_CONFIG && window.SITE_CONFIG.apis) {
      for (var i = 0; i < UI.AI_PROVIDERS.length; i++) {
        var p = UI.AI_PROVIDERS[i];
        if (p.id === id && p.configKey) {
          var cfgVal = (window.SITE_CONFIG.apis[p.configKey] || '').trim();
          if (cfgVal) keys = [cfgVal];
          break;
        }
      }
    }
    return keys;
  };

  UI.getApiKey = function (id) {
    var keys = UI.getApiKeys(id);
    return keys.length ? keys[0] : '';
  };

  UI.setApiKeys = function (id, keysArray) {
    var clean = (keysArray || []).map(function (k) { return String(k).trim(); }).filter(Boolean);
    try {
      if (clean.length > 1) {
        localStorage.setItem('th_api_' + id, JSON.stringify(clean));
      } else if (clean.length === 1) {
        localStorage.setItem('th_api_' + id, clean[0]);
      } else {
        localStorage.removeItem('th_api_' + id);
      }
    } catch (e) { }
    UI.updateHeaderApiBadge();
  };

  UI.setApiKey = function (id, val) {
    if (Array.isArray(val)) UI.setApiKeys(id, val);
    else UI.setApiKeys(id, val ? [val] : []);
  };

  UI.getConnectedApiCount = function () {
    var count = 0;
    UI.AI_PROVIDERS.forEach(function (p) {
      count += UI.getApiKeys(p.id).length;
    });
    return count;
  };

  UI.hasAIKey = function () {
    return UI.getConnectedApiCount() > 0;
  };

  UI.getActiveAIProviders = function () {
    var list = [];
    if (UI.getApiKeys('gemini').length) list.push('Google Gemini');
    if (UI.getApiKeys('openai').length) list.push('OpenAI');
    return list;
  };

  UI.callAI = async function (prompt, options) {
    options = options || {};
    var systemInstruction = options.systemInstruction || (LANG === 'bn'
      ? 'আপনি ToolGhor ওয়েবসাইটের একজন দক্ষ ও তথ্যবহুল এআই সহকারী। ফলাফল পরিষ্কার, আকর্ষণীয়, তথ্যবহুল ও বুলেট পয়েন্ট আকারে বাংলায় দিন।'
      : 'You are an intelligent, expert AI assistant on ToolGhor. Provide clear, professional, practical, and well-structured responses.');
    var temperature = options.temperature != null ? options.temperature : 0.7;
    var maxTokens = options.maxTokens || 1200;

    // 1. Try Google Gemini API
    var geminiKeys = UI.getApiKeys('gemini');
    for (var i = 0; i < geminiKeys.length; i++) {
      var gk = geminiKeys[i];
      try {
        var gUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + encodeURIComponent(gk);
        var payload = {
          contents: [{ role: 'user', parts: [{ text: (systemInstruction ? (systemInstruction + '\n\n') : '') + prompt }] }],
          generationConfig: { temperature: temperature, maxOutputTokens: maxTokens }
        };
        var res = await fetch(gUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          var data = await res.json();
          if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
            var text = data.candidates[0].content.parts.map(function (p) { return p.text || ''; }).join('').trim();
            if (text) return { success: true, text: text, provider: 'Google Gemini' };
          }
        } else {
          console.warn('Gemini API HTTP Error:', res.status);
        }
      } catch (e) {
        console.warn('Gemini request failed:', e);
      }
    }

    // 2. Try OpenAI API
    var openaiKeys = UI.getApiKeys('openai');
    for (var j = 0; j < openaiKeys.length; j++) {
      var ok = openaiKeys[j];
      try {
        var oRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + ok },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemInstruction },
              { role: 'user', content: prompt }
            ],
            temperature: temperature,
            max_tokens: maxTokens
          })
        });
        if (oRes.ok) {
          var oData = await oRes.json();
          if (oData.choices && oData.choices[0] && oData.choices[0].message) {
            var oText = oData.choices[0].message.content.trim();
            if (oText) return { success: true, text: oText, provider: 'OpenAI' };
          }
        } else {
          console.warn('OpenAI API HTTP Error:', oRes.status);
        }
      } catch (e) {
        console.warn('OpenAI request failed:', e);
      }
    }

    return { success: false, text: null, error: 'no_api_key' };
  };

  UI.formatAiText = function (raw) {
    if (!raw) return '';
    var text = String(raw).trim();
    // Escape HTML first
    var s = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    // Bold **text**
    s = s.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    // Italic *text*
    s = s.replace(/\*(.*?)\*/g, '<i>$1</i>');
    // Lines
    var lines = s.split(/\r?\n/);
    var html = [];
    var inList = false;

    lines.forEach(function (line) {
      var l = line.trim();
      if (!l) {
        if (inList) { html.push('</ul>'); inList = false; }
        return;
      }
      if (/^[#-]+\s*/.test(l) && l.startsWith('#')) {
        if (inList) { html.push('</ul>'); inList = false; }
        var hLevel = l.match(/^#+/)[0].length;
        var hText = l.replace(/^#+\s*/, '');
        html.push('<h' + Math.min(4, hLevel + 2) + ' class="ai-out-h">' + hText + '</h' + Math.min(4, hLevel + 2) + '>');
      } else if (/^[-*•]\s+/.test(l)) {
        if (!inList) { html.push('<ul class="ai-out-list">'); inList = true; }
        html.push('<li>' + l.replace(/^[-*•]\s+/, '') + '</li>');
      } else if (/^\d+\.\s+/.test(l)) {
        if (inList) { html.push('</ul>'); inList = false; }
        html.push('<div class="ai-out-num"><b>' + l.match(/^\d+\./)[0] + '</b> ' + l.replace(/^\d+\.\s+/, '') + '</div>');
      } else {
        if (inList) { html.push('</ul>'); inList = false; }
        html.push('<p class="ai-out-p">' + l + '</p>');
      }
    });
    if (inList) html.push('</ul>');

    return '<div class="ai-formatted-output">' + html.join('') + '</div>';
  };

  UI.renderAiBox = function (opts) {
    opts = opts || {};
    var box = UI.el('div', { class: 'ai-tool-card stack' });
    var statusBadge = UI.el('span', {
      class: 'ai-badge-pill',
      role: 'button',
      tabindex: '0'
    });

    function updateBadge() {
      var cur = UI.getActiveAIProviders();
      if (cur.length) {
        statusBadge.className = 'ai-badge-pill active';
        statusBadge.innerHTML = '<span class="ai-pulse-dot"></span> ' + (LANG === 'bn' ? (cur.join(' ও ') + ' লাইভ AI সক্রিয়') : (cur.join(' & ') + ' Live AI Active'));
        statusBadge.title = tr('সংযুক্ত API কী দিয়ে লাইভ AI জেনারেশন চলবে', 'Live AI generation powered by your connected API key');
      } else {
        statusBadge.className = 'ai-badge-pill offline';
        statusBadge.innerHTML = '✨ ' + (LANG === 'bn' ? 'অফলাইন মোড (API কী যোগ করুন)' : 'Offline Mode (Connect API Key)');
        statusBadge.title = tr('ক্লিক করে Google Gemini বা OpenAI API কী কানেক্ট করুন', 'Click to connect Google Gemini or OpenAI API Key');
      }
    }
    updateBadge();
    statusBadge.onclick = function (e) {
      e.stopPropagation();
      UI.openAiKeysModal();
    };

    window.addEventListener('th-api-keys-updated', updateBadge);

    var head = UI.el('div', { class: 'ai-tool-card-head' },
      UI.el('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '8px' } },
        UI.el('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
          UI.el('span', { class: 'ai-sparkle-ico' }, '✨'),
          UI.el('strong', { class: 'ai-tool-card-title' }, opts.title || tr('AI সহকারী', 'AI Assistant'))
        ),
        statusBadge
      )
    );
    if (opts.subtitle) {
      head.appendChild(UI.el('p', { class: 'ai-tool-card-sub' }, opts.subtitle));
    }

    var content = UI.el('div', { class: 'ai-tool-card-content' });
    if (opts.initialHtml) {
      content.innerHTML = opts.initialHtml;
    } else if (opts.initialText) {
      content.textContent = opts.initialText;
    }

    var actionsRow = UI.el('div', { class: 'ai-tool-card-actions row', style: { alignItems: 'center', gap: '8px', flexWrap: 'wrap' } });
    var genBtn = UI.btn(opts.btnText || tr('✨ এআই পরামর্শ তৈরি করুন', '✨ Generate with AI'), async function () {
      if (typeof opts.onGenerate !== 'function') return;
      genBtn.disabled = true;
      var origText = genBtn.innerHTML;
      genBtn.innerHTML = '<span class="ai-spin"></span> ' + tr('AI কাজ করছে...', 'AI is working...');
      content.innerHTML = '<div class="ai-loading-skeleton"><span class="ai-loading-text">' + tr('✨ ফলাফল বিশ্লেষণ ও প্রস্তুত করা হচ্ছে...', '✨ Analyzing and crafting result...') + '</span></div>';
      try {
        var res = await opts.onGenerate();
        if (typeof res === 'string') {
          content.innerHTML = UI.formatAiText(res);
        } else if (res && res.html) {
          content.innerHTML = res.html;
        } else if (res && res.text) {
          content.innerHTML = UI.formatAiText(res.text);
        }
        // Add copy button
        var copyBtn = UI.btn(tr('কপি করুন', 'Copy Text'), function () {
          var t = content.innerText || content.textContent;
          UI.copy(t, tr('✓ কপি করা হয়েছে!', '✓ Copied to clipboard!'));
        }, { cls: 'alt sm', icon: 'clipboard' });
        var bar = UI.el('div', { style: { display: 'flex', justifyContent: 'flex-end', marginTop: '10px' } }, copyBtn);
        content.appendChild(bar);
      } catch (err) {
        content.innerHTML = '<div class="notice err">' + tr('ত্রুটি: ', 'Error: ') + UI.esc(err.message || String(err)) + '</div>';
      } finally {
        genBtn.disabled = false;
        genBtn.innerHTML = origText;
      }
    }, { cls: 'ai-action-btn', icon: 'sparkles' });

    actionsRow.appendChild(genBtn);

    if (opts.extraBtns && Array.isArray(opts.extraBtns)) {
      opts.extraBtns.forEach(function (b) { actionsRow.appendChild(b); });
    }

    box.appendChild(head);
    box.appendChild(actionsRow);
    box.appendChild(content);

    return {
      el: box,
      update: function (html) { content.innerHTML = html; },
      trigger: function () { genBtn.click(); }
    };
  };

  UI.updateHeaderApiBadge = function () {
    var count = UI.getConnectedApiCount();
    document.querySelectorAll('.btn-api-connect, #btn-ai-keys').forEach(function (btn) {
      btn.classList.toggle('has-keys', count > 0);
      var dot = btn.querySelector('.api-dot');
      if (dot) {
        dot.hidden = count === 0;
        if (count > 0) {
          dot.setAttribute('title', (UI.lang === 'bn' ? (UI.n(count) + 'টি API কি সংযুক্ত') : (count + ' API Key' + (count > 1 ? 's' : '') + ' Connected')));
        } else {
          dot.removeAttribute('title');
        }
      }
      var cnt = btn.querySelector('.api-count');
      if (cnt) {
        cnt.hidden = count === 0;
        cnt.textContent = count > 0 ? UI.n(count) : '';
      }
    });
  };

  UI.openAiKeysModal = function () {
    var existing = document.getElementById('ai-keys-modal');
    if (existing) existing.remove();

    var backdrop = UI.el('div', { class: 'ai-modal-backdrop', id: 'ai-keys-modal', role: 'dialog', 'aria-modal': 'true' });
    var box = UI.el('div', { class: 'ai-modal-box' });

    // Modal Header
    var closeBtn = UI.el('button', {
      type: 'button', class: 'ai-modal-close', 'aria-label': tr('বন্ধ করুন', 'Close'),
      onclick: closeModal
    }, UI.icon('x', 18));

    var head = UI.el('div', { class: 'ai-modal-head' },
      UI.el('div', {},
        UI.el('h3', { class: 'ai-modal-title' },
          UI.icon('key', 20),
          document.createTextNode(tr('API কী (Google Gemini ও OpenAI)', 'API Keys (Google Gemini & OpenAI)'))
        ),
        UI.el('p', { class: 'ai-modal-subtitle' },
          tr(
            'Google Gemini API এবং OpenAI API কানেক্ট করুন। ব্যাকআপ হিসেবে একাধিক কি (Multiple Keys) যুক্ত করতে পারেন। আপনার কি ১০০% সুরক্ষিত ও শুধুমাত্র আপনার ব্রাউজারে জমা থাকে।',
            'Connect your Google Gemini API and OpenAI API keys. You can connect multiple keys for redundancy. All keys are stored 100% locally in your browser.'
          )
        )
      ),
      closeBtn
    );

    // Modal Body with Provider Cards
    var body = UI.el('div', { class: 'ai-modal-body' });
    var providerRowsMap = {};

    UI.AI_PROVIDERS.forEach(function (prov) {
      var currentKeys = UI.getApiKeys(prov.id);
      if (!currentKeys.length) currentKeys = [''];

      var statusPill = UI.el('span', { class: 'ai-status-pill not-connected' });
      function updateCardStatus(validCount) {
        if (validCount > 0) {
          card.classList.add('is-active');
          statusPill.className = 'ai-status-pill connected';
          var text = validCount === 1 ? tr('১টি কী সংযুক্ত', '1 Key Connected') : tr(UI.n(validCount) + 'টি কী সংযুক্ত', validCount + ' Keys Connected');
          statusPill.innerHTML = '<span class="dot"></span>' + text;
        } else {
          card.classList.remove('is-active');
          statusPill.className = 'ai-status-pill not-connected';
          statusPill.innerHTML = '<span class="dot"></span>' + tr('সংযুক্ত নয়', 'Not Connected');
        }
      }

      var keysList = UI.el('div', { class: 'ai-keys-list' });
      var inputItems = [];
      providerRowsMap[prov.id] = inputItems;

      function refreshIndices() {
        var validCount = 0;
        inputItems.forEach(function (item, idx) {
          if (item.idxSpan) item.idxSpan.textContent = '#' + UI.n(idx + 1);
          if (item.input && item.input.value.trim()) validCount++;
        });
        updateCardStatus(validCount);
      }

      function createKeyRow(initialVal) {
        var input = UI.el('input', {
          type: 'password',
          placeholder: prov.placeholder,
          value: initialVal || '',
          autocomplete: 'off',
          spellcheck: 'false'
        });

        var idxSpan = UI.el('span', { class: 'ai-key-idx' }, '#' + UI.n(inputItems.length + 1));

        var toggleEye = UI.el('button', {
          type: 'button', class: 'ai-input-btn', title: tr('দেখুন / লুকান', 'Show / Hide'),
          onclick: function () {
            input.type = input.type === 'password' ? 'text' : 'password';
          }
        }, UI.icon('eye', 15));

        var deleteBtn = UI.el('button', {
          type: 'button', class: 'ai-input-btn danger', title: tr('মুছুন', 'Delete'),
          onclick: function () {
            if (inputItems.length > 1) {
              row.remove();
              var i = inputItems.indexOf(itemObj);
              if (i >= 0) inputItems.splice(i, 1);
              refreshIndices();
            } else {
              input.value = '';
              input.focus();
              refreshIndices();
            }
          }
        }, UI.icon('trash-2', 14));

        var row = UI.el('div', { class: 'ai-key-item' },
          idxSpan,
          input,
          toggleEye,
          deleteBtn
        );

        var itemObj = { row: row, input: input, idxSpan: idxSpan };
        inputItems.push(itemObj);

        input.addEventListener('input', refreshIndices);
        return row;
      }

      currentKeys.forEach(function (k) {
        keysList.appendChild(createKeyRow(k));
      });

      var addKeyBtn = UI.el('button', {
        type: 'button', class: 'btn-add-key',
        onclick: function () {
          var newRow = createKeyRow('');
          keysList.appendChild(newRow);
          refreshIndices();
          var last = inputItems[inputItems.length - 1];
          if (last && last.input) last.input.focus();
        }
      },
        UI.icon('plus', 14),
        document.createTextNode(tr('+ আরেকটি API কী যোগ করুন', '+ Add another API Key'))
      );

      var card = UI.el('div', { class: 'ai-provider-card' },
        UI.el('div', { class: 'ai-provider-header' },
          UI.el('div', { class: 'ai-provider-name' },
            document.createTextNode(prov.name),
            UI.el('span', { class: 'ai-provider-badge' }, LANG === 'bn' ? prov.badge : prov.badgeEn)
          ),
          statusPill
        ),
        UI.el('p', { class: 'ai-provider-desc' }, LANG === 'bn' ? prov.desc : prov.descEn),
        keysList,
        addKeyBtn,
        UI.el('div', { class: 'ai-provider-foot' },
          UI.el('a', {
            href: prov.keyUrl, target: '_blank', rel: 'noopener noreferrer',
            class: 'ai-provider-link'
          },
            UI.icon('external-link', 14),
            document.createTextNode(LANG === 'bn' ? prov.urlLabel : prov.urlLabelEn)
          )
        )
      );

      refreshIndices();
      body.appendChild(card);
    });

    // Modal Footer
    var saveBtn = UI.btn(tr('সব সেভ করুন', 'Save All Keys'), function () {
      UI.AI_PROVIDERS.forEach(function (prov) {
        var items = providerRowsMap[prov.id] || [];
        var keys = items.map(function (it) { return (it.input ? it.input.value : '').trim(); }).filter(Boolean);
        UI.setApiKeys(prov.id, keys);
      });
      UI.toast(tr('✓ সকল API কী সফলভাবে সেভ করা হয়েছে!', '✓ All API keys saved successfully!'));
      window.dispatchEvent(new CustomEvent('th-api-keys-updated'));
      closeModal();
    }, { icon: 'check', cls: 'paddy' });

    var clearAllBtn = UI.btn(tr('সব মুছুন', 'Clear All'), function () {
      if (confirm(tr('আপনি কি সত্যিই সব সংরক্ষিত API কী মুছে ফেলতে চান?', 'Are you sure you want to remove all saved API keys?'))) {
        UI.AI_PROVIDERS.forEach(function (prov) {
          UI.setApiKeys(prov.id, []);
          var items = providerRowsMap[prov.id] || [];
          items.forEach(function (it, idx) {
            if (idx === 0 && it.input) it.input.value = '';
            else if (idx > 0 && it.row) it.row.remove();
          });
          if (items.length > 1) items.splice(1);
          if (items[0] && items[0].idxSpan) items[0].idxSpan.textContent = '#১';
        });
        body.querySelectorAll('.ai-provider-card').forEach(function (c) { c.classList.remove('is-active'); });
        body.querySelectorAll('.ai-status-pill').forEach(function (p) {
          p.className = 'ai-status-pill not-connected';
          p.innerHTML = '<span class="dot"></span>' + tr('সংযুক্ত নয়', 'Not Connected');
        });
        UI.toast(tr('সব API কী মুছে ফেলা হয়েছে', 'All API keys cleared'));
        window.dispatchEvent(new CustomEvent('th-api-keys-updated'));
      }
    }, { cls: 'alt sm', icon: 'trash-2' });

    var foot = UI.el('div', { class: 'ai-modal-foot' },
      UI.el('div', { class: 'ai-modal-foot-info' },
        UI.icon('shield-check', 16),
        document.createTextNode(tr('১০০% প্রাইভেট • কোনো সার্ভারে যায় না', '100% Private • Stored locally in browser'))
      ),
      UI.el('div', { class: 'ai-modal-foot-actions' },
        clearAllBtn,
        saveBtn
      )
    );

    box.appendChild(head);
    box.appendChild(body);
    box.appendChild(foot);
    backdrop.appendChild(box);

    function closeModal() {
      backdrop.classList.remove('show');
      setTimeout(function () { backdrop.remove(); }, 240);
      document.removeEventListener('keydown', onKeyDown);
    }

    function onKeyDown(e) {
      if (e.key === 'Escape') closeModal();
    }

    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) closeModal();
    });

    document.addEventListener('keydown', onKeyDown);
    document.body.appendChild(backdrop);
    requestAnimationFrame(function () {
      backdrop.classList.add('show');
    });
  };

  /* ============ Request a Tool Modal ============ */
  UI.openRequestToolModal = function () {
    var existing = document.getElementById('request-tool-modal');
    if (existing) existing.remove();

    var backdrop = UI.el('div', { class: 'req-modal-backdrop', id: 'request-tool-modal', role: 'dialog', 'aria-modal': 'true' });
    var box = UI.el('div', { class: 'req-modal-box' });

    function closeModal() {
      backdrop.classList.remove('show');
      setTimeout(function () { backdrop.remove(); }, 220);
      document.removeEventListener('keydown', onKeyDown);
    }

    function onKeyDown(e) {
      if (e.key === 'Escape') closeModal();
    }

    var closeBtn = UI.el('button', {
      type: 'button',
      class: 'req-modal-close',
      'aria-label': tr('বন্ধ করুন', 'Close'),
      onclick: closeModal
    }, UI.icon('x', 18));

    var title = tr('🛠️ টুলের অনুরোধ', '🛠️ Request a Tool');
    var desc = tr('আমাদের সাথে সরাসরি যোগাযোগ করুন। এছাড়াও নতুন কোনো টুলের আইডিয়া বা পরামর্শ দিতে পারেন।', 'Message us directly. You can also suggest ideas for new tools.');

    var waNum = (window.SITE_CONFIG && window.SITE_CONFIG.whatsapp && window.SITE_CONFIG.whatsapp.number) ? String(window.SITE_CONFIG.whatsapp.number).replace(/\D/g, '') : '8801521417284';
    var waMsg = tr('হ্যালো, আমি ToolGhor-এ একটি নতুন টুলের অনুরোধ বা পরামর্শ দিতে চাই।', 'Hello, I would like to request or suggest a new tool on ToolGhor.');
    var waUrl = 'https://wa.me/' + waNum + '?text=' + encodeURIComponent(waMsg);

    var btnRow = UI.el('div', { class: 'req-modal-btns' },
      UI.el('a', {
        href: waUrl,
        target: '_blank',
        rel: 'noopener',
        class: 'req-btn req-btn-wa'
      }, UI.icon('whatsapp', 20), document.createTextNode(tr(' হোয়াটসঅ্যাপে মেসেজ পাঠান', ' Message on WhatsApp')))
    );

    var head = UI.el('div', { class: 'req-modal-head' },
      UI.el('div', { class: 'req-modal-title-row' },
        UI.el('h2', { class: 'req-modal-title' }, title),
        closeBtn
      ),
      UI.el('p', { class: 'req-modal-desc' }, desc)
    );

    box.appendChild(head);
    box.appendChild(btnRow);
    backdrop.appendChild(box);

    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) closeModal();
    });

    document.addEventListener('keydown', onKeyDown);
    document.body.appendChild(backdrop);
    requestAnimationFrame(function () {
      backdrop.classList.add('show');
    });
  };

  /* ============ About Modal ============ */
  UI.openAboutModal = function () {
    var existing = document.getElementById('about-modal');
    if (existing) existing.remove();

    var backdrop = UI.el('div', { class: 'about-modal-backdrop', id: 'about-modal', role: 'dialog', 'aria-modal': 'true' });
    var box = UI.el('div', { class: 'about-modal-box' });

    function closeModal() {
      backdrop.classList.remove('show');
      setTimeout(function () { backdrop.remove(); }, 220);
      document.removeEventListener('keydown', onKeyDown);
    }

    function onKeyDown(e) {
      if (e.key === 'Escape') closeModal();
    }

    var closeBtn = UI.el('button', {
      type: 'button',
      class: 'about-modal-close',
      'aria-label': tr('বন্ধ করুন', 'Close'),
      onclick: closeModal
    }, UI.icon('x', 18));

    var isBn = (UI.lang === 'bn');

    var badge = UI.el('div', { class: 'about-tagline-badge' },
      UI.el('span', { class: 'about-badge-spark', 'aria-hidden': 'true' }, '✨'),
      UI.el('span', {}, tr('সহজ টুলস • স্মার্ট দৈনন্দিন কাজ', 'Simple tools. Smarter everyday work.'))
    );

    var head = UI.el('div', { class: 'about-modal-head' },
      badge,
      closeBtn
    );

    var title = UI.el('h2', { class: 'about-hero-title' },
      document.createTextNode('ToolGhor'),
      UI.el('span', { class: 'about-hero-dot', 'aria-hidden': 'true' }, '.')
    );

    var desc = UI.el('p', { class: 'about-modal-desc' },
      tr(
        'ToolGhor নিয়ে এসেছে প্রয়োজনীয় সব অনলাইন টুলের একটি সমৃদ্ধ ও নির্ভরযোগ্য সংগ্রহ, যা আপনার দৈনন্দিন ডিজিটাল কাজগুলোকে আরও সহজ, দ্রুত ও স্বাচ্ছন্দ্যময় করে তোলার জন্য তৈরি।',
        'ToolGhor brings together a thoughtfully curated collection of useful online tools, designed to make everyday digital tasks simpler, faster, and more convenient.'
      )
    );

    var highlightsGrid = UI.el('div', { class: 'about-hl-grid' },
      UI.el('div', { class: 'about-hl-card' },
        UI.el('span', { class: 'about-hl-ic', 'aria-hidden': 'true' }, '⚡'),
        UI.el('div', { class: 'about-hl-body' },
          UI.el('strong', {}, tr('সহজ ব্যবহারের নিশ্চয়তা', 'Built for simplicity')),
          UI.el('small', {}, tr('ঝামেলাহীন ও সাবলীল ইন্টারফেস', 'Clean & distraction-free interface'))
        )
      ),
      UI.el('div', { class: 'about-hl-card' },
        UI.el('span', { class: 'about-hl-ic', 'aria-hidden': 'true' }, '🎯'),
        UI.el('div', { class: 'about-hl-body' },
          UI.el('strong', {}, tr('দৈনন্দিন কাজের উপযোগী', 'Designed for everyday use')),
          UI.el('small', {}, tr('মুহূর্তেই নির্ভুল ও দ্রুত সমাধান', 'Fast, reliable and daily-ready'))
        )
      )
    );

    var creatorCfg = (typeof window !== 'undefined' && window.CREATOR_CONFIG) || {};
    var isCreatorActive = creatorCfg.is_active !== false;

    var creatorName = creatorCfg.name || 'Ashifur Rahman';
    var creatorRole = (isBn ? creatorCfg.role_bn : creatorCfg.role_en) || tr('প্রতিষ্ঠাতা ও নির্মাতা, ToolGhor', 'Founder & Creator, ToolGhor');
    var creatorEmail = creatorCfg.email || 'ashifur.badhon@gmail.com';
    var creatorFb = creatorCfg.facebook_url || 'https://www.facebook.com/ashifurrahmanbadhon';
    var creatorGithub = creatorCfg.github_url || 'https://github.com/ashifurrahmanbadhon';

    var isEmailActive = creatorCfg.email_active !== false;
    var isSocialActive = creatorCfg.social_active !== false;

    var builtByLabel = UI.el('div', { class: 'about-section-label' },
      tr('তৈরি করেছেন', 'BUILT BY')
    );

    var root = UI.getRoot ? UI.getRoot() : (UI.ROOT || '');
    var creatorImg = UI.el('img', {
      src: root + 'assets/creator.jpg',
      alt: creatorName,
      class: 'about-creator-photo',
      loading: 'eager',
      onerror: function () {
        this.style.display = 'none';
        if (this.parentNode) this.parentNode.textContent = 'AR';
      }
    });

    var creatorProfile = UI.el('div', { class: 'about-creator-profile' },
      UI.el('div', { class: 'about-creator-avatar', 'aria-hidden': 'true' }, creatorImg),
      UI.el('div', { class: 'about-creator-info' },
        UI.el('h3', { class: 'about-creator-name' }, creatorName),
        UI.el('p', { class: 'about-creator-role' }, creatorRole)
      )
    );

    // Email direct button
    var emailLink = isEmailActive ? UI.el('a', {
      href: 'mailto:' + creatorEmail,
      class: 'about-contact-btn about-btn-email',
      title: tr('ইমেইল পাঠান', 'Send Email')
    },
      UI.el('span', {
        class: 'about-contact-ic',
        'aria-hidden': 'true',
        html: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>'
      }),
      UI.el('span', { class: 'about-contact-text' },
        UI.el('span', { class: 'about-contact-tag' }, tr('ইমেইল', 'Email')),
        UI.el('span', { class: 'about-contact-val' }, creatorEmail)
      ),
      UI.el('span', { class: 'about-contact-arrow', 'aria-hidden': 'true' }, '↗')
    ) : null;

    // Facebook direct button
    var fbLink = isSocialActive && creatorFb ? UI.el('a', {
      href: creatorFb,
      target: '_blank',
      rel: 'noopener noreferrer',
      class: 'about-contact-btn about-btn-fb',
      title: tr('ফেসবুক প্রোফাইল দেখুন', 'Visit Facebook Profile')
    },
      UI.el('span', {
        class: 'about-contact-ic',
        'aria-hidden': 'true',
        html: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>'
      }),
      UI.el('span', { class: 'about-contact-text' },
        UI.el('span', { class: 'about-contact-tag' }, tr('ফেসবুক', 'Facebook')),
        UI.el('span', { class: 'about-contact-val' }, tr('ফেসবুক প্রোফাইল দেখুন', 'Visit Facebook Profile'))
      ),
      UI.el('span', { class: 'about-contact-arrow', 'aria-hidden': 'true' }, '↗')
    ) : null;

    // GitHub direct button
    var githubLink = isSocialActive && creatorGithub ? UI.el('a', {
      href: creatorGithub,
      target: '_blank',
      rel: 'noopener noreferrer',
      class: 'about-contact-btn about-btn-github',
      title: tr('গিটহাব প্রোফাইল দেখুন', 'Visit GitHub Profile')
    },
      UI.el('span', {
        class: 'about-contact-ic',
        'aria-hidden': 'true',
        html: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>'
      }),
      UI.el('span', { class: 'about-contact-text' },
        UI.el('span', { class: 'about-contact-tag' }, tr('গিটহাব', 'GitHub')),
        UI.el('span', { class: 'about-contact-val' }, tr('গিটহাব প্রোফাইল দেখুন', 'Visit GitHub Profile'))
      ),
      UI.el('span', { class: 'about-contact-arrow', 'aria-hidden': 'true' }, '↗')
    ) : null;

    var contactItems = [];
    if (emailLink) contactItems.push(emailLink);
    if (fbLink) contactItems.push(fbLink);
    if (githubLink) contactItems.push(githubLink);

    var contactsWrap = contactItems.length ? UI.el.apply(UI, ['div', { class: 'about-contacts-wrap' }].concat(contactItems)) : null;

    var creatorCard = isCreatorActive ? UI.el('div', { class: 'about-creator-card' },
      creatorProfile,
      contactsWrap || UI.el('div')
    ) : null;

    var contentChildren = [
      title,
      desc,
      highlightsGrid
    ];
    if (isCreatorActive && creatorCard) {
      contentChildren.push(builtByLabel);
      contentChildren.push(creatorCard);
    }

    var content = UI.el.apply(UI, ['div', { class: 'about-modal-content' }].concat(contentChildren));

    box.appendChild(head);
    box.appendChild(content);
    backdrop.appendChild(box);

    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) closeModal();
    });

    document.addEventListener('keydown', onKeyDown);
    document.body.appendChild(backdrop);
    requestAnimationFrame(function () {
      backdrop.classList.add('show');
    });
  };

  UI.ensureTopHeaderButtons = function () {
    var topActions = document.querySelector('.top-actions');
    if (!topActions) return;

    var langEl = topActions.querySelector('.lang') || document.querySelector('.lang');
    if (langEl && !langEl.querySelector('.lang-ic')) {
      var ic = UI.el('span', { class: 'lang-ic', 'aria-hidden': 'true', title: tr('ভাষা পরিবর্তন', 'Switch Language') }, '🌐');
      langEl.insertBefore(ic, langEl.firstChild);
    }

    // About Button
    var aboutBtn = topActions.querySelector('.btn-top-about, #btn-top-about');
    if (!aboutBtn) {
      aboutBtn = UI.el('button', {
        type: 'button',
        class: 'btn-top-about',
        id: 'btn-top-about',
        'aria-label': tr('ToolGhor সম্পর্কে', 'About ToolGhor'),
        title: tr('ToolGhor সম্পর্কে', 'About ToolGhor')
      },
        UI.el('span', { class: 'btn-about-ic', 'aria-hidden': 'true' }, 'ℹ️'),
        UI.el('span', {}, tr('আমাদের সম্পর্কে', 'About'))
      );
      if (langEl && langEl.parentNode === topActions) {
        topActions.insertBefore(aboutBtn, langEl);
      } else {
        topActions.insertBefore(aboutBtn, topActions.firstChild);
      }
    } else {
      var aboutSpan = aboutBtn.querySelector('span:not(.btn-about-ic)');
      if (aboutSpan) aboutSpan.textContent = tr('আমাদের সম্পর্কে', 'About');
      aboutBtn.setAttribute('title', tr('ToolGhor সম্পর্কে', 'About ToolGhor'));
      aboutBtn.setAttribute('aria-label', tr('ToolGhor সম্পর্কে', 'About ToolGhor'));
    }

    // API Keys Button
    var apiBtn = topActions.querySelector('.btn-api-connect, #btn-ai-keys');
    if (apiBtn) {
      var apiSpan = apiBtn.querySelector('span:not(.btn-api-sparkle):not(.api-dot):not(.api-count):not(.ic)');
      if (apiSpan) apiSpan.textContent = tr('API কী', 'API Keys');
      apiBtn.setAttribute('title', tr('টুলসগুলোর আরও উন্নত ফলাফলের জন্য API কি কানেক্ট করুন', 'Connect API Keys for enhanced results'));
      apiBtn.setAttribute('aria-label', tr('API কি কানেক্ট করুন', 'Connect API Keys'));
    }

    // Request a Tool Button
    var reqBtn = topActions.querySelector('.btn-request-tool, #btn-request-tool');
    if (!reqBtn) {
      reqBtn = UI.el('button', {
        type: 'button',
        class: 'btn-request-tool',
        id: 'btn-request-tool',
        'aria-label': tr('টুলের অনুরোধ', 'Request a Tool'),
        title: tr('নতুন টুলের অনুরোধ বা আইডিয়া পাঠান', 'Request a new tool or suggest ideas')
      },
        UI.el('span', { class: 'btn-req-icon', 'aria-hidden': 'true' }, '🛠️'),
        UI.el('span', {}, tr('টুলের অনুরোধ', 'Request a Tool'))
      );
      topActions.appendChild(reqBtn);
    } else {
      var reqSpan = reqBtn.querySelector('span:not(.btn-req-icon)');
      if (reqSpan) reqSpan.textContent = tr('টুলের অনুরোধ', 'Request a Tool');
      reqBtn.setAttribute('title', tr('নতুন টুলের অনুরোধ বা আইডিয়া পাঠান', 'Request a new tool or suggest ideas'));
      reqBtn.setAttribute('aria-label', tr('টুলের অনুরোধ', 'Request a Tool'));
    }
  };

  /* গ্লোবাল ক্লিক ও ইনিশিয়ালাইজেশন */
  document.addEventListener('click', function (e) {
    var aboutBtn = e.target.closest && e.target.closest('.btn-top-about, #btn-top-about, [data-open-about]');
    if (aboutBtn) {
      e.preventDefault();
      UI.openAboutModal();
      return;
    }
    var btn = e.target.closest && e.target.closest('.btn-api-connect, #btn-ai-keys, [data-open-ai-keys]');
    if (btn) {
      e.preventDefault();
      UI.openAiKeysModal();
      return;
    }
    var reqBtn = e.target.closest && e.target.closest('.btn-request-tool, #btn-request-tool, [data-open-request-tool]');
    if (reqBtn) {
      e.preventDefault();
      UI.openRequestToolModal();
      return;
    }
  });

  function initHeader() {
    UI.ensureTopHeaderButtons();
    UI.updateHeaderApiBadge();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeader);
  } else {
    initHeader();
  }

  window.UI = UI;
  window.Tools = window.Tools || {};
})();
