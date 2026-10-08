/* কিউআর কোড টুলস */
(function () {
  var UI = window.UI, T = window.Tools, tr = UI.tr;

  function lum(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(hex); if (!m) return 0;
    var v = [0, 2, 4].map(function (i) { var c = parseInt(m[1].substr(i, 2), 16) / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  }
  function wifiEsc(s) { return String(s).replace(/([\\;,:"])/g, '\\$1'); }
  function waNumber(s) {
    var d = UI.toEn(s).replace(/\D/g, '');
    if (/^01\d{9}$/.test(d)) d = '88' + d;      // 01712345678 → 8801712345678
    return d;
  }

  /* ================= জেনারেটর ================= */
  T['qr-generator'] = function (root) {
    var type = 'text';
    var FORMS = {
      text: { label: tr('লিংক / লেখা', "Link / text"), fields: [{ k: 'v', label: tr('লিংক বা যেকোনো লেখা', "Link or any text"), kind: 'textarea', ph: 'https://example.com' }], build: function (v) { return v.v; } },
      wifi: {
        label: tr('ওয়াই-ফাই', "Wi-Fi"), fields: [{ k: 'ssid', label: tr('ওয়াই-ফাইয়ের নাম (SSID)', "Wi-Fi name (SSID)") }, { k: 'pass', label: tr('পাসওয়ার্ড', "Password") }, { k: 'sec', label: tr('সিকিউরিটি', "Security"), kind: 'select', opts: [['WPA', 'WPA/WPA2'], ['WEP', 'WEP'], ['nopass', tr('পাসওয়ার্ড নেই', "No password")]] }],
        build: function (v) { var sec = v.sec || 'WPA'; return v.ssid ? 'WIFI:T:' + sec + ';S:' + wifiEsc(v.ssid) + ';' + (sec === 'nopass' ? '' : 'P:' + wifiEsc(v.pass || '') + ';') + ';' : ''; }
      },
      wa: {
        label: tr('হোয়াটসঅ্যাপ', "WhatsApp"), fields: [{ k: 'num', label: tr('হোয়াটসঅ্যাপ নম্বর', "WhatsApp number"), ph: '01712345678', hint: tr('দেশ কোডসহও দিতে পারেন (8801712345678)', "You can also include the country code (8801712345678)") }, { k: 'msg', label: tr('আগে থেকে লেখা মেসেজ (ঐচ্ছিক)', "Pre-written message (optional)"), kind: 'textarea' }],
        build: function (v) { var n = waNumber(v.num || ''); return n ? 'https://wa.me/' + n + (v.msg ? '?text=' + encodeURIComponent(v.msg) : '') : ''; }
      },
      mail: {
        label: tr('ইমেইল', "Email"), fields: [{ k: 'to', label: tr('ইমেইল ঠিকানা', "Email address"), ph: 'name@example.com' }, { k: 'sub', label: tr('বিষয় (ঐচ্ছিক)', "Subject (optional)") }, { k: 'body', label: tr('মেসেজ (ঐচ্ছিক)', "Message (optional)"), kind: 'textarea' }],
        build: function (v) { if (!v.to) return ''; var q = []; if (v.sub) q.push('subject=' + encodeURIComponent(v.sub)); if (v.body) q.push('body=' + encodeURIComponent(v.body)); return 'mailto:' + v.to + (q.length ? '?' + q.join('&') : ''); }
      },
      tel: { label: tr('ফোন নম্বর', "Phone number"), fields: [{ k: 'num', label: tr('ফোন নম্বর', "Phone number"), ph: '01712345678' }], build: function (v) { return v.num ? 'tel:' + UI.toEn(v.num).replace(/\s/g, '') : ''; } }
    };
    var vals = {}, formBox = UI.el('div', { class: 'stack' }), preview = UI.el('div', { class: 'stack' });
    var size = UI.select([{ value: 256, label: tr('ছোট (২৫৬ px)', "Small (256 px)") }, { value: 512, label: tr('মাঝারি (৫১২ px)', "Medium (512 px)") }, { value: 1024, label: tr('বড় (১০২৪ px)', "Large (1024 px)") }, { value: 2048, label: tr('প্রিন্টের জন্য (২০৪৮ px)', "For print (2048 px)") }], 512, draw);
    var ecc = UI.select([{ value: 'L', label: tr('L – কম (বেশি তথ্য ধরে)', "L – Low (holds more data)") }, { value: 'M', label: tr('M – মাঝারি (প্রস্তাবিত)', "M – Medium (recommended)") }, { value: 'Q', label: tr('Q – ভালো', "Q – Good") }, { value: 'H', label: tr('H – সর্বোচ্চ (লোগো বসাতে)', "H – Highest (for adding a logo)") }], 'M', draw);
    var margin = UI.select([{ value: 0, label: tr('কোনো ফাঁকা নেই', "No border") }, { value: 2, label: tr('ছোট', "Small") }, { value: 4, label: tr('স্ট্যান্ডার্ড', "Standard") }, { value: 6, label: tr('বড়', "Large") }], 4, draw);
    var fg = UI.el('input', { type: 'color', value: '#000000' }), bg = UI.el('input', { type: 'color', value: '#ffffff' });
    fg.addEventListener('input', draw); bg.addEventListener('input', draw);
    var tabs = UI.seg(Object.keys(FORMS).map(function (k) { return { value: k, label: FORMS[k].label }; }), type, function (k) { type = k; vals = {}; buildForm(); draw(); });
    function buildForm() {
      UI.clear(formBox);
      FORMS[type].fields.forEach(function (f) {
        var c;
        if (f.kind === 'select') { c = UI.select(f.opts.map(function (o) { return { value: o[0], label: o[1] }; }), f.opts[0][0], function () { vals[f.k] = c.value; draw(); }); vals[f.k] = f.opts[0][0]; }
        else {
          c = f.kind === 'textarea' ? UI.el('textarea', { placeholder: f.ph || '' }) : UI.el('input', { type: 'text', placeholder: f.ph || '', autocomplete: 'off' });
          c.addEventListener('input', function () { vals[f.k] = c.value; drawD(); });
        }
        formBox.appendChild(UI.field(f.label, c, f.hint));
      });
    }
    var drawD = UI.debounce(draw, 150), last = null;
    function svgOf(q, m, fgc, bgc) {
      var n = q.getModuleCount(), t = n + 2 * m, d = [];
      for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.isDark(r, c)) d.push('M' + (c + m) + ' ' + (r + m) + 'h1v1h-1z');
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + t + ' ' + t + '" shape-rendering="crispEdges"><rect width="' + t + '" height="' + t + '" fill="' + bgc + '"/><path d="' + d.join('') + '" fill="' + fgc + '"/></svg>';
    }
    function draw() {
      UI.clear(preview); last = null;
      var text = FORMS[type].build(vals);
      if (!text || !String(text).trim()) { preview.appendChild(UI.notice('info', tr('তথ্য লিখলে কিউআর কোড এখানে তৈরি হবে।', "Enter the details and the QR code will appear here."))); return; }
      var q;
      try {
        qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
        q = qrcode(0, ecc.value); q.addData(text); q.make();
      } catch (e) { preview.appendChild(UI.notice('err', tr('লেখাটি এত বড় যে কিউআর কোডে ধরছে না। ছোট করুন বা ত্রুটি-সংশোধন "L" বেছে নিন।', "The text is too long to fit in a QR code. Shorten it or choose error correction \"L\"."))); return; }
      var n = q.getModuleCount(), m = +margin.value, total = n + 2 * m, cell = Math.max(1, Math.floor(+size.value / total));
      var c = UI.canvas(cell * total, cell * total), ctx = c.getContext('2d');
      ctx.fillStyle = bg.value; ctx.fillRect(0, 0, c.width, c.height); ctx.fillStyle = fg.value;
      for (var r = 0; r < n; r++) for (var k = 0; k < n; k++) if (q.isDark(r, k)) ctx.fillRect((k + m) * cell, (r + m) * cell, cell, cell);
      c.style.maxWidth = '300px'; c.style.width = '100%'; c.style.height = 'auto'; c.style.imageRendering = 'pixelated'; c.style.border = '1px solid var(--line)'; c.style.borderRadius = '8px'; c.setAttribute('aria-label', tr('তৈরি কিউআর কোড', "Generated QR code"));
      var contrast = (Math.max(lum(fg.value), lum(bg.value)) + 0.05) / (Math.min(lum(fg.value), lum(bg.value)) + 0.05);
      if (lum(fg.value) > lum(bg.value)) preview.appendChild(UI.notice('warn', tr('রং উল্টো (হালকা কোড, গাঢ় পেছন)। অনেক স্ক্যানার এটি পড়তে পারে না। গাঢ় কোড ও হালকা পেছন ব্যবহার করুন।', "The colours are inverted (light code, dark background). Many scanners cannot read this. Use a dark code on a light background.")));
      else if (contrast < 3) preview.appendChild(UI.notice('warn', tr('কোড ও পেছনের রঙের পার্থক্য কম, স্ক্যান নাও হতে পারে।', "The contrast between the code and background is low, so it may not scan.")));
      var base = 'qr-' + type;
      preview.appendChild(c);
      preview.appendChild(UI.el('div', { class: 'row' },
        UI.btn(tr('PNG ডাউনলোড', "Download PNG"), async function () { UI.download(await UI.toBlob(c, 'image/png'), 'ToolGhor(qr-generator).png'); }, { icon: 'download' }),
        UI.btn(tr('SVG ডাউনলোড', "Download SVG"), function () { UI.download(new Blob([svgOf(q, m, fg.value, bg.value)], { type: 'image/svg+xml' }), 'ToolGhor(qr-generator).svg'); }, { icon: 'download', cls: 'alt' })));
      preview.appendChild(UI.el('small', { class: 'lbl' }, tr('ডাউনলোডের আগে ফোনের ক্যামেরা দিয়ে একবার স্ক্যান করে দেখে নিন।', "Before downloading, scan it once with your phone camera to check.")));
    }
    // AI QR Assistant
    var qrAiBox = UI.renderAiBox({
      title: tr('এআই কিউআর কনটেন্ট সহকারী', 'AI QR Content Assistant'),
      subtitle: tr('প্রফেশনাল ডিজিটাল বিজনেস কার্ড (vCard), প্রচারমূলক বার্তা বা ইভেন্টের লেখা এআই দিয়ে তৈরি করুন', 'Draft professional business cards, promotional promos, or event invites with AI'),
      btnText: tr('✨ এআই কিউআর কনটেন্ট তৈরি করুন', '✨ Generate with AI'),
      onGenerate: async function () {
        var curType = type;
        var prompt = (UI.lang === 'bn')
          ? ('আমি কিউআর কোডের জন্য একটি পেশাদার ' + (curType === 'text' ? 'তথ্যমূলক বার্তা বা লিংক পরিচিতি' : curType) + ' তৈরি করতে চাই। অনুগ্রহ করে:\\n1. কিউআর কোডে স্ক্যান করার উপযোগী পরিষ্কার, সংক্ষিপ্ত ও আকর্ষণীয় টেক্সট লিখুন\\n2. একটি স্পষ্ট কল-টু-অ্যাকশন (CTA) যোগ করুন।\\nবাংলায় সরাসরি কপি করার উপযোগী করে দিন।')
          : ('I want to create an effective QR code payload for ' + curType + '. Please provide:\\n1. Concise, high-impact text or formatted vCard/message suitable for scanning\\n2. Clear call-to-action (CTA).\\nProvide clean, copyable text.');

        var res = await UI.callAI(prompt, {
          systemInstruction: (UI.lang === 'bn')
            ? 'আপনি একজন ডিজিটাল মার্কেটিং ও কিউআর কোড কনটেন্ট স্পেশালিস্ট।'
            : 'You are a digital marketing and QR content specialist.'
        });

        if (res && res.success && res.text) {
          return res.text;
        }

        // Offline fallback
        if (UI.lang === 'bn') {
          return '### 📱 কিউআর কোডের জন্য প্রস্তাবিত ফরম্যাট\\n\\n' +
            '**১. পেশাদার যোগাযোগের জন্য (vCard):**\\n' +
            '```\\nBEGIN:VCARD\\nVERSION:3.0\\nFN:আপনার পুরো নাম\\nORG:কোম্পানির নাম\\nTITLE:পদবী\\nTEL:017XXXXXXXX\\nEMAIL:contact@example.com\\nURL:https://yourwebsite.com\\nEND:VCARD\\n```\\n\\n' +
            '**২. ব্যবসায়িক প্রচার ও অফার মেসেজ:**\\n' +
            '- "🌟 আমাদের এক্সক্লুসিভ অফারে স্বাগতম! বিশেষ ১৫% ছাড়ের জন্য ভিজিট করুন: https://example.com/offer"\\n\\n' +
            '> 💡 *টিপস:* আপনার Google Gemini বা OpenAI API Key কানেক্ট করলে আপনার কাস্টম তথ্যের ওপর ভিত্তি করে লাইভ পারসোনালাইজড কনটেন্ট জেনারেট হবে।';
        } else {
          return '### 📱 Recommended Formats for QR Codes\\n\\n' +
            '**1. Professional Contact Card (vCard):**\\n' +
            '```\\nBEGIN:VCARD\\nVERSION:3.0\\nFN:Your Full Name\\nORG:Company Name\\nTITLE:Job Title\\nTEL:+88017XXXXXXXX\\nEMAIL:contact@example.com\\nURL:https://example.com\\nEND:VCARD\\n```\\n\\n' +
            '**2. Promotional / Discount Message:**\\n' +
            '- "Welcome to our special promotion! Enjoy a 15% discount today at https://example.com/promo"\\n\\n' +
            '> 💡 *Tip:* Connect your Google Gemini or OpenAI API Key for live tailored content generation based on your exact details.';
        }
      }
    });

    buildForm(); draw();
    root.appendChild(UI.el('div', { class: 'stack' },
      UI.el('div', { class: 'two' },
        UI.el('div', { class: 'stack' }, UI.el('span', { class: 'lbl' }, tr('কিসের কিউআর?', "What is the QR code for?")), tabs, formBox,
          UI.el('div', { class: 'row' }, UI.field(tr('সাইজ', "Size"), size), UI.field(tr('ত্রুটি-সংশোধন', "Error correction"), ecc), UI.field(tr('চারপাশে ফাঁকা', "Border around code"), margin)),
          UI.el('div', { class: 'row' }, UI.field(tr('কোডের রং', "Code colour"), fg, null, 'fit'), UI.field(tr('পেছনের রং', "Background colour"), bg, null, 'fit'))),
        UI.el('div', {}, preview)),
      qrAiBox.el));
  };

  /* ================= ডিকোডার ================= */
  function parseWifi(s) {
    var out = {}, re = /([A-Z]):((?:\\.|[^;])*);/g, m, body = s.slice(5);
    while ((m = re.exec(body))) out[m[1]] = m[2].replace(/\\(.)/g, '$1');
    return out;
  }
  T['qr-decoder'] = function (root) {
    var out = UI.el('div'), stage = UI.el('div'), camBox = UI.el('div'), stream = null, raf = 0;
    function scan(src, w, h) {
      var sizes = [1600, 1000, 600];
      for (var i = 0; i < sizes.length; i++) {
        var s = Math.min(1, sizes[i] / Math.max(w, h)), cw = Math.max(1, Math.round(w * s)), ch = Math.max(1, Math.round(h * s));
        var c = UI.canvas(cw, ch), ctx = c.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(src, 0, 0, cw, ch);
        var d = ctx.getImageData(0, 0, cw, ch), code = jsQR(d.data, cw, ch, { inversionAttempts: 'attemptBoth' });
        if (code && code.data) return code.data;
        if (s === 1) { /* ছোট ছবির জন্য পরের স্কেলের দরকার নেই */ if (Math.max(w, h) <= 600) break; }
      }
      return null;
    }
    function show(text) {
      UI.clear(out);
      var box = UI.el('div', { class: 'result stack' }, UI.notice('ok', tr('✓ কিউআর কোড পড়া হয়েছে', "✓ QR code read")));
      var ta = UI.el('textarea', { readonly: true, rows: '4' }); ta.value = text; box.appendChild(ta);
      var row = UI.el('div', { class: 'row' }, UI.btn(tr('কপি করুন', "Copy"), function () { UI.copy(text); }, { icon: 'copy' }));
      if (/^https?:\/\//i.test(text)) {
        row.appendChild(UI.el('a', { class: 'btn alt', href: text, target: '_blank', rel: 'noopener noreferrer' }, UI.icon('external-link', 18), tr('লিংক খুলুন', "Open link")));
        box.appendChild(UI.notice('warn', tr('অচেনা কিউআর কোডের লিংক খোলার আগে ঠিকানাটি ভালো করে দেখে নিন।', "Before opening a link from an unknown QR code, check the address carefully.")));
      }
      if (/^WIFI:/i.test(text)) {
        var w = parseWifi(text);
        box.appendChild(UI.notice('info', tr('ওয়াই-ফাই: নাম "', "Wi-Fi: name \"") + (w.S || '') + '"' + (w.P ? tr(', পাসওয়ার্ড "', ", password \"") + w.P + '"' : tr(', পাসওয়ার্ড নেই', ", no password"))));
        if (w.P) row.appendChild(UI.btn(tr('পাসওয়ার্ড কপি', "Copy password"), function () { UI.copy(w.P); }, { cls: 'alt', icon: 'copy' }));
      }
      // AI QR Content Analyzer Card
      var qrDecAiBox = UI.renderAiBox({
        title: tr('এআই কনটেন্ট ও নিরাপত্তা বিশ্লেষণ', 'AI Content & Security Analysis'),
        subtitle: tr('স্ক্যান করা লেখার ধরণ, লিংকের সত্যতা ও নিরাপত্তা ঝুঁকি এআই দিয়ে যাচাই করুন', 'Analyze scanned QR payload, classify content, and audit URL safety'),
        btnText: tr('✨ এআই বিশ্লেষণ ও নিরাপত্তা অডিট', '✨ Analyze Content with AI'),
        onGenerate: async function () {
          var prompt = (UI.lang === 'bn')
            ? ('স্ক্যান করা কিউআর কোড কনটেন্ট:\n"' + text + '"\n\nঅনুগ্রহ করে:\n1. কনটেন্টের ধরণ ও সংক্ষিপ্ত সারসংক্ষেপ\n2. সাইবার নিরাপত্তা ও ফিশিং/ম্যালওয়্যার ঝুঁকি মূল্যায়ন\n3. ব্যবহারকারীর জন্য পরবর্তী সতর্কতামূলক পদক্ষেপ\nবাংলায় স্পষ্ট বুলেট পয়েন্টে দিন।')
            : ('Scanned QR Code Content:\n"' + text + '"\n\nPlease provide:\n1. Content classification and summary\n2. Cyber security & phishing/malware risk assessment\n3. Actionable recommendations for the user.\nFormat clearly in bullet points.');

          var res = await UI.callAI(prompt, {
            systemInstruction: (UI.lang === 'bn')
              ? 'আপনি একজন সাইবার সিকিউরিটি ও ডাটা অ্যানালিস্ট।'
              : 'You are a cybersecurity expert and digital data analyst.'
          });

          if (res && res.success && res.text) {
            return res.text;
          }

          // Offline fallback
          var isUrl = /^https?:\/\//i.test(text);
          var isWifi = /^WIFI:/i.test(text);
          if (UI.lang === 'bn') {
            return '### 🛡️ নিরাপত্তা ও কনটেন্ট অডিট\n\n' +
              '**১. কনটেন্ট ধরণ:** ' + (isUrl ? '🌐 ওয়েব লিংক (URL)' : (isWifi ? '📶 ওয়াই-ফাই নেটওয়ার্ক তথ্য' : '📝 সাধারণ টেক্সট / ডেটা')) + '\n\n' +
              '**২. নিরাপত্তা সতর্কতা:**\n' +
              (isUrl ? '- অজানা লিংকে প্রবেশের সময় ইউজারনেম, পাসওয়ার্ড বা ওটিপি (OTP) দেবেন না।\n- ডোমেইন নাম সতর্কভাবে যাচাই করুন।' : '- সাধারণ টেক্সট ডেটা সরাসরি কোনো ঝুঁকি তৈরি করে না।') + '\n\n' +
              '> 💡 *টিপস:* আপনার Google Gemini বা OpenAI API Key কানেক্ট করলে রিয়েল-টাইম ডিপ থ্রেট ডিটেকশন ও কনটেন্ট সামারি পাওয়া যাবে।';
          } else {
            return '### 🛡️ Content & Security Audit\n\n' +
              '**1. Classification:** ' + (isUrl ? '🌐 Web Link (URL)' : (isWifi ? '📶 Wi-Fi Credentials' : '📝 Plain Text Data')) + '\n\n' +
              '**2. Security Advisory:**\n' +
              (isUrl ? '- Never provide passwords, OTPs, or credit card info on unrecognized links.\n- Verify domain authenticity before proceeding.' : '- Plain text payloads do not execute executable code.') + '\n\n' +
              '> 💡 *Tip:* Connect your Google Gemini or OpenAI API Key for deep real-time threat analysis and automated content summaries.';
          }
        }
      });
      box.appendChild(qrDecAiBox.el);
      box.appendChild(row); out.appendChild(box);
    }
    function fail() { UI.clear(out); out.appendChild(UI.notice('err', tr('কিউআর কোড খুঁজে পাওয়া যায়নি। কোডটি পরিষ্কার, পুরোটা দেখা যায় এমন ছবি দিন।', "No QR code found. Use a clear picture where the whole code is visible."))); }
    async function fromFile(f) {
      UI.clear(out); UI.clear(stage); stopCam();
      try {
        var img = await UI.readImage(f);
        stage.appendChild(UI.el('img', { src: img._url, alt: tr('আপলোড করা ছবি', "Uploaded image"), style: { maxWidth: '260px', maxHeight: '260px', borderRadius: '8px', border: '1px solid var(--line)' } }));
        var t = scan(img, img.naturalWidth, img.naturalHeight);
        if (t) show(t); else fail();
      } catch (e) { out.appendChild(UI.notice('err', UI.err(e))); }
    }
    var pasteH = function (e) {
      var items = (e.clipboardData && e.clipboardData.files) || [];
      if (items.length && /^image\//.test(items[0].type)) fromFile(items[0]);
    };
    document.addEventListener('paste', pasteH);
    var drop = UI.dropzone({ accept: 'image/*', label: tr('কিউআর কোডের ছবি বেছে নিন', "Choose a QR code image"), hint: tr('টেনে আনুন, অথবা স্ক্রিনশট কপি করে এখানে পেস্ট (Ctrl+V) করুন', "Drag it here, or copy a screenshot and paste (Ctrl+V)"), onFiles: function (fs) { fromFile(fs[0]); } });

    function stopCam() { if (raf) cancelAnimationFrame(raf); raf = 0; if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; } UI.clear(camBox); camBox.appendChild(camBtn); }
    var camBtn = UI.btn(tr('ক্যামেরা দিয়ে স্ক্যান করুন', "Scan with camera"), async function () {
      UI.clear(out); UI.clear(stage);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { out.appendChild(UI.notice('err', tr('এই ব্রাউজারে ক্যামেরা পাওয়া যাচ্ছে না। (ক্যামেরার জন্য সাইটটি https:// ঠিকানায় খুলতে হবে।)', "No camera is available in this browser. (To use the camera, open the site on an https:// address.)"))); return; }
      try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false }); }
      catch (e) { out.appendChild(UI.notice('err', tr('ক্যামেরা চালু করা যায়নি। ব্রাউজারে ক্যামেরার অনুমতি দিন।', "Could not start the camera. Please allow camera access in your browser."))); return; }
      var v = UI.el('video', { playsinline: true, muted: true, autoplay: true, style: { maxWidth: '100%', maxHeight: '60vh', borderRadius: '10px', background: '#000' } });
      v.muted = true; v.srcObject = stream;
      UI.clear(camBox); camBox.appendChild(v); camBox.appendChild(UI.el('div', { class: 'row', style: { marginTop: '10px' } }, UI.btn(tr('ক্যামেরা বন্ধ করুন', "Stop camera"), stopCam, { cls: 'alt' })));
      var cvs = UI.canvas(8, 8), ctx = cvs.getContext('2d', { willReadFrequently: true }), tick = 0;
      (function loop() {
        raf = requestAnimationFrame(loop);
        if (++tick % 4 || v.readyState < 2 || !v.videoWidth) return;
        var s = Math.min(1, 720 / Math.max(v.videoWidth, v.videoHeight)); cvs.width = Math.round(v.videoWidth * s); cvs.height = Math.round(v.videoHeight * s);
        ctx.drawImage(v, 0, 0, cvs.width, cvs.height);
        var d = ctx.getImageData(0, 0, cvs.width, cvs.height), code = jsQR(d.data, cvs.width, cvs.height, { inversionAttempts: 'dontInvert' });
        if (code && code.data) { stopCam(); show(code.data); }
      })();
    }, { icon: 'camera', cls: 'alt' });
    camBox.appendChild(camBtn);
    root.appendChild(UI.el('div', { class: 'stack' }, drop, UI.el('div', {}, UI.el('span', { class: 'lbl' }, tr('অথবা ', "or ")), camBox), stage, out));
  };
})();
