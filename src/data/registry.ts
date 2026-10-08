export interface Category {
  id: string;
  bn: string;
  en: string;
  icon: string;
  symbol: string;
  color: string;
  desc: string;
  descEn: string;
}

export interface ToolItem {
  slug: string;
  bn: string;
  en: string;
  icon: string;
  cats: string[];
  group: 'pdf' | 'image' | 'calc' | 'qr' | 'media' | 'resume';
  needs?: string[];
  desc: string;
  descEn: string;
  intro: string;
  introEn: string;
  steps: string[];
  stepsEn: string[];
  keywords: string;
  badge?: string;
}

export const CATEGORIES: Category[] = [
  {
    id: 'documents',
    bn: 'ডকুমেন্ট টুলস',
    en: 'Document Tools',
    icon: 'FileText',
    symbol: '📄',
    color: 'emerald',
    desc: 'পিডিএফ জোড়া, ভাগ, ছোট করা, ছবিতে ও ওয়ার্ডে (DOCX) রূপান্তর',
    descEn: 'Merge, split, compress PDFs, convert to images and Word (DOCX)'
  },
  {
    id: 'images',
    bn: 'ইমেজ টুলস',
    en: 'Image Tools',
    icon: 'ImageIcon',
    symbol: '🖼️',
    color: 'blue',
    desc: 'ছবি ছোট, বড়, কাটা, জোড়া ও ফরম্যাট বদল',
    descEn: 'Compress, resize, crop, merge and convert images'
  },
  {
    id: 'calculators',
    bn: 'ক্যালকুলেটর',
    en: 'Calculators',
    icon: 'Calculator',
    symbol: '🧮',
    color: 'amber',
    desc: 'কারেন্সি, বিএমআই, ইউনিট, শতকরা, বয়স ও টাইম জোন',
    descEn: 'BMI, units, percentage, age and time zones'
  },
  {
    id: 'qr',
    bn: 'কিউআর কোড টুলস',
    en: 'QR Code Tools',
    icon: 'QrCode',
    symbol: '🏁',
    color: 'purple',
    desc: 'কিউআর কোড বানান ও পড়ুন',
    descEn: 'Create and read QR codes'
  },
  {
    id: 'media',
    bn: 'ভিডিও ও অডিও টুলস',
    en: 'Video & Audio Tools',
    icon: 'Video',
    symbol: '🎬',
    color: 'rose',
    desc: 'ইউটিউব ভিডিও ও অডিও ডাউনলোড, অডিও আলাদা করা ও ভিডিও ক্রপ',
    descEn: 'Download YouTube video & audio, extract audio from video, and crop video for Reels/Shorts'
  },
  {
    id: 'resume',
    bn: 'রেজিউমে বিল্ডার',
    en: 'Resume Builder',
    icon: 'Briefcase',
    symbol: '💼',
    color: 'indigo',
    desc: 'চাকরির আবেদনের জন্য সিভি বানান',
    descEn: 'Build a CV for job applications'
  }
];

export const TOOLS: ToolItem[] = [
  // --- Document Tools ---
  {
    slug: 'merge-pdf',
    bn: 'পিডিএফ মার্জ',
    en: 'Merge PDF',
    icon: 'Layers',
    cats: ['documents'],
    group: 'pdf',
    desc: 'একাধিক পিডিএফ এক ফাইলে জুড়ুন',
    descEn: 'Combine several PDF files into one',
    keywords: 'merge pdf combine join pdf jora lagano pdf ek kora পিডিএফ জোড়া একত্র মার্জ',
    intro: 'কয়েকটি পিডিএফ ফাইল পছন্দমতো ক্রমে সাজিয়ে একটি পিডিএফ বানান।',
    introEn: 'Arrange a few PDF files in the order you like and join them into a single PDF.',
    steps: ['"পিডিএফ ফাইল বেছে নিন" চাপুন, অথবা ফাইল টেনে এনে ছাড়ুন।', 'উপর-নিচ তীর চেপে ফাইলের ক্রম ঠিক করুন।', '"মার্জ করুন" চাপুন, তারপর ফাইল ডাউনলোড করুন।'],
    stepsEn: ['Press "Choose PDF files", or drag and drop your files.', 'Use the up/down arrows to set the order.', 'Press "Merge", then download the file.']
  },
  {
    slug: 'split-pdf',
    bn: 'পিডিএফ স্প্লিট',
    en: 'Split PDF',
    icon: 'Scissors',
    cats: ['documents'],
    group: 'pdf',
    desc: 'পিডিএফ থেকে নির্দিষ্ট পৃষ্ঠা আলাদা করুন',
    descEn: 'Extract specific pages from a PDF',
    keywords: 'split pdf separate pages extract pdf alada kora page ভাগ পৃষ্ঠা আলাদা',
    intro: 'বড় পিডিএফ থেকে দরকারি পৃষ্ঠাগুলো আলাদা ফাইলে নিন।',
    introEn: 'Pull the pages you need out of a big PDF into a separate file.',
    steps: ['একটি পিডিএফ ফাইল বেছে নিন।', 'পৃষ্ঠার রেঞ্জ লিখুন (যেমন 1-3, 5, 8-10) অথবা প্রতিটি পৃষ্ঠা আলাদা ফাইলে নিন।', '"স্প্লিট করুন" চাপুন এবং ডাউনলোড করুন।'],
    stepsEn: ['Choose a PDF file.', 'Type a page range (for example 1-3, 5, 8-10), or split every page into its own file.', 'Press "Split" and download.']
  },
  {
    slug: 'compress-pdf',
    bn: 'পিডিএফ কমপ্রেস',
    en: 'Compress PDF',
    icon: 'FileDown',
    cats: ['documents'],
    group: 'pdf',
    desc: 'পিডিএফের সাইজ ছোট করুন',
    descEn: 'Make a PDF file smaller',
    keywords: 'compress pdf reduce pdf size pdf choto korun pdf size komano সাইজ কমানো পিডিএফ ছোট',
    intro: 'ইমেইল বা অনলাইন ফর্মে আপলোডের জন্য পিডিএফের সাইজ কমান। স্ক্যান করা বা ছবিভরা পিডিএফে সবচেয়ে ভালো কাজ করে।',
    introEn: 'Reduce a PDF so it is easier to email or upload to online forms. Works best on scanned or image-heavy PDFs.',
    steps: ['পিডিএফ ফাইল বেছে নিন।', 'কতটা ছোট করতে চান তা বেছে নিন।', '"কমপ্রেস করুন" চাপুন, আগে-পরের সাইজ দেখে ডাউনলোড করুন।'],
    stepsEn: ['Choose a PDF file.', 'Pick how much to shrink it.', 'Press "Compress", compare the before and after size, then download.']
  },
  {
    slug: 'pdf-to-image',
    bn: 'পিডিএফ থেকে ছবি',
    en: 'PDF to Image',
    icon: 'FileImage',
    cats: ['documents'],
    group: 'pdf',
    desc: 'পিডিএফের প্রতিটি পৃষ্ঠা ছবি (PNG/JPG) করুন',
    descEn: 'Turn every PDF page into an image (PNG/JPG)',
    keywords: 'pdf to image pdf to png pdf to jpg pdf theke chobi ছবি পিডিএফ থেকে ইমেজ পিডিএফ জেপিজি',
    intro: 'পিডিএফের পৃষ্ঠাগুলোকে PNG বা JPG ছবিতে রূপান্তর করুন।',
    introEn: 'Convert the pages of a PDF into PNG or JPG images.',
    steps: ['পিডিএফ ফাইল বেছে নিন।', 'ছবির ফরম্যাট ও মান বেছে নিন।', '"ছবি বানান" চাপুন, তারপর একটি একটি করে বা ZIP আকারে ডাউনলোড করুন।'],
    stepsEn: ['Choose a PDF file.', 'Pick the image format and quality.', 'Press "Create images", then download them one by one or as a ZIP.']
  },
  {
    slug: 'pdf-to-doc',
    bn: 'পিডিএফ টু ওয়ার্ড (DOCX)',
    en: 'PDF to Word (DOCX)',
    icon: 'FileText',
    cats: ['documents'],
    group: 'pdf',
    badge: 'Popular',
    desc: 'পিডিএফ ফাইল সহজে সম্পাদনাযোগ্য Word (DOCX) ফাইলে রূপান্তর করুন',
    descEn: 'Convert PDF files into editable Word (DOCX) documents',
    keywords: 'pdf to doc pdf to docx pdf to word convert pdf to word docx file word banano pdf theke word word to pdf পিডিএফ টু ওয়ার্ড ডক ডকএক্স ওয়ার্ড রূপান্তর',
    intro: 'পিডিএফ ফাইলকে সহজে মাইক্রোসফট ওয়ার্ড (.docx) ফাইলে রূপান্তর করুন। লেখা, প্যারাগ্রাফ ও লেআউট অক্ষুণ্ণ রেখে প্রসেস হয়।',
    introEn: 'Convert PDF files to editable Microsoft Word (.docx) documents with ease. Keep text, paragraphs and formatting intact.',
    steps: ['"পিডিএফ ফাইল বেছে নিন" চাপুন বা ফাইল টেনে এনে ছাড়ুন।', 'প্রয়োজনে কনভার্সন মোড ও ফন্ট নির্বাচন করুন।', '"ওয়ার্ডে রূপান্তর করুন" চাপুন এবং DOCX ফাইল ডাউনলোড করুন।'],
    stepsEn: ['Press "Choose PDF files", or drag and drop your file.', 'Select conversion mode and font settings if desired.', 'Press "Convert to Word" and download your DOCX document.']
  },
  {
    slug: 'word-to-pdf',
    bn: 'ওয়ার্ড টু পিডিএফ',
    en: 'Word to PDF',
    icon: 'FileType',
    cats: ['documents'],
    group: 'pdf',
    desc: 'Word (DOCX, DOC) ফাইলকে সহজে উচ্চমানের পিডিএফে রূপান্তর করুন',
    descEn: 'Convert Word (DOCX, DOC) files into high quality PDF documents',
    keywords: 'word to pdf doc to pdf docx to pdf word theke pdf ওয়ার্ড থেকে পিডিএফ ডক টু পিডিএফ',
    intro: 'ওয়ার্ড ফাইল (.docx, .doc) আপলোড করে নিমিষেই নিখুঁত লেআউটসহ স্ট্যান্ডার্ড পিডিএফ ফাইল ডাউনলোড করুন।',
    introEn: 'Convert Word documents (.docx, .doc) to standard PDF files with perfect styling and layout.',
    steps: ['"ওয়ার্ড ফাইল বেছে নিন" চাপুন বা ফাইল টেনে এনে ড্রপ করুন।', '"পিডিএফে রূপান্তর করুন" চাপুন।', 'তৈরি হওয়া পিডিএফ ফাইলটি ডাউনলোড করুন।'],
    stepsEn: ['Press "Choose Word file", or drag and drop your file.', 'Press "Convert to PDF".', 'Download your converted PDF document.']
  },
  {
    slug: 'jpg-to-pdf',
    bn: 'ছবি থেকে পিডিএফ',
    en: 'JPG to PDF',
    icon: 'ImageDown',
    cats: ['images', 'documents'],
    group: 'pdf',
    desc: 'JPG, PNG ছবি জুড়ে একটি পিডিএফ বানান',
    descEn: 'Combine JPG or PNG images into a PDF',
    keywords: 'jpg to pdf image to pdf png to pdf photo to pdf chobi theke pdf ছবি থেকে পিডিএফ',
    intro: 'এক বা একাধিক ছবি দিয়ে একটি পিডিএফ ফাইল বানান। ডকুমেন্টের ছবি তুলে জমা দেওয়ার জন্য কাজের।',
    introEn: 'Make a PDF from one or more images. Handy when you photograph documents and need to submit them.',
    steps: ['ছবি বেছে নিন (একাধিক হলেও চলবে)।', 'ক্রম, পেজ সাইজ ও মার্জিন ঠিক করুন।', '"পিডিএফ বানান" চাপুন এবং ডাউনলোড করুন।'],
    stepsEn: ['Choose your images (several are fine).', 'Set the order, page size and margin.', 'Press "Create PDF" and download.']
  },

  // --- Image Tools ---
  {
    slug: 'compress-image',
    bn: 'ছবি কমপ্রেস',
    en: 'Compress Image',
    icon: 'Minimize2',
    cats: ['images'],
    group: 'image',
    badge: 'Fast',
    desc: 'ছবির সাইজ (KB/MB) কমান, চাইলে নির্দিষ্ট KB-তে আনুন',
    descEn: 'Reduce image size (KB/MB), or hit an exact KB target',
    keywords: 'compress image reduce image size photo size kb koman chobi choto korun ছবির সাইজ কমানো কেবি',
    intro: 'ছবির মান ঠিক রেখে সাইজ কমান। আবেদনের ফর্মে নির্দিষ্ট KB-এর মধ্যে ছবি লাগলে টার্গেট সাইজ দিন।',
    introEn: 'Make an image smaller while keeping it looking good. If a form asks for a photo under 100 KB, enter the target size.',
    steps: ['এক বা একাধিক ছবি বেছে নিন।', 'মান বাছুন, অথবা টার্গেট সাইজ (KB) লিখুন।', '"কমপ্রেস করুন" চাপুন এবং ডাউনলোড করুন।'],
    stepsEn: ['Choose one or more images.', 'Pick the quality, or type a target size in KB.', 'Press "Compress" and download.']
  },
  {
    slug: 'resize-image',
    bn: 'ছবির সাইজ পরিবর্তন',
    en: 'Resize Image',
    icon: 'Maximize2',
    cats: ['images'],
    group: 'image',
    desc: 'ছবির প্রস্থ-উচ্চতা (পিক্সেল) বদলান',
    descEn: 'Change image width and height (pixels)',
    keywords: 'resize image change image size width height pixel ছবি ছোট বড় মাপ',
    intro: 'ছবির মাপ পিক্সেলে বা শতকরায় বদলান। পাসপোর্ট ছবি ও স্বাক্ষরের জন্য রেডিমেড মাপ আছে।',
    introEn: 'Change an image size in pixels or percent. Ready-made sizes for passport photos and signatures are included.',
    steps: ['একটি ছবি বেছে নিন।', 'নতুন মাপ লিখুন বা তৈরি মাপ বেছে নিন।', '"মাপ বদলান" চাপুন এবং ডাউনলোড করুন।'],
    stepsEn: ['Choose an image.', 'Type the new size or pick a ready-made one.', 'Press "Resize" and download.']
  },
  {
    slug: 'crop-image',
    bn: 'ছবি ক্রপ',
    en: 'Crop Image',
    icon: 'Crop',
    cats: ['images'],
    group: 'image',
    desc: 'ছবির অপ্রয়োজনীয় অংশ কেটে ফেলুন',
    descEn: 'Cut away the parts of an image you do not need',
    keywords: 'crop image cut photo chobi kata কাটা ক্রপ',
    intro: 'ছবির দরকারি অংশ বেছে নিয়ে বাকিটা কেটে ফেলুন। ১:১, ৪:৩, ১৬:৯, পাসপোর্ট অনুপাত ইত্যাদি আছে।',
    introEn: 'Select the part of the image you want and cut off the rest. Ratios like 1:1, 4:3, 16:9 and passport are included.',
    steps: ['একটি ছবি বেছে নিন।', 'বাক্স টেনে বা কোণা ধরে কাটার অংশ ঠিক করুন।', '"ক্রপ করুন" চাপুন এবং ডাউনলোড করুন।'],
    stepsEn: ['Choose an image.', 'Drag the box or its corners to set the crop area.', 'Press "Crop" and download.']
  },
  {
    slug: 'merge-image',
    bn: 'ছবি মার্জ',
    en: 'Merge Image',
    icon: 'Columns2',
    cats: ['images'],
    group: 'image',
    desc: 'কয়েকটি ছবি জুড়ে একটি ছবি বানান',
    descEn: 'Join several images into one picture',
    keywords: 'merge image combine images join photos stitch chobi jora ছবি জোড়া মার্জ',
    intro: 'একাধিক ছবি পাশাপাশি, উপর-নিচ বা গ্রিডে সাজিয়ে একটি ছবি বানান।',
    introEn: 'Arrange multiple images side by side, top to bottom, or in a grid to make one image.',
    steps: ['দুই বা তার বেশি ছবি বেছে নিন।', 'সাজানোর ধরন, ফাঁক ও ব্যাকগ্রাউন্ড রং ঠিক করুন।', '"ছবি জুড়ুন" চাপুন এবং ডাউনলোড করুন।'],
    stepsEn: ['Choose two or more images.', 'Set the layout, gap and background colour.', 'Press "Join images" and download.']
  },
  {
    slug: 'convert-image',
    bn: 'ছবির ফরম্যাট পরিবর্তন',
    en: 'Convert Image',
    icon: 'RefreshCw',
    cats: ['images'],
    group: 'image',
    desc: 'JPG, PNG, WebP-এর মধ্যে রূপান্তর করুন',
    descEn: 'Convert between JPG, PNG and WebP',
    keywords: 'convert image jpg to png png to jpg webp format format change ছবির ফরম্যাট রূপান্তর',
    intro: 'ছবি JPG, PNG বা WebP ফরম্যাটে রূপান্তর করুন।',
    introEn: 'Convert images to JPG, PNG or WebP format.',
    steps: ['এক বা একাধিক ছবি বেছে নিন।', 'কোন ফরম্যাটে চান তা বাছুন।', '"রূপান্তর করুন" চাপুন এবং ডাউনলোড করুন।'],
    stepsEn: ['Choose one or more images.', 'Pick the format you want.', 'Press "Convert" and download.']
  },
  {
    slug: 'passport-photo',
    bn: 'পাসপোর্ট সাইজ ফটো',
    en: 'Passport Size Photo',
    icon: 'Contact',
    cats: ['images'],
    group: 'image',
    badge: 'Govt Standard',
    desc: 'স্ট্যান্ডার্ড পাসপোর্ট সাইজ (৩৫×৪৫ মিমি / ৪১৩×৫৩১ px) ছবি বানান',
    descEn: 'Create standard passport size photo with fixed dimensions',
    keywords: 'passport size photo passport chobi passport photo maker bd passport 35x45 300x300 পাসপোর্ট সাইজ ছবি সরকারি পাসপোর্ট',
    intro: 'সরকারি ও আন্তর্জাতিক স্ট্যান্ডার্ড ফিক্সড পাসপোর্ট সাইজের ছবি তৈরি করুন। ব্যাকগ্রাউন্ড কালার বদলানো ও ফ্রেম মেলানোর সুবিধা রয়েছে।',
    introEn: 'Create an official standard passport size photo with strictly fixed dimensions (35×45 mm / 413×531 px). Adjust face in the passport frame.',
    steps: ['একটি ছবি বেছে নিন।', 'পাসপোর্ট ফ্রেমে মুখ ঠিকমতো বসিয়ে সাজান।', 'প্রয়োজনে ব্যাকগ্রাউন্ড রং (সাদা/নীল) বেছে নিন।', '"পাসপোর্ট ছবি বানান" চাপুন এবং ডাউনলোড করুন।'],
    stepsEn: ['Choose a photo.', 'Position and center your face in the passport frame.', 'Select background color (white, blue, or original).', 'Press "Create Passport Photo" and download.']
  },
  {
    slug: 'remove-background',
    bn: 'ব্যাকগ্রাউন্ড রিমুভ',
    en: 'Remove Background',
    icon: 'Eraser',
    cats: ['images'],
    group: 'image',
    badge: 'AI Powered',
    desc: 'ছবির ব্যাকগ্রাউন্ড মুছে স্বচ্ছ বা পছন্দের রঙের করুন',
    descEn: 'Remove image background and make it transparent or colored',
    keywords: 'remove background bg remove transparent png background changer ছবির ব্যাকগ্রাউন্ড পরিবর্তন স্বচ্ছ কাটআউট',
    intro: 'ছবির ব্যাকগ্রাউন্ড সহজেই এক ক্লিকে মুছে স্বচ্ছ (Transparent PNG) করুন বা নতুন রঙের ব্যাকগ্রাউন্ড যুক্ত করুন।',
    introEn: 'Erase image background with one click and get a clean transparent PNG or replace it with a solid color.',
    steps: ['একটি ছবি বেছে নিন।', 'স্বচ্ছতা বা রঙের ব্যাকগ্রাউন্ড নির্বাচন করুন।', 'প্রয়োজনে সেনসিটিভিটি বা ইরেজার ব্রাশ দিয়ে নিখুঁত করুন।', '"ডাউনলোড করুন" চাপুন।'],
    stepsEn: ['Choose an image.', 'Select transparent or a background color.', 'Fine-tune sensitivity or touch up with the eraser brush.', 'Download your cutout image.']
  },

  // --- Calculators ---
  {
    slug: 'currency-converter',
    bn: 'লাইভ কারেন্সি কনভার্টার',
    en: 'Live Currency Converter',
    icon: 'Coins',
    cats: ['calculators'],
    group: 'calc',
    badge: 'Live Rates',
    desc: 'ডলার, রিয়াল, ইউরো, পাউন্ডসহ সব দেশের টাকার প্রতিদিনের লাইভ রেট',
    descEn: 'Daily live exchange rates for USD, SAR, AED, EUR, GBP to BDT',
    keywords: 'currency converter taka dollar rate live currency rate live exchange rate bdt to usd usd to bdt riyal dirham euro pound মুদ্রা বিনিময় টাকা ডলার রিয়াল রেট প্রবাসীদের রেট হুন্ডি বাদ ব্যাংক রেট',
    intro: 'প্রতিদিনের লাইভ এক্সচেঞ্জ রেট অনুযায়ী মার্কিন ডলার, সৌদি রিয়াল, ইউএই দিরহাম, ইউরো, পাউন্ডসহ বিশ্বের যেকোনো মুদ্রাকে টাকায় ও পরস্পরে রূপান্তর করুন।',
    introEn: 'Convert currencies to BDT and between world currencies based on daily live exchange rates.',
    steps: ['টাকার পরিমাণ লিখুন।', 'কোন মুদ্রা থেকে কোন মুদ্রায় রূপান্তর করবেন তা নির্বাচন করুন।', 'তাৎক্ষণিক লাইভ এক্সচেঞ্জ রেট ও ফলাফল দেখুন।'],
    stepsEn: ['Enter the amount.', 'Select the from and to currencies.', 'See live exchange rates and calculation instantly.']
  },
  {
    slug: 'bmi-calculator',
    bn: 'বিএমআই ক্যালকুলেটর',
    en: 'BMI Calculator',
    icon: 'Scale',
    cats: ['calculators'],
    group: 'calc',
    desc: 'ওজন ও উচ্চতা থেকে বডি মাস ইনডেক্স জানুন',
    descEn: 'Find your body mass index from weight and height',
    keywords: 'bmi calculator weight height body mass index ওজন উচ্চতা স্বাস্থ্য',
    intro: 'ওজন ও উচ্চতা দিলেই আপনার বিএমআই এবং সুস্থ ওজনের পরিসীমা দেখুন।',
    introEn: 'Enter your weight and height to see your BMI and the healthy weight range for your height.',
    steps: ['ওজন লিখুন (কেজি বা পাউন্ড)।', 'উচ্চতা লিখুন (সেমি বা ফুট-ইঞ্চি)।', 'ফলাফল সঙ্গে সঙ্গে নিচে দেখুন।'],
    stepsEn: ['Enter your weight (kg or pounds).', 'Enter your height (cm or feet-inches).', 'See the result right away below.']
  },
  {
    slug: 'unit-converter',
    bn: 'ইউনিট কনভার্টার',
    en: 'Unit Converter',
    icon: 'Ruler',
    cats: ['calculators'],
    group: 'calc',
    desc: 'দৈর্ঘ্য, ওজন, জমি (কাঠা, বিঘা, শতাংশ), ভরি, মণসহ',
    descEn: 'Length, weight, land (katha, bigha, decimal), bhori, maund and more',
    keywords: 'unit converter length weight area katha bigha decimal bhori vori maan কাঠা বিঘা শতাংশ ভরি মণ সের জমি',
    intro: 'বাংলাদেশে প্রচলিত কাঠা, বিঘা, শতাংশ, ভরি, মণ, সের এবং আন্তর্জাতিক ইউনিট সহজে পরিবর্তন করুন।',
    introEn: 'Convert Bangladeshi units such as katha, bigha, decimal, bhori, maund and seer, along with international units.',
    steps: ['ইউনিটের ধরন বেছে নিন (যেমন জমি বা ওজন)।', 'সংখ্যা লিখুন এবং কোন ইউনিট থেকে কোন ইউনিটে যাবেন তা বাছুন।', 'ফলাফল ও সব ইউনিটের তালিকা নিচে দেখুন।'],
    stepsEn: ['Pick a type of unit (for example land or weight).', 'Enter a number and choose the units to convert from and to.', 'See the result and the full list of units below.']
  },
  {
    slug: 'percentage-calculator',
    bn: 'শতকরা হিসাব',
    en: 'Percentage Calculator',
    icon: 'Percent',
    cats: ['calculators'],
    group: 'calc',
    desc: 'শতকরা, ছাড়, বৃদ্ধি-হ্রাসের হিসাব',
    descEn: 'Percentages, discounts, increase and decrease',
    keywords: 'percentage calculator percent sotokora শতকরা হিসাব ছাড় discount',
    intro: 'শতকরা বের করা, ছাড়ের পর দাম, বৃদ্ধি বা হ্রাসের হার, সবই এক জায়গায়।',
    introEn: 'Work out percentages, the price after a discount, and the rate of increase or decrease, all in one place.',
    steps: ['যে ধরনের হিসাব দরকার সেই বক্সে সংখ্যা লিখুন।', 'ফলাফল সঙ্গে সঙ্গে দেখা যাবে।'],
    stepsEn: ['Type numbers into the box for the calculation you need.', 'The result appears instantly.']
  },
  {
    slug: 'age-calculator',
    bn: 'বয়স ক্যালকুলেটর',
    en: 'Age Calculator',
    icon: 'Calendar',
    cats: ['calculators'],
    group: 'calc',
    desc: 'জন্ম তারিখ থেকে বছর-মাস-দিনে বয়স',
    descEn: 'Exact age in years, months and days from a date of birth',
    keywords: 'age calculator date of birth boyos bayosh বয়স জন্ম তারিখ জন্মদিন',
    intro: 'জন্ম তারিখ দিয়ে বছর, মাস ও দিনে সঠিক বয়স এবং পরের জন্মদিনের হিসাব জানুন।',
    introEn: 'Enter a date of birth to get an exact age in years, months and days, plus a countdown to the next birthday.',
    steps: ['জন্ম তারিখ বেছে নিন।', 'চাইলে "যে তারিখ পর্যন্ত" বদলান (ডিফল্ট আজ)।', 'বয়স ও পরের জন্মদিন নিচে দেখুন।'],
    stepsEn: ['Pick the date of birth.', 'Optionally change the "as of" date (default is today).', 'See the age and next birthday below.']
  },
  {
    slug: 'time-zone-converter',
    bn: 'টাইম জোন কনভার্টার',
    en: 'Time Zone Converter',
    icon: 'Globe',
    cats: ['calculators'],
    group: 'calc',
    desc: 'ঢাকার সময় থেকে সৌদি, দুবাই, মালয়েশিয়া, লন্ডন, নিউইয়র্ক',
    descEn: 'Dhaka time to Saudi, Dubai, Malaysia, London, New York',
    keywords: 'time zone converter world clock saudi dubai malaysia time somoy সময় টাইম জোন প্রবাসী',
    intro: 'প্রবাসী স্বজনদের সঙ্গে কথা বলার সময় ঠিক করতে বিভিন্ন দেশের সময় মিলিয়ে দেখুন।',
    introEn: 'Compare times across countries to find a good time to talk with family and friends abroad.',
    steps: ['কোন শহরের সময় থেকে শুরু করবেন তা বাছুন এবং তারিখ-সময় দিন।', 'যেসব শহরের সময় দেখতে চান সেগুলো যোগ করুন।', 'প্রতিটি শহরের সময় ও তারিখ নিচে দেখুন।'],
    stepsEn: ['Pick the city you are starting from and enter a date and time.', 'Add the cities whose time you want to see.', 'See each city\'s time and date below.']
  },

  // --- QR Tools ---
  {
    slug: 'qr-generator',
    bn: 'কিউআর কোড জেনারেটর',
    en: 'QR Code Generator',
    icon: 'QrCode',
    cats: ['qr'],
    group: 'qr',
    desc: 'লিংক, ওয়াই-ফাই, হোয়াটসঅ্যাপের কিউআর কোড',
    descEn: 'QR codes for links, Wi-Fi and WhatsApp',
    keywords: 'qr code generator qr banano wifi whatsapp link কিউআর কোড বানান',
    intro: 'লিংক, লেখা, ওয়াই-ফাই, হোয়াটসঅ্যাপ নম্বর বা ইমেইলের জন্য কিউআর কোড বানান।',
    introEn: 'Create a QR code for a link, text, Wi-Fi, WhatsApp number or email.',
    steps: ['কিউআর কোডের ধরন বেছে নিন।', 'তথ্য লিখুন, কোড সঙ্গে সঙ্গে তৈরি হবে।', 'PNG বা SVG হিসেবে ডাউনলোড করুন।'],
    stepsEn: ['Choose the type of QR code.', 'Enter the details and the code appears instantly.', 'Download it as PNG or SVG.']
  },
  {
    slug: 'qr-decoder',
    bn: 'কিউআর কোড রিডার',
    en: 'QR Code Decoder',
    icon: 'ScanLine',
    cats: ['qr'],
    group: 'qr',
    desc: 'ছবি বা ক্যামেরা থেকে কিউআর কোড পড়ুন',
    descEn: 'Read a QR code from an image or the camera',
    keywords: 'qr code scanner reader decoder qr scan কিউআর স্ক্যান পড়া',
    intro: 'কিউআর কোডের ছবি আপলোড করুন বা ক্যামেরা দিয়ে স্ক্যান করুন, ভেতরের লেখা বা লিংক দেখুন।',
    introEn: 'Upload a picture of a QR code or scan it with your camera to see the text or link inside.',
    steps: ['কিউআর কোডের ছবি বেছে নিন (বা ছবি পেস্ট করুন), অথবা ক্যামেরা চালু করুন।', 'কোডের ভেতরের লেখা নিচে দেখা যাবে।', 'কপি করুন বা লিংক খুলুন।'],
    stepsEn: ['Choose a QR image (or paste one), or turn on the camera.', 'The text inside the code appears below.', 'Copy it or open the link.']
  },

  // --- Media Tools ---
  {
    slug: 'youtube-downloader',
    bn: 'ইউটিউব ডাউনলোডার',
    en: 'YouTube Downloader',
    icon: 'Video',
    cats: ['media'],
    group: 'media',
    badge: 'HD Audio/Video',
    desc: 'ইউটিউব ভিডিও (MP4) বা অডিও (MP3) উচ্চমানে ডাউনলোড করুন',
    descEn: 'Download YouTube video (MP4) or audio (MP3) in high quality',
    keywords: 'youtube download youtube video download youtube mp3 audio download youtube to mp3 yt video downloader shorts download ইউটিউব ভিডিও অডিও গান ডাউনলোড এমপিথ্রি এমপিফোর',
    intro: 'যেকোনো ইউটিউব ভিডিও বা শর্টসের লিংক দিয়ে সরাসরি HD ভিডিও (MP4) অথবা স্পষ্ট অডিও (MP3/M4A) ডাউনলোড করুন।',
    introEn: 'Paste any YouTube video or Shorts link to download HD video (MP4) or high-quality audio (MP3/M4A) directly.',
    steps: ['ইউটিউব ভিডিও বা শর্টসের লিংক কপি করে পেস্ট করুন।', 'ভিডিও (১০৮০p, ৭২০p) নাকি অডিও (MP৩, M৪A) নামাবেন তা বেছে নিন।', '"ডাউনলোড করুন" চাপুন এবং ফাইল সেভ করুন।'],
    stepsEn: ['Paste your YouTube video or Shorts link.', 'Choose whether to download video (1080p, 720p) or audio (MP3, M4A).', 'Click "Download" to save your file.']
  },
  {
    slug: 'audio-extractor',
    bn: 'ভিডিও থেকে অডিও',
    en: 'Audio Extractor',
    icon: 'Music',
    cats: ['media'],
    group: 'media',
    desc: 'ভিডিও থেকে MP3, M4A বা WAV অডিও আলাদা করুন',
    descEn: 'Pull MP3, M4A or WAV audio out of a video',
    keywords: 'extract audio from video mp3 video to mp3 audio nibo ভিডিও থেকে গান অডিও এমপিথ্রি',
    intro: 'যেকোনো ভিডিও ফাইল থেকে শুধু শব্দ আলাদা করে MP3, M4A বা WAV হিসেবে নামান।',
    introEn: 'Take just the sound from any video file and save it as MP3, M4A or WAV.',
    steps: ['ভিডিও ফাইল বেছে নিন।', 'অডিও ফরম্যাট ও মান বাছুন।', '"অডিও আলাদা করুন" চাপুন এবং ডাউনলোড করুন।'],
    stepsEn: ['Choose a video file.', 'Pick the audio format and quality.', 'Press "Extract audio" and download.']
  },
  {
    slug: 'social-video-cropper',
    bn: 'সোশ্যাল মিডিয়া ভিডিও ক্রপার',
    en: 'Social Media Video Cropper',
    icon: 'Smartphone',
    cats: ['media'],
    group: 'media',
    desc: 'রিলস, শর্টস, ইনস্টাগ্রামের মাপে ভিডিও কাটুন',
    descEn: 'Crop video to Reels, Shorts and Instagram sizes',
    keywords: 'video crop reels tiktok shorts instagram facebook 9:16 1:1 video kata ভিডিও ক্রপ রিলস',
    intro: 'ভিডিও ৯:১৬ (রিলস/শর্টস), ১:১, ৪:৫ বা ১৬:৯ মাপে কেটে নিন।',
    introEn: 'Crop a video to 9:16 (Reels/Shorts), 1:1, 4:5 or 16:9.',
    steps: ['ভিডিও বেছে নিন।', 'কোন প্ল্যাটফর্মের মাপ চান তা বাছুন এবং কাটার অবস্থান ঠিক করুন।', '"ভিডিও বানান" চাপুন এবং ডাউনলোড করুন।'],
    stepsEn: ['Choose a video.', 'Pick the platform size and set the crop position.', 'Press "Create video" and download.']
  },

  // --- Resume Tools ---
  {
    slug: 'resume-builder',
    bn: 'প্রফেশনাল রেজিউমে',
    en: 'Professional Resume',
    icon: 'FileBadge',
    cats: ['resume'],
    group: 'resume',
    badge: 'Popular',
    desc: 'ফর্ম পূরণ করে পরিষ্কার রেজিউমে বানিয়ে পিডিএফ নিন',
    descEn: 'Fill a form, get a clean resume and save it as PDF',
    keywords: 'resume builder cv maker biodata job cv bio data সিভি রেজিউমে জীবনবৃত্তান্ত চাকরি',
    intro: 'তথ্য লিখুন, পাশেই রেজিউমের প্রিভিউ দেখুন, তারপর পিডিএফ করে নিন।',
    introEn: 'Enter your details, watch the resume preview next to the form, then save it as a PDF.',
    steps: ['বাঁ দিকের ফর্মে আপনার তথ্য লিখুন।', 'টেমপ্লেট ও রং বেছে নিন।', '"পিডিএফ ডাউনলোড" চাপুন, প্রিন্ট উইন্ডোতে "Save as PDF" বেছে নিন।'],
    stepsEn: ['Fill in your details in the form.', 'Pick a template and colour.', 'Press "Download PDF" and choose "Save as PDF" in the print window.']
  },
  {
    slug: 'cv-templates',
    bn: 'সিভি টেমপ্লেট',
    en: 'CV Templates',
    icon: 'LayoutTemplate',
    cats: ['resume'],
    group: 'resume',
    desc: 'বাংলাদেশি সিভিসহ ৪টি টেমপ্লেট থেকে বেছে নিন',
    descEn: 'Choose from 4 templates, including a Bangladeshi-style CV',
    keywords: 'cv template biodata template bd cv format সিভি টেমপ্লেট বায়োডাটা',
    intro: 'ছবিসহ বাংলাদেশি স্টাইল, সাইডবার, মিনিমালসহ কয়েকটি টেমপ্লেট দেখে পছন্দেরটি বেছে নিন।',
    introEn: 'Look through templates, including a Bangladeshi-style CV with photo, a sidebar layout and a minimal one, and pick your favourite.',
    steps: ['পছন্দের টেমপ্লেট বেছে নিন।', 'নিজের তথ্য লিখুন।', '"পিডিএফ ডাউনলোড" চাপুন।'],
    stepsEn: ['Pick a template.', 'Enter your details.', 'Press "Download PDF".']
  }
];

export const TOOLS_BY_SLUG: Record<string, ToolItem> = TOOLS.reduce((acc, tool) => {
  acc[tool.slug] = tool;
  return acc;
}, {} as Record<string, ToolItem>);
