/* ভিডিও ও অডিও টুলস (ffmpeg.wasm, ব্রাউজারেই চলে) */
(function () {
  var UI = window.UI, T = window.Tools;
  var CORE = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd';
  var ff = null, loading = null;
  var isFFmpegBusy = false;
  var ffRunCounter = 0;

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
    if (isFFmpegBusy) {
      throw new Error(tr(
        'ভিডিও-ইঞ্জিনটি বর্তমানে অন্য একটি টাস্কে ব্যস্ত আছে। অনুগ্রহ করে আগের প্রক্রিয়া শেষ হওয়া পর্যন্ত অপেক্ষা করুন।',
        'The video engine is currently busy with another task. Please wait until the ongoing task completes.'
      ));
    }
    isFFmpegBusy = true;
    var inst;
    try { inst = await getFFmpeg(setMsg); } catch (e) { isFFmpegBusy = false; throw engineError(e); }
    var onProg = function (ev) { var p = ev && ev.progress; if (isFinite(p)) setPct(Math.max(0, Math.min(100, Math.round(p * 100)))); };
    inst.on('progress', onProg);
    try {
      setMsg(tr('ফাইল পড়া হচ্ছে…', "Reading the file…")); setPct(0);
      await inst.writeFile(inName, new Uint8Array(await file.arrayBuffer()));
      setMsg(tr('প্রসেস হচ্ছে… ট্যাব খোলা রাখুন', "Processing… keep this tab open"));
      var code = await inst.exec(args);
      if (code !== 0) throw new Error(tr('প্রসেস করা যায়নি। ফাইলটি নষ্ট, বা এতে অডিও/ভিডিও ট্র্যাক নেই, অথবা ফরম্যাট সমর্থিত নয়।', "Could not process. The file may be damaged, have no audio/video track, or be in an unsupported format."));
      var data = await inst.readFile(outName);
      setPct(100);
      return data;
    } finally {
      inst.off('progress', onProg);
      try { await inst.deleteFile(inName); } catch (e) { }
      try { await inst.deleteFile(outName); } catch (e) { }
      isFFmpegBusy = false;
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
        var f = fmt.get(), runId = ++ffRunCounter + '_' + Date.now();
        var inName = 'in_' + runId + '.' + (UI.ext(file.name) || 'mp4'), outName = 'out_' + runId + '.' + f;
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
      vid.addEventListener('error', function () {
        stage.appendChild(UI.notice('warn', tr('প্রিভিউ দেখানো যাচ্ছে না (কোডেক সমর্থিত নয়)। তবু "ভিডিও বানান" চেষ্টা করতে পারেন, কিন্তু কাটার অবস্থান আন্দাজে হবে।', "The preview cannot be shown (codec not supported). You can still try \"Create video\", but the crop position will be a guess.")));
        if (!controls.parentNode) {
          controls.appendChild(UI.el('div', { class: 'stack' }, UI.el('span', { class: 'lbl' }, tr('কোন মাপে কাটবেন?', "Which size do you want to crop to?")), tgt));
          controls.appendChild(UI.el('div', { class: 'row' }, UI.field(tr('শুরুর সময় (সেকেন্ড), ঐচ্ছিক', "Start time (seconds), optional"), start), UI.field(tr('দৈর্ঘ্য (সেকেন্ড), ঐচ্ছিক', "Length (seconds), optional"), dur), UI.field(tr('প্রসেসিং', "Processing"), qual)));
          controls.appendChild(go);
          go.disabled = false;
        }
      });
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
        var runId = ++ffRunCounter + '_' + Date.now();
        var inName = 'in_' + runId + '.' + (UI.ext(file.name) || 'mp4'), outName = 'out_' + runId + '.mp4';
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

  /* ================= YouTube Downloader ================= */
  T['youtube-downloader'] = function (root) {
    if (T['video-downloader']) {
      T['video-downloader'](root);
    }
  };
  /* ================= ভিডিও ও অডিও ডাউনলোডার ================= */

  T['video-downloader'] = function (root) {
    var mainContainer = UI.el('div', { class: 'tg-vdown-wrap' });

    // Mode state: 'online' (URL Downloader) or 'local' (File Converter)
    var curMode = 'online';

    // 1. Top Mode Switcher Tabs
    var modeNav = UI.el('div', { class: 'snapyt-mode-tabs', style: 'margin-bottom:12px;' });
    var btnOnline = UI.el('button', {
      type: 'button',
      class: 'snapyt-mode-btn active',
      onclick: function () { switchMode('online'); }
    }, '📥 ' + tr('ভিডিও ও অডিও ডাউনলোড', 'Download Video & Audio'));

    var btnLocal = UI.el('button', {
      type: 'button',
      class: 'snapyt-mode-btn',
      onclick: function () { switchMode('local'); }
    }, '⚡ ' + tr('লোকাল ফাইল কনভার্টার', 'Local File Converter'));

    modeNav.appendChild(btnOnline);
    modeNav.appendChild(btnLocal);
    mainContainer.appendChild(modeNav);

    // 2. Containers for both modes
    var onlineSection = UI.el('div', { class: 'stack' });
    var localSection = UI.el('div', { class: 'stack' });
    localSection.hidden = true;

    mainContainer.appendChild(onlineSection);
    mainContainer.appendChild(localSection);

    function switchMode(mode) {
      curMode = mode;
      btnOnline.classList.toggle('active', mode === 'online');
      btnLocal.classList.toggle('active', mode === 'local');
      onlineSection.hidden = mode !== 'online';
      localSection.hidden = mode !== 'local';
    }

    // ========================================================
    // MODE 1: ONLINE VIDEO DOWNLOADER
    // ========================================================
    var onlineInputShell = UI.el('div', { class: 'snapyt-input-shell' });
    var onlineIcon = UI.el('span', { class: 'snapyt-input-icon', 'aria-hidden': 'true' },
      UI.icon('video', 20)
    );
    var onlineInput = UI.el('input', {
      type: 'url',
      class: 'snapyt-url-input',
      id: 'tg-vdown-url-input',
      placeholder: tr('ভিডিও লিংক পেস্ট করুন (YouTube, Instagram, Facebook, Direct MP4)…', 'Paste video link (YouTube, Instagram, Facebook, Direct MP4)…'),
      autocomplete: 'off',
      spellcheck: 'false',
      oninput: function () {
        var v = this.value.trim();
        onlineClearBtn.hidden = !v;
      },
      onkeydown: function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          fetchOnlineFormats();
        }
      }
    });

    var onlineClearBtn = UI.el('button', {
      type: 'button',
      class: 'snapyt-clear-btn',
      title: tr('মুছে ফেলুন', 'Clear'),
      hidden: true,
      onclick: function () {
        onlineInput.value = '';
        onlineClearBtn.hidden = true;
        onlineInput.focus();
        renderOnlineResult(null);
      }
    }, '✕');

    var onlinePasteBtn = UI.el('button', {
      type: 'button',
      class: 'snapyt-paste-btn',
      title: tr('ক্লিপবোর্ড থেকে পেস্ট করুন', 'Paste from Clipboard'),
      onclick: async function () {
        try {
          if (navigator.clipboard && navigator.clipboard.readText) {
            var text = await navigator.clipboard.readText();
            if (text) {
              onlineInput.value = text.trim();
              onlineClearBtn.hidden = false;
              fetchOnlineFormats();
            }
          } else {
            onlineInput.focus();
            UI.toast(tr('লিংকটি পেস্ট করতে Ctrl+V চাপুন', 'Press Ctrl+V to paste link'));
          }
        } catch {
          onlineInput.focus();
        }
      }
    }, UI.icon('copy', 15), tr('পেস্ট', 'Paste'));

    var onlineSubmitBtn = UI.el('button', {
      type: 'button',
      class: 'snapyt-submit-btn',
      id: 'tg-vdown-submit-btn',
      onclick: function () { fetchOnlineFormats(); }
    }, '🔍 ' + tr('ভিডিও আনুন', 'Get Video'));

    onlineInputShell.appendChild(onlineIcon);
    onlineInputShell.appendChild(onlineInput);
    onlineInputShell.appendChild(onlineClearBtn);
    onlineInputShell.appendChild(onlinePasteBtn);
    onlineInputShell.appendChild(onlineSubmitBtn);

    var onlineTipLine = UI.el('p', { class: 'snapyt-tip' },
      tr('💡 সমর্থিত: ইউটিউব ভিডিও/শর্টস, ইনস্টাগ্রাম পাবলিক রিলস, ফেসবুক উন্মুক্ত ভিডিও এবং ডিরেক্ট MP4/WebM লিংক।', '💡 Supported: YouTube videos/Shorts, Instagram public reels, Facebook public videos, and direct MP4/WebM URLs.')
    );

    var onlineStatusBox = UI.el('div', { class: 'snapyt-status-box' });
    var onlineResultCard = UI.el('div', { class: 'snapyt-result-card' });
    onlineResultCard.hidden = true;

    var curOnlineData = null;
    var curFormatTab = 'video';
    var isFetchingFormats = false;

    async function fetchOnlineFormats() {
      if (isFetchingFormats) return;
      var rawUrl = (onlineInput.value || '').trim();
      if (!rawUrl) {
        UI.clear(onlineStatusBox);
        onlineStatusBox.appendChild(UI.notice('err', tr('দয়া করে একটি সঠিক ভিডিও লিংক প্রদান করুন।', 'Please provide a valid video URL.')));
        renderOnlineResult(null);
        return;
      }

      isFetchingFormats = true;
      onlineSubmitBtn.disabled = true;
      onlineSubmitBtn.innerHTML = '⏳ ' + tr('ভিডিও আনা হচ্ছে…', 'Getting Video…');
      UI.clear(onlineStatusBox);
      onlineStatusBox.appendChild(UI.notice('info', '⏳ ' + tr('ভিডিওর ফরম্যাট ও তথ্য অনুসন্ধান করা হচ্ছে, অপেক্ষা করুন…', 'Fetching video details and available formats, please wait…')));

      var controller = new AbortController();
      var timeoutId = setTimeout(function () { controller.abort(); }, 12000);

      try {
        var res = await fetch('/api/video-downloader?url=' + encodeURIComponent(rawUrl), {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        var data = await res.json();

        if (!data || !data.success) {
          throw new Error((data && data.error) || tr('ভিডিওর তথ্য আনা সম্ভব হয়নি। লিংকটি উন্মুক্ত কি না যাচাই করুন।', 'Could not fetch video info. Verify the URL is public.'));
        }

        curOnlineData = data;
        UI.clear(onlineStatusBox);
        renderOnlineResult(curOnlineData);
      } catch (err) {
        clearTimeout(timeoutId);
        UI.clear(onlineStatusBox);
        var isAbort = err.name === 'AbortError';
        var errMsg = isAbort
          ? tr('সার্ভার থেকে রেসপন্স পেতে দেরি হয়েছে। পুনরায় চেষ্টা করুন।', 'Request timed out. Please try again.')
          : (err.message || tr('ভিডিওটি লোড করা যায়নি। লিংকটি সঠিক কি না যাচাই করুন।', 'Failed to load video. Please verify the URL.'));
        onlineStatusBox.appendChild(UI.notice('err', errMsg));
        renderOnlineResult(null);
      } finally {
        isFetchingFormats = false;
        onlineSubmitBtn.disabled = false;
        onlineSubmitBtn.innerHTML = '🔍 ' + tr('ভিডিও আনুন', 'Get Video');
      }
    }

    var onlineFeedbackBox = UI.el('div', { class: 'snapyt-feedback-box', style: 'margin-top:16px;' });

    function triggerBrowserDownload(downloadUrl, filename) {
      if (!downloadUrl) return;
      UI.download(downloadUrl, filename);
    }

    function renderDownloadSuccess(title, quality, container, downloadUrl, filename) {
      UI.clear(onlineFeedbackBox);
      onlineFeedbackBox.hidden = false;

      var box = UI.el('div', {
        style: 'padding:16px 18px; background:color-mix(in srgb, #10b981 12%, var(--paper)); border-radius:12px; border:1.5px solid #10b981; animation: spaFadeIn .2s ease-out;'
      });

      var head = UI.el('div', { style: 'display:flex; align-items:center; gap:8px; margin-bottom:8px;' },
        UI.el('span', { style: 'font-size:22px;' }, '✅'),
        UI.el('strong', { style: 'color:var(--ink-1); font-size:16px;' }, tr('ডাউনলোড প্রস্তুত ও শুরু হয়েছে!', 'Download Ready & Started!'))
      );

      var desc = UI.el('p', { style: 'margin:0 0 12px; font-size:13.5px; color:var(--ink-2); line-height:1.4;' });
      desc.appendChild(document.createTextNode(tr('ফাইলটি আপনার ব্রাউজারে সেভ হচ্ছে: ', 'The file is now saving in your browser: ')));
      desc.appendChild(UI.el('b', {}, (title || 'Video').slice(0, 65)));
      desc.appendChild(document.createTextNode(' (' + quality + ' ' + (container || 'mp4').toUpperCase() + ')'));

      var btnRow = UI.el('div', { style: 'display:flex; gap:10px; flex-wrap:wrap; align-items:center; margin-top:12px;' });

      var saveLinkBtn = UI.el('a', {
        class: 'btn-pri sm',
        href: downloadUrl,
        download: filename || '',
        target: '_self',
        rel: 'noopener noreferrer',
        onclick: function (e) {
          e.preventDefault();
          UI.download(downloadUrl, filename);
        },
        style: 'background:#10b981; border-color:#10b981; font-weight:700; color:#fff; text-decoration:none; display:inline-flex; align-items:center; gap:8px; padding:10px 18px; border-radius:8px; cursor:pointer;'
      }, '📥 ' + tr('সরাসরি ফাইল সেভ করুন (Save File Directly)', 'Save File Directly'));

      btnRow.appendChild(saveLinkBtn);

      var hint = UI.el('small', { style: 'display:block; margin-top:10px; color:var(--ink-3); font-size:12px;' },
        tr('💡 পরামর্শ: আপনার ব্রাউজারের ডাউনলোড বারে ফাইলটি না নামলে ওপরের সবুজ বাটনে চাপুন। সাথে সাথে ফাইলটি সেভ হবে।', '💡 Tip: If download didn\'t begin automatically in your browser bar, click the green button above to save immediately.')
      );

      box.appendChild(head);
      box.appendChild(desc);
      box.appendChild(btnRow);
      box.appendChild(hint);
      onlineFeedbackBox.appendChild(box);
    }

    async function handleFormatDownload(fmt, btn) {
      var origText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '⬇️ ' + tr('ডাউনলোড হচ্ছে…', 'Downloading…');

      UI.clear(onlineFeedbackBox);
      onlineFeedbackBox.hidden = false;
      onlineFeedbackBox.appendChild(UI.notice('info', '⏳ ' + tr('ডাউনলোড লিঙ্ক প্রস্তুত করা হচ্ছে…', 'Preparing download link…')));

      var cleanTitle = (curOnlineData && curOnlineData.title) ? curOnlineData.title.replace(/[/\\?%*:|"<>]/g, '').slice(0, 50) : 'Video';
      var filename = 'ToolGhor-' + cleanTitle + '.' + (fmt.container || 'mp4');

      try {
        // Case A: Pre-generated direct download URL (for Instagram, Facebook, direct video, or SaveAPI signed link)
        if (fmt.downloadUrl) {
          if (fmt.downloadUrl.indexOf('action=saveapi_yt_create') > -1) {
            var sRes = await fetch(fmt.downloadUrl);
            var sData = await sRes.json();
            if (!sData || !sData.success || (!sData.download_url && !sData.direct_url)) {
              throw new Error((sData && sData.error) || tr('ডাউনলোড লিঙ্ক তৈরি করা যায়নি।', 'Failed to generate download link.'));
            }
            var isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
            // On mobile devices, direct_url streams straight from CDN without false Content-Length mismatch, preventing the 99% stall
            var finalDlUrl = (isMobile && sData.direct_url) ? sData.direct_url : (sData.download_url || sData.direct_url);
            var targetFilename = sData.filename || filename;
            triggerBrowserDownload(finalDlUrl, targetFilename);
            renderDownloadSuccess(curOnlineData ? curOnlineData.title : 'Video', fmt.qualityLabel || fmt.quality, sData.ext || fmt.container || 'mp4', finalDlUrl, targetFilename);
            btn.innerHTML = '✓ ' + tr('শুরু হয়েছে', 'Started');
            UI.toast(tr('✓ ডাউনলোড ব্রাউজারে শুরু হয়েছে!', '✓ Download started in browser!'));
            setTimeout(function () {
              btn.disabled = false;
              btn.innerHTML = origText;
            }, 2500);
            return;
          }

          triggerBrowserDownload(fmt.downloadUrl, filename);
          renderDownloadSuccess(curOnlineData ? curOnlineData.title : 'Video', fmt.qualityLabel || fmt.quality, fmt.container || 'mp4', fmt.downloadUrl, filename);
          btn.innerHTML = '✓ ' + tr('শুরু হয়েছে', 'Started');
          UI.toast(tr('✓ ডাউনলোড ব্রাউজারে শুরু হয়েছে!', '✓ Download started in browser!'));
          setTimeout(function () {
            btn.disabled = false;
            btn.innerHTML = origText;
          }, 2500);
          return;
        }

        // Case B: YouTube fallback conversion engine
        if (curOnlineData && curOnlineData.platform === 'youtube') {
          var convRes = await fetch('/api/video-downloader?action=convert&format=' + encodeURIComponent(fmt.formatKey) + '&url=' + encodeURIComponent(curOnlineData.url || onlineInput.value));
          var convData = await convRes.json();

          if (!convData || !convData.success) {
            throw new Error((convData && convData.error) || tr('ডাউনলোড লিঙ্ক তৈরি করা যায়নি।', 'Failed to generate download link.'));
          }

          var targetDlUrl = convData.download_url;

          // If conversion is async (progress polling)
          if (!targetDlUrl && convData.progress_url) {
            var pUrl = convData.progress_url;
            var pollCount = 0;
            var maxPoll = 45;

            while (!targetDlUrl && pollCount < maxPoll) {
              await new Promise(function (resolve) { setTimeout(resolve, 1200); });
              pollCount++;
              try {
                var pRes = await fetch('/api/video-downloader?action=progress&progress_url=' + encodeURIComponent(pUrl));
                var pData = await pRes.json();
                if (pData && pData.download_url) {
                  targetDlUrl = pData.download_url;
                  break;
                }
                if (pData && pData.text && pData.text.toLowerCase().indexOf('unable') > -1) {
                  break;
                }
              } catch {
                // Continue polling
              }
            }
          }

          if (!targetDlUrl) {
            throw new Error(tr('সার্ভার থেকে ডাউনলোড প্রস্তুত হতে অতিরিক্ত সময় লেগেছে। দয়া করে ৭২০p ফরম্যাটটি চেষ্টা করুন।', 'Download preparation took too long. Please try the 720p format.'));
          }

          triggerBrowserDownload(targetDlUrl, filename);
          renderDownloadSuccess(curOnlineData.title, fmt.qualityLabel || fmt.quality, fmt.container || 'mp4', targetDlUrl, filename);
          btn.innerHTML = '✓ ' + tr('শুরু হয়েছে', 'Started');
          UI.toast(tr('✓ ডাউনলোড ব্রাউজারে শুরু হয়েছে!', '✓ Download started in browser!'));
          setTimeout(function () {
            btn.disabled = false;
            btn.innerHTML = origText;
          }, 2500);
          return;
        }

        throw new Error(tr('ডাউনলোড লিঙ্ক পাওয়া যায়নি।', 'Download link unavailable.'));
      } catch (err) {
        UI.clear(onlineFeedbackBox);
        onlineFeedbackBox.appendChild(UI.notice('err', err.message || tr('ডাউনলোড শুরু করতে সমস্যা হয়েছে।', 'Failed to start download.')));
        btn.disabled = false;
        btn.innerHTML = origText;
      }
    }

    function renderOnlineResult(data) {
      if (!data) {
        onlineResultCard.hidden = true;
        UI.clear(onlineResultCard);
        return;
      }

      onlineResultCard.hidden = false;
      UI.clear(onlineResultCard);
      UI.clear(onlineFeedbackBox);
      onlineFeedbackBox.hidden = true;

      // 1. Preview Top Row
      var previewRow = UI.el('div', { class: 'snapyt-preview-row' });
      var thumbWrap = UI.el('div', { class: 'snapyt-thumb-wrap' });

      var thumbSrc = (data.thumbnails && (data.thumbnails.max || data.thumbnails.hq)) || '';
      var img = UI.el('img', {
        class: 'snapyt-thumb-img',
        src: thumbSrc,
        alt: data.title || 'Video',
        loading: 'lazy',
        onerror: function () {
          this.style.display = 'none';
        }
      });

      var platformName = data.platform === 'youtube' ? 'YouTube' : data.platform === 'instagram' ? 'Instagram' : data.platform === 'facebook' ? 'Facebook' : 'Direct Link';
      var badge = UI.el('span', { class: 'snapyt-thumb-badge' }, platformName);
      thumbWrap.appendChild(img);
      thumbWrap.appendChild(badge);

      var metaCol = UI.el('div', { class: 'snapyt-meta' });
      metaCol.appendChild(UI.el('h3', { class: 'snapyt-title' }, data.title || 'Video'));
      metaCol.appendChild(UI.el('div', { class: 'snapyt-author-row' },
        UI.icon('video', 16),
        UI.el('span', {}, data.author || platformName)
      ));

      var resetBtn = UI.el('button', {
        type: 'button',
        class: 'tg-reset-btn',
        onclick: function () {
          onlineInput.value = '';
          onlineClearBtn.hidden = true;
          renderOnlineResult(null);
          onlineInput.focus();
        }
      }, '🔄 ' + tr('অন্য ভিডিও খুঁজুন', 'Search Another Video'));
      metaCol.appendChild(resetBtn);

      previewRow.appendChild(thumbWrap);
      previewRow.appendChild(metaCol);
      onlineResultCard.appendChild(previewRow);

      // 2. Format Selection Tabs (Video vs Audio)
      var formatSection = UI.el('div', { style: 'margin-top:20px;' });
      var formatHeading = UI.el('div', { style: 'margin-bottom:14px;' },
        UI.el('h4', { style: 'margin:0 0 4px; font-size:16px; font-weight:700; color:var(--ink);' }, '📥 ' + tr('ডাউনলোড ফরম্যাট নির্বাচন করুন', 'Choose Download Format')),
        UI.el('p', { style: 'margin:0; font-size:13px; color:var(--ink-2);' }, tr('যে ফরম্যাটে নামাতে চান, সেটির ডাউনলোড বাটনে ক্লিক করুন। সাথে সাথে ব্রাউজারে ডাউনলোড শুরু হবে।', 'Click download next to your desired format to download immediately in your browser.'))
      );
      formatSection.appendChild(formatHeading);

      var tabsNav = UI.el('div', { class: 'snapyt-tabs-nav' });
      var tabBtnVideo = UI.el('button', {
        type: 'button',
        class: 'snapyt-tab-btn' + (curFormatTab === 'video' ? ' active' : ''),
        onclick: function () { setOnlineFormatTab('video'); }
      }, '🎬 ' + tr('ভিডিও (MP4/WebM)', 'Video (MP4/WebM)'));

      var tabBtnAudio = UI.el('button', {
        type: 'button',
        class: 'snapyt-tab-btn' + (curFormatTab === 'audio' ? ' active' : ''),
        onclick: function () { setOnlineFormatTab('audio'); }
      }, '🎵 ' + tr('অডিও (MP3/M4A)', 'Audio (MP3/M4A)'));

      tabsNav.appendChild(tabBtnVideo);
      tabsNav.appendChild(tabBtnAudio);
      formatSection.appendChild(tabsNav);

      var tabContentWrap = UI.el('div', { class: 'snapyt-tab-content' });
      formatSection.appendChild(tabContentWrap);

      function setOnlineFormatTab(tab) {
        curFormatTab = tab;
        tabBtnVideo.classList.toggle('active', tab === 'video');
        tabBtnAudio.classList.toggle('active', tab === 'audio');
        renderOnlineTabContent();
      }

      function renderOnlineTabContent() {
        UI.clear(tabContentWrap);
        var fmts = (data.formats || []).filter(function (f) {
          return curFormatTab === 'audio' ? f.type === 'audio' : f.type === 'video';
        });

        if (!fmts.length) {
          tabContentWrap.appendChild(UI.notice('info', tr('এই ভিডিওটির জন্য কোনো ফরম্যাট পাওয়া যায়নি।', 'No formats available for this category.')));
          return;
        }

        var tableWrap = UI.el('div', { class: 'snapyt-table-wrap' });
        var table = UI.el('table', { class: 'snapyt-table' });
        var thead = UI.el('thead', {},
          UI.el('tr', {},
            UI.el('th', {}, tr('কোয়ালিটি / মান', 'Quality / Format')),
            UI.el('th', {}, tr('ফরম্যাট', 'Container')),
            UI.el('th', {}, tr('অডিও স্ট্যাটাস', 'Audio')),
            UI.el('th', {}, tr('ফাইল সাইজ', 'File Size')),
            UI.el('th', { style: 'text-align:right;' }, tr('অ্যাকশন', 'Action'))
          )
        );
        var tbody = UI.el('tbody');

        fmts.forEach(function (fmt) {
          var trEl = UI.el('tr');
          var tdQuality = UI.el('td', {});
          tdQuality.appendChild(UI.el('strong', {}, fmt.qualityLabel || fmt.quality || fmt.formatKey));
          if (fmt.isRecommended) {
            tdQuality.appendChild(UI.el('span', { class: 'snapyt-badge-tag rec', style: 'margin-left:8px;' }, tr('জনপ্রিয়', 'Popular')));
          }

          var tdFormat = UI.el('td', {},
            UI.el('span', { class: 'snapyt-badge-tag std' }, (fmt.container || 'mp4').toUpperCase())
          );

          var tdAudio = UI.el('td', {},
            fmt.hasAudio !== false
              ? UI.el('span', { style: 'color:var(--ok, #10b981); font-weight:600; font-size:12.5px;' }, '✓ ' + tr('অডিও সহ', 'With Audio'))
              : UI.el('span', { style: 'color:var(--ink-3); font-size:12.5px;' }, '❌ ' + tr('শুধু ভিডিও', 'Video Only'))
          );

          var tdSize = UI.el('td', {},
            fmt.size_mb
              ? UI.el('span', { style: 'color:var(--ink-2); font-weight:500; font-size:12.5px;' }, fmt.size_mb + ' MB')
              : UI.el('span', { style: 'color:var(--ink-3); font-size:12px;' }, tr('স্ট্যান্ডার্ড', 'Standard'))
          );

          var tdAction = UI.el('td', { style: 'text-align:right;' });
          var dlBtn = UI.el('button', {
            type: 'button',
            class: 'snapyt-table-btn',
            onclick: function () { handleFormatDownload(fmt, this); }
          }, UI.icon('download', 14), tr('ডাউনলোড', 'Download'));

          tdAction.appendChild(dlBtn);
          trEl.appendChild(tdQuality);
          trEl.appendChild(tdFormat);
          trEl.appendChild(tdAudio);
          trEl.appendChild(tdSize);
          trEl.appendChild(tdAction);
          tbody.appendChild(trEl);
        });

        table.appendChild(thead);
        table.appendChild(tbody);
        tableWrap.appendChild(table);
        tabContentWrap.appendChild(tableWrap);
      }

      renderOnlineTabContent();
      formatSection.appendChild(onlineFeedbackBox);

      var tipNotice = UI.el('p', {
        style: 'margin-top:14px; font-size:12px; color:var(--ink-3); line-height:1.5;'
      }, tr(
        '💡 পরামর্শ: ডাউনলোড বাটনে ক্লিক করলেই আপনার ব্রাউজারে সরাসরি ফাইল সেভ হবে। কোনো বিজ্ঞাপন বা পপআপ নেই।',
        '💡 Tip: Clicking Download immediately saves the file in your browser. 100% ad-free & safe.'
      ));
      formatSection.appendChild(tipNotice);

      onlineResultCard.appendChild(formatSection);
    }

    onlineSection.appendChild(onlineInputShell);
    onlineSection.appendChild(onlineTipLine);
    onlineSection.appendChild(onlineStatusBox);
    onlineSection.appendChild(onlineResultCard);

    // ========================================================
    // MODE 2: LOCAL FILE CONVERTER (WebAssembly FFmpeg)
    // ========================================================
    var localHero = UI.el('div', { class: 'snapyt-hero' },
      UI.el('h2', {}, tr('ভিডিও ফাইল কনভার্ট করুন', 'Convert Local Video Files')),
      UI.el('p', {}, tr('আপনার যেকোনো ভিডিও ফাইল ব্রাউজারেই সরাসরি MP4, WebM, MP3 বা WAV তে কনভার্ট করুন। কোনো ফাইল সার্ভারে আপলোড হয় না।', 'Convert your video files directly inside your browser into MP4, WebM, MP3, or WAV. 100% private, no server upload.'))
    );

    var localFile = null;
    var localOut = UI.el('div');
    var localInfo = UI.el('div');

    var localFmt = UI.seg([
      { value: 'mp4', label: 'MP4 (H.264 Video)' },
      { value: 'webm', label: 'WebM (VP9 Video)' },
      { value: 'mp3', label: 'MP3 (Audio)' },
      { value: 'm4a', label: 'M4A (AAC Audio)' },
      { value: 'wav', label: 'WAV (Lossless Audio)' }
    ], 'mp4', function (v) {
      var isAudio = v === 'mp3' || v === 'm4a' || v === 'wav';
      videoResField.hidden = isAudio;
      audioBrField.hidden = !isAudio || v === 'wav';
    });

    var videoRes = UI.select([
      { value: 'original', label: tr('মূল রেজোলিউশন (Original)', 'Original Resolution') },
      { value: '1080', label: '1080p Full HD (1920x1080)' },
      { value: '720', label: '720p HD (1280x720)' },
      { value: '480', label: '480p SD (854x480)' }
    ], 'original');
    var videoResField = UI.field(tr('ভিডিও রেজোলিউশন', 'Video Resolution'), videoRes);

    var audioBr = UI.select([
      { value: '128k', label: tr('১২৮ kbps (সাধারণ)', '128 kbps (Standard)') },
      { value: '192k', label: tr('১৯২ kbps (প্রস্তাবিত)', '192 kbps (Recommended)') },
      { value: '256k', label: tr('২৫৬ kbps (উচ্চমান)', '256 kbps (High Quality)') },
      { value: '320k', label: tr('৩২০ kbps (সর্বোচ্চ)', '320 kbps (Maximum)') }
    ], '192k');
    var audioBrField = UI.field(tr('অডিও মান (Bitrate)', 'Audio Quality (Bitrate)'), audioBr);
    audioBrField.hidden = true; // default is mp4

    var localGoBtn = UI.btn(tr('কনভার্ট শুরু করুন', 'Start Conversion'), runLocalConversion, {
      icon: 'video',
      disabled: true
    });

    var localDrop = UI.dropzone({
      accept: 'video/*,audio/*,.mkv,.mov,.avi,.3gp,.flv,.webm,.mp4,.m4v',
      label: tr('ভিডিও ফাইল বেছে নিন বা টেনে আনুন', 'Choose or drag a video file'),
      onFiles: function (files) {
        localFile = files[0];
        UI.clear(localOut);
        UI.clear(localInfo);
        localInfo.appendChild(UI.notice('info', localFile.name + ' · ' + UI.fmtSize(localFile.size)));
        var w = warnBig(localFile);
        if (w) localInfo.appendChild(w);
        localGoBtn.disabled = false;
      }
    });

    async function runLocalConversion() {
      if (!localFile) return;
      UI.clear(localOut);
      var prog = UI.progress();
      localOut.appendChild(prog);
      localGoBtn.disabled = true;

      try {
        sizeCheck(localFile);
        var targetExt = localFmt.get();
        var inExt = UI.ext(localFile.name) || 'mp4';
        var runId = ++ffRunCounter + '_' + Date.now();
        var inName = 'in_' + runId + '.' + inExt;
        var outName = 'out_' + runId + '.' + targetExt;

        var args = ['-i', inName];

        if (targetExt === 'mp3') {
          args.push('-vn', '-c:a', 'libmp3lame', '-b:a', audioBr.value);
        } else if (targetExt === 'm4a') {
          args.push('-vn', '-c:a', 'aac', '-b:a', audioBr.value);
        } else if (targetExt === 'wav') {
          args.push('-vn', '-c:a', 'pcm_s16le');
        } else if (targetExt === 'webm') {
          if (videoRes.value === '1080') args.push('-vf', 'scale=-2:1080');
          else if (videoRes.value === '720') args.push('-vf', 'scale=-2:720');
          else if (videoRes.value === '480') args.push('-vf', 'scale=-2:480');
          args.push('-c:v', 'libvpx-vp9', '-crf', '30', '-b:v', '0', '-c:a', 'libopus');
        } else {
          // MP4
          if (videoRes.value === '1080') args.push('-vf', 'scale=-2:1080');
          else if (videoRes.value === '720') args.push('-vf', 'scale=-2:720');
          else if (videoRes.value === '480') args.push('-vf', 'scale=-2:480');
          args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'aac');
        }

        args.push(outName);

        var data = await runFF(
          function (msg) { prog.set(0, msg); },
          function (p) { prog.set(p); },
          inName,
          localFile,
          args,
          outName
        );

        var mime = targetExt === 'mp3' ? 'audio/mpeg'
          : targetExt === 'm4a' ? 'audio/mp4'
          : targetExt === 'wav' ? 'audio/wav'
          : targetExt === 'webm' ? 'video/webm'
          : 'video/mp4';

        var blob = new Blob([data], { type: mime });
        var outFilename = 'ToolGhor(' + localFile.name.replace(/\.[^/.]+$/, '') + ').' + targetExt;

        UI.done(localOut, blob, outFilename, '✓ ' + tr('কনভার্ট সম্পন্ন হয়েছে (', 'Conversion complete (') + targetExt.toUpperCase() + ')');

        // Add media preview player
        var previewEl;
        if (targetExt === 'mp3' || targetExt === 'm4a' || targetExt === 'wav') {
          previewEl = UI.el('audio', {
            controls: true,
            src: URL.createObjectURL(blob),
            style: { width: '100%', marginTop: '12px' }
          });
        } else {
          previewEl = UI.el('video', {
            controls: true,
            src: URL.createObjectURL(blob),
            style: { width: '100%', maxHeight: '360px', marginTop: '12px', borderRadius: '8px' }
          });
        }
        if (localOut.firstChild) {
          localOut.firstChild.appendChild(previewEl);
        }
      } catch (err) {
        UI.clear(localOut);
        localOut.appendChild(UI.notice('err', UI.err(err)));
      } finally {
        localGoBtn.disabled = false;
      }
    }

    localSection.appendChild(localHero);
    localSection.appendChild(localDrop);
    localSection.appendChild(localInfo);
    localSection.appendChild(UI.el('div', { class: 'stack' },
      UI.el('span', { class: 'lbl' }, tr('টার্গেট ফরম্যাট', 'Target Format')),
      localFmt
    ));
    localSection.appendChild(videoResField);
    localSection.appendChild(audioBrField);
    localSection.appendChild(localGoBtn);
    localSection.appendChild(localOut);

    root.appendChild(mainContainer);
  };
})();


