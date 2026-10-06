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

  /* ================= ইউটিউব ভিডিও ও অডিও ডাউনলোডার ================= */
  T['youtube-downloader'] = function (root) {
    var curData = null;
    var curMode = 'video'; // 'video' | 'audio' | 'thumb'
    var selVideoQuality = '720';
    var selAudioQuality = '320';

    var container = UI.el('div', { class: 'stack yt-box' });
    var inputWrap = UI.el('div', { class: 'yt-input-row' });
    var urlInput = UI.el('input', {
      type: 'url',
      class: 'yt-url-input',
      placeholder: tr('ইউটিউব ভিডিও বা শর্টসের লিংক পেস্ট করুন (যেমন: https://www.youtube.com/watch?v=...)', 'Paste YouTube video or Shorts link (e.g. https://www.youtube.com/watch?v=...)'),
      autocomplete: 'off',
      autocorrect: 'off',
      autocapitalize: 'off',
      spellcheck: 'false'
    });

    var pasteBtn = UI.btn(tr('পেস্ট', 'Paste'), doPaste, { icon: 'copy', cls: 'btn-sub' });
    var fetchBtn = UI.btn(tr('তথ্য খুঁজুন', 'Fetch Info'), function () { doFetch(urlInput.value); }, { icon: 'search', cls: 'btn-pri' });
    var clearBtn = UI.el('button', {
      type: 'button',
      class: 'yt-clear-btn',
      title: tr('মুছে ফেলুন', 'Clear'),
      onclick: function () {
        urlInput.value = '';
        clearBtn.hidden = true;
        renderState(null);
        urlInput.focus();
      }
    }, '✕');
    clearBtn.hidden = true;

    inputWrap.appendChild(UI.icon('youtube', 22));
    inputWrap.appendChild(urlInput);
    inputWrap.appendChild(clearBtn);
    inputWrap.appendChild(pasteBtn);
    inputWrap.appendChild(fetchBtn);

    // Quick samples
    var samplesWrap = UI.el('div', { class: 'yt-samples-row' },
      UI.el('span', { class: 'yt-samples-lbl' }, tr('টেস্ট করতে স্যাম্পল লিংক:', 'Test with sample:')),
      UI.el('button', {
        type: 'button',
        class: 'yt-sample-chip',
        onclick: function () {
          urlInput.value = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
          clearBtn.hidden = false;
          doFetch(urlInput.value);
        }
      }, '🎵 Rick Astley - Never Gonna Give You Up'),
      UI.el('button', {
        type: 'button',
        class: 'yt-sample-chip',
        onclick: function () {
          urlInput.value = 'https://www.youtube.com/shorts/J46a_iGf3Yg';
          clearBtn.hidden = false;
          doFetch(urlInput.value);
        }
      }, tr('⚡ ইউটিউব শর্টস', '⚡ YouTube Shorts'))
    );

    var statusBox = UI.el('div', { class: 'yt-status-box' });
    var resultCard = UI.el('div', { class: 'yt-result-card' });
    resultCard.hidden = true;

    urlInput.addEventListener('input', function () {
      clearBtn.hidden = !urlInput.value.trim();
      var id = parseYtId(urlInput.value);
      if (id && (!curData || curData.id !== id)) {
        doFetch(urlInput.value);
      }
    });

    urlInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        doFetch(urlInput.value);
      }
    });

    async function doPaste() {
      try {
        if (navigator.clipboard && navigator.clipboard.readText) {
          var clip = await navigator.clipboard.readText();
          if (clip) {
            urlInput.value = clip.trim();
            clearBtn.hidden = false;
            doFetch(urlInput.value);
            return;
          }
        }
      } catch (err) {}
      urlInput.focus();
      UI.toast(tr('লিংকটি বক্সে পেস্ট (Ctrl+V) করুন', 'Please paste (Ctrl+V) the link into the box'));
    }

    function parseYtId(url) {
      if (!url) return null;
      var str = url.trim();
      if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return str;
      var m = str.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i);
      return m ? m[1] : null;
    }

    async function doFetch(rawUrl) {
      var id = parseYtId(rawUrl);
      if (!id) {
        UI.clear(statusBox);
        if (rawUrl.trim()) {
          statusBox.appendChild(UI.notice('err', tr('দয়া করে একটি সঠিক ইউটিউব ভিডিও বা শর্টসের লিংক দিন।', 'Please provide a valid YouTube video or Shorts link.')));
        }
        renderState(null);
        return;
      }

      UI.clear(statusBox);
      statusBox.appendChild(UI.notice('info', tr('ভিডিওর তথ্য আনা হচ্ছে…', 'Fetching video details…')));
      fetchBtn.disabled = true;

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
          author: (meta && meta.author_name) || tr('ইউটিউব ক্রিয়েটর', 'YouTube Creator'),
          isShorts: isShorts,
          thumbMax: thumbMax,
          thumbHq: thumbHq,
          thumb: thumbMax
        };

        UI.clear(statusBox);
        renderState(curData);
      } catch (e) {
        // Fallback even if oembed is unreachable
        curData = {
          id: id,
          url: canonical,
          title: tr('ইউটিউব ভিডিও (' + id + ')', 'YouTube Video (' + id + ')'),
          author: tr('ইউটিউব', 'YouTube'),
          isShorts: isShorts,
          thumbMax: thumbMax,
          thumbHq: thumbHq,
          thumb: thumbHq
        };
        UI.clear(statusBox);
        renderState(curData);
      } finally {
        fetchBtn.disabled = false;
      }
    }

    function renderState(data) {
      if (!data) {
        resultCard.hidden = true;
        UI.clear(resultCard);
        return;
      }

      resultCard.hidden = false;
      UI.clear(resultCard);

      // Top info section: Thumbnail + Details
      var previewRow = UI.el('div', { class: 'yt-preview-row' });
      
      var thumbBox = UI.el('div', { class: 'yt-thumb-box' });
      var img = UI.el('img', {
        class: 'yt-thumb-img',
        src: data.thumbMax,
        alt: data.title,
        loading: 'lazy',
        onerror: function () {
          if (this.src !== data.thumbHq) this.src = data.thumbHq;
        }
      });
      var badge = UI.el('span', { class: 'yt-thumb-badge' }, data.isShorts ? tr('⚡ শর্টস', '⚡ Shorts') : tr('🎬 ইউটিউব HD', '🎬 YouTube HD'));
      thumbBox.appendChild(img);
      thumbBox.appendChild(badge);

      var detailsBox = UI.el('div', { class: 'yt-details-box' });
      var titleEl = UI.el('h3', { class: 'yt-title' }, data.title);
      var authorEl = UI.el('div', { class: 'yt-author-row' },
        UI.icon('youtube', 18),
        UI.el('span', { class: 'yt-author-name' }, data.author)
      );
      var watchLink = UI.el('a', {
        class: 'yt-watch-link',
        href: data.url,
        target: '_blank',
        rel: 'noopener noreferrer'
      }, UI.icon('external-link', 14), tr('ইউটিউবে সরাসরি দেখুন', 'Watch on YouTube'));

      detailsBox.appendChild(titleEl);
      detailsBox.appendChild(authorEl);
      detailsBox.appendChild(watchLink);

      previewRow.appendChild(thumbBox);
      previewRow.appendChild(detailsBox);
      resultCard.appendChild(previewRow);

      // Format tabs: Video | Audio | Thumbnail
      var tabsRow = UI.el('div', { class: 'yt-tabs-nav', role: 'tablist' });
      var tabVideo = UI.el('button', {
        type: 'button',
        class: 'yt-tab-btn' + (curMode === 'video' ? ' active' : ''),
        onclick: function () { curMode = 'video'; updateTabs(); }
      }, '🎬 ' + tr('ভিডিও (MP4)', 'Video (MP4)'));

      var tabAudio = UI.el('button', {
        type: 'button',
        class: 'yt-tab-btn' + (curMode === 'audio' ? ' active' : ''),
        onclick: function () { curMode = 'audio'; updateTabs(); }
      }, '🎵 ' + tr('অডিও (MP3/M4A)', 'Audio (MP3/M4A)'));

      var tabThumb = UI.el('button', {
        type: 'button',
        class: 'yt-tab-btn' + (curMode === 'thumb' ? ' active' : ''),
        onclick: function () { curMode = 'thumb'; updateTabs(); }
      }, '🖼️ ' + tr('HD থাম্বনেইল', 'HD Thumbnail'));

      tabsRow.appendChild(tabVideo);
      tabsRow.appendChild(tabAudio);
      tabsRow.appendChild(tabThumb);
      resultCard.appendChild(tabsRow);

      var tabContent = UI.el('div', { class: 'yt-tab-content' });
      resultCard.appendChild(tabContent);

      function updateTabs() {
        tabVideo.className = 'yt-tab-btn' + (curMode === 'video' ? ' active' : '');
        tabAudio.className = 'yt-tab-btn' + (curMode === 'audio' ? ' active' : '');
        tabThumb.className = 'yt-tab-btn' + (curMode === 'thumb' ? ' active' : '');
        UI.clear(tabContent);

        if (curMode === 'video') {
          renderVideoOptions(tabContent, data);
        } else if (curMode === 'audio') {
          renderAudioOptions(tabContent, data);
        } else {
          renderThumbOptions(tabContent, data);
        }
      }

      updateTabs();
    }

    function renderVideoOptions(target, data) {
      var sec = UI.el('div', { class: 'yt-opt-panel' });
      var head = UI.el('div', { class: 'yt-opt-head' },
        UI.el('h4', {}, tr('ভিডিও রেজোলিউশন ও কোয়ালিটি নির্বাচন করুন:', 'Select Video Resolution & Quality:'))
      );

      var qGrid = UI.el('div', { class: 'yt-q-grid' });
      var qualities = [
        { id: '1080', label: '1080p (Full HD)', sub: tr('সেরা মান • বড় সাইজ', 'Best Quality • Crisp Details') },
        { id: '720', label: '720p (HD)', sub: tr('প্রস্তাবিত • দ্রুত ডাউনলোড', 'Recommended • Fast Download'), rec: true },
        { id: '480', label: '480p (SD)', sub: tr('মাঝারি কোয়ালিটি', 'Standard Definition • Light') },
        { id: '360', label: '360p (Mobile)', sub: tr('কম ডাটা খরচ • ছোট সাইজ', 'Mobile Friendly • Low Data') }
      ];

      qualities.forEach(function (q) {
        var card = UI.el('button', {
          type: 'button',
          class: 'yt-q-card' + (selVideoQuality === q.id ? ' sel' : '') + (q.rec ? ' rec' : ''),
          onclick: function () {
            selVideoQuality = q.id;
            qGrid.querySelectorAll('.yt-q-card').forEach(function (c) { c.classList.remove('sel'); });
            card.classList.add('sel');
          }
        });
        if (q.rec) {
          card.appendChild(UI.el('span', { class: 'yt-q-rec-badge' }, tr('সেরা পছন্দ', 'Popular')));
        }
        card.appendChild(UI.el('b', { class: 'yt-q-title' }, q.label));
        card.appendChild(UI.el('small', { class: 'yt-q-sub' }, q.sub));
        qGrid.appendChild(card);
      });

      var actionWrap = UI.el('div', { class: 'yt-action-wrap' });
      var mainBtn = UI.btn(tr('🎬 MP4 ভিডিও ডাউনলোড শুরু করুন', '🎬 Download MP4 Video'), function () {
        triggerDownload('video', data, selVideoQuality);
      }, { cls: 'btn-pri yt-main-dl-btn' });

      var altNote = UI.el('div', { class: 'yt-server-note' },
        UI.el('p', { class: 'yt-note-text' }, tr('💡 কোনো কারণে নেটওয়ার্কে একটি সার্ভার ব্লক থাকলে বা ধীরগতির হলে নিচের যেকোনো সার্ভার ব্যবহার করুন:', '💡 If one server is blocked or slow on your network, use any alternative server below:')),
        UI.el('div', { class: 'yt-server-buttons' },
          UI.btn('⚡ ' + tr('সার্ভার ১ (Cobalt - বিজ্ঞাপনমুক্ত)', 'Server 1 (Cobalt - Ad-Free)'), function () {
            openResolver('cobalt', data.url);
          }, { cls: 'btn-sub' }),
          UI.btn('🚀 ' + tr('সার্ভার ২ (SaveFrom ডিরেক্ট)', 'Server 2 (SaveFrom Direct)'), function () {
            openResolver('savefrom', data.url);
          }, { cls: 'btn-sub' }),
          UI.btn('🔥 ' + tr('সার্ভার ৩ (Y2Mate ফাস্ট গেটওয়ে)', 'Server 3 (Y2Mate Fast Gateway)'), function () {
            openResolver('y2mate', data.url);
          }, { cls: 'btn-sub' })
        )
      );

      sec.appendChild(head);
      sec.appendChild(qGrid);
      actionWrap.appendChild(mainBtn);
      sec.appendChild(actionWrap);
      sec.appendChild(altNote);
      target.appendChild(sec);
    }

    function renderAudioOptions(target, data) {
      var sec = UI.el('div', { class: 'yt-opt-panel' });
      var head = UI.el('div', { class: 'yt-opt-head' },
        UI.el('h4', {}, tr('অডিও ফরম্যাট ও সাউন্ড কোয়ালিটি নির্বাচন করুন:', 'Select Audio Format & Sound Quality:'))
      );

      var qGrid = UI.el('div', { class: 'yt-q-grid' });
      var audios = [
        { id: '320', label: tr('MP3 (৩২০ kbps)', 'MP3 (320 kbps)'), sub: tr('স্টুডিও সাউন্ড • সর্বোচ্চ মান', 'Studio Sound • Ultra Quality'), rec: true },
        { id: '256', label: tr('MP3 (২৫৬ kbps)', 'MP3 (256 kbps)'), sub: tr('উচ্চমানের অডিও • ক্লিয়ার বেস', 'High Quality • Clear Sound') },
        { id: '128', label: tr('MP3 (১২৮ kbps)', 'MP3 (128 kbps)'), sub: tr('স্ট্যান্ডার্ড সাইজ • দ্রুত ডাউনলোড', 'Standard Size • Fast Download') },
        { id: 'm4a', label: tr('M4A (AAC অরিজিনাল)', 'M4A (Original AAC)'), sub: tr('ইউটিউবের মূল অডিও ট্র্যাক', 'Original YouTube Audio Track') }
      ];

      audios.forEach(function (q) {
        var card = UI.el('button', {
          type: 'button',
          class: 'yt-q-card' + (selAudioQuality === q.id ? ' sel' : '') + (q.rec ? ' rec' : ''),
          onclick: function () {
            selAudioQuality = q.id;
            qGrid.querySelectorAll('.yt-q-card').forEach(function (c) { c.classList.remove('sel'); });
            card.classList.add('sel');
          }
        });
        if (q.rec) {
          card.appendChild(UI.el('span', { class: 'yt-q-rec-badge' }, tr('সেরা সাউন্ড', 'Best Audio')));
        }
        card.appendChild(UI.el('b', { class: 'yt-q-title' }, q.label));
        card.appendChild(UI.el('small', { class: 'yt-q-sub' }, q.sub));
        qGrid.appendChild(card);
      });

      var actionWrap = UI.el('div', { class: 'yt-action-wrap' });
      var mainBtn = UI.btn(tr('🎵 MP3 অডিও ডাউনলোড শুরু করুন', '🎵 Download MP3 Audio'), function () {
        triggerDownload('audio', data, selAudioQuality);
      }, { cls: 'btn-pri yt-main-dl-btn' });

      var altNote = UI.el('div', { class: 'yt-server-note' },
        UI.el('p', { class: 'yt-note-text' }, tr('💡 অডিও ডাউনলোডের বিকল্প গেটওয়ে:', '💡 Alternative Audio Download Gateways:')),
        UI.el('div', { class: 'yt-server-buttons' },
          UI.btn('⚡ ' + tr('অডিও সার্ভার ১ (Cobalt অডিও)', 'Audio Server 1 (Cobalt Audio)'), function () {
            openResolver('cobalt-audio', data.url);
          }, { cls: 'btn-sub' }),
          UI.btn('🚀 ' + tr('অডিও সার্ভার ২ (Y2Mate MP3)', 'Audio Server 2 (Y2Mate MP3)'), function () {
            openResolver('y2mate-audio', data.url);
          }, { cls: 'btn-sub' }),
          UI.btn('🔥 ' + tr('অডিও সার্ভার ৩ (YT1s MP3)', 'Audio Server 3 (YT1s MP3)'), function () {
            openResolver('yt1s-audio', data.url);
          }, { cls: 'btn-sub' })
        )
      );

      // Local companion tool banner
      var rootUrl = UI.getRoot ? UI.getRoot() : '';
      var companionBanner = UI.el('div', { class: 'yt-companion-box' },
        UI.icon('audio-lines', 24),
        UI.el('div', { class: 'yt-companion-text' },
          UI.el('b', {}, tr('আপনার কাছে কি আগেই কোনো ভিডিও ফাইল ডাউনলোড করা আছে?', 'Already have a video file saved on your device?')),
          UI.el('p', {}, tr('সেটির অডিও আলাদা করতে আমাদের সম্পূর্ণ অফলাইন ও ব্রাউজার-ভিত্তিক ', 'To extract its audio 100% locally in your browser, try our '),
            UI.el('a', { href: rootUrl + (UI.lang === 'bn' ? 'bn/' : '') + 'tools/audio-extractor/index.html' }, tr('ভিডিও থেকে অডিও (Audio Extractor)', 'Audio Extractor')),
            tr(' টুলটি ব্যবহার করতে পারেন। কোনো ইন্টারনেট ডাটা খরচ হবে না।', ' tool. No extra internet data is used.')
          )
        )
      );

      sec.appendChild(head);
      sec.appendChild(qGrid);
      actionWrap.appendChild(mainBtn);
      sec.appendChild(actionWrap);
      sec.appendChild(altNote);
      sec.appendChild(companionBanner);
      target.appendChild(sec);
    }

    function renderThumbOptions(target, data) {
      var sec = UI.el('div', { class: 'yt-opt-panel' });
      var head = UI.el('div', { class: 'yt-opt-head' },
        UI.el('h4', {}, tr('হাই-রেজুলেশন থাম্বনেইল (HD Thumbnail):', 'High-Resolution Thumbnail (HD):'))
      );

      var preview = UI.el('div', { class: 'yt-thumb-full-wrap' },
        UI.el('img', {
          class: 'yt-thumb-full-img',
          src: data.thumbMax,
          alt: data.title,
          onerror: function () { if (this.src !== data.thumbHq) this.src = data.thumbHq; }
        })
      );

      var dlThumbBtn = UI.btn(tr('🖼️ HD থাম্বনেইল সরাসরি ডাউনলোড করুন (JPG)', '🖼️ Download HD Thumbnail (JPG)'), async function () {
        dlThumbBtn.disabled = true;
        try {
          UI.toast(tr('থাম্বনেইল ডাউনলোড হচ্ছে…', 'Downloading thumbnail…'));
          var r = await fetch(data.thumbMax);
          if (!r.ok) r = await fetch(data.thumbHq);
          var blob = await r.blob();
          var safeName = (data.title || 'thumbnail').replace(/[^\w\s\u0980-\u09FF-]/g, '').trim().slice(0, 40) || 'youtube-thumbnail';
          UI.download(blob, safeName + '-thumbnail.jpg');
          UI.toast(tr('✓ থাম্বনেইল ডাউনলোড সম্পন্ন হয়েছে', '✓ Thumbnail downloaded successfully'));
        } catch (e) {
          window.open(data.thumbMax, '_blank');
        } finally {
          dlThumbBtn.disabled = false;
        }
      }, { cls: 'btn-pri yt-main-dl-btn' });

      sec.appendChild(head);
      sec.appendChild(preview);
      sec.appendChild(UI.el('div', { class: 'yt-action-wrap' }, dlThumbBtn));
      target.appendChild(sec);
    }

    function triggerDownload(mode, data, quality) {
      UI.toast(tr('ডাউনলোড শুরু করার জন্য প্রস্তুত করা হচ্ছে…', 'Preparing download…'));
      if (mode === 'audio') {
        openResolver('cobalt-audio', data.url);
      } else {
        openResolver('cobalt', data.url);
      }
    }

    function openResolver(service, url) {
      var id = parseYtId(url);
      var targetUrl = '';
      if (service === 'cobalt') {
        targetUrl = 'https://cobalt.tools/#url=' + encodeURIComponent(url);
      } else if (service === 'cobalt-audio') {
        targetUrl = 'https://cobalt.tools/#url=' + encodeURIComponent(url);
      } else if (service === 'savefrom') {
        targetUrl = 'https://ssyoutube.com/watch?v=' + id;
      } else if (service === 'y2mate') {
        targetUrl = 'https://www.y2mate.com/youtube/' + id;
      } else if (service === 'y2mate-audio') {
        targetUrl = 'https://www.y2mate.com/youtube-mp3/' + id;
      } else if (service === 'yt1s-audio') {
        targetUrl = 'https://yt1s.com/en/youtube-to-mp3?q=' + encodeURIComponent(url);
      } else {
        targetUrl = 'https://cobalt.tools/#url=' + encodeURIComponent(url);
      }

      var win = window.open(targetUrl, '_blank', 'noopener,noreferrer');
      if (!win) {
        location.href = targetUrl;
      }
    }

    container.appendChild(inputWrap);
    container.appendChild(samplesWrap);
    container.appendChild(statusBox);
    container.appendChild(resultCard);

    root.appendChild(container);
  };
})();

