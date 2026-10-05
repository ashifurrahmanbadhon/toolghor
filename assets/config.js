/* ===========================================================
   সাইটের সেটিংস — নাম, লোগো ও যোগাযোগের তথ্য এখানে বদলান।
   (নাম/লোগো ঠিক হলে শুধু এই ফাইলটি এডিট করলেই চলবে।)
   =========================================================== */
var SITE_CONFIG = {
  // ওয়েবসাইটের নাম (হোমপেজে বড় করে দেখানো হবে)
  name: 'ToolGhor',
  nameEn: 'ToolGhor',
  // নামের শেষের অংশ যেটি নীল রঙে দেখাবে (লোগোর মতো)। না চাইলে খালি রাখুন।
  nameAccent: '',
  tagline: 'দৈনন্দিন কাজের সব টুল, এখন এক প্ল্যাটফর্মে',
  taglineEn: 'Everyday tools, now on one platform',

  // লোগো ফাইল: পুরো লোগো (হোমপেজে) ও শুধু আইকন (ওপরের বারে)। বদলাতে assets ফোল্ডারের ফাইল বদলান।
  logo: 'assets/logo.png',
  logoDark: 'assets/logo-dark.png',
  logoWebp: 'assets/logo.webp',
  logoDarkWebp: 'assets/logo-dark.webp',
  logoIcon: 'assets/logo-icon.png',

  // ওয়েবসাইটের ঠিকানা (সাইটম্যাপ ও SEO-র জন্য), যেমন https://yourdomain.com
  url: 'https://example.com',

  // ফেসবুক
  facebook: {
    name: 'Facebook',
    nameBn: 'ফেসবুক',
    url: 'https://www.facebook.com/ashifurrahmanbadhon'
  },

  // লিঙ্কডইন
  linkedin: {
    name: 'LinkedIn',
    nameBn: 'লিঙ্কডইন',
    url: 'https://www.linkedin.com/in/ashifurrahmanbadhon'
  },

  // হোয়াটসঅ্যাপ — নম্বর পেজে দেখানো হয় না; বোতামে চাপলে সরাসরি চ্যাট খোলে।
  // দেশ কোডসহ নম্বর, শুধু সংখ্যা।
  whatsapp: {
    number: '8801521417284',
    text: 'হ্যালো, আপনার ওয়েবসাইট দেখে যোগাযোগ করছি।',
    textEn: 'Hello, I am contacting you from your website.'
  },

  // এআই API কী (ঐচ্ছিক — ইউজাররা পেজ থেকেও তাদের নিজস্ব কি সেট করতে পারবেন)
  apis: {
    // remove.bg API Key (ব্যাকগ্রাউন্ড রিমুভ টুলে ব্যাকএন্ডে স্বয়ংক্রিয়ভাবে ব্যবহারের জন্য: https://www.remove.bg/api)
    removeBgKey: '',
    // Google Gemini API Key (বিশাল ফ্রি কোটা: https://aistudio.google.com/app/apikey)
    geminiKey: '',
    // OpenAI API Key (https://platform.openai.com/api-keys)
    openaiKey: ''
  }
};
if (typeof window !== 'undefined') window.SITE_CONFIG = SITE_CONFIG;
if (typeof module !== 'undefined') module.exports = SITE_CONFIG;
