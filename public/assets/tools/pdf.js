/* পিডিএফ টুলস */
(function () {
  var UI = window.UI, T = window.Tools, tr = UI.tr;

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

  /* ---------------- iLovePDF Cloud API Connector ---------------- */
  function getILovePdfKey() {
    var k = '';
    if (typeof SITE_CONFIG !== 'undefined' && SITE_CONFIG.apis && SITE_CONFIG.apis.ilovepdfPublicKey) {
      k = SITE_CONFIG.apis.ilovepdfPublicKey.trim();
    }
    if (!k && typeof window !== 'undefined' && window.SITE_CONFIG && window.SITE_CONFIG.apis && window.SITE_CONFIG.apis.ilovepdfPublicKey) {
      k = window.SITE_CONFIG.apis.ilovepdfPublicKey.trim();
    }
    return k || '';
  }

  /* ---------------- Secure Backend ConvertAPI PDF->DOCX Connector ---------------- */
  async function callBackendConvertPdfToDocx(file, extraParams, onProgress) {
    if (!onProgress) onProgress = function () {};
    onProgress(15, tr('সুরক্ষিত সার্ভারে ফাইল আপলোড হচ্ছে…', 'Uploading file to secure server…'));
    await UI.yield();

    var fd = new FormData();
    fd.append('file', file);
    if (extraParams && extraParams.ranges) {
      fd.append('page_range', extraParams.ranges);
    }
    if (extraParams && extraParams.mode) {
      fd.append('mode', extraParams.mode);
    }

    onProgress(45, tr('ConvertAPI ইঞ্জিন দ্বারা নিখুঁত লেআউটে রূপান্তর হচ্ছে…', 'Converting with ConvertAPI layout preservation engine…'));
    await UI.yield();

    var res;
    try {
      res = await fetch('/api/convert-pdf-to-docx', {
        method: 'POST',
        body: fd
      });
    } catch (netErr) {
      throw new Error(tr(
        'সার্ভার সংযোগ পাওয়া যায়নি।',
        'Backend server not reachable.'
      ));
    }

    if (!res.ok) {
      var errJson = await res.json().catch(function () { return {}; });
      var errMsg = (errJson && errJson.error) || tr(
        'এই মুহূর্তে আপনার পিডিএফটি রূপান্তর করা সম্ভব হয়নি। অনুগ্রহ করে অন্য একটি পিডিএফ দিয়ে চেষ্টা করুন।',
        'Your PDF could not be converted at the moment. Please try again with another PDF.'
      );
      throw new Error(errMsg);
    }

    onProgress(90, tr('ওয়ার্ড ডকুমেন্ট প্রস্তুত হচ্ছে…', 'Preparing Word document…'));
    await UI.yield();

    return await res.blob();
  }

  async function callILovePdf(toolName, files, extraParams, onProgress) {
    var pubKey = getILovePdfKey();
    if (!pubKey) {
      throw new Error(tr(
        'ক্লাউড কনফিগারেশন পাওয়া যায়নি।',
        'Cloud configuration not found.'
      ));
    }

    if (!onProgress) onProgress = function () {};

    onProgress(15, tr('সার্ভারে সুরক্ষিত সংযোগ স্থাপন হচ্ছে…', 'Connecting to conversion server…'));
    await UI.yield();

    // 1. Auth: Get JWT token
    var authRes = await fetch('https://api.ilovepdf.com/v1/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ public_key: pubKey })
    });
    if (!authRes.ok) {
      var errData = await authRes.json().catch(function () { return {}; });
      var msg = (errData && errData.error && errData.error.message) || (authRes.status + ' ' + authRes.statusText);
      throw new Error(tr('সার্ভার অথেন্টিকেশন ব্যর্থ: ', 'Server auth failed: ') + msg);
    }
    var authJson = await authRes.json();
    var token = authJson.token;
    if (!token) throw new Error(tr('সার্ভার টোকেন পাওয়া যায়নি।', 'Failed to receive server token.'));

    // 2. Start Task
    onProgress(30, tr('টাস্ক শুরু করা হচ্ছে…', 'Starting task…'));
    await UI.yield();
    var startRes = await fetch('https://api.ilovepdf.com/v1/start/' + encodeURIComponent(toolName), {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!startRes.ok) {
      var sErr = await startRes.json().catch(function () { return {}; });
      throw new Error(tr('টাস্ক শুরু করতে ব্যর্থ: ', 'Could not start task: ') + ((sErr && sErr.error && sErr.error.message) || startRes.statusText));
    }
    var startJson = await startRes.json();
    var server = startJson.server;
    var taskId = startJson.task;

    // 3. Upload File(s)
    var fileList = Array.isArray(files) ? files : [files];
    var uploadedFiles = [];

    for (var i = 0; i < fileList.length; i++) {
      var f = fileList[i];
      var upPct = 35 + Math.round(((i + 1) / fileList.length) * 35);
      onProgress(upPct, tr('ফাইল আপলোড হচ্ছে (', 'Uploading file (') + UI.n(i + 1) + '/' + UI.n(fileList.length) + ')…');
      await UI.yield();

      var fd = new FormData();
      fd.append('task', taskId);
      fd.append('file', f);

      var upRes = await fetch('https://' + server + '/v1/upload', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token },
        body: fd
      });
      if (!upRes.ok) {
        var uErr = await upRes.json().catch(function () { return {}; });
        throw new Error(tr('ফাইল আপলোড ব্যর্থ: ', 'File upload failed: ') + ((uErr && uErr.error && uErr.error.message) || upRes.statusText));
      }
      var upJson = await upRes.json();
      uploadedFiles.push({
        server_filename: upJson.server_filename,
        filename: f.name
      });
    }

    // 4. Process
    onProgress(75, tr('উন্নত ইঞ্জিন দ্বারা নিখুঁতভাবে প্রসেস করা হচ্ছে…', 'Processing with high accuracy engine…'));
    await UI.yield();

    var procPayload = {
      task: taskId,
      tool: toolName,
      files: uploadedFiles
    };
    if (extraParams && typeof extraParams === 'object') {
      for (var k in extraParams) {
        if (extraParams.hasOwnProperty(k)) procPayload[k] = extraParams[k];
      }
    }

    var procRes = await fetch('https://' + server + '/v1/process', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(procPayload)
    });
    if (!procRes.ok) {
      var pErr = await procRes.json().catch(function () { return {}; });
      throw new Error(tr('প্রসেসিং ব্যর্থ: ', 'Processing failed: ') + ((pErr && pErr.error && pErr.error.message) || procRes.statusText));
    }

    // 5. Download
    onProgress(92, tr('ফলাফল ফাইল ডাউনলোড করা হচ্ছে…', 'Downloading processed result…'));
    await UI.yield();

    var dlRes = await fetch('https://' + server + '/v1/download/' + taskId, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!dlRes.ok) {
      throw new Error(tr('ডাউনলোড সম্পন্ন করা যায়নি।', 'Could not download resulting file.'));
    }

    var resultBlob = await dlRes.blob();
    return resultBlob;
  }



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

      // 1. Try iLovePDF Cloud API
      var apiKey = getILovePdfKey();
      if (apiKey && files.length >= 2) {
        try {
          var rawFiles = files.map(function (it) { return it.file; });
          var mBlob = await callILovePdf('merge', rawFiles, {}, function (pct, txt) {
            prog.set(pct, txt);
          });
          UI.done(out, mBlob, 'ToolGhor(merge-pdf).pdf', tr('✓ মার্জ হয়েছে: ', "✓ Merged: ") + UI.n(files.length) + tr('টি ফাইল', " files"));
          mergeBtn.disabled = files.length < 2;
          return;
        } catch (cloudErr) {
          console.warn('Cloud merge failed, falling back to local engine:', cloudErr);
        }
      }

      // 2. Local fallback engine
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

        // 1. Try iLovePDF Cloud API
        var apiKey = getILovePdfKey();
        if (apiKey && mode === 'range' && !sep.checked && rangeIn.value && rangeIn.value.trim()) {
          try {
            var splBlob = await callILovePdf('split', st.file, { split_mode: 'ranges', ranges: rangeIn.value.trim() }, function (pct, txt) {
              prog.set(pct, txt);
            });
            UI.done(out, splBlob, 'ToolGhor(split).pdf', tr('✓ স্প্লিট সম্পন্ন হয়েছে', "✓ Split completed"));
            go.disabled = false;
            return;
          } catch (cloudErr) {
            console.warn('Cloud split failed, falling back to local engine:', cloudErr);
          }
        }

        // 2. Local fallback engine
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
      high: { scale: 2, q: 0.8, cloudLevel: 'low' },
      med: { scale: 1.5, q: 0.65, cloudLevel: 'recommended' },
      low: { scale: 1, q: 0.5, cloudLevel: 'extreme' }
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

      var apiKey = getILovePdfKey();
      if (apiKey) {
        try {
          var compBlob = await callILovePdf('compress', file, { compression_level: p.cloudLevel }, function (pct, txt) {
            prog.set(pct, txt);
          });
          var saved = Math.round((1 - compBlob.size / file.size) * 100);
          var msg = '✓ ' + UI.fmtSize(file.size) + ' → ' + UI.fmtSize(compBlob.size) + (saved > 0 ? ' (' + UI.n(saved) + tr('% ছোট)', "% smaller)") : '');
          UI.done(out, compBlob, 'ToolGhor(' + file.name + ').pdf', msg);
          go.disabled = false;
          return;
        } catch (cloudErr) {
          console.warn('Backend API compress error, using fallback:', cloudErr);
        }
      }

      // Local browser engine
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
        UI.done(out, blob, 'ToolGhor(' + file.name + ').pdf', msg);
        if (saved <= 0) out.firstChild.insertBefore(UI.notice('warn', tr('এই পিডিএফ আগে থেকেই ছোট, কমপ্রেসে সাইজ কমেনি। অরিজিনাল ফাইলটি রাখাই ভালো। চাইলে "বেশি কমপ্রেস" চেষ্টা করুন।', 'This PDF is already small and compression did not reduce it. Keeping the original is better. You can also try "Strong compression".')), out.firstChild.firstChild);
      } catch (e) { UI.clear(out); out.appendChild(UI.notice('err', UI.err(e))); }
      go.disabled = false;
    }

    root.appendChild(UI.el('div', { class: 'stack' },
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

  /* ---------------- পিডিএফ → DOCX / ওয়ার্ড ---------------- */
  var BASE_DOCX_TEMPLATE_B64 = "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";

  function escapeXml(unsafe) {
    return String(unsafe == null ? '' : unsafe)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  function sanitizeXml(str) {
    return escapeXml(str).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  }

  async function createDocxFromPdf(file, options, onProgress) {
    var pdf = await openPdfJs(file);
    var n = pdf.numPages;
    var targetPages = [];
    if (options.range && options.range.trim()) {
      var seen = {};
      parseRanges(options.range, n).forEach(function (p) {
        p.idx.forEach(function (i) {
          if (!seen[i]) { seen[i] = 1; targetPages.push(i + 1); }
        });
      });
      targetPages.sort(function (a, b) { return a - b; });
    } else {
      for (var q = 1; q <= n; q++) targetPages.push(q);
    }
    if (!targetPages.length) throw new Error(tr('কোনো পৃষ্ঠা নির্বাচন করা হয়নি', 'No pages selected'));

    var mode = options.mode || 'text';
    var fontName = options.font || 'Calibri';
    var pageBreak = options.pageBreak !== false;
    var zip = new JSZip();

    onProgress(5, tr('পিডিএফ বিশ্লেষণ করা হচ্ছে…', 'Analyzing PDF pages…'));
    await UI.yield();

    // Load validated standard base template so Microsoft Word opens without corruption or styles repair
    await zip.loadAsync(BASE_DOCX_TEMPLATE_B64, { base64: true });

    var pagesData = [];
    var totalChars = 0;
    var totalWords = 0;
    var imgCounter = 0;
    var relsEntries = [];

    for (var idx = 0; idx < targetPages.length; idx++) {
      var pageNum = targetPages[idx];
      var pPct = 5 + Math.round((idx / targetPages.length) * 75);
      onProgress(pPct, tr('পৃষ্ঠা ', 'Processing page ') + UI.n(pageNum) + '/' + UI.n(n) + '…');
      await UI.yield();

      var page = await pdf.getPage(pageNum);
      var v1 = page.getViewport({ scale: 1.0 });
      var textContent = await page.getTextContent();
      var rawItems = (textContent.items || []).map(function (it) {
        var tx = it.transform || [1, 0, 0, 1, 0, 0];
        var fs = Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1]) || it.height || 11;
        var fn = (it.fontName || '').toLowerCase();
        return {
          str: it.str || '',
          x: tx[4] || 0,
          y: v1.height - (tx[5] || 0),
          w: it.width || (it.str.length * fs * 0.5),
          h: it.height || fs,
          fontSize: fs,
          isBold: /bold|black|heavy|w[7-9]/i.test(fn),
          isItalic: /italic|oblique/i.test(fn)
        };
      }).filter(function (it) { return it.str && it.str.trim().length > 0; });

      var pageText = rawItems.map(function (it) { return it.str; }).join(' ');
      var charCount = pageText.trim().length;
      totalChars += charCount;
      var words = pageText.trim().split(/\s+/).filter(Boolean);
      totalWords += words.length;

      var imgBuffer = null;
      var needImage = (mode === 'visual' || mode === 'hybrid' || rawItems.length === 0);
      if (needImage) {
        var sc = 1.6;
        var v = page.getViewport({ scale: sc });
        var c = UI.canvas(v.width, v.height);
        var ctx = c.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, c.width, c.height);
        await page.render({ canvasContext: ctx, viewport: v }).promise;
        var pBlob = await UI.toBlob(c, 'image/png');
        imgBuffer = await pBlob.arrayBuffer();
        page.cleanup();
        c.width = c.height = 0;
      }

      pagesData.push({
        pageNum: pageNum,
        width: v1.width,
        height: v1.height,
        rawItems: rawItems,
        text: pageText,
        imgBuffer: imgBuffer
      });
    }

    onProgress(82, tr('ওয়ার্ড ডকুমেন্ট তৈরি হচ্ছে…', 'Generating Word document structure…'));
    await UI.yield();

    var bodyXml = '';

    for (var pIndex = 0; pIndex < pagesData.length; pIndex++) {
      var pData = pagesData[pIndex];
      var isLast = pIndex === pagesData.length - 1;

      if (pData.imgBuffer) {
        imgCounter++;
        var imgFileName = 'image' + imgCounter + '.png';
        zip.file('word/media/' + imgFileName, pData.imgBuffer);
        var rId = 'rIdImg' + imgCounter;
        relsEntries.push('<Relationship Id="' + rId + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/' + imgFileName + '"/>');

        var maxEmuW = 5733000;
        var emuW = Math.min(Math.round(pData.width * 9525), maxEmuW);
        var emuH = Math.round(emuW * (pData.height / pData.width));

        bodyXml += '<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="160"/></w:pPr>' +
          '<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">' +
          '<wp:extent cx="' + emuW + '" cy="' + emuH + '"/>' +
          '<wp:docPr id="' + imgCounter + '" name="Page ' + pData.pageNum + '"/>' +
          '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">' +
          '<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
          '<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
          '<pic:nvPicPr><pic:cNvPr id="' + imgCounter + '" name="Page ' + pData.pageNum + '"/><pic:cNvPicPr/></pic:nvPicPr>' +
          '<pic:blipFill><a:blip r:embed="' + rId + '"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>' +
          '<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + emuW + '" cy="' + emuH + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>' +
          '</pic:pic></a:graphicData></a:graphic>' +
          '</wp:inline></w:drawing></w:r></w:p>';
      }

      if ((mode === 'text' || mode === 'hybrid') && pData.rawItems.length > 0) {
        pData.rawItems.sort(function (a, b) {
          if (Math.abs(a.y - b.y) > 3.5) return a.y - b.y;
          return a.x - b.x;
        });

        var lines = [];
        var curLine = null;
        for (var k = 0; k < pData.rawItems.length; k++) {
          var item = pData.rawItems[k];
          if (!curLine || Math.abs(item.y - curLine.y) > (curLine.h * 0.45 || 4)) {
            curLine = { y: item.y, h: item.h, items: [item] };
            lines.push(curLine);
          } else {
            curLine.items.push(item);
            curLine.y = (curLine.y + item.y) / 2;
            curLine.h = Math.max(curLine.h, item.h);
          }
        }

        lines.forEach(function (l) {
          l.items.sort(function (a, b) { return a.x - b.x; });
        });

        var paragraphs = [];
        var curPara = null;

        for (var lIdx = 0; lIdx < lines.length; lIdx++) {
          var l = lines[lIdx];
          var lineText = '';
          var avgFs = 0;
          l.items.forEach(function (it, i) {
            if (i > 0 && it.x > (l.items[i - 1].x + l.items[i - 1].w + 2)) lineText += ' ';
            lineText += it.str;
            avgFs += it.fontSize;
          });
          avgFs = avgFs / l.items.length;

          var isHeading = avgFs >= 15;
          var isList = /^([•\-\*]|\d+[\.\)]|[০-৯]+[\.\)])\s+/.test(lineText.trim());
          var prevL = lIdx > 0 ? lines[lIdx - 1] : null;
          var lineGap = prevL ? (l.y - (prevL.y + prevL.h)) : 0;
          var startNew = !curPara || isHeading || isList || (curPara.isHeading) || (lineGap > (l.h * 0.85));

          if (startNew) {
            curPara = {
              isHeading: isHeading,
              headingLevel: avgFs >= 18 ? 1 : 2,
              isList: isList,
              runs: []
            };
            paragraphs.push(curPara);
          }

          l.items.forEach(function (it, i) {
            var prefix = '';
            if (i > 0) {
              var gap = it.x - (l.items[i - 1].x + l.items[i - 1].w);
              if (gap > 24) prefix = '\t';
              else if (gap > 2) prefix = ' ';
            } else if (!startNew && curPara.runs.length > 0) {
              var lastRun = curPara.runs[curPara.runs.length - 1];
              if (lastRun && !/\s$/.test(lastRun.text)) prefix = ' ';
            }

            curPara.runs.push({
              text: prefix + it.str,
              isBold: it.isBold || isHeading,
              isItalic: it.isItalic,
              fontSize: Math.round(it.fontSize * 2)
            });
          });
        }

        paragraphs.forEach(function (p) {
          var pPr = '<w:pPr>';
          if (p.isHeading) pPr += '<w:pStyle w:val="Heading' + p.headingLevel + '"/>';
          else if (p.isList) pPr += '<w:ind w:left="360"/><w:spacing w:after="80"/>';
          else pPr += '<w:spacing w:after="160"/>';
          pPr += '</w:pPr>';

          var rXml = '';
          p.runs.forEach(function (r) {
            var rPr = '<w:rPr>';
            if (r.isBold) rPr += '<w:b/>';
            if (r.isItalic) rPr += '<w:i/>';
            rPr += '<w:rFonts w:ascii="' + fontName + '" w:hAnsi="' + fontName + '" w:cs="' + fontName + '"/>';
            if (r.fontSize) rPr += '<w:sz w:val="' + r.fontSize + '"/><w:szCs w:val="' + r.fontSize + '"/>';
            rPr += '</w:rPr>';
            rXml += '<w:r>' + rPr + '<w:t xml:space="preserve">' + sanitizeXml(r.text) + '</w:t></w:r>';
          });

          if (rXml) bodyXml += '<w:p>' + pPr + rXml + '</w:p>';
        });
      }

      if (pageBreak && !isLast) {
        bodyXml += '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
      }
    }

    onProgress(92, tr('ফাইল কম্প্রেস হচ্ছে…', 'Compressing DOCX archive…'));
    await UI.yield();

    // Update document rels with images
    if (relsEntries.length > 0) {
      var relsFile = zip.file('word/_rels/document.xml.rels');
      var origRels = relsFile ? await relsFile.async('string') : '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>';
      var newRels = origRels.replace('</Relationships>', relsEntries.join('') + '</Relationships>');
      zip.file('word/_rels/document.xml.rels', newRels);

      var ctFile = zip.file('[Content_Types].xml');
      if (ctFile) {
        var origCt = await ctFile.async('string');
        if (origCt.indexOf('Extension="png"') === -1) {
          origCt = origCt.replace('</Types>', '<Default Extension="png" ContentType="image/png"/></Types>');
          zip.file('[Content_Types].xml', origCt);
        }
      }
    }

    var documentXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ' +
      'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ' +
      'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" ' +
      'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ' +
      'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
      '<w:body>' + bodyXml +
      '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>' +
      '</w:body></w:document>';
    zip.file('word/document.xml', documentXml);

    onProgress(97, tr('ফাইল চূড়ান্ত হচ্ছে…', 'Finalizing document…'));
    await UI.yield();

    var docxBlob = await zip.generateAsync({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      compression: 'DEFLATE'
    });

    var allExtractedText = pagesData.map(function (p) { return p.text; }).filter(Boolean).join('\n\n');

    return {
      blob: docxBlob,
      pageCount: targetPages.length,
      words: totalWords,
      chars: totalChars,
      text: allExtractedText,
      scannedDetected: (totalChars === 0)
    };
  }

  async function createDocxFromEditedText(text, fontName) {
    var fn = fontName || 'Calibri';
    var zip = new JSZip();
    await zip.loadAsync(BASE_DOCX_TEMPLATE_B64, { base64: true });
    var lines = (text || '').split(/\r?\n/);
    var bodyXml = '';
    lines.forEach(function (l) {
      var trm = l.trim();
      if (!trm) {
        bodyXml += '<w:p><w:pPr><w:spacing w:after="120"/></w:pPr></w:p>';
        return;
      }
      var isH1 = /^#\s+/.test(trm) || /^[A-Z\s]{4,}:?$/.test(trm);
      var isH2 = /^##\s+/.test(trm);
      var cleanText = trm.replace(/^#{1,3}\s+/, '');
      var pPr = '<w:pPr>';
      if (isH1) pPr += '<w:pStyle w:val="Heading1"/><w:spacing w:before="240" w:after="120"/>';
      else if (isH2) pPr += '<w:pStyle w:val="Heading2"/><w:spacing w:before="180" w:after="100"/>';
      else pPr += '<w:spacing w:after="140"/>';
      pPr += '</w:pPr>';
      var rPr = '<w:rPr><w:rFonts w:ascii="' + fn + '" w:hAnsi="' + fn + '" w:cs="' + fn + '"/>';
      if (isH1) rPr += '<w:b/><w:sz w:val="32"/><w:szCs w:val="32"/>';
      else if (isH2) rPr += '<w:b/><w:sz w:val="26"/><w:szCs w:val="26"/>';
      else rPr += '<w:sz w:val="22"/><w:szCs w:val="22"/>';
      rPr += '</w:rPr>';
      bodyXml += '<w:p>' + pPr + '<w:r>' + rPr + '<w:t xml:space="preserve">' + sanitizeXml(cleanText) + '</w:t></w:r></w:p>';
    });
    bodyXml += '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>';
    var docFile = zip.file('word/document.xml');
    var origXml = docFile ? await docFile.async('string') : '';
    var newXml = origXml.replace(/<w:body>[\s\S]*?<\/w:body>/, '<w:body>' + bodyXml + '</w:body>');
    zip.file('word/document.xml', newXml);
    return await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  }

  T['pdf-to-doc'] = function (root) {
    var file = null, pdfInfo = null, out = UI.el('div'), cardBox = UI.el('div', { class: 'stack' });

    var mode = 'text';
    var segMode = UI.seg([
      { value: 'text', label: tr('📝 এডিটেবল টেক্সট', '📝 Editable Text') },
      { value: 'visual', label: tr('🖼️ ভিজ্যুয়াল পেজ', '🖼️ Visual Pages') },
      { value: 'hybrid', label: tr('📑 হাইব্রিড মোড', '📑 Hybrid (Image + Text)') }
    ], mode, function (v) { mode = v; });

    var fontSel = UI.select([
      { value: 'Calibri', label: 'Calibri (Standard)' },
      { value: 'Arial', label: 'Arial (Clean)' },
      { value: 'Times New Roman', label: 'Times New Roman (Formal)' },
      { value: 'Hind Siliguri', label: 'Hind Siliguri (বাংলা ইউনিকোড)' },
      { value: 'Kalpurush', label: 'Kalpurush (বাংলা)' }
    ], 'Calibri');

    var pageBreakCheck = UI.el('input', { type: 'checkbox' });
    pageBreakCheck.checked = true;
    var rangeIn = UI.el('input', { type: 'text', placeholder: tr('যেমন: 1-5 (খালি রাখলে সব)', 'e.g. 1-5 (leave empty for all)') });

    var convertBtn = UI.btn(tr('ওয়ার্ডে রূপান্তর করুন (DOCX)', 'Convert to Word (DOCX)'), run, {
      icon: 'file-text',
      cls: 'btn-doc-convert',
      disabled: true
    });

    var drop = UI.dropzone({
      accept: 'application/pdf,.pdf',
      label: tr('পিডিএফ ফাইল বেছে নিন বা এখানে টেনে আনুন', 'Choose PDF file or drag & drop here'),
      onFiles: async function (fs) {
        if (!fs || !fs.length) return;
        file = fs[0];
        UI.clear(out);
        UI.clear(cardBox);
        convertBtn.disabled = true;

        try {
          var pdf = await openPdfJs(file);
          var numPages = pdf.numPages;
          pdfInfo = { numPages: numPages };

          var thumbCanvas = UI.canvas(80, 105);
          try {
            var firstPage = await pdf.getPage(1);
            var v0 = firstPage.getViewport({ scale: 1 });
            var scaleThumb = Math.min(80 / v0.width, 105 / v0.height);
            var vThumb = firstPage.getViewport({ scale: scaleThumb });
            thumbCanvas.width = vThumb.width;
            thumbCanvas.height = vThumb.height;
            var ctx = thumbCanvas.getContext('2d');
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, vThumb.width, vThumb.height);
            await firstPage.render({ canvasContext: ctx, viewport: vThumb }).promise;
          } catch (e) {}

          var fileCard = UI.el('div', { class: 'pdf-file-card' },
            UI.el('div', { class: 'pdf-file-thumb' }, thumbCanvas),
            UI.el('div', { class: 'pdf-file-meta' },
              UI.el('div', { class: 'pdf-file-name', title: file.name }, file.name),
              UI.el('div', { class: 'pdf-file-sub' },
                UI.el('span', { class: 'pdf-badge' }, 'PDF'),
                document.createTextNode(UI.fmtSize(file.size) + ' · '),
                UI.el('span', { class: 'pdf-page-count' }, UI.n(numPages) + tr('টি পৃষ্ঠা', ' pages'))
              )
            ),
            UI.btn(tr('পরিবর্তন', 'Change'), function () {
              var fi = drop.querySelector('input[type="file"]');
              if (fi) fi.click();
            }, { cls: 'sm ghost' })
          );

          cardBox.appendChild(fileCard);
          convertBtn.disabled = false;
        } catch (err) {
          UI.clear(cardBox);
          out.appendChild(UI.notice('err', tr('পিডিএফ খোলা যায়নি: ', 'Could not open PDF: ') + UI.err(err)));
        }
      }
    });

    var optionsCard = UI.el('div', { class: 'stack pdf-options-card' },
      UI.el('div', { class: 'field' },
        UI.el('span', { class: 'lbl' }, tr('কনভার্সন মোড (Conversion Mode)', 'Conversion Mode')),
        segMode
      ),
      UI.el('div', { class: 'row' },
        UI.field(tr('ডিফল্ট ফন্ট (Font)', 'Default Font'), fontSel),
        UI.field(tr('নির্দিষ্ট পৃষ্ঠা (ঐচ্ছিক)', 'Specific Pages (Optional)'), rangeIn, tr('যেমন: 1-5, 8-10', 'e.g. 1-5, 8-10'))
      ),
      UI.el('label', { class: 'check' },
        pageBreakCheck,
        document.createTextNode(' ' + tr('প্রতিটি পৃষ্ঠার মাঝে পেজ ব্রেক রাখুন', 'Insert page break between pages'))
      )
    );

    async function run() {
      if (!file) return;
      UI.clear(out);
      var prog = UI.progress();
      out.appendChild(prog);
      convertBtn.disabled = true;

      try {
        var docxBlob = null;
        var stats = null;
        var base = UI.baseName(file.name);
        var outName = base + '.docx';

        // 1. Try secure backend ConvertAPI PDF -> DOCX conversion
        var extraParams = {};
        if (rangeIn.value && rangeIn.value.trim()) {
          extraParams.ranges = rangeIn.value.trim();
        }
        if (mode) {
          extraParams.mode = mode;
        }

        try {
          docxBlob = await callBackendConvertPdfToDocx(file, extraParams, function (pct, txt) {
            prog.set(pct, txt);
          });
          stats = {
            pageCount: pdfInfo ? pdfInfo.numPages : 1,
            size: docxBlob.size,
            isConvertApi: true
          };
        } catch (apiErr) {
          var errMsg = (apiErr && apiErr.message) || '';
          // Specific validation errors (size limit or corrupted PDF) are shown directly
          if (errMsg.includes('50MB') || errMsg.includes('corrupted') || errMsg.includes('valid PDF') || errMsg.includes('সীমাবদ্ধতা')) {
            throw apiErr;
          }
          console.warn('[ConvertAPI backend unavailable, falling back to local layout engine]:', errMsg);
        }

        // 2. High-compatibility local engine fallback if backend is offline
        if (!docxBlob) {
          var res = await createDocxFromPdf(file, {
            mode: mode,
            font: fontSel.value,
            range: rangeIn.value,
            pageBreak: pageBreakCheck.checked
          }, function (pct, txt) {
            prog.set(pct, txt);
          });

          docxBlob = res.blob;
          stats = {
            pageCount: res.pageCount,
            size: res.blob.size,
            words: res.words,
            text: res.text,
            scannedDetected: res.scannedDetected,
            isConvertApi: false
          };
        }

        prog.set(100, tr('✓ সফলভাবে রূপান্তর সম্পন্ন হয়েছে!', '✓ Conversion completed successfully!'));
        await UI.yield();

        var resultWrap = UI.el('div', { class: 'stack pdf-result-wrap' });

        var noticeMsg = stats.isConvertApi
          ? tr('✓ আপনার পিডিএফ ফাইলটি ConvertAPI উচ্চমানের লেআউট ইঞ্জিন দ্বারা সফলভাবে Word (.docx) ফরম্যাটে রূপান্তর করা হয়েছে!',
               '✓ Your PDF has been successfully converted to Word (.docx) with original layout preservation!')
          : tr('✓ আপনার পিডিএফ ফাইলটি ওয়ার্ড (DOCX) ফরম্যাটে সফলভাবে রূপান্তর করা হয়েছে!',
               '✓ Your PDF has been successfully converted to editable Word (DOCX) format!');
        resultWrap.appendChild(UI.notice('ok', noticeMsg));

        if (stats.scannedDetected && mode === 'text') {
          resultWrap.appendChild(UI.notice('warn', tr('এই পিডিএফটিতে সিলেক্টেবল টেক্সট পাওয়া যায়নি (স্ক্যান করা বা ছবিযুক্ত পিডিএফ)। তাই পৃষ্ঠাগুলোর নিখুঁত ভিজ্যুয়াল লেআউট ওয়ার্ডে সংরক্ষণ করা হয়েছে।',
            'No selectable text was found in this PDF (it may be scanned). High-quality visual pages were preserved in your Word document.')));
        }

        var statItems = [
          UI.el('div', { class: 'pdf-stat-item' },
            UI.el('div', { class: 'stat-num' }, UI.n(stats.pageCount)),
            UI.el('div', { class: 'stat-lbl' }, tr('পৃষ্ঠা সংখ্যা', 'Pages'))
          ),
          UI.el('div', { class: 'pdf-stat-item' },
            UI.el('div', { class: 'stat-num' }, UI.fmtSize(docxBlob.size)),
            UI.el('div', { class: 'stat-lbl' }, tr('DOCX সাইজ', 'DOCX Size'))
          )
        ];
        if (stats.words != null) {
          statItems.push(
            UI.el('div', { class: 'pdf-stat-item' },
              UI.el('div', { class: 'stat-num' }, UI.n(stats.words)),
              UI.el('div', { class: 'stat-lbl' }, tr('মোট শব্দ', 'Words'))
            )
          );
        }

        // Extract text if not already present (e.g. when ConvertAPI converted the document)
        if (!stats.text && file) {
          try {
            var pdfObj = await openPdfJs(file);
            var parts = [];
            for (var pi = 1; pi <= Math.min(pdfObj.numPages, 10); pi++) {
              var p = await pdfObj.getPage(pi);
              var tc = await p.getTextContent();
              var pt = (tc.items || []).map(function (it) { return it.str; }).join(' ');
              if (pt.trim()) parts.push(pt.trim());
            }
            if (parts.length) {
              stats.text = parts.join('\n\n');
            }
          } catch (e) {}
        }

        var statRow = UI.el('div', { class: 'pdf-stats-row' }, statItems);
        resultWrap.appendChild(statRow);

        // AI Edit & Modify Drawer
        var aiEditBox = UI.el('div', { class: 'stack pdf-ai-edit-box', style: 'display:none; margin-top:14px; padding:16px; border:1px solid var(--line); border-radius:12px; background:var(--card-bg, #fafafa);' });
        var aiTextArea = UI.el('textarea', { class: 'input', rows: 8, style: 'width:100%; font-family:inherit; font-size:14px; box-sizing:border-box;' });
        aiTextArea.value = stats.text || '';
        var aiPromptInput = UI.el('input', { type: 'text', placeholder: tr('যেমন: ভুল বানান ঠিক করো, প্রফেশনাল করো বা অমুক শব্দ পরিবর্তন করো…', 'e.g. Fix spelling, rephrase professionally, or replace terms…') });

        var aiRunBtn = UI.btn(tr('✨ এআই প্রয়োগ করুন', '✨ Apply AI'), async function () {
          var userPrompt = aiPromptInput.value.trim() || 'Improve readability, correct any grammar or spelling, and format with clear paragraph and heading structure while preserving all factual content.';
          var currentContent = aiTextArea.value.trim();
          if (!currentContent) return;
          aiRunBtn.disabled = true;
          try {
            var fullPrompt = 'Document Content:\n' + currentContent + '\n\nTask: ' + userPrompt + '\n\nOutput ONLY the revised document text preserving headings (with # or ##) and paragraphs. Do not add conversational text.';
            var resText = await UI.aiCompletion(fullPrompt);
            if (resText && resText.trim()) {
              aiTextArea.value = resText.trim();
            }
          } catch (aiErr) {
            alert(UI.err(aiErr));
          }
          aiRunBtn.disabled = false;
        }, { cls: 'sm' });

        var aiExportBtn = UI.btn(tr('📥 সম্পাদিত DOCX ডাউনলোড করুন', '📥 Download Edited DOCX'), async function () {
          aiExportBtn.disabled = true;
          try {
            var editedDocx = await createDocxFromEditedText(aiTextArea.value, fontSel.value);
            UI.download(editedDocx, 'Edited_' + outName);
          } catch (exErr) {
            alert(UI.err(exErr));
          }
          aiExportBtn.disabled = false;
        }, { icon: 'download', cls: 'sm btn-main-download' });

        aiEditBox.appendChild(UI.el('div', { style: 'font-weight:700; margin-bottom:6px;' }, tr('🤖 এআই টেক্সট এডিটর ও মডিফায়ার (AI Text Editor)', '🤖 AI Text Editor & Modifier')));
        aiEditBox.appendChild(aiTextArea);
        aiEditBox.appendChild(UI.el('div', { class: 'row', style: 'margin-top:8px;' }, aiPromptInput, aiRunBtn));
        aiEditBox.appendChild(UI.el('div', { class: 'row', style: 'margin-top:8px;' }, aiExportBtn));

        var dlRow = UI.el('div', { class: 'row pdf-action-row' },
          UI.btn(tr('DOCX ডাউনলোড করুন (Download DOCX)', 'Download DOCX'), function () {
            UI.download(docxBlob, outName);
          }, { icon: 'download', cls: 'btn-main-download' }),
          (stats.text) ? UI.btn(tr('টেক্সট কপি করুন', 'Copy Extracted Text'), function () {
            UI.copy(stats.text);
          }, { icon: 'copy', cls: 'ghost' }) : null,
          (stats.text) ? UI.btn(tr('🤖 এআই দিয়ে এডিট', '🤖 AI Edit'), function () {
            aiEditBox.style.display = aiEditBox.style.display === 'none' ? 'block' : 'none';
          }, { icon: 'edit', cls: 'ghost' }) : null
        );
        resultWrap.appendChild(dlRow);
        resultWrap.appendChild(aiEditBox);

        UI.clear(out);
        out.appendChild(resultWrap);
      } catch (err) {
        UI.clear(out);
        var friendlyErr = tr(
          'এই মুহূর্তে আপনার পিডিএফটি রূপান্তর করা সম্ভব হয়নি। অনুগ্রহ করে অন্য একটি পিডিএফ দিয়ে চেষ্টা করুন।',
          'Your PDF could not be converted at the moment. Please try again with another PDF.'
        );
        if (err && err.message && (
          err.message.includes('50MB') ||
          err.message.includes('corrupted') ||
          err.message.includes('valid PDF') ||
          err.message.includes('সীমাবদ্ধতা')
        )) {
          friendlyErr = err.message;
        }
        out.appendChild(UI.notice('err', friendlyErr));
      }
      convertBtn.disabled = false;
    }

    root.appendChild(UI.el('div', { class: 'stack' },
      drop,
      cardBox,
      optionsCard,
      convertBtn,
      out
    ));
  };
  T['pdf-to-docx'] = T['pdf-to-doc'];

  /* ---------------- Word (DOCX, DOC) → PDF ---------------- */
  T['word-to-pdf'] = function (root) {
    var file = null, out = UI.el('div'), info = UI.el('div');
    var go = UI.btn(tr('পিডিএফে রূপান্তর করুন', 'Convert to PDF'), run, { icon: 'file-text', disabled: true });
    var drop = UI.dropzone({
      accept: '.docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword',
      label: tr('Word ফাইল বেছে নিন (.docx, .doc)', 'Choose Word file (.docx, .doc)'),
      onFiles: function (fs) {
        file = fs[0];
        UI.clear(out);
        UI.clear(info);
        info.appendChild(UI.notice('info', file.name + ' · ' + UI.fmtSize(file.size)));
        go.disabled = false;
      }
    });

    async function run() {
      if (!file) return;
      UI.clear(out);
      var prog = UI.progress();
      out.appendChild(prog);
      go.disabled = true;

      try {
        var apiKey = getILovePdfKey();
        if (!apiKey) {
          throw new Error(tr('ব্যাকএন্ড কনফিগারেশন পাওয়া যায়নি।', 'Backend conversion configuration not found.'));
        }
        var pdfBlob = await callILovePdf('officepdf', file, {}, function (pct, txt) {
          prog.set(pct, txt);
        });
        var base = UI.baseName(file.name);
        var outName = 'ToolGhor(' + base + ').pdf';
        UI.done(out, pdfBlob, outName, tr('✓ সফলভাবে পিডিএফে রূপান্তর সম্পন্ন হয়েছে!', '✓ Converted to PDF successfully!'));
      } catch (err) {
        UI.clear(out);
        out.appendChild(UI.notice('err', tr('রূপান্তর ব্যর্থ হয়েছে: ', 'Conversion failed: ') + UI.err(err)));
      }
      go.disabled = false;
    }

    root.appendChild(UI.el('div', { class: 'stack' },
      drop,
      info,
      go,
      out
    ));
  };


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
