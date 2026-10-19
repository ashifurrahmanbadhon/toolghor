/* ইমেজ টুলস */
(function () {
  var UI = window.UI, T = window.Tools, tr = UI.tr;
  var MIME = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

  function drawToCanvas(img, w, h, bg) {
    var c = UI.canvas(w, h), ctx = c.getContext('2d');
    if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, c.width, c.height); }
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return c;
  }
  /* কোয়ালিটি বদলে বদলে টার্গেট সাইজের মধ্যে আনা */
  async function fitToTarget(src, mime, target) {
    var cur = src, best = null, s = 1;
    for (var step = 0; step < 9; step++) {
      var lo = 0.08, hi = 0.95, found = null, last = null;
      for (var i = 0; i < 7; i++) {
        var mid = (lo + hi) / 2, b = await UI.toBlob(cur, mime, mid);
        last = b;
        if (b.size <= target) { found = b; lo = mid; } else hi = mid;
      }
      if (found) return { blob: found, w: cur.width, h: cur.height };
      best = { blob: last, w: cur.width, h: cur.height };
      s *= 0.85;
      var nc = UI.canvas(src.width * s, src.height * s);
      var nctx = nc.getContext('2d'); nctx.imageSmoothingQuality = 'high'; nctx.drawImage(src, 0, 0, nc.width, nc.height);
      cur = nc;
    }
    return best;
  }
  function padJpegExact(u8, targetBytes) {
    if (u8.length >= targetBytes) return u8;
    if (u8[0] !== 0xFF || u8[1] !== 0xD8) {
      var out = new Uint8Array(targetBytes);
      out.set(u8, 0);
      return out;
    }
    var eoi = u8.length - 2;
    while (eoi > 0 && !(u8[eoi] === 0xFF && u8[eoi + 1] === 0xD9)) eoi--;
    if (eoi <= 0) eoi = u8.length;

    var diff = targetBytes - u8.length;
    if (diff < 4) {
      var out = new Uint8Array(targetBytes);
      out.set(u8, 0);
      return out;
    }

    var out = new Uint8Array(targetBytes);
    out.set(u8.subarray(0, eoi), 0);
    var pos = eoi;
    var remaining = diff;

    while (remaining >= 4) {
      var chunkLen = Math.min(65535, remaining);
      if (remaining - chunkLen > 0 && remaining - chunkLen < 4) {
        chunkLen -= 4;
      }
      var payloadLen = chunkLen - 4;
      out[pos++] = 0xFF;
      out[pos++] = 0xFE; // COM marker
      out[pos++] = (chunkLen >> 8) & 0xFF;
      out[pos++] = chunkLen & 0xFF;
      out.fill(0x20, pos, pos + payloadLen);
      pos += payloadLen;
      remaining -= chunkLen;
    }

    out.set(u8.subarray(eoi), pos);
    return out;
  }

  function padGenericExact(u8, targetBytes) {
    if (u8.length >= targetBytes) return u8;
    var out = new Uint8Array(targetBytes);
    out.set(u8, 0);
    return out;
  }

  /* টার্গেট সাইজ অনুযায়ী কোয়ালিটি বাইনারি সার্চ (১-১০০, সর্বোচ্চ ১২ বার) ও প্রয়োজনে সাইজ ০.৯ গুণ ছোট করা */
  async function fitToTargetSize(srcCanvas, mime, targetBytes) {
    var curCanvas = srcCanvas;
    var maxSteps = 20;
    var lastBlob = null;
    for (var step = 0; step < maxSteps; step++) {
      var q1Blob = await UI.toBlob(curCanvas, mime, 0.01);
      lastBlob = q1Blob;
      if (q1Blob && q1Blob.size <= targetBytes) {
        var lo = 1, hi = 100, best = q1Blob;
        for (var iter = 0; iter < 12; iter++) {
          var mid = Math.round((lo + hi) / 2);
          var b = await UI.toBlob(curCanvas, mime, mid / 100);
          if (b && b.size <= targetBytes) {
            best = b;
            lo = mid + 1;
          } else {
            hi = mid - 1;
          }
          if (lo > hi) break;
        }
        return { blob: best, w: curCanvas.width, h: curCanvas.height };
      }
      var nw = Math.max(1, Math.round(curCanvas.width * 0.9));
      var nh = Math.max(1, Math.round(curCanvas.height * 0.9));
      if (nw < 10 || nh < 10 || nw === curCanvas.width || nh === curCanvas.height) {
        break;
      }
      var nc = UI.canvas(nw, nh);
      var nctx = nc.getContext('2d');
      if (mime === 'image/jpeg') {
        nctx.fillStyle = '#fff';
        nctx.fillRect(0, 0, nw, nh);
      }
      nctx.imageSmoothingQuality = 'high';
      nctx.drawImage(curCanvas, 0, 0, nw, nh);
      curCanvas = nc;
    }
    return { blob: lastBlob, w: curCanvas.width, h: curCanvas.height };
  }
  function typeFor(file, choice) {
    if (choice === 'orig') {
      if (file.type === 'image/png') return 'png';
      if (file.type === 'image/webp') return 'webp';
      return 'jpg';
    }
    return choice;
  }
  function outName(file, ext, idx, total) {
    var tool = (document.body && document.body.getAttribute('data-tool')) || 'compress-image';
    if (total && total > 1 && typeof idx === 'number') {
      return 'ToolGhor(' + tool + '-' + (idx + 1) + ').' + ext;
    }
    return 'ToolGhor(' + tool + ').' + ext;
  }

  /* ফলাফলের টেবিল (কমপ্রেস/কনভার্ট) */
  function resultTable(rows, zipName) {
    var tbody = UI.el('tbody');
    rows.forEach(function (r) {
      if (typeof UI.formatDownloadName === 'function') r.name = UI.formatDownloadName(r.name);
      tbody.appendChild(UI.el('tr', {},
        UI.el('td', {}, UI.el('img', { class: 'thumb', src: r.url, alt: '' })),
        UI.el('td', { style: { overflowWrap: 'anywhere' } }, r.name),
        UI.el('td', {}, UI.fmtSize(r.before)),
        UI.el('td', {}, UI.fmtSize(r.blob.size) + (r.note ? ' ' : ''), r.note ? UI.el('small', { class: 'lbl' }, r.note) : null),
        UI.el('td', {}, UI.btn('', function () { UI.download(r.blob, r.name); }, { cls: 'sm', icon: 'download', iconSize: 16 }))));
    });
    var wrap = UI.el('div', { class: 'stack' },
      UI.el('div', { class: 'tbl-wrap' }, UI.el('table', { class: 'tbl' },
        UI.el('thead', {}, UI.el('tr', {}, UI.el('th', {}, ''), UI.el('th', {}, tr('ফাইল', "File")), UI.el('th', {}, tr('আগে', "Before")), UI.el('th', {}, tr('পরে', "After")), UI.el('th', {}, ''))), tbody)));
    if (rows.length > 1) wrap.appendChild(UI.btn(tr('সবগুলো ZIP হিসেবে ডাউনলোড', "Download all as ZIP"), async function () {
      var finalZipName = (typeof UI.formatDownloadName === 'function') ? UI.formatDownloadName(zipName) : zipName;
      UI.download(await UI.zip(rows.map(function (r) { return { name: r.name, blob: r.blob }; })), finalZipName);
    }, { icon: 'file-archive' }));
    return wrap;
  }

  /* ---------------- কমপ্রেস ---------------- */
  T['compress-image'] = function (root) {
    var files = [], out = UI.el('div'), listBox = UI.el('div');
    var q = UI.el('input', { type: 'range', min: '30', max: '95', value: '70' });
    var qv = UI.el('strong', {}, UI.n(70) + '%');
    q.addEventListener('input', function () { qv.textContent = UI.n(q.value) + '%'; });
    var maxw = UI.select([{ value: 0, label: tr('মূল মাপ', "Original size") }, { value: 3840, label: tr('৩৮৪০ px পর্যন্ত', "Up to 3840 px") }, { value: 2560, label: tr('২৫৬০ px পর্যন্ত', "Up to 2560 px") }, { value: 1920, label: tr('১৯২০ px পর্যন্ত', "Up to 1920 px") }, { value: 1280, label: tr('১২৮০ px পর্যন্ত', "Up to 1280 px") }, { value: 800, label: tr('৮০০ px পর্যন্ত', "Up to 800 px") }], 0);
    var fmt = UI.select([{ value: 'jpg', label: tr('JPG (সবচেয়ে ভালো কমপ্রেস)', "JPG (best compression)") }, { value: 'webp', label: 'WebP' }, { value: 'orig', label: tr('মূল ফরম্যাট', "Original format") }], 'jpg');
    var target = UI.el('input', { type: 'text', inputmode: 'numeric', placeholder: tr('যেমন: 100', "e.g. 100") });
    var go = UI.btn(tr('কমপ্রেস করুন', "Compress"), run, { icon: 'minimize-2', disabled: true });
    function showList() { UI.clear(listBox); files.forEach(function (f) { listBox.appendChild(UI.el('div', {}, f.name + ' · ' + UI.fmtSize(f.size))); }); go.disabled = !files.length; }
    var drop = UI.dropzone({
      accept: 'image/*',
      multiple: true,
      onFiles: function (fs) { files = fs; UI.clear(out); showList(); }
    });
    async function run() {
      UI.clear(out); var prog = UI.progress(); out.appendChild(prog); go.disabled = true;
      var activeFiles = files.slice();
      var dropInputs = drop.querySelectorAll('input');
      dropInputs.forEach(function (inp) { inp.disabled = true; });
      var rows = [];
      try {
        var tkb = UI.parseNum(target.value), tbytes = tkb > 0 ? tkb * 1024 : 0;
        for (var i = 0; i < activeFiles.length; i++) {
          prog.set(i / activeFiles.length * 100, UI.n(i + 1) + '/' + UI.n(activeFiles.length));
          await UI.yield();
          var f = activeFiles[i], img = await UI.readImage(f), w = img.naturalWidth, h = img.naturalHeight, mw = +maxw.value;
          if (mw && w > mw) { h = h * mw / w; w = mw; }
          var ext = typeFor(f, fmt.value), mime = MIME[ext];
          var c = drawToCanvas(img, w, h, ext === 'jpg' ? '#fff' : null), blob, note = '';
          if (tbytes && ext !== 'png') {
            var r = await fitToTarget(c, mime, tbytes); blob = r.blob;
            if (blob.size > tbytes) note = tr('(টার্গেটে পৌঁছানো যায়নি)', "(could not reach the target)"); else if (r.w !== c.width) note = '(' + UI.n(r.w) + '×' + UI.n(r.h) + ' px)';
          } else {
            blob = await UI.toBlob(c, mime, +q.value / 100);
            if (ext === 'png') {
              if (tbytes) {
                note = tr('(PNG ফরম্যাটে টার্গেট KB প্রযোজ্য নয়; সাইজ কমাতে JPG বা WebP বেছে নিন)', "(Target KB does not apply to lossless PNG; select JPG or WebP to reach target size)");
              } else {
                note = tr('(PNG-তে মান স্লাইডার কাজ করে না; JPG/WebP বেছে নিন)', "(the quality slider does not work on PNG; choose JPG/WebP)");
              }
            }
          }
          rows.push({ name: outName(f, ext, i, activeFiles.length), before: f.size, blob: blob, url: URL.createObjectURL(blob), note: note });
          URL.revokeObjectURL(img._url);
        }
        UI.clear(out);
        out.appendChild(UI.el('div', { class: 'result stack' }, UI.notice('ok', tr('✓ কমপ্রেস শেষ।', "✓ Compression finished.")), resultTable(rows, 'ToolGhor(compress-image).zip')));
      } catch (e) { UI.clear(out); out.appendChild(UI.notice('err', UI.err(e))); }
      finally {
        dropInputs.forEach(function (inp) { inp.disabled = false; });
        go.disabled = !files.length;
      }
    }
    root.appendChild(UI.el('div', { class: 'stack' }, drop, listBox,
      UI.el('div', { class: 'row' },
        UI.field(tr('মান', "Quality"), UI.el('div', {}, q), null),
        UI.field(tr('সর্বোচ্চ প্রস্থ', "Maximum width"), maxw), UI.field(tr('আউটপুট ফরম্যাট', "Output format"), fmt)),
      UI.el('div', { class: 'row' },
        UI.field(tr('টার্গেট সাইজ (KB), ঐচ্ছিক', "Target size (KB), optional"), target, tr('দিলে স্লাইডারের বদলে এই সাইজের মধ্যে আনার চেষ্টা করবে। যেমন ১০০ KB।', "If you enter a value, it tries to fit this size instead of using the slider. For example 100 KB.")),
        UI.el('div', { class: 'field fit' }, UI.el('span', { class: 'lbl' }, tr('বর্তমান মান: ', "Current quality: ")), qv)),
      go, out));
  };

  /* ---------------- রিসাইজ ---------------- */
  T['resize-image'] = function (root) {
    var img = null, ow = 0, oh = 0, file = null, out = UI.el('div'), info = UI.el('div');
    var wIn = UI.el('input', { type: 'number', min: '1', inputmode: 'numeric' });
    var hIn = UI.el('input', { type: 'number', min: '1', inputmode: 'numeric' });
    var lock = UI.el('input', { type: 'checkbox', checked: true });
    var fitSel = UI.select([{ value: 'cover', label: tr('ছবি না বিকৃত করে কেটে মেলান (Cover)', "Keep the picture undistorted by cropping (Cover)") }, { value: 'stretch', label: tr('টেনে মেলান (বিকৃত হতে পারে)', "Stretch to fit (may distort)") }], 'cover');
    var fitField = UI.field(tr('অনুপাত না মিললে', "If the ratio does not match"), fitSel);
    var fmt = UI.select([{ value: 'orig', label: tr('মূল ফরম্যাট', "Original format") }, { value: 'jpg', label: 'JPG' }, { value: 'png', label: 'PNG' }, { value: 'webp', label: 'WebP' }], 'orig');
    var go = UI.btn(tr('মাপ বদলান', "Resize"), run, { icon: 'scaling', disabled: true });
    function sync() { fitField.hidden = lock.checked; }
    lock.addEventListener('change', sync); sync();
    wIn.addEventListener('input', function () { if (lock.checked && ow && wIn.value) hIn.value = Math.max(1, Math.round(UI.parseNum(wIn.value) * oh / ow)); });
    hIn.addEventListener('input', function () { if (lock.checked && oh && hIn.value) wIn.value = Math.max(1, Math.round(UI.parseNum(hIn.value) * ow / oh)); });
    function setSize(w, h, unlock) { wIn.value = w; hIn.value = h; if (unlock) { lock.checked = false; sync(); } }
    var presets = UI.el('div', { class: 'seg' });
    [[tr('৫০%', "50%"), function () { setSize(Math.round(ow / 2), Math.round(oh / 2)); }], [tr('৭৫%', "75%"), function () { setSize(Math.round(ow * .75), Math.round(oh * .75)); }], [tr('২৫%', "25%"), function () { setSize(Math.round(ow / 4), Math.round(oh / 4)); }],
    [tr('ছবি ৩০০×৩০০', "Photo 300×300"), function () { setSize(300, 300, true); }], [tr('স্বাক্ষর ৩০০×৮০', "Signature 300×80"), function () { setSize(300, 80, true); }],
    [tr('ইনস্টাগ্রাম ১০৮০×১০৮০', "Instagram 1080×1080"), function () { setSize(1080, 1080, true); }], [tr('ফেসবুক শেয়ার ১২০০×৬৩০', "Facebook share 1200×630"), function () { setSize(1200, 630, true); }]].forEach(function (p) {
      presets.appendChild(UI.el('button', { type: 'button', onclick: function () { if (img) p[1](); else UI.toast(tr('আগে একটি ছবি বেছে নিন', "Choose an image first")); } }, p[0]));
    });
    var drop = UI.dropzone({
      accept: 'image/*',
      onFiles: async function (fs) {
        UI.clear(out); UI.clear(info); file = fs[0];
        try { img = await UI.readImage(file); } catch (e) { info.appendChild(UI.notice('err', UI.err(e))); return; }
        ow = img.naturalWidth; oh = img.naturalHeight; wIn.value = ow; hIn.value = oh; go.disabled = false;
        info.appendChild(UI.notice('info', file.name + ' · ' + UI.n(ow) + '×' + UI.n(oh) + ' px · ' + UI.fmtSize(file.size)));
      }
    });
    var logoCheck = UI.el('input', { type: 'checkbox' });
    var logoFile = null, logoImg = null;
    var logoInput = UI.el('input', { type: 'file', accept: 'image/*', style: { display: 'none' } });
    var logoPickBtn = UI.btn(tr('লোগো বেছে নিন', "Choose logo"), function () { logoInput.click(); }, { cls: 'sm', icon: 'image' });
    var logoName = UI.el('small', { class: 'lbl' }, tr('কোনো লোগো নির্বাচন করা হয়নি', "No logo selected"));
    logoInput.addEventListener('change', async function () {
      if (logoInput.files && logoInput.files[0]) {
        logoFile = logoInput.files[0];
        try {
          logoImg = await UI.readImage(logoFile);
          logoName.textContent = '✓ ' + logoFile.name;
        } catch (e) {
          UI.toast(tr('লোগো লোড করা যায়নি', "Failed to load logo"));
        }
      }
    });
    var logoPos = UI.select([
      { value: 'bottom-right', label: tr('নিচে ডানে', "Bottom Right") },
      { value: 'bottom-left', label: tr('নিচে বামে', "Bottom Left") },
      { value: 'top-right', label: tr('উপরে ডানে', "Top Right") },
      { value: 'top-left', label: tr('উপরে বামে', "Top Left") },
      { value: 'center', label: tr('মাঝখানে', "Center") }
    ], 'bottom-right');
    var logoOpacity = UI.el('input', { type: 'range', min: '10', max: '100', value: '90' });
    var logoBox = UI.el('div', { class: 'stack', style: { padding: '12px', border: '1px dashed var(--bdr)', borderRadius: '8px', background: 'var(--bg-card)' } },
      logoInput,
      UI.el('div', { class: 'row', style: { alignItems: 'center', gap: '10px' } }, logoPickBtn, logoName),
      UI.el('div', { class: 'row' },
        UI.field(tr('লোগোর অবস্থান', "Logo position"), logoPos),
        UI.field(tr('স্বচ্ছতা (Opacity %)', "Opacity %"), logoOpacity)
      )
    );
    logoBox.hidden = true;
    logoCheck.addEventListener('change', function () {
      logoBox.hidden = !logoCheck.checked;
    });

    async function run() {
      UI.clear(out);
      try {
        var w = Math.round(UI.parseNum(wIn.value)), h = Math.round(UI.parseNum(hIn.value));
        if (!(w > 0 && h > 0)) throw new Error(tr('প্রস্থ ও উচ্চতা সঠিকভাবে লিখুন।', "Enter the width and height correctly."));
        if (w * h > 120e6) throw new Error(tr('এত বড় মাপ ব্রাউজারে বানানো যাবে না। ছোট মাপ দিন।', "That size is too large for the browser. Enter a smaller size."));
        var ext = typeFor(file, fmt.value), mime = MIME[ext];
        var c = UI.canvas(w, h), ctx = c.getContext('2d');
        if (ext === 'jpg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); }
        ctx.imageSmoothingQuality = 'high';
        if (lock.checked || fitSel.value === 'stretch') ctx.drawImage(img, 0, 0, w, h);
        else {
          var s = Math.max(w / ow, h / oh), sw = w / s, sh = h / s;
          ctx.drawImage(img, (ow - sw) / 2, (oh - sh) / 2, sw, sh, 0, 0, w, h);
        }
        if (logoCheck.checked && logoImg) {
          var pad = Math.max(12, Math.round(Math.min(w, h) * 0.03));
          var maxLw = w * 0.28, maxLh = h * 0.28;
          var scale = Math.min(maxLw / logoImg.naturalWidth, maxLh / logoImg.naturalHeight, 1);
          var lw = Math.round(logoImg.naturalWidth * scale), lh = Math.round(logoImg.naturalHeight * scale);
          var lx = w - lw - pad, ly = h - lh - pad;
          var pos = logoPos.value;
          if (pos === 'bottom-left') { lx = pad; ly = h - lh - pad; }
          else if (pos === 'top-right') { lx = w - lw - pad; ly = pad; }
          else if (pos === 'top-left') { lx = pad; ly = pad; }
          else if (pos === 'center') { lx = Math.round((w - lw) / 2); ly = Math.round((h - lh) / 2); }
          ctx.save();
          ctx.globalAlpha = (+logoOpacity.value) / 100;
          ctx.drawImage(logoImg, lx, ly, lw, lh);
          ctx.restore();
        }
        var blob = await UI.toBlob(c, mime, 0.92);
        UI.done(out, blob, UI.baseName(file.name) + '-' + w + 'x' + h + '.' + ext, tr('✓ নতুন মাপ: ', "✓ New size: ") + UI.n(w) + '×' + UI.n(h) + ' px · ' + UI.fmtSize(blob.size));
        var pv = UI.el('img', { src: URL.createObjectURL(blob), alt: tr('প্রিভিউ', "Preview"), style: { maxWidth: '100%', maxHeight: '320px', borderRadius: '8px', marginTop: '12px' } });
        out.firstChild.appendChild(pv);
      } catch (e) { UI.clear(out); out.appendChild(UI.notice('err', UI.err(e))); }
    }
    root.appendChild(UI.el('div', { class: 'stack' }, drop, info,
      UI.el('div', { class: 'stack' }, UI.el('span', { class: 'lbl' }, tr('তৈরি মাপ', "Ready-made sizes")), presets),
      UI.el('div', { class: 'row' }, UI.field(tr('প্রস্থ (px)', "Width (px)"), wIn), UI.field(tr('উচ্চতা (px)', "Height (px)"), hIn)),
      UI.el('label', { class: 'check' }, lock, tr(' অনুপাত ঠিক রাখুন', " Keep the aspect ratio")),
      fitField,
      UI.el('label', { class: 'check' }, logoCheck, tr(' ছবিতে লোগো বা ওয়াটারমার্ক যোগ করুন (ঐচ্ছিক)', " Add logo or watermark to image (optional)")),
      logoBox,
      UI.el('div', { class: 'row' }, UI.field(tr('ফরম্যাট', "Format"), fmt)), go, out));
  };

  /* ---------------- ক্রপ ---------------- */
  T['crop-image'] = function (root) {
    var img = null, file = null, ratio = 0, out = UI.el('div'), stage = UI.el('div'), sizeInfo = UI.el('small', { class: 'lbl' }, '');
    var box = { x: 0, y: 0, w: 0, h: 0 }, cropper, boxEl, imgEl;
    var ratios = [{ value: 0, label: tr('ফ্রি', "Free") }, { value: 1, label: tr('১:১', "1:1") }, { value: 4 / 3, label: tr('৪:৩', "4:3") }, { value: 3 / 4, label: tr('৩:৪', "3:4") }, { value: 16 / 9, label: tr('১৬:৯', "16:9") }, { value: 9 / 16, label: tr('৯:১৬', "9:16") }, { value: 4 / 5, label: tr('৪:৫', "4:5") }, { value: 7 / 9, label: tr('পাসপোর্ট ৩৫×৪৫', "Passport 35×45") }];
    var seg = UI.seg(ratios, 0, function (v) { ratio = v; if (imgEl) { resetBox(); } });
    var fmt = UI.select([{ value: 'orig', label: tr('মূল ফরম্যাট', "Original format") }, { value: 'jpg', label: 'JPG' }, { value: 'png', label: 'PNG' }], 'orig');
    var go = UI.btn(tr('ক্রপ করুন', "Crop"), run, { icon: 'crop', disabled: true });
    var drop = UI.dropzone({
      multiple: false,
      allowFolder: false,
      accept: 'image/*', label: tr('ছবি বেছে নিন', "Choose images"),
      onFiles: async function (fs) {
        UI.clear(out); UI.clear(stage); file = fs[0];
        try { img = await UI.readImage(file); } catch (e) { stage.appendChild(UI.notice('err', UI.err(e))); return; }
        imgEl = UI.el('img', { src: img._url, alt: tr('ক্রপ করার ছবি', "Image to crop"), draggable: 'false' });
        boxEl = UI.el('div', { class: 'crop-box' }, ['nw', 'ne', 'sw', 'se'].map(function (k) { return UI.el('span', { class: 'h ' + k, 'data-h': k }); }));
        cropper = UI.el('div', { class: 'cropper' }, imgEl, boxEl);
        stage.appendChild(cropper);
        var initDone = false;
        function tryInit(attempts) {
          if (initDone) return;
          attempts = attempts || 0;
          if (imgEl.clientWidth > 0 && imgEl.clientHeight > 0) {
            initDone = true; resetBox(); go.disabled = false;
          } else if (attempts < 30) {
            requestAnimationFrame(function () { tryInit(attempts + 1); });
          } else {
            initDone = true; resetBox(); go.disabled = false;
          }
        }
        imgEl.addEventListener('load', function () { tryInit(0); });
        requestAnimationFrame(function () { tryInit(0); });
        setTimeout(function () { tryInit(0); }, 80);
        window.addEventListener('resize', function () { if (imgEl && imgEl.clientWidth) resetBox(); });
        bindDrag();
      }
    });
    function W() { return imgEl.clientWidth; } function H() { return imgEl.clientHeight; }
    function paint() {
      boxEl.style.left = box.x + 'px'; boxEl.style.top = box.y + 'px'; boxEl.style.width = box.w + 'px'; boxEl.style.height = box.h + 'px';
      var s = img.naturalWidth / W();
      sizeInfo.textContent = tr('কাটা অংশ: ', "Crop area: ") + UI.n(Math.round(box.w * s)) + '×' + UI.n(Math.round(box.h * s)) + ' px';
    }
    function resetBox() {
      var w = W() * 0.8, h = H() * 0.8;
      if (ratio) { if (w / h > ratio) w = h * ratio; else h = w / ratio; }
      box = { w: w, h: h, x: (W() - w) / 2, y: (H() - h) / 2 }; paint();
    }
    function bindDrag() {
      var mode = null, start = null;
      function pt(e) { var r = cropper.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
      cropper.addEventListener('pointerdown', function (e) {
        var h = e.target.getAttribute && e.target.getAttribute('data-h');
        if (h) mode = h; else if (e.target === boxEl) mode = 'move'; else return;
        start = { p: pt(e), b: { x: box.x, y: box.y, w: box.w, h: box.h } };
        cropper.setPointerCapture(e.pointerId); e.preventDefault();
      });
      cropper.addEventListener('pointermove', function (e) {
        if (!mode) return;
        var p = pt(e), dx = p.x - start.p.x, dy = p.y - start.p.y, b = start.b, Wd = W(), Hd = H(), min = 24;
        if (mode === 'move') {
          box.x = Math.max(0, Math.min(Wd - b.w, b.x + dx)); box.y = Math.max(0, Math.min(Hd - b.h, b.y + dy));
        } else {
          var ax = mode.indexOf('w') >= 0 ? b.x + b.w : b.x;          // স্থির কোণা
          var ay = mode.charAt(0) === 'n' ? b.y + b.h : b.y;
          var px = Math.max(0, Math.min(Wd, (mode.indexOf('w') >= 0 ? b.x : b.x + b.w) + dx));
          var py = Math.max(0, Math.min(Hd, (mode.charAt(0) === 'n' ? b.y : b.y + b.h) + dy));
          var w = Math.max(min, Math.abs(px - ax)), h = Math.max(min, Math.abs(py - ay));
          var dirX = px >= ax ? 1 : -1, dirY = py >= ay ? 1 : -1;
          var maxW = dirX > 0 ? Wd - ax : ax, maxH = dirY > 0 ? Hd - ay : ay;
          if (ratio) {
            if (w / h > ratio) w = h * ratio; else h = w / ratio;
            var f = Math.min(1, maxW / w, maxH / h); w *= f; h *= f;
          } else { w = Math.min(w, maxW); h = Math.min(h, maxH); }
          box.x = dirX > 0 ? ax : ax - w; box.y = dirY > 0 ? ay : ay - h; box.w = w; box.h = h;
        }
        paint();
      });
      function end() { mode = null; }
      cropper.addEventListener('pointerup', end); cropper.addEventListener('pointercancel', end);
    }
    async function run() {
      UI.clear(out);
      try {
        var s = img.naturalWidth / W();
        var sx = Math.round(box.x * s), sy = Math.round(box.y * s), sw = Math.round(box.w * s), sh = Math.round(box.h * s);
        sw = Math.max(1, Math.min(sw, img.naturalWidth - sx)); sh = Math.max(1, Math.min(sh, img.naturalHeight - sy));
        var ext = typeFor(file, fmt.value), mime = MIME[ext];
        var c = UI.canvas(sw, sh), ctx = c.getContext('2d');
        if (ext === 'jpg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, sw, sh); }
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
        var blob = await UI.toBlob(c, mime, 0.95);
        UI.done(out, blob, UI.baseName(file.name) + '-cropped.' + ext, tr('✓ ক্রপ হয়েছে: ', "✓ Cropped: ") + UI.n(sw) + '×' + UI.n(sh) + ' px');
        out.firstChild.appendChild(UI.el('img', { src: URL.createObjectURL(blob), alt: tr('প্রিভিউ', "Preview"), style: { maxWidth: '100%', maxHeight: '280px', borderRadius: '8px', marginTop: '12px' } }));
      } catch (e) { UI.clear(out); out.appendChild(UI.notice('err', UI.err(e))); }
    }
    root.appendChild(UI.el('div', { class: 'stack' }, drop,
      UI.el('div', { class: 'stack' }, UI.el('span', { class: 'lbl' }, tr('অনুপাত', "Ratio")), seg),
      stage, sizeInfo, UI.el('div', { class: 'row' }, UI.field(tr('ফরম্যাট', "Format"), fmt)), go, out));
  };

  /* ---------------- মার্জ ---------------- */
  T['merge-image'] = function (root) {
    var items = [], out = UI.el('div');
    var layout = UI.seg([{ value: 'v', label: tr('উপর-নিচ', "Top to bottom") }, { value: 'h', label: tr('পাশাপাশি', "Side by side") }, { value: 'g2', label: tr('গ্রিড (২ কলাম)', "Grid (2 columns)") }, { value: 'g3', label: tr('গ্রিড (৩ কলাম)', "Grid (3 columns)") }], 'v');
    var gap = UI.el('input', { type: 'range', min: '0', max: '60', value: '0' });
    var gapV = UI.el('strong', {}, UI.n(0) + ' px');
    gap.addEventListener('input', function () { gapV.textContent = UI.n(gap.value) + ' px'; });
    var bg = UI.el('input', { type: 'color', value: '#ffffff' });
    var fmt = UI.select([{ value: 'png', label: 'PNG' }, { value: 'jpg', label: 'JPG' }], 'jpg');
    var go = UI.btn(tr('ছবি জুড়ুন', "Join images"), run, { icon: 'layers', disabled: true });
    var list = UI.sortList({
      items: items,
      label: function (it) { return UI.el('span', { class: 'fname', style: { display: 'flex', alignItems: 'center', gap: '10px' } }, UI.el('img', { class: 'thumb', src: it.url, alt: '' }), UI.el('span', {}, it.file.name, UI.el('small', {}, UI.fmtSize(it.file.size)))); },
      onChange: function () { go.disabled = items.length < 2; }
    });
    var drop = UI.dropzone({
      accept: 'image/*',
      multiple: true,
      onFiles: function (fs) { fs.forEach(function (f) { items.push({ file: f, url: URL.createObjectURL(f) }); }); UI.clear(out); list.redraw(); }
    });
    async function run() {
      UI.clear(out); var prog = UI.progress(); out.appendChild(prog); go.disabled = true;
      var activeItems = items.slice();
      var dropInputs = drop.querySelectorAll('input');
      dropInputs.forEach(function (inp) { inp.disabled = true; });
      try {
        var imgs = [];
        for (var i = 0; i < activeItems.length; i++) { prog.set(i / activeItems.length * 50, tr('ছবি পড়া হচ্ছে…', "Reading images…")); imgs.push(await UI.readImage(activeItems[i].file)); }
        var g = +gap.value, mode = layout.get(), cols = mode === 'g2' ? 2 : mode === 'g3' ? 3 : 0;
        var pos = [], W, H;
        if (mode === 'v') {
          var cw = Math.max.apply(null, imgs.map(function (m) { return m.naturalWidth; })), y = 0;
          imgs.forEach(function (m) { var h = m.naturalHeight * cw / m.naturalWidth; pos.push({ m: m, x: 0, y: y, w: cw, h: h }); y += h + g; });
          W = cw; H = y - g;
        } else if (mode === 'h') {
          var ch = Math.max.apply(null, imgs.map(function (m) { return m.naturalHeight; })), x = 0;
          imgs.forEach(function (m) { var w = m.naturalWidth * ch / m.naturalHeight; pos.push({ m: m, x: x, y: 0, w: w, h: ch }); x += w + g; });
          W = x - g; H = ch;
        } else {
          var cell = Math.min(1200, Math.max.apply(null, imgs.map(function (m) { return m.naturalWidth; })));
          var rowY = 0;
          for (var r = 0; r < imgs.length; r += cols) {
            var row = imgs.slice(r, r + cols), rh = 0;
            row.forEach(function (m) { rh = Math.max(rh, m.naturalHeight * cell / m.naturalWidth); });
            row.forEach(function (m, k) { var h = m.naturalHeight * cell / m.naturalWidth; pos.push({ m: m, x: k * (cell + g), y: rowY + (rh - h) / 2, w: cell, h: h }); });
            rowY += rh + g;
          }
          W = cols * cell + (cols - 1) * g; H = rowY - g;
        }
        var maxSide = 16000, f = Math.min(1, maxSide / W, maxSide / H, Math.sqrt(150e6 / (W * H)));
        var c = UI.canvas(W * f, H * f), ctx = c.getContext('2d');
        ctx.fillStyle = bg.value; ctx.fillRect(0, 0, c.width, c.height); ctx.imageSmoothingQuality = 'high';
        pos.forEach(function (p) { ctx.drawImage(p.m, p.x * f, p.y * f, p.w * f, p.h * f); });
        prog.set(90, tr('সেভ হচ্ছে…', "Saving…"));
        var ext = fmt.value, blob = await UI.toBlob(c, MIME[ext], 0.92);
        imgs.forEach(function (m) { URL.revokeObjectURL(m._url); });
        UI.done(out, blob, 'merged-image.' + ext, tr('✓ ছবি জোড়া হয়েছে: ', "✓ Images joined: ") + UI.n(c.width) + '×' + UI.n(c.height) + ' px');
        out.firstChild.appendChild(UI.el('img', { src: URL.createObjectURL(blob), alt: tr('প্রিভিউ', "Preview"), style: { maxWidth: '100%', maxHeight: '360px', borderRadius: '8px', marginTop: '12px' } }));
      } catch (e) { UI.clear(out); out.appendChild(UI.notice('err', UI.err(e))); }
      finally {
        dropInputs.forEach(function (inp) { inp.disabled = false; });
        go.disabled = items.length < 2;
      }
    }
    root.appendChild(UI.el('div', { class: 'stack' }, drop, list,
      UI.el('div', { class: 'stack' }, UI.el('span', { class: 'lbl' }, tr('সাজানোর ধরন', "Layout")), layout),
      UI.el('div', { class: 'row' }, UI.field(tr('ছবির মাঝে ফাঁক', "Gap between images"), UI.el('div', {}, gap, gapV)), UI.field(tr('ব্যাকগ্রাউন্ড রং', "Background colour"), bg, null, 'fit'), UI.field(tr('ফরম্যাট', "Format"), fmt, null, 'fit')),
      go, out));
  };

  /* ---------------- কনভার্ট ---------------- */
  T['convert-image'] = function (root) {
    var items = [];
    var currentFormat = 'jpg';
    var activeRunId = 0;
    var reprocessTimer = null;

    var container = UI.el('div', { class: 'stack' });
    var dropWrap = UI.el('div', { class: 'drop-wrap' });

    var drop = UI.dropzone({
      accept: 'image/*',
      multiple: true,
      hint: tr('অথবা আপনার ছবিগুলো এখানে টেনে এনে ছেড়ে দিন', "Or drag and drop your images here"),
      onFiles: function (fs) {
        if (!fs || !fs.length) return;
        items = fs.map(function (f, idx) {
          return { id: 'ci_' + idx + '_' + Math.random().toString(36).slice(2, 7), file: f, img: null, res: null, cardEl: null };
        });
        dropWrap.style.display = 'none';
        workspace.style.display = 'grid';
        renderCardsSkeleton();
        triggerReprocess();
      }
    });
    dropWrap.appendChild(drop);

    // Workspace container matching Image 2
    var workspace = UI.el('div', { class: 'ci-workspace', style: { display: 'none' } });

    // --- LEFT COLUMN: SETTINGS PANEL ---
    var settingsPanel = UI.el('div', { class: 'ci-panel' });

    // Panel Header
    var countBadge = UI.el('span', { class: 'ci-count-badge' }, '0 Files');
    var settingsHead = UI.el('div', { class: 'ci-panel-header' });
    var settingsTitle = UI.el('h3', { class: 'ci-panel-title' });
    settingsTitle.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> <span>' + tr('সেটিংস', "Settings") + '</span>';
    settingsHead.appendChild(settingsTitle);
    settingsHead.appendChild(countBadge);

    // Section 1: Convert To
    var pillsWrap = UI.el('div', { class: 'ci-pills' });
    var formats = ['JPG', 'JPEG', 'PNG', 'WEBP'];
    var pillBtns = {};
    formats.forEach(function (f) {
      var btn = UI.el('button', { type: 'button', class: 'ci-pill' + (f.toLowerCase() === currentFormat ? ' active' : '') }, f);
      btn.addEventListener('click', function () {
        currentFormat = f.toLowerCase();
        formats.forEach(function (k) {
          if (pillBtns[k]) pillBtns[k].classList.toggle('active', k.toLowerCase() === currentFormat);
        });
        triggerReprocess();
      });
      pillBtns[f] = btn;
      pillsWrap.appendChild(btn);
    });

    var formatSection = UI.el('div', { class: 'ci-section' });
    var formatLabel = UI.el('div', { class: 'ci-label' });
    formatLabel.innerHTML = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> <span>' + tr('কনভার্ট ফরম্যাট', "Convert To") + '</span>';
    formatSection.appendChild(formatLabel);
    formatSection.appendChild(pillsWrap);

    // Section 2: Target File Size
    var targetInput = UI.el('input', { type: 'number', class: 'ci-input', min: '1', placeholder: tr('যেমন: 5 বা 100', "e.g. 5 or 100") });
    var targetUnit = UI.el('select', { class: 'ci-select' },
      UI.el('option', { value: 'MB' }, 'MB'),
      UI.el('option', { value: 'KB' }, 'KB')
    );
    targetInput.addEventListener('input', triggerReprocess);
    targetUnit.addEventListener('change', triggerReprocess);

    var targetSection = UI.el('div', { class: 'ci-section' });
    var targetLabel = UI.el('div', { class: 'ci-label' });
    targetLabel.innerHTML = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg> <span>' + tr('টার্গেট ফাইল সাইজ', "Target File Size") + '</span>';
    targetSection.appendChild(targetLabel);
    targetSection.appendChild(UI.el('div', { class: 'ci-target-row' }, targetInput, targetUnit));
    targetSection.appendChild(UI.el('div', { class: 'ci-help-text' }, tr('অটো-কম্প্রেশনের জন্য ফাঁকা রাখুন।', "Leave blank for optimal auto-compression.")));

    // Section 3: Custom Resize
    var widthInput = UI.el('input', { type: 'number', class: 'ci-input', min: '1', placeholder: tr('Auto', "Auto") });
    var heightInput = UI.el('input', { type: 'number', class: 'ci-input', min: '1', placeholder: tr('Auto', "Auto") });
    var ratioCheck = UI.el('input', { type: 'checkbox', checked: true });
    widthInput.addEventListener('input', triggerReprocess);
    heightInput.addEventListener('input', triggerReprocess);
    ratioCheck.addEventListener('change', triggerReprocess);

    var resizeSection = UI.el('div', { class: 'ci-section' });
    var resizeLabel = UI.el('div', { class: 'ci-label' });
    resizeLabel.innerHTML = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg> <span>' + tr('কাস্টম সাইজ পরিবর্তন', "Custom Resize") + '</span>';
    resizeSection.appendChild(resizeLabel);
    resizeSection.appendChild(UI.el('div', { class: 'ci-resize-row' },
      UI.el('div', { class: 'ci-field-wrap' },
        UI.el('small', {}, tr('প্রস্থ (px)', "Width (px)")),
        widthInput
      ),
      UI.el('div', { class: 'ci-field-wrap' },
        UI.el('small', {}, tr('উচ্চতা (px)', "Height (px)")),
        heightInput
      )
    ));
    resizeSection.appendChild(UI.el('label', { class: 'ci-check-label' }, ratioCheck, tr('অনুপাত ঠিক রাখুন', "Maintain Aspect Ratio")));

    // Reset button
    var resetBtn = UI.el('button', { type: 'button', class: 'ci-reset-btn' }, tr('↺ অন্য ছবি বেছে নিন', "↺ Choose other images"));
    resetBtn.addEventListener('click', function () {
      items.forEach(function (it) {
        if (it.res && it.res.url) URL.revokeObjectURL(it.res.url);
        if (it.img && it.img._url) URL.revokeObjectURL(it.img._url);
      });
      items = [];
      workspace.style.display = 'none';
      dropWrap.style.display = 'block';
    });

    settingsPanel.appendChild(settingsHead);
    settingsPanel.appendChild(formatSection);
    settingsPanel.appendChild(targetSection);
    settingsPanel.appendChild(resizeSection);
    settingsPanel.appendChild(resetBtn);

    // --- RIGHT COLUMN: CONVERTED FILES ---
    var resultsWrap = UI.el('div', { class: 'ci-results-wrap' });
    var zipBtn = UI.el('button', { type: 'button', class: 'ci-download-btn', style: { width: 'auto', padding: '0 18px', display: 'none' } });
    zipBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> ' + tr('সবগুলো ZIP ডাউনলোড', "Download All (ZIP)");
    zipBtn.addEventListener('click', async function () {
      var validBlobs = items.filter(function (it) { return it.res && it.res.blob; }).map(function (it) {
        return { name: it.res.name, blob: it.res.blob };
      });
      if (!validBlobs.length) return;
      var z = await UI.zip(validBlobs);
      UI.download(z, 'ToolGhor(convert-image).zip');
    });

    var resultsHead = UI.el('div', { class: 'ci-results-head' },
      UI.el('h2', { class: 'ci-results-title' }, tr('রূপান্তরিত ফাইল', "Converted Files")),
      zipBtn
    );

    var cardsGrid = UI.el('div', { class: 'ci-cards-grid' });
    resultsWrap.appendChild(resultsHead);
    resultsWrap.appendChild(cardsGrid);

    workspace.appendChild(settingsPanel);
    workspace.appendChild(resultsWrap);

    container.appendChild(dropWrap);
    container.appendChild(workspace);
    root.appendChild(container);

    function renderCardsSkeleton() {
      countBadge.textContent = items.length + ' ' + tr('টি ফাইল', 'Files');
      zipBtn.style.display = items.length > 1 ? 'inline-flex' : 'none';
      UI.clear(cardsGrid);

      items.forEach(function (item) {
        var card = UI.el('div', { class: 'ci-card' });
        var thumbBox = UI.el('div', { class: 'ci-card-thumb-wrap' });
        var badge = UI.el('div', { class: 'ci-badge-busy' }, '⏳');
        var imgEl = UI.el('img', { class: 'ci-card-img', alt: item.file.name });
        thumbBox.appendChild(imgEl);
        thumbBox.appendChild(badge);

        var cardBody = UI.el('div', { class: 'ci-card-body' });
        var titleEl = UI.el('h4', { class: 'ci-card-filename', title: item.file.name }, item.file.name);

        var specsGrid = UI.el('div', { class: 'ci-specs-grid' },
          UI.el('div', { class: 'ci-spec-old-size' }, 'Old: ' + UI.fmtSize(item.file.size)),
          UI.el('div', { class: 'ci-spec-old-dims' }, '—'),
          UI.el('div', { class: 'ci-spec-new-size' }, tr('প্রসেসিং...', 'Processing...')),
          UI.el('div', { class: 'ci-spec-new-dims' }, '—')
        );

        var dlBtn = UI.el('button', { type: 'button', class: 'ci-download-btn', disabled: true });
        dlBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> ' + tr('ডাউনলোড', "Download");

        var delBtn = UI.el('button', { type: 'button', class: 'ci-delete-btn', title: tr('মুছে ফেলুন', "Delete") });
        delBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>';

        dlBtn.addEventListener('click', function () {
          if (item.res && item.res.blob) {
            UI.download(item.res.blob, item.res.name);
          }
        });

        delBtn.addEventListener('click', function () {
          if (item.res && item.res.url) URL.revokeObjectURL(item.res.url);
          if (item.img && item.img._url) URL.revokeObjectURL(item.img._url);
          items = items.filter(function (it) { return it.id !== item.id; });
          card.remove();
          countBadge.textContent = items.length + ' ' + tr('টি ফাইল', 'Files');
          zipBtn.style.display = items.length > 1 ? 'inline-flex' : 'none';
          if (!items.length) {
            workspace.style.display = 'none';
            dropWrap.style.display = 'block';
          }
        });

        var actionsRow = UI.el('div', { class: 'ci-actions-row' }, dlBtn, delBtn);

        cardBody.appendChild(titleEl);
        cardBody.appendChild(specsGrid);
        cardBody.appendChild(actionsRow);

        card.appendChild(thumbBox);
        card.appendChild(cardBody);

        item.cardEl = {
          card: card,
          img: imgEl,
          badge: badge,
          title: titleEl,
          oldSize: specsGrid.children[0],
          oldDims: specsGrid.children[1],
          newSize: specsGrid.children[2],
          newDims: specsGrid.children[3],
          dlBtn: dlBtn
        };

        cardsGrid.appendChild(card);
      });
    }

    function triggerReprocess() {
      clearTimeout(reprocessTimer);
      reprocessTimer = setTimeout(runAllConversions, 200);
    }

    async function convertSingleFile(item, opt) {
      if (!item.img) {
        item.img = await UI.readImage(item.file);
      }
      var img = item.img;
      var ow = img.naturalWidth, oh = img.naturalHeight;
      var w = ow, h = oh;

      if (opt.customW > 0 && opt.customH > 0) {
        w = opt.customW;
        h = opt.customH;
      } else if (opt.customW > 0) {
        w = opt.customW;
        h = opt.maintainRatio ? Math.max(1, Math.round(w * oh / ow)) : oh;
      } else if (opt.customH > 0) {
        h = opt.customH;
        w = opt.maintainRatio ? Math.max(1, Math.round(h * ow / oh)) : ow;
      }

      var fmt = (opt.format || 'jpg').toLowerCase();
      var ext = (fmt === 'jpeg') ? 'jpeg' : (fmt === 'png') ? 'png' : (fmt === 'webp') ? 'webp' : 'jpg';
      var mime = (ext === 'png') ? 'image/png' : (ext === 'webp') ? 'image/webp' : 'image/jpeg';
      var targetBytes = opt.targetBytes || 0;

      var finalBlob = null, finalW = w, finalH = h;

      if (targetBytes > 0) {
        // Calculate proportional scale if custom dimensions not given
        if (!opt.customW && !opt.customH) {
          if (targetBytes > item.file.size * 1.5) {
            // Upscale resolution up to 6x (cap at 4608x6144 max for smooth memory)
            var scale = Math.min(6, Math.max(1.15, Math.sqrt(targetBytes / Math.max(1024, item.file.size * 2))));
            w = Math.round(ow * scale);
            h = Math.round(oh * scale);
            if (w > 4608) { h = Math.round(h * 4608 / w); w = 4608; }
            if (h > 6144) { w = Math.round(w * 6144 / h); h = 6144; }
          } else if (targetBytes < item.file.size * 0.75) {
            // Downscale resolution proportionally for small targets (e.g. 20 KB)
            var scale = Math.max(0.2, Math.min(0.95, Math.sqrt(targetBytes / item.file.size) * 1.05));
            w = Math.max(24, Math.round(ow * scale));
            h = Math.max(24, Math.round(oh * scale));
          }
        }
        finalW = w;
        finalH = h;

        var c = drawToCanvas(img, w, h, (ext === 'png' || ext === 'webp') ? null : '#fff');

        if (ext === 'jpg' || ext === 'jpeg') {
          // Fast encoding pass
          var qVal = (targetBytes >= item.file.size) ? 0.96 : Math.max(0.1, Math.min(0.9, targetBytes / item.file.size));
          var rawBlob = await UI.toBlob(c, mime, qVal);

          if (rawBlob.size < targetBytes) {
            var buf = await rawBlob.arrayBuffer();
            var padded = padJpegExact(new Uint8Array(buf), targetBytes);
            finalBlob = new Blob([padded], { type: mime });
          } else if (rawBlob.size > targetBytes) {
            var qLower = Math.max(0.05, qVal * (targetBytes / rawBlob.size) * 0.95);
            var b2 = await UI.toBlob(c, mime, qLower);
            if (b2.size < targetBytes) {
              var buf2 = await b2.arrayBuffer();
              var padded2 = padJpegExact(new Uint8Array(buf2), targetBytes);
              finalBlob = new Blob([padded2], { type: mime });
            } else {
              finalBlob = b2;
            }
          } else {
            finalBlob = rawBlob;
          }
        } else if (ext === 'webp') {
          var qVal = (targetBytes >= item.file.size) ? 0.95 : Math.max(0.1, Math.min(0.9, targetBytes / item.file.size));
          var rawBlob = await UI.toBlob(c, mime, qVal);
          if (rawBlob.size < targetBytes) {
            var buf = await rawBlob.arrayBuffer();
            var padded = padGenericExact(new Uint8Array(buf), targetBytes);
            finalBlob = new Blob([padded], { type: mime });
          } else {
            finalBlob = rawBlob;
          }
        } else {
          // PNG
          var rawBlob = await UI.toBlob(c, mime, 1);
          if (rawBlob.size < targetBytes) {
            var buf = await rawBlob.arrayBuffer();
            var padded = padGenericExact(new Uint8Array(buf), targetBytes);
            finalBlob = new Blob([padded], { type: mime });
          } else {
            finalBlob = rawBlob;
          }
        }
      } else {
        // Optimal auto-compression
        var qVal = (ext === 'png') ? 1 : (ext === 'webp') ? 0.90 : 0.92;
        var c = drawToCanvas(img, w, h, (ext === 'png' || ext === 'webp') ? null : '#fff');
        finalBlob = await UI.toBlob(c, mime, qVal);
        finalW = w;
        finalH = h;
      }

      var base = UI.baseName(item.file.name);
      var outFileName = base + '.' + ext;

      return {
        blob: finalBlob,
        url: URL.createObjectURL(finalBlob),
        name: outFileName,
        oldSize: item.file.size,
        newSize: finalBlob.size,
        oldW: ow,
        oldH: oh,
        newW: finalW,
        newH: finalH
      };
    }

    async function runAllConversions() {
      var runId = ++activeRunId;
      var tVal = UI.parseNum(targetInput.value);
      var unit = targetUnit.value || 'MB';
      var targetBytes = (tVal > 0) ? (unit === 'MB' ? tVal * 1024 * 1024 : tVal * 1024) : 0;
      var cW = UI.parseNum(widthInput.value) || 0;
      var cH = UI.parseNum(heightInput.value) || 0;
      var mRatio = ratioCheck.checked;

      var opt = {
        format: currentFormat,
        targetBytes: targetBytes,
        customW: cW,
        customH: cH,
        maintainRatio: mRatio
      };

      for (var i = 0; i < items.length; i++) {
        if (runId !== activeRunId) return;
        var item = items[i];
        if (item.cardEl) {
          item.cardEl.badge.className = 'ci-badge-busy';
          item.cardEl.badge.innerHTML = '⏳';
          item.cardEl.dlBtn.disabled = true;
        }

        try {
          var res = await convertSingleFile(item, opt);
          if (runId !== activeRunId) return;
          if (item.res && item.res.url) {
            URL.revokeObjectURL(item.res.url);
          }
          item.res = res;

          if (item.cardEl) {
            item.cardEl.img.src = res.url;
            item.cardEl.title.textContent = res.name;
            item.cardEl.title.title = res.name;
            item.cardEl.oldSize.textContent = 'Old: ' + UI.fmtSize(res.oldSize);
            item.cardEl.oldDims.textContent = res.oldW + 'x' + res.oldH;
            item.cardEl.newSize.textContent = 'New: ' + UI.fmtSize(res.newSize);
            item.cardEl.newDims.textContent = res.newW + 'x' + res.newH;
            item.cardEl.badge.className = 'ci-badge-success';
            item.cardEl.badge.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
            item.cardEl.dlBtn.disabled = false;
          }
        } catch (err) {
          if (item.cardEl) {
            item.cardEl.newSize.textContent = tr('ব্যর্থ', 'Failed');
            item.cardEl.badge.className = 'ci-badge-busy';
            item.cardEl.badge.innerHTML = '❌';
          }
        }
      }
    }
  };

  /* ---------------- পাসপোর্ট সাইজ ফটো (Fixed 35×45 mm / 413×531 px) ---------------- */
  /* Google MediaPipe Face Detection Helper */
  var mpFaceDetector = null, mpLoadingPromise = null;
  function loadMediaPipeFace() {
    if (mpFaceDetector) return Promise.resolve(mpFaceDetector);
    if (mpLoadingPromise) return mpLoadingPromise;
    mpLoadingPromise = new Promise(function (resolve) {
      if (typeof window !== 'undefined' && window.FaceDetection) {
        try {
          var fd = new window.FaceDetection({
            locateFile: function (f) { return 'https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/' + f; }
          });
          fd.setOptions({ model: 'short', minDetectionConfidence: 0.5 });
          mpFaceDetector = fd;
          return resolve(fd);
        } catch (e) { return resolve(null); }
      }
      UI.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js')
        .then(function () {
          return UI.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/face_detection.js');
        })
        .then(function () {
          if (typeof window !== 'undefined' && window.FaceDetection) {
            var fd = new window.FaceDetection({
              locateFile: function (f) { return 'https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/' + f; }
            });
            fd.setOptions({ model: 'short', minDetectionConfidence: 0.5 });
            mpFaceDetector = fd;
            resolve(fd);
          } else { resolve(null); }
        })
        .catch(function () { resolve(null); });
    });
    return mpLoadingPromise;
  }

  async function detectFaceBox(imgEl) {
    try {
      var fd = await loadMediaPipeFace();
      if (!fd) return null;
      return new Promise(function (resolve) {
        var timer = setTimeout(function () { resolve(null); }, 3500);
        fd.onResults(function (results) {
          clearTimeout(timer);
          if (results && results.detections && results.detections.length > 0) {
            var b = results.detections[0].boundingBox;
            resolve({
              x: b.xCenter - b.width / 2,
              y: b.yCenter - b.height / 2,
              w: b.width,
              h: b.height,
              cx: b.xCenter,
              cy: b.yCenter
            });
          } else { resolve(null); }
        });
        fd.send({ image: imgEl }).catch(function () { clearTimeout(timer); resolve(null); });
      });
    } catch (e) { return null; }
  }

  /* Google MediaPipe Selfie / Background Segmentation Helper */
  var mpSegmenter = null, mpSegLoadingPromise = null;
  function loadMediaPipeSelfie() {
    if (mpSegmenter) return Promise.resolve(mpSegmenter);
    if (mpSegLoadingPromise) return mpSegLoadingPromise;
    mpSegLoadingPromise = new Promise(function (resolve) {
      if (typeof window !== 'undefined' && window.SelfieSegmentation) {
        try {
          var ss = new window.SelfieSegmentation({
            locateFile: function (f) { return 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/' + f; }
          });
          ss.setOptions({ modelSelection: 1 });
          mpSegmenter = ss;
          return resolve(ss);
        } catch (e) { return resolve(null); }
      }
      UI.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js')
        .then(function () {
          return UI.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.js');
        })
        .then(function () {
          if (typeof window !== 'undefined' && window.SelfieSegmentation) {
            var ss = new window.SelfieSegmentation({
              locateFile: function (f) { return 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/' + f; }
            });
            ss.setOptions({ modelSelection: 1 });
            mpSegmenter = ss;
            resolve(ss);
          } else { resolve(null); }
        })
        .catch(function () { resolve(null); });
    });
    return mpSegLoadingPromise;
  }

  async function segmentSubjectWithAI(imgSource) {
    try {
      var ss = await loadMediaPipeSelfie();
      if (!ss) return null;
      return new Promise(function (resolve) {
        var timer = setTimeout(function () { resolve(null); }, 3500);
        ss.onResults(function (results) {
          clearTimeout(timer);
          if (!results || !results.segmentationMask) return resolve(null);
          var w = imgSource.naturalWidth || imgSource.width;
          var h = imgSource.naturalHeight || imgSource.height;
          var canvas = UI.canvas(w, h);
          var ctx = canvas.getContext('2d');
          
          var maskCanvas = UI.canvas(w, h);
          var mctx = maskCanvas.getContext('2d');
          mctx.drawImage(results.segmentationMask, 0, 0, w, h);
          
          var mData = mctx.getImageData(0, 0, w, h);
          var md = mData.data;
          
          var alphaVaries = false;
          var fgCount = 0;
          var totalSampled = 0;
          for (var i = 0; i < md.length; i += 40) {
            totalSampled++;
            if (md[i + 3] < 240) alphaVaries = true;
            if (md[i] > 100 || md[i + 3] > 100) fgCount++;
          }
          if (!alphaVaries) {
            for (var i = 0; i < md.length; i += 4) {
              md[i + 3] = md[i]; // MediaPipe outputs mask confidence in red channel
            }
            mctx.putImageData(mData, 0, 0);
          }
          
          var ratio = fgCount / Math.max(1, totalSampled);
          if (ratio < 0.015 || ratio > 0.995) {
            return resolve(null);
          }
          
          ctx.drawImage(maskCanvas, 0, 0, w, h);
          ctx.globalCompositeOperation = 'source-in';
          ctx.drawImage(imgSource, 0, 0, w, h);
          resolve(canvas);
        });
        ss.send({ image: imgSource }).catch(function () {
          clearTimeout(timer);
          resolve(null);
        });
      });
    } catch (e) {
      return null;
    }
  }

    /* ---------------- পাসপোর্ট সাইজ ছবি (ImResizer স্টাইল এআই পাসপোর্ট মেকার - অরিজিনাল ব্যাকগ্রাউন্ড) ---------------- */
  T['passport-photo'] = function (root) {
    var img = null, file = null;
    var PW = 413, PH = 531; // Official 35x45mm at 300 DPI - STRICTLY FIXED
    var ratio = 35 / 45; // 7 / 9
    var box = { x: 0, y: 0, w: 0, h: 0 }, cropper, boxEl, imgEl;

    var container = UI.el('div', { class: 'stack' });
    var workspace = UI.el('div', { class: 'passport-workspace', style: { display: 'none' } });

    // Top info bar
    var topInfo = UI.el('div', { class: 'passport-top-info' });
    var specsBadge = UI.el('div', {
      style: {
        display: 'inline-flex', alignItems: 'center', gap: '8px',
        fontWeight: '700', fontSize: '14px', color: 'var(--paddy-d)'
      }
    }, '🔒 ' + tr('নির্দিষ্ট পাসপোর্ট মাপ: ৩৫ × ৪৫ মিমি (৪১৩ × ৫৩১ px @ ৩০০ DPI)', "Fixed Passport Size: 35 × 45 mm (413 × 531 px @ 300 DPI)"));

    var autoFaceBadge = UI.el('span', {
      style: {
        display: 'none', padding: '4px 10px', borderRadius: '6px',
        background: 'color-mix(in srgb, var(--paddy) 15%, var(--paper))',
        border: '1px solid var(--paddy)',
        color: 'var(--paddy-d)', fontSize: '12px', fontWeight: '700'
      }
    }, '✓ ' + tr('এআই ফেস অ্যালাইনড (ICAO ৭৫% হেড)', "AI Face Aligned (ICAO 75% Head)"));

    var topActions = UI.el('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } });

    var reAlignBtn = UI.btn(tr('✨ এআই ফেস রিসিঙ্ক', "✨ AI Re-Align"), function () {
      applyAutoFace(false);
    }, { icon: 'sparkles', variant: 'ghost' });
    reAlignBtn.style.padding = '5px 12px';
    reAlignBtn.style.fontSize = '12.5px';

    var uploadNewInput = UI.el('input', { type: 'file', accept: 'image/*', style: { display: 'none' } });
    uploadNewInput.addEventListener('change', function () {
      if (uploadNewInput.files && uploadNewInput.files[0]) {
        handleFileSelect(uploadNewInput.files[0]);
      }
    });

    var uploadNewBtn = UI.btn(tr('+ নতুন ছবি', "+ Upload New"), function () {
      uploadNewInput.click();
    }, { icon: 'upload', variant: 'ghost' });
    uploadNewBtn.style.padding = '5px 12px';
    uploadNewBtn.style.fontSize = '12.5px';

    topActions.appendChild(reAlignBtn);
    topActions.appendChild(uploadNewBtn);
    topActions.appendChild(uploadNewInput);

    topInfo.appendChild(specsBadge);
    topInfo.appendChild(autoFaceBadge);
    topInfo.appendChild(topActions);

    // Two column grid
    var grid = UI.el('div', { class: 'passport-grid' });

    // Left Column: Crop Area with Face Guides
    var cropCol = UI.el('div', { class: 'passport-crop-area' });
    var stage = UI.el('div', { style: { width: '100%', display: 'flex', justifyContent: 'center' } });

    var cropHelp = UI.el('small', { class: 'lbl', style: { textAlign: 'center', maxWidth: '440px', lineHeight: '1.4' } },
      tr('💡 ফ্রেমটি নাড়িয়ে মুখটি ওভালের ভেতর রাখুন। চোখ ও চিবুক নির্দেশক দাগের সাথে সামঞ্জস্য রেখে পারফেক্ট পাসপোর্ট ফ্রেম তৈরি করুন।',
         "💡 Position the face inside the oval guide. Align eyes and chin with the guidelines for official passport compliance.")
    );

    cropCol.appendChild(stage);
    cropCol.appendChild(cropHelp);

    // Right Column: Side Card with Live Preview & Controls
    var sideCard = UI.el('div', { class: 'passport-side-card' });

    // Preview Canvas Card
    var previewBox = UI.el('div', { class: 'passport-preview-box' });
    var previewCanvas = UI.canvas(PW, PH);
    previewCanvas.className = 'passport-preview-canvas';

    var previewLabel = UI.el('div', { style: { textAlign: 'center' } },
      UI.el('div', { style: { fontWeight: '700', fontSize: '14px', color: 'var(--ink)' } },
        tr('লাইভ পাসপোর্ট প্রিভিউ (আসল ব্যাকগ্রাউন্ড)', "Live Passport Preview (Original Background)")
      ),
      UI.el('div', { style: { fontSize: '11.5px', color: 'var(--ink-3)', marginTop: '2px' } },
        '৩৫ × ৪৫ মিমি (৪১৩ × ৫৩১ px @ ৩০০ DPI)'
      )
    );

    previewBox.appendChild(previewCanvas);
    previewBox.appendChild(previewLabel);

    // Print Sheet Options
    var sheetSel = UI.select([
      { value: '1', label: tr('১ কপি (ডিজিটাল ফাইল - ৪১৩×৫৩১ px)', "1 Copy (Digital Photo - 413×531 px)") },
      { value: '4', label: tr('৪ কপি প্রিন্ট শিট (৪×৬ পেপার)', "4 Copies Sheet (4×6 photo paper)") },
      { value: '6', label: tr('৬ কপি প্রিন্ট শিট (৪×৬ পেপার)', "6 Copies Sheet (4×6 photo paper)") },
      { value: '8', label: tr('৮ কপি প্রিন্ট শিট (৪×৬ পেপার)', "8 Copies Sheet (4×6 photo paper)") }
    ], '1');

    // Target KB File Size Reducer (ImResizer signature feature)
    var kbLimitSel = UI.select([
      { value: '0', label: tr('সর্বোচ্চ কোয়ালিটি (Original 300 DPI)', "Best Quality (Original 300 DPI)") },
      { value: '50', label: tr('সর্বোচ্চ ৫০ KB (সরকারি চাকরির পোর্টাল)', "Max 50 KB (Govt Job portal limit)") },
      { value: '100', label: tr('সর্বোচ্চ ১০০ KB (ই-পাসপোর্ট/ভিসা)', "Max 100 KB (e-Passport/Visa limit)") },
      { value: '200', label: tr('সর্বোচ্চ ২০০ KB', "Max 200 KB") }
    ], '0');

    var fmtSel = UI.select([
      { value: 'jpg', label: 'JPG (অফিশিয়াল রিকমেন্ডেড)' },
      { value: 'png', label: 'PNG' }
    ], 'jpg');

    var optionsRow = UI.el('div', { class: 'row' },
      UI.field(tr('প্রিন্ট শিট / কপি', "Print Sheet / Copies"), sheetSel),
      UI.field(tr('ফাইল সাইজ লিমিট (KB)', "File Size Limit (KB)"), kbLimitSel),
      UI.field(tr('ফরম্যাট', "Format"), fmtSel, null, 'fit')
    );

    // Download button
    var downloadBtn = UI.btn(tr('পাসপোর্ট ছবি ডাউনলোড (৩৫×৪৫ মিমি)', "Download Passport Photo (35×45 mm)"), runDownload, {
      icon: 'download'
    });
    downloadBtn.style.padding = '12px 20px';
    downloadBtn.style.fontSize = '15px';
    downloadBtn.style.fontWeight = '700';

    var downloadStatus = UI.el('div', { style: { fontSize: '12.5px', color: 'var(--ink-2)', textAlign: 'center' } });

    sideCard.appendChild(previewBox);
    sideCard.appendChild(optionsRow);
    sideCard.appendChild(downloadBtn);
    sideCard.appendChild(downloadStatus);

    grid.appendChild(cropCol);
    grid.appendChild(sideCard);

    workspace.appendChild(topInfo);
    workspace.appendChild(grid);

    function W() { return (imgEl && imgEl.clientWidth) ? imgEl.clientWidth : (img ? img.naturalWidth : 400); }
    function H() { return (imgEl && imgEl.clientHeight) ? imgEl.clientHeight : (img ? img.naturalHeight : 400); }

    function renderLivePreview() {
      if (!img) return;
      var curW = W(), curH = H();
      if (!curW || !curH) return;
      var s = img.naturalWidth / curW;
      var sx = Math.max(0, Math.min(Math.round(box.x * s), img.naturalWidth - 1));
      var sy = Math.max(0, Math.min(Math.round(box.y * s), img.naturalHeight - 1));
      var sw = Math.max(1, Math.min(Math.round(box.w * s), img.naturalWidth - sx));
      var sh = Math.max(1, Math.min(Math.round(box.h * s), img.naturalHeight - sy));

      var ctx = previewCanvas.getContext('2d');
      ctx.clearRect(0, 0, PW, PH);
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, PW, PH);
    }

    var pvTimer = null;
    function schedulePreview() {
      if (pvTimer) clearTimeout(pvTimer);
      pvTimer = setTimeout(renderLivePreview, 30);
    }

    // AI Auto Face Alignment (ICAO 75% Head Height Standard)
    async function applyAutoFace(silent) {
      if (!imgEl) return;
      var myImg = imgEl;
      if (!silent) UI.toast(tr('🔍 এআই দিয়ে মুখ শনাক্ত ও অ্যালাইন করা হচ্ছে…', "🔍 AI detecting & centering face…"));
      var fbox = await detectFaceBox(myImg);
      if (imgEl !== myImg) return; // Stale detection mid-flight
      var curW = W(), curH = H();
      if (fbox && curW && curH) {
        var faceH = fbox.h * curH;
        var faceCX = fbox.cx * curW;
        var faceCY = fbox.cy * curH;

        // Target: head occupies ~70-75% of total photo height
        var targetH = Math.min(curH * 0.95, Math.max(curH * 0.40, faceH / 0.55));
        var targetW = targetH * ratio;
        if (targetW > curW * 0.98) {
          targetW = curW * 0.98;
          targetH = targetW / ratio;
        }

        // Position eye level at 40% from top
        var targetY = Math.max(0, Math.min(curH - targetH, faceCY - targetH * 0.40));
        var targetX = Math.max(0, Math.min(curW - targetW, faceCX - targetW / 2));

        box = { x: targetX, y: targetY, w: targetW, h: targetH };
        paint();
        schedulePreview();
        autoFaceBadge.style.display = 'inline-flex';
        if (!silent) UI.toast(tr('✓ ফেস শনাক্ত হয়েছে এবং ফ্রেম অটো-অ্যালাইন করা হয়েছে!', "✓ Face detected and frame auto-aligned!"));
      } else {
        resetBox();
        schedulePreview();
        if (!silent) UI.toast(tr('স্বয়ংক্রিয়ভাবে মুখ পাওয়া যায়নি, ফ্রেমটি ম্যানুয়ালি টেনে বসান।', "Face not auto-detected, adjust frame manually."));
      }
    }

    function paint() {
      boxEl.style.left = box.x + 'px';
      boxEl.style.top = box.y + 'px';
      boxEl.style.width = box.w + 'px';
      boxEl.style.height = box.h + 'px';
      schedulePreview();
    }

    function resetBox() {
      var curW = W(), curH = H();
      var w = curW * 0.72, h = w / ratio;
      if (h > curH * 0.95) { h = curH * 0.95; w = h * ratio; }
      box = { w: w, h: h, x: (curW - w) / 2, y: (curH - h) / 2 };
      paint();
    }

    function bindDrag() {
      var mode = null, start = null;
      function pt(e) { var r = cropper.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
      cropper.addEventListener('pointerdown', function (e) {
        var h = e.target.getAttribute && e.target.getAttribute('data-h');
        if (h) mode = h; else if (e.target === boxEl || boxEl.contains(e.target)) mode = 'move'; else return;
        start = { p: pt(e), b: { x: box.x, y: box.y, w: box.w, h: box.h } };
        cropper.setPointerCapture(e.pointerId); e.preventDefault();
      });
      cropper.addEventListener('pointermove', function (e) {
        if (!mode) return;
        var p = pt(e), dx = p.x - start.p.x, dy = p.y - start.p.y, b = start.b, Wd = W(), Hd = H(), minW = 40;
        if (mode === 'move') {
          box.x = Math.max(0, Math.min(Wd - b.w, b.x + dx)); box.y = Math.max(0, Math.min(Hd - b.h, b.y + dy));
        } else {
          var nw = b.w + (mode.indexOf('e') >= 0 ? dx : -dx);
          nw = Math.max(minW, Math.min(Wd, nw));
          var nh = nw / ratio;
          if (nh > Hd) { nh = Hd; nw = nh * ratio; }
          var nx = mode.indexOf('w') >= 0 ? b.x + (b.w - nw) : b.x;
          var ny = mode.indexOf('n') >= 0 ? b.y + (b.h - nh) : b.y;
          if (nx >= 0 && ny >= 0 && nx + nw <= Wd && ny + nh <= Hd) {
            box = { x: nx, y: ny, w: nw, h: nh };
          }
        }
        paint();
      });
      cropper.addEventListener('pointerup', function () { mode = null; });
      cropper.addEventListener('pointercancel', function () { mode = null; });
    }

    // Binary search for target KB compression (ImResizer signature feature)
    async function exportWithTargetKb(canvas, mime, maxKb) {
      if (!maxKb || maxKb <= 0 || mime === 'image/png') {
        return { blob: await UI.toBlob(canvas, mime, 0.95), targetReached: true };
      }
      var minQ = 0.15, maxQ = 0.95, bestBlob = null, smallestBlob = null;
      for (var i = 0; i < 7; i++) {
        var q = (minQ + maxQ) / 2;
        var b = await UI.toBlob(canvas, 'image/jpeg', q);
        if (!smallestBlob || b.size < smallestBlob.size) {
          smallestBlob = b;
        }
        var kb = b.size / 1024;
        if (kb <= maxKb) {
          bestBlob = b;
          minQ = q; // Can afford higher quality
        } else {
          maxQ = q; // Must lower quality
        }
      }
      if (bestBlob) {
        return { blob: bestBlob, targetReached: true };
      }
      return { blob: smallestBlob || (await UI.toBlob(canvas, 'image/jpeg', 0.15)), targetReached: false };
    }

    async function runDownload() {
      if (!img || !file) return;
      downloadBtn.disabled = true;
      downloadStatus.textContent = tr('ছবি প্রসেসিং হচ্ছে…', "Processing photo…");

      try {
        var curW = W();
        var s = img.naturalWidth / curW;
        var sx = Math.max(0, Math.min(Math.round(box.x * s), img.naturalWidth - 1));
        var sy = Math.max(0, Math.min(Math.round(box.y * s), img.naturalHeight - 1));
        var sw = Math.max(1, Math.min(Math.round(box.w * s), img.naturalWidth - sx));
        var sh = Math.max(1, Math.min(Math.round(box.h * s), img.naturalHeight - sy));

        // Strict 35x45mm passport dimensions (413x531 px @ 300 DPI) with original background
        var c = UI.canvas(PW, PH), ctx = c.getContext('2d');
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, PW, PH);

        var copies = +sheetSel.value;
        var finalCanvas = c;
        var outFormat = fmtSel.value;
        var fileName = 'ToolGhor(passport-photo).' + outFormat;

        if (copies === 4) {
          var swSheet = 1800, shSheet = 1200; // 4x6 inch @ 300 DPI landscape
          var sc = UI.canvas(swSheet, shSheet), sctx = sc.getContext('2d');
          sctx.fillStyle = '#ffffff'; sctx.fillRect(0, 0, swSheet, shSheet);
          var gap = 40;
          var totalW = 4 * (PW * 0.9) + 3 * gap;
          var startX = (swSheet - totalW) / 2;
          var startY = (shSheet - PH * 0.9) / 2;
          for (var i = 0; i < 4; i++) {
            var px = startX + i * (PW * 0.9 + gap);
            sctx.drawImage(c, 0, 0, PW, PH, px, startY, PW * 0.9, PH * 0.9);
            sctx.strokeStyle = '#cccccc'; sctx.lineWidth = 1;
            sctx.strokeRect(px, startY, PW * 0.9, PH * 0.9);
          }
          finalCanvas = sc;
          fileName = 'ToolGhor(passport-photo-4copies).' + outFormat;
        } else if (copies === 6) {
          var swSheet = 1800, shSheet = 1200; // 4x6 inch @ 300 DPI landscape
          var sc = UI.canvas(swSheet, shSheet), sctx = sc.getContext('2d');
          sctx.fillStyle = '#ffffff'; sctx.fillRect(0, 0, swSheet, shSheet);
          var gw = PW * 0.85, gh = PH * 0.85;
          var gapX = 40, gapY = 30;
          var totalW = 3 * gw + 2 * gapX;
          var totalH = 2 * gh + gapY;
          var startX = (swSheet - totalW) / 2;
          var startY = (shSheet - totalH) / 2;
          for (var r = 0; r < 2; r++) {
            for (var colI = 0; colI < 3; colI++) {
              var px = startX + colI * (gw + gapX);
              var py = startY + r * (gh + gapY);
              sctx.drawImage(c, 0, 0, PW, PH, px, py, gw, gh);
              sctx.strokeStyle = '#cccccc'; sctx.lineWidth = 1;
              sctx.strokeRect(px, py, gw, gh);
            }
          }
          finalCanvas = sc;
          fileName = 'ToolGhor(passport-photo-6copies).' + outFormat;
        } else if (copies === 8) {
          var swSheet = 1800, shSheet = 1200; // True 4x6 inch @ 300 DPI landscape
          var sc = UI.canvas(swSheet, shSheet), sctx = sc.getContext('2d');
          sctx.fillStyle = '#ffffff'; sctx.fillRect(0, 0, swSheet, shSheet);
          var gw = PW * 0.75, gh = PH * 0.75;
          var gapX = 35, gapY = 30;
          var totalW = 4 * gw + 3 * gapX;
          var totalH = 2 * gh + gapY;
          var startX = (swSheet - totalW) / 2;
          var startY = (shSheet - totalH) / 2;
          for (var r = 0; r < 2; r++) {
            for (var colI = 0; colI < 4; colI++) {
              var px = startX + colI * (gw + gapX);
              var py = startY + r * (gh + gapY);
              sctx.drawImage(c, 0, 0, PW, PH, px, py, gw, gh);
              sctx.strokeStyle = '#cccccc'; sctx.lineWidth = 1;
              sctx.strokeRect(px, py, gw, gh);
            }
          }
          finalCanvas = sc;
          fileName = 'ToolGhor(passport-photo-8copies).' + outFormat;
        }

        var maxKb = +kbLimitSel.value;
        var mime = (outFormat === 'png') ? 'image/png' : 'image/jpeg';
        var exportRes = await exportWithTargetKb(finalCanvas, mime, maxKb);
        var blob = exportRes.blob;

        UI.download(blob, fileName);
        if (!exportRes.targetReached) {
          downloadStatus.textContent = '✓ ' + fileName + ' (' + UI.fmtSize(blob.size) + ') · ' + tr('টার্গেট সাইজ (' + maxKb + ' KB) এ পৌঁছানো সম্ভব হয়নি, তবে সর্বনিম্ন সাইজে তৈরি হয়েছে।', 'Could not reach target size (' + maxKb + ' KB); exported at smallest possible size.');
          UI.toast(tr('টার্গেট সাইজ (' + maxKb + ' KB) এ পৌঁছানো সম্ভব হয়নি, সর্বনিম্ন সাইজে ডাউনলোড হয়েছে।', 'Target (' + maxKb + ' KB) unreachable; downloaded at smallest size.'));
        } else {
          downloadStatus.textContent = '✓ ' + fileName + ' (' + UI.fmtSize(blob.size) + ') ' + tr('সফলভাবে ডাউনলোড হয়েছে!', "Downloaded successfully!");
          UI.toast(tr('✓ পাসপোর্ট সাইজ ছবি সফলভাবে তৈরি ও ডাউনলোড হয়েছে!', "✓ Passport photo created & downloaded!"));
        }
      } catch (err) {
        console.error(err);
        downloadStatus.textContent = tr('ডাউনলোডে সমস্যা হয়েছে।', "Download failed.");
      } finally {
        downloadBtn.disabled = false;
      }
    }

    async function handleFileSelect(f) {
      if (!f) return;
      file = f;
      try {
        img = await UI.readImage(file);
      } catch (e) {
        UI.toast(tr('ছবি লোড করা যায়নি', "Could not read image file"));
        return;
      }

      dropZone.style.display = 'none';
      workspace.style.display = 'flex';

      imgEl = UI.el('img', { src: img._url, alt: tr('পাসপোর্ট ছবি', "Passport image"), draggable: 'false' });

      var ovalGuide = UI.el('div', { class: 'passport-guide-oval' });
      var eyeGuide = UI.el('div', { class: 'passport-guide-eyes' },
        UI.el('span', { class: 'passport-guide-lbl' }, tr('চোখ / Eye Level', "Eye Level"))
      );
      var chinGuide = UI.el('div', { class: 'passport-guide-chin' },
        UI.el('span', { class: 'passport-guide-lbl' }, tr('চিবুক / Chin', "Chin"))
      );

      boxEl = UI.el('div', { class: 'crop-box' },
        ['nw', 'ne', 'sw', 'se'].map(function (k) { return UI.el('span', { class: 'h ' + k, 'data-h': k }); }),
        ovalGuide,
        eyeGuide,
        chinGuide
      );
      cropper = UI.el('div', { class: 'cropper' }, imgEl, boxEl);
      stage.innerHTML = '';
      stage.appendChild(cropper);

      var initDone = false;
      function tryInit(attempts) {
        if (initDone) return;
        attempts = attempts || 0;
        if (imgEl.clientWidth > 0 && imgEl.clientHeight > 0) {
          initDone = true;
          resetBox();
          renderLivePreview();
          applyAutoFace(true);
        } else if (attempts < 30) {
          requestAnimationFrame(function () { tryInit(attempts + 1); });
        } else {
          initDone = true;
          resetBox();
          renderLivePreview();
        }
      }
      imgEl.addEventListener('load', function () { tryInit(0); });
      requestAnimationFrame(function () { tryInit(0); });
      setTimeout(function () { tryInit(0); }, 80);
      window.addEventListener('resize', function () { if (imgEl && imgEl.clientWidth) { resetBox(); renderLivePreview(); } });
      bindDrag();
    }

    var dropZone = UI.dropzone({
      multiple: false,
      allowFolder: false,
      accept: 'image/*',
      label: tr('পাসপোর্ট ছবি বানাতে ছবি আপলোড করুন', "Upload photo for passport maker"),
      hint: tr('অথবা ছবি টেনে আনুন, বা পেস্ট করুন (Ctrl+V) • ImResizer স্টাইল অটো এআই ক্রপ', "or drop a file, paste image (Ctrl+V) • ImResizer-style Auto AI Crop"),
      onFiles: function (files) {
        if (files && files[0]) handleFileSelect(files[0]);
      }
    });
    dropZone.style.padding = '44px 20px';

    function onPaste(e) {
      if (!e.clipboardData || !e.clipboardData.items) return;
      var items = e.clipboardData.items;
      for (var i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          var blob = items[i].getAsFile();
          if (blob) {
            handleFileSelect(blob);
            break;
          }
        }
      }
    }
    document.addEventListener('paste', onPaste);

    // AI Passport Compliance Auditor
    var passportAiBox = UI.renderAiBox({
      title: tr('এআই পাসপোর্ট ও ভিসা স্ট্যান্ডার্ড অডিট', 'AI Passport & Visa Compliance Audit'),
      subtitle: tr('বাংলাদেশি ই-পাসপোর্ট, পুলিশ ক্লিয়ারেন্স ও বিভিন্ন দেশের ভিসা নিয়মের সাথে ছবির সামঞ্জস্য যাচাই করুন', 'Verify photo compliance with Bangladesh e-Passport, Police Clearance & International Visa standards'),
      btnText: tr('✨ এআই কমপ্লায়েন্স অডিট দেখুন', '✨ Run AI Visa/Passport Audit'),
      onGenerate: async function () {
        var prompt = (UI.lang === 'bn')
          ? ('আমি একটি স্ট্যান্ডার্ড পাসপোর্ট সাইজ ছবি (৩৫×৪৫ মিমি) তৈরি করছি। অনুগ্রহ করে:\n1. বাংলাদেশ ই-পাসপোর্ট ও সরকারি চাকরির আবেদন ছবির স্ট্যান্ডার্ড নির্দেশিকা\n2. ইউএস ভিসা (২×২ ইঞ্চি), সেনজেন ইউরোপ (৩৫×৪৫ মিমি) ও কানাডা ভিসার ব্যাকগ্রাউন্ড ও হেড রেশিও নিয়ম\n3. ছবি রিজেকশন এড়াতে আলোর উজ্জ্বলতা, কান ও চোখের পজিশন নিয়ে ৫টি জরুরি নিয়ম\nবুলেট পয়েন্টে স্পষ্ট করে বাংলায় বুঝিয়ে দিন।')
          : ('I am preparing a standard passport photo (35x45 mm). Please provide:\n1. Bangladesh e-Passport and government job circular photo guidelines\n2. US Visa (2x2 inch), Schengen Visa (35x45mm), and Canadian Visa rules on background and head height\n3. Top 5 crucial tips on lighting, contrast, and posture to prevent photo rejection.\nFormat clearly in bullet points.');

        var res = await UI.callAI(prompt, {
          systemInstruction: (UI.lang === 'bn')
            ? 'আপনি একজন আন্তর্জাতিক ভিসা ও সরকারি পাসপোর্ট ফটো কমপ্লায়েন্স অডিটর।'
            : 'You are an international passport and visa photo compliance auditor.'
        });

        if (res && res.success && res.text) {
          return res.text;
        }

        // Offline fallback
        if (UI.lang === 'bn') {
          return '### 🛂 অফিসিয়াল পাসপোর্ট ও ভিসা স্ট্যান্ডার্ড গাইড\n\n' +
            '**১. বাংলাদেশ ই-পাসপোর্ট ও চাকরির আবেদন:**\n' +
            '- **সাইজ:** ৩৫ × ৪৫ মিমি (৪১৩ × ৫৩১ px @ ৩০০ DPI)।\n' +
            '- **ব্যাকগ্রাউন্ড:** পরিষ্কার হালকা সাদা বা হালকা ধূসর।\n' +
            '- **হেড রেশিও:** মুখের দৈর্ঘ্য পুরো ফ্রেমের ৭০% থেকে ৮০% জুড়ে থাকতে হবে।\n\n' +
            '**২. আন্তর্জাতিক ভিসা স্ট্যান্ডার্ড:**\n' +
            '- **আমেরিকান ভিসা (US Visa):** ২ × ২ ইঞ্চি (৬০০ × ৬০০ px), সম্পূর্ণ ১০০% সাদা ব্যাকগ্রাউন্ড বাধ্যতামূলক।\n' +
            '- **ইউরোপ / সেনজেন ভিসা:** ৩৫ × ৪৫ মিমি, দুই কান স্পষ্টভাবে দৃশ্যমান ও চোখে কোনো ফ্ল্যাশ রিফ্লেকশন থাকা যাবে না।\n\n' +
            '**৩. ছবি রিজেকশন এড়াতে ৫টি সোনালী নিয়ম:**\n' +
            '- চশমার কাঁচের উপর কোনো প্রতিফলন বা গ্লেয়ার থাকা চলবে না।\n' +
            '- দুই কান এবং কপাল স্পষ্ট দেখা যেতে হবে।\n' +
            '- মুখের অভিব্যক্তি স্বাভাবিক (Neutral Expression) রাখতে হবে, দাঁত বের করে হাসা নিষেধ।\n\n' +
            '> 💡 *টিপস:* আপনার Google Gemini বা OpenAI API Key কানেক্ট করলে নির্দিষ্ট যেকোনো দেশের অ্যাম্বাসির নিয়মানুযায়ী রিয়েল-টাইম ভিসা চেকলিস্ট পাওয়া যাবে।';
        } else {
          return '### 🛂 Official Passport & Visa Compliance Guide\n\n' +
            '**1. Bangladesh e-Passport & Job Applications:**\n' +
            '- **Dimensions:** 35 × 45 mm (413 × 531 px at 300 DPI).\n' +
            '- **Background:** Off-white or plain light background.\n' +
            '- **Head Ratio:** Face must occupy 70%–80% of total frame height.\n\n' +
            '**2. International Visa Requirements:**\n' +
            '- **US Visa:** 2 × 2 inches (600 × 600 px), strictly pure white background.\n' +
            '- **Schengen / Europe:** 35 × 45 mm, both ears and chin clearly exposed.\n\n' +
            '**3. Top Rules to Prevent Rejection:**\n' +
            '- Neutral facial expression without showing teeth.\n' +
            '- Both ears and hairline should be unobstructed.\n' +
            '- Balanced dual-sided lighting without harsh facial shadows.\n\n' +
            '> 💡 *Tip:* Connect your Google Gemini or OpenAI API Key to receive country-specific embassy requirements in real time.';
        }
      }
    });

    container.appendChild(dropZone);
    container.appendChild(workspace);
    container.appendChild(passportAiBox.el);
    root.appendChild(container);
  };

    /* ---------------- ব্যাকগ্রাউন্ড রিমুভ (remove.bg স্টাইল এআই ইঞ্জিন) ---------------- */
  T['remove-background'] = function (root) {
    var file = null, img = null;
    var cutoutCanvas = null, originalCanvas = null, processedBlob = null;
    var activeTab = 'cutout'; // 'cutout' | 'original'
    var activeBg = 'transparent'; // 'transparent' | hex
    var customColorVal = '#ffffff';
    var sampleColor = null;
    var isProcessing = false;

    /* Backend remove.bg API Connector */
    function getRemoveBgKey() {
      var k = '';
      try { k = (localStorage.getItem('th_api_removebg') || '').trim(); } catch (e) { }
      return k;
    }

    // Main workspace container
    var container = UI.el('div', { class: 'stack' });
    var workspace = UI.el('div', { class: 'rbg-workspace', style: { display: 'none' } });

    // Top Bar with Tabs and Upload New button
    var topBar = UI.el('div', { class: 'rbg-top-bar' });
    var tabsWrap = UI.el('div', { class: 'rbg-tabs' });

    var tabCutout = UI.el('button', { type: 'button', class: 'rbg-tab active' },
      UI.el('span', {}, '✨ ' + tr('ব্যাকগ্রাউন্ড ছাড়া', "Removed Background"))
    );
    var tabOriginal = UI.el('button', { type: 'button', class: 'rbg-tab' },
      UI.el('span', {}, tr('আসল ছবি', "Original"))
    );
    tabsWrap.appendChild(tabCutout);
    tabsWrap.appendChild(tabOriginal);

    var uploadNewInput = UI.el('input', { type: 'file', accept: 'image/*', style: { display: 'none' } });
    uploadNewInput.addEventListener('change', function () {
      if (uploadNewInput.files && uploadNewInput.files[0]) {
        handleFileSelect(uploadNewInput.files[0]);
      }
    });

    var uploadNewBtn = UI.btn(tr('+ নতুন ছবি', "+ Upload New"), function () {
      uploadNewInput.click();
    }, { icon: 'upload', variant: 'ghost' });
    uploadNewBtn.style.padding = '6px 14px';
    uploadNewBtn.style.fontSize = '13.5px';

    topBar.appendChild(tabsWrap);
    topBar.appendChild(uploadNewBtn);
    topBar.appendChild(uploadNewInput);

    // Preview Canvas and Loading Overlay
    var previewWrap = UI.el('div', { class: 'rbg-preview-wrap' });
    var previewCanvas = UI.canvas(400, 300);
    previewCanvas.style.cursor = 'crosshair';

    var loadingOverlay = UI.el('div', { class: 'rbg-loading-overlay', style: { display: 'none' } },
      UI.el('div', { class: 'rbg-spinner' }),
      UI.el('div', { style: { fontWeight: '700', fontSize: '16px' } }, tr('✨ এআই দিয়ে ব্যাকগ্রাউন্ড রিমুভ হচ্ছে…', "✨ Removing background automatically…")),
      UI.el('div', { style: { fontSize: '13px', opacity: '0.85' } }, tr('স্টুডিও কোয়ালিটি কাটআউট তৈরি হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন', "Generating studio-quality HD cutout, please wait…"))
    );

    previewWrap.appendChild(previewCanvas);
    previewWrap.appendChild(loadingOverlay);

    // Background Color Swatches Bar
    var swatchesWrap = UI.el('div', { style: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' } });
    var swatchesLabel = UI.el('span', { style: { fontSize: '13.5px', fontWeight: '700', color: 'var(--ink)' } },
      tr('ব্যাকগ্রাউন্ড:', "Background:")
    );
    var swatchesList = UI.el('div', { class: 'rbg-color-swatches' });

    var presetColors = [
      { id: 'transparent', title: tr('স্বচ্ছ (Transparent PNG)', "Transparent (PNG)"), class: 'transparent' },
      { id: '#ffffff', title: tr('সাদা (White)', "White"), bg: '#ffffff' },
      { id: '#f1f5f9', title: tr('হালকা ধূসর (Studio Gray)', "Studio Gray"), bg: '#f1f5f9' },
      { id: '#e0f2fe', title: tr('হালকা নীল (Soft Blue)', "Soft Blue"), bg: '#e0f2fe' },
      { id: '#2557d6', title: tr('পাসপোর্ট নীল (Passport Blue)', "Passport Blue"), bg: '#2557d6' },
      { id: '#ecfdf5', title: tr('মিন্ট গ্রিন (Mint Green)', "Mint Green"), bg: '#ecfdf5' },
      { id: '#111827', title: tr('গাঢ় ডার্ক (Studio Dark)', "Studio Dark"), bg: '#111827' }
    ];

    var swatchEls = [];
    presetColors.forEach(function (preset) {
      var btn = UI.el('button', {
        type: 'button',
        class: 'rbg-swatch' + (preset.class ? ' ' + preset.class : '') + (activeBg === preset.id ? ' active' : ''),
        title: preset.title,
        'aria-label': preset.title
      });
      if (preset.bg) btn.style.background = preset.bg;
      btn.addEventListener('click', function () {
        activeBg = preset.id;
        updateSwatchesUI();
        if (activeTab !== 'cutout') {
          activeTab = 'cutout';
          updateTabsUI();
        }
        renderPreview();
      });
      swatchesList.appendChild(btn);
      swatchEls.push({ id: preset.id, el: btn });
    });

    // Custom Color Picker Swatch
    var customSwatch = UI.el('div', {
      class: 'rbg-swatch custom',
      title: tr('পছন্দের রঙ নির্বাচন করুন', "Choose custom color"),
      style: { position: 'relative' }
    });
    var customColorInput = UI.el('input', {
      type: 'color',
      class: 'rbg-swatch-color-input',
      value: '#ffffff',
      title: tr('পছন্দের রঙ নির্বাচন করুন', "Choose custom color")
    });
    customColorInput.addEventListener('input', function () {
      customColorVal = customColorInput.value;
      activeBg = customColorVal;
      updateSwatchesUI();
      if (activeTab !== 'cutout') {
        activeTab = 'cutout';
        updateTabsUI();
      }
      renderPreview();
    });
    customSwatch.appendChild(customColorInput);
    swatchesList.appendChild(customSwatch);

    function updateSwatchesUI() {
      swatchEls.forEach(function (s) {
        if (s.id === activeBg) s.el.classList.add('active');
        else s.el.classList.remove('active');
      });
      if (activeBg.startsWith('#') && !presetColors.some(function (p) { return p.id === activeBg; })) {
        customSwatch.classList.add('active');
      } else {
        customSwatch.classList.remove('active');
      }
    }

    swatchesWrap.appendChild(swatchesLabel);
    swatchesWrap.appendChild(swatchesList);

    // Fine-tune & Eraser Collapsible Section
    var fineTuneDetails = UI.el('details', { class: 'rbg-finetune' });
    var fineTuneSummary = UI.el('summary', {},
      tr('⚙️ সূক্ষ্ম সমন্বয় ও ইরেজার (প্রয়োজনে)', "⚙️ Fine-tune & Eraser (Optional)")
    );
    var fineTuneBody = UI.el('div', { class: 'rbg-finetune-body' });

    var tol = UI.el('input', { type: 'range', min: '5', max: '80', value: '25' });
    var tolV = UI.el('strong', {}, UI.n(25));
    tol.addEventListener('input', function () {
      tolV.textContent = UI.n(tol.value);
    });

    var feather = UI.el('input', { type: 'range', min: '0', max: '6', value: '2' });
    var featherV = UI.el('strong', {}, UI.n(2) + ' px');
    feather.addEventListener('input', function () {
      featherV.textContent = UI.n(feather.value) + ' px';
    });

    var reapplyBtn = UI.btn(tr('ম্যাটিং পুনরায় চালান', "Re-apply Matting"), function () {
      reapplyLocalMatting();
    }, { icon: 'sparkles', variant: 'secondary' });
    reapplyBtn.style.padding = '6px 14px';
    reapplyBtn.style.fontSize = '13px';

    fineTuneBody.appendChild(UI.el('div', { class: 'row' },
      UI.field(tr('সেনসিটিভিটি (সহনশীলতা)', "Sensitivity (Tolerance)"), UI.el('div', {}, tol, tolV)),
      UI.field(tr('স্মুথনেস (Feather)', "Edge Smoothness (Feather)"), UI.el('div', {}, feather, featherV)),
      UI.field('', reapplyBtn)
    ));
    fineTuneDetails.appendChild(fineTuneSummary);
    fineTuneDetails.appendChild(fineTuneBody);

    // Bottom Actions Bar (Badge + Download Button)
    var bottomBar = UI.el('div', { class: 'rbg-bottom-actions' });
    var resBadge = UI.el('div', { class: 'rbg-status-indicator' },
      '✓ ' + tr('রেডি', "Ready")
    );

    var isRenderingBg = false;

    function triggerDownload() {
      var ext = (activeTab === 'original' || activeBg !== 'transparent') ? 'jpg' : 'png';
      var outName = 'ToolGhor(remove-background).' + ext;
      var mime = (ext === 'jpg') ? 'image/jpeg' : 'image/png';

      // 1. Direct download if processedBlob is already ready
      if (processedBlob) {
        UI.download(processedBlob, outName);
        UI.toast(tr('✓ ডাউনলোড সম্পন্ন হচ্ছে…', "✓ Downloading image…"));
        return;
      }

      // 2. Synchronous fallback directly from previewCanvas (Preserves user gesture)
      if (previewCanvas) {
        try {
          var dataUrl = previewCanvas.toDataURL(mime, 0.95);
          if (dataUrl && dataUrl.length > 50) {
            UI.download(dataUrl, outName);
            UI.toast(tr('✓ ডাউনলোড সম্পন্ন হচ্ছে…', "✓ Downloading image…"));
            return;
          }
        } catch (e) {
          console.warn('Canvas toDataURL failed, attempting toBlob:', e);
        }

        if (typeof previewCanvas.toBlob === 'function') {
          previewCanvas.toBlob(function (b) {
            if (b) {
              UI.download(b, outName);
              UI.toast(tr('✓ ডাউনলোড সম্পন্ন হচ্ছে…', "✓ Downloading image…"));
            } else {
              UI.toast(tr('ডাউনলোড সম্পন্ন করা যায়নি, ছবিটি পুনরায় আপলোড করুন', 'Could not complete download, please re-upload image'), 'error');
            }
          }, mime, 0.95);
          return;
        }
      }

      UI.toast(tr('ডাউনলোড সম্পন্ন করা যায়নি, অনুগ্রহ করে ছবিটি পুনরায় নির্বাচন করুন', 'Could not complete download, please re-select image'), 'error');
    }

    var downloadBtn = UI.btn(tr('ডাউনলোড (PNG)', "Download (PNG)"), triggerDownload, { icon: 'download' });
    downloadBtn.style.padding = '10px 24px';
    downloadBtn.style.fontSize = '15px';
    downloadBtn.style.fontWeight = '700';

    bottomBar.appendChild(resBadge);
    bottomBar.appendChild(downloadBtn);

    // Assemble Workspace
    workspace.appendChild(topBar);
    workspace.appendChild(previewWrap);
    workspace.appendChild(swatchesWrap);
    workspace.appendChild(fineTuneDetails);
    workspace.appendChild(bottomBar);

    // Tab switching handlers
    tabCutout.addEventListener('click', function () {
      activeTab = 'cutout';
      updateTabsUI();
      renderPreview();
    });
    tabOriginal.addEventListener('click', function () {
      activeTab = 'original';
      updateTabsUI();
      renderPreview();
    });

    function updateTabsUI() {
      if (activeTab === 'cutout') {
        tabCutout.classList.add('active');
        tabOriginal.classList.remove('active');
        swatchesWrap.style.opacity = '1';
        swatchesWrap.style.pointerEvents = 'auto';
      } else {
        tabOriginal.classList.add('active');
        tabCutout.classList.remove('active');
        swatchesWrap.style.opacity = '0.5';
        swatchesWrap.style.pointerEvents = 'none';
      }
    }

    // Auto detect background from borders
    function autoDetectBg(data, w, h) {
      if (sampleColor) return sampleColor;
      var samples = [
        0,
        (w - 1) * 4,
        ((h - 1) * w) * 4,
        ((h - 1) * w + (w - 1)) * 4,
        Math.floor(w / 2) * 4
      ];
      var r = 0, g = 0, b = 0, count = 0;
      samples.forEach(function (idx) {
        r += data[idx]; g += data[idx + 1]; b += data[idx + 2]; count++;
      });
      return [Math.round(r / count), Math.round(g / count), Math.round(b / count)];
    }

    // Fast Flood Fill Matting
    function runFloodFillMatting(sourceImg, targetColor, tolerance, featherRadius) {
      var origW = sourceImg.naturalWidth || sourceImg.width;
      var origH = sourceImg.naturalHeight || sourceImg.height;
      var maxDim = 1600;
      var scale = Math.min(1, maxDim / Math.max(origW, origH));
      var w = Math.round(origW * scale), h = Math.round(origH * scale);

      var c = UI.canvas(w, h), ctx = c.getContext('2d');
      ctx.drawImage(sourceImg, 0, 0, w, h);
      var imgData = ctx.getImageData(0, 0, w, h);
      var d = imgData.data;

      var bg = targetColor || autoDetectBg(d, w, h);
      var threshold = tolerance * 3;
      var tSq = threshold * threshold;

      var visited = new Uint8Array(w * h);
      var queue = new Int32Array(w * h);
      var qHead = 0, qTail = 0;

      function push(x, y) {
        if (x < 0 || x >= w || y < 0 || y >= h) return;
        var idx = y * w + x;
        if (visited[idx]) return;
        visited[idx] = 1;
        var p = idx * 4;
        var dr = d[p] - bg[0], dg = d[p + 1] - bg[1], db = d[p + 2] - bg[2];
        if ((dr * dr + dg * dg + db * db) <= tSq) {
          queue[qTail++] = idx;
          d[p + 3] = 0;
        }
      }

      for (var x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
      for (var y = 0; y < h; y++) { push(0, y); push(w - 1, y); }

      while (qHead < qTail) {
        var curr = queue[qHead++];
        var cx = curr % w, cy = (curr / w) | 0;
        push(cx + 1, cy);
        push(cx - 1, cy);
        push(cx, cy + 1);
        push(cx, cy - 1);
      }

      if (featherRadius > 0) {
        for (var y = 1; y < h - 1; y++) {
          for (var x = 1; x < w - 1; x++) {
            var i = (y * w + x) * 4;
            if (d[i + 3] > 0) {
              var trans = 0;
              if (d[i - 4 + 3] === 0) trans++;
              if (d[i + 4 + 3] === 0) trans++;
              if (d[i - w * 4 + 3] === 0) trans++;
              if (d[i + w * 4 + 3] === 0) trans++;
              if (trans > 0) {
                d[i + 3] = Math.round(255 * (1 - (trans / 4) * (featherRadius / 6)));
              }
            }
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);

      // If scaled, restore to original dimensions
      if (scale < 1) {
        var fullCanvas = UI.canvas(origW, origH);
        var fctx = fullCanvas.getContext('2d');
        fctx.imageSmoothingEnabled = true;
        fctx.imageSmoothingQuality = 'high';
        fctx.drawImage(c, 0, 0, origW, origH);
        return fullCanvas;
      }
      return c;
    }

    function reapplyLocalMatting() {
      if (!img) return;
      loadingOverlay.style.display = 'flex';
      setTimeout(function () {
        cutoutCanvas = runFloodFillMatting(img, sampleColor, +tol.value, +feather.value);
        activeTab = 'cutout';
        updateTabsUI();
        renderPreview();
        loadingOverlay.style.display = 'none';
        UI.toast(tr('✓ ম্যাটিং সফলভাবে আপডেট হয়েছে', "✓ Matting updated successfully"));
      }, 50);
    }

    // Render current active tab and background to previewCanvas
    async function renderPreview() {
      if (!img) return;
      isRenderingBg = true;
      downloadBtn.disabled = false;
      downloadBtn.removeAttribute('disabled');

      try {
        var w = img.naturalWidth, h = img.naturalHeight;
        previewCanvas.width = w;
        previewCanvas.height = h;
        var pctx = previewCanvas.getContext('2d');
        pctx.clearRect(0, 0, w, h);

        if (activeTab === 'original' && originalCanvas) {
          pctx.drawImage(originalCanvas, 0, 0);
          UI.clear(downloadBtn);
          UI.add(downloadBtn, UI.icon('download', 18));
          UI.add(downloadBtn, ' ' + tr('আসল ছবি ডাউনলোড (JPG)', "Download Original (JPG)"));
          try {
            processedBlob = await UI.toBlob(previewCanvas, 'image/jpeg', 0.95);
          } catch (e) {
            processedBlob = null;
          }
          resBadge.textContent = '✓ ' + w + ' × ' + h + ' px • ' + tr('আসল ছবি', "Original");
          return;
        }

        if (cutoutCanvas) {
          if (activeBg !== 'transparent') {
            pctx.fillStyle = activeBg;
            pctx.fillRect(0, 0, w, h);
          }
          pctx.drawImage(cutoutCanvas, 0, 0, w, h);

          var isPng = (activeBg === 'transparent');
          var outMime = isPng ? 'image/png' : 'image/jpeg';
          try {
            processedBlob = await UI.toBlob(previewCanvas, outMime, 0.95);
          } catch (e) {
            console.warn('Preview toBlob warning:', e);
            processedBlob = null;
          }

          UI.clear(downloadBtn);
          UI.add(downloadBtn, UI.icon('download', 18));
          UI.add(downloadBtn, ' ' + (isPng ? tr('ডাউনলোড (PNG)', "Download (PNG)") : tr('ডাউনলোড (JPG)', "Download (JPG)")));
          resBadge.textContent = '✓ ' + w + ' × ' + h + ' px • ' + (isPng ? 'HD Transparent PNG' : 'HD Solid JPG');
        }
      } catch (err) {
        console.error('renderPreview error:', err);
      } finally {
        isRenderingBg = false;
        downloadBtn.disabled = false;
        downloadBtn.removeAttribute('disabled');
        downloadBtn.removeAttribute('aria-disabled');
      }
    }

    // Comprehensive 3-tier cutout pipeline
    async function processImagePipeline(imageEl, imageFile) {
      isProcessing = true;
      loadingOverlay.style.display = 'flex';

      try {
        // 1. Prepare original canvas
        originalCanvas = UI.canvas(imageEl.naturalWidth, imageEl.naturalHeight);
        originalCanvas.getContext('2d').drawImage(imageEl, 0, 0);

        var resultCanvas = null;

        // Tier 1: remove.bg Studio AI API
        var rbgKey = getRemoveBgKey();
        if (imageFile) {
          try {
            var fd = new FormData();
            fd.append('image_file', imageFile);
            fd.append('size', 'auto');

            // 1. Try secure server proxy
            var res = await fetch('/api/remove-bg', {
              method: 'POST',
              body: fd
            });

            // 2. Direct API call fallback if proxy returned non-200
            if (!res.ok && rbgKey) {
              var directFd = new FormData();
              directFd.append('image_file', imageFile);
              directFd.append('size', 'auto');
              res = await fetch('https://api.remove.bg/v1.0/removebg', {
                method: 'POST',
                headers: { 'X-Api-Key': rbgKey },
                body: directFd
              });
            }

            if (res && res.ok) {
              var blob = await res.blob();
              var aiImg = await UI.readImage(blob);
              resultCanvas = UI.canvas(aiImg.naturalWidth, aiImg.naturalHeight);
              resultCanvas.getContext('2d').drawImage(aiImg, 0, 0);
            }
          } catch (e) {
            console.warn('remove.bg API call error, using local AI model:', e);
          }
        }

        // Tier 2: In-browser Deep Neural Network (Google MediaPipe)
        if (!resultCanvas) {
          try {
            resultCanvas = await segmentSubjectWithAI(imageEl);
          } catch (e) {
            console.warn('MediaPipe segmentation error:', e);
          }
        }

        // Tier 3: Adaptive Flood Fill Matting fallback
        if (!resultCanvas) {
          resultCanvas = runFloodFillMatting(imageEl, sampleColor, +tol.value, +feather.value);
        }

        cutoutCanvas = resultCanvas;
      } catch (pipelineErr) {
        console.error('Cutout pipeline error:', pipelineErr);
        if (!cutoutCanvas) {
          cutoutCanvas = runFloodFillMatting(imageEl, sampleColor, +tol.value, +feather.value);
        }
      } finally {
        loadingOverlay.style.display = 'none';
        isProcessing = false;
        activeTab = 'cutout';
        updateTabsUI();
        await renderPreview();
      }
    }

    async function handleFileSelect(f) {
      if (!f) return;
      if (f.size > 25 * 1024 * 1024) {
        UI.toast(tr('ছবির সাইজ ২৫ মেগাবাইটের বেশি হতে পারবে না। অনুগ্রহ করে ছোট ছবি ব্যবহার করুন।', 'Image size cannot exceed 25MB. Please choose a smaller image.'), 'error');
        return;
      }
      file = f;
      sampleColor = null;
      try {
        img = await UI.readImage(file);
      } catch (err) {
        UI.toast(tr('ছবি লোড করা যায়নি', "Could not read image file"));
        return;
      }
      if (dropZone) dropZone.style.display = 'none';
      workspace.style.display = 'flex';
      await processImagePipeline(img, file);
    }

    // Inviting dropzone matching remove.bg
    var dropZone = UI.dropzone({
      multiple: false,
      allowFolder: false,
      accept: 'image/*',
      onFiles: function (files) {
        if (files && files[0]) handleFileSelect(files[0]);
      }
    });
    dropZone.style.padding = '44px 20px';

    // Global Paste Listener (Ctrl+V) support
    function onPaste(e) {
      if (!e.clipboardData || !e.clipboardData.items) return;
      var items = e.clipboardData.items;
      for (var i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          var blob = items[i].getAsFile();
          if (blob) {
            handleFileSelect(blob);
            break;
          }
        }
      }
    }
    document.addEventListener('paste', onPaste);

    // AI Background & Profile Stylist
    var bgAiBox = UI.renderAiBox({
      title: tr('এআই কাটআউট ও প্রোফাইল ব্যাকগ্রাউন্ড স্টাইলিস্ট', 'AI Cutout & Profile Background Stylist'),
      subtitle: tr('লিংকডইন, সিভি বা ই-কমার্সের জন্য নিখুঁত ব্যাকগ্রাউন্ড কালার ও কনট্রাস্ট নির্বাচন করুন', 'Recommended background styling, edge smoothing, and contrast optimization for profile photos & products'),
      btnText: tr('✨ এআই স্টাইলিং পরামর্শ দেখুন', '✨ Get AI Background Advice'),
      onGenerate: async function () {
        var prompt = (UI.lang === 'bn')
          ? ('আমি একটি ছবির ব্যাকগ্রাউন্ড পরিবর্তন বা রিমুভ করছি। অনুগ্রহ করে:\n1. পেশাদার লিংকডইন ও সিভি ছবির জন্য সেরা ৩টি ব্যাকগ্রাউন্ড কালার\n2. ফেসবুক/ইনস্টাগ্রাম ডিপির জন্য ট্রেন্ডি ব্যাকগ্রাউন্ড আইডিয়া\n3. দারাজ/অ্যামাজন ই-কমার্স প্রোডাক্ট ছবির জন্য সঠিক ব্যাকগ্রাউন্ড স্ট্যান্ডার্ড\nপয়েন্ট আকারে বাংলায় গুছিয়ে দিন।')
          : ('I am removing or replacing the background of an image. Please provide:\n1. Top 3 background colors for professional LinkedIn and CV avatars\n2. Trendy modern background ideas for social media DP\n3. Industry standards for eCommerce (Amazon/Daraz) product photos.\nFormat clearly in bullet points.');

        var res = await UI.callAI(prompt, {
          systemInstruction: (UI.lang === 'bn')
            ? 'আপনি একজন পেশাদার গ্রাফিক ডিজাইনার ও ব্র্যান্ডিং কনসালট্যান্ট।'
            : 'You are a professional graphic designer and photo branding consultant.'
        });

        if (res && res.success && res.text) {
          return res.text;
        }

        // Offline fallback
        if (UI.lang === 'bn') {
          return '### 🎨 পেশাদার ব্যাকগ্রাউন্ড কালার গাইড\n\n' +
            '**১. সিভি ও লিংকডইন প্রফেশনাল অ্যাভাটার:**\n' +
            '- **সফট নেভি বা স্লেট ব্লু (#1e293b / #2563eb):** আত্মবিশ্বাস, স্থায়িত্ব ও করপোরেট প্রফেশনালিজম প্রকাশ করে।\n' +
            '- **মিনিমাল অফ-হোয়াইট বা হালকা গ্রে (#f8fafc / #e2e8f0):** পরিষ্কার, আকর্ষণীয় ও আধুনিক লুক দেয়।\n\n' +
            '**২. ই-কমার্স প্রোডাক্ট লিস্টিং (Daraz / Amazon / Shopify):**\n' +
            '- **১০০% খাঁটি সাদা (#ffffff):** পণ্যের আসল রং স্পষ্ট ফুটে ওঠে এবং প্রধান অনলাইন মার্কেটপ্লেসের বাধ্যতামূলক নিয়ম।\n\n' +
            '> 💡 *টিপস:* আপনার Google Gemini বা OpenAI API Key কানেক্ট করলে আপনার পণ্যের ক্যাটাগরি বা পেশা অনুযায়ী কাস্টম কালার প্যালেট তৈরি করে দেবে।';
        } else {
          return '### 🎨 Professional Background Color Guide\n\n' +
            '**1. LinkedIn & Resume Headshots:**\n' +
            '- **Slate Blue / Deep Navy (#1e293b / #2563eb):** Exudes confidence and executive presence.\n' +
            '- **Neutral Light Grey (#f1f5f9):** Clean, modern, and keeps the focus entirely on your face.\n\n' +
            '**2. eCommerce Product Listings:**\n' +
            '- **Pure White (#ffffff):** The official standard for Amazon, Shopify, and Daraz product catalogs.\n\n' +
            '> 💡 *Tip:* Connect your Google Gemini or OpenAI API Key to get custom color palette recommendations matching your specific brand.';
        }
      }
    });

    container.appendChild(dropZone);
    container.appendChild(workspace);
    container.appendChild(bgAiBox.el);
    root.appendChild(container);
  };
})();
