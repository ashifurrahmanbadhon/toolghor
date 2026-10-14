/* ভিডিও ও অডিও টুলস (ffmpeg.wasm, ব্রাউজারেই চলে) */
(function () {
  var UI = window.UI, T = window.Tools;
  var CORE = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd';
  var ff = null, loading = null;

  function getFFmpeg(setMsg) {
    if (ff) return Promise.resolve(ff);
    if (loading) return loading;
    loading = (async function () {
      setMsg && setMsg(tr('ভিডিও-ইঞ্জিন লোড হচ্ছে (প্রথমবার ~৩০ MB, একটু সময় লাগবে)…', "Loading the video engine (first time ~30 MB, it will take a moment)…"));
      await UI.loadScript(UI.ROOT + 'assets/vendor/ffmpeg/ffmpeg.js');
      await UI.loadScript(UI.ROOT + 'assets/vendor/ffmpeg/util.js');
      var inst = new FFmpegWASM.FFmpeg();
      await inst.load({
        coreURL: await FFmpegUtil.toBlobURL(CORE + '/ffmpeg-core.js', 'text/javascript'),
        wasmURL: await FFmpegUtil.toBlobURL(CORE + '/ffmpeg-core.wasm', 'application/wasm')
      });
      ff = inst; return inst;
    })();
    loading.catch(function () { loading = null; });
    return loading;
  }
  function engineError(e) {
    return new Error(tr('ভিডিও-ইঞ্জিন চালু করা যায়নি। ইন্টারনেট সংযোগ দেখুন। আর সাইটটি https:// ঠিকানা থেকে খুলুন (ফাইলে ডাবল-ক্লিক করে খুললে এই টুল চলবে না)। ', "Could not start the video engine. Check your internet connection, and open the site from an https:// address (this tool will not work if you just double-click the file). ") + (e && e.message ? '(' + e.message + ')' : ''));
  }
  async function runFF(setMsg, setPct, inName, file, args, outName) {
    var inst;
    try { inst = await getFFmpeg(setMsg); } catch (e) { throw engineError(e); }
    var onProg = function (ev) { var p = ev && ev.progress; if (isFinite(p)) setPct(Math.max(0, Math.min(99, p * 100))); };
    inst.on('progress', onProg);
    try {
      setMsg(tr('ফাইল পড়া হচ্ছে…', "Reading the file…")); setPct(0);
      await inst.writeFile(inName, new Uint8Array(await file.arrayBuffer()));
      setMsg(tr('প্রসেস হচ্ছে… ট্যাব খোলা রাখুন', "Processing… keep this tab open"));
      var code = await inst.exec(args);
      if (code !== 0) throw new Error(tr('প্রসেস করা যায়নি। ফাইলটি নষ্ট, বা এতে অডিও/ভিডিও ট্র্যাক নেই, অথবা ফরম্যাট সমর্থিত নয়।', "Could not process. The file may be damaged, have no audio/video track, or be in an unsupported format."));
      var data = await inst.readFile(outName);
      return data;
    } finally {
      inst.off('progress', onProg);
      try { await inst.deleteFile(inName); } catch (e) { }
      try { await inst.deleteFile(outName); } catch (e) { }
    }
  }
  function sizeCheck(f) {
    if (f.size > 1.2 * 1024 * 1024 * 1024) throw new Error(tr('ফাইলটি অনেক বড় (১.২ GB-র বেশি)। ব্রাউজারে এত বড় ফাইল প্রসেস করা যাবে না।', "The file is too large (over 1.2 GB). The browser cannot process such a large file."));
  }
  var warnBig = function (f) { return f.size > 300 * 1024 * 1024 ? UI.notice('warn', tr('ফাইলটি বড় (', "The file is large (") + UI.fmtSize(f.size) + tr(')। প্রসেস হতে অনেক সময় লাগতে পারে বা ফোনে মেমরি কম পড়তে পারে।', "). Processing may take a long time or run out of memory on a phone.")) : null; };

  /* ================= অডিও এক্সট্র্যাক্টর ================= */
  T['audio-extractor'] = function (root) {
    var file = null, out = UI.el('div'), info = UI.el('div');
    var fmt = UI.seg([{ value: 'mp3', label: 'MP3' }, { value: 'm4a', label: 'M4A (AAC)' }, { value: 'wav', label: tr('WAV (লসলেস, বড় ফাইল)', "WAV (lossless, large file)") }], 'mp3', function (v) { brField.hidden = v === 'wav'; });
    var br = UI.select([{ value: '128k', label: tr('১২৮ kbps', "128 kbps") }, { value: '192k', label: tr('১৯২ kbps (প্রস্তাবিত)', "192 kbps (recommended)") }, { value: '256k', label: tr('২৫৬ kbps', "256 kbps") }, { value: '320k', label: tr('৩২০ kbps', "320 kbps") }], '192k');
    var brField = UI.field(tr('অডিও মান', "Audio quality"), br);
    var go = UI.btn(tr('অডিও আলাদা করুন', "Extract audio"), run, { icon: 'audio-lines', disabled: true });
    var drop = UI.dropzone({
      accept: 'video/*,audio/*,.mkv,.mov,.avi,.3gp,.flv,.webm,.mp4,.m4v', label: tr('ভিডিও ফাইল বেছে নিন', "Choose a video file"),
      onFiles: function (fs) {
        file = fs[0]; UI.clear(out); UI.clear(info);
        info.appendChild(UI.notice('info', file.name + ' · ' + UI.fmtSize(file.size))); var w = warnBig(file); if (w) info.appendChild(w);
        go.disabled = false;
      }
    });
    async function run() {
      UI.clear(out); var prog = UI.progress(); out.appendChild(prog); go.disabled = true;
      try {
        sizeCheck(file);
        var f = fmt.get(), inName = 'input.' + (UI.ext(file.name) || 'mp4'), outName = 'output.' + f;
        var args = ['-i', inName, '-vn'];
        if (f === 'mp3') args.push('-c:a', 'libmp3lame', '-b:a', br.value);
        else if (f === 'm4a') args.push('-c:a', 'aac', '-b:a', br.value);
        else args.push('-c:a', 'pcm_s16le');
        args.push(outName);
        var data = await runFF(function (m) { prog.set(0, m); }, function (p) { prog.set(p); }, inName, file, args, outName);
        var mime = f === 'mp3' ? 'audio/mpeg' : f === 'm4a' ? 'audio/mp4' : 'audio/wav';
        var blob = new Blob([data], { type: mime });
        UI.done(out, blob, 'ToolGhor(audio-extractor).' + f, tr('✓ অডিও আলাদা হয়েছে (', "✓ Audio extracted (") + f.toUpperCase() + ')');
        out.firstChild.appendChild(UI.el('audio', { controls: true, src: URL.createObjectURL(blob), style: { width: '100%', marginTop: '12px' } }));
      } catch (e) { UI.clear(out); out.appendChild(UI.notice('err', UI.err(e))); }
      go.disabled = false;
    }
    root.appendChild(UI.el('div', { class: 'stack' }, drop, info,
      UI.el('div', { class: 'stack' }, UI.el('span', { class: 'lbl' }, tr('অডিও ফরম্যাট', "Audio format")), fmt), brField, go, out));
  };

  /* ================= সোশ্যাল মিডিয়া ভিডিও ক্রপার ================= */
  var PRESETS = {
    '9:16': { r: 9 / 16, w: 1080, label: tr('৯:১৬ – রিলস / শর্টস / টিকটক', "9:16 – Reels / Shorts / TikTok") },
    '1:1': { r: 1, w: 1080, label: tr('১:১ – ইনস্টাগ্রাম / ফেসবুক পোস্ট', "1:1 – Instagram / Facebook post") },
    '4:5': { r: 4 / 5, w: 1080, label: tr('৪:৫ – ইনস্টাগ্রাম ফিড', "4:5 – Instagram feed") },
    '16:9': { r: 16 / 9, w: 1920, label: tr('১৬:৯ – ইউটিউব', "16:9 – YouTube") }
  };
  function even(n) { n = Math.round(n); return n - (n % 2); }

  T['social-video-cropper'] = function (root) {
    var file = null, url = null, vid = null, box = null, cropper = null, vw = 0, vh = 0, pos = 50, preset = '9:16';
    var out = UI.el('div'), stage = UI.el('div'), info = UI.el('div'), controls = UI.el('div', { class: 'stack' });
    var tgt = UI.seg(Object.keys(PRESETS).map(function (k) { return { value: k, label: PRESETS[k].label }; }), preset, function (v) { preset = v; layoutBox(); });
    var slider = UI.el('input', { type: 'range', min: '0', max: '100', value: '50', 'aria-label': tr('কাটার অবস্থান', "Crop position") });
    var posLbl = UI.el('small', { class: 'lbl' }, '');
    var start = UI.el('input', { type: 'text', inputmode: 'decimal', placeholder: tr('০', "0") }), dur = UI.el('input', { type: 'text', inputmode: 'decimal', placeholder: tr('খালি = পুরোটা', "empty = whole video") });
    var qual = UI.select([{ value: 'fast', label: tr('দ্রুত (কম সময়, বড় ফাইল)', "Fast (less time, bigger file)") }, { value: 'good', label: tr('ভালো মান (বেশি সময়)', "Better quality (more time)") }], 'fast');
    var go = UI.btn(tr('ভিডিও বানান', "Create video"), run, { icon: 'smartphone', disabled: true });
    var drop = UI.dropzone({
      accept: 'video/*,.mkv,.mov,.3gp,.webm,.mp4,.m4v', label: tr('ভিডিও ফাইল বেছে নিন', "Choose a video file"),
      onFiles: function (fs) { load(fs[0]); }
    });

    function load(f) {
      UI.clear(out); UI.clear(stage); UI.clear(info); UI.clear(controls); go.disabled = true;
      if (url) URL.revokeObjectURL(url);
      file = f; url = URL.createObjectURL(f);
      info.appendChild(UI.notice('info', f.name + ' · ' + UI.fmtSize(f.size))); var w = warnBig(f); if (w) info.appendChild(w);
      vid = UI.el('video', { src: url, muted: true, playsinline: true, preload: 'metadata' });
      vid.muted = true;
      box = UI.el('div', { class: 'crop-box fixed' });
      cropper = UI.el('div', { class: 'cropper' }, vid, box);
      vid.addEventListener('loadedmetadata', function () {
        vw = vid.videoWidth; vh = vid.videoHeight;
        if (!vw) { stage.appendChild(UI.notice('err', tr('এই ভিডিও ব্রাউজারে খোলা যাচ্ছে না, তবে প্রসেস করা যেতে পারে।', "This video cannot be opened in the browser, but it may still be processed."))); }
        vid.currentTime = Math.min(0.1, vid.duration || 0);
        stage.appendChild(cropper);
        controls.appendChild(UI.el('div', { class: 'stack' }, UI.el('span', { class: 'lbl' }, tr('কোন মাপে কাটবেন?', "Which size do you want to crop to?")), tgt));
        controls.appendChild(UI.field(tr('কাটার অবস্থান (বাক্স টেনেও সরাতে পারেন)', "Crop position (you can also drag the box)"), UI.el('div', {}, slider, posLbl)));
        controls.appendChild(UI.el('div', { class: 'row' }, UI.field(tr('শুরুর সময় (সেকেন্ড), ঐচ্ছিক', "Start time (seconds), optional"), start), UI.field(tr('দৈর্ঘ্য (সেকেন্ড), ঐচ্ছিক', "Length (seconds), optional"), dur), UI.field(tr('প্রসেসিং', "Processing"), qual)));
        controls.appendChild(UI.el('div', { class: 'row' }, UI.btn(tr('প্রিভিউ চালান/থামান', "Play/pause preview"), function () { vid.paused ? vid.play() : vid.pause(); }, { cls: 'alt sm' }), go));
        go.disabled = false;
        setTimeout(layoutBox, 50);
      });
      vid.addEventListener('error', function () { stage.appendChild(UI.notice('warn', tr('প্রিভিউ দেখানো যাচ্ছে না (কোডেক সমর্থিত নয়)। তবু "ভিডিও বানান" চেষ্টা করতে পারেন, কিন্তু কাটার অবস্থান আন্দাজে হবে।', "The preview cannot be shown (codec not supported). You can still try \"Create video\", but the crop position will be a guess."))); });
    }
    function geom() {
      var r = PRESETS[preset].r, va = vw / vh, cw, ch;
      if (r < va) { ch = vh; cw = vh * r; } else { cw = vw; ch = vw / r; }
      cw = even(Math.min(cw, vw)); ch = even(Math.min(ch, vh));
      var horiz = r < va;                 // সরানো যায় কোন দিকে
      var x = horiz ? even((vw - cw) * pos / 100) : 0, y = horiz ? 0 : even((vh - ch) * pos / 100);
      return { cw: cw, ch: ch, x: x, y: y, horiz: horiz, free: horiz ? vw - cw : vh - ch };
    }
    function layoutBox() {
      if (!vw || !vid) return;
      var g = geom(), W = vid.clientWidth, H = vid.clientHeight, sx = W / vw, sy = H / vh;
      box.style.left = (g.x * sx) + 'px'; box.style.top = (g.y * sy) + 'px'; box.style.width = (g.cw * sx) + 'px'; box.style.height = (g.ch * sy) + 'px';
      slider.disabled = g.free <= 1;
      posLbl.textContent = tr('কাটা অংশ: ', "Crop area: ") + UI.n(g.cw) + '×' + UI.n(g.ch) + ' px' + (g.free > 1 ? (g.horiz ? tr(' · বাঁ-ডান সরানো যায়', " · can move left-right") : tr(' · উপর-নিচ সরানো যায়', " · can move up-down")) : tr(' · এই ভিডিও এই মাপে প্রায় পুরোটাই আসে', " · this video almost fully fits this size"));
    }
    slider.addEventListener('input', function () { pos = +slider.value; layoutBox(); });
    (function bindDrag() {
      var d = null;
      document.addEventListener('pointerdown', function (e) { if (!box || e.target !== box) return; d = { x: e.clientX, y: e.clientY, pos: pos }; box.setPointerCapture(e.pointerId); e.preventDefault(); });
      document.addEventListener('pointermove', function (e) {
        if (!d) return; var g = geom(); if (g.free <= 1) return;
        var span = g.horiz ? (vid.clientWidth - box.clientWidth) : (vid.clientHeight - box.clientHeight); if (span <= 0) return;
        var delta = g.horiz ? e.clientX - d.x : e.clientY - d.y;
        pos = Math.max(0, Math.min(100, d.pos + delta / span * 100)); slider.value = pos; layoutBox();
      });
      document.addEventListener('pointerup', function () { d = null; });
    })();

    async function run() {
      UI.clear(out); var prog = UI.progress(); out.appendChild(prog); go.disabled = true;
      try {
        sizeCheck(file);
        if (!vw) throw new Error(tr('ভিডিওর মাপ জানা যায়নি, তাই কাটা সম্ভব হচ্ছে না।', "The video size is unknown, so cropping is not possible."));
        var g = geom(), P = PRESETS[preset], f = Math.min(1, P.w / g.cw);
        var ow = even(g.cw * f), oh = even(g.ch * f);
        var inName = 'input.' + (UI.ext(file.name) || 'mp4'), outName = 'output.mp4';
        var ss = UI.parseNum(start.value), tt = UI.parseNum(dur.value), args = [];
        if (ss > 0) args.push('-ss', String(ss));
        args.push('-i', inName);
        if (tt > 0) args.push('-t', String(tt));
        args.push('-vf', 'crop=' + g.cw + ':' + g.ch + ':' + g.x + ':' + g.y + ',scale=' + ow + ':' + oh,
          '-c:v', 'libx264', '-preset', qual.value === 'fast' ? 'ultrafast' : 'veryfast', '-crf', qual.value === 'fast' ? '29' : '25', '-pix_fmt', 'yuv420p',
          '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', outName);
        var data = await runFF(function (m) { prog.set(0, m); }, function (p) { prog.set(p); }, inName, file, args, outName);
        var blob = new Blob([data], { type: 'video/mp4' });
        UI.done(out, blob, 'ToolGhor(social-video-cropper).' + 'mp4', tr('✓ ভিডিও তৈরি হয়েছে: ', "✓ Video created: ") + UI.n(ow) + '×' + UI.n(oh) + ' px');
        out.firstChild.appendChild(UI.el('video', { controls: true, playsinline: true, src: URL.createObjectURL(blob), style: { maxWidth: '100%', maxHeight: '420px', marginTop: '12px', borderRadius: '10px', background: '#000' } }));
      } catch (e) { UI.clear(out); out.appendChild(UI.notice('err', UI.err(e))); }
      go.disabled = false;
    }
    root.appendChild(UI.el('div', { class: 'stack' }, drop, info, stage, controls, out,
      UI.el('small', { class: 'lbl' }, tr('বড় ভিডিওতে সময় লাগে। ১–২ মিনিটের ভিডিওর জন্য সবচেয়ে ভালো। প্রসেস চলার সময় ট্যাব বন্ধ করবেন না।', "Large videos take time. Works best for videos of 1–2 minutes. Do not close this tab while processing."))));
  };

  /* ================= SnapYT YouTube Downloader (https://www.snapyt.app) ================= */
  T['youtube-downloader'] = function (root) {
    var curData = null;
    var curTab = 'video'; // 'video' | 'audio' | 'thumb'
    var isFetching = false;

    var container = UI.el('div', { class: 'stack snapyt-box' });

    // 1. Hero Header
    var hero = UI.el('div', { class: 'snapyt-hero' },
      UI.el('span', { class: 'snapyt-badge' }, '⚡ ' + tr('SnapYT ইঞ্জিন • হাই স্পিড', 'SnapYT Engine • High Speed')),
      UI.el('h2', {}, tr('ইউটিউব ভিডিও ও অডিও ডাউনলোডার', 'YouTube Video & Audio Downloader')),
      UI.el('p', {}, tr('ইউটিউব ভিডিও বা শর্টস-এর লিংক দিন, পছন্দের কোয়ালিটি নির্বাচন করুন এবং এক ক্লিকে সরাসরি ফাইলে সেভ করুন।', 'Paste a YouTube video or Shorts link, choose your preferred quality, and save the video or audio in seconds.'))
    );

    // 2. Input Shell (SnapYT styled)
    var inputShell = UI.el('div', { class: 'snapyt-input-shell' });
    var inputIcon = UI.el('span', { class: 'snapyt-input-icon', 'aria-hidden': 'true' },
      UI.icon('youtube', 22)
    );
    var urlInput = UI.el('input', {
      type: 'url',
      class: 'snapyt-url-input',
      id: 'snapyt-video-url',
      placeholder: tr('ইউটিউব ভিডিও বা শর্টসের লিংক পেস্ট করুন… (যেমন: https://youtu.be/...)', 'Paste YouTube video or Shorts link here…'),
      autocomplete: 'off',
      autocorrect: 'off',
      autocapitalize: 'off',
      spellcheck: 'false'
    });

    var clearBtn = UI.el('button', {
      type: 'button',
      class: 'snapyt-clear-btn',
      title: tr('মুছে ফেলুন', 'Clear'),
      onclick: function () {
        urlInput.value = '';
        clearBtn.hidden = true;
        renderResult(null);
        urlInput.focus();
      }
    }, '✕');
    clearBtn.hidden = true;

    var pasteBtn = UI.el('button', {
      type: 'button',
      class: 'snapyt-paste-btn',
      title: tr('ক্লিপবোর্ড থেকে পেস্ট করুন', 'Paste from clipboard'),
      onclick: doClipboardPaste
    }, '📋 ' + tr('পেস্ট', 'Paste'));

    var submitBtn = UI.el('button', {
      type: 'button',
      class: 'snapyt-submit-btn',
      id: 'snapyt-submit-btn',
      onclick: function () { doFetch(urlInput.value); }
    }, '🚀 ' + tr('ডাউনলোড', 'Download'));

    inputShell.appendChild(inputIcon);
    inputShell.appendChild(urlInput);
    inputShell.appendChild(clearBtn);
    inputShell.appendChild(pasteBtn);
    inputShell.appendChild(submitBtn);

    // Tip line
    var tipLine = UI.el('p', { class: 'snapyt-tip' },
      tr('💡 পরামর্শ: ইউটিউবে ভিডিওর নিচে Share চেপে "Copy link" চাপুন এবং ওপরের বক্সে পেস্ট করুন।', '💡 Tip: open the YouTube video, tap Share → Copy link, then paste it above.')
    );

    // Feature Highlights Row (SnapYT style)
    var featuresRow = UI.el('div', { class: 'snapyt-features' },
      UI.el('span', { class: 'snapyt-feat-pill' }, '⚡ ' + tr('ইনস্ট্যান্ট ফেচ', 'Instant Fetch')),
      UI.el('span', { class: 'snapyt-feat-pill' }, '🎬 ' + tr('১০৮০p Full HD পর্যন্ত', 'Up to 1080p Full HD')),
      UI.el('span', { class: 'snapyt-feat-pill' }, '🎵 ' + tr('হাই-কোয়ালিটি MP3 অডিও', 'High Quality MP3')),
      UI.el('span', { class: 'snapyt-feat-pill' }, '🔒 ' + tr('১০০% নিরাপদ ও ব্রাউজার-ভিত্তিক', '100% Private, No Login'))
    );

    // Sample links
    var samplesWrap = UI.el('div', { class: 'snapyt-samples' },
      UI.el('span', { style: 'font-size:12px; color:var(--ink-3); font-weight:600;' }, tr('স্যাম্পল টেস্ট:', 'Try sample:')),
      UI.el('button', {
        type: 'button',
        class: 'snapyt-sample-chip',
        onclick: function () {
          urlInput.value = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
          clearBtn.hidden = false;
          doFetch(urlInput.value);
        }
      }, '🎵 Rick Astley (Video)'),
      UI.el('button', {
        type: 'button',
        class: 'snapyt-sample-chip',
        onclick: function () {
          urlInput.value = 'https://www.youtube.com/shorts/J46a_iGf3Yg';
          clearBtn.hidden = false;
          doFetch(urlInput.value);
        }
      }, '⚡ Shorts Sample')
    );

    var statusBox = UI.el('div', { class: 'snapyt-status-box' });
    var resultCard = UI.el('div', { class: 'snapyt-result-card' });
    resultCard.hidden = true;

    // Input handlers
    urlInput.addEventListener('input', function () {
      clearBtn.hidden = !urlInput.value.trim();
      var id = parseYtId(urlInput.value);
      if (id && (!curData || curData.id !== id)) {
        doFetch(urlInput.value);
      }
    });

    urlInput.addEventListener('paste', function () {
      setTimeout(function () {
        clearBtn.hidden = !urlInput.value.trim();
        if (urlInput.value.trim()) {
          doFetch(urlInput.value);
        }
      }, 50);
    });

    urlInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        doFetch(urlInput.value);
      }
    });

    async function doClipboardPaste() {
      try {
        if (navigator.clipboard && navigator.clipboard.readText) {
          var clip = await navigator.clipboard.readText();
          if (clip && clip.trim()) {
            urlInput.value = clip.trim();
            clearBtn.hidden = false;
            doFetch(urlInput.value);
            return;
          }
        }
      } catch (err) {}
      urlInput.focus();
      UI.toast(tr('লিংকটি বক্সে পেস্ট (Ctrl+V) করুন', 'Please paste the link into the box'));
    }

    function parseYtId(url) {
      if (!url) return null;
      var str = url.trim();
      if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return str;
      var m = str.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i);
      return m ? m[1] : null;
    }

    async function doFetch(rawUrl) {
      if (isFetching) return;
      var id = parseYtId(rawUrl);
      if (!id) {
        UI.clear(statusBox);
        if (rawUrl.trim()) {
          statusBox.appendChild(UI.notice('err', tr('দয়া করে একটি সঠিক ইউটিউব ভিডিও বা শর্টসের লিংক প্রদান করুন।', 'Please enter a valid YouTube video or Shorts link.')));
        }
        renderResult(null);
        return;
      }

      isFetching = true;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '⏳ ' + tr('তথ্য আনা হচ্ছে…', 'Fetching…');
      UI.clear(statusBox);
      statusBox.appendChild(UI.notice('info', '⏳ ' + tr('ভিডিওর তথ্য অনুসন্ধান করা হচ্ছে, অপেক্ষা করুন…', 'Fetching video details, please wait…')));

      var isShorts = /shorts/i.test(rawUrl);
      var canonical = 'https://www.youtube.com/watch?v=' + id;
      var thumbMax = 'https://i.ytimg.com/vi/' + id + '/maxresdefault.jpg';
      var thumbHq = 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg';

      try {
        var oembedUrl = 'https://www.youtube.com/oembed?url=' + encodeURIComponent(canonical) + '&format=json';
        var res = await fetch(oembedUrl);
        var meta = null;
        if (res.ok) {
          meta = await res.json();
        }

        curData = {
          id: id,
          url: canonical,
          title: (meta && meta.title) || tr('ইউটিউব ভিডিও (' + id + ')', 'YouTube Video (' + id + ')'),
          author: (meta && meta.author_name) || tr('ইউটিউব চ্যানেল', 'YouTube Channel'),
          isShorts: isShorts,
          thumbMax: thumbMax,
          thumbHq: thumbHq
        };

        UI.clear(statusBox);
        renderResult(curData);
      } catch (e) {
        curData = {
          id: id,
          url: canonical,
          title: tr('ইউটিউব ভিডিও (' + id + ')', 'YouTube Video (' + id + ')'),
          author: tr('ইউটিউব', 'YouTube'),
          isShorts: isShorts,
          thumbMax: thumbMax,
          thumbHq: thumbHq
        };
        UI.clear(statusBox);
        renderResult(curData);
      } finally {
        isFetching = false;
        submitBtn.disabled = false;
        submitBtn.innerHTML = '🚀 ' + tr('ডাউনলোড', 'Download');
      }
    }

    function renderResult(data) {
      if (!data) {
        resultCard.hidden = true;
        UI.clear(resultCard);
        return;
      }

      resultCard.hidden = false;
      UI.clear(resultCard);

      // 1. Preview Top Row
      var previewRow = UI.el('div', { class: 'snapyt-preview-row' });
      var thumbWrap = UI.el('div', { class: 'snapyt-thumb-wrap' });
      var img = UI.el('img', {
        class: 'snapyt-thumb-img',
        src: data.thumbMax,
        alt: data.title,
        loading: 'lazy',
        onerror: function () {
          if (this.src !== data.thumbHq) this.src = data.thumbHq;
        }
      });
      var badge = UI.el('span', { class: 'snapyt-thumb-badge' }, data.isShorts ? '⚡ ' + tr('শর্টস', 'Shorts') : '🎬 HD');
      thumbWrap.appendChild(img);
      thumbWrap.appendChild(badge);

      var metaCol = UI.el('div', { class: 'snapyt-meta' });
      metaCol.appendChild(UI.el('h3', { class: 'snapyt-title' }, data.title));
      metaCol.appendChild(UI.el('div', { class: 'snapyt-author-row' },
        UI.icon('youtube', 18),
        UI.el('span', {}, data.author)
      ));
      metaCol.appendChild(UI.el('a', {
        class: 'snapyt-watch-btn',
        href: data.url,
        target: '_blank',
        rel: 'noopener noreferrer'
      }, UI.icon('external-link', 14), tr('ইউটিউবে সরাসরি দেখুন', 'Watch on YouTube')));

      previewRow.appendChild(thumbWrap);
      previewRow.appendChild(metaCol);
      resultCard.appendChild(previewRow);

      // 2. Tabs Switcher: Video | Audio | Thumbnail
      var tabsNav = UI.el('div', { class: 'snapyt-tabs-nav', role: 'tablist' });
      var tabVideoBtn = UI.el('button', {
        type: 'button',
        class: 'snapyt-tab-btn' + (curTab === 'video' ? ' active' : ''),
        onclick: function () { curTab = 'video'; syncTabs(); }
      }, '🎬 ' + tr('ভিডিও (MP4)', 'Video (MP4)'));

      var tabAudioBtn = UI.el('button', {
        type: 'button',
        class: 'snapyt-tab-btn' + (curTab === 'audio' ? ' active' : ''),
        onclick: function () { curTab = 'audio'; syncTabs(); }
      }, '🎵 ' + tr('অডিও (MP3/M4A)', 'Audio (MP3/M4A)'));

      var tabThumbBtn = UI.el('button', {
        type: 'button',
        class: 'snapyt-tab-btn' + (curTab === 'thumb' ? ' active' : ''),
        onclick: function () { curTab = 'thumb'; syncTabs(); }
      }, '🖼️ ' + tr('থাম্বনেইল (HD)', 'HD Thumbnail'));

      tabsNav.appendChild(tabVideoBtn);
      tabsNav.appendChild(tabAudioBtn);
      tabsNav.appendChild(tabThumbBtn);
      resultCard.appendChild(tabsNav);

      var tabContent = UI.el('div', { class: 'snapyt-tab-content' });
      resultCard.appendChild(tabContent);

      var downloadStatusWrap = UI.el('div', { class: 'snapyt-dl-status-wrap' });
      resultCard.appendChild(downloadStatusWrap);

      function syncTabs() {
        tabVideoBtn.className = 'snapyt-tab-btn' + (curTab === 'video' ? ' active' : '');
        tabAudioBtn.className = 'snapyt-tab-btn' + (curTab === 'audio' ? ' active' : '');
        tabThumbBtn.className = 'snapyt-tab-btn' + (curTab === 'thumb' ? ' active' : '');
        UI.clear(tabContent);

        if (curTab === 'video') {
          renderVideoTable(tabContent, data, downloadStatusWrap);
        } else if (curTab === 'audio') {
          renderAudioTable(tabContent, data, downloadStatusWrap);
        } else {
          renderThumbnailPanel(tabContent, data, downloadStatusWrap);
        }
      }

      syncTabs();
    }

    // Video Table (SnapYT layout)
    function renderVideoTable(target, data, statusWrap) {
      var tableWrap = UI.el('div', { class: 'snapyt-table-wrap' });
      var table = UI.el('table', { class: 'snapyt-table' });

      var thead = UI.el('thead', {},
        UI.el('tr', {},
          UI.el('th', {}, tr('রেজোলিউশন / কোয়ালিটি', 'Resolution / Quality')),
          UI.el('th', {}, tr('ফরম্যাট', 'Format')),
          UI.el('th', {}, tr('স্ট্যাটাস', 'Status')),
          UI.el('th', { style: 'text-align:right;' }, tr('অ্যাকশন', 'Action'))
        )
      );

      var tbody = UI.el('tbody');
      var videoRows = [
        { id: '1080', label: '1080p (Full HD)', tag: tr('🔥 সেরা মান', 'Ultra HD'), rec: true },
        { id: '720', label: '720p (HD)', tag: tr('✨ প্রস্তাবিত', 'Recommended'), rec: true },
        { id: '480', label: '480p (SD)', tag: tr('স্ট্যান্ডার্ড', 'Standard'), rec: false },
        { id: '360', label: '360p (Mobile)', tag: tr('📱 কম ডাটা', 'Lightweight'), rec: false }
      ];

      videoRows.forEach(function (v) {
        var trRow = UI.el('tr');
        var tdQual = UI.el('td', {},
          UI.el('strong', { style: 'font-size:15px;' }, v.label)
        );
        var tdFmt = UI.el('td', {},
          UI.el('span', { style: 'font-weight:700; color:var(--ink-2);' }, 'MP4')
        );
        var tdStatus = UI.el('td', {},
          UI.el('span', { class: 'snapyt-badge-tag ' + (v.rec ? 'rec' : 'std') }, v.tag)
        );

        var dlBtn = UI.el('button', {
          type: 'button',
          class: 'snapyt-table-btn',
          title: tr('ক্লিক করলেই ফাইল ডাউনলোড শুরু হবে', 'Click to start direct file download'),
          onclick: function () {
            startDirectDownload('video', data, v.id, dlBtn, statusWrap);
          }
        }, '📥 ' + tr('ডাউনলোড', 'Download'));

        var tdAction = UI.el('td', { style: 'text-align:right;' }, dlBtn);

        trRow.appendChild(tdQual);
        trRow.appendChild(tdFmt);
        trRow.appendChild(tdStatus);
        trRow.appendChild(tdAction);
        tbody.appendChild(trRow);
      });

      table.appendChild(thead);
      table.appendChild(tbody);
      tableWrap.appendChild(table);
      target.appendChild(tableWrap);
    }

    // Audio Table (SnapYT layout)
    function renderAudioTable(target, data, statusWrap) {
      var tableWrap = UI.el('div', { class: 'snapyt-table-wrap' });
      var table = UI.el('table', { class: 'snapyt-table' });

      var thead = UI.el('thead', {},
        UI.el('tr', {},
          UI.el('th', {}, tr('অডিও ফরম্যাট', 'Audio Format')),
          UI.el('th', {}, tr('বিপরেট / মান', 'Quality')),
          UI.el('th', {}, tr('স্ট্যাটাস', 'Status')),
          UI.el('th', { style: 'text-align:right;' }, tr('অ্যাকশন', 'Action'))
        )
      );

      var tbody = UI.el('tbody');
      var audioRows = [
        { id: 'mp3', label: 'MP3 Audio (320 kbps)', sub: tr('স্টুডিও সাউন্ড', 'Studio Sound'), tag: tr('🎵 সেরা কোয়ালিটি', 'High Quality'), rec: true },
        { id: 'm4a', label: 'M4A Audio (AAC)', sub: tr('অরিজিনাল ইউটিউব অডিও', 'Original Audio'), tag: tr('⚡ সুপার ফাস্ট', 'Super Fast'), rec: false }
      ];

      audioRows.forEach(function (a) {
        var trRow = UI.el('tr');
        var tdFmt = UI.el('td', {},
          UI.el('strong', { style: 'font-size:15px;' }, a.label),
          UI.el('div', { style: 'font-size:12px; color:var(--ink-3); margin-top:2px;' }, a.sub)
        );
        var tdBitrate = UI.el('td', {},
          UI.el('span', { style: 'font-weight:700; color:var(--ink-2);' }, a.id.toUpperCase())
        );
        var tdStatus = UI.el('td', {},
          UI.el('span', { class: 'snapyt-badge-tag ' + (a.rec ? 'rec' : 'std') }, a.tag)
        );

        var dlBtn = UI.el('button', {
          type: 'button',
          class: 'snapyt-table-btn',
          title: tr('ক্লিক করলেই অডিও ডাউনলোড শুরু হবে', 'Click to start direct audio download'),
          onclick: function () {
            startDirectDownload('audio', data, a.id, dlBtn, statusWrap);
          }
        }, '📥 ' + tr('ডাউনলোড', 'Download'));

        var tdAction = UI.el('td', { style: 'text-align:right;' }, dlBtn);

        trRow.appendChild(tdFmt);
        trRow.appendChild(tdBitrate);
        trRow.appendChild(tdStatus);
        trRow.appendChild(tdAction);
        tbody.appendChild(trRow);
      });

      table.appendChild(thead);
      table.appendChild(tbody);
      tableWrap.appendChild(table);
      target.appendChild(tableWrap);
    }

    // Thumbnail Panel
    function renderThumbnailPanel(target, data) {
      var wrap = UI.el('div', { style: 'display:flex; flex-direction:column; gap:14px; align-items:center;' });
      var imgBox = UI.el('div', { style: 'width:100%; max-width:540px; border-radius:14px; overflow:hidden; border:1px solid var(--line); box-shadow:0 6px 20px rgba(0,0,0,0.12);' },
        UI.el('img', {
          src: data.thumbMax,
          style: 'width:100%; height:auto; display:block;',
          onerror: function () { if (this.src !== data.thumbHq) this.src = data.thumbHq; }
        })
      );

      var dlThumbBtn = UI.el('button', {
        type: 'button',
        class: 'snapyt-table-btn',
        style: 'padding:12px 28px; font-size:15px;',
        onclick: async function () {
          dlThumbBtn.disabled = true;
          dlThumbBtn.innerHTML = '⏳ ' + tr('ডাউনলোড হচ্ছে…', 'Downloading…');
          try {
            var r = await fetch(data.thumbMax);
            if (!r.ok) r = await fetch(data.thumbHq);
            var blob = await r.blob();
            var safeName = (data.title || 'youtube-thumbnail').replace(/[/\\?%*:|"<>]/g, '_').slice(0, 45);
            UI.download(blob, safeName + '-thumbnail.jpg');
            UI.toast(tr('✓ থাম্বনেইল সফলভাবে ডাউনলোড সম্পন্ন!', '✓ Thumbnail downloaded!'));
          } catch (e) {
            window.open(data.thumbMax, '_blank');
          } finally {
            dlThumbBtn.disabled = false;
            dlThumbBtn.innerHTML = '🖼️ ' + tr('HD থাম্বনেইল ডাউনলোড করুন (JPG)', 'Download HD Thumbnail (JPG)');
          }
        }
      }, '🖼️ ' + tr('HD থাম্বনেইল ডাউনলোড করুন (JPG)', 'Download HD Thumbnail (JPG)'));

      wrap.appendChild(imgBox);
      wrap.appendChild(dlThumbBtn);
      target.appendChild(wrap);
    }

    // SnapYT Direct in-browser download executor
    async function startDirectDownload(mode, data, quality, btn, statusWrap) {
      var origBtnContent = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '⏳ ' + tr('প্রস্তুত হচ্ছে…', 'Preparing…');

      var fmt = quality || (mode === 'audio' ? 'mp3' : '720');
      var ext = mode === 'audio' ? (quality === 'm4a' ? 'm4a' : 'mp3') : 'mp4';
      var cleanTitle = (data.title || 'video').replace(/[/\\?%*:|"<>]/g, '_').trim();
      var fileName = cleanTitle + '.' + ext;

      UI.clear(statusWrap);
      var progressNotice = UI.el('div', {
        class: 'snapyt-dl-alert',
        style: 'background:color-mix(in srgb, var(--paddy) 9%, var(--paper)); border-color:var(--paddy);'
      });
      progressNotice.appendChild(UI.notice('info', '⏳ ' + tr('আপনার ' + (mode === 'audio' ? 'অডিও' : 'ভিডিও') + ' (' + quality + ') ফাইলটি প্রস্তুত হচ্ছে, অনুগ্রহ করে কয়েক সেকেন্ড অপেক্ষা করুন…', 'Preparing ' + (mode === 'audio' ? 'audio' : 'video') + ' (' + quality + ') download stream, please wait a moment…')));
      statusWrap.appendChild(progressNotice);

      try {
        var endpoint = '/api/yt-download?url=' + encodeURIComponent(data.url) + '&format=' + encodeURIComponent(fmt);
        var res = await fetch(endpoint);
        var json = await res.json();

        if (json && json.download_url) {
          // Trigger in-browser direct download instantly
          var dlAnchor = document.createElement('a');
          dlAnchor.href = json.download_url;
          dlAnchor.setAttribute('download', fileName);
          dlAnchor.setAttribute('target', '_blank');
          dlAnchor.setAttribute('rel', 'noopener noreferrer');
          document.body.appendChild(dlAnchor);
          dlAnchor.click();
          setTimeout(function () { dlAnchor.remove(); }, 2000);

          UI.clear(statusWrap);
          var successNotice = UI.el('div', { class: 'snapyt-dl-alert' });
          successNotice.appendChild(UI.notice('ok', tr('✓ আপনার ' + (mode === 'audio' ? 'অডিও' : 'ভিডিও') + ' ডাউনলোডটি শুরু হয়েছে! আপনার ব্রাউজারের ডাউনলোড ফোল্ডার চেক করুন।', '✓ Download started! Please check your browser downloads.')));

          var manualBtnWrap = UI.el('div', { style: 'margin-top:10px;' });
          var manualBtn = UI.btn('📥 ' + tr('ডাউনলোড শুরু না হলে সরাসরি এখানে ক্লিক করুন', 'Click here if download did not start'), function () {
            window.location.href = json.download_url;
          }, { cls: 'btn-pri sm' });
          manualBtnWrap.appendChild(manualBtn);
          successNotice.appendChild(manualBtnWrap);
          statusWrap.appendChild(successNotice);

          UI.toast(tr('✓ ডাউনলোড শুরু হয়েছে!', '✓ Download started!'));
        } else {
          // Upstream fallback
          var ytdownUrl = json.ytdown_url || ('https://app.ytdown.to/en38?url=' + encodeURIComponent(data.url));
          UI.clear(statusWrap);
          var fallbackNotice = UI.el('div', {
            class: 'snapyt-dl-alert',
            style: 'background:color-mix(in srgb, #f59e0b 12%, var(--paper)); border-color:#f59e0b;'
          });
          fallbackNotice.appendChild(UI.notice('warn', tr('⚡ স্ট্রিম প্রস্তুত। ফাইলটি সেভ করতে নিচের বাটনে চাপুন:', '⚡ Stream ready. Click the button below to save file:')));
          var saveBtn = UI.btn('🚀 ' + tr('ফাইল সেভ করুন', 'Save File'), function () {
            window.open(ytdownUrl, '_blank', 'noopener,noreferrer');
          }, { cls: 'btn-pri sm', style: 'margin-top:10px;' });
          fallbackNotice.appendChild(saveBtn);
          statusWrap.appendChild(fallbackNotice);
        }
      } catch (err) {
        console.warn('[SnapYT download error]', err);
        UI.clear(statusWrap);
        var errNotice = UI.el('div', { class: 'snapyt-dl-alert', style: 'background:color-mix(in srgb, #ef4444 12%, var(--paper)); border-color:#ef4444;' });
        errNotice.appendChild(UI.notice('err', tr('ডাউনলোড স্ট্রিম প্রস্তুত করতে সাময়িক সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।', 'Failed to fetch download stream. Please try again.')));
        statusWrap.appendChild(errNotice);
      } finally {
        btn.disabled = false;
        btn.innerHTML = origBtnContent;
      }
    }

    container.appendChild(hero);
    container.appendChild(inputShell);
    container.appendChild(tipLine);
    container.appendChild(featuresRow);
    container.appendChild(samplesWrap);
    container.appendChild(statusBox);
    container.appendChild(resultCard);

    root.appendChild(container);
  };
})();

