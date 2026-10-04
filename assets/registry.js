/* ক্যাটাগরি ও টুলের তালিকা। নতুন টুল যোগ করতে এখানে একটি এন্ট্রি দিন। */
var REGISTRY = {
  categories: [
    { id: 'documents', bn: 'ডকুমেন্ট টুলস', en: 'Document Tools', icon: 'file-text', symbol: '📄', color: 'doc', desc: 'পিডিএফ জোড়া, ভাগ, ছোট করা ও ছবিতে রূপান্তর' },
    { id: 'images', bn: 'ইমেজ টুলস', en: 'Image Tools', icon: 'image', symbol: '🖼️', color: 'img', desc: 'ছবি ছোট, বড়, কাটা, জোড়া ও ফরম্যাট বদল' },
    { id: 'calculators', bn: 'ক্যালকুলেটর', en: 'Calculators', icon: 'scale', symbol: '🧮', color: 'calc', desc: 'কারেন্সি, বিএমআই, ইউনিট, শতকরা, বয়স ও টাইম জোন' },
    { id: 'qr', bn: 'কিউআর কোড টুলস', en: 'QR Code Tools', icon: 'qr-code', symbol: '🏁', color: 'qr', desc: 'কিউআর কোড বানান ও পড়ুন' },
    { id: 'media', bn: 'ভিডিও ও অডিও টুলস', en: 'Video & Audio Tools', icon: 'video', symbol: '🎬', color: 'media', desc: 'ভিডিও থেকে অডিও এবং রিলস/শর্টসের জন্য ভিডিও ক্রপ' },
    { id: 'resume', bn: 'রেজিউমে বিল্ডার', en: 'Resume Builder', icon: 'briefcase', symbol: '💼', color: 'resume', desc: 'চাকরির আবেদনের জন্য সিভি বানান' }
  ],
  tools: [
    {
      slug: 'merge-pdf', bn: 'পিডিএফ মার্জ', en: 'Merge PDF', icon: 'merge', cats: ['documents'], group: 'pdf', needs: ['pdf-lib'],
      desc: 'একাধিক পিডিএফ এক ফাইলে জুড়ুন',
      keywords: 'merge pdf combine join pdf jora lagano pdf ek kora পিডিএফ জোড়া একত্র মার্জ',
      intro: 'কয়েকটি পিডিএফ ফাইল পছন্দমতো ক্রমে সাজিয়ে একটি পিডিএফ বানান।',
      steps: ['"পিডিএফ ফাইল বেছে নিন" চাপুন, অথবা ফাইল টেনে এনে ছাড়ুন।', 'উপর-নিচ তীর চেপে ফাইলের ক্রম ঠিক করুন।', '"মার্জ করুন" চাপুন, তারপর ফাইল ডাউনলোড করুন।']
    },
    {
      slug: 'split-pdf', bn: 'পিডিএফ স্প্লিট', en: 'Split PDF', icon: 'split', cats: ['documents'], group: 'pdf', needs: ['pdf-lib', 'jszip'],
      desc: 'পিডিএফ থেকে নির্দিষ্ট পৃষ্ঠা আলাদা করুন',
      keywords: 'split pdf separate pages extract pdf alada kora page ভাগ পৃষ্ঠা আলাদা',
      intro: 'বড় পিডিএফ থেকে দরকারি পৃষ্ঠাগুলো আলাদা ফাইলে নিন।',
      steps: ['একটি পিডিএফ ফাইল বেছে নিন।', 'পৃষ্ঠার রেঞ্জ লিখুন (যেমন 1-3, 5, 8-10) অথবা প্রতিটি পৃষ্ঠা আলাদা ফাইলে নিন।', '"স্প্লিট করুন" চাপুন এবং ডাউনলোড করুন।']
    },
    {
      slug: 'compress-pdf', bn: 'পিডিএফ কমপ্রেস', en: 'Compress PDF', icon: 'file-down', cats: ['documents'], group: 'pdf', needs: ['pdf-lib', 'pdfjs'],
      desc: 'পিডিএফের সাইজ ছোট করুন',
      keywords: 'compress pdf reduce pdf size pdf choto korun pdf size komano সাইজ কমানো পিডিএফ ছোট',
      intro: 'ইমেইল বা অনলাইন ফর্মে আপলোডের জন্য পিডিএফের সাইজ কমান। স্ক্যান করা বা ছবিভরা পিডিএফে সবচেয়ে ভালো কাজ করে।',
      steps: ['পিডিএফ ফাইল বেছে নিন।', 'কতটা ছোট করতে চান তা বেছে নিন।', '"কমপ্রেস করুন" চাপুন, আগে-পরের সাইজ দেখে ডাউনলোড করুন।']
    },
    {
      slug: 'pdf-to-image', bn: 'পিডিএফ থেকে ছবি', en: 'PDF to Image', icon: 'file-image', cats: ['documents'], group: 'pdf', needs: ['pdfjs', 'jszip'],
      desc: 'পিডিএফের প্রতিটি পৃষ্ঠা ছবি (PNG/JPG) করুন',
      keywords: 'pdf to image pdf to png pdf to jpg pdf theke chobi ছবি পিডিএফ থেকে ইমেজ পিডিএফ জেপিজি',
      intro: 'পিডিএফের পৃষ্ঠাগুলোকে PNG বা JPG ছবিতে রূপান্তর করুন।',
      steps: ['পিডিএফ ফাইল বেছে নিন।', 'ছবির ফরম্যাট ও মান বেছে নিন।', '"ছবি বানান" চাপুন, তারপর একটি একটি করে বা ZIP আকারে ডাউনলোড করুন।']
    },
    {
      slug: 'jpg-to-pdf', bn: 'ছবি থেকে পিডিএফ', en: 'JPG to PDF', icon: 'file-stack', cats: ['images'], group: 'pdf', needs: ['pdf-lib'],
      desc: 'JPG, PNG ছবি জুড়ে একটি পিডিএফ বানান',
      keywords: 'jpg to pdf image to pdf png to pdf photo to pdf chobi theke pdf ছবি থেকে পিডিএফ',
      intro: 'এক বা একাধিক ছবি দিয়ে একটি পিডিএফ ফাইল বানান। ডকুমেন্টের ছবি তুলে জমা দেওয়ার জন্য কাজের।',
      steps: ['ছবি বেছে নিন (একাধিক হলেও চলবে)।', 'ক্রম, পেজ সাইজ ও মার্জিন ঠিক করুন।', '"পিডিএফ বানান" চাপুন এবং ডাউনলোড করুন।']
    },
    {
      slug: 'compress-image', bn: 'ছবি কমপ্রেস', en: 'Compress Image', icon: 'minimize-2', cats: ['images'], group: 'image', needs: ['jszip'],
      desc: 'ছবির সাইজ (KB/MB) কমান, চাইলে নির্দিষ্ট KB-তে আনুন',
      keywords: 'compress image reduce image size photo size kb koman chobi choto korun ছবির সাইজ কমানো কেবি',
      intro: 'ছবির মান ঠিক রেখে সাইজ কমান। আবেদনের ফর্মে "১০০ KB-এর মধ্যে ছবি" লাগলে টার্গেট সাইজ দিন।',
      steps: ['এক বা একাধিক ছবি বেছে নিন।', 'মান বাছুন, অথবা টার্গেট সাইজ (KB) লিখুন।', '"কমপ্রেস করুন" চাপুন এবং ডাউনলোড করুন।']
    },
    {
      slug: 'resize-image', bn: 'ছবির সাইজ পরিবর্তন', en: 'Resize Image', icon: 'scaling', cats: ['images'], group: 'image', needs: [],
      desc: 'ছবির প্রস্থ-উচ্চতা (পিক্সেল) বদলান',
      keywords: 'resize image change image size width height pixel ছবি ছোট বড় মাপ',
      intro: 'ছবির মাপ পিক্সেলে বা শতকরায় বদলান। পাসপোর্ট ছবি ও স্বাক্ষরের জন্য রেডিমেড মাপ আছে।',
      steps: ['একটি ছবি বেছে নিন।', 'নতুন মাপ লিখুন বা তৈরি মাপ বেছে নিন।', '"মাপ বদলান" চাপুন এবং ডাউনলোড করুন।']
    },
    {
      slug: 'crop-image', bn: 'ছবি ক্রপ', en: 'Crop Image', icon: 'crop', cats: ['images'], group: 'image', needs: [],
      desc: 'ছবির অপ্রয়োজনীয় অংশ কেটে ফেলুন',
      keywords: 'crop image cut photo chobi kata কাটা ক্রপ',
      intro: 'ছবির দরকারি অংশ বেছে নিয়ে বাকিটা কেটে ফেলুন। ১:১, ৪:৩, ১৬:৯, পাসপোর্ট অনুপাত ইত্যাদি আছে।',
      steps: ['একটি ছবি বেছে নিন।', 'বাক্স টেনে বা কোণা ধরে কাটার অংশ ঠিক করুন।', '"ক্রপ করুন" চাপুন এবং ডাউনলোড করুন।']
    },
    {
      slug: 'merge-image', bn: 'ছবি মার্জ', en: 'Merge Image', icon: 'layers', cats: ['images'], group: 'image', needs: [],
      desc: 'কয়েকটি ছবি জুড়ে একটি ছবি বানান',
      keywords: 'merge image combine images join photos stitch chobi jora ছবি জোড়া মার্জ',
      intro: 'একাধিক ছবি পাশাপাশি, উপর-নিচ বা গ্রিডে সাজিয়ে একটি ছবি বানান।',
      steps: ['দুই বা তার বেশি ছবি বেছে নিন।', 'সাজানোর ধরন, ফাঁক ও ব্যাকগ্রাউন্ড রং ঠিক করুন।', '"ছবি জুড়ুন" চাপুন এবং ডাউনলোড করুন।']
    },
    {
      slug: 'convert-image', bn: 'ছবির ফরম্যাট পরিবর্তন', en: 'Convert Image', icon: 'repeat', cats: ['images'], group: 'image', needs: ['jszip'],
      desc: 'JPG, PNG, WebP-এর মধ্যে রূপান্তর করুন',
      keywords: 'convert image jpg to png png to jpg webp format format change ছবির ফরম্যাট রূপান্তর',
      intro: 'ছবি JPG, PNG বা WebP ফরম্যাটে রূপান্তর করুন।',
      steps: ['এক বা একাধিক ছবি বেছে নিন।', 'কোন ফরম্যাটে চান তা বাছুন।', '"রূপান্তর করুন" চাপুন এবং ডাউনলোড করুন।']
    },
    {
      slug: 'passport-photo', bn: 'পাসপোর্ট সাইজ ফটো', en: 'Passport Size Photo', icon: 'id-card', cats: ['images'], group: 'image', needs: [],
      desc: 'স্ট্যান্ডার্ড পাসপোর্ট সাইজ (৩৫×৪৫ মিমি / ৪১৩×৫৩১ px) ছবি বানান',
      keywords: 'passport size photo passport chobi passport photo maker bd passport 35x45 300x300 পাসপোর্ট সাইজ ছবি সরকারি পাসপোর্ট',
      intro: 'সরকারি ও আন্তর্জাতিক স্ট্যান্ডার্ড ফিক্সড পাসপোর্ট সাইজের (৩৫×৪৫ মিমি / ৪১৩×৫৩১ px) ছবি তৈরি করুন। ব্যাকগ্রাউন্ড কালার বদলানো ও ফ্রেম মেলানোর সুবিধা রয়েছে।',
      steps: ['একটি ছবি বেছে নিন।', 'পাসপোর্ট ফ্রেমে মুখ ঠিকমতো বসিয়ে সাজান।', 'প্রয়োজনে ব্যাকগ্রাউন্ড রং (সাদা/নীল) বেছে নিন।', '"পাসপোর্ট ছবি বানান" চাপুন এবং ডাউনলোড করুন।']
    },
    {
      slug: 'remove-background', bn: 'ব্যাকগ্রাউন্ড রিমুভ', en: 'Remove Background', icon: 'eraser', cats: ['images'], group: 'image', needs: [],
      desc: 'ছবির ব্যাকগ্রাউন্ড মুছে স্বচ্ছ বা পছন্দের রঙের করুন',
      keywords: 'remove background bg remove transparent png background changer ছবির ব্যাকগ্রাউন্ড পরিবর্তন স্বচ্ছ কাটআউট',
      intro: 'ছবির ব্যাকগ্রাউন্ড সহজেই এক ক্লিকে মুছে স্বচ্ছ (Transparent PNG) করুন বা নতুন রঙের ব্যাকগ্রাউন্ড যুক্ত করুন। ব্রাউজারেই সরাসরি প্রসেস হয়।',
      steps: ['একটি ছবি বেছে নিন।', 'স্বচ্ছতা বা রঙের ব্যাকগ্রাউন্ড নির্বাচন করুন।', 'প্রয়োজনে সেনসিটিভিটি বা ইরেজার ব্রাশ দিয়ে নিখুঁত করুন।', '"ডাউনলোড করুন" চাপুন।']
    },
    {
      slug: 'currency-converter', bn: 'লাইভ কারেন্সি কনভার্টার', en: 'Live Currency Converter', icon: 'coins', cats: ['calculators'], group: 'calc', needs: [],
      desc: 'ডলার, রিয়াল, ইউরো, পাউন্ডসহ সব দেশের টাকার প্রতিদিনের লাইভ রেট',
      keywords: 'currency converter taka dollar rate live currency rate live exchange rate bdt to usd usd to bdt riyal dirham euro pound মুদ্রা বিনিময় টাকা ডলার রিয়াল রেট প্রবাসীদের রেট হুন্ডি বাদ ব্যাংক রেট',
      intro: 'প্রতিদিনের লাইভ এক্সচেঞ্জ রেট অনুযায়ী মার্কিন ডলার, সৌদি রিয়াল, ইউএই দিরহাম, ইউরো, পাউন্ডসহ বিশ্বের যেকোনো মুদ্রাকে টাকায় ও পরস্পরে রূপান্তর করুন।',
      steps: ['টাকার পরিমাণ লিখুন।', 'কোন মুদ্রা থেকে কোন মুদ্রায় রূপান্তর করবেন তা নির্বাচন করুন।', 'তাৎক্ষণিক লাইভ এক্সচেঞ্জ রেট ও ফলাফল দেখুন।']
    },
    {
      slug: 'bmi-calculator', bn: 'বিএমআই ক্যালকুলেটর', en: 'BMI Calculator', icon: 'scale', cats: ['calculators'], group: 'calc', needs: [],
      desc: 'ওজন ও উচ্চতা থেকে বডি মাস ইনডেক্স জানুন',
      keywords: 'bmi calculator weight height body mass index ওজন উচ্চতা স্বাস্থ্য',
      intro: 'ওজন ও উচ্চতা দিলেই আপনার বিএমআই এবং সুস্থ ওজনের পরিসীমা দেখুন।',
      steps: ['ওজন লিখুন (কেজি বা পাউন্ড)।', 'উচ্চতা লিখুন (সেমি বা ফুট-ইঞ্চি)।', 'ফলাফল সঙ্গে সঙ্গে নিচে দেখুন।']
    },
    {
      slug: 'unit-converter', bn: 'ইউনিট কনভার্টার', en: 'Unit Converter', icon: 'ruler', cats: ['calculators'], group: 'calc', needs: [],
      desc: 'দৈর্ঘ্য, ওজন, জমি (কাঠা, বিঘা, শতাংশ), ভরি, মণসহ',
      keywords: 'unit converter length weight area katha bigha decimal bhori vori maan কাঠা বিঘা শতাংশ ভরি মণ সের জমি',
      intro: 'বাংলাদেশে প্রচলিত কাঠা, বিঘা, শতাংশ, ভরি, মণ, সের এবং আন্তর্জাতিক ইউনিট বদলান।',
      steps: ['ইউনিটের ধরন বেছে নিন (যেমন জমি বা ওজন)।', 'সংখ্যা লিখুন এবং কোন ইউনিট থেকে কোন ইউনিটে যাবেন তা বাছুন।', 'ফলাফল ও সব ইউনিটের তালিকা নিচে দেখুন।']
    },
    {
      slug: 'percentage-calculator', bn: 'শতকরা হিসাব', en: 'Percentage Calculator', icon: 'percent', cats: ['calculators'], group: 'calc', needs: [],
      desc: 'শতকরা, ছাড়, বৃদ্ধি-হ্রাসের হিসাব',
      keywords: 'percentage calculator percent sotokora শতকরা হিসাব ছাড় discount',
      intro: 'শতকরা বের করা, ছাড়ের পর দাম, বৃদ্ধি বা হ্রাসের হার, সবই এক জায়গায়।',
      steps: ['যে ধরনের হিসাব দরকার সেই বক্সে সংখ্যা লিখুন।', 'ফলাফল সঙ্গে সঙ্গে দেখা যাবে।']
    },
    {
      slug: 'age-calculator', bn: 'বয়স ক্যালকুলেটর', en: 'Age Calculator', icon: 'cake', cats: ['calculators'], group: 'calc', needs: [],
      desc: 'জন্ম তারিখ থেকে বছর-মাস-দিনে বয়স',
      keywords: 'age calculator date of birth boyos bayosh বয়স জন্ম তারিখ জন্মদিন',
      intro: 'জন্ম তারিখ দিয়ে বছর, মাস ও দিনে সঠিক বয়স এবং পরের জন্মদিনের হিসাব জানুন।',
      steps: ['জন্ম তারিখ বেছে নিন।', 'চাইলে "যে তারিখ পর্যন্ত" বদলান (ডিফল্ট আজ)।', 'বয়স ও পরের জন্মদিন নিচে দেখুন।']
    },
    {
      slug: 'time-zone-converter', bn: 'টাইম জোন কনভার্টার', en: 'Time Zone Converter', icon: 'globe', cats: ['calculators'], group: 'calc', needs: [],
      desc: 'ঢাকার সময় থেকে সৌদি, দুবাই, মালয়েশিয়া, লন্ডন, নিউইয়র্ক',
      keywords: 'time zone converter world clock saudi dubai malaysia time somoy সময় টাইম জোন প্রবাসী',
      intro: 'প্রবাসী স্বজনদের সঙ্গে কথা বলার সময় ঠিক করতে বিভিন্ন দেশের সময় মিলিয়ে দেখুন।',
      steps: ['কোন শহরের সময় থেকে শুরু করবেন তা বাছুন এবং তারিখ-সময় দিন।', 'যেসব শহরের সময় দেখতে চান সেগুলো যোগ করুন।', 'প্রতিটি শহরের সময় ও তারিখ নিচে দেখুন।']
    },
    {
      slug: 'qr-generator', bn: 'কিউআর কোড জেনারেটর', en: 'QR Code Generator', icon: 'qr-code', cats: ['qr'], group: 'qr', needs: ['qrcode'],
      desc: 'লিংক, ওয়াই-ফাই, হোয়াটসঅ্যাপের কিউআর কোড',
      keywords: 'qr code generator qr banano wifi whatsapp link কিউআর কোড বানান',
      intro: 'লিংক, লেখা, ওয়াই-ফাই, হোয়াটসঅ্যাপ নম্বর বা ইমেইলের জন্য কিউআর কোড বানান।',
      steps: ['কিউআর কোডের ধরন বেছে নিন।', 'তথ্য লিখুন, কোড সঙ্গে সঙ্গে তৈরি হবে।', 'PNG বা SVG হিসেবে ডাউনলোড করুন।']
    },
    {
      slug: 'qr-decoder', bn: 'কিউআর কোড রিডার', en: 'QR Code Decoder', icon: 'scan-qr-code', cats: ['qr'], group: 'qr', needs: ['jsqr'],
      desc: 'ছবি বা ক্যামেরা থেকে কিউআর কোড পড়ুন',
      keywords: 'qr code scanner reader decoder qr scan কিউআর স্ক্যান পড়া',
      intro: 'কিউআর কোডের ছবি আপলোড করুন বা ক্যামেরা দিয়ে স্ক্যান করুন, ভেতরের লেখা বা লিংক দেখুন।',
      steps: ['কিউআর কোডের ছবি বেছে নিন (বা ছবি পেস্ট করুন), অথবা ক্যামেরা চালু করুন।', 'কোডের ভেতরের লেখা নিচে দেখা যাবে।', 'কপি করুন বা লিংক খুলুন।']
    },
    {
      slug: 'audio-extractor', bn: 'ভিডিও থেকে অডিও', en: 'Audio Extractor', icon: 'audio-lines', cats: ['media'], group: 'media', needs: [],
      desc: 'ভিডিও থেকে MP3, M4A বা WAV অডিও আলাদা করুন',
      keywords: 'extract audio from video mp3 video to mp3 audio nibo ভিডিও থেকে গান অডিও এমপিথ্রি',
      intro: 'যেকোনো ভিডিও ফাইল থেকে শুধু শব্দ আলাদা করে MP3, M4A বা WAV হিসেবে নামান।',
      steps: ['ভিডিও ফাইল বেছে নিন।', 'অডিও ফরম্যাট ও মান বাছুন।', '"অডিও আলাদা করুন" চাপুন এবং ডাউনলোড করুন।']
    },
    {
      slug: 'social-video-cropper', bn: 'সোশ্যাল মিডিয়া ভিডিও ক্রপার', en: 'Social Media Video Cropper', icon: 'smartphone', cats: ['media'], group: 'media', needs: [],
      desc: 'রিলস, শর্টস, ইনস্টাগ্রামের মাপে ভিডিও কাটুন',
      keywords: 'video crop reels tiktok shorts instagram facebook 9:16 1:1 video kata ভিডিও ক্রপ রিলস',
      intro: 'ভিডিও ৯:১৬ (রিলস/শর্টস), ১:১, ৪:৫ বা ১৬:৯ মাপে কেটে নিন।',
      steps: ['ভিডিও বেছে নিন।', 'কোন প্ল্যাটফর্মের মাপ চান তা বাছুন এবং কাটার অবস্থান ঠিক করুন।', '"ভিডিও বানান" চাপুন এবং ডাউনলোড করুন।']
    },
    {
      slug: 'resume-builder', bn: 'প্রফেশনাল রেজিউমে', en: 'Professional Resume', icon: 'briefcase', cats: ['resume'], group: 'resume', needs: [],
      desc: 'ফর্ম পূরণ করে পরিষ্কার রেজিউমে বানিয়ে পিডিএফ নিন',
      keywords: 'resume builder cv maker biodata job cv bio data সিভি রেজিউমে জীবনবৃত্তান্ত চাকরি',
      intro: 'তথ্য লিখুন, পাশেই রেজিউমের প্রিভিউ দেখুন, তারপর পিডিএফ করে নিন।',
      steps: ['বাঁ দিকের ফর্মে আপনার তথ্য লিখুন।', 'টেমপ্লেট ও রং বেছে নিন।', '"পিডিএফ ডাউনলোড" চাপুন, প্রিন্ট উইন্ডোতে "Save as PDF" বেছে নিন।']
    },
    {
      slug: 'cv-templates', bn: 'সিভি টেমপ্লেট', en: 'CV Templates', icon: 'layout-template', cats: ['resume'], group: 'resume', needs: [],
      desc: 'বাংলাদেশি সিভিসহ ৪টি টেমপ্লেট থেকে বেছে নিন',
      keywords: 'cv template biodata template bd cv format সিভি টেমপ্লেট বায়োডাটা',
      intro: 'ছবিসহ বাংলাদেশি স্টাইল, সাইডবার, মিনিমালসহ কয়েকটি টেমপ্লেট দেখে পছন্দেরটি বেছে নিন।',
      steps: ['পছন্দের টেমপ্লেট বেছে নিন।', 'নিজের তথ্য লিখুন।', '"পিডিএফ ডাউনলোড" চাপুন।']
    }
  ]
};
/* ---------- English text ---------- */
var CAT_EN = {
  documents: 'Merge, split, compress PDFs and convert them to images',
  images: 'Compress, resize, crop, merge and convert images',
  calculators: 'BMI, units, percentage, age and time zones',
  qr: 'Create and read QR codes',
  media: 'Extract audio from video and crop video for Reels/Shorts',
  resume: 'Build a CV for job applications'
};
REGISTRY.categories.forEach(function (c) { c.descEn = CAT_EN[c.id]; });
var TOOL_EN = {
  'merge-pdf': { desc: 'Combine several PDF files into one', intro: 'Arrange a few PDF files in the order you like and join them into a single PDF.', steps: ['Press "Choose PDF files", or drag and drop your files.', 'Use the up/down arrows to set the order.', 'Press "Merge", then download the file.'] },
  'split-pdf': { desc: 'Extract specific pages from a PDF', intro: 'Pull the pages you need out of a big PDF into a separate file.', steps: ['Choose a PDF file.', 'Type a page range (for example 1-3, 5, 8-10), or split every page into its own file.', 'Press "Split" and download.'] },
  'compress-pdf': { desc: 'Make a PDF file smaller', intro: 'Reduce a PDF so it is easier to email or upload to online forms. Works best on scanned or image-heavy PDFs.', steps: ['Choose a PDF file.', 'Pick how much to shrink it.', 'Press "Compress", compare the before and after size, then download.'] },
  'pdf-to-image': { desc: 'Turn every PDF page into an image (PNG/JPG)', intro: 'Convert the pages of a PDF into PNG or JPG images.', steps: ['Choose a PDF file.', 'Pick the image format and quality.', 'Press "Create images", then download them one by one or as a ZIP.'] },
  'pdf-to-jpg': { desc: 'Turn every PDF page into a JPG image', intro: 'Convert the pages of a PDF into JPG images.', steps: ['Choose a PDF file.', 'Pick the image quality.', 'Press "Create JPG" and download.'] },
  'jpg-to-pdf': { desc: 'Combine JPG or PNG images into a PDF', intro: 'Make a PDF from one or more images. Handy when you photograph documents and need to submit them.', steps: ['Choose your images (several are fine).', 'Set the order, page size and margin.', 'Press "Create PDF" and download.'] },
  'compress-image': { desc: 'Reduce image size (KB/MB), or hit an exact KB target', intro: 'Make an image smaller while keeping it looking good. If a form asks for a photo under 100 KB, enter the target size.', steps: ['Choose one or more images.', 'Pick the quality, or type a target size in KB.', 'Press "Compress" and download.'] },
  'resize-image': { desc: 'Change image width and height (pixels)', intro: 'Change an image size in pixels or percent. Ready-made sizes for passport photos and signatures are included.', steps: ['Choose an image.', 'Type the new size or pick a ready-made one.', 'Press "Resize" and download.'] },
  'crop-image': { desc: 'Cut away the parts of an image you do not need', intro: 'Select the part of the image you want and cut off the rest. Ratios like 1:1, 4:3, 16:9 and passport are included.', steps: ['Choose an image.', 'Drag the box or its corners to set the crop area.', 'Press "Crop" and download.'] },
  'merge-image': { desc: 'Join several images into one picture', intro: 'Arrange multiple images side by side, top to bottom, or in a grid to make one image.', steps: ['Choose two or more images.', 'Set the layout, gap and background colour.', 'Press "Join images" and download.'] },
  'convert-image': { desc: 'Convert between JPG, PNG and WebP', intro: 'Convert images to JPG, PNG or WebP format.', steps: ['Choose one or more images.', 'Pick the format you want.', 'Press "Convert" and download.'] },
  'passport-photo': { desc: 'Create standard passport size photo with fixed dimensions', intro: 'Create an official standard passport size photo with strictly fixed dimensions (35×45 mm / 413×531 px). Adjust and center your face in the passport frame with white or blue background options.', steps: ['Choose a photo.', 'Position and center your face in the passport frame.', 'Select background color (white, blue, or original).', 'Press "Create Passport Photo" and download.'] },
  'remove-background': { desc: 'Remove image background and make it transparent or colored', intro: 'Erase image background with one click and get a clean transparent PNG or replace it with a solid color. Processed 100% locally in your browser.', steps: ['Choose an image.', 'Select transparent or a background color.', 'Fine-tune sensitivity or touch up with the eraser brush.', 'Download your cutout image.'] },
  'bmi-calculator': { desc: 'Find your body mass index from weight and height', intro: 'Enter your weight and height to see your BMI and the healthy weight range for your height.', steps: ['Enter your weight (kg or pounds).', 'Enter your height (cm or feet-inches).', 'See the result right away below.'] },
  'unit-converter': { desc: 'Length, weight, land (katha, bigha, decimal), bhori, maund and more', intro: 'Convert Bangladeshi units such as katha, bigha, decimal, bhori, maund and seer, along with international units.', steps: ['Pick a type of unit (for example land or weight).', 'Enter a number and choose the units to convert from and to.', 'See the result and the full list of units below.'] },
  'percentage-calculator': { desc: 'Percentages, discounts, increase and decrease', intro: 'Work out percentages, the price after a discount, and the rate of increase or decrease, all in one place.', steps: ['Type numbers into the box for the calculation you need.', 'The result appears instantly.'] },
  'age-calculator': { desc: 'Exact age in years, months and days from a date of birth', intro: 'Enter a date of birth to get an exact age in years, months and days, plus a countdown to the next birthday.', steps: ['Pick the date of birth.', 'Optionally change the "as of" date (default is today).', 'See the age and next birthday below.'] },
  'time-zone-converter': { desc: 'Dhaka time to Saudi, Dubai, Malaysia, London, New York', intro: 'Compare times across countries to find a good time to talk with family and friends abroad.', steps: ['Pick the city you are starting from and enter a date and time.', 'Add the cities whose time you want to see.', 'See each city\'s time and date below.'] },
  'qr-generator': { desc: 'QR codes for links, Wi-Fi and WhatsApp', intro: 'Create a QR code for a link, text, Wi-Fi, WhatsApp number or email.', steps: ['Choose the type of QR code.', 'Enter the details and the code appears instantly.', 'Download it as PNG or SVG.'] },
  'qr-decoder': { desc: 'Read a QR code from an image or the camera', intro: 'Upload a picture of a QR code or scan it with your camera to see the text or link inside.', steps: ['Choose a QR image (or paste one), or turn on the camera.', 'The text inside the code appears below.', 'Copy it or open the link.'] },
  'audio-extractor': { desc: 'Pull MP3, M4A or WAV audio out of a video', intro: 'Take just the sound from any video file and save it as MP3, M4A or WAV.', steps: ['Choose a video file.', 'Pick the audio format and quality.', 'Press "Extract audio" and download.'] },
  'social-video-cropper': { desc: 'Crop video to Reels, Shorts and Instagram sizes', intro: 'Crop a video to 9:16 (Reels/Shorts), 1:1, 4:5 or 16:9.', steps: ['Choose a video.', 'Pick the platform size and set the crop position.', 'Press "Create video" and download.'] },
  'resume-builder': { desc: 'Fill a form, get a clean resume and save it as PDF', intro: 'Enter your details, watch the resume preview next to the form, then save it as a PDF.', steps: ['Fill in your details in the form.', 'Pick a template and colour.', 'Press "Download PDF" and choose "Save as PDF" in the print window.'] },
  'cv-templates': { desc: 'Choose from 4 templates, including a Bangladeshi-style CV', intro: 'Look through templates, including a Bangladeshi-style CV with photo, a sidebar layout and a minimal one, and pick your favourite.', steps: ['Pick a template.', 'Enter your details.', 'Press "Download PDF".'] }
};
REGISTRY.tools.forEach(function (t) { var e = TOOL_EN[t.slug]; t.descEn = e.desc; t.introEn = e.intro; t.stepsEn = e.steps; });
REGISTRY.bySlug = {};
REGISTRY.tools.forEach(function (t) { REGISTRY.bySlug[t.slug] = t; });
if (typeof window !== 'undefined') window.REGISTRY = REGISTRY;
if (typeof module !== 'undefined') module.exports = REGISTRY;
