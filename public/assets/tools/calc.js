/* ক্যালকুলেটর টুলস */
(function () {
  var UI = window.UI, T = window.Tools, tr = UI.tr;
  function numIn(ph, val) { return UI.el('input', { type: 'text', inputmode: 'decimal', placeholder: ph || '', value: val == null ? '' : String(val), autocomplete: 'off' }); }
  function fmtBig(v) {
    if (v === 0) return UI.n('0');
    var a = Math.abs(v);
    if (a < 1e-6 || a >= 1e15) return UI.n(v.toExponential(4));
    return UI.num(v, 6);
  }

  /* ================= বিএমআই ================= */
  T['bmi-calculator'] = function (root) {
    var wU = 'kg', hU = 'cm';
    var w = numIn(tr('যেমন 65', "e.g. 65")), cm = numIn(tr('যেমন 165', "e.g. 165")), ft = numIn(tr('ফুট', "Feet")), inch = numIn(tr('ইঞ্চি', "Inches"));
    var res = UI.el('div', { 'aria-live': 'polite' });
    var wSeg = UI.seg([{ value: 'kg', label: tr('কেজি', "kg") }, { value: 'lb', label: tr('পাউন্ড', "Pounds") }], 'kg', function (v) { wU = v; calc(); });
    var hSeg = UI.seg([{ value: 'cm', label: tr('সেমি', "cm") }, { value: 'ftin', label: tr('ফুট-ইঞ্চি', "Feet-inches") }], 'cm', function (v) { hU = v; sync(); calc(); });
    var cmF = UI.field(tr('উচ্চতা (সেমি)', "Height (cm)"), cm), ftF = UI.field(tr('ফুট', "Feet"), ft), inF = UI.field(tr('ইঞ্চি', "Inches"), inch);
    var ftRow = UI.el('div', { class: 'row' }, ftF, inF);
    function sync() { cmF.hidden = hU !== 'cm'; ftRow.hidden = hU === 'cm'; }
    sync();
    [w, cm, ft, inch].forEach(function (i) { i.addEventListener('input', calc); });
    function calc() {
      UI.clear(res);
      var kg = UI.parseNum(w.value); if (wU === 'lb') kg *= 0.45359237;
      var h = hU === 'cm' ? UI.parseNum(cm.value) / 100 : ((UI.parseNum(ft.value || '0') || 0) * 12 + (UI.parseNum(inch.value || '0') || 0)) * 0.0254;
      if (!(kg > 0 && h > 0)) { res.appendChild(UI.notice('info', tr('ওজন ও উচ্চতা লিখলে ফলাফল এখানে দেখা যাবে।', "Enter your weight and height to see the result here."))); return; }
      if (h < 0.5 || h > 2.6 || kg < 2 || kg > 500) { res.appendChild(UI.notice('warn', tr('সংখ্যাগুলো ঠিক আছে কিনা দেখুন (ওজন কেজিতে/পাউন্ডে, উচ্চতা সঠিক এককে)।', "Please check the numbers (weight in kg/pounds, height in the right unit)."))); return; }
      var bmi = kg / (h * h);
      var cat = bmi < 18.5 ? tr('কম ওজন', "Underweight") : bmi < 25 ? tr('স্বাভাবিক ওজন', "Normal weight") : bmi < 30 ? tr('অতিরিক্ত ওজন', "Overweight") : tr('স্থূলতা', "Obesity");
      var lo = 18.5 * h * h, hi = 24.9 * h * h;
      var rng = wU === 'lb' ? UI.num(lo / 0.45359237, 1) + ' – ' + UI.num(hi / 0.45359237, 1) + tr(' পাউন্ড', " pounds") : UI.num(lo, 1) + ' – ' + UI.num(hi, 1) + tr(' কেজি', " kg");
      var pos = Math.max(0, Math.min(1, (bmi - 10) / 30)) * 100;
      var segs = [[8.5, '#4a90d9'], [6.5, '#2fa66a'], [5, '#e0a61b'], [10, '#d2452f']];
      res.appendChild(UI.el('div', { class: 'result stack' },
        UI.el('div', {}, UI.el('div', { class: 'big-num' }, UI.num(bmi, 1)), UI.el('div', { class: 'lbl' }, tr('আপনার বিএমআই: ', "Your BMI: ") + cat)),
        UI.el('div', {}, UI.el('div', { class: 'gauge-pin' }, UI.el('i', { style: { left: pos + '%' } })),
          UI.el('div', { class: 'gauge', 'aria-hidden': 'true' }, segs.map(function (s) { return UI.el('span', { style: { width: (s[0] / 30 * 100) + '%', background: s[1] } }); })),
          UI.el('div', { class: 'row', style: { justifyContent: 'space-between', fontSize: '13.5px', color: 'var(--ink-3)', marginTop: '4px' } },
            UI.el('span', {}, tr('কম', "Low")), UI.el('span', {}, tr('স্বাভাবিক', "Normal")), UI.el('span', {}, tr('বেশি', "High")), UI.el('span', {}, tr('স্থূলতা', "Obesity")))),
        UI.el('p', { style: { margin: 0 } }, tr('আপনার উচ্চতায় স্বাভাবিক ওজনের পরিসীমা (বিএমআই ১৮.৫–২৪.৯): ', "Healthy weight range for your height (BMI 18.5–24.9): "), UI.el('b', {}, rng), '।'),
        UI.notice('info', tr('এশীয়দের ক্ষেত্রে এশিয়া-প্যাসিফিক নির্দেশিকায় বিএমআই ২৩ থেকে ওজন বেশি এবং ২৫ থেকে স্থূলতা ধরা হয়। বিএমআই একটি মোটামুটি সূচক মাত্র, পেশি, বয়স ও শরীরের গড়ন হিসাবে আসে না। স্বাস্থ্য নিয়ে সিদ্ধান্তের আগে চিকিৎসকের পরামর্শ নিন।', "For Asian populations, Asia-Pacific guidelines treat a BMI from 23 as overweight and from 25 as obese. BMI is only a rough indicator: it does not account for muscle, age or body build. Please consult a doctor before making health decisions."))));

      // AI Health & Diet Planner Card
      var aiBox = UI.renderAiBox({
        title: tr('এআই স্বাস্থ্য ও ডায়েট রুটিন সহকারী', 'AI Health & Diet Consultant'),
        subtitle: tr('আপনার বর্তমান বিএমআই ও উচ্চতা অনুযায়ী কাস্টমাইজড পুষ্টি, সুষম ডায়েট ও ফিটনেস রোডম্যাপ', 'Personalized diet, nutrition and workout routine based on your BMI'),
        btnText: tr('✨ এআই পরামর্শ তৈরি করুন', '✨ Generate AI Diet & Health Plan'),
        onGenerate: async function () {
          var prompt = (UI.lang === 'bn')
            ? ('আমার উচ্চতা ' + Math.round(h * 100) + ' সেমি, ওজন ' + kg.toFixed(1) + ' কেজি, বিএমআই ' + bmi.toFixed(1) + ' (' + cat + ')। স্বাভাবিক ওজনের পরিসীমা ' + rng + '। অনুগ্রহ করে আমার জন্য:\n1. বর্তমান স্বাস্থ্যের সংক্ষিপ্ত মূল্যায়ন\n2. প্রতিদিনের সুষম ডায়েট চার্ট (বাংলাদেশি সহজলভ্য স্বাস্থ্যকর খাবারসহ)\n3. সাপ্তাহিক ব্যায়াম ও শারীরিক এক্টিভিটি রুটিন\n4. দ্রুত ও নিরাপদে স্বাস্থ্যকর ওজনে পৌঁছানোর ৩টি বিশেষজ্ঞ টিপস\nসব তথ্য স্পষ্ট বুলেট পয়েন্ট আকারে বাংলায় গুছিয়ে দিন।')
            : ('My height is ' + Math.round(h * 100) + ' cm, weight is ' + kg.toFixed(1) + ' kg, BMI is ' + bmi.toFixed(1) + ' (' + cat + '). Healthy weight range is ' + rng + '. Please provide:\n1. Health Assessment\n2. Daily Balanced Meal Plan\n3. Weekly Exercise & Physical Activity Routine\n4. Top 3 actionable tips for reaching/maintaining healthy weight.\nFormat clearly with bullet points.');

          var res = await UI.callAI(prompt, {
            systemInstruction: (UI.lang === 'bn')
              ? 'আপনি একজন অভিজ্ঞ ক্লিনিকাল নিউট্রিশনিস্ট ও ফিটনেস ট্রেইনার। স্বাস্থ্যকর বাংলাদেশি ও আন্তর্জাতিক খাদ্যাভ্যাস অনুযায়ী প্র্যাকটিক্যাল পরামর্শ দিন।'
              : 'You are an experienced clinical nutritionist and fitness expert. Provide practical, sustainable diet and activity guidance.'
          });

          if (res && res.success && res.text) {
            return res.text;
          }

          // Offline fallback recommendation
          if (UI.lang === 'bn') {
            return '### 🥗 আপনার বিএমআই (' + bmi.toFixed(1) + ' – ' + cat + ') অনুযায়ী বিশেষজ্ঞ পরামর্শ\n\n' +
              '**১. বর্তমান মূল্যায়ন:** আপনার আদর্শ ওজন পরিসীমা ' + rng + '। সুষম খাদ্যাভ্যাস ও নিয়মিত জীবনযাত্রার মাধ্যমে কাঙ্ক্ষিত ওজনে পৌঁছানো সম্ভব।\n\n' +
              '**২. খাদ্য তালিকা সুপারিশ:**\n' +
              '- **সকাল:** লাল আটার রুটি/ওটস, সেদ্ধ ডিম, সবজি এবং পর্যাপ্ত পানি।\n' +
              '- **দুপুর:** পরিমিত লাল চালের ভাত, প্রচুর সবুজ শাকসবজি, ডাল এবং মাছ বা মুরগির মাংস।\n' +
              '- **বিকাল:** গ্রিন টি, বাদাম বা একটি তাজা মৌসুমী ফল।\n' +
              '- **রাত:** হালকা খাবার (স্যুপ, সালাদ বা ১টি রুটি), ঘুমানোর অন্তত ২ ঘণ্টা আগে সম্পন্ন করুন।\n\n' +
              '**৩. ফিটনেস ও ব্যায়াম:**\n' +
              '- প্রতিদিন অন্তত ৩০-৪৫ মিনিট দ্রুত হাঁটা বা হালকা কার্ডিও এক্সারসাইজ করুন।\n' +
              '- দিনে ২.৫ থেকে ৩ লিটার বিশুদ্ধ পানি পান করুন ও পর্যাপ্ত ঘুম (৭-৮ ঘণ্টা) নিশ্চিত করুন।\n\n' +
              '> 💡 *টিপস:* আপনার Google Gemini বা OpenAI API Key কানেক্ট করলে আরও সুনির্দিষ্ট ক্যালোরি ট্র্যাকিং ও পারসোনালাইজড লাইভ AI পরামর্শ পাবেন।';
          } else {
            return '### 🥗 Nutrition & Fitness Guidance for BMI ' + bmi.toFixed(1) + ' (' + cat + ')\n\n' +
              '**1. Assessment:** Your healthy target weight range is ' + rng + '. Achieving this involves steady nutritional adjustments and active movement.\n\n' +
              '**2. Recommended Meal Plan:**\n' +
              '- **Breakfast:** Whole grain oats/toast, boiled eggs, fruit, and plenty of water.\n' +
              '- **Lunch:** Lean protein (fish/chicken/tofu), a large portion of leafy greens, lentils, and moderate complex carbs.\n' +
              '- **Snack:** Handful of almonds or walnuts, green tea, or an apple.\n' +
              '- **Dinner:** Light dinner (soup, steamed vegetables or salad) 2 hours before bed.\n\n' +
              '**3. Physical Activity Routine:**\n' +
              '- 30–45 minutes of brisk walking, cycling, or resistance training at least 5 days a week.\n' +
              '- Drink 2.5–3 liters of water daily and aim for 7–8 hours of consistent sleep.\n\n' +
              '> 💡 *Note:* Connect your Google Gemini or OpenAI API Key to receive personalized daily calorie breakdowns and custom AI meal plans.';
          }
        }
      });
      res.appendChild(aiBox.el);
    }
    root.appendChild(UI.el('div', { class: 'stack' },
      UI.el('div', { class: 'two' },
        UI.el('div', { class: 'stack' }, UI.el('span', { class: 'lbl' }, tr('ওজন', "Weight")), wSeg, UI.field(tr('ওজন', "Weight"), w)),
        UI.el('div', { class: 'stack' }, UI.el('span', { class: 'lbl' }, tr('উচ্চতা', "Height")), hSeg, cmF, ftRow)),
      res));
    calc();
  };

  /* ================= ইউনিট কনভার্টার ================= */
  var SQFT = 0.09290304;
  var CATS = [
    { id: 'area', label: tr('জমি / ক্ষেত্রফল', "Land / area"), from: 'katha', to: 'sqft', note: tr('কাঠা ও বিঘার মাপ এলাকাভেদে আলাদা হতে পারে। এখানে ঢাকা অঞ্চলে প্রচলিত মান (১ কাঠা = ৭২০ বর্গফুট, ১ বিঘা = ২০ কাঠা) ধরা হয়েছে। রেজিস্ট্রি বা দলিলের জন্য স্থানীয় মাপ মিলিয়ে নিন।', "Katha and bigha sizes vary by region. This uses the values common in the Dhaka area (1 katha = 720 sq ft, 1 bigha = 20 katha). For registration or deeds, check the local measure."), units: [
      ['katha', tr('কাঠা', "Katha"), 720 * SQFT], ['bigha', tr('বিঘা', "Bigha"), 14400 * SQFT], ['decimal', tr('শতাংশ', "Decimal (shatangsho)"), 435.6 * SQFT], ['acre', tr('একর', "Acre"), 43560 * SQFT],
      ['sqft', tr('বর্গফুট', "Square feet"), SQFT], ['sqyd', tr('বর্গগজ', "Square yards"), 9 * SQFT], ['sqm', tr('বর্গমিটার', "Square metres"), 1], ['sqin', tr('বর্গ ইঞ্চি', "Square inches"), SQFT / 144], ['hectare', tr('হেক্টর', "Hectare"), 10000], ['sqkm', tr('বর্গ কিলোমিটার', "Square kilometres"), 1e6], ['sqmile', tr('বর্গ মাইল', "Square miles"), 2589988.110336]] },
    { id: 'weight', label: tr('ওজন', "Weight"), from: 'bhori', to: 'g', units: [
      ['bhori', tr('ভরি', "Bhori"), 11.664], ['ana', tr('আনা', "Ana"), 11.664 / 16], ['ratti', tr('রতি', "Ratti"), 11.664 / 96], ['seer', tr('সের', "Seer"), 933.1], ['maund', tr('মণ', "Maund"), 37324.2], ['kg', tr('কিলোগ্রাম', "Kilograms"), 1000], ['g', tr('গ্রাম', "Grams"), 1], ['mg', tr('মিলিগ্রাম', "Milligrams"), 0.001], ['ton', tr('মেট্রিক টন', "Metric tonnes"), 1e6], ['lb', tr('পাউন্ড', "Pounds"), 453.59237], ['oz', tr('আউন্স', "Ounces"), 28.349523125]] },
    { id: 'length', label: tr('দৈর্ঘ্য', "Length"), from: 'm', to: 'ft', units: [
      ['km', tr('কিলোমিটার', "Kilometres"), 1000], ['m', tr('মিটার', "Metres"), 1], ['cm', tr('সেন্টিমিটার', "Centimetres"), 0.01], ['mm', tr('মিলিমিটার', "Millimetres"), 0.001], ['mile', tr('মাইল', "Miles"), 1609.344], ['yard', tr('গজ (yard)', "Yard"), 0.9144], ['hat', tr('হাত', "Hat (cubit)"), 0.4572], ['ft', tr('ফুট', "Feet"), 0.3048], ['inch', tr('ইঞ্চি', "Inches"), 0.0254]] },
    { id: 'volume', label: tr('আয়তন', "Volume"), from: 'l', to: 'ml', units: [
      ['l', tr('লিটার', "Litres"), 1], ['ml', tr('মিলিলিটার', "Millilitres"), 0.001], ['m3', tr('ঘনমিটার', "Cubic metres"), 1000], ['galus', tr('গ্যালন (US)', "Gallon (US)"), 3.785411784], ['galuk', tr('গ্যালন (UK)', "Gallon (UK)"), 4.54609], ['pint', tr('পাইন্ট (US)', "Pint (US)"), 0.473176473], ['cup', tr('কাপ (US)', "Cup (US)"), 0.2365882365], ['floz', tr('ফ্লুইড আউন্স', "Fluid ounces"), 0.0295735295625], ['tbsp', tr('টেবিল চামচ', "Tablespoon"), 0.01478676478125], ['tsp', tr('চা চামচ', "Teaspoon"), 0.00492892159375]] },
    { id: 'temp', label: tr('তাপমাত্রা', "Temperature"), from: 'c', to: 'f', temp: true, units: [['c', tr('সেলসিয়াস (°C)', "Celsius (°C)")], ['f', tr('ফারেনহাইট (°F)', "Fahrenheit (°F)")], ['k', tr('কেলভিন (K)', "Kelvin (K)")]] },
    { id: 'speed', label: tr('গতি', "Speed"), from: 'kmh', to: 'ms', units: [['ms', tr('মিটার/সেকেন্ড', "Metres/second"), 1], ['kmh', tr('কিমি/ঘণ্টা', "km/hour"), 1000 / 3600], ['mph', tr('মাইল/ঘণ্টা', "Miles/hour"), 0.44704], ['knot', tr('নট', "Knots"), 1852 / 3600]] },
    { id: 'data', label: tr('ডেটা', "Data"), from: 'mb', to: 'kb', units: [['b', tr('বাইট (B)', "Byte (B)"), 1], ['kb', tr('কিলোবাইট (KB = 1024 B)', "Kilobyte (KB = 1024 B)"), 1024], ['mb', tr('মেগাবাইট (MB)', "Megabyte (MB)"), 1048576], ['gb', tr('গিগাবাইট (GB)', "Gigabyte (GB)"), 1073741824], ['tb', tr('টেরাবাইট (TB)', "Terabyte (TB)"), 1099511627776]] }
  ];
  function convert(cat, v, from, to) {
    if (cat.temp) {
      var c = from === 'c' ? v : from === 'f' ? (v - 32) * 5 / 9 : v - 273.15;
      return to === 'c' ? c : to === 'f' ? c * 9 / 5 + 32 : c + 273.15;
    }
    var f = cat.units.filter(function (u) { return u[0] === from; })[0][2], t = cat.units.filter(function (u) { return u[0] === to; })[0][2];
    return v * f / t;
  }
  T['unit-converter'] = function (root) {
    var cat = CATS[0], val = numIn(tr('সংখ্যা লিখুন', "Enter a number"), '1');
    var fromS, toS, fromF = UI.el('div'), toF = UI.el('div'), res = UI.el('div', { 'aria-live': 'polite' }), tbl = UI.el('div'), note = UI.el('div');
    var catSeg = UI.seg(CATS.map(function (c) { return { value: c.id, label: c.label }; }), cat.id, function (id) {
      cat = CATS.filter(function (c) { return c.id === id; })[0]; build(); calc();
    });
    function opts() { return cat.units.map(function (u) { return { value: u[0], label: u[1] }; }); }
    function build() {
      fromS = UI.select(opts(), cat.from, calc); toS = UI.select(opts(), cat.to, calc);
      UI.clear(fromF); UI.clear(toF);
      fromF.appendChild(UI.field(tr('যে ইউনিট থেকে', "Convert from"), fromS)); toF.appendChild(UI.field(tr('যে ইউনিটে', "Convert to"), toS));
      UI.clear(note); if (cat.note) note.appendChild(UI.notice('info', cat.note));
    }
    function label(id) { return cat.units.filter(function (u) { return u[0] === id; })[0][1]; }
    function calc() {
      UI.clear(res); UI.clear(tbl);
      var v = UI.parseNum(val.value);
      if (isNaN(v)) { res.appendChild(UI.notice('info', tr('একটি সংখ্যা লিখুন।', "Enter a number."))); return; }
      var r = convert(cat, v, fromS.value, toS.value);
      res.appendChild(UI.el('div', { class: 'result' }, UI.el('div', { class: 'lbl' }, fmtBig(v) + ' ' + label(fromS.value) + ' ='), UI.el('div', { class: 'big-num' }, fmtBig(r) + ' ', UI.el('span', { style: { fontSize: '.5em', fontWeight: 600 } }, label(toS.value)))));
      var rows = cat.units.map(function (u) { return UI.el('tr', {}, UI.el('td', {}, u[1]), UI.el('td', {}, fmtBig(convert(cat, v, fromS.value, u[0])))); });
      tbl.appendChild(UI.el('div', { class: 'tbl-wrap' }, UI.el('table', { class: 'tbl' }, UI.el('thead', {}, UI.el('tr', {}, UI.el('th', {}, tr('ইউনিট', "Unit")), UI.el('th', {}, fmtBig(v) + ' ' + label(fromS.value) + tr(' সমান', " equals")))), UI.el('tbody', {}, rows))));
    }
    val.addEventListener('input', calc);
    var swap = UI.el('button', { type: 'button', class: 'btn alt sm', onclick: function () { var a = fromS.value; fromS.value = toS.value; toS.value = a; calc(); } }, UI.icon('repeat', 16), tr('উল্টে দিন', "Swap"));
    build();
    root.appendChild(UI.el('div', { class: 'stack' },
      UI.el('div', { class: 'stack' }, UI.el('span', { class: 'lbl' }, tr('কিসের হিসাব?', "What are you calculating?")), catSeg),
      UI.el('div', { class: 'row' }, UI.field(tr('সংখ্যা', "Number"), val), fromF, swap, toF),
      note, res, tbl));
    calc();
  };

  /* ================= শতকরা ================= */
  T['percentage-calculator'] = function (root) {
    function box(title, build, compute) {
      var ins = [], ans = UI.el('div', { class: 'ans' }, '—');
      var parts = build(function (ph, w) { var i = numIn(ph); if (w) i.style.width = w; ins.push(i); i.addEventListener('input', upd); return i; });
      function upd() {
        var vals = ins.map(function (i) { return UI.parseNum(i.value); });
        ans.textContent = vals.some(isNaN) ? '—' : compute(vals);
      }
      return UI.el('div', { class: 'mini' }, UI.el('h3', {}, title), UI.el('div', { class: 'inline-in' }, parts), ans);
    }
    var N = function (v) { return UI.num(v, 4); };
    var boxes = [
      box(tr('কোনো সংখ্যার শতকরা কত?', "Percentage of a number"), function (i) { return [i(tr('সংখ্যা', "Number"), '110px'), tr(' এর ', ", find "), i(tr('শতকরা', "Percent"), '90px'), tr(' % কত?', " % of it")]; }, function (v) { return N(v[0] * v[1] / 100); }),
      box(tr('একটি সংখ্যা অন্যটির কত শতাংশ?', "One number as a percentage of another"), function (i) { return [i(tr('সংখ্যা', "Number"), '110px'), tr(' হলো ', " is what % of "), i(tr('মোট', "Total"), '110px'), tr(' এর কত %?', "?")]; }, function (v) { return v[1] === 0 ? '—' : N(v[0] / v[1] * 100) + '%'; }),
      box(tr('বৃদ্ধি বা হ্রাসের হার', "Increase or decrease rate"), function (i) { return [tr('এখান থেকে ', "From "), i(tr('আগের', "Before"), '100px'), tr(' ওখানে ', " to "), i(tr('পরের', "After"), '100px')]; }, function (v) {
        if (v[0] === 0) return '—'; var c = (v[1] - v[0]) / Math.abs(v[0]) * 100; return (c >= 0 ? '▲ ' : '▼ ') + N(Math.abs(c)) + '% ' + (c >= 0 ? tr('বৃদ্ধি', "increase") : tr('হ্রাস', "decrease"));
      }),
      box(tr('শতকরা যোগ বা ছাড় (ডিসকাউন্ট)', "Add or subtract a percentage (discount)"), function (i) { return [i(tr('মূল দাম', "Original price"), '110px'), tr(' এর সাথে ', " ± "), i(tr('শতকরা', "Percent"), '90px'), ' %']; }, function (v) {
        return tr('যোগ করলে: ', "If added: ") + N(v[0] * (1 + v[1] / 100)) + tr(' · ছাড় দিলে: ', " · If discounted: ") + N(v[0] * (1 - v[1] / 100));
      })
    ];
    root.appendChild(UI.el('div', { class: 'cmp' }, boxes));
  };

  /* ================= বয়স ================= */
  function utcOf(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : NaN; }
  function addMonths(t, n) {
    var d = new Date(t), y = d.getUTCFullYear(), m = d.getUTCMonth() + n, day = d.getUTCDate();
    var first = new Date(Date.UTC(y, m, 1)), dim = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
    return Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), Math.min(day, dim));
  }
  function todayStr() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function fmtDate(t) { return new Date(t).toLocaleDateString(UI.locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); }
  T['age-calculator'] = function (root) {
    var dob = UI.el('input', { type: 'date', max: todayStr() }), asof = UI.el('input', { type: 'date', value: todayStr() });
    var res = UI.el('div', { 'aria-live': 'polite' });
    function calc() {
      UI.clear(res);
      var a = utcOf(dob.value), b = utcOf(asof.value);
      if (isNaN(a)) { res.appendChild(UI.notice('info', tr('জন্ম তারিখ বেছে নিন।', "Choose the date of birth."))); return; }
      if (isNaN(b)) { res.appendChild(UI.notice('info', tr('তারিখটি ঠিক নেই।', "The date is not valid."))); return; }
      if (a > b) { res.appendChild(UI.notice('err', tr('জন্ম তারিখ পরের তারিখের চেয়ে বেশি হতে পারে না।', "The date of birth cannot be after the other date."))); return; }
      var tm = (new Date(b).getUTCFullYear() - new Date(a).getUTCFullYear()) * 12 + (new Date(b).getUTCMonth() - new Date(a).getUTCMonth());
      if (addMonths(a, tm) > b) tm--;
      var days = Math.round((b - addMonths(a, tm)) / 86400000), years = Math.floor(tm / 12), months = tm % 12;
      var total = Math.round((b - a) / 86400000);
      var bd = new Date(a), nbY = new Date(b).getUTCFullYear();
      var nb = Date.UTC(nbY, bd.getUTCMonth(), Math.min(bd.getUTCDate(), new Date(Date.UTC(nbY, bd.getUTCMonth() + 1, 0)).getUTCDate()));
      if (nb < b) { nbY++; nb = Date.UTC(nbY, bd.getUTCMonth(), Math.min(bd.getUTCDate(), new Date(Date.UTC(nbY, bd.getUTCMonth() + 1, 0)).getUTCDate())); }
      var left = Math.round((nb - b) / 86400000);
      var rows = [[tr('মোট মাস', "Total months"), UI.num(tm + (days ? 0 : 0), 0) + tr(' মাস ', " months ") + UI.num(days, 0) + tr(' দিন', " days")], [tr('মোট সপ্তাহ', "Total weeks"), UI.num(Math.floor(total / 7), 0) + tr(' সপ্তাহ ', " weeks ") + UI.num(total % 7, 0) + tr(' দিন', " days")], [tr('মোট দিন', "Total days"), UI.num(total, 0) + tr(' দিন', " days")], [tr('মোট ঘণ্টা', "Total hours"), UI.num(total * 24, 0) + tr(' ঘণ্টা', " hours")], [tr('জন্মবার', "Day of birth"), new Date(a).toLocaleDateString(UI.locale, { weekday: 'long', timeZone: 'UTC' })]];
      res.appendChild(UI.el('div', { class: 'result stack' },
        UI.el('div', {}, UI.el('div', { class: 'lbl' }, tr('আপনার বয়স', "Your age")), UI.el('div', { class: 'big-num' }, UI.num(years, 0) + tr(' বছর ', " years ") + UI.num(months, 0) + tr(' মাস ', " months ") + UI.num(days, 0) + tr(' দিন', " days"))),
        UI.el('div', { class: 'tbl-wrap' }, UI.el('table', { class: 'tbl' }, UI.el('tbody', {}, rows.map(function (r) { return UI.el('tr', {}, UI.el('th', {}, r[0]), UI.el('td', {}, r[1])); })))),
        UI.notice('ok', left === 0 ? tr('🎂 আজই জন্মদিন, শুভ জন্মদিন!', "🎂 Today is your birthday, happy birthday!") : tr('পরের জন্মদিন: ', "Next birthday: ") + fmtDate(nb) + tr(' (আর ', " (") + UI.num(left, 0) + tr(' দিন বাকি)', " days to go)"))));

      // AI Life Milestones & Future Insights Card
      var ageAiBox = UI.renderAiBox({
        title: tr('এআই জীবন পরিক্রমা ও মাইলস্টোন অন্তর্দৃষ্টি', 'AI Life Milestones & Future Insights'),
        subtitle: tr('আপনার বয়স ও জন্ম তারিখের ওপর ভিত্তি করে জীবনপরিসংখ্যান, অবসর ও অনুপ্রেরণাদায়ক পর্যবেক্ষণ', 'Personalized life statistics, generation facts, and future career milestones'),
        btnText: tr('✨ এআই লাইফ অ্যানালাইসিস দেখুন', '✨ Generate AI Life Analysis'),
        onGenerate: async function () {
          var y = years, m = months, d = days;
          var gen = (new Date(a).getUTCFullYear() >= 1997 && new Date(a).getUTCFullYear() <= 2012) ? 'Gen Z'
            : (new Date(a).getUTCFullYear() >= 1981 && new Date(a).getUTCFullYear() <= 1996) ? 'Millennial (Gen Y)'
            : (new Date(a).getUTCFullYear() >= 1965 && new Date(a).getUTCFullYear() <= 1980) ? 'Gen X' : 'Baby Boomer / Generation Alpha';
          var daysToRetire = Math.max(0, (60 * 365.25) - total);

          var prompt = (UI.lang === 'bn')
            ? ('আমার জন্ম তারিখ ' + dob.value + ', বর্তমান বয়স ' + y + ' বছর ' + m + ' মাস ' + d + ' দিন (মোট ' + total + ' দিন বেঁচে আছি)। প্রজন্ম: ' + gen + '। অনুগ্রহ করে আমার জন্য:\n1. এই বয়সে আমার জীবনের অসাধারণ ৩টি পরিসংখ্যান ও তাৎপর্য\n2. ক্যারিয়ার ও ব্যক্তিগত জীবনের আগামী মাইলস্টোন নিয়ে অনুপ্রেরণামূলক পর্যবেক্ষণ\n3. অবসর ও দীর্ঘমেয়াদী জীবনের জন্য একটি মূল্যবান উপদেশ\nসুন্দর ও তথ্যবহুল বুলেট পয়েন্টে বাংলায় উপস্থাপন করুন।')
            : ('My date of birth is ' + dob.value + ', current age is ' + y + ' years, ' + m + ' months, ' + d + ' days (' + total + ' total days lived). Generation: ' + gen + '. Please provide:\n1. Top 3 fascinating life metrics and facts\n2. Inspiring insights on career and personal milestones\n3. A meaningful perspective on long-term goals and retirement planning.\nFormat clearly in bullet points.');

          var res = await UI.callAI(prompt, {
            systemInstruction: (UI.lang === 'bn')
              ? 'আপনি একজন দূরদর্শী জীবন পরামর্শক ও অনুপ্রেরণাদায়ী লেখক। জীবনপরিসংখ্যানের সাথে ইতিবাচক দৃষ্টিভঙ্গি তুলে ধরুন।'
              : 'You are an inspiring life coach and statistician. Offer thoughtful, positive, and motivating life reflections.'
          });

          if (res && res.success && res.text) {
            return res.text;
          }

          // Offline fallback
          var approxBreaths = Math.round(total * 24 * 60 * 16);
          var approxHeartbeats = Math.round(total * 24 * 60 * 75);
          if (UI.lang === 'bn') {
            return '### 🌟 আপনার জীবনপরিসংখ্যান ও মাইলস্টোন (' + gen + ')\n\n' +
              '**১. জীবন পরিক্রমার বিস্ময়কর তথ্য:**\n' +
              '- **অতিক্রান্ত দিন:** আপনি পৃথিবীতে ইতোমধ্যে প্রায় **' + UI.num(total, 0) + '** দিন পার করেছেন!\n' +
              '- **আনুমানিক হৃদস্পন্দন:** আপনার হৃদয় প্রায় **' + UI.num(Math.round(approxHeartbeats / 1e6), 1) + ' মিলিয়ন** বার স্পন্দিত হয়েছে।\n' +
              '- **প্রজন্মীয় বৈশিষ্ট্য:** আপনি **' + gen + '** প্রজন্মের প্রতিনিধি, যাদের মধ্যে রয়েছে প্রযুক্তি অভিযোজন ও পরিবর্তনের অপার সম্ভাবনা।\n\n' +
              '**২. ভবিষ্যৎ মাইলস্টোন ও অবসর:**\n' +
              '- ৬০ বছর বয়সের স্বাভাবিক অবসর সময় পর্যন্ত প্রায় **' + UI.num(Math.round(daysToRetire), 0) + '** দিন বা ' + UI.num(Math.round(daysToRetire / 365.25), 0) + ' বছর বাকি রয়েছে।\n' +
              '- পরবর্তী বড় মাইলস্টোন: আপনার বয়স ' + UI.num(years + 1, 0) + ' বছরে পা রাখবে আগামী ' + UI.num(left, 0) + ' দিন পর।\n\n' +
              '> 💡 *পরামর্শ:* প্রতিটি দিনই নতুন কিছু অর্জনের সুযোগ। আপনার Google Gemini বা OpenAI API Key কানেক্ট করলে আরও কাস্টমাইজড লাইফ রোডম্যাপ ও অনুপ্রেরণাদায়ী AI রেজাল্ট পাবেন।';
          } else {
            return '### 🌟 Life Metrics & Milestones (' + gen + ')\n\n' +
              '**1. Fascinating Life Statistics:**\n' +
              '- **Days on Earth:** You have journeyed through **' + UI.num(total, 0) + '** days on this planet!\n' +
              '- **Approximate Heartbeats:** Your heart has beaten approximately **' + UI.num(Math.round(approxHeartbeats / 1e6), 1) + ' million** times.\n' +
              '- **Generation:** You are part of **' + gen + '**, characterized by adaptability and unique historical perspective.\n\n' +
              '**2. Future Horizons & Milestones:**\n' +
              '- Approximately **' + UI.num(Math.round(daysToRetire), 0) + '** days (' + UI.num(Math.round(daysToRetire / 365.25), 0) + ' years) remain toward a standard retirement milestone at age 60.\n' +
              '- Your next milestone birthday arrives in **' + UI.num(left, 0) + '** days.\n\n' +
              '> 💡 *Tip:* Connect your Google Gemini or OpenAI API Key for tailored career roadmaps and customized AI reflections.';
          }
        }
      });
      res.appendChild(ageAiBox.el);
    }
    dob.addEventListener('input', calc); asof.addEventListener('input', calc);
    root.appendChild(UI.el('div', { class: 'stack' }, UI.el('div', { class: 'row' }, UI.field(tr('জন্ম তারিখ', "Date of birth"), dob), UI.field(tr('যে তারিখ পর্যন্ত (ডিফল্ট আজ)', "As of this date (default today)"), asof)), res));
    calc();
  };

  /* ================= টাইম জোন ================= */
  var ZONES = [
    ['Asia/Dhaka', tr('ঢাকা (বাংলাদেশ)', "Dhaka (Bangladesh)")], ['Asia/Riyadh', tr('রিয়াদ (সৌদি আরব)', "Riyadh (Saudi Arabia)")], ['Asia/Dubai', tr('দুবাই (UAE)', "Dubai (UAE)")], ['Asia/Qatar', tr('দোহা (কাতার)', "Doha (Qatar)")], ['Asia/Kuwait', tr('কুয়েত', "Kuwait")], ['Asia/Muscat', tr('মাস্কাট (ওমান)', "Muscat (Oman)")], ['Asia/Bahrain', tr('বাহরাইন', "Bahrain")],
    ['Asia/Kuala_Lumpur', tr('কুয়ালালামপুর (মালয়েশিয়া)', "Kuala Lumpur (Malaysia)")], ['Asia/Singapore', tr('সিঙ্গাপুর', "Singapore")], ['Asia/Kolkata', tr('কলকাতা/দিল্লি (ভারত)', "Kolkata/Delhi (India)")], ['Asia/Karachi', tr('করাচি (পাকিস্তান)', "Karachi (Pakistan)")], ['Asia/Colombo', tr('কলম্বো (শ্রীলঙ্কা)', "Colombo (Sri Lanka)")], ['Asia/Kathmandu', tr('কাঠমান্ডু (নেপাল)', "Kathmandu (Nepal)")],
    ['Asia/Tokyo', tr('টোকিও (জাপান)', "Tokyo (Japan)")], ['Asia/Seoul', tr('সিউল (দক্ষিণ কোরিয়া)', "Seoul (South Korea)")], ['Asia/Shanghai', tr('বেইজিং (চীন)', "Beijing (China)")], ['Asia/Hong_Kong', tr('হংকং', "Hong Kong")],
    ['Europe/London', tr('লন্ডন (যুক্তরাজ্য)', "London (UK)")], ['Europe/Paris', tr('প্যারিস (ফ্রান্স)', "Paris (France)")], ['Europe/Berlin', tr('বার্লিন (জার্মানি)', "Berlin (Germany)")], ['Europe/Rome', tr('রোম (ইতালি)', "Rome (Italy)")], ['Europe/Istanbul', tr('ইস্তানবুল (তুরস্ক)', "Istanbul (Turkey)")], ['Africa/Cairo', tr('কায়রো (মিশর)', "Cairo (Egypt)")],
    ['America/New_York', tr('নিউইয়র্ক (ইস্টার্ন)', "New York (Eastern)")], ['America/Chicago', tr('শিকাগো (সেন্ট্রাল)', "Chicago (Central)")], ['America/Los_Angeles', tr('লস অ্যাঞ্জেলেস (প্যাসিফিক)', "Los Angeles (Pacific)")], ['America/Toronto', tr('টরন্টো (কানাডা)', "Toronto (Canada)")],
    ['Australia/Sydney', tr('সিডনি (অস্ট্রেলিয়া)', "Sydney (Australia)")], ['Pacific/Auckland', tr('অকল্যান্ড (নিউজিল্যান্ড)', "Auckland (New Zealand)")], ['UTC', 'UTC']
  ];
  function zlabel(id) { var z = ZONES.filter(function (x) { return x[0] === id; })[0]; return z ? z[1] : id; }
  function parts(ts, zone) {
    var f = new Intl.DateTimeFormat('en-US', { timeZone: zone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    var o = {}; f.formatToParts(new Date(ts)).forEach(function (p) { o[p.type] = p.value; });
    return { y: +o.year, mo: +o.month, d: +o.day, h: (+o.hour) % 24, mi: +o.minute, s: +o.second };
  }
  function offMin(ts, zone) { var p = parts(ts, zone); return Math.round((Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi, p.s) - Math.floor(ts / 1000) * 1000) / 60000); }
  function zonedToUtc(y, mo, d, h, mi, zone) {
    var guess = Date.UTC(y, mo - 1, d, h, mi), o1 = offMin(guess, zone), t = guess - o1 * 60000, o2 = offMin(t, zone);
    if (o2 !== o1) t = guess - o2 * 60000; return t;
  }
  function nowLocalStr(zone) { var p = parts(Date.now(), zone); function z(n) { return ('0' + n).slice(-2); } return p.y + '-' + z(p.mo) + '-' + z(p.d) + 'T' + z(p.h) + ':' + z(p.mi); }
  function offLabel(m) { var s = m < 0 ? '−' : '+', a = Math.abs(m); return 'UTC' + s + UI.n(Math.floor(a / 60)) + (a % 60 ? ':' + UI.n(('0' + (a % 60)).slice(-2)) : ''); }

  T['time-zone-converter'] = function (root) {
    var src = 'Asia/Dhaka', targets;
    try { targets = JSON.parse(localStorage.getItem('tz-targets') || 'null'); } catch (e) { targets = null; }
    if (!Array.isArray(targets) || !targets.length) targets = ['Asia/Riyadh', 'Asia/Dubai', 'Europe/London', 'America/New_York', 'Asia/Kuala_Lumpur'];
    var dt = UI.el('input', { type: 'datetime-local', value: nowLocalStr(src) });
    var srcSel = UI.select(ZONES.map(function (z) { return { value: z[0], label: z[1] }; }), src, function () { src = srcSel.value; render(); });
    var grid = UI.el('div', { class: 'zone-grid' }), addBox = UI.el('div');
    function save() { try { localStorage.setItem('tz-targets', JSON.stringify(targets)); } catch (e) { } }
    function drawAdd() {
      UI.clear(addBox);
      var rest = ZONES.filter(function (z) { return targets.indexOf(z[0]) < 0; });
      if (!rest.length) return;
      var s = UI.select([{ value: '', label: tr('+ আরেকটি শহর যোগ করুন…', "+ Add another city…") }].concat(rest.map(function (z) { return { value: z[0], label: z[1] }; })), '', function () { if (s.value) { targets.push(s.value); save(); render(); } });
      addBox.appendChild(s);
    }
    function render() {
      UI.clear(grid);
      var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(dt.value);
      if (!m) { grid.appendChild(UI.notice('info', tr('তারিখ ও সময় দিন।', "Enter a date and time."))); drawAdd(); return; }
      var ts = zonedToUtc(+m[1], +m[2], +m[3], +m[4], +m[5], src), sp = parts(ts, src);
      targets.forEach(function (z) {
        var p = parts(ts, z), diff = Math.round((Date.UTC(p.y, p.mo - 1, p.d) - Date.UTC(sp.y, sp.mo - 1, sp.d)) / 86400000);
        var time = new Intl.DateTimeFormat(UI.locale, { timeZone: z, hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(ts));
        var date = new Intl.DateTimeFormat(UI.locale, { timeZone: z, weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(ts));
        grid.appendChild(UI.el('div', { class: 'zone-card' },
          UI.el('div', { class: 'z' }, zlabel(z)), UI.el('div', { class: 't' }, time), UI.el('small', {}, date + (diff === 0 ? '' : diff > 0 ? tr(' · পরের দিন', " · next day") : tr(' · আগের দিন', " · previous day"))),
          UI.el('small', {}, offLabel(offMin(ts, z))),
          UI.el('button', { type: 'button', class: 'ib del', 'aria-label': tr('বাদ দিন', "Remove"), onclick: function () { targets = targets.filter(function (x) { return x !== z; }); save(); render(); } }, UI.icon('x', 16))));
      });
      drawAdd();
    }
    dt.addEventListener('input', render);
    var nowBtn = UI.btn(tr('এখনকার সময়', "Current time"), function () { dt.value = nowLocalStr(src); render(); }, { cls: 'sm alt', icon: 'refresh-cw', iconSize: 16 });
    root.appendChild(UI.el('div', { class: 'stack' },
      UI.el('div', { class: 'row' }, UI.field(tr('কোন শহরের সময় দিচ্ছেন?', "Which city's time are you entering?"), srcSel), UI.field(tr('তারিখ ও সময়', "Date and time"), dt), nowBtn),
      grid, addBox));
    // AI Global Meeting & Call Planner Card
    var tzAiBox = UI.renderAiBox({
      title: tr('এআই গ্লোবাল কলিং ও মিটিং শিডিউলার', 'AI Meeting & Call Window Optimizer'),
      subtitle: tr('নির্বাচিত শহরগুলোর সাথে সেরা কমন মিটিং বা কথা বলার সময় স্বয়ংক্রিয়ভাবে বের করুন', 'Automatically find ideal overlapping awake and business hours across selected cities'),
      btnText: tr('✨ এআই শিডিউল ও কলিং টাইম বের করুন', '✨ Find Best Calling & Meeting Hours'),
      onGenerate: async function () {
        var baseCity = zlabel(src);
        var otherCities = targets.map(function (z) { return zlabel(z); }).join(', ');
        var prompt = (UI.lang === 'bn')
          ? ('বেস শহর: ' + baseCity + '। অন্য শহরগুলো: ' + otherCities + '।\nঅনুগ্রহ করে:\n1. উভয় পক্ষের অফিসিয়াল মিটিংয়ের জন্য সবচেয়ে সুবিধাজনক সময় (গোল্ডেন আওয়ার) বের করুন\n2. প্রবাসী স্বজনদের সাথে কথা বলার জন্য সেরা পারিবারিক কলিং সময় উল্লেখ করুন\n3. সময় সমন্বয়ের একটি পেশাদার সংক্ষিপ্ত মেসেজ টেমপ্লেট দিন।\nপয়েন্ট আকারে বাংলায় লিখুন।')
          : ('Base City: ' + baseCity + '. Target Cities: ' + otherCities + '.\nPlease identify:\n1. Optimal overlapping business meeting windows (Golden overlap hours)\n2. Best casual/family calling hours taking sleep cycles into account\n3. A polite email/WhatsApp invite snippet specifying the times.\nFormat with clean bullet points.');

        var res = await UI.callAI(prompt, {
          systemInstruction: (UI.lang === 'bn')
            ? 'আপনি একজন আন্তর্জাতিক ব্যবসায়িক সমন্বয়কারী ও গ্লোবাল শিডিউলিং এক্সপার্ট।'
            : 'You are an international scheduling expert and cross-timezone coordinator.'
        });

        if (res && res.success && res.text) {
          return res.text;
        }

        // Offline fallback
        if (UI.lang === 'bn') {
          return '### 🌐 ' + baseCity + ' ও অন্যান্য শহরের জন্য সেরা যোগাযোগ সময়\n\n' +
            '**১. ব্যবসায়িক ও অফিস মিটিংয়ের সেরা সময়:**\n' +
            '- বাংলাদেশ ও মধ্যপ্রাচ্য (সৌদি/দুবাই/কাতার): **দুপুর ২:০০ – সন্ধ্যা ৬:০০ (বাংলাদেশ সময়)**। এ সময় উভয় দেশে নিয়মিত অফিস আওয়ার চলমান থাকে।\n' +
            '- বাংলাদেশ ও যুক্তরাজ্য/ইউরোপ (লন্ডন/বার্লিন): **বিকাল ৩:০০ – রাত ৭:০০ (বাংলাদেশ সময়)**।\n' +
            '- বাংলাদেশ ও উত্তর আমেরিকা (নিউইয়র্ক/টরন্টো): **সন্ধ্যা ৭:০০ – রাত ৯:০০ (বাংলাদেশ সময়)** / সকাল ৯:০০ – বেলা ১১:০০ (নিউইয়র্ক)।\n\n' +
            '**২. প্রবাসী স্বজনদের সাথে কথা বলার সেরা সময়:**\n' +
            '- কাজের শেষে ও আরামদায়ক সময়: **বাংলাদেশ সময় রাত ৮:৩০ – ১০:৩০** (মধ্যপ্রাচ্যে বিকাল ৫:৩০ – ৭:৩০)।\n\n' +
            '> 💡 *টিপস:* আপনার Google Gemini বা OpenAI API Key কানেক্ট করলে নির্দিষ্ট এজেন্ডা অনুযায়ী রেডিমেড ক্যালেন্ডার ইনভাইটেশন তৈরি করা যাবে।';
        } else {
          return '### 🌐 Optimal Cross-Timezone Windows (' + baseCity + ' & Targets)\n\n' +
            '**1. Golden Business Overlap Hours:**\n' +
            '- Middle East (Riyadh/Dubai): **2:00 PM – 6:00 PM (Dhaka time)** (11:00 AM – 3:00 PM Gulf time).\n' +
            '- UK & Europe (London/Berlin): **3:30 PM – 7:30 PM (Dhaka time)** (9:30 AM – 1:30 PM UK time).\n' +
            '- North America (Eastern Time): **7:00 PM – 9:30 PM (Dhaka time)** (9:00 AM – 11:30 AM EST).\n\n' +
            '**2. Best Personal / Family Call Windows:**\n' +
            '- Evenings between **8:30 PM – 10:30 PM local time** ensure both sides are relaxed after work.\n\n' +
            '> 💡 *Tip:* Connect your Google Gemini or OpenAI API Key to automatically generate ready-to-send meeting invitation drafts.';
        }
      }
    });
    root.appendChild(tzAiBox.el);
    render();
  };

  /* ================= লাইভ কারেন্সি কনভার্টার ================= */
  T['currency-converter'] = function (root) {
    var CURRENCIES = [
      { code: 'BDT', flag: '🇧🇩', sym: '৳', bn: 'বাংলাদেশী টাকা', en: 'Bangladeshi Taka' },
      { code: 'USD', flag: '🇺🇸', sym: '$', bn: 'মার্কিন ডলার', en: 'US Dollar' },
      { code: 'SAR', flag: '🇸🇦', sym: '﷼', bn: 'সৌদি রিয়াল', en: 'Saudi Riyal' },
      { code: 'AED', flag: '🇦🇪', sym: 'د.إ', bn: 'ইউএই দিরহাম', en: 'UAE Dirham' },
      { code: 'EUR', flag: '🇪🇺', sym: '€', bn: 'ইউরো', en: 'Euro' },
      { code: 'GBP', flag: '🇬🇧', sym: '£', bn: 'ব্রিটিশ পাউন্ড', en: 'British Pound' },
      { code: 'KWD', flag: '🇰🇼', sym: 'د.ك', bn: 'কুয়েতি দিনার', en: 'Kuwaiti Dinar' },
      { code: 'QAR', flag: '🇶🇦', sym: '﷼', bn: 'কাতারি রিয়াল', en: 'Qatari Riyal' },
      { code: 'MYR', flag: '🇲🇾', sym: 'RM', bn: 'মালয়েশিয়ান রিঙ্গিত', en: 'Malaysian Ringgit' },
      { code: 'SGD', flag: '🇸🇬', sym: 'S$', bn: 'সিঙ্গাপুর ডলার', en: 'Singapore Dollar' },
      { code: 'INR', flag: '🇮🇳', sym: '₹', bn: 'ভারতীয় রুপি', en: 'Indian Rupee' },
      { code: 'OMR', flag: '🇴🇲', sym: '﷼', bn: 'ওমানি রিয়াল', en: 'Omani Rial' },
      { code: 'CAD', flag: '🇨🇦', sym: 'CA$', bn: 'কানাডিয়ান ডলার', en: 'Canadian Dollar' },
      { code: 'AUD', flag: '🇦🇺', sym: 'AU$', bn: 'অস্ট্রেলিয়ান ডলার', en: 'Australian Dollar' },
      { code: 'JPY', flag: '🇯🇵', sym: '¥', bn: 'জাপানি ইয়েন', en: 'Japanese Yen' },
      { code: 'CNY', flag: '🇨🇳', sym: '¥', bn: 'চাইনিজ ইউয়ান', en: 'Chinese Yuan' },
      { code: 'KRW', flag: '🇰🇷', sym: '₩', bn: 'দক্ষিণ কোরিয়ান ওন', en: 'South Korean Won' },
      { code: 'BHD', flag: '🇧🇭', sym: '.দ.ব', bn: 'বাহরাইনি দিনার', en: 'Bahraini Dinar' },
      { code: 'THB', flag: '🇹🇭', sym: '฿', bn: 'থাই বাথ', en: 'Thai Baht' },
      { code: 'TRY', flag: '🇹🇷', sym: '₺', bn: 'তুর্কি লিরা', en: 'Turkish Lira' },
      { code: 'CHF', flag: '🇨🇭', sym: 'CHF', bn: 'সুইস ফ্রাঙ্ক', en: 'Swiss Franc' },
      { code: 'PKR', flag: '🇵🇰', sym: '₨', bn: 'পাকিস্তানি রুপি', en: 'Pakistani Rupee' }
    ];

    var SEED_RATES = {
      USD: 1,
      BDT: 122.99,
      SAR: 3.75,
      AED: 3.6725,
      EUR: 0.8873,
      GBP: 0.7571,
      KWD: 0.3086,
      QAR: 3.64,
      MYR: 4.085,
      SGD: 1.28,
      INR: 88.25,
      OMR: 0.385,
      CAD: 1.385,
      AUD: 1.482,
      JPY: 147.5,
      CNY: 7.05,
      KRW: 1380,
      BHD: 0.376,
      THB: 33.5,
      TRY: 34.2,
      CHF: 0.85,
      PKR: 280.5
    };

    var CACHE_KEY = 'th_live_currency_rates';
    var rates = Object.assign({}, SEED_RATES);
    var lastUpdateText = tr('আজকের লাইভ রেট', "Today's Live Rates");
    var isLiveApi = false;

    // Load initial cached rates if available
    try {
      var cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        var parsed = JSON.parse(cached);
        if (parsed && parsed.rates) {
          Object.assign(rates, parsed.rates);
          if (parsed.dateText) lastUpdateText = parsed.dateText;
          isLiveApi = true;
        }
      }
    } catch (e) {}

    // Currency helper
    function getCurr(code) {
      for (var i = 0; i < CURRENCIES.length; i++) {
        if (CURRENCIES[i].code === code) return CURRENCIES[i];
      }
      return { code: code, flag: '🌐', sym: code, bn: code, en: code };
    }

    function currName(c) {
      return (UI.lang === 'bn') ? (c.bn + ' (' + c.code + ')') : (c.en + ' (' + c.code + ')');
    }

    // Controls
    var amtInput = UI.el('input', {
      type: 'text',
      inputmode: 'decimal',
      value: '100',
      class: 'currency-amt-input',
      autocomplete: 'off',
      'aria-label': tr('টাকার পরিমাণ', 'Amount')
    });

    var fromSel = UI.el('select', { class: 'currency-select', 'aria-label': tr('যে মুদ্রা থেকে', 'From Currency') });
    var toSel = UI.el('select', { class: 'currency-select', 'aria-label': tr('যে মুদ্রায়', 'To Currency') });

    CURRENCIES.forEach(function (c) {
      fromSel.appendChild(UI.el('option', { value: c.code }, c.flag + ' ' + currName(c)));
      toSel.appendChild(UI.el('option', { value: c.code }, c.flag + ' ' + currName(c)));
    });

    fromSel.value = 'USD';
    toSel.value = 'BDT';

    // Swap button
    var swapBtn = UI.el('button', {
      type: 'button',
      class: 'currency-swap-btn',
      title: tr('মুদ্রা অদল-বদল করুন', 'Swap currencies'),
      'aria-label': tr('মুদ্রা অদল-বদল করুন', 'Swap currencies')
    }, UI.icon('refresh-cw'));

    // Status / Refresh bar
    var liveBadge = UI.el('span', { class: 'currency-live-badge' });
    var updateTimeSpan = UI.el('span', { class: 'currency-update-time' });
    var refreshBtn = UI.el('button', {
      type: 'button',
      class: 'btn sub mini currency-refresh-btn'
    }, UI.icon('refresh-cw'), ' ' + tr('রেট রিফ্রেশ', 'Refresh Rates'));

    var topStatusBar = UI.el('div', { class: 'currency-status-bar' },
      UI.el('div', { class: 'currency-status-left' }, liveBadge, updateTimeSpan),
      refreshBtn
    );

    // Quick Amount Pills
    var quickAmounts = [1, 10, 50, 100, 500, 1000, 5000];
    var pillsContainer = UI.el('div', { class: 'currency-pills-row' });
    quickAmounts.forEach(function (val) {
      var pill = UI.el('button', {
        type: 'button',
        class: 'currency-pill-btn'
      }, UI.n(String(val)));
      pill.addEventListener('click', function () {
        amtInput.value = String(val);
        calc();
      });
      pillsContainer.appendChild(pill);
    });

    // Result container
    var resultCard = UI.el('div', { class: 'currency-result-card' });

    // Popular Rates Grid
    var popularGrid = UI.el('div', { class: 'currency-popular-grid' });

    // Official Incentive Notice
    var incentiveNotice = UI.el('div', { class: 'currency-notice-card' },
      UI.el('div', { class: 'currency-notice-icon' }, '🇧🇩'),
      UI.el('div', { class: 'currency-notice-text' },
        UI.el('b', {}, tr('বৈধ চ্যানেলে রেমিট্যান্স প্রেরণে সরকারি ২.৫% নগদ প্রণোদনা:', 'Government 2.5% Cash Incentive for Remittance:')),
        UI.el('p', {}, tr('ব্যাংক বা অনুমোদিত মানি এক্সচেঞ্জের মাধ্যমে বাংলাদেশে রেমিট্যান্স পাঠালে সরকার থেকে অতিরিক্ত ২.৫% ক্যাশ ইনসেন্টিভ সরাসরি পাওয়া যায়। সবসময় বৈধ ব্যাংকিং পথে টাকা পাঠান, হুন্ডি পরিহার করুন।', 'Sending remittances to Bangladesh through legitimate banks or authorized exchange channels qualifies for an additional 2.5% government cash incentive credited directly. Always use official banking channels.'))
      )
    );

    // AI Consultant Box
    var aiBox = UI.renderAiBox({
      title: tr('এআই মুদ্রা ও রেমিট্যান্স এক্সপার্ট', 'AI Currency & Remittance Advisor'),
      subtitle: tr('এক্সচেঞ্জ রেটের বর্তমান গতিবিধি, রেমিট্যান্স পাঠানোর সঠিক সময় ও ব্যাংকিং পরামর্শ', 'Live currency trend analysis, optimal remittance timing & banking channel advice'),
      btnText: tr('✨ এআই রেমিট্যান্স পরামর্শ পান', '✨ Get AI Remittance Advice'),
      onGenerate: async function () {
        var fromCode = fromSel.value;
        var toCode = toSel.value;
        var fromObj = getCurr(fromCode);
        var toObj = getCurr(toCode);
        var val = UI.parseNum(amtInput.value) || 1;
        var rFrom = rates[fromCode] || 1;
        var rTo = rates[toCode] || 1;
        var unitRate = rTo / rFrom;
        var converted = val * unitRate;

        var prompt = (UI.lang === 'bn')
          ? ('আমি ' + val + ' ' + fromCode + ' (' + fromObj.bn + ') কে ' + toCode + ' (' + toObj.bn + ')-এ রূপান্তর করছি। বর্তমান লাইভ রেট: ১ ' + fromCode + ' = ' + unitRate.toFixed(4) + ' ' + toCode + '। মোট ফলাফল: ' + converted.toFixed(2) + ' ' + toCode + '।\n' +
             'অনুগ্রহ করে একজন আন্তর্জাতিক বৈদেশিক মুদ্রা ও রেমিট্যান্স বিশেষজ্ঞ হিসেবে:\n' +
             '1. বর্তমান বৈশ্বিক অর্থনৈতিক প্রেক্ষাপটে এই মুদ্রার হারের সংক্ষিপ্ত বিশ্লেষণ\n' +
             '2. প্রবাসীদের জন্য রেমিট্যান্স পাঠানোর ক্ষেত্রে সেরা সময় ও টিপস\n' +
             '3. বাংলাদেশে সরকারি ২.৫% প্রণোদনা ও বৈধ ব্যাংকিং চ্যানেল ব্যবহারের স্পষ্ট সুবিধা\n' +
             '4. মুদ্রা বিনিময়কালে অতিরিক্ত ফি বা কমিশন এড়ানোর পরামর্শ\n' +
             'তথ্যগুলো পয়েন্ট আকারে বাংলায় গুছিয়ে উপস্থাপন করুন।')
          : ('I am converting ' + val + ' ' + fromCode + ' (' + fromObj.en + ') to ' + toCode + ' (' + toObj.en + '). Current live exchange rate: 1 ' + fromCode + ' = ' + unitRate.toFixed(4) + ' ' + toCode + '. Total converted: ' + converted.toFixed(2) + ' ' + toCode + '.\n' +
             'As an international foreign exchange & remittance analyst, please provide:\n' +
             '1. Brief economic overview for this currency pair\n' +
             '2. Practical remittance & exchange timing tips\n' +
             '3. Official banking channel benefits & Bangladesh Govt 2.5% incentive advantages\n' +
             '4. Practical tips to avoid hidden bank commissions or spreads\n' +
             'Format cleanly with bullet points.');

        var res = await UI.callAI(prompt, {
          systemInstruction: (UI.lang === 'bn')
            ? 'আপনি একজন অভিজ্ঞ বৈদেশিক মুদ্রা বিশ্লেষক ও আন্তর্জাতিক ফাইন্যান্সিয়াল কনসালটেন্ট। সহজবোধ্য ও বাস্তবিক পরামর্শ দিন।'
            : 'You are an experienced international forex and remittance advisor. Provide actionable and clear insights.'
        });

        if (res && res.success && res.text) {
          return res.text;
        }

        // Realistic fallback if AI key is not connected
        if (UI.lang === 'bn') {
          var incentiveBDT = (toCode === 'BDT') ? (converted * 0.025) : (val * unitRate * 0.025);
          return '### 💡 ' + fromCode + ' থেকে ' + toCode + ' রেমিট্যান্স ও মুদ্রা পরামর্শ\n\n' +
            '**১. বর্তমান এক্সচেঞ্জ রেট ও হিসাব:**\n' +
            '- বর্তমান লাইভ রেট: **১ ' + fromCode + ' = ' + UI.num(unitRate, 4) + ' ' + toCode + '**।\n' +
            '- মোট প্রত্যাশিত বিনিময় মূল্য: **' + UI.num(converted, 2) + ' ' + toCode + '**।\n\n' +
            '**২. বৈধ চ্যানেলে অতিরিক্ত ২.৫% সরকারি প্রণোদনা:**\n' +
            '- বৈধ ব্যাংকিং বা অনুমোদিত রেমিট্যান্স চ্যানেলে পাঠালে আপনি পাবেন অতিরিক্ত **' + UI.num(incentiveBDT, 2) + ' ৳** নগদ সরকারি বোনাস।\n' +
            '- এটি সরাসরি প্রাপকের ব্যাংক অ্যাকাউন্টে মূল টাকার সাথে জমা হয়।\n\n' +
            '**৩. প্রবাসীদের জন্য জরুরি টিপস:**\n' +
            '- হুন্ডি বা অবৈধ পথে টাকা পাঠালে যেকোনো সময় অর্থ খোয়া যেতে পারে এবং কোনো আইনি সুরক্ষা থাকে না।\n' +
            '- ছুটির দিন বা সপ্তাহের শেষে ব্যাংকিং স্প্রেড সামান্য বেশি থাকে; তাই সপ্তাহের কর্মদিবসে (সোমবার–বৃহস্পতিবার) রেমিট্যান্স পাঠানো সবচেয়ে লাভজনক।\n\n' +
            '> 💡 *পরামর্শ:* আপনার Google Gemini বা OpenAI API Key কানেক্ট করলে নির্দিষ্ট ব্যাংক ও রিয়েল-টাইম বাজারের পূর্বাভাসসহ সম্পূর্ণ কাস্টমাইজড রিপোর্ট পাবেন।';
        } else {
          return '### 💡 ' + fromCode + ' to ' + toCode + ' Exchange & Remittance Insights\n\n' +
            '**1. Exchange Overview:**\n' +
            '- Real-time Rate: **1 ' + fromCode + ' = ' + unitRate.toFixed(4) + ' ' + toCode + '**\n' +
            '- Estimated total converted: **' + converted.toFixed(2) + ' ' + toCode + '**\n\n' +
            '**2. Legal Banking Channel Benefits:**\n' +
            '- If converting to Bangladeshi Taka via legal channels, recipients receive an additional **2.5% Bangladesh Government Cash Incentive** directly into their account.\n\n' +
            '**3. Timing & Transfer Tips:**\n' +
            '- Mid-week days (Tuesday through Thursday) typically offer the tightest interbank spreads.\n' +
            '- Compare direct wire transfers vs authorized money service operators to maximize net funds received.\n\n' +
            '> 💡 *Tip:* Connect your Google Gemini or OpenAI API Key to get customized real-time market projections and bank fee comparisons.';
        }
      }
    });

    // Update Live Status Badge
    function updateStatusUI() {
      liveBadge.innerHTML = isLiveApi
        ? '<span class="currency-pulse-dot"></span> ' + tr('🟢 লাইভ রেট সক্রিয়', '🟢 Live Rates Active')
        : '<span class="currency-pulse-dot offline"></span> ' + tr('🟡 স্ট্যান্ডার্ড রেট', '🟡 Standard Rates');
      updateTimeSpan.textContent = tr('আপডেট: ', 'Updated: ') + lastUpdateText;
    }

    // Live rates fetcher
    async function fetchLiveRates(force) {
      refreshBtn.disabled = true;
      var iconEl = refreshBtn.querySelector('svg');
      if (iconEl) iconEl.classList.add('spin-anim');

      try {
        var res = await fetch('https://open.er-api.com/v6/latest/USD');
        if (!res.ok) throw new Error('Primary API error ' + res.status);
        var data = await res.json();
        if (data && data.rates) {
          Object.assign(rates, data.rates);
          isLiveApi = true;
          var dt = new Date();
          var timeStr = dt.toLocaleDateString(UI.lang === 'bn' ? 'bn-BD' : 'en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
          });
          lastUpdateText = timeStr;
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
              rates: rates,
              dateText: timeStr,
              ts: Date.now()
            }));
          } catch (e) {}
        }
      } catch (err1) {
        // Fallback to secondary API
        try {
          var res2 = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
          if (res2.ok) {
            var data2 = await res2.json();
            if (data2 && data2.rates) {
              Object.assign(rates, data2.rates);
              isLiveApi = true;
              var dt2 = new Date();
              var timeStr2 = dt2.toLocaleDateString(UI.lang === 'bn' ? 'bn-BD' : 'en-US', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
              });
              lastUpdateText = timeStr2;
              try {
                localStorage.setItem(CACHE_KEY, JSON.stringify({
                  rates: rates,
                  dateText: timeStr2,
                  ts: Date.now()
                }));
              } catch (e) {}
            }
          }
        } catch (err2) {
          console.warn('Currency API unavailable, using cached/seed rates', err2);
        }
      }

      refreshBtn.disabled = false;
      if (iconEl) iconEl.classList.remove('spin-anim');
      updateStatusUI();
      calc();
      renderPopularCards();
    }

    // Format currency amount with thousands separators
    function fmtCurr(n) {
      if (isNaN(n)) return '0';
      var parts = n.toFixed(2).split('.');
      var intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return (UI.lang === 'bn') ? UI.n(intPart + '.' + parts[1]) : (intPart + '.' + parts[1]);
    }

    // Main calculation & rendering
    function calc() {
      UI.clear(resultCard);
      var rawAmt = UI.parseNum(amtInput.value);
      var amt = (rawAmt !== null && !isNaN(rawAmt) && rawAmt >= 0) ? rawAmt : 1;
      var fromCode = fromSel.value;
      var toCode = toSel.value;
      var fromObj = getCurr(fromCode);
      var toObj = getCurr(toCode);

      var rFrom = rates[fromCode] || 1;
      var rTo = rates[toCode] || 1;
      var unitRate = rTo / rFrom;
      var invRate = rFrom / rTo;
      var total = amt * unitRate;

      // Hero result display
      var fromStr = (UI.lang === 'bn' ? UI.n(String(amt)) : amt) + ' ' + fromCode;
      var toStr = fmtCurr(total) + ' ' + toCode;
      var fullStr = fromStr + ' = ' + toStr;

      var heroTop = UI.el('div', { class: 'currency-res-top' },
        UI.el('span', { class: 'currency-res-lead' }, fromStr + ' =')
      );

      var heroMain = UI.el('div', { class: 'currency-res-big' },
        UI.el('span', { class: 'currency-res-sym' }, toObj.sym),
        UI.el('span', { class: 'currency-res-val' }, fmtCurr(total)),
        UI.el('span', { class: 'currency-res-code' }, toCode)
      );

      var subRateText = (UI.lang === 'bn')
        ? ('১ ' + fromCode + ' = ' + UI.num(unitRate, 4) + ' ' + toCode + '  •  ১ ' + toCode + ' = ' + UI.num(invRate, 4) + ' ' + fromCode)
        : ('1 ' + fromCode + ' = ' + unitRate.toFixed(4) + ' ' + toCode + '  •  1 ' + toCode + ' = ' + invRate.toFixed(4) + ' ' + fromCode);

      var heroSub = UI.el('div', { class: 'currency-res-sub' }, subRateText);

      // Copy result button
      var copyBtn = UI.el('button', {
        type: 'button',
        class: 'btn sub mini currency-copy-btn'
      }, UI.icon('copy'), ' ' + tr('কপি করুন', 'Copy Result'));

      copyBtn.addEventListener('click', function () {
        var copyText = fullStr + ' (Rate: 1 ' + fromCode + ' = ' + unitRate.toFixed(4) + ' ' + toCode + ')';
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(copyText).then(function () {
            copyBtn.textContent = '✓ ' + tr('কপি হয়েছে!', 'Copied!');
            setTimeout(function () {
              UI.clear(copyBtn);
              copyBtn.appendChild(UI.icon('copy'));
              copyBtn.appendChild(document.createTextNode(' ' + tr('কপি করুন', 'Copy Result')));
            }, 2000);
          });
        }
      });

      var actionRow = UI.el('div', { class: 'currency-res-actions' }, copyBtn);

      resultCard.appendChild(heroTop);
      resultCard.appendChild(heroMain);
      resultCard.appendChild(heroSub);
      resultCard.appendChild(actionRow);
    }

    // Popular currency rates to BDT grid
    var POPULAR_CURRENCIES = ['USD', 'SAR', 'AED', 'EUR', 'GBP', 'MYR', 'KWD', 'QAR', 'SGD', 'INR'];
    function renderPopularCards() {
      UI.clear(popularGrid);
      var bdtRate = rates['BDT'] || 122.99;

      POPULAR_CURRENCIES.forEach(function (cCode) {
        var cObj = getCurr(cCode);
        var rateInUsd = rates[cCode] || 1;
        var toBdt = bdtRate / rateInUsd;

        var card = UI.el('div', {
          class: 'currency-rate-card',
          role: 'button',
          tabindex: '0',
          title: tr(cObj.bn + ' থেকে টাকায় কনভার্ট করুন', 'Convert ' + cObj.en + ' to BDT')
        },
          UI.el('div', { class: 'currency-card-head' },
            UI.el('span', { class: 'currency-card-flag' }, cObj.flag),
            UI.el('div', { class: 'currency-card-meta' },
              UI.el('b', {}, cObj.code),
              UI.el('span', { class: 'currency-card-name' }, (UI.lang === 'bn' ? cObj.bn : cObj.en))
            )
          ),
          UI.el('div', { class: 'currency-card-body' },
            UI.el('span', { class: 'currency-card-eq' }, (UI.lang === 'bn' ? '১ ' : '1 ') + cObj.code + ' ='),
            UI.el('span', { class: 'currency-card-rate' }, '৳ ' + (UI.lang === 'bn' ? UI.num(toBdt, 2) : toBdt.toFixed(2)))
          )
        );

        function selectPair() {
          fromSel.value = cCode;
          toSel.value = 'BDT';
          calc();
          resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        card.addEventListener('click', selectPair);
        card.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            selectPair();
          }
        });

        popularGrid.appendChild(card);
      });
    }

    // Event listeners
    amtInput.addEventListener('input', calc);
    fromSel.addEventListener('change', calc);
    toSel.addEventListener('change', calc);

    swapBtn.addEventListener('click', function () {
      var prevFrom = fromSel.value;
      fromSel.value = toSel.value;
      toSel.value = prevFrom;
      swapBtn.classList.add('rotate-once');
      setTimeout(function () { swapBtn.classList.remove('rotate-once'); }, 400);
      calc();
    });

    refreshBtn.addEventListener('click', function () {
      fetchLiveRates(true);
    });

    // Assemble Form Layout
    var formBox = UI.el('div', { class: 'currency-form-box' },
      UI.el('div', { class: 'currency-amt-group' },
        UI.el('label', { class: 'currency-label' }, tr('টাকার পরিমাণ লিখুন', 'Enter Amount')),
        amtInput,
        pillsContainer
      ),
      UI.el('div', { class: 'currency-selects-row' },
        UI.el('div', { class: 'currency-select-col' },
          UI.el('label', { class: 'currency-label' }, tr('যে মুদ্রা থেকে', 'From Currency')),
          fromSel
        ),
        UI.el('div', { class: 'currency-swap-col' },
          swapBtn
        ),
        UI.el('div', { class: 'currency-select-col' },
          UI.el('label', { class: 'currency-label' }, tr('যে মুদ্রায় রূপান্তর', 'To Currency')),
          toSel
        )
      )
    );

    var popularSection = UI.el('div', { class: 'currency-popular-section' },
      UI.el('div', { class: 'currency-popular-title' },
        UI.el('h3', {}, tr('জনপ্রিয় বৈদেশিক মুদ্রার আজকের লাইভ রেট (বাংলাদেশী টাকায়)', 'Popular Currency Exchange Rates Today (in BDT)')),
        UI.el('span', { class: 'currency-popular-sub' }, tr('যেকোনো কার্ডে ক্লিক করে সরাসরি রূপান্তর করুন', 'Click any card to convert immediately'))
      ),
      popularGrid
    );

    // Mount everything to root
    root.appendChild(topStatusBar);
    root.appendChild(formBox);
    root.appendChild(resultCard);
    root.appendChild(incentiveNotice);
    root.appendChild(popularSection);
    root.appendChild(aiBox.el);

    // Initial run
    updateStatusUI();
    calc();
    renderPopularCards();

    // Fetch live rates in background
    setTimeout(function () {
      fetchLiveRates(false);
    }, 100);
  };

})();
