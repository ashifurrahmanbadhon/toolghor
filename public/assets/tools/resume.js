/* রেজিউমে বিল্ডার ও সিভি টেমপ্লেট */
(function () {
  var UI = window.UI, T = window.Tools, tr = UI.tr;
  var KEY = 'resume-data-v1';

  var LABELS = {
    en: { summary: 'Career Objective', exp: 'Work Experience', edu: 'Education', skills: 'Skills', lang: 'Languages', personal: 'Personal Details', ref: 'References', contact: 'Contact', cls_title: 'CURRICULUM VITAE', degree: 'Exam / Degree', inst: 'Institute', year: 'Year', result: 'Result' },
    bn: { summary: 'ক্যারিয়ার উদ্দেশ্য', exp: 'কাজের অভিজ্ঞতা', edu: 'শিক্ষাগত যোগ্যতা', skills: 'দক্ষতা', lang: 'ভাষা', personal: 'ব্যক্তিগত তথ্য', ref: 'রেফারেন্স', contact: 'যোগাযোগ', cls_title: 'জীবনবৃত্তান্ত', degree: 'পরীক্ষা / ডিগ্রি', inst: 'প্রতিষ্ঠান', year: 'সাল', result: 'ফলাফল' }
  };
  var TEMPLATES = [
    { id: 'professional', label: tr('প্রফেশনাল', "Professional"), note: tr('এক কলাম, পরিষ্কার', "Single column, clean") },
    { id: 'modern', label: tr('মডার্ন সাইডবার', "Modern sidebar"), note: tr('রঙিন সাইডবার, ছবিসহ', "Coloured sidebar, with photo") },
    { id: 'classic', label: tr('বাংলাদেশি স্ট্যান্ডার্ড সিভি', "Bangladeshi standard CV"), note: tr('ছবি ও ব্যক্তিগত তথ্যসহ', "With photo and personal details") },
    { id: 'minimal', label: tr('মিনিমাল', "Minimal"), note: tr('হালকা ও আধুনিক', "Light and modern") }
  ];
  var COLORS = ['#0e7a5a', '#2557d6', '#7a2e8e', '#c0392b', '#1f2d3d', '#b06a00'];
  var PERSONAL_LABELS = [tr('পিতার নাম', "Father's name"), tr('মাতার নাম', "Mother's name"), tr('জন্ম তারিখ', "Date of birth"), tr('জাতীয়তা', "Nationality"), tr('ধর্ম', "Religion"), tr('বৈবাহিক অবস্থা', "Marital status"), tr('জাতীয় পরিচয়পত্র নম্বর', "National ID number"), tr('স্থায়ী ঠিকানা', "Permanent address")];

  function blank() {
    return {
      name: '', title: '', phone: '', email: '', address: '', links: '', summary: '', photo: '', skills: '', languages: '', references: '',
      exp: [{ role: '', company: '', period: '', details: '' }], edu: [{ degree: '', school: '', period: '', result: '' }],
      extra: PERSONAL_LABELS.slice(0, 6).map(function (l) { return { label: l, value: '' }; }),
      tpl: 'professional', color: COLORS[0], lang: 'en'
    };
  }
  var SAMPLE_BN = {
    name: 'আসিফুর রহমান', title: 'Electrical & Electronic Engineer', phone: '01712-345678', email: 'ashifur.rahman@example.com', address: 'মিরপুর-১০, ঢাকা-১২১৬', links: 'linkedin.com/in/example',
    summary: 'ডিজিটাল মার্কেটিংয়ে ৩ বছরের অভিজ্ঞতাসম্পন্ন, ফলাফলমুখী ও দলগতভাবে কাজ করতে দক্ষ। প্রতিষ্ঠানের অনলাইন উপস্থিতি ও বিক্রি বাড়াতে অবদান রাখতে চাই।',
    photo: '', skills: 'Facebook Ads, SEO, Content Writing, MS Excel, Canva, Communication', languages: 'বাংলা (মাতৃভাষা), English (Fluent), Hindi (Basic)',
    references: 'ফাহমিদা আক্তার, ম্যানেজার, ABC Ltd. – 01800-000000',
    exp: [
      { role: 'Electrical & Electronic Engineer', company: 'ABC Engineering Ltd., ঢাকা', period: '2023 – এখন', details: 'ফেসবুক ও গুগল অ্যাডের মাধ্যমে মাসিক বিক্রি ২৫% বৃদ্ধি\nসোশ্যাল মিডিয়া কনটেন্ট প্ল্যান ও রিপোর্ট তৈরি\n৫ সদস্যের টিমের সঙ্গে সমন্বয়' },
      { role: 'Intern', company: 'XYZ Agency', period: '2022 – 2023', details: 'ক্লায়েন্টের জন্য পোস্ট ডিজাইন ও শিডিউলিং' }],
    edu: [
      { degree: 'BBA (Marketing)', school: 'ঢাকা বিশ্ববিদ্যালয়', period: '2018 – 2022', result: 'CGPA 3.45 / 4.00' },
      { degree: 'HSC (Business Studies)', school: 'ঢাকা কলেজ', period: '2017', result: 'GPA 5.00' }],
    extra: [['পিতার নাম', 'মোঃ আবুল হাসান'], ['মাতার নাম', 'রাহেলা বেগম'], ['জন্ম তারিখ', '১২ মার্চ ২০০০'], ['জাতীয়তা', 'বাংলাদেশি'], ['বৈবাহিক অবস্থা', 'অবিবাহিত']].map(function (p) { return { label: p[0], value: p[1] }; })
  };
  var SAMPLE_EN = {
    name: 'Ashifur Rahman', title: 'Electrical & Electronic Engineer', phone: '01712-345678', email: 'ashifur.rahman@example.com', address: 'Mirpur-10, Dhaka-1216', links: 'linkedin.com/in/example',
    summary: 'Results-driven marketing professional with 3 years of digital marketing experience and a strong team-player attitude. Looking to help grow an organisation\'s online presence and sales.',
    photo: '', skills: 'Facebook Ads, SEO, Content Writing, MS Excel, Canva, Communication', languages: 'Bangla (Native), English (Fluent), Hindi (Basic)',
    references: 'Fahmida Akter, Manager, ABC Ltd. – 01800-000000',
    exp: [
      { role: 'Electrical & Electronic Engineer', company: 'ABC Engineering Ltd., Dhaka', period: '2023 – Present', details: 'Increased monthly sales by 25% through Facebook and Google Ads\nPrepared social media content plans and reports\nCoordinated with a team of 5 members' },
      { role: 'Intern', company: 'XYZ Agency', period: '2022 – 2023', details: 'Designed and scheduled posts for clients' }],
    edu: [
      { degree: 'BBA (Marketing)', school: 'University of Dhaka', period: '2018 – 2022', result: 'CGPA 3.45 / 4.00' },
      { degree: 'HSC (Business Studies)', school: 'Dhaka College', period: '2017', result: 'GPA 5.00' }],
    extra: [["Father's name", 'Md. Abul Hasan'], ["Mother's name", 'Rahela Begum'], ['Date of birth', '12 March 2000'], ['Nationality', 'Bangladeshi'], ['Marital status', 'Unmarried']].map(function (p) { return { label: p[0], value: p[1] }; })
  };
  var SAMPLE = UI.lang === 'bn' ? SAMPLE_BN : SAMPLE_EN;

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function lines(t) { return String(t || '').split(/\r?\n/).map(function (x) { return x.trim().replace(/^[-•*]\s*/, ''); }).filter(Boolean); }
  function bullets(t) {
    var l = lines(t); if (!l.length) return '';
    return l.length === 1 ? '<p>' + esc(l[0]) + '</p>' : '<ul>' + l.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
  }
  function chips(t) { return String(t || '').split(/[,،\\n]+/).map(function (x) { return x.trim(); }).filter(Boolean); }
  function filled(arr, keys) { return (arr || []).filter(function (it) { return keys.some(function (k) { return (it[k] || '').trim(); }); }); }
  function contacts(d) { return [d.phone, d.email, d.address, d.links].filter(function (x) { return (x || '').trim(); }); }
  function photoImg(d, cls) { return d.photo ? '<img class="photo ' + (cls || '') + '" src="' + d.photo + '" alt="">' : ''; }

  /* ---------- টেমপ্লেট রেন্ডার ---------- */
  function renderPro(d, L) {
    var ex = filled(d.exp, ['role', 'company', 'details']), ed = filled(d.edu, ['degree', 'school']), sk = chips(d.skills), lg = chips(d.languages), px = filled(d.extra, ['value']);
    return '<div class="paper rs-pro" style="--ac:' + d.color + '">' +
      '<div class="head"><div><h1>' + esc(d.name || tr('আপনার নাম', "Your Name")) + '</h1>' + (d.title ? '<div class="ttl">' + esc(d.title) + '</div>' : '') +
      '<div class="contact-line">' + contacts(d).map(function (c) { return '<span>' + esc(c) + '</span>'; }).join('') + '</div></div>' + photoImg(d) + '</div>' +
      (d.summary.trim() ? '<h2>' + L.summary + '</h2><p>' + esc(d.summary) + '</p>' : '') +
      (ex.length ? '<h2>' + L.exp + '</h2>' + ex.map(function (e) { return '<div class="it"><div class="r"><span>' + esc(e.role) + (e.company ? ' – ' + esc(e.company) : '') + '</span><span>' + esc(e.period) + '</span></div>' + bullets(e.details) + '</div>'; }).join('') : '') +
      (ed.length ? '<h2>' + L.edu + '</h2>' + ed.map(function (e) { return '<div class="it"><div class="r"><span>' + esc(e.degree) + (e.school ? ' – ' + esc(e.school) : '') + '</span><span>' + esc(e.period) + '</span></div>' + (e.result ? '<div class="muted">' + esc(e.result) + '</div>' : '') + '</div>'; }).join('') : '') +
      (sk.length ? '<h2>' + L.skills + '</h2><p>' + sk.map(esc).join(' · ') + '</p>' : '') +
      (lg.length ? '<h2>' + L.lang + '</h2><p>' + lg.map(esc).join(' · ') + '</p>' : '') +
      (px.length ? '<h2>' + L.personal + '</h2>' + px.map(function (p) { return '<div>' + esc(p.label) + ': ' + esc(p.value) + '</div>'; }).join('') : '') +
      (d.references.trim() ? '<h2>' + L.ref + '</h2>' + bullets(d.references) : '') + '</div>';
  }
  function renderMod(d, L) {
    var ex = filled(d.exp, ['role', 'company', 'details']), ed = filled(d.edu, ['degree', 'school']), sk = chips(d.skills), lg = chips(d.languages), px = filled(d.extra, ['value']);
    return '<div class="paper rs-mod" style="--ac:' + d.color + '"><aside>' + photoImg(d) +
      (contacts(d).length ? '<h3>' + L.contact + '</h3>' + contacts(d).map(function (c) { return '<p>' + esc(c) + '</p>'; }).join('') : '') +
      (sk.length ? '<h3>' + L.skills + '</h3><ul>' + sk.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>' : '') +
      (lg.length ? '<h3>' + L.lang + '</h3><ul>' + lg.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>' : '') +
      (px.length ? '<h3>' + L.personal + '</h3>' + px.map(function (p) { return '<p><b>' + esc(p.label) + ':</b> ' + esc(p.value) + '</p>'; }).join('') : '') +
      '</aside><main><h1>' + esc(d.name || tr('আপনার নাম', "Your Name")) + '</h1>' + (d.title ? '<div class="ttl">' + esc(d.title) + '</div>' : '') +
      (d.summary.trim() ? '<h2>' + L.summary + '</h2><p>' + esc(d.summary) + '</p>' : '') +
      (ex.length ? '<h2>' + L.exp + '</h2>' + ex.map(function (e) { return '<div class="it"><div class="r"><span>' + esc(e.role) + '</span><span>' + esc(e.period) + '</span></div>' + (e.company ? '<div class="muted">' + esc(e.company) + '</div>' : '') + bullets(e.details) + '</div>'; }).join('') : '') +
      (ed.length ? '<h2>' + L.edu + '</h2>' + ed.map(function (e) { return '<div class="it"><div class="r"><span>' + esc(e.degree) + '</span><span>' + esc(e.period) + '</span></div><div class="muted">' + esc(e.school) + (e.result ? ' · ' + esc(e.result) : '') + '</div></div>'; }).join('') : '') +
      (d.references.trim() ? '<h2>' + L.ref + '</h2>' + bullets(d.references) : '') + '</main></div>';
  }
  function renderCls(d, L) {
    var ex = filled(d.exp, ['role', 'company', 'details']), ed = filled(d.edu, ['degree', 'school']), sk = chips(d.skills), lg = chips(d.languages), px = filled(d.extra, ['value']);
    return '<div class="paper rs-cls" style="--ac:' + d.color + '"><div style="text-align:center;font-weight:700;letter-spacing:.08em;font-size:10pt;margin-bottom:4mm">' + L.cls_title + '</div>' +
      '<div class="head"><div><h1>' + esc(d.name || tr('আপনার নাম', "Your Name")) + '</h1>' + (d.title ? '<div class="ttl">' + esc(d.title) + '</div>' : '') +
      '<div style="margin-top:6px">' + contacts(d).map(function (c) { return '<div>' + esc(c) + '</div>'; }).join('') + '</div></div>' + photoImg(d) + '</div>' +
      (d.summary.trim() ? '<h2>' + L.summary + '</h2><p>' + esc(d.summary) + '</p>' : '') +
      (ed.length ? '<h2>' + L.edu + '</h2><table class="edu"><tr><th>' + L.degree + '</th><th>' + L.inst + '</th><th>' + L.year + '</th><th>' + L.result + '</th></tr>' + ed.map(function (e) { return '<tr><td>' + esc(e.degree) + '</td><td>' + esc(e.school) + '</td><td>' + esc(e.period) + '</td><td>' + esc(e.result) + '</td></tr>'; }).join('') + '</table>' : '') +
      (ex.length ? '<h2>' + L.exp + '</h2>' + ex.map(function (e) { return '<div class="it"><b>' + esc(e.role) + '</b>' + (e.company ? ', ' + esc(e.company) : '') + (e.period ? ' <span class="muted">(' + esc(e.period) + ')</span>' : '') + bullets(e.details) + '</div>'; }).join('') : '') +
      (sk.length ? '<h2>' + L.skills + '</h2><p>' + sk.map(esc).join(', ') + '</p>' : '') +
      (lg.length ? '<h2>' + L.lang + '</h2><p>' + lg.map(esc).join(', ') + '</p>' : '') +
      (px.length ? '<h2>' + L.personal + '</h2><table>' + px.map(function (p) { return '<tr><td>' + esc(p.label) + '</td><td>: ' + esc(p.value) + '</td></tr>'; }).join('') + '</table>' : '') +
      (d.references.trim() ? '<h2>' + L.ref + '</h2>' + bullets(d.references) : '') + '</div>';
  }
  function renderMin(d, L) {
    var ex = filled(d.exp, ['role', 'company', 'details']), ed = filled(d.edu, ['degree', 'school']), sk = chips(d.skills), lg = chips(d.languages), px = filled(d.extra, ['value']);
    function sec(t, body) { return body ? '<div class="sec"><h2>' + t + '</h2><div>' + body + '</div></div>' : ''; }
    return '<div class="paper rs-min" style="--ac:' + d.color + '"><div class="head"><div><h1>' + esc(d.name || tr('আপনার নাম', "Your Name")) + '</h1>' + (d.title ? '<div class="ttl">' + esc(d.title) + '</div>' : '') + '</div>' + photoImg(d) + '</div>' +
      '<div class="contact-line">' + contacts(d).map(function (c) { return '<span>' + esc(c) + '</span>'; }).join('') + '</div>' +
      sec(L.summary, d.summary.trim() ? '<p>' + esc(d.summary) + '</p>' : '') +
      sec(L.exp, ex.map(function (e) { return '<div class="it"><div class="r"><span>' + esc(e.role) + (e.company ? ', ' + esc(e.company) : '') + '</span><span>' + esc(e.period) + '</span></div>' + bullets(e.details) + '</div>'; }).join('')) +
      sec(L.edu, ed.map(function (e) { return '<div class="it"><div class="r"><span>' + esc(e.degree) + (e.school ? ', ' + esc(e.school) : '') + '</span><span>' + esc(e.period) + '</span></div>' + (e.result ? '<div class="muted">' + esc(e.result) + '</div>' : '') + '</div>'; }).join('')) +
      sec(L.skills, sk.length ? '<p>' + sk.map(esc).join(' · ') + '</p>' : '') +
      sec(L.lang, lg.length ? '<p>' + lg.map(esc).join(' · ') + '</p>' : '') +
      sec(L.personal, px.map(function (p) { return '<div>' + esc(p.label) + ': ' + esc(p.value) + '</div>'; }).join('')) +
      sec(L.ref, d.references.trim() ? bullets(d.references) : '') + '</div>';
  }
  var RENDER = { professional: renderPro, modern: renderMod, classic: renderCls, minimal: renderMin };
  function render(d, tpl) { return RENDER[tpl || d.tpl](d, LABELS[d.lang || 'en']); }

  /* ---------- UI ---------- */

  /* ============ AI Resume Assistant Engine ============ */
  async function callResumeAI(prompt, systemInstruction) {
    if (UI.callAI) {
      var res = await UI.callAI(prompt, { systemInstruction: systemInstruction });
      if (res && res.success && res.text) return res.text;
    }
    return null;
  }

  // Curated database for instant high-quality local generation
  var RESUME_DATABASE = {
    engineer: {
      keys: ['engineer', 'electrical', 'electronic', 'mechanical', 'civil', 'ইঞ্জিনিয়ার', 'প্রকৌশলী'],
      summaries_en: [
        'Dedicated and results-driven Engineer with expertise in system design, project execution, and quality assurance. Passionate about applying innovative engineering methodologies to deliver robust, cost-effective solutions.',
        'Detail-oriented Engineering professional with a strong technical background, problem-solving mindset, and hands-on experience in modern tools. Proven track record of team collaboration and timely project delivery.',
        'High-performing Engineer committed to operational excellence, safety compliance, and sustainable innovation. Skilled in project management, analytical diagnostics, and cross-functional team leadership.'
      ],
      summaries_bn: [
        'প্রকৌশল বিদ্যা ও সিস্টেম ডিজাইনে দক্ষ, ফলাফলমুখী এবং দায়িত্বশীল প্রফেশনাল। আধুনিক প্রযুক্তি ও উদ্ভাবনী ধারণার মাধ্যমে প্রতিষ্ঠানের প্রজেক্ট বাস্তবায়ন ও উৎপাদনশীলতা বৃদ্ধিতে অবদান রাখতে আগ্রহী।',
        'দৃঢ় টেকনিক্যাল জ্ঞান এবং বিশ্লেষণমূলক দক্ষতাসম্পন্ন প্রকৌশলী। জটিল সমস্যা সমাধানে ও দলগতভাবে কাজ করে নির্দিষ্ট সময়ের মধ্যে মানসম্মত ফলাফল প্রদানে প্রতিজ্ঞাবদ্ধ।',
        'প্রজেক্ট ম্যানেজমেন্ট, কোয়ালিটি কন্ট্রোল এবং সেফটি স্ট্যান্ডার্ডে অভিজ্ঞ প্রফেশনাল। সর্বোচ্চ পেশাদারিত্ব ও নিষ্ঠার সাথে প্রতিষ্ঠানের উন্নতিতে কাজ করতে প্রস্তুত।'
      ],
      bullets_en: [
        'Designed, tested, and implemented engineering systems, reducing operational downtime by 18%.',
        'Supervised end-to-end site operations and safety protocols, ensuring 100% regulatory compliance.',
        'Prepared detailed CAD drawings, technical documentation, and project feasibility reports.',
        'Coordinated effectively with cross-functional teams and subcontractors to meet stringent delivery deadlines.',
        'Conducted preventive maintenance diagnostics that extended equipment lifespan by 25%.'
      ],
      bullets_bn: [
        'সিস্টেম ডিজাইন ও বাস্তবায়ন কার্যক্রম পরিচালনা করে পরিচালন ব্যয় ১৫% হ্রাস করেছি।',
        'অন-সাইট কার্যক্রম ও সুরক্ষা প্রটোকল তদারকি করে শতভাগ কমপ্লায়েন্স নিশ্চিত করেছি।',
        'প্রজেক্টের টেকনিক্যাল ড্রয়িং, ডকুমেন্টেশন এবং নিয়মিত অগ্রগতি প্রতিবেদন তৈরি করেছি।',
        'নির্ধারিত সময়ের মধ্যে প্রকল্প সম্পন্ন করতে সাব-কন্ট্রাক্টর ও টিমের সাথে সফল সমন্বয় করেছি।'
      ],
      skills: ['AutoCAD', 'MATLAB', 'Circuit Design', 'Project Management', 'Quality Assurance', 'Troubleshooting', 'Safety Compliance', 'PLC Programming', 'Team Leadership', 'Analytical Thinking', 'Problem Solving', 'Data Analysis']
    },
    developer: {
      keys: ['developer', 'software', 'programmer', 'web', 'frontend', 'backend', 'full stack', 'ডেভেলপার', 'প্রোগ্রামার'],
      summaries_en: [
        'Passionate Software Developer with a solid foundation in modern web frameworks, clean architecture, and responsive user experiences. Eager to contribute to scalable products and collaborate in agile environments.',
        'Full-Stack Developer skilled in designing performant RESTful APIs and modern frontend interfaces. Committed to writing clean, maintainable code, test automation, and continuous delivery.',
        'Creative and analytical Web Developer experienced in building robust web applications. Enthusiastic about emerging web technologies, optimized performance, and intuitive user experiences.'
      ],
      summaries_bn: [
        'আধুনিক ওয়েব ও সফটওয়্যার ডেভেলপমেন্টে অভিজ্ঞ, পরিচ্ছন্ন কোড ও রেসপনসিভ ইউজার ইন্টারফেস তৈরিতে পারদর্শী। প্রতিষ্ঠানের ডিজিটাল পণ্য ও প্ল্যাটফর্মকে আরও উন্নত করতে আগ্রহী।',
        'ফুল-স্ট্যাক ওয়েব প্রযুক্তিতে দক্ষ প্রফেশনাল। আধুনিক ফ্রেমওয়ার্ক, এপিআই ইন্টিগ্রেশন এবং ডেটাবেজ অপটিমাইজেশনের মাধ্যমে স্কেলেবল অ্যাপ্লিকেশন তৈরিতে নিবেদিত।',
        'নতুন প্রযুক্তি শেখার প্রতি আগ্রহী এবং চটপটে টিম পরিবেশে কাজ করতে দক্ষ সফটওয়্যার ডেভেলপার। ব্যবহারকারীবান্ধব ও দ্রুতগতির সফটওয়্যার তৈরিতে প্রতিশ্রুতিবদ্ধ।'
      ],
      bullets_en: [
        'Developed and deployed responsive web applications used by over 50,000 active monthly users.',
        'Optimized frontend assets and API endpoints, improving overall page load speeds by 35%.',
        'Collaborated with UI/UX designers and product managers in fast-paced Agile sprint cycles.',
        'Integrated secure payment gateways and third-party RESTful APIs with comprehensive unit tests.',
        'Identified and resolved critical production bugs, achieving a 99.8% application uptime.'
      ],
      bullets_bn: [
        'উন্নত ওয়েব অ্যাপ্লিকেশন তৈরি ও পরিচালনা করেছি যা মাসিক হাজার হাজার ব্যবহারকারী ব্যবহার করেন।',
        'এপিআই ও ফ্রন্টএন্ড কোড অপটিমাইজ করে অ্যাপ্লিকেশন লোডিং স্পিড ৩০% বৃদ্ধি করেছি।',
        'এজাইল/স্ক্রাম পদ্ধতিতে ডিজাইনার ও টিম মেম্বারদের সাথে সমন্বয় করে ফিচার ডেভেলপ করেছি।',
        'নিরাপদ পেমেন্ট গেটওয়ে এবং ডাটাবেজ আর্কিটেকচার সফলভাবে সংযুক্ত করেছি।'
      ],
      skills: ['JavaScript', 'HTML5 & CSS3', 'React / Next.js', 'Node.js', 'Git & GitHub', 'RESTful APIs', 'SQL & MongoDB', 'Responsive Design', 'TypeScript', 'Debugging', 'Agile / Scrum', 'Problem Solving']
    },
    marketing: {
      keys: ['marketing', 'digital marketer', 'seo', 'social media', 'content', 'মার্কেটিং'],
      summaries_en: [
        'Results-oriented Digital Marketer with proven expertise in SEO, paid campaigns, and content growth strategies. Committed to maximizing ROI, increasing brand visibility, and driving quality conversions.',
        'Creative Social Media & Content Strategist passionate about storytelling, audience engagement, and data-driven optimization. Skilled in multi-channel campaign execution and analytics.',
        'Growth-focused Marketing Professional with experience in market research, lead generation, and performance marketing. Dedicated to expanding customer acquisition and business revenue.'
      ],
      summaries_bn: [
        'ডিজিটাল মার্কেটিং, এসইও এবং পেইড ক্যাম্পেইনে অভিজ্ঞ, ফলাফলমুখী প্রফেশনাল। প্রতিষ্ঠানের ব্র্যান্ড সচেতনতা বৃদ্ধি ও বিক্রয় বাড়াতে ডেটা-চালিত স্ট্র্যাটেজি তৈরিতে দক্ষ।',
        'সোশ্যাল মিডিয়া ম্যানেজমেন্ট ও কনটেন্ট মার্কেটিংয়ে দক্ষ ক্রিয়েটিভ প্রফেশনাল। গ্রাহকদের এনগেজমেন্ট বৃদ্ধি ও নতুন ক্লায়েন্ট আকর্ষণে নির্ভরযোগ্য ট্র্যাক রেকর্ড রয়েছে।',
        'গ্রোথ মার্কেটিং ও লিড জেনারেশনে পারদর্শী উদ্যমী কর্মী। আধুনিক অনলাইন টুলস ও অ্যানালিটিক্স ব্যবহার করে ক্যাম্পেইনের আরওআই (ROI) নিশ্চিত করতে প্রতিশ্রুতিবদ্ধ।'
      ],
      bullets_en: [
        'Managed paid ad campaigns across Meta and Google, generating a 3.4x Return on Ad Spend (ROAS).',
        'Conducted on-page and technical SEO audits, increasing organic search traffic by 45% in 6 months.',
        'Designed high-converting email sequences and landing pages that boosted lead capture rate by 28%.',
        'Produced engaging social media content that grew brand followers from 10k to 50k organically.',
        'Monitored campaign KPIs using Google Analytics and delivered actionable bi-weekly performance reports.'
      ],
      bullets_bn: [
        'মেটা ও গুগল অ্যাড ক্যাম্পেইন পরিচালনা করে আশাতীত আরওআই (ROAS) অর্জন করেছি।',
        'এসইও ও কিওয়ার্ড রিসার্চের মাধ্যমে ওয়েবসাইটের অর্গানিক ভিজিটর ৪০% বৃদ্ধি করেছি।',
        'আকর্ষণীয় সোশ্যাল মিডিয়া কনটেন্ট ও বিজ্ঞাপনী কপি লিখে গ্রাহক এনগেজমেন্ট দ্বিগুণ করেছি।',
        'গুগল অ্যানালিটিক্স ব্যবহার করে ক্যাম্পেইনের কার্যকারিতা বিশ্লেষণ ও রিপোর্ট প্রস্তুত করেছি।'
      ],
      skills: ['SEO & SEM', 'Google Ads', 'Facebook & Meta Ads', 'Google Analytics', 'Content Writing', 'Email Marketing', 'Copywriting', 'Canva & Design', 'Social Media Strategy', 'Market Research', 'CRM Tools', 'Communication']
    },
    sales: {
      keys: ['sales', 'executive', 'business development', 'বিক্রয়', 'সেলস'],
      summaries_en: [
        'Dynamic Sales & Business Development Executive with a strong history of exceeding sales targets, cultivating client relationships, and opening new market territories.',
        'Customer-centric Sales Professional skilled in consultative selling, client negotiations, and pipeline management. Passionate about driving revenue growth and long-term brand loyalty.',
        'Energetic and persuasive Sales Executive committed to understanding client pain points and presenting tailored value propositions to close high-value deals.'
      ],
      summaries_bn: [
        'টার্গেট অর্জনে আত্মবিশ্বাসী ও উদ্যমী সেলস প্রফেশনাল। ক্লায়েন্টদের সাথে দীর্ঘমেয়াদী সুসম্পর্ক তৈরি এবং নতুন ব্যবসায়িক সুযোগ উন্মোচনে পারদর্শী।',
        'পরামর্শমূলক বিক্রয় ও দক্ষ যোগাযোগে পারদর্শী সেলস এক্সিকিউটিভ। প্রতিষ্ঠানের বিক্রয় বৃদ্ধি ও মার্কেট শেয়ার সম্প্রসারণে নিবেদিতভাবে কাজ করতে আগ্রহী।',
        'চ্যালেঞ্জিং পরিবেশে কাজ করতে সক্ষম ও লক্ষ্যমুখী পেশাদার কর্মী। ক্লায়েন্টের চাহিদা অনুযায়ী সঠিক সমাধান তুলে ধরে ডিল সম্পন্ন করতে দক্ষ।'
      ],
      bullets_en: [
        'Consistently exceeded quarterly sales targets by 115–130% through proactive prospecting.',
        'Built and managed a robust pipeline of over 120 qualified B2B corporate prospects.',
        'Delivered persuasive product presentations and contract negotiations, securing 30+ new accounts.',
        'Collaborated with customer service to maintain a 92% client retention rate.',
        'Conducted competitor benchmarking and market analysis to identify untapped local customer segments.'
      ],
      bullets_bn: [
        'ধারাবাহিকভাবে নির্ধারিত মাসিক সেলস টার্গেট শতভাগ পূরণ ও অতিক্রম করেছি।',
        'নতুন করপোরেট ক্লায়েন্টদের সাথে যোগাযোগ স্থাপন করে ৩০টিরও বেশি নতুন একাউন্ট যুক্ত করেছি।',
        'গ্রাহকদের সাথে পণ্য সম্পর্কিত আলোচনা ও চুক্তি সফলভাবে চূড়ান্ত করেছি।',
        'ক্লায়েন্টদের সার্বক্ষণিক সাপোর্ট প্রদান করে ৯০%+ গ্রাহক সন্তুষ্টি ধরে রেখেছি।'
      ],
      skills: ['B2B & B2C Sales', 'Client Negotiation', 'Relationship Management', 'Lead Generation', 'Cold Calling & Pitching', 'CRM Software', 'Market Analysis', 'Presentation Skills', 'Active Listening', 'Closing Deals']
    },
    finance: {
      keys: ['account', 'finance', 'audit', 'bank', 'অ্যাকাউন্টিং', 'হিসাব'],
      summaries_en: [
        'Meticulous Accounting & Finance Professional with a proven track record in financial reporting, ledger reconciliation, and tax compliance. Committed to accuracy and fiscal integrity.',
        'Detail-focused Financial Analyst skilled in budget forecasting, variance analysis, and cash flow management. Dedicated to providing data-driven insights that support strategic decisions.',
        'Experienced Accountant with extensive knowledge of ERP accounting software, internal controls, and statutory audits. Eager to optimize financial workflows and ensure transparency.'
      ],
      summaries_bn: [
        'হিসাবরক্ষণ, আর্থিক প্রতিবেদন তৈরি এবং ট্যাক্স কমপ্লায়েন্সে অভিজ্ঞ ও নিষ্ঠাবান প্রফেশনাল। প্রতিষ্ঠানের আর্থিক স্বচ্ছতা ও সঠিক হিসাব বজায় রাখতে প্রতিশ্রুতিবদ্ধ।',
        'বাজেটিং, ক্যাশ ফ্লো ম্যানেজমেন্ট এবং আর্থিক বিশ্লেষণে দক্ষ ফাইন্যান্স কর্মী। নিখুঁতভাবে আর্থিক বিবরণী প্রস্তুত ও প্রতিষ্ঠানের লাভজনক সিদ্ধান্ত গ্রহণে সহায়তা করতে আগ্রহী।',
        'অ্যাকাউন্টিং সফটওয়্যার ও ব্যাংক রিকনসিলিয়েশনে পারদর্শী অভিজ্ঞ একাউন্ট্যান্ট। সর্বোচ্চ সততা ও নিয়মানুবর্তিতার সাথে আর্থিক শৃঙ্খলা বজায় রাখতে প্রস্তুত।'
      ],
      bullets_en: [
        'Managed daily bookkeeping, journal entries, and general ledger accounts with 100% accuracy.',
        'Prepared monthly balance sheets, income statements, and cash flow reports for executive review.',
        'Conducted bank reconciliations and audited expense reports, reducing discrepancy errors by 40%.',
        'Assisted in annual external audits and ensured strict compliance with tax regulations and VAT filings.',
        'Implemented streamlined billing workflows that shortened payment collection cycles by 12 days.'
      ],
      bullets_bn: [
        'প্রতিদিনের লেনদেন, লেজার ও বুককিপিং নিখুঁতভাবে সংরক্ষণ ও পরিচালনা করেছি।',
        'মাসিক আয়-ব্যয়ের হিসাব, ব্যালেন্স শিট এবং ক্যাশ ফ্লো স্টেটমেন্ট প্রস্তুত করেছি।',
        'ব্যাংক রিকনসিলিয়েশন সম্পন্ন করে আর্থিক গড়মিল ৪০% কমিয়ে এনেছি।',
        'বাৎসরিক অডিট ও ট্যাক্স/ভ্যাট ডকুমেন্টস তৈরিতে গুরুত্বপূর্ণ অবদান রেখেছি।'
      ],
      skills: ['Financial Reporting', 'Tally / QuickBooks / ERP', 'MS Excel (VLOOKUP, Pivot)', 'Taxation & VAT', 'Bank Reconciliation', 'Budgeting & Forecasting', 'Auditing', 'Cash Flow Management', 'Analytical Precision']
    }
  };

  function findDbProfile(roleTitle) {
    if (!roleTitle) return RESUME_DATABASE.engineer;
    var t = roleTitle.toLowerCase();
    for (var k in RESUME_DATABASE) {
      var item = RESUME_DATABASE[k];
      for (var i = 0; i < item.keys.length; i++) {
        if (t.indexOf(item.keys[i]) !== -1) return item;
      }
    }
    return RESUME_DATABASE.developer;
  }

  function getLocalSummaries(role, lang, level) {
    var p = findDbProfile(role);
    var isBn = (lang === 'bn');
    var list = isBn ? p.summaries_bn : p.summaries_en;
    if (role && role.trim()) {
      return list.map(function (s) {
        return s.replace(/Engineer|Software Developer|Digital Marketer|Sales & Business Development Executive|Accounting & Finance Professional/gi, role.trim());
      });
    }
    return list;
  }

  function getLocalBullets(role, lang) {
    var p = findDbProfile(role);
    var isBn = (lang === 'bn');
    return isBn ? p.bullets_bn : p.bullets_en;
  }

  function getLocalSkills(role) {
    var p = findDbProfile(role);
    return p.skills;
  }

  function calculateResumeScore(d) {
    var score = 0;
    var checks = [];

    // 1. Personal & Contact (30 pts)
    var nameOk = !!(d.name && d.name.trim());
    var contactOk = !!(d.phone && d.email);
    var titleOk = !!(d.title && d.title.trim());
    var pScore = (nameOk ? 10 : 0) + (contactOk ? 12 : 4) + (titleOk ? 8 : 0);
    score += pScore;
    checks.push({
      label: tr('নাম, পদবি ও যোগাযোগের তথ্য', "Name, title & contact details"),
      pass: nameOk && contactOk,
      pts: pScore + '/30',
      tip: (!contactOk ? tr('মোবাইল নম্বর ও ইমেইল অবশ্যই যোগ করুন।', "Add both mobile number and email.") : '')
    });

    // 2. Career Summary (20 pts)
    var sumLen = (d.summary || '').trim().length;
    var sScore = sumLen > 60 ? 20 : (sumLen > 20 ? 12 : 0);
    score += sScore;
    checks.push({
      label: tr('ক্যারিয়ার অবজেক্টিভ / সংক্ষিপ্ত পরিচিতি', "Career objective / summary"),
      pass: sumLen > 50,
      pts: sScore + '/20',
      tip: (sumLen < 50 ? tr('২–৩ বাক্যে একটি শক্তিশালী ক্যারিয়ার উদ্দেশ্য লিখুন।', "Write a 2-3 sentence impactful objective.") : '')
    });

    // 3. Work Experience (25 pts)
    var exps = (d.exp || []).filter(function (e) { return (e.role || '').trim(); });
    var hasExpDetails = exps.some(function (e) { return (e.details || '').trim().length > 30; });
    var eScore = exps.length >= 2 ? (hasExpDetails ? 25 : 20) : (exps.length === 1 ? 15 : 5);
    score += eScore;
    checks.push({
      label: tr('কাজের অভিজ্ঞতা ও বিবরণী', "Work experience & details"),
      pass: exps.length > 0 && hasExpDetails,
      pts: eScore + '/25',
      tip: (!hasExpDetails ? tr('অভিজ্ঞতার ক্ষেত্রে কী কী দায়িত্ব পালন করেছেন তা পয়েন্ট আকারে লিখুন।', "Add bullet points describing your achievements.") : '')
    });

    // 4. Education (15 pts)
    var edus = (d.edu || []).filter(function (e) { return (e.degree || '').trim(); });
    var edScore = edus.length >= 2 ? 15 : (edus.length === 1 ? 10 : 0);
    score += edScore;
    checks.push({
      label: tr('শিক্ষাগত যোগ্যতা', "Educational qualifications"),
      pass: edus.length > 0,
      pts: edScore + '/15',
      tip: (edus.length === 0 ? tr('সর্বোচ্চ ডিগ্রি ও প্রতিষ্ঠানের নাম যোগ করুন।', "Add your highest degree and institution.") : '')
    });

    // 5. Skills (10 pts)
    var skillsCount = (d.skills || '').split(/[,،\n]+/).filter(function (s) { return s.trim(); }).length;
    var skScore = skillsCount >= 6 ? 10 : (skillsCount >= 3 ? 6 : (skillsCount > 0 ? 3 : 0));
    score += skScore;
    checks.push({
      label: tr('দক্ষতা ও স্কিলস', "Key skills"),
      pass: skillsCount >= 5,
      pts: skScore + '/10',
      tip: (skillsCount < 5 ? tr('কমপক্ষে ৫-৮টি সম্পর্কিত টেকনিক্যাল ও সফট স্কিলস যোগ করুন।', "Add at least 5-8 relevant skills.") : '')
    });

    return { score: Math.min(100, score), checks: checks };
  }

  function build(root, defTpl, gallery) {
    var d = blank(), had = false;
    try { var raw = localStorage.getItem(KEY); if (raw) { var saved = JSON.parse(raw); if (saved && typeof saved === 'object') { d = Object.assign(d, saved); had = true; } } } catch (e) { }
    if (!had || !RENDER[d.tpl]) d.tpl = defTpl;
    var persist = UI.debounce(function () { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { } }, 400);

    var frame = UI.el('div', { class: 'paper-frame' }), tplBox = UI.el('div'), form = UI.el('div', { class: 'rb-form' });
    function fit() {
      var p = frame.firstChild; if (!p) return;
      var s = frame.clientWidth / (210 * 3.7795275591); // 210mm → px
      p.style.transform = 'scale(' + s + ')'; frame.style.height = (p.offsetHeight * s) + 'px';
    }
    function refresh() {
      frame.innerHTML = render(d); fit(); persist(); updateCvScoreBadge();
    }
    window.addEventListener('resize', fit);

    /* AI Resume Assistant Modal */
    function openAiResumeModal(initialTab, contextRole) {
      initialTab = initialTab || 'summary';
      var activeTab = initialTab;
      var roleVal = contextRole || d.title || (d.lang === 'bn' ? 'এক্সিকিউটিভ' : 'Executive');

      var backdrop = UI.el('div', { class: 'ai-modal-backdrop' });
      var modal = UI.el('div', { class: 'ai-modal-box ai-resume-modal', style: { maxWidth: '640px', width: '94%' } });

      // Modal Head
      var closeBtn = UI.el('button', { class: 'ai-modal-close', 'aria-label': 'Close' }, '✕');
      closeBtn.addEventListener('click', function () { document.body.removeChild(backdrop); });
      backdrop.addEventListener('click', function (e) { if (e.target === backdrop) document.body.removeChild(backdrop); });

      var head = UI.el('div', { class: 'ai-modal-head' },
        UI.el('div', { style: { display: 'flex', alignItems: 'center', gap: '10px' } },
          UI.el('span', { style: { fontSize: '24px' } }, '✨'),
          UI.el('div', {},
            UI.el('h2', { class: 'ai-modal-title' }, tr('এআই রেজিউমে অ্যাসিস্ট্যান্ট', "AI Resume Assistant")),
            UI.el('p', { class: 'ai-modal-subtitle' }, tr('স্মার্ট এআই দিয়ে সিভি আরও প্রফেশনাল ও আকর্ষণীয় বানান', "Craft an outstanding, ATS-friendly professional CV with AI"))
          )
        ),
        closeBtn
      );

      // Tabs Header
      var tabs = [
        { id: 'summary', label: tr('📝 অবজেক্টিভ', "📝 Career Objective") },
        { id: 'bullets', label: tr('💼 কাজের বিবরণী', "💼 Work Experience") },
        { id: 'skills', label: tr('🎯 স্কিলস সাজেশন', "🎯 Skills") },
        { id: 'review', label: tr('🔍 সিভি অডিট ও স্কোর', "🔍 CV Audit & Score") }
      ];

      var tabsNav = UI.el('div', { class: 'ai-resume-tabs' });
      var body = UI.el('div', { class: 'ai-res-content' });

      function renderTabNav() {
        UI.clear(tabsNav);
        tabs.forEach(function (t) {
          var btn = UI.el('button', {
            type: 'button',
            class: 'ai-res-tab' + (activeTab === t.id ? ' active' : '')
          }, t.label);
          btn.addEventListener('click', function () {
            activeTab = t.id;
            renderTabNav();
            renderTabContent();
          });
          tabsNav.appendChild(btn);
        });
      }

      function renderTabContent() {
        UI.clear(body);

        // TAB 1: CAREER OBJECTIVE
        if (activeTab === 'summary') {
          var roleInput = UI.el('input', {
            type: 'text',
            value: roleVal,
            placeholder: tr('যেমন: Software Engineer, Sales Manager, Accountant...', "e.g. Software Engineer, Sales Manager, Accountant...")
          });
          var levelSel = UI.select([
            { value: 'fresher', label: tr('ফ্রেশার / ক্যারিয়ারের শুরু (Fresher / Entry)', "Fresher / Entry Level") },
            { value: 'mid', label: tr('১–৩ বছরের অভিজ্ঞতা (Mid-Level)', "1–3 Years Experience") },
            { value: 'senior', label: tr('৩+ বছরের অভিজ্ঞ ও দক্ষ (Senior)', "3+ Years Experienced") }
          ], 'mid');

          var resultsBox = UI.el('div', { class: 'stack', style: { gap: '10px' } });

          var genBtn = UI.btn(tr('✨ অবজেক্টিভ লিখুন', "✨ Generate Career Objectives"), async function () {
            var curRole = roleInput.value.trim() || d.title || 'Professional';
            genBtn.disabled = true;
            genBtn.textContent = tr('এআই তৈরি করছে…', "AI generating…");
            UI.clear(resultsBox);

            var generatedList = [];
            var onlinePrompt = "Write 3 distinct, high-impact career objective summaries (2-3 sentences each) for a resume for the role: '" + curRole + "' at " + levelSel.value + " level. Language: " + (d.lang === 'bn' ? 'Bengali' : 'English') + ". Provide them as 3 numbered points.";
            var aiText = await callResumeAI(onlinePrompt, "You are an expert resume writer.");

            if (aiText) {
              generatedList = aiText.split(/\n(?=\d+[.)]|Option \d+:)/).map(function (s) {
                return s.replace(/^\d+[.)]\s*|^Option \d+:\s*/i, '').trim();
              }).filter(Boolean);
            }

            if (!generatedList.length) {
              generatedList = getLocalSummaries(curRole, d.lang, levelSel.value);
            }

            genBtn.disabled = false;
            genBtn.textContent = tr('✨ অবজেক্টিভ লিখুন', "✨ Generate Career Objectives");

            generatedList.slice(0, 3).forEach(function (optText, idx) {
              var card = UI.el('div', { class: 'ai-card' },
                UI.el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
                  UI.el('strong', { style: { fontSize: '13px', color: 'var(--paddy-d)' } }, tr('অপশন ', "Option ") + (idx + 1)),
                  UI.btn(tr('✓ সিভিতে যোগ করুন', "✓ Apply to CV"), function () {
                    d.summary = optText;
                    buildForm();
                    refresh();
                    document.body.removeChild(backdrop);
                    UI.toast(tr('✓ ক্যারিয়ার অবজেক্টিভ সিভিতে যুক্ত হয়েছে!', "✓ Career objective applied to CV!"));
                  }, { cls: 'alt sm' })
                ),
                UI.el('p', { style: { margin: '0', fontSize: '13.5px', lineHeight: '1.5' } }, optText)
              );
              resultsBox.appendChild(card);
            });
          }, { icon: 'sparkles', cls: 'ai-resume-btn' });

          body.appendChild(UI.el('div', { class: 'row' },
            UI.field(tr('পদবি / কাঙ্ক্ষিত পদ', "Target Job Title"), roleInput),
            UI.field(tr('অভিজ্ঞতার লেভেল', "Experience Level"), levelSel)
          ));
          body.appendChild(UI.el('div', { style: { display: 'flex', justifyContent: 'flex-start' } }, genBtn));
          body.appendChild(resultsBox);

          // Auto-trigger generation on open
          setTimeout(function () { genBtn.click(); }, 30);
        }

        // TAB 2: WORK EXPERIENCE BULLETS
        else if (activeTab === 'bullets') {
          var expRoleInput = UI.el('input', {
            type: 'text',
            value: roleVal,
            placeholder: tr('যেমন: Sales Executive, Site Engineer, Digital Marketer...', "e.g. Sales Executive, Site Engineer...")
          });
          var expCompanyInput = UI.el('input', {
            type: 'text',
            placeholder: tr('প্রতিষ্ঠানের নাম (ঐচ্ছিক)', "Company name (optional)")
          });

          var bulletsResults = UI.el('div', { class: 'stack', style: { gap: '10px' } });

          var genBulletsBtn = UI.btn(tr('✨ কাজের বিবরণী (Bullets) লিখুন', "✨ Generate Job Description Bullets"), async function () {
            var curRole = expRoleInput.value.trim() || 'Professional';
            genBulletsBtn.disabled = true;
            genBulletsBtn.textContent = tr('এআই তৈরি করছে…', "AI generating…");
            UI.clear(bulletsResults);

            var bulletsList = [];
            var onlinePrompt = "Write 4 strong, action-verb driven, measurable resume job description bullet points for the position: '" + curRole + "'. Language: " + (d.lang === 'bn' ? 'Bengali' : 'English') + ". List each bullet point on a new line starting with a dash or bullet.";
            var aiText = await callResumeAI(onlinePrompt, "You are an ATS resume optimization expert.");

            if (aiText) {
              bulletsList = aiText.split(/\r?\n/).map(function (s) {
                return s.replace(/^[-•*\d.)]+\s*/, '').trim();
              }).filter(Boolean);
            }

            if (!bulletsList.length) {
              bulletsList = getLocalBullets(curRole, d.lang);
            }

            genBulletsBtn.disabled = false;
            genBulletsBtn.textContent = tr('✨ কাজের বিবরণী (Bullets) লিখুন', "✨ Generate Job Description Bullets");

            var combinedBullets = bulletsList.join('\n');
            var card = UI.el('div', { class: 'ai-card' },
              UI.el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
                UI.el('strong', { style: { fontSize: '13px', color: 'var(--paddy-d)' } }, tr('এআই সাজেস্টেড বুলেট পয়েন্টসমূহ:', "AI Suggested Bullet Points:")),
                UI.btn(tr('✓ সিভিতে নতুন অভিজ্ঞতা হিসেবে যোগ করুন', "✓ Add as Experience to CV"), function () {
                  d.exp.push({
                    role: curRole,
                    company: expCompanyInput.value.trim() || (d.lang === 'bn' ? 'প্রতিষ্ঠান' : 'Company Name'),
                    period: d.lang === 'bn' ? '২০২৩ – এখন' : '2023 – Present',
                    details: combinedBullets
                  });
                  buildForm();
                  refresh();
                  document.body.removeChild(backdrop);
                  UI.toast(tr('✓ নতুন কাজের অভিজ্ঞতা সিভিতে যুক্ত হয়েছে!', "✓ Experience added to CV!"));
                }, { cls: 'alt sm' })
              ),
              UI.el('ul', { style: { margin: '0', paddingInlineStart: '20px', fontSize: '13.5px', lineHeight: '1.6' } },
                bulletsList.map(function (b) { return UI.el('li', {}, b); })
              )
            );
            bulletsResults.appendChild(card);
          }, { icon: 'sparkles', cls: 'ai-resume-btn' });

          body.appendChild(UI.el('div', { class: 'row' },
            UI.field(tr('কাজের পদ / পদবি', "Job Position"), expRoleInput),
            UI.field(tr('প্রতিষ্ঠানের নাম (ঐচ্ছিক)', "Company Name (Optional)"), expCompanyInput)
          ));
          body.appendChild(UI.el('div', { style: { display: 'flex', justifyContent: 'flex-start' } }, genBulletsBtn));
          body.appendChild(bulletsResults);

          setTimeout(function () { genBulletsBtn.click(); }, 30);
        }

        // TAB 3: SKILLS RECOMMENDER
        else if (activeTab === 'skills') {
          var skillRoleInput = UI.el('input', {
            type: 'text',
            value: roleVal,
            placeholder: tr('যেমন: Graphic Designer, Electrical Engineer...', "e.g. Graphic Designer, Electrical Engineer...")
          });

          var skillsChipsWrap = UI.el('div', { class: 'ai-chip-list' });

          var findSkillsBtn = UI.btn(tr('✨ শীর্ষ স্কিলস খুঁজুন', "✨ Find In-Demand Skills"), async function () {
            var curRole = skillRoleInput.value.trim() || 'Professional';
            findSkillsBtn.disabled = true;
            findSkillsBtn.textContent = tr('খুঁজছে…', "Searching…");
            UI.clear(skillsChipsWrap);

            var skillsList = [];
            var onlinePrompt = "List 15 top in-demand hard and soft skills for a resume for the job title: '" + curRole + "'. Provide comma-separated skill names only.";
            var aiText = await callResumeAI(onlinePrompt, "You are a tech recruiter.");

            if (aiText) {
              skillsList = aiText.split(/[,\n]+/).map(function (s) { return s.trim(); }).filter(Boolean);
            }
            if (!skillsList.length) {
              skillsList = getLocalSkills(curRole);
            }

            findSkillsBtn.disabled = false;
            findSkillsBtn.textContent = tr('✨ শীর্ষ স্কিলস খুঁজুন', "✨ Find In-Demand Skills");

            var currentSkills = (d.skills || '').split(/[,،\n]+/).map(function (s) { return s.trim().toLowerCase(); });

            skillsList.forEach(function (skillName) {
              var isAlreadyAdded = currentSkills.indexOf(skillName.toLowerCase()) !== -1;
              var chip = UI.el('button', {
                type: 'button',
                class: 'ai-skill-chip' + (isAlreadyAdded ? ' added' : '')
              }, (isAlreadyAdded ? '✓ ' : '+ ') + skillName);

              chip.addEventListener('click', function () {
                var curArr = (d.skills || '').split(/[,،]+/).map(function (s) { return s.trim(); }).filter(Boolean);
                var idx = curArr.map(function (s) { return s.toLowerCase(); }).indexOf(skillName.toLowerCase());
                if (idx === -1) {
                  curArr.push(skillName);
                  chip.classList.add('added');
                  chip.textContent = '✓ ' + skillName;
                  UI.toast(tr('স্কিল যুক্ত হয়েছে: ', "Skill added: ") + skillName);
                } else {
                  curArr.splice(idx, 1);
                  chip.classList.remove('added');
                  chip.textContent = '+ ' + skillName;
                }
                d.skills = curArr.join(', ');
                buildForm();
                refresh();
              });
              skillsChipsWrap.appendChild(chip);
            });
          }, { icon: 'sparkles', cls: 'ai-resume-btn' });

          body.appendChild(UI.el('div', { style: { display: 'flex', gap: '10px', alignItems: 'flex-end' } },
            UI.field(tr('যে পদের জন্য স্কিলস চান', "Target Profession for Skills"), skillRoleInput),
            findSkillsBtn
          ));
          body.appendChild(UI.el('div', { class: 'lbl', style: { marginTop: '8px' } },
            tr('💡 নিচের যেকোনো স্কিলে ক্লিক করে সরাসরি সিভিতে যুক্ত করুন:', "💡 Click on any skill below to add it directly to your CV:")
          ));
          body.appendChild(skillsChipsWrap);

          setTimeout(function () { findSkillsBtn.click(); }, 30);
        }

        // TAB 4: CV AUDIT & SCORE
        else if (activeTab === 'review') {
          var audit = calculateResumeScore(d);
          var scoreMeter = UI.el('div', { class: 'ai-score-box' },
            UI.el('div', { class: 'ai-score-badge' },
              audit.score + '%',
              UI.el('small', {}, tr('স্কোর', "Score"))
            ),
            UI.el('div', {},
              UI.el('strong', { style: { fontSize: '16px', color: 'var(--ink)' } },
                audit.score >= 80 ? tr('চমৎকার! আপনার সিভি নিয়োগকর্তাদের নজর কাড়ার মতো।', "Great job! Your CV looks competitive.") :
                (audit.score >= 50 ? tr('ভালো, তবে কিছু গুরুত্বপূর্ণ তথ্য যোগ করলে আরও ভালো হবে।', "Good start, but missing some key details.") :
                 tr('সিভি অপূর্ণাঙ্গ। নিচের পরামর্শগুলো পূরণ করুন।', "Incomplete CV. Follow the tips below to improve."))
              ),
              UI.el('p', { class: 'lbl', style: { margin: '4px 0 0 0', fontSize: '13px' } },
                tr('ATS ফ্রেন্ডলি ও প্রফেশনাল মান বজায় রাখতে প্রতিটি চেকলিস্ট পূরণ করুন।', "Follow the checklist below to optimize for recruiters and ATS filters.")
              )
            )
          );

          var checklistWrap = UI.el('div', { class: 'stack', style: { gap: '10px' } });
          audit.checks.forEach(function (chk) {
            var row = UI.el('div', {
              class: 'ai-card',
              style: {
                borderLeft: '4px solid ' + (chk.pass ? 'var(--paddy)' : '#e06c75'),
                padding: '10px 14px'
              }
            },
              UI.el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
                UI.el('strong', { style: { fontSize: '14px' } }, (chk.pass ? '✓ ' : '⚠️ ') + chk.label),
                UI.el('span', { style: { fontSize: '12px', fontWeight: '700', color: chk.pass ? 'var(--paddy-d)' : '#c0392b' } }, chk.pts)
              ),
              chk.tip ? UI.el('div', { style: { fontSize: '12.5px', color: '#c0392b' } }, '💡 ' + chk.tip) : null
            );
            checklistWrap.appendChild(row);
          });

          body.appendChild(scoreMeter);
          body.appendChild(checklistWrap);
        }
      }

      // Modal Footer
      var foot = UI.el('div', { class: 'ai-modal-foot' },
        UI.el('div', { class: 'ai-modal-foot-info' },
          UI.el('span', { class: 'ic' }, '⚡'),
          UI.el('span', {}, tr('Google Gemini & OpenAI AI সাপোর্ট সংযুক্ত', "Powered by Google Gemini & OpenAI"))
        ),
        UI.el('div', { class: 'ai-modal-foot-actions' },
          UI.btn(tr('বন্ধ করুন', "Close"), function () { document.body.removeChild(backdrop); }, { variant: 'ghost' })
        )
      );

      modal.appendChild(head);
      modal.appendChild(tabsNav);
      modal.appendChild(body);
      modal.appendChild(foot);
      backdrop.appendChild(modal);
      document.body.appendChild(backdrop);

      renderTabNav();
      renderTabContent();
    }

    /* CV Score Live Badge */
    var cvScoreBadge = UI.el('button', {
      type: 'button',
      class: 'btn sm',
      style: {
        background: 'color-mix(in srgb, var(--paddy) 14%, var(--paper))',
        border: '1.5px solid var(--paddy)',
        color: 'var(--paddy-d)',
        fontWeight: '700',
        padding: '3px 10px',
        fontSize: '12px'
      }
    });
    cvScoreBadge.addEventListener('click', function () {
      openAiResumeModal('review');
    });

    function updateCvScoreBadge() {
      var sc = calculateResumeScore(d).score;
      cvScoreBadge.innerHTML = '⚡ ' + tr('সিভি স্কোর: ', "CV Score: ") + sc + '% (' + tr('রিভিউ', "Review") + ')';
    }

    /* টেমপ্লেট বাছাই */
    function drawTpl() {
      UI.clear(tplBox);
      if (gallery) {
        var wrap = UI.el('div', { class: 'tpl-pick' });
        TEMPLATES.forEach(function (t) {
          var thumb = UI.el('div', { class: 'tpl-thumb' });
          thumb.innerHTML = render(Object.assign({}, SAMPLE_FULL(), { color: d.color, lang: d.lang }), t.id);
          var card = UI.el('button', { type: 'button', class: 'tpl-card', 'aria-pressed': String(d.tpl === t.id), onclick: function () { d.tpl = t.id; drawTpl(); refresh(); } }, thumb, UI.el('strong', {}, t.label), UI.el('small', { class: 'lbl', style: { display: 'block' } }, t.note));
          wrap.appendChild(card);
          setTimeout(function () { var p = thumb.firstChild; if (p && thumb.clientWidth) p.style.transform = 'scale(' + (thumb.clientWidth / 793.7) + ')'; }, 0);
        });
        tplBox.appendChild(wrap);
      } else {
        tplBox.appendChild(UI.seg(TEMPLATES.map(function (t) { return { value: t.id, label: t.label }; }), d.tpl, function (v) { d.tpl = v; refresh(); }));
      }
    }
    function SAMPLE_FULL() { var s = blank(); Object.keys(SAMPLE).forEach(function (k) { s[k] = SAMPLE[k]; }); return s; }

    function txt(label, key, opts) {
      opts = opts || {};
      var c = opts.area ? UI.el('textarea', { rows: String(opts.rows || 3), placeholder: opts.ph || '' }) : UI.el('input', { type: opts.type || 'text', placeholder: opts.ph || '', autocomplete: 'off' });
      c.value = d[key] || '';
      c.addEventListener('input', function () { d[key] = c.value; refresh(); });
      return UI.field(label, c, opts.hint);
    }
    function listBlock(title, key, fields, blankItem, addLabel, aiAction) {
      var wrap = UI.el('div', { class: 'stack' });
      function draw() {
        UI.clear(wrap);
        d[key].forEach(function (it, i) {
          var item = UI.el('div', { class: 'rb-item' });
          fields.forEach(function (f) {
            var c = f.area ? UI.el('textarea', { rows: '3', placeholder: f.ph || '' }) : UI.el('input', { type: 'text', placeholder: f.ph || '' });
            c.value = it[f.k] || ''; c.addEventListener('input', function () { it[f.k] = c.value; refresh(); });
            item.appendChild(UI.field(f.label, c, f.hint));
          });
          item.appendChild(UI.el('div', { class: 'row' }, UI.btn(tr('এটি বাদ দিন', "Remove this"), function () { d[key].splice(i, 1); draw(); refresh(); }, { cls: 'danger sm', icon: 'trash-2', iconSize: 16 })));
          wrap.appendChild(item);
        });
        var addBtnRow = UI.el('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } },
          UI.btn(addLabel, function () { d[key].push(Object.assign({}, blankItem)); draw(); }, { cls: 'alt sm', icon: 'plus', iconSize: 16 })
        );
        if (aiAction) {
          addBtnRow.appendChild(UI.btn(aiAction.label, aiAction.onClick, { cls: 'alt sm', icon: 'sparkles', iconSize: 15 }));
        }
        wrap.appendChild(addBtnRow);
      }
      draw();
      return UI.el('details', { open: true }, UI.el('summary', {}, title), UI.el('div', { class: 'body' }, wrap));
    }
    function personalBlock() {
      var wrap = UI.el('div', { class: 'stack' });
      function draw() {
        UI.clear(wrap);
        d.extra.forEach(function (it, i) {
          var v = UI.el('input', { type: 'text', placeholder: tr('লিখুন', "Type here") }); v.value = it.value || ''; v.addEventListener('input', function () { it.value = v.value; refresh(); });
          wrap.appendChild(UI.field(it.label, v));
        });
        var l = UI.el('input', { type: 'text', placeholder: tr('নতুন তথ্যের নাম, যেমন: রক্তের গ্রুপ', "Name of the new detail, e.g. Blood group") });
        wrap.appendChild(UI.el('div', { class: 'row' }, UI.field(tr('আরও তথ্য যোগ করুন (ঐচ্ছিক)', "Add more details (optional)"), l), UI.btn(tr('যোগ করুন', "Add"), function () { if (l.value.trim()) { d.extra.push({ label: l.value.trim(), value: '' }); draw(); } }, { cls: 'alt sm', icon: 'plus', iconSize: 16 })));
      }
      draw();
      return UI.el('details', {}, UI.el('summary', {}, tr('ব্যক্তিগত তথ্য (ঐচ্ছিক)', "Personal details (optional)")), UI.el('div', { class: 'body' }, UI.el('small', { class: 'lbl' }, tr('যেগুলো লিখবেন না সেগুলো সিভিতে আসবে না।', "Details you leave blank will not appear in the CV.")), wrap));
    }
    /* ছবি */
    function photoBlock() {
      var prev = UI.el('div');
      function draw() { UI.clear(prev); if (d.photo) prev.appendChild(UI.el('div', { class: 'row', style: { alignItems: 'center' } }, UI.el('img', { class: 'thumb', src: d.photo, alt: '' }), UI.btn(tr('ছবি সরান', "Remove photo"), function () { d.photo = ''; draw(); refresh(); }, { cls: 'danger sm', icon: 'trash-2', iconSize: 16 }))); }
      draw();
      var drop = UI.dropzone({
        accept: 'image/*', label: tr('ছবি যোগ করুন (ঐচ্ছিক)', "Add a photo (optional)"), hint: tr('পাসপোর্ট সাইজ ছবি ভালো', "A passport-size photo works well"),
        onFiles: async function (fs) {
          try {
            var img = await UI.readImage(fs[0]), s = Math.min(1, 480 / Math.max(img.naturalWidth, img.naturalHeight));
            var c = UI.canvas(img.naturalWidth * s, img.naturalHeight * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
            d.photo = c.toDataURL('image/jpeg', 0.85); URL.revokeObjectURL(img._url); draw(); refresh();
          } catch (e) { UI.toast(tr('ছবিটি খোলা যায়নি', "Could not open the image")); }
        }
      });
      drop.style.padding = '14px';
      return UI.el('div', { class: 'stack' }, drop, prev);
    }

    function buildForm() {
      UI.clear(form);
      form.appendChild(UI.el('details', { open: true }, UI.el('summary', {}, tr('আপনার পরিচয়', "About you")), UI.el('div', { class: 'body' },
        txt(tr('পুরো নাম', "Full name"), 'name', { ph: tr('যেমন: আসিফুর রহমান', "e.g. Ashifur Rahman") }), txt(tr('পদবি / কাঙ্ক্ষিত পদ', "Job title / desired position"), 'title', { ph: tr('যেমন: Electrical & Electronic Engineer', "e.g. Electrical & Electronic Engineer") }),
        txt(tr('মোবাইল নম্বর', "Mobile number"), 'phone', { type: 'tel' }), txt(tr('ইমেইল', "Email"), 'email', { type: 'email' }), txt(tr('ঠিকানা', "Address"), 'address'), txt(tr('লিংকডইন/ওয়েবসাইট (ঐচ্ছিক)', "LinkedIn/website (optional)"), 'links'), photoBlock())));

      var summaryHeader = UI.el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingRight: '8px' } },
        UI.el('span', {}, tr('সংক্ষিপ্ত পরিচিতি / ক্যারিয়ার উদ্দেশ্য', "Short summary / career objective")),
        UI.btn(tr('✨ এআই দিয়ে লিখুন', "✨ Write with AI"), function (e) {
          e.preventDefault(); e.stopPropagation();
          openAiResumeModal('summary', d.title);
        }, { cls: 'alt sm', icon: 'sparkles', iconSize: 14 })
      );

      form.appendChild(UI.el('details', { open: true }, UI.el('summary', {}, summaryHeader), UI.el('div', { class: 'body' }, txt(tr('২–৩ বাক্যে লিখুন', "Write in 2–3 sentences"), 'summary', { area: true, rows: 4 }))));

      form.appendChild(listBlock(tr('কাজের অভিজ্ঞতা', 'Work experience'), 'exp', [{ k: 'role', label: tr('পদ', "Position"), ph: 'Sales Executive' }, { k: 'company', label: tr('প্রতিষ্ঠান', 'Institution'), ph: tr('ABC Ltd., ঢাকা', "ABC Ltd., Dhaka") }, { k: 'period', label: tr('সময়কাল', "Period"), ph: tr('2022 – এখন', "2022 – Present") }, { k: 'details', label: tr('কাজের বিবরণ', "Job description"), area: true, hint: tr('প্রতি লাইনে একটি পয়েন্ট লিখুন।', "Write one point per line.") }], { role: '', company: '', period: '', details: '' }, tr('আরেকটি অভিজ্ঞতা যোগ করুন', "Add another experience"), {
        label: tr('✨ এআই বুলেট পয়েন্ট জেনারেট', "✨ AI Bullets"),
        onClick: function () { openAiResumeModal('bullets', d.title); }
      }));

      form.appendChild(listBlock(tr('শিক্ষাগত যোগ্যতা', 'Education'), 'edu', [{ k: 'degree', label: tr('ডিগ্রি / পরীক্ষা', "Degree / exam"), ph: 'BBA, HSC…' }, { k: 'school', label: tr('প্রতিষ্ঠান', 'Institution') }, { k: 'period', label: tr('সময় / পাসের সাল', "Period / year of passing") }, { k: 'result', label: tr('ফলাফল', 'Result'), ph: 'CGPA 3.50' }], { degree: '', school: '', period: '', result: '' }, tr('আরেকটি ডিগ্রি যোগ করুন', "Add another degree")));

      var skillsHeader = UI.el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingRight: '8px' } },
        UI.el('span', {}, tr('দক্ষতা ও ভাষা', "Skills and languages")),
        UI.btn(tr('✨ এআই স্কিলস সাজেশন', "✨ Suggest Skills"), function (e) {
          e.preventDefault(); e.stopPropagation();
          openAiResumeModal('skills', d.title);
        }, { cls: 'alt sm', icon: 'sparkles', iconSize: 14 })
      );

      form.appendChild(UI.el('details', {}, UI.el('summary', {}, skillsHeader), UI.el('div', { class: 'body' },
        txt(tr('দক্ষতা (কমা দিয়ে আলাদা করুন)', "Skills (separate with commas)"), 'skills', { area: true, ph: 'MS Excel, Photoshop, Communication' }), txt(tr('ভাষা (কমা দিয়ে আলাদা করুন)', "Languages (separate with commas)"), 'languages', { ph: tr('বাংলা, English', "Bangla, English") }))));

      form.appendChild(personalBlock());
      form.appendChild(UI.el('details', {}, UI.el('summary', {}, tr('রেফারেন্স (ঐচ্ছিক)', "References (optional)")), UI.el('div', { class: 'body' }, txt(tr('প্রতি লাইনে একজন', "One person per line"), 'references', { area: true }))));
    }
    buildForm();

    var colorRow = UI.el('div', { class: 'seg' });
    function drawColors() {
      UI.clear(colorRow);
      COLORS.forEach(function (c) {
        colorRow.appendChild(UI.el('button', { type: 'button', 'aria-label': tr('রং ', "Colour ") + c, 'aria-pressed': String(d.color === c), style: { background: c, width: '34px', height: '34px', padding: '0', border: '3px solid ' + (d.color === c ? 'var(--ink)' : 'transparent') }, onclick: function () { d.color = c; drawColors(); if (gallery) drawTpl(); refresh(); } }));
      });
    }
    drawColors();
    var langSel = UI.seg([{ value: 'en', label: 'English' }, { value: 'bn', label: 'বাংলা' }], d.lang, function (v) { d.lang = v; if (gallery) drawTpl(); refresh(); });

    function printNow() {
      var area = document.getElementById('print-area');
      if (!area) { area = UI.el('div', { id: 'print-area' }); document.body.appendChild(area); }
      area.innerHTML = render(d);
      document.body.classList.add('printing');
      var oldTitle = document.title;
      var toolSlug = (document.body && document.body.getAttribute('data-tool')) || 'resume-builder';
      document.title = 'ToolGhor(' + toolSlug + ')';
      var done = function () {
        document.body.classList.remove('printing');
        area.innerHTML = '';
        document.title = oldTitle;
        window.removeEventListener('afterprint', done);
      };
      window.addEventListener('afterprint', done);
      setTimeout(function () { window.print(); }, 60);
    }

    var actions = UI.el('div', { class: 'row' },
      UI.btn(tr('পিডিএফ ডাউনলোড', "Download PDF"), printNow, { icon: 'printer' }),
      UI.btn(tr('✨ এআই রেজিউমে অ্যাসিস্ট্যান্ট', "✨ AI Resume Assistant"), function () { openAiResumeModal('summary', d.title); }, { cls: 'ai-resume-btn', icon: 'sparkles' }),
      UI.btn(tr('নমুনা তথ্য দিয়ে দেখুন', "Try with sample data"), function () { var keep = { tpl: d.tpl, color: d.color, lang: d.lang }; d = Object.assign(blank(), JSON.parse(JSON.stringify(SAMPLE)), keep); buildForm(); refresh(); }, { cls: 'alt' }),
      UI.btn(tr('সব মুছে নতুন করে শুরু', "Clear everything and start over"), function () { if (confirm(tr('ফর্মের সব তথ্য মুছে যাবে। নিশ্চিত?', "All the details in the form will be erased. Are you sure?"))) { var keep = { tpl: d.tpl, color: d.color, lang: d.lang }; d = Object.assign(blank(), keep); buildForm(); refresh(); } }, { cls: 'danger', icon: 'rotate-ccw' }));

    var previewColHeader = UI.el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' } },
      UI.el('span', { class: 'lbl' }, tr('লাইভ প্রিভিউ (A4)', "Live preview (A4)")),
      cvScoreBadge
    );

    root.appendChild(UI.el('div', { class: 'stack' },
      UI.el('div', { class: 'stack' }, UI.el('span', { class: 'lbl' }, gallery ? tr('পছন্দের টেমপ্লেট বেছে নিন', "Choose your preferred template") : tr('টেমপ্লেট', "Template")), tplBox),
      UI.el('div', { class: 'row' }, UI.el('div', { class: 'field fit' }, UI.el('span', { class: 'lbl' }, tr('রং', "Colour")), colorRow), UI.el('div', { class: 'field fit' }, UI.el('span', { class: 'lbl' }, tr('সেকশনের শিরোনামের ভাষা', "Language of section headings")), langSel)),
      UI.el('div', { class: 'rb' }, form, UI.el('div', { class: 'preview-col stack' }, previewColHeader, frame, actions,
        UI.notice('info', tr('"পিডিএফ ডাউনলোড" চাপলে প্রিন্ট উইন্ডো খুলবে। সেখানে প্রিন্টার হিসেবে "Save as PDF" বেছে নিন এবং মার্জিন "None/কোনোটি নয়" রাখুন।', '"Download PDF" opens the print window. Choose "Save as PDF" as the printer and set margins to "None".'))))));
    refresh();
    setTimeout(function () { fit(); drawTpl(); }, 80);
  }

    T['resume-builder'] = function (root) { build(root, 'professional', false); };
  T['cv-templates'] = function (root) { build(root, 'classic', true); };
})();
