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
})();
