/* পিডিএফ টুলস */
(function () {
  var UI = window.UI, T = window.Tools;

  function pdfjs() {
    var l = window.pdfjsLib || window['pdfjs-dist/build/pdf'];
    if (!l) throw new Error(tr('পিডিএফ ইঞ্জিন লোড হয়নি। পেজ রিফ্রেশ করুন।', "The PDF engine did not load. Please refresh the page."));
    l.GlobalWorkerOptions.workerSrc = UI.ROOT + 'assets/vendor/pdf.worker.min.js';
    return l;
  }
  async function openPdfJs(file) {
    var buf = await file.arrayBuffer();
    try { return await pdfjs().getDocument({ data: new Uint8Array(buf) }).promise; }
    catch (e) {
      if (e && e.name === 'PasswordException') throw new Error(tr('এই পিডিএফে পাসওয়ার্ড দেওয়া আছে, তাই খোলা যায়নি।', "This PDF is password-protected, so it could not be opened."));
      if (window.console) console.warn('pdf.js error:', e);
      throw new Error(tr('পিডিএফটি পড়া যায়নি। ফাইলটি নষ্ট হতে পারে।', "Could not read the PDF. The file may be damaged."));
    }
  }
  /* "1-3, 5, 8-" → [{label, idx:[0,1,2]}, ...] */
  function parseRanges(str, n) {
    var s = UI.toEn(str).replace(/\s*-\s*/g, '-').replace(/[–—]/g, '-');
    var parts = s.split(/[,\s]+/).filter(Boolean);
    if (!parts.length) throw new Error(tr('পৃষ্ঠার রেঞ্জ লিখুন, যেমন 1-3, 5', "Enter a page range, for example 1-3, 5"));
    return parts.map(function (p) {
      var a, b, m = /^(\d*)-(\d*)$/.exec(p);
      if (m) { if (!m[1] && !m[2]) throw new Error(tr('রেঞ্জ ঠিক নেই: ', "Invalid range: ") + p); a = m[1] ? +m[1] : 1; b = m[2] ? +m[2] : n; }
      else if (/^\d+$/.test(p)) { a = b = +p; }
      else throw new Error(tr('রেঞ্জ ঠিক নেই: "', "Invalid range: \"") + p + tr('"। এভাবে লিখুন: 1-3, 5', "\". Write it like this: 1-3, 5"));
      if (a < 1 || b > n || a > b) throw new Error('"' + p + tr('" ঠিক নেই। এই পিডিএফে মোট ', "\" is not valid. This PDF has ") + UI.n(n) + tr(' পৃষ্ঠা আছে।', " pages in total."));
      var idx = []; for (var i = a; i <= b; i++) idx.push(i - 1);
      return { label: p, idx: idx };
    });
  }
  function pad(i, n) { var w = String(n).length; var s = String(i); while (s.length < w) s = '0' + s; return s; }
  function pdfBlob(bytes) { return new Blob([bytes], { type: 'application/pdf' }); }

  /* ---------------- মার্জ ---------------- */
  T['merge-pdf'] = function (root) {
    var files = [], out = UI.el('div');
    var mergeBtn = UI.btn(tr('মার্জ করুন', "Merge"), run, { icon: 'merge', disabled: true });
    var list = UI.sortList({
      items: files,
      label: function (it) {
        return UI.el('span', { class: 'fname' }, it.file.name,
          UI.el('small', {}, UI.fmtSize(it.file.size) + (it.pages ? ' · ' + UI.n(it.pages) + tr(' পৃষ্ঠা', " pages") : '') + (it.bad ? tr(' · পড়া যায়নি (পাসওয়ার্ড বা নষ্ট)', " · could not be read (password-protected or damaged)") : '')));
      },
      onChange: function () { mergeBtn.disabled = files.length < 2; }
    });
    var drop = UI.dropzone({
      accept: 'application/pdf,.pdf', multiple: true, label: tr('পিডিএফ ফাইল বেছে নিন', "Choose PDF files"),
      onFiles: function (fs) {
        fs.forEach(function (f) {
          var it = { file: f }; files.push(it);
          f.arrayBuffer().then(function (b) { return PDFLib.PDFDocument.load(b); })
            .then(function (d) { it.pages = d.getPageCount(); list.redraw(); })
            .catch(function () { it.bad = true; list.redraw(); });
        });
        UI.clear(out); list.redraw();
      }
    });
    async function run() {
      UI.clear(out); var prog = UI.progress(); out.appendChild(prog); mergeBtn.disabled = true;
      try {
        var merged = await PDFLib.PDFDocument.create(), total = 0;
        for (var i = 0; i < files.length; i++) {
          prog.set(i / files.length * 100, UI.n(i + 1) + '/' + UI.n(files.length) + ': ' + files[i].file.name);
          await UI.yield();
          var src;
          try { src = await PDFLib.PDFDocument.load(await files[i].file.arrayBuffer()); }
          catch (e) { throw new Error('"' + files[i].file.name + tr('" মার্জ করা যায়নি (পাসওয়ার্ড দেওয়া বা নষ্ট ফাইল হতে পারে)।', "\" could not be merged (it may be password-protected or damaged).")); }
          var pages = await merged.copyPages(src, src.getPageIndices());
          pages.forEach(function (p) { merged.addPage(p); }); total += pages.length;
        }
        prog.set(100, tr('সেভ হচ্ছে…', "Saving…"));
        var blob = pdfBlob(await merged.save());
        UI.done(out, blob, 'ToolGhor(merge-pdf).pdf', tr('✓ মার্জ হয়েছে: ', "✓ Merged: ") + UI.n(files.length) + tr('টি ফাইল, মোট ', " files, ") + UI.n(total) + tr(' পৃষ্ঠা।', " pages in total."));
      } catch (e) { UI.clear(out); out.appendChild(UI.notice('err', UI.err(e))); }
      mergeBtn.disabled = files.length < 2;
    }
    root.appendChild(UI.el('div', { class: 'stack' }, drop, list,
      UI.el('p', { class: 'lbl' }, tr('কমপক্ষে ২টি ফাইল লাগবে। উপরে/নিচে তীর দিয়ে ক্রম ঠিক করুন।', "You need at least 2 files. Use the up/down arrows to set the order.")), mergeBtn, out));
  };

  /* ---------------- স্প্লিট ---------------- */
  T['split-pdf'] = function (root) {
    var st = null, mode = 'range', out = UI.el('div'), box = UI.el('div', { class: 'stack' });
    var drop = UI.dropzone({
      accept: 'application/pdf,.pdf', label: tr('পিডিএফ ফাইল বেছে নিন', "Choose PDF files"),
      onFiles: async function (fs) {
        UI.clear(out); UI.clear(box);
        try {
          var d = await PDFLib.PDFDocument.load(await fs[0].arrayBuffer());
          st = { file: fs[0], doc: d, n: d.getPageCount() }; form();
        } catch (e) { out.appendChild(UI.notice('err', tr('পিডিএফটি খোলা যায়নি (পাসওয়ার্ড দেওয়া বা নষ্ট হতে পারে)।', "Could not open the PDF (it may be password-protected or damaged)."))); }
      }
    });
    function form() {
      var rangeIn = UI.el('input', { type: 'text', value: '1', placeholder: tr('যেমন: 1-3, 5, 8-', "e.g. 1-3, 5, 8-") });
      var sep = UI.el('input', { type: 'checkbox' });
      var rangeWrap = UI.el('div', { class: 'stack' },
        UI.field(tr('কোন কোন পৃষ্ঠা নেবেন?', "Which pages do you want?"), rangeIn, tr('কমা দিয়ে আলাদা করুন। "8-" মানে ৮ থেকে শেষ পর্যন্ত।', "Separate with commas. \"8-\" means page 8 to the end.")),
        UI.el('label', { class: 'check' }, sep, tr(' প্রতিটি রেঞ্জ আলাদা পিডিএফে দিন (ZIP)', " Put each range in its own PDF (ZIP)")));
      var seg = UI.seg([{ value: 'range', label: tr('নির্দিষ্ট পৃষ্ঠা আলাদা করুন', "Extract specific pages") }, { value: 'each', label: tr('প্রতিটি পৃষ্ঠা আলাদা ফাইলে', "Every page as its own file") }], mode, function (v) { mode = v; rangeWrap.hidden = v === 'each'; });
      rangeWrap.hidden = mode === 'each';
      var go = UI.btn(tr('স্প্লিট করুন', "Split"), async function () {
        UI.clear(out); var prog = UI.progress(); out.appendChild(prog); go.disabled = true;
        try {
          var base = UI.baseName(st.file.name), entries = [];
          async function make(idx) {
            var nd = await PDFLib.PDFDocument.create();
            var pages = await nd.copyPages(st.doc, idx);
            pages.forEach(function (p) { nd.addPage(p); });
            return pdfBlob(await nd.save());
          }
          if (mode === 'each') {
            for (var i = 0; i < st.n; i++) {
              prog.set(i / st.n * 100, tr('পৃষ্ঠা ', "Page ") + UI.n(i + 1) + '/' + UI.n(st.n));
              await UI.yield();
              entries.push({ name: 'ToolGhor(split-pdf-page-' + pad(i + 1, st.n) + ').pdf', blob: await make([i]) });
            }
          } else {
            var parts = parseRanges(rangeIn.value, st.n);
            if (sep.checked && parts.length > 1) {
              for (var k = 0; k < parts.length; k++) {
                prog.set(k / parts.length * 100, '');
                await UI.yield();
                entries.push({ name: 'ToolGhor(split-pdf-' + parts[k].label + ').pdf', blob: await make(parts[k].idx) });
              }
            } else {
              var all = []; parts.forEach(function (p) { all = all.concat(p.idx); });
              var b = await make(all);
              UI.done(out, b, 'ToolGhor(split-pdf).pdf', '✓ ' + UI.n(all.length) + tr(' পৃষ্ঠার নতুন পিডিএফ তৈরি হয়েছে।', " pages extracted into a new PDF."));
              go.disabled = false; return;
            }
          }
          prog.set(100, tr('ZIP হচ্ছে…', "Creating ZIP…"));
          var z = await UI.zip(entries);
          UI.done(out, z, 'ToolGhor(split-pdf).zip', '✓ ' + UI.n(entries.length) + tr('টি পিডিএফ তৈরি হয়েছে (ZIP ফাইলে)।', " PDFs created (in a ZIP file)."));
        } catch (e) { UI.clear(out); out.appendChild(UI.notice('err', UI.err(e))); }
        go.disabled = false;
      }, { icon: 'split' });
      box.appendChild(UI.notice('info', st.file.name + tr(' · মোট ', " · Total ") + UI.n(st.n) + tr(' পৃষ্ঠা · ', " pages · ") + UI.fmtSize(st.file.size)));
      box.appendChild(seg); box.appendChild(rangeWrap); box.appendChild(go);
    }
    root.appendChild(UI.el('div', { class: 'stack' }, drop, box, out));
  };

  /* ---------------- কমপ্রেস ---------------- */
  T['compress-pdf'] = function (root) {
    var file = null, out = UI.el('div'), info = UI.el('div');
    var presets = {
      high: { scale: 2, q: 0.8 },
      med: { scale: 1.5, q: 0.65 },
      low: { scale: 1, q: 0.5 }
    };
    var level = UI.seg([
      { value: 'high', label: tr('কম কমপ্রেস (ভালো মান)', "Light compression (best quality)") },
      { value: 'med', label: tr('মাঝারি (প্রস্তাবিত)', "Medium (recommended)") },
      { value: 'low', label: tr('বেশি কমপ্রেস (ছোট সাইজ)', "Strong compression (smallest size)") }], 'med');
    var go = UI.btn(tr('কমপ্রেস করুন', "Compress"), run, { icon: 'minimize-2', disabled: true });
    var drop = UI.dropzone({
      accept: 'application/pdf,.pdf', label: tr('পিডিএফ ফাইল বেছে নিন', "Choose PDF files"),
      onFiles: function (fs) { file = fs[0]; UI.clear(out); UI.clear(info); info.appendChild(UI.notice('info', file.name + ' · ' + UI.fmtSize(file.size))); go.disabled = false; }
    });
    async function run() {
      var p = presets[level.get()];
      UI.clear(out); var prog = UI.progress(); out.appendChild(prog); go.disabled = true;
      try {
        var pdf = await openPdfJs(file), n = pdf.numPages;
        var doc = await PDFLib.PDFDocument.create();
        for (var i = 1; i <= n; i++) {
          prog.set((i - 1) / n * 100, tr('পৃষ্ঠা ', "Page ") + UI.n(i) + '/' + UI.n(n));
          await UI.yield();
          var page = await pdf.getPage(i);
          var v1 = page.getViewport({ scale: 1 }), v = page.getViewport({ scale: p.scale });
          var c = UI.canvas(v.width, v.height), ctx = c.getContext('2d');
          ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
          await page.render({ canvasContext: ctx, viewport: v }).promise;
          var jb = await UI.toBlob(c, 'image/jpeg', p.q);
          var img = await doc.embedJpg(new Uint8Array(await jb.arrayBuffer()));
          var pg = doc.addPage([v1.width, v1.height]);
          pg.drawImage(img, { x: 0, y: 0, width: v1.width, height: v1.height });
          page.cleanup(); c.width = c.height = 0;
        }
        prog.set(100, tr('সেভ হচ্ছে…', "Saving…"));
        var blob = pdfBlob(await doc.save());
        var saved = Math.round((1 - blob.size / file.size) * 100);
        var msg = '✓ ' + UI.fmtSize(file.size) + ' → ' + UI.fmtSize(blob.size) + (saved > 0 ? ' (' + UI.n(saved) + tr('% ছোট)', "% smaller)") : '');
        UI.done(out, blob, 'ToolGhor(compress-pdf).pdf', msg);
        if (saved <= 0) out.firstChild.insertBefore(UI.notice('warn', tr('এই পিডিএফ আগে থেকেই ছোট, কমপ্রেসে সাইজ কমেনি। অরিজিনাল ফাইলটি রাখাই ভালো। চাইলে "বেশি কমপ্রেস" চেষ্টা করুন।', "This PDF is already small and compression did not reduce it. Keeping the original is better. You can also try \"Strong compression\".")), out.firstChild.firstChild);
      } catch (e) { UI.clear(out); out.appendChild(UI.notice('err', UI.err(e))); }
      go.disabled = false;
    }
    root.appendChild(UI.el('div', { class: 'stack' },
      UI.notice('warn', tr('নোট: এই পদ্ধতিতে প্রতিটি পৃষ্ঠা ছবিতে পরিণত হয়ে নতুন পিডিএফ হয়, তাই লেখা সিলেক্ট/কপি করা যাবে না। স্ক্যান করা বা ছবিভরা পিডিএফের জন্য সবচেয়ে ভালো।', "Note: this method turns every page into an image and builds a new PDF, so you will not be able to select or copy the text. It works best on scanned or image-heavy PDFs.")),
      drop, info, UI.el('div', { class: 'stack' }, UI.el('span', { class: 'lbl' }, tr('কমপ্রেসের মাত্রা', "Compression level")), level), go, out));
  };

  /* ---------------- পিডিএফ → ছবি / JPG ---------------- */
  function pdfToImages(root, fixedJpg) {
    var file = null, out = UI.el('div'), info = UI.el('div'), items = [];
    var fmt = UI.seg([{ value: 'png', label: tr('PNG (পরিষ্কার)', "PNG (sharp)") }, { value: 'jpg', label: tr('JPG (ছোট সাইজ)', "JPG (smaller size)") }], 'png');
    var dpi = UI.select([{ value: 100, label: tr('দ্রুত (১০০ DPI)', "Fast (100 DPI)") }, { value: 150, label: tr('স্ট্যান্ডার্ড (১৫০ DPI)', "Standard (150 DPI)") }, { value: 200, label: tr('হাই কোয়ালিটি (২০০ DPI)', "High quality (200 DPI)") }], 150);
    var range = UI.el('input', { type: 'text', placeholder: tr('খালি রাখলে সব পৃষ্ঠা', "Leave empty for all pages") });
    var go = UI.btn(fixedJpg ? tr('JPG বানান', "Create JPG") : tr('ছবি বানান', "Create images"), run, { icon: 'file-image', disabled: true });
    var drop = UI.dropzone({
      accept: 'application/pdf,.pdf', label: tr('পিডিএফ ফাইল বেছে নিন', "Choose PDF files"),
      onFiles: function (fs) { file = fs[0]; UI.clear(out); UI.clear(info); info.appendChild(UI.notice('info', file.name + ' · ' + UI.fmtSize(file.size))); go.disabled = false; }
    });
    async function run() {
      UI.clear(out); items.forEach(function (it) { URL.revokeObjectURL(it.url); }); items = [];
      var prog = UI.progress(); out.appendChild(prog); go.disabled = true;
      var grid = UI.el('div', { class: 'previews' }), zipRow = UI.el('div', { class: 'row' });
      try {
        var pdf = await openPdfJs(file), n = pdf.numPages, pages = [];
        if (range.value.trim()) {
          var seen = {}; parseRanges(range.value, n).forEach(function (p) { p.idx.forEach(function (i) { if (!seen[i]) { seen[i] = 1; pages.push(i + 1); } }); });
          pages.sort(function (a, b) { return a - b; });
        } else for (var q = 1; q <= n; q++) pages.push(q);
        var jpg = fixedJpg || fmt.get() === 'jpg', ext = jpg ? 'jpg' : 'png', base = UI.baseName(file.name);
        out.appendChild(grid);
        for (var i = 0; i < pages.length; i++) {
          prog.set(i / pages.length * 100, tr('পৃষ্ঠা ', "Page ") + UI.n(pages[i]) + ' (' + UI.n(i + 1) + '/' + UI.n(pages.length) + ')');
          await UI.yield();
          var page = await pdf.getPage(pages[i]);
          var s = +dpi.value / 72, v0 = page.getViewport({ scale: 1 });
          s = Math.min(s, 8000 / Math.max(v0.width, v0.height));
          var v = page.getViewport({ scale: s });
          var c = UI.canvas(v.width, v.height), ctx = c.getContext('2d');
          ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
          await page.render({ canvasContext: ctx, viewport: v }).promise;
          var blob = await UI.toBlob(c, jpg ? 'image/jpeg' : 'image/png', 0.92);
          var singlePage = pages.length === 1;
          var pageSuffix = singlePage ? '' : ('-page-' + pad(pages[i], n));
          var toolName = fixedJpg ? 'pdf-to-jpg' : 'pdf-to-image';
          var it = { name: 'ToolGhor(' + toolName + pageSuffix + ').' + ext, blob: blob, url: URL.createObjectURL(blob) };
          items.push(it);
          (function (it, pageNo) {
            grid.appendChild(UI.el('div', { class: 'pv' },
              UI.el('img', { src: it.url, alt: tr('পৃষ্ঠা ', "Page ") + pageNo }),
              UI.el('small', {}, tr('পৃষ্ঠা ', "Page ") + UI.n(pageNo) + ' · ' + UI.fmtSize(it.blob.size)),
              UI.btn(tr('ডাউনলোড', "Download"), function () { UI.download(it.blob, it.name); }, { cls: 'sm', icon: 'download', iconSize: 16 })));
          })(it, pages[i]);
          page.cleanup(); c.width = c.height = 0;
        }
        prog.set(100, '✓ ' + UI.n(items.length) + tr('টি ছবি তৈরি হয়েছে', " images created"));
        if (items.length > 1) {
          zipRow.appendChild(UI.btn(tr('সব ছবি ZIP হিসেবে ডাউনলোড', "Download all images as ZIP"), async function () {
            var z = await UI.zip(items.map(function (x) { return { name: x.name, blob: x.blob }; }));
            var toolName = fixedJpg ? 'pdf-to-jpg' : 'pdf-to-image';
            UI.download(z, 'ToolGhor(' + toolName + ').zip');
          }, { icon: 'file-archive' }));
          out.insertBefore(zipRow, grid);
        }
      } catch (e) { UI.clear(out); out.appendChild(UI.notice('err', UI.err(e))); }
      go.disabled = false;
    }
    var opts = UI.el('div', { class: 'row' },
      fixedJpg ? null : UI.el('div', { class: 'field' }, UI.el('span', { class: 'lbl' }, tr('ছবির ফরম্যাট', "Image format")), fmt),
      UI.field(tr('মান (রেজোলিউশন)', "Quality (resolution)"), dpi, null, 'fit'),
      UI.field(tr('নির্দিষ্ট পৃষ্ঠা (ঐচ্ছিক)', "Specific pages (optional)"), range, tr('যেমন: 1-3, 5', "e.g. 1-3, 5")));
    root.appendChild(UI.el('div', { class: 'stack' }, drop, info, opts, go, out));
  }
  T['pdf-to-image'] = function (root) { pdfToImages(root, false); };
  T['pdf-to-jpg'] = function (root) { pdfToImages(root, true); };

  /* ---------------- ছবি → পিডিএফ ---------------- */
  T['jpg-to-pdf'] = function (root) {
    var items = [], out = UI.el('div');
    var size = UI.select([{ value: 'a4', label: 'A4' }, { value: 'letter', label: 'Letter' }, { value: 'fit', label: tr('ছবির মাপ অনুযায়ী', "Match the image size") }], 'a4');
    var orient = UI.select([{ value: 'auto', label: tr('স্বয়ংক্রিয়', "Automatic") }, { value: 'p', label: tr('খাড়া (Portrait)', "Portrait") }, { value: 'l', label: tr('শোয়ানো (Landscape)', "Landscape") }], 'auto');
    var margin = UI.select([{ value: 0, label: tr('কোনো মার্জিন নেই', "No margin") }, { value: 20, label: tr('ছোট', "Small") }, { value: 40, label: tr('মাঝারি', "Medium") }], 20);
    var go = UI.btn(tr('পিডিএফ বানান', "Create PDF"), run, { icon: 'file-stack', disabled: true });
    var list = UI.sortList({
      items: items,
      label: function (it) {
        return UI.el('span', { class: 'fname', style: { display: 'flex', alignItems: 'center', gap: '10px' } },
          UI.el('img', { class: 'thumb', src: it.url, alt: '' }),
          UI.el('span', {}, it.file.name, UI.el('small', {}, UI.fmtSize(it.file.size))));
      },
      onChange: function () { go.disabled = items.length < 1; }
    });
    var drop = UI.dropzone({
      accept: 'image/*', multiple: true, label: tr('ছবি বেছে নিন (JPG, PNG, WebP)', "Choose images (JPG, PNG, WebP)"),
      onFiles: function (fs) { fs.forEach(function (f) { items.push({ file: f, url: URL.createObjectURL(f) }); }); UI.clear(out); list.redraw(); }
    });
    async function run() {
      UI.clear(out); var prog = UI.progress(); out.appendChild(prog); go.disabled = true;
      try {
        var doc = await PDFLib.PDFDocument.create(), m = +margin.value;
        for (var i = 0; i < items.length; i++) {
          prog.set(i / items.length * 100, UI.n(i + 1) + '/' + UI.n(items.length));
          await UI.yield();
          var img = await UI.readImage(items[i].file);
          var iw = img.naturalWidth, ih = img.naturalHeight;
          var png = items[i].file.type === 'image/png';
          var c = UI.canvas(iw, ih), ctx = c.getContext('2d');
          if (!png) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, iw, ih); }
          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(img._url);
          var bytes = new Uint8Array(await (await UI.toBlob(c, png ? 'image/png' : 'image/jpeg', 0.92)).arrayBuffer());
          c.width = c.height = 0;
          var emb = png ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
          var pw, ph, dw, dh, x, y;
          if (size.value === 'fit') {
            pw = Math.min(iw * 0.75, 14000); ph = pw * ih / iw; dw = pw; dh = ph; x = 0; y = 0;
            if (m) { pw += 2 * m; ph += 2 * m; x = m; y = m; }
          } else {
            var base = size.value === 'letter' ? [612, 792] : [595.28, 841.89];
            var land = orient.value === 'l' || (orient.value === 'auto' && iw > ih);
            pw = land ? base[1] : base[0]; ph = land ? base[0] : base[1];
            var sc = Math.min((pw - 2 * m) / iw, (ph - 2 * m) / ih);
            dw = iw * sc; dh = ih * sc; x = (pw - dw) / 2; y = (ph - dh) / 2;
          }
          var pg = doc.addPage([pw, ph]);
          pg.drawImage(emb, { x: x, y: y, width: dw, height: dh });
        }
        prog.set(100, tr('সেভ হচ্ছে…', "Saving…"));
        var blob = pdfBlob(await doc.save());
        UI.done(out, blob, 'ToolGhor(jpg-to-pdf).pdf', '✓ ' + UI.n(items.length) + tr('টি ছবি দিয়ে পিডিএফ তৈরি হয়েছে।', " images combined into a PDF."));
      } catch (e) { UI.clear(out); out.appendChild(UI.notice('err', UI.err(e))); }
      go.disabled = items.length < 1;
    }
    root.appendChild(UI.el('div', { class: 'stack' }, drop, list,
      UI.el('div', { class: 'row' }, UI.field(tr('পেজ সাইজ', "Page size"), size), UI.field(tr('পেজের দিক', "Orientation"), orient), UI.field(tr('মার্জিন', "Margin"), margin)), go, out));
  };
})();
