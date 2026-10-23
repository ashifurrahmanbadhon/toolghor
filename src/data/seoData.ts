export interface FaqItem {
  en: { q: string; a: string };
  bn: { q: string; a: string };
}

export const SEO_TITLES: Record<string, string> = {
  'home': 'Free Online Tools — PDF, Image, QR, Video | ToolGhor',
  'merge-pdf': 'Merge PDF Online Free — Combine PDF Files | ToolGhor',
  'split-pdf': 'Split PDF Online Free — Extract PDF Pages | ToolGhor',
  'compress-pdf': 'Compress PDF Online Free — Reduce PDF Size | ToolGhor',
  'pdf-to-image': 'PDF to Image Converter Online Free — PNG/JPG | ToolGhor',
  'pdf-to-doc': 'PDF to Word Converter Online Free — PDF to DOCX | ToolGhor',
  'word-to-pdf': 'Word to PDF Converter Online Free — DOCX to PDF | ToolGhor',
  'jpg-to-pdf': 'JPG to PDF Converter Online Free — Images to PDF | ToolGhor',
  'compress-image': 'Compress Image Online — Reduce Photo Size in KB | ToolGhor',
  'crop-image': 'Crop Image Online Free — Cut Photos Easily | ToolGhor',
  'merge-image': 'Merge Images Online Free — Join Photos into One | ToolGhor',
  'resize-image': 'Resize Image Online Free — Pixels, KB & Megapixels | ToolGhor',
  'passport-photo': 'Passport Size Photo Maker Online Free — 35×45 mm | ToolGhor',
  'remove-background': 'Remove Background Online Free — Transparent PNG | ToolGhor',
  'remove-ai-label': 'Remove AI Label & Metadata from Photos — Free, No Upload | ToolGhor',
  'currency-converter': 'Currency Converter — USD, SAR, AED to BDT Live Rate | ToolGhor',
  'bmi-calculator': 'BMI Calculator Online Free — Check Your BMI | ToolGhor',
  'unit-converter': 'Unit Converter — Katha, Bigha, Bhori, Length, Weight | ToolGhor',
  'percentage-calculator': 'Percentage Calculator Online Free — Discount & Marks | ToolGhor',
  'age-calculator': 'Age Calculator Online — Exact Years, Months, Days | ToolGhor',
  'time-zone-converter': 'Time Zone Converter — Dhaka to Saudi, Dubai, London | ToolGhor',
  'qr-generator': 'QR Code Generator Online Free — Link, WiFi, WhatsApp | ToolGhor',
  'qr-decoder': 'QR Code Scanner Online — Read QR from Image/Camera | ToolGhor',
  'video-downloader': 'Video Downloader Online — YouTube, Facebook, Instagram | ToolGhor',
  'audio-extractor': 'Extract Audio from Video Online Free — MP3, WAV | ToolGhor',
  'social-video-cropper': 'Video Cropper for Reels & Shorts Online Free | ToolGhor',
  'resume-builder': 'Resume Builder Online Free — Make & Download PDF CV | ToolGhor',
  'cv-templates': 'Free CV Templates — Download & Edit Online | ToolGhor',
};

export const SEO_DESCRIPTIONS: Record<string, string> = {
  'remove-ai-label': 'Remove AI labels & hidden metadata (C2PA, EXIF, XMP) from photos — free, 100% in your browser, no upload. ছবি থেকে AI লেবেল ও মেটাডেটা মুছুন — ফ্রি, আপলোড ছাড়াই।',
  'video-downloader': 'Download videos or audio from YouTube, Instagram, Facebook & direct links with one click. ইউটিউব, ফেসবুক, ইনস্টাগ্রাম থেকে ভিডিও/অডিও ডাউনলোড করুন।',
};

export const FAQ_DATA: Record<string, FaqItem[]> = {
  'compress-image': [
    {
      en: {
        q: 'How do I compress an image to exactly 100 KB (or 200 KB)?',
        a: 'Upload your photo, choose the target KB option, set 100 (or the size you need) and download — the tool brings the file down to that size automatically.',
      },
      bn: {
        q: 'ছবিকে ঠিক 100 KB (বা 200 KB) তে কমাবো কীভাবে?',
        a: 'ছবি আপলোড করে target KB অপশনে 100 (বা আপনার প্রয়োজনীয় সাইজ) সেট করে ডাউনলোড করুন — টুলটি নিজে থেকেই ফাইলটিকে ওই সাইজে নামিয়ে আনবে।',
      },
    },
    {
      en: {
        q: 'Will compressing make my photo blurry?',
        a: 'A small reduction is barely noticeable. Very small targets (20–30 KB) can soften a large photo — if that happens, try a slightly bigger target size.',
      },
      bn: {
        q: 'ছবির সাইজ কমালে কি ছবি ঝাপসা হয়ে যাবে?',
        a: 'অল্প কমালে প্রায় বোঝাই যায় না। খুব ছোট টার্গেট (20–30 KB) বড় ছবিকে কিছুটা নরম করে দিতে পারে — তখন একটু বড় টার্গেট দিয়ে আবার চেষ্টা করুন।',
      },
    },
    {
      en: {
        q: 'Is my photo uploaded to a server?',
        a: 'No. Compression happens 100% in your browser — your photo never leaves your device.',
      },
      bn: {
        q: 'আমার ছবি কি সার্ভারে আপলোড হয়?',
        a: 'না। কমপ্রেশন 100% আপনার ব্রাউজারেই হয় — ছবি আপনার ডিভাইসের বাইরে যায় না।',
      },
    },
    {
      en: {
        q: 'Which formats can I compress?',
        a: 'JPG, PNG and WebP images.',
      },
      bn: {
        q: 'কোন কোন ফরম্যাটের ছবি কমপ্রেস করা যায়?',
        a: 'JPG, PNG ও WebP ছবি।',
      },
    },
  ],

  'resize-image': [
    {
      en: {
        q: 'How do I resize an image to a specific size in KB or MB?',
        a: 'Upload your photo, then enter a target file size (KB/MB), or set the width and height in pixels, or pick a megapixel preset — then download the result.',
      },
      bn: {
        q: 'ছবিকে নির্দিষ্ট KB বা MB সাইজে আনবো কীভাবে?',
        a: 'ছবি আপলোড করে target সাইজ (KB/MB) লিখুন, অথবা pixel এ width-height সেট করুন, অথবা megapixel preset বেছে নিন — তারপর ডাউনলোড করুন।',
      },
    },
    {
      en: {
        q: 'Can I make a photo bigger, with more megapixels?',
        a: 'You can increase the dimensions (up to 48 MP), but real detail can never exceed the original photo. Enlarging is useful when a form asks for a minimum size or resolution.',
      },
      bn: {
        q: 'ছবি বড় করে megapixel বাড়ানো যাবে?',
        a: 'Dimensions বাড়ানো যায় (সর্বোচ্চ 48 MP), তবে আসল detail মূল ছবির চেয়ে বেশি হতে পারে না। কোনো ফর্মে minimum সাইজ চাইলে এই অপশনটা কাজে লাগে।',
      },
    },
    {
      en: {
        q: 'What size is best for uploading to Facebook?',
        a: 'About 2048 pixels on the longest side (roughly 3 MP) — Facebook compresses anything larger anyway.',
      },
      bn: {
        q: 'Facebook এ আপলোডের জন্য কোন সাইজ সবচেয়ে ভালো?',
        a: 'লম্বা পাশে প্রায় 2048 pixel (আনুমানিক 3 MP) — এর চেয়ে বড় হলে Facebook নিজেই compress করে নেয়।',
      },
    },
    {
      en: {
        q: 'Is my photo uploaded to a server?',
        a: 'No — resizing happens 100% in your browser.',
      },
      bn: {
        q: 'আমার ছবি কি সার্ভারে আপলোড হয়?',
        a: 'না — resizing 100% আপনার ব্রাউজারেই হয়।',
      },
    },
  ],

  'passport-photo': [
    {
      en: {
        q: 'What is the standard passport photo size?',
        a: '35 × 45 mm (about 413 × 531 pixels at 300 DPI) — the size used in Bangladesh and most countries. This tool crops your photo to exactly that size.',
      },
      bn: {
        q: 'পাসপোর্ট সাইজ ছবির স্ট্যান্ডার্ড মাপ কত?',
        a: '35 × 45 মিমি (300 DPI তে প্রায় 413 × 531 pixel) — বাংলাদেশসহ বেশিরভাগ দেশে এই মাপই ব্যবহৃত হয়। এই টুলটি আপনার ছবিকে ঠিক এই মাপে crop করে।',
      },
    },
    {
      en: {
        q: 'Can I make a passport photo with my phone?',
        a: 'Yes. Take a photo in good light against a plain background, upload it here, position your face inside the frame and download.',
      },
      bn: {
        q: 'ফোন দিয়েই কি পাসপোর্ট সাইজ ছবি বানানো যাবে?',
        a: 'হ্যাঁ। ভালো আলোতে সাদামাটা background এর সামনে ছবি তুলে এখানে আপলোড করুন, ফ্রেমে মুখ ঠিকমতো বসিয়ে ডাউনলোড করুন।',
      },
    },
    {
      en: {
        q: 'Can I use this photo for online application forms?',
        a: 'Yes — download the JPG and upload it to the form. If the form sets a maximum file size (like 100 KB), run the photo through Compress Image afterwards.',
      },
      bn: {
        q: 'এই ছবি কি অনলাইন আবেদন ফর্মে ব্যবহার করা যাবে?',
        a: 'হ্যাঁ — JPG ডাউনলোড করে ফর্মে আপলোড করুন। ফর্মে সর্বোচ্চ ফাইল সাইজ (যেমন 100 KB) বেঁধে দিলে পরে Compress Image দিয়ে সাইজ কমিয়ে নিন।',
      },
    },
    {
      en: {
        q: 'Is my photo uploaded anywhere?',
        a: 'No — it is processed in your browser and never leaves your device.',
      },
      bn: {
        q: 'আমার ছবি কি কোথাও আপলোড হয়?',
        a: 'না — ছবিটি আপনার ব্রাউজারেই প্রসেস হয়, ডিভাইসের বাইরে যায় না।',
      },
    },
  ],

  'remove-ai-label': [
    {
      en: {
        q: 'What does this tool remove from a photo?',
        a: 'The hidden AI labels and metadata — C2PA credentials, EXIF, XMP, IPTC and PNG text chunks — by re-creating the photo without them.',
      },
      bn: {
        q: 'এই টুলটি ছবি থেকে কী সরায়?',
        a: 'ছবির ভিতরে লুকানো AI লেবেল ও মেটাডেটা — C2PA credentials, EXIF, XMP, IPTC ও PNG text chunk — ছবিটিকে সেগুলো ছাড়া নতুন করে তৈরি করে সরিয়ে দেয়।',
      },
    },
    {
      en: {
        q: 'Will Facebook or Instagram still show an "AI Info" label after cleaning?',
        a: 'The metadata that platforms read is removed. However, platforms can also detect AI content in other ways — invisible pixel watermarks (like SynthID) or AI classifiers — so no tool can guarantee a label will never appear.',
      },
      bn: {
        q: 'পরিষ্কার করার পরও কি Facebook বা Instagram "AI Info" লেবেল দেখাতে পারে?',
        a: 'প্ল্যাটফর্মগুলো যে মেটাডেটা পড়ে তা সরিয়ে দেওয়া হয়। তবে প্ল্যাটফর্মগুলো অন্য উপায়েও AI শনাক্ত করতে পারে — অদৃশ্য pixel watermark (যেমন SynthID) বা AI classifier দিয়ে — তাই কোনো টুলই গ্যারান্টি দিতে পারে না যে লেবেল কখনোই আসবে না।',
      },
    },
    {
      en: {
        q: 'Does cleaning change how my photo looks?',
        a: 'No — the picture itself stays exactly the same; only the hidden data is stripped. The file size may change a little because the photo is re-saved.',
      },
      bn: {
        q: 'পরিষ্কার করলে কি ছবির চেহারা বদলে যাবে?',
        a: 'না — ছবিটি হুবহু একই থাকে; শুধু লুকানো ডেটা সরিয়ে দেওয়া হয়। ছবি নতুন করে সেভ হওয়ায় ফাইল সাইজ কিছুটা বদলাতে পারে।',
      },
    },
    {
      en: {
        q: 'Is there a file size limit?',
        a: 'No fixed limit — photos are cleaned one by one in your browser, so very large files depend on your device\'s memory.',
      },
      bn: {
        q: 'ফাইল সাইজের কোনো সীমা আছে?',
        a: 'নির্দিষ্ট কোনো সীমা নেই — ছবি আপনার ব্রাউজারে একটা একটা করে প্রসেস হয়, তাই খুব বড় ফাইলের ক্ষেত্রে ডিভাইসের memory এর উপর নির্ভর করে।',
      },
    },
  ],

  'remove-background': [
    {
      en: {
        q: 'How does background removal work here?',
        a: 'The tool detects the main subject of your photo and removes the background, so you can download the subject on a transparent or coloured background.',
      },
      bn: {
        q: 'এখানে background removal কীভাবে কাজ করে?',
        a: 'টুলটি ছবির মূল subject শনাক্ত করে background সরিয়ে দেয় — তারপর subject টি transparent বা রঙিন background এ ডাউনলোড করতে পারবেন।',
      },
    },
    {
      en: {
        q: 'What can I use a transparent-background photo for?',
        a: 'Product photos for online shops, profile pictures, designs, thumbnails and documents — anywhere you need the subject without the background.',
      },
      bn: {
        q: 'Transparent background এর ছবি কোথায় কাজে লাগে?',
        a: 'অনলাইন শপের product ছবি, profile picture, design, thumbnail ও document এ — যেখানে background ছাড়া শুধু subject টা দরকার।',
      },
    },
    {
      en: {
        q: 'Can I choose a background colour instead of transparent?',
        a: 'Yes — pick a solid colour in the tool, or keep it transparent.',
      },
      bn: {
        q: 'Transparent না রেখে রঙিন background দেওয়া যাবে?',
        a: 'হ্যাঁ — টুলে পছন্দের solid রং বেছে নিন, অথবা transparent রাখুন।',
      },
    },
    {
      en: {
        q: 'What kind of photo works best?',
        a: 'A clear photo in good light where the subject stands out from the background.',
      },
      bn: {
        q: 'কোন ধরনের ছবিতে সবচেয়ে ভালো ফল পাওয়া যায়?',
        a: 'ভালো আলোতে তোলা পরিষ্কার ছবি, যেখানে subject টি background থেকে স্পষ্ট আলাদা বোঝা যায়।',
      },
    },
  ],

  'merge-pdf': [
    {
      en: {
        q: 'How do I merge PDF files?',
        a: 'Add all your PDF files, arrange them in the order you want, and click Merge — one combined PDF is created for download.',
      },
      bn: {
        q: 'PDF ফাইল মার্জ করবো কীভাবে?',
        a: 'সব PDF ফাইল যোগ করুন, পছন্দের order এ সাজান, তারপর Merge চাপুন — একটি combined PDF তৈরি হয়ে যাবে ডাউনলোডের জন্য।',
      },
    },
    {
      en: {
        q: 'Will merging change the quality of my PDFs?',
        a: 'No — the pages are combined exactly as they are, without re-compressing or lowering quality.',
      },
      bn: {
        q: 'মার্জ করলে কি PDF এর quality কমে যাবে?',
        a: 'না — পৃষ্ঠাগুলো হুবহু একইভাবে জুড়ে দেওয়া হয়, quality কমানো হয় না।',
      },
    },
    {
      en: {
        q: 'Are my files uploaded to a server?',
        a: 'No — merging happens in your browser; your files never leave your device.',
      },
      bn: {
        q: 'আমার ফাইল কি সার্ভারে আপলোড হয়?',
        a: 'না — মার্জিং আপনার ব্রাউজারেই হয়; ফাইল ডিভাইসের বাইরে যায় না।',
      },
    },
    {
      en: {
        q: 'Can I merge PDFs on my phone?',
        a: 'Yes — the tool works in mobile browsers too.',
      },
      bn: {
        q: 'ফোন দিয়ে কি PDF মার্জ করা যাবে?',
        a: 'হ্যাঁ — টুলটি মোবাইল ব্রাউজারেও কাজ করে।',
      },
    },
  ],

  'qr-generator': [
    {
      en: {
        q: 'What can I create a QR code for?',
        a: 'Website links, Wi-Fi passwords, WhatsApp numbers, plain text and more — choose the type, enter the content and download your code.',
      },
      bn: {
        q: 'কীসের জন্য QR code বানানো যায়?',
        a: 'ওয়েবসাইট লিংক, Wi-Fi password, WhatsApp নম্বর, সাধারণ text সহ আরও অনেক কিছু — type বেছে content লিখে কোড ডাউনলোড করুন।',
      },
    },
    {
      en: {
        q: 'Can I print the QR code?',
        a: 'Yes — download the high-resolution image and print it. Test it once with your phone camera before printing many copies.',
      },
      bn: {
        q: 'QR code কি print করা যাবে?',
        a: 'হ্যাঁ — high-resolution ছবি ডাউনলোড করে print করুন। বেশি কপি print করার আগে ফোনের camera দিয়ে একবার test করে নিন।',
      },
    },
    {
      en: {
        q: 'Does a QR code from here expire?',
        a: 'No — these are static QR codes. They keep working as long as the content behind them (for example the link) stays valid.',
      },
      bn: {
        q: 'এখানকার QR code কি expire হয়ে যায়?',
        a: 'না — এগুলো static QR code। পেছনের content (যেমন লিংক) যতদিন valid থাকবে, কোডও কাজ করবে।',
      },
    },
    {
      en: {
        q: 'Is the QR generator free?',
        a: 'Yes — completely free, with no sign-up.',
      },
      bn: {
        q: 'QR জেনারেটর কি ফ্রি?',
        a: 'হ্যাঁ — সম্পূর্ণ ফ্রি, কোনো sign-up লাগে না।',
      },
    },
  ],

  'video-downloader': [
    {
      en: {
        q: 'Which sites can I download videos from?',
        a: 'YouTube, Instagram, Facebook and direct video links.',
      },
      bn: {
        q: 'কোন কোন সাইট থেকে ভিডিও ডাউনলোড করা যায়?',
        a: 'YouTube, Instagram, Facebook ও direct video লিংক থেকে।',
      },
    },
    {
      en: {
        q: 'Can I download only the audio as MP3?',
        a: 'Yes — choose the audio option to save just the sound from a video.',
      },
      bn: {
        q: 'শুধু অডিও (MP3) ডাউনলোড করা যাবে?',
        a: 'হ্যাঁ — audio অপশন বেছে নিলে ভিডিওর শুধু শব্দটাই সেভ হবে।',
      },
    },
    {
      en: {
        q: 'Why did my download fail?',
        a: 'Private or age-restricted videos often cannot be fetched, and platforms change their systems frequently. Check the video is public and try again.',
      },
      bn: {
        q: 'ডাউনলোড fail হলো কেন?',
        a: 'Private বা age-restricted ভিডিও সাধারণত আনা যায় না, আর প্ল্যাটফর্মগুলো ঘন ঘন তাদের system বদলায়। ভিডিওটি public কিনা দেখে আবার চেষ্টা করুন।',
      },
    },
    {
      en: {
        q: 'Is it OK to download any video?',
        a: 'Only download videos you own or have permission to use, and respect the creator\'s copyright.',
      },
      bn: {
        q: 'যেকোনো ভিডিও ডাউনলোড করা কি ঠিক?',
        a: 'শুধু নিজের বা অনুমতি পাওয়া ভিডিও ডাউনলোড করুন এবং creator এর copyright সম্মান করুন।',
      },
    },
  ],
};

export const GENERAL_FAQ: FaqItem[] = [
  {
    en: {
      q: 'Is ToolGhor really free to use?',
      a: 'Yes — all 27 tools on ToolGhor are completely free. There is no sign-up, no subscription and no hidden charge.',
    },
    bn: {
      q: 'ToolGhor কি সত্যিই ফ্রি?',
      a: 'হ্যাঁ — ToolGhor এর সব 27টি টুল সম্পূর্ণ ফ্রি। কোনো সাইন-আপ, সাবস্ক্রিপশন বা গোপন চার্জ নেই।',
    },
  },
  {
    en: {
      q: 'Do I need to create an account?',
      a: 'No. Just open the tool you need and start using it — no registration or login is required.',
    },
    bn: {
      q: 'আমাকে কি অ্যাকাউন্ট খুলতে হবে?',
      a: 'না। আপনার প্রয়োজনীয় টুলটি খুলেই ব্যবহার শুরু করুন — কোনো রেজিস্ট্রেশন বা লগইন লাগে না।',
    },
  },
  {
    en: {
      q: 'Are my files safe and private?',
      a: 'Most ToolGhor tools run 100% in your browser, so your files never leave your device. A few tools (for example background removal) use a secure server API to do their job — your file is used only to produce your result and is never stored.',
    },
    bn: {
      q: 'আমার ফাইল কি নিরাপদ ও প্রাইভেট থাকে?',
      a: 'ToolGhor এর বেশিরভাগ টুল 100% আপনার ব্রাউজারেই চলে, তাই আপনার ফাইল ডিভাইসের বাইরে যায় না। কিছু টুল (যেমন background removal) কাজের জন্য secure server API ব্যবহার করে — আপনার ফাইল শুধু result তৈরি করতেই ব্যবহৃত হয়, কখনো সংরক্ষণ করা হয় না।',
    },
  },
  {
    en: {
      q: 'What tools are available on ToolGhor?',
      a: '27 free tools in 6 categories — PDF tools, image tools, QR tools, video & audio tools, calculators and converters, and a resume builder.',
    },
    bn: {
      q: 'ToolGhor এ কী কী টুল আছে?',
      a: '6টি category তে 27টি ফ্রি টুল — PDF টুল, image টুল, QR টুল, video ও audio টুল, calculator ও converter, এবং resume builder।',
    },
  },
  {
    en: {
      q: 'Does ToolGhor work on mobile phones?',
      a: 'Yes — every tool works in your mobile browser. There is nothing to install; just open the site and use the tool you need.',
    },
    bn: {
      q: 'ToolGhor কি মোবাইল ফোনে কাজ করে?',
      a: 'হ্যাঁ — প্রতিটি টুল আপনার মোবাইল ব্রাউজারেই কাজ করে। কিছু install করতে হয় না; সাইট খুলেই প্রয়োজনীয় টুল ব্যবহার করুন।',
    },
  },
  {
    en: {
      q: 'Can I use ToolGhor in Bangla?',
      a: 'Yes — use the language option in the header to switch the whole site between English and বাংলা at any time.',
    },
    bn: {
      q: 'ToolGhor কি বাংলায় ব্যবহার করা যায়?',
      a: 'হ্যাঁ — header এর language অপশন দিয়ে যেকোনো সময় পুরো সাইট English ও বাংলার মধ্যে বদলে নিতে পারবেন।',
    },
  },
];
export const HOME_FAQ = GENERAL_FAQ;

