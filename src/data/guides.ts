import { FaqItem } from './seoData';

export interface GuideSection {
  heading: { en: string; bn: string };
  paragraphs?: { en: string[]; bn: string[] };   // plain paragraphs
  bullets?: { en: string[]; bn: string[] };       // bullet list
  steps?: { en: string[]; bn: string[] };         // numbered steps
  paragraphsAfter?: { en: string[]; bn: string[] }; // paragraphs after bullets or steps
  cta?: { toolSlug: string; label: { en: string; bn: string } }; // button after this section
}

export interface Guide {
  slug: string;
  metaTitle: string;          // EN, used for <title> + OG
  metaDescription: string;    // used for meta + OG description
  title: { en: string; bn: string };      // H1
  excerpt: { en: string; bn: string };    // index card text
  intro: { en: string[]; bn: string[] };  // paragraphs before section 1
  sections: GuideSection[];
  faq: FaqItem[];                          // reuse the FaqItem type from seoData.ts
  relatedTools: string[];                  // tool slugs for the final CTA card
  datePublished: string;                   // '2026-10-23'
}

export const GUIDES: Guide[] = [
  {
    slug: 'photo-size-for-online-application',
    metaTitle: 'Photo Size for Online Applications in Bangladesh — 100 KB & 200 KB Rules | ToolGhor',
    metaDescription:
      'Why application forms reject your photo, the 100 KB / 200 KB and 300×300 rules used in Bangladesh, and how to fix your photo size free in your browser.',
    title: {
      en: 'Photo Size for Online Applications in Bangladesh — the 100 KB & 200 KB Rules Explained',
      bn: 'বাংলাদেশে অনলাইন আবেদনের জন্য ছবির সাইজ — 100 KB ও 200 KB এর নিয়ম সহজে বোঝা',
    },
    excerpt: {
      en: 'Why forms reject your photo, the 100 KB / 200 KB and 300×300 pixel rules used in Bangladesh, and how to fix your photo size in under a minute — free.',
      bn: 'ফর্ম কেন আপনার ছবি reject করে, বাংলাদেশে ব্যবহৃত 100 KB / 200 KB ও 300×300 pixel এর নিয়ম, আর এক মিনিটেই ফ্রি ছবির সাইজ ঠিক করার উপায়।',
    },
    relatedTools: ['compress-image', 'resize-image', 'passport-photo'],
    datePublished: '2026-10-23',
    intro: {
      en: [
        'You fill in the whole application form, click submit — and it fails: "Photo size must be under 100 KB." Almost everyone applying for a government job, university admission, a bank account or a visa in Bangladesh has hit this wall. The good news: your photo is not wrong, it is just too big — and fixing it takes under a minute, free, right in your browser. This guide explains the rules forms actually use, and shows you exactly how to meet them.',
      ],
      bn: [
        'পুরো আবেদন ফর্ম পূরণ করে submit চাপলেন — আর error: "ছবির সাইজ 100 KB এর নিচে হতে হবে।" সরকারি চাকরি, বিশ্ববিদ্যালয় ভর্তি, ব্যাংক অ্যাকাউন্ট কিংবা ভিসা — বাংলাদেশে আবেদন করতে গিয়ে প্রায় সবাই এই সমস্যায় পড়েছেন। সুখবর হলো: আপনার ছবিতে ভুল নেই, সাইজটাই শুধু বড় — আর সেটা ঠিক করতে এক মিনিটও লাগে না, সম্পূর্ণ ফ্রি, আপনার ব্রাউজারেই। এই গাইডে ফর্মগুলো আসলে কোন নিয়ম ব্যবহার করে তা ব্যাখ্যা করা হয়েছে, আর ঠিক কীভাবে সেই নিয়ম মিলিয়ে ছবি তৈরি করবেন তা ধাপে ধাপে দেখানো হয়েছে।',
      ],
    },
    sections: [
      {
        heading: {
          en: 'Two different rules — file size and dimensions',
          bn: 'দুটি আলাদা নিয়ম — ফাইল সাইজ ও ডাইমেনশন',
        },
        paragraphs: {
          en: ['Forms judge your photo by two separate things, and both must match:'],
          bn: ['ফর্ম আপনার ছবিকে দুটি আলাদা মাপে যাচাই করে, আর দুটোই মিলতে হয়:'],
        },
        bullets: {
          en: [
            'File size — how heavy the file is, measured in KB (for example "maximum 100 KB").',
            'Dimensions — how wide and tall the picture is, measured in pixels (for example 300 × 300 px) or millimetres (for example 35 × 45 mm for passport size).',
            'A photo can pass one rule and fail the other. Always read your circular or the form\'s instructions and match both numbers.',
          ],
          bn: [
            'ফাইল সাইজ — ফাইলটি কত KB (যেমন "সর্বোচ্চ 100 KB")।',
            'ডাইমেনশন — ছবি কতটা চওড়া ও লম্বা, pixel এ (যেমন 300 × 300 px) অথবা মিলিমিটারে (যেমন পাসপোর্ট সাইজ 35 × 45 mm)।',
            'একটা নিয়ম মিললেও অন্যটা না মিললে ছবি reject হতে পারে। তাই সবসময় আপনার বিজ্ঞপ্তি বা ফর্মের নির্দেশনা পড়ে দুটি সংখ্যাই মিলিয়ে নিন।',
          ],
        },
      },
      {
        heading: {
          en: 'The rules most Bangladeshi forms actually use',
          bn: 'বাংলাদেশের ফর্মগুলোতে সাধারণত যেসব নিয়ম থাকে',
        },
        paragraphs: {
          en: [
            'These are the most common requirements — always confirm the exact numbers in your own circular, because each authority can set its own:',
          ],
          bn: [
            'নিচেরগুলো সবচেয়ে প্রচলিত — তবে প্রতিটি কর্তৃপক্ষ নিজের মতো নিয়ম দিতে পারে, তাই নিজের বিজ্ঞপ্তির সংখ্যাগুলো অবশ্যই মিলিয়ে দেখুন:',
          ],
        },
        bullets: {
          en: [
            'Government job applications (Teletalk system): photo 300 × 300 pixels, JPG, maximum 100 KB. Signature 300 × 80 pixels, maximum 60 KB.',
            'University admission: usually a JPG photo, maximum 100 KB (some universities allow up to 200 KB).',
            'Passport / e-passport and many visa applications: a 35 × 45 mm passport-size photo with a plain background.',
            'Bank, NGO and private job portals: commonly maximum 200 KB, JPG or PNG.',
            'If your form only says a KB limit and no dimensions, you only need to fix the file size — the next sections are for you.',
          ],
          bn: [
            'সরকারি চাকরির আবেদন (টেলিটক সিস্টেম): ছবি 300 × 300 pixel, JPG, সর্বোচ্চ 100 KB। স্বাক্ষর 300 × 80 pixel, সর্বোচ্চ 60 KB।',
            'বিশ্ববিদ্যালয় ভর্তি: সাধারণত JPG ছবি, সর্বোচ্চ 100 KB (কিছু বিশ্ববিদ্যালয়ে 200 KB পর্যন্ত চলে)।',
            'পাসপোর্ট / ই-পাসপোর্ট ও অনেক ভিসা আবেদন: সাদামাটা background সহ 35 × 45 mm পাসপোর্ট সাইজ ছবি।',
            'ব্যাংক, NGO ও বেসরকারি চাকরির পোর্টাল: সাধারণত সর্বোচ্চ 200 KB, JPG বা PNG।',
            'আপনার ফর্মে যদি শুধু KB এর সীমা থাকে, ডাইমেনশন না থাকে — তাহলে শুধু ফাইল সাইজ ঠিক করলেই হবে। পরের অংশগুলো আপনার জন্যই।',
          ],
        },
      },
      {
        heading: {
          en: "First, check your photo's current size",
          bn: 'প্রথমে দেখুন আপনার ছবির বর্তমান সাইজ কত',
        },
        paragraphs: {
          en: [
            'On a phone: open the photo in your gallery, tap Details/Info — you will see the file size and dimensions. On a computer: right-click the file → Properties (Windows) or Get Info (Mac). If the size is above the form\'s limit, reduce it with the steps below.',
          ],
          bn: [
            'ফোনে: gallery তে ছবি খুলে Details/Info তে যান — ফাইল সাইজ ও ডাইমেনশন দেখতে পাবেন। কম্পিউটারে: ফাইলে right-click → Properties (Windows) অথবা Get Info (Mac)। সাইজ ফর্মের সীমার বেশি হলে নিচের ধাপে কমিয়ে নিন।',
          ],
        },
      },
      {
        heading: {
          en: 'How to make your photo exactly 100 KB (or 200 KB)',
          bn: 'ছবিকে ঠিক 100 KB (বা 200 KB) করবেন যেভাবে',
        },
        steps: {
          en: [
            'Open the free Compress Image tool on ToolGhor.',
            'Upload your photo.',
            'Choose the target KB option and type the limit from your form — 100, 200, or whatever it asks for.',
            'Download the result and check its size once — it will be at or under your target.',
          ],
          bn: [
            'ToolGhor এর ফ্রি Compress Image টুলটি খুলুন।',
            'আপনার ছবি আপলোড করুন।',
            'target KB অপশন বেছে নিয়ে ফর্মে দেওয়া সীমাটা লিখুন — 100, 200, বা যা চাওয়া হয়েছে।',
            'Download করে সাইজটা একবার দেখে নিন — ফাইলটি আপনার টার্গেটের সমান বা নিচে থাকবে।',
          ],
        },
        paragraphs: {
          en: ['Your photo is processed in your browser, so it never leaves your device.'],
          bn: ['ছবিটি আপনার ব্রাউজারেই প্রসেস হয়, তাই তা আপনার ডিভাইসের বাইরে যায় না।'],
        },
        cta: {
          toolSlug: 'compress-image',
          label: {
            en: 'Compress your photo to 100 KB →',
            bn: 'ছবি 100 KB তে কমান →',
          },
        },
      },
      {
        heading: {
          en: 'How to set exact dimensions, like 300 × 300 pixels',
          bn: 'নির্দিষ্ট ডাইমেনশন (যেমন 300 × 300 pixel) সেট করবেন যেভাবে',
        },
        steps: {
          en: [
            'Open the Resize Image tool.',
            'Upload your photo and enter the width and height in pixels from your form (for example 300 × 300).',
            'Download the resized photo.',
            'If the form has both a pixel size and a KB limit: resize first, then run the result through Compress Image to hit the KB target.',
          ],
          bn: [
            'Resize Image টুলটি খুলুন।',
            'ছবি আপলোড করে ফর্মে দেওয়া width ও height pixel এ লিখুন (যেমন 300 × 300)।',
            'Resize করা ছবি ডাউনলোড করুন।',
            'ফর্মে pixel ও KB দুটোই চাইলে: আগে resize করুন, তারপর সেই ফাইলটি Compress Image দিয়ে KB টার্গেটে নামান।',
          ],
        },
        cta: {
          toolSlug: 'resize-image',
          label: {
            en: 'Resize your photo to exact pixels →',
            bn: 'ছবির pixel সাইজ ঠিক করুন →',
          },
        },
      },
      {
        heading: {
          en: 'Need a passport-size photo instead?',
          bn: 'পাসপোর্ট সাইজ ছবি লাগলে',
        },
        paragraphs: {
          en: [
            'If the application asks for a 35 × 45 mm photo, use the Passport Photo tool: upload a straight photo taken in good light against a plain background, position your face in the frame, and download a correctly sized JPG. If that file then needs to be under 100 KB, finish with Compress Image.',
          ],
          bn: [
            'আবেদনে 35 × 45 mm ছবি চাইলে Passport Photo টুল ব্যবহার করুন: ভালো আলোতে সাদামাটা background এর সামনে তোলা ছবি আপলোড করুন, ফ্রেমে মুখ ঠিকমতো বসিয়ে সঠিক মাপের JPG ডাউনলোড করুন। সেই ফাইলটিও 100 KB এর নিচে লাগলে শেষে Compress Image দিয়ে কমিয়ে নিন।',
          ],
        },
        cta: {
          toolSlug: 'passport-photo',
          label: {
            en: 'Make a passport-size photo →',
            bn: 'পাসপোর্ট সাইজ ছবি বানান →',
          },
        },
      },
      {
        heading: {
          en: '5 tips so your photo is never rejected',
          bn: 'ছবি যাতে কখনো reject না হয় — ৫টি টিপস',
        },
        bullets: {
          en: [
            'Use JPG for photos. PNG files of the same photo are usually much heavier.',
            'Do not over-shrink. Going far below the limit (like 15 KB for a 100 KB limit) makes the photo blurry — aim just under the limit.',
            'Keep the original. Always keep an untouched copy of your photo; compress a copy, not the only file.',
            'Check after downloading. Look at the final file\'s size once before uploading it to the form.',
            'Match the background rules too. If the form asks for a white/plain background, resizing alone will not fix a busy background — take the photo against a plain wall.',
          ],
          bn: [
            'ছবির জন্য JPG ব্যবহার করুন। একই ছবির PNG ফাইল সাধারণত অনেক ভারী হয়।',
            'বেশি ছোট করে ফেলবেন না। সীমা 100 KB হলে 15 KB করে ফেললে ছবি ঝাপসা হয়ে যায় — সীমার একটু নিচে রাখুন।',
            'আসল ছবিটি সংরক্ষণ করুন। সবসময় original কপিটি রেখে দিন; compress করুন কপিতে।',
            'Download এর পর মিলিয়ে দেখুন। ফর্মে upload করার আগে শেষ ফাইলের সাইজটা একবার দেখে নিন।',
            'Background এর নিয়মও মিলিয়ে নিন। ফর্মে সাদা/সাদামাটা background চাইলে শুধু resize এ হবে না — সাদামাটা দেয়ালের সামনে ছবি তুলুন।',
          ],
        },
      },
    ],
    faq: [
      {
        en: {
          q: 'My photo is 300 × 300 but still rejected. Why?',
          a: "The dimensions are right but the file is probably still over the KB limit. Run it through Compress Image with the form's KB target.",
        },
        bn: {
          q: 'আমার ছবি 300 × 300, তবু reject হচ্ছে কেন?',
          a: 'ডাইমেনশন ঠিক আছে, কিন্তু ফাইল সম্ভবত KB সীমার উপরে। Compress Image এ ফর্মের KB টার্গেট দিয়ে কমিয়ে নিন।',
        },
      },
      {
        en: {
          q: 'Can I do all this on my phone?',
          a: 'Yes — every ToolGhor tool works in a mobile browser, with no app to install and no sign-up.',
        },
        bn: {
          q: 'ফোন দিয়েই কি সব করা যাবে?',
          a: 'হ্যাঁ — ToolGhor এর প্রতিটি টুল মোবাইল ব্রাউজারেই চলে, কোনো app install বা sign-up লাগে না।',
        },
      },
      {
        en: {
          q: 'Will compressing ruin my photo\'s quality?',
          a: 'Aiming just under the limit (like 95–100 KB for a 100 KB form) keeps the photo looking clear. Only extreme shrinking to very small sizes softens it.',
        },
        bn: {
          q: 'Compress করলে কি ছবির quality নষ্ট হয়ে যাবে?',
          a: 'সীমার একটু নিচে (যেমন 100 KB এর ফর্মে 95–100 KB) রাখলে ছবি পরিষ্কারই থাকে। শুধু অতিরিক্ত ছোট করলেই ছবি নরম হয়ে যায়।',
        },
      },
      {
        en: {
          q: 'The form asks for a signature of 300 × 80 px and 60 KB. Same method?',
          a: 'Yes — write your signature on white paper, photograph it straight-on, set 300 × 80 in Resize Image, then compress to 60 KB.',
        },
        bn: {
          q: 'স্বাক্ষরের ক্ষেত্রে 300 × 80 px ও 60 KB চাইছে — একই পদ্ধতি?',
          a: 'হ্যাঁ — সাদা কাগজে স্বাক্ষর করে সোজাভাবে ছবি তুলুন, Resize Image এ 300 × 80 সেট করুন, তারপর 60 KB তে compress করুন।',
        },
      },
    ],
  },
  {
    slug: 'land-measurement-bangladesh',
    metaTitle: 'Katha, Bigha, Decimal — Land Measurement in Bangladesh Explained | ToolGhor',
    metaDescription:
      '1 Katha = how many square feet? 1 Bigha = how many Katha? Land measurement in Bangladesh explained simply — Katha, Bigha, Decimal, Acre and square feet.',
    title: {
      en: 'Katha, Bigha, Decimal — Land Measurement in Bangladesh Explained',
      bn: 'কাঠা, বিঘা, শতাংশ — বাংলাদেশে জমির মাপ সহজে বোঝা',
    },
    excerpt: {
      en: 'How much land is a 5 Katha plot or a 12.5 Decimal deed? Every common conversion — Katha, Bigha, Decimal, Acre, square feet — explained in plain language.',
      bn: '৫ কাঠা প্লট বা ১২.৫ শতাংশের দলিল মানে আসলে কতটা জমি? কাঠা, বিঘা, শতাংশ, একর ও বর্গফুটের সব প্রচলিত রূপান্তর — সহজ ভাষায়।',
    },
    relatedTools: ['unit-converter'],
    datePublished: '2026-10-23',
    intro: {
      en: [
        'A plot is "5 Katha", a deed says "12.5 Decimal", a village field is "2 Bigha" — but how much land is that, really? Bangladesh uses several traditional land units side by side, and nobody explains them in one place. This guide gives you every common conversion in plain language, shows how the units connect, and warns you about the one trap that catches buyers: the same unit can mean a different size in a different district.',
      ],
      bn: [
        'প্লট "৫ কাঠা", দলিলে লেখা "১২.৫ শতাংশ", গ্রামের জমি "২ বিঘা" — কিন্তু আসলে কতটা জমি? বাংলাদেশে পাশাপাশি অনেকগুলো ঐতিহ্যবাহী জমির একক ব্যবহৃত হয়, আর সেগুলো একসাথে গুছিয়ে কোথাও বলা থাকে না। এই গাইডে সহজ ভাষায় সব প্রচলিত রূপান্তর দেওয়া হলো, এককগুলো কীভাবে যুক্ত তা দেখানো হলো, আর ক্রেতারা যে একটা ফাঁদে পড়েন সে বিষয়ে সতর্ক করা হলো: একই একক ভিন্ন জেলায় ভিন্ন মাপের হতে পারে।',
      ],
    },
    sections: [
      {
        heading: {
          en: 'The units at a glance',
          bn: 'এক নজরে সব একক',
        },
        bullets: {
          en: [
            '1 Katha = 720 square feet = 1.65 Decimal',
            '1 Bigha = 20 Katha = 14,400 square feet = 33.06 Decimal',
            '1 Decimal (also called Shotangsho or Shotok) = 435.6 square feet',
            '1 Acre = 100 Decimal = 43,560 square feet = 60.5 Katha = about 3.02 Bigha',
            '1 Katha = 66.89 square metres',
          ],
          bn: [
            '১ কাঠা = ৭২০ বর্গফুট = ১.৬৫ শতাংশ',
            '১ বিঘা = ২০ কাঠা = ১৪,৪০০ বর্গফুট = ৩৩.০৬ শতাংশ',
            '১ শতাংশ (শতক নামেও পরিচিত) = ৪৩৫.৬ বর্গফুট',
            '১ একর = ১০০ শতাংশ = ৪৩,৫৬০ বর্গফুট = ৬০.৫ কাঠা = প্রায় ৩.০২ বিঘা',
            '১ কাঠা = ৬৬.৮৯ বর্গমিটার',
          ],
        },
        paragraphsAfter: {
          en: [
            "These are the standard values used in Dhaka and most of Bangladesh — the same values ToolGhor's Unit Converter uses.",
          ],
          bn: [
            'এগুলো ঢাকাসহ বাংলাদেশের বেশিরভাগ এলাকায় ব্যবহৃত মানক মান — ToolGhor এর Unit Converter ও এই মানগুলোই ব্যবহার করে।',
          ],
        },
      },
      {
        heading: {
          en: 'Katha — the plot unit',
          bn: 'কাঠা — প্লটের একক',
        },
        paragraphs: {
          en: [
            'In Dhaka and other cities, residential plots are almost always sold in Katha. Common RAJUK and private plot sizes are 3 Katha (2,160 sq ft), 5 Katha (3,600 sq ft) and 7.5 Katha (5,400 sq ft). When someone says a flat is built on a "5 Katha plot", this is the Katha they mean.',
          ],
          bn: [
            'ঢাকাসহ শহর এলাকায় আবাসিক প্লট প্রায় সবসময় কাঠায় বিক্রি হয়। রাজউক ও বেসরকারি প্লটের প্রচলিত মাপ ৩ কাঠা (২,১৬০ বর্গফুট), ৫ কাঠা (৩,৬০০ বর্গফুট) ও ৭.৫ কাঠা (৫,৪০০ বর্গফুট)। কেউ যখন বলে ফ্ল্যাটটা "৫ কাঠা প্লটে" তৈরি, এই কাঠার কথাই বলে।',
          ],
        },
      },
      {
        heading: {
          en: 'Decimal and Acre — the deed units',
          bn: 'শতাংশ ও একর — দলিলের একক',
        },
        paragraphs: {
          en: [
            'Official land records — deeds (dolil) and khatians — are written in Decimal and Acre, not Katha. Decimal is also called Shotangsho (শতাংশ) or Shotok; they are the same unit. 100 Decimal makes exactly 1 Acre, which is why "Decimal" (hundredth) has that name. If you are buying city land quoted in Katha, expect the deed to state the same land in Decimal — 5 Katha will appear as about 8.26 Decimal in the deed (5 × 1.65).',
          ],
          bn: [
            'সরকারি জমির রেকর্ড — দলিল ও খতিয়ান — লেখা হয় শতাংশ ও একরে, কাঠায় নয়। শতাংশকে শতকও বলা হয়; দুটি একই একক। ১০০ শতাংশে ঠিক ১ একর — "শতাংশ" নামটা এসেছে এখান থেকেই। শহরে কাঠায় কেনা জমির দলিলে ওই একই জমি শতাংশে লেখা থাকবে — ৫ কাঠা দলিলে দেখা যাবে প্রায় ৮.২৬ শতাংশ হিসেবে (৫ × ১.৬৫)।',
          ],
        },
      },
      {
        heading: {
          en: 'Bigha — the village unit',
          bn: 'বিঘা — গ্রামের একক',
        },
        paragraphs: {
          en: [
            'In villages and for agricultural land, Bigha is the everyday unit. 1 Bigha = 20 Katha = 14,400 square feet, roughly one-third of an Acre (3.02 Bigha ≈ 1 Acre). A "2 Bigha field" is about 28,800 square feet.',
          ],
          bn: [
            'গ্রামে ও কৃষি জমির ক্ষেত্রে বিঘাই প্রচলিত একক। ১ বিঘা = ২০ কাঠা = ১৪,৪০০ বর্গফুট, প্রায় এক একরের তিন ভাগের এক ভাগ (৩.০২ বিঘা ≈ ১ একর)। "২ বিঘা জমি" মানে প্রায় ২৮,৮০০ বর্গফুট।',
          ],
        },
      },
      {
        heading: {
          en: 'How to convert — with two worked examples',
          bn: 'রূপান্তর করবেন যেভাবে — দুটি উদাহরণসহ',
        },
        steps: {
          en: [
            "Open ToolGhor's free Unit Converter.",
            'Choose the Land / area category.',
            'Enter your amount, pick the From and To units, and read the result.',
          ],
          bn: [
            'ToolGhor এর ফ্রি Unit Converter খুলুন।',
            'Land / area category বেছে নিন।',
            'পরিমাণ লিখে From ও To একক বেছে নিলেই ফলাফল পাবেন।',
          ],
        },
        bullets: {
          en: [
            'Example 1: A 5 Katha plot in square feet → 5 × 720 = 3,600 sq ft.',
            'Example 2: A deed says 10 Decimal — how many Katha? → 10 × 435.6 = 4,356 sq ft ÷ 720 = 6.05 Katha.',
          ],
          bn: [
            'উদাহরণ ১: ৫ কাঠা প্লট বর্গফুটে → ৫ × ৭২০ = ৩,৬০০ বর্গফুট।',
            'উদাহরণ ২: দলিলে ১০ শতাংশ — কত কাঠা? → ১০ × ৪৩৫.৬ = ৪,৩৫৬ বর্গফুট ÷ ৭২০ = ৬.০৫ কাঠা।',
          ],
        },
        cta: {
          toolSlug: 'unit-converter',
          label: {
            en: 'Convert Katha, Bigha, Decimal →',
            bn: 'কাঠা, বিঘা, শতাংশ রূপান্তর করুন →',
          },
        },
      },
      {
        heading: {
          en: 'Careful — the same unit is not the same everywhere',
          bn: 'সাবধান — একই একক সব জায়গায় এক নয়',
        },
        paragraphs: {
          en: [
            "Katha and Bigha sizes vary by region. The values in this guide are the Dhaka standard. In the Chattogram region, land is traditionally measured in Kani and Gonda (1 Kani = 20 Gonda = 17,280 sq ft), and some districts use local variations of Katha and Bigha. ToolGhor's converter uses the Dhaka standard (1 Katha = 720 sq ft) and says so on the tool. For a deed, registration, or a purchase, always confirm which local standard applies and match the deed's own numbers.",
          ],
          bn: [
            'কাঠা ও বিঘার মাপ এলাকাভেদে বদলায়। এই গাইডের মানগুলো ঢাকার মানক মান। চট্টগ্রাম অঞ্চলে জমি ঐতিহ্যগতভাবে কানি ও গোন্ডায় মাপা হয় (১ কানি = ২০ গোন্ডা = ১৭,২৮০ বর্গফুট), আর কোনো কোনো জেলায় কাঠা-বিঘার স্থানীয় ভিন্ন মাপ চলে। ToolGhor এর converter ঢাকার মান (১ কাঠা = ৭২০ বর্গফুট) ব্যবহার করে এবং টুলে তা বলাও আছে। দলিল, রেজিস্ট্রি বা কেনার ক্ষেত্রে সবসময় কোন স্থানীয় মান প্রযোজ্য তা নিশ্চিত করুন এবং দলিলের নিজের সংখ্যার সাথে মিলিয়ে নিন।',
          ],
        },
      },
      {
        heading: {
          en: 'Before you buy land — 4 quick checks',
          bn: 'জমি কেনার আগে — ৪টি যাচাই',
        },
        bullets: {
          en: [
            'Ask which unit the price is quoted in — and convert it to square feet yourself before comparing two plots.',
            'Read the deed/khatian in Decimal and convert to Katha (or sq ft) to confirm it matches what the seller claims.',
            'Confirm the local standard for Katha/Bigha in that district.',
            'Measure the plot and compare with the paper: 1 Katha must equal 720 sq ft of actual land (Dhaka standard).',
          ],
          bn: [
            'দাম কোন এককে বলা হচ্ছে জিজ্ঞেস করুন — আর দুটি প্লট তুলনা করার আগে নিজে বর্গফুটে রূপান্তর করে নিন।',
            'দলিল/খতিয়ান শতাংশে পড়ে কাঠা (বা বর্গফুট) এ রূপান্তর করে দেখুন বিক্রেতার দাবির সাথে মেলে কিনা।',
            'ওই জেলায় কাঠা/বিঘার স্থানীয় মান কোনটা, নিশ্চিত করুন।',
            'প্লট মেপে কাগজের সাথে মিলিয়ে দেখুন: ১ কাঠা মানেই ৭২০ বর্গফুট প্রকৃত জমি (ঢাকার মানে)।',
          ],
        },
      },
    ],
    faq: [
      {
        en: {
          q: 'How many square feet is 1 Katha?',
          a: '720 square feet, in the standard used in Dhaka and most of Bangladesh. Some regions use a different Katha, so for deeds always confirm the local standard.',
        },
        bn: {
          q: '১ কাঠা সমান কত বর্গফুট?',
          a: '৭২০ বর্গফুট — ঢাকাসহ বাংলাদেশের বেশিরভাগ এলাকায় ব্যবহৃত মানে। কিছু এলাকায় কাঠার মাপ আলাদা, তাই দলিলের ক্ষেত্রে সবসময় স্থানীয় মান নিশ্চিত করুন।',
        },
      },
      {
        en: {
          q: 'How many Katha and Decimal in 1 Bigha?',
          a: '1 Bigha = 20 Katha = 33.06 Decimal (14,400 square feet).',
        },
        bn: {
          q: '১ বিঘায় কত কাঠা ও কত শতাংশ?',
          a: '১ বিঘা = ২০ কাঠা = ৩৩.০৬ শতাংশ (১৪,৪০০ বর্গফুট)।',
        },
      },
      {
        en: {
          q: 'Are Decimal, Shotangsho and Shotok the same?',
          a: 'Yes — three names for the same unit: 435.6 square feet. 100 Decimal = 1 Acre.',
        },
        bn: {
          q: 'শতাংশ আর শতক কি একই?',
          a: 'হ্যাঁ — একই এককের দুটি নাম: ৪৩৫.৬ বর্গফুট। ১০০ শতাংশ = ১ একর।',
        },
      },
      {
        en: {
          q: 'Is a Katha the same size everywhere in Bangladesh?',
          a: 'No. The 720 sq ft Katha is the Dhaka standard; some regions use different local measures (for example Kani and Gonda in Chattogram). Always check which standard a deed or seller is using.',
        },
        bn: {
          q: 'কাঠা কি বাংলাদেশের সব জায়গায় একই মাপের?',
          a: 'না। ৭২০ বর্গফুটের কাঠা ঢাকার মানক মান; কোনো কোনো অঞ্চলে ভিন্ন স্থানীয় মাপ ব্যবহৃত হয় (যেমন চট্টগ্রামে কানি ও গোন্ডা)। দলিল বা বিক্রেতা কোন মান ব্যবহার করছেন, সবসময় যাচাই করুন।',
        },
      },
    ],
  },
  {
    slug: 'passport-photo-at-home',
    metaTitle: 'How to Make a Passport-Size Photo at Home with Your Phone | ToolGhor',
    metaDescription:
      'Make a correct 35 × 45 mm passport-size photo at home with your phone — shooting tips, exact cropping, and fixes for KB limits. No studio needed.',
    title: {
      en: 'How to Make a Passport-Size Photo at Home with Your Phone',
      bn: 'ঘরে বসে ফোন দিয়ে পাসপোর্ট সাইজ ছবি বানাবেন যেভাবে',
    },
    excerpt: {
      en: 'Skip the studio: shoot a clean photo against a plain wall, crop it to exactly 35 × 45 mm, and fix the KB limit — all from your phone.',
      bn: 'স্টুডিও ছাড়াই: সাদামাটা দেয়ালের সামনে পরিষ্কার ছবি তুলুন, ঠিক 35 × 45 mm মাপে crop করুন, KB সীমাও ঠিক করুন — সব ফোন থেকে।',
    },
    relatedTools: ['passport-photo', 'compress-image'],
    datePublished: '2026-10-23',
    intro: {
      en: [
        'A studio charges you for a few prints and a soft copy, and you still may not like the photo. But a passport-size photo is not magic — it is one specific size, a plain background, and a clear face. With a phone and five quiet minutes at home, you can make a photo that is every bit as correct. This guide walks you through it: how to shoot it, how to crop it to the exact millimetre, and how to fix the file size when a form also sets a KB limit.',
      ],
      bn: [
        'স্টুডিওতে গিয়ে কয়েকটি প্রিন্ট আর একটি soft copy এর জন্য টাকা দিতে হয়, তারপরও ছবিটা পছন্দ না-ও হতে পারে। কিন্তু পাসপোর্ট সাইজ ছবি কোনো জাদু নয় — এটি একটি নির্দিষ্ট মাপ, একটি সাদামাটা background, আর একটি পরিষ্কার মুখ। ফোন আর মাত্র পাঁচ মিনিট সময় থাকলে বাড়িতেই একদম সঠিক মাপের ছবি বানানো যায়। এই গাইডে ধাপে ধাপে দেখানো হলো: কীভাবে ছবি তুলবেন, কীভাবে ঠিক মিলিমিটার মাপে crop করবেন, আর ফর্মে KB সীমা থাকলে ফাইলের সাইজ কীভাবে ঠিক করবেন।',
      ],
    },
    sections: [
      {
        heading: {
          en: 'First, what exactly is "passport size"?',
          bn: 'আগে জানুন — "পাসপোর্ট সাইজ" মানে ঠিক কত?',
        },
        bullets: {
          en: [
            '35 × 45 mm — the standard passport photo size used in Bangladesh and most countries.',
            'At print quality (300 DPI) that is about 413 × 531 pixels.',
            'Used for: passport and e-passport applications, many visas, and job or admission forms that ask for a "passport-size photograph".',
            'It is a crop, not a special camera: the photo must show your head and shoulders, face centred, at exactly this ratio.',
            'One exception to know: a US visa photo is 2 × 2 inches (51 × 51 mm) — a different size. Always check your application\'s exact requirement first.',
          ],
          bn: [
            '35 × 45 mm — বাংলাদেশসহ বেশিরভাগ দেশে ব্যবহৃত মানক পাসপোর্ট ছবির মাপ।',
            'Print quality তে (300 DPI) এটি প্রায় 413 × 531 pixel।',
            'যেখানে লাগে: পাসপোর্ট ও ই-পাসপোর্ট আবেদন, অনেক ভিসা, আর চাকরি বা ভর্তির ফর্মে যেখানে "passport-size photograph" চাওয়া হয়।',
            'এটি একটি crop, কোনো বিশেষ ক্যামেরা নয়: ছবিতে আপনার মাথা ও কাঁধ থাকবে, মুখ থাকবে মাঝখানে, ঠিক এই অনুপাতে।',
            'একটি ব্যতিক্রম জেনে রাখুন: আমেরিকান (US) ভিসার ছবি 2 × 2 inch (51 × 51 mm) — আলাদা মাপ। আবেদনের আগে সবসময় আপনার আবেদনের সঠিক মাপটা দেখে নিন।',
          ],
        },
      },
      {
        heading: {
          en: 'Before you shoot — a 2-minute setup',
          bn: 'ছবি তোলার আগে — ২ মিনিটের প্রস্তুতি',
        },
        bullets: {
          en: [
            'A plain, light-coloured wall behind you — white or off-white is best; move anything hanging on it out of frame.',
            'Daylight: stand facing a window so light falls evenly on your face. Avoid a bright window behind you (your face will go dark) and harsh sunlight from one side (half-shadow).',
            'A formal or plain shirt — the photo will be used officially for years.',
            'Your phone\'s rear camera if someone can help you, or the front camera with a timer. Turn beauty mode and filters OFF.',
            'Glasses off if they reflect light or hide your eyes; a neutral expression, mouth closed, both eyes open, head straight.',
          ],
          bn: [
            'পেছনে একটি সাদামাটা, হালকা রঙের দেয়াল — সাদা বা অফ-হোয়াইট সবচেয়ে ভালো; দেয়ালে ঝোলানো জিনিস ফ্রেমের বাইরে রাখুন।',
            'দিনের আলো: জানালার দিকে মুখ করে দাঁড়ান যাতে আলো সমানভাবে মুখে পড়ে। পেছনে উজ্জ্বল জানালা থাকলে মুখ অন্ধকার দেখাবে, আর একপাশ থেকে কড়া রোদ এলে মুখে অর্ধেক ছায়া পড়বে — দুটোই এড়িয়ে চলুন।',
            'ফরমাল বা সাদামাটা শার্ট — ছবিটি বছরের পর বছর অফিসিয়াল কাজে ব্যবহৃত হবে।',
            'কেউ সাহায্য করতে পারলে ফোনের পেছনের ক্যামেরা, নাহলে timer দিয়ে সামনের ক্যামেরা। Beauty mode ও filter বন্ধ রাখুন।',
            'চশমা আলো reflect করলে বা চোখ ঢাকলে খুলে ফেলুন; স্বাভাবিক অভিব্যক্তি, মুখ বন্ধ, দুই চোখ খোলা, মাথা সোজা।',
          ],
        },
      },
      {
        heading: {
          en: 'How to take the photo',
          bn: 'ছবিটি তুলবেন যেভাবে',
        },
        steps: {
          en: [
            'Stand about half a metre in front of the plain wall — not touching it, so no shadow falls on it.',
            'Hold the phone at eye level, about one metre away, and frame your head and shoulders with some space above your head.',
            'Look straight at the lens, keep your head level — not tilted up, down, or to a side.',
            'Take 4–5 shots and pick the sharpest one with even light on both sides of your face.',
          ],
          bn: [
            'সাদামাটা দেয়ালের প্রায় আধা মিটার সামনে দাঁড়ান — দেয়ালে গা লাগিয়ে নয়, যাতে দেয়ালে ছায়া না পড়ে।',
            'ফোনটি চোখের সমান উচ্চতায়, প্রায় এক মিটার দূরে ধরুন, আর মাথার উপরে কিছুটা জায়গা রেখে মাথা ও কাঁধ ফ্রেমে নিন।',
            'সোজা লেন্সের দিকে তাকান, মাথা সমান রাখুন — উপরে, নিচে বা পাশে হেলিয়ে নয়।',
            '৪–৫টি ছবি তুলে তার মধ্যে সবচেয়ে ঝকঝকে ও মুখের দুই পাশে সমান আলো আছে এমনটি বেছে নিন।',
          ],
        },
      },
      {
        heading: {
          en: 'Crop it to exact passport size',
          bn: 'ছবিটি ঠিক পাসপোর্ট মাপে crop করুন',
        },
        steps: {
          en: [
            "Open ToolGhor's free Passport Photo tool.",
            'Upload the photo you picked.',
            'Position and zoom your face inside the guide frame — eyes on the guide line, head centred.',
            'Download the JPG — it is cropped to exactly 35 × 45 mm.',
          ],
          bn: [
            'ToolGhor এর ফ্রি Passport Photo টুলটি খুলুন।',
            'বেছে নেওয়া ছবিটি আপলোড করুন।',
            'Guide frame এর ভিতরে মুখ বসান ও zoom করুন — চোখ guide line এ, মাথা মাঝখানে রাখুন।',
            'JPG ডাউনলোড করুন — এটি ঠিক 35 × 45 mm মাপে crop হয়ে যাবে।',
          ],
        },
        paragraphs: {
          en: ['Your photo is processed in your browser and never leaves your device.'],
          bn: ['ছবিটি আপনার ব্রাউজারেই প্রসেস হয়, ডিভাইসের বাইরে যায় না।'],
        },
        cta: {
          toolSlug: 'passport-photo',
          label: {
            en: 'Make your passport-size photo →',
            bn: 'পাসপোর্ট সাইজ ছবি বানান →',
          },
        },
      },
      {
        heading: {
          en: 'Form also says "maximum 100 KB"?',
          bn: 'ফর্মে "সর্বোচ্চ 100 KB" ও বলা আছে?',
        },
        paragraphs: {
          en: [
            'Many online forms accept the passport photo only under a file-size limit. If your downloaded JPG is too heavy: open Compress Image, upload it, set the target KB from the form (like 100), and download. The dimensions stay exactly the same; only the file weight drops.',
          ],
          bn: [
            'অনেক অনলাইন ফর্ম পাসপোর্ট ছবি নেয় শুধু নির্দিষ্ট ফাইল সাইজের নিচে হলে। ডাউনলোড করা JPG টি ভারী হলে: Compress Image খুলে ছবিটি আপলোড করুন, ফর্মের target KB (যেমন 100) সেট করে ডাউনলোড করুন। ডাইমেনশন হুবহু একই থাকবে; শুধু ফাইলের ওজন কমবে।',
          ],
        },
        cta: {
          toolSlug: 'compress-image',
          label: {
            en: 'Compress the photo to 100 KB →',
            bn: 'ছবি 100 KB তে কমান →',
          },
        },
      },
      {
        heading: {
          en: '6 mistakes that get passport photos rejected',
          bn: 'পাসপোর্ট ছবি reject হওয়ার ৬টি ভুল',
        },
        bullets: {
          en: [
            'Shadows on the face or on the wall behind you.',
            'A busy background — curtains, doors, furniture, other people.',
            'Head tilted, or looking away from the camera.',
            'Sunglasses, caps, or hair covering the eyes or face.',
            'An old or heavily edited photo — no beauty filters; officials compare it with your face.',
            'A blurry, dark, or pixelated photo — if it looks soft on your phone screen, retake it.',
          ],
          bn: [
            'মুখে বা পেছনের দেয়ালে ছায়া।',
            'ব্যস্ত background — পর্দা, দরজা, আসবাব, অন্য মানুষ।',
            'মাথা হেলানো, বা ক্যামেরার বাইরে তাকানো।',
            'সানগ্লাস, টুপি, বা চোখ-মুখ ঢাকা চুল।',
            'পুরনো বা বেশি edit করা ছবি — beauty filter নয়; কর্তৃপক্ষ ছবিটি আপনার মুখের সাথে মিলিয়ে দেখবে।',
            'ঝাপসা, অন্ধকার বা pixel ভাঙা ছবি — ফোনের screen এই নরম লাগলে আবার তুলুন।',
          ],
        },
      },
      {
        heading: {
          en: 'Printing your photo',
          bn: 'ছবি print করা',
        },
        paragraphs: {
          en: [
            'For online forms you only need the JPG. If you need physical prints, take the downloaded file to any studio or print shop and ask for 35 × 45 mm prints — the file is already the exact size, so they only print, no re-cropping. On a colour photo printer at home, print at 100% scale (never "fit to page").',
          ],
          bn: [
            'অনলাইন ফর্মের জন্য শুধু JPG ফাইলটাই লাগে। Physical print লাগলে ডাউনলোড করা ফাইলটি যেকোনো স্টুডিও বা print shop এ নিয়ে 35 × 45 mm print চাইলেই হবে — ফাইলটি আগেই ঠিক মাপে আছে, তাদের শুধু print করলেই হবে, নতুন করে crop করতে হবে না। বাসায় colour photo printer থাকলে 100% scale এ print করুন (কখনো "fit to page" নয়)।',
          ],
        },
      },
    ],
    faq: [
      {
        en: {
          q: 'Can a phone photo really be used for a passport application?',
          a: 'Yes — officials check the size, background, lighting and that it is a clear recent photo of you, not which device took it. A carefully taken phone photo meets all of these.',
        },
        bn: {
          q: 'ফোনের ছবি কি সত্যিই পাসপোর্ট আবেদনে চলবে?',
          a: 'হ্যাঁ — কর্তৃপক্ষ দেখে মাপ, background, আলো আর ছবিটি আপনার সাম্প্রতিক ও পরিষ্কার কিনা; কোন device এ তোলা তা নয়। যত্ন করে তোলা ফোনের ছবি এসব শর্ত পূরণ করে।',
        },
      },
      {
        en: {
          q: 'My background is not white. Will it work?',
          a: 'For most Bangladeshi applications a plain light background is accepted, but if your form specifically says white, shoot against a white wall or sheet. A busy background is the real problem — avoid it either way.',
        },
        bn: {
          q: 'আমার background সাদা নয়। চলবে?',
          a: 'বাংলাদেশের বেশিরভাগ আবেদনে সাদামাটা হালকা background ই গৃহীত হয়, তবে ফর্মে নির্দিষ্ট করে সাদা বলা থাকলে সাদা দেয়াল বা চাদরের সামনে ছবি তুলুন। আসল সমস্যা ব্যস্ত background — সেটা যেকোনোভাবেই এড়িয়ে চলুন।',
        },
      },
      {
        en: {
          q: 'How recent should the photo be?',
          a: 'Use a photo taken within the last 6 months that looks like you now — this is a common requirement for passport and visa photos.',
        },
        bn: {
          q: 'ছবিটি কতদিনের মধ্যে তোলা হতে হবে?',
          a: 'গত ৬ মাসের মধ্যে তোলা ছবি ব্যবহার করুন, যাতে ছবিতে আপনাকে এখনকার মতোই দেখায় — পাসপোর্ট ও ভিসা ছবির ক্ষেত্রে এটি একটি প্রচলিত শর্ত।',
        },
      },
      {
        en: {
          q: 'Do I need prints, or is the phone file enough?',
          a: 'Online applications need only the JPG file. Physical prints are needed only when a form asks you to attach printed copies — then print the same file at 35 × 45 mm.',
        },
        bn: {
          q: 'Print লাগবে, নাকি ফোনের ফাইলটাই যথেষ্ট?',
          a: 'অনলাইন আবেদনে শুধু JPG ফাইলটাই লাগে। Physical print দরকার শুধু যখন কোনো ফর্মে printed copy সংযুক্ত করতে বলা হয় — তখন একই ফাইল 35 × 45 mm এ print করলেই হবে।',
        },
      },
    ],
  },
  {
    slug: 'remove-ai-label-from-photo',
    metaTitle: 'How to Remove the AI Label from a Photo | ToolGhor',
    metaDescription:
      'Strip the hidden AI markers (C2PA, EXIF, XMP) that make Instagram, Facebook and TikTok show "Made with AI" — free, in your browser, no upload.',
    title: {
      en: 'How to Remove the AI Label from a Photo',
      bn: 'ছবি থেকে AI লেবেল সরাবেন যেভাবে',
    },
    excerpt: {
      en: 'Platforms read hidden markers inside photos and show "AI Info / Made with AI". Clean them out — free, in your browser, photo unchanged.',
      bn: 'ছবির ভেতরের লুকানো মার্কার দেখে প্ল্যাটফর্মগুলো "AI Info / Made with AI" লেবেল দেয়। সেগুলো সরিয়ে নিন — ফ্রি, আপনার ব্রাউজারেই, ছবি একই থাকবে।',
    },
    relatedTools: ['remove-ai-label'],
    datePublished: '2026-10-23',
    intro: {
      en: [
        'You post a photo, and Facebook or Instagram stamps an "AI Info" or "Made with AI" label on it. It looks wrong on your post — and it is not about what the photo shows. The label comes from hidden data inside the file. This guide explains where the label comes from, how to strip those hidden markers with a free tool that runs entirely in your browser, and — honestly — the cases where the label can still appear anyway.',
      ],
      bn: [
        'ছবি পোস্ট করলেন, আর ফেসবুক বা ইনস্টাগ্রাম সেটাতে "AI Info" বা "Made with AI" লেবেল বসিয়ে দিল। পোস্টে এটা দেখতে খারাপ লাগে — অথচ ব্যাপারটা ছবিতে কী আছে তা নিয়ে নয়। লেবেলটা আসে ফাইলের ভেতরের লুকানো তথ্য থেকে। এই গাইডে বোঝানো হলো লেবেলটা কোথা থেকে আসে, পুরোপুরি আপনার ব্রাউজারে চলা ফ্রি টুল দিয়ে সেই লুকানো মার্কার কীভাবে সরাবেন, আর — সততার সাথে — কোন ক্ষেত্রে লেবেল তাও আসতে পারে।',
      ],
    },
    sections: [
      {
        heading: {
          en: 'Why does a photo get an "AI Info" label?',
          bn: 'ছবিতে "AI Info" লেবেল আসে কেন?',
        },
        bullets: {
          en: [
            'Platforms (Instagram, Facebook, TikTok, and others) look for hidden markers inside a photo file — C2PA credentials, XMP, EXIF, IPTC data, and PNG text chunks.',
            'When you create or edit a photo with an AI tool, that tool embeds its own markers — that is how platforms "know" it was AI-made.',
            'Seeing those markers, the platform adds the "AI Info" / "Made with AI" label automatically.',
            'Note: some platforms also run their own AI classifiers on the image itself — metadata is only one of their signals.',
          ],
          bn: [
            'প্ল্যাটফর্মগুলো (ইনস্টাগ্রাম, ফেসবুক, টিকটকসহ আরও অনেক) ছবির ফাইলের ভেতরের লুকানো মার্কার দেখে — C2PA credential, XMP, EXIF, IPTC তথ্য, আর PNG text chunk।',
            'AI টুল দিয়ে ছবি বানালে বা এডিট করলে সেই টুল নিজের মার্কার বসিয়ে দেয় — এভাবেই প্ল্যাটফর্ম "বুঝতে পারে" ছবিটা AI দিয়ে বানানো।',
            'সেই মার্কার দেখলেই প্ল্যাটফর্ম স্বয়ংক্রিয়ভাবে "AI Info" / "Made with AI" লেবেল বসিয়ে দেয়।',
            'একটা কথা জেনে রাখুন: কিছু প্ল্যাটফর্ম ছবির ওপর নিজের AI classifier ও চালায় — metadata তাদের একমাত্র সংকেত নয়।',
          ],
        },
      },
      {
        heading: {
          en: 'What removing the metadata does — and does NOT do',
          bn: 'Metadata সরালে কী হয় — আর কী হয় না',
        },
        bullets: {
          en: [
            'Removing the hidden markers takes away the main signal platforms read — in most cases the label simply does not appear.',
            'It does NOT remove invisible pixel watermarks (for example Google\'s SynthID), which some AI tools embed inside the image pixels themselves.',
            'It does NOT fool a platform\'s own AI classifier, which judges the image content, not the file data.',
            'So: no tool anywhere can guarantee the label will never appear. Anyone promising that is misleading you — we say it plainly instead.',
          ],
          bn: [
            'লুকানো মার্কার সরিয়ে ফেললে প্ল্যাটফর্ম যে প্রধান সংকেত পড়ে সেটাই চলে যায় — বেশিরভাগ ক্ষেত্রে লেবেল আর আসেই না।',
            'এতে অদৃশ্য pixel watermark (যেমন গুগলের SynthID) সরবে না, যেটা কিছু AI টুল ছবির pixel এর ভেতরেই বসিয়ে দেয়।',
            'প্ল্যাটফর্মের নিজস্ব AI classifier কেও এটা ফাঁকি দিতে পারে না — সেটা ফাইলের তথ্য নয়, ছবির content বিচার করে।',
            'তাই: পৃথিবীর কোনো টুলই গ্যারান্টি দিতে পারে না যে লেবেল কখনো আসবে না। যে এটা প্রতিশ্রুতি দেয় সে আপনাকে ভুল বোঝাচ্ছে — আমরা বরং সত্যটাই বলি।',
          ],
        },
      },
      {
        heading: {
          en: 'How to clean a photo with ToolGhor',
          bn: 'ToolGhor দিয়ে ছবি পরিষ্কার করবেন যেভাবে',
        },
        steps: {
          en: [
            "Open ToolGhor's free Remove AI Label tool.",
            'Choose or drop one or more photos (JPG, PNG, WebP) — you can clean several at once.',
            'The tool automatically strips all AI labels and metadata, one photo at a time.',
            'Check the clean verification status shown for each photo.',
            'Download with one click.',
          ],
          bn: [
            'ToolGhor এর ফ্রি Remove AI Label টুলটি খুলুন।',
            'এক বা একাধিক ছবি বেছে নিন বা টেনে দিন (JPG, PNG, WebP) — একসাথে কয়েকটা পরিষ্কার করা যায়।',
            'টুলটি স্বয়ংক্রিয়ভাবে সব AI লেবেল ও metadata মুছে দেবে, একটা একটা করে।',
            'প্রতিটি ছবির পাশে clean verification status টি দেখে নিন।',
            'এক ক্লিকে ডাউনলোড করুন।',
          ],
        },
        paragraphs: {
          en: ['Your photo is processed 100% in your browser — the file is never uploaded to any server, and nobody else sees it.'],
          bn: ['ছবিটি ১০০% আপনার ব্রাউজারেই প্রসেস হয় — ফাইল কোনো সার্ভারে আপলোড হয় না, আর কেউ দেখেও না।'],
        },
        cta: {
          toolSlug: 'remove-ai-label',
          label: {
            en: 'Remove the AI label from your photo →',
            bn: 'ছবি থেকে AI লেবেল সরান →',
          },
        },
      },
      {
        heading: {
          en: 'After cleaning — check before you post',
          bn: 'পরিষ্কারের পর — পোস্ট করার আগে পরীক্ষা করুন',
        },
        paragraphs: {
          en: [
            'Do not send the cleaned photo straight to an important post. Upload it somewhere private first — a test post visible only to you — and check whether the "AI Info" label appears. If it still appears, the platform is detecting it through pixels or its own classifier, not metadata — re-cleaning will not change that. If no label appears, you are good to go.',
          ],
          bn: [
            'পরিষ্কার করা ছবিটা সরাসরি গুরুত্বপূর্ণ পোস্টে দেবেন না। আগে কোথাও private এ আপলোড করুন — শুধু আপনি দেখতে পান এমন একটি test post — আর দেখুন "AI Info" লেবেল আসে কিনা। তাও এলে বুঝবেন প্ল্যাটফর্ম pixel বা নিজের classifier দিয়ে ধরছে, metadata দিয়ে নয় — আবার পরিষ্কার করলে কিছু বদলাবে না। লেবেল না এলে নিশ্চিন্তে পোস্ট করুন।',
          ],
        },
      },
      {
        heading: {
          en: 'A bonus: metadata removal is also privacy protection',
          bn: 'বোনাস সুবিধা: metadata সরানো মানে privacy রক্ষাও',
        },
        paragraphs: {
          en: [
            'EXIF data is not only about AI markers. A photo\'s hidden data can also contain the camera or phone model, the date it was taken, and sometimes even the GPS location where it was shot. Cleaning the metadata strips those too — so think of this as a privacy habit, not just a label trick. Never share the original file publicly when you only want the picture seen.',
          ],
          bn: [
            'EXIF তথ্য শুধু AI মার্কার নিয়ে নয়। ছবির লুকানো তথ্যে থাকতে পারে ক্যামেরা বা ফোনের মডেল, তোলার তারিখ, এমনকি কখনো কখনো তোলার GPS location ও। Metadata পরিষ্কার করলে এগুলোও মুছে যায় — তাই এটাকে শুধু লেবেলের কৌশল নয়, privacy এর অভ্যাস হিসেবে ভাবুন। শুধু ছবিটা দেখাতে চাইলে কখনো original ফাইলটা publicly শেয়ার করবেন না।',
          ],
        },
      },
      {
        heading: {
          en: 'Five mistakes people make',
          bn: 'মানুষ যে ৫টি ভুল করে',
        },
        bullets: {
          en: [
            'Expecting a guarantee. Cleaning removes the metadata signal; it cannot promise every platform will stay silent every time.',
            'Cleaning the original and deleting it. Always clean a copy and keep the original file somewhere safe.',
            'Assuming the tool failed when a label still shows. That usually means pixel-level detection or a classifier — not a cleaning problem.',
            'Trying to add fake camera data to trick platforms into thinking the photo is from a real camera. That is deception, real camera EXIF has deep internal consistency that is trivial to check, and it can get your account flagged.',
            'Re-editing in the platform\'s own AI tools after cleaning — that embeds the markers right back in, and the label returns.',
          ],
          bn: [
            'গ্যারান্টি আশা করা। পরিষ্কার করা metadata এর সংকেত সরায়; প্রতিবার প্রতিটি প্ল্যাটফর্ম চুপ থাকবে এটা প্রতিশ্রুতি দিতে পারে না।',
            'Original টা পরিষ্কার করে মুছে ফেলা। সবসময় copy পরিষ্কার করুন, original ফাইলটা নিরাপদে রেখে দিন।',
            'লেবেল তাও এলে টুলকে দোষ দেওয়া। সাধারণত এর মানে pixel-level detection বা classifier — পরিষ্কারে সমস্যা নয়।',
            'ভুয়া ক্যামেরা তথ্য বসিয়ে প্ল্যাটফর্মকে বোকা বানানোর চেষ্টা। এটা প্রতারণা, আসল ক্যামেরা EXIF এর ভেতরের মিল সহজেই যাচাই করা যায়, আর এতে অ্যাকাউন্টে সমস্যা হতে পারে।',
            'পরিষ্কারের পর প্ল্যাটফর্মের নিজের AI টুলে আবার এডিট করা — তাতে মার্কার আবার বসে যায়, আর লেবেলও ফিরে আসে।',
          ],
        },
      },
      {
        heading: {
          en: 'Keep it honest — why we do not add fake camera data',
          bn: 'সততা বজায় রাখুন — ভুয়া ক্যামেরা তথ্য আমরা বসাই না কেন',
        },
        paragraphs: {
          en: [
            'Removing hidden data is fine: it is your file, your privacy, and nothing false is claimed. Adding fake camera data is the opposite: it presents a photo as something it is not. Platforms and people can and do check, and getting caught costs more than the label ever did. ToolGhor\'s tool cleans — it never invents.',
          ],
          bn: [
            'লুকানো তথ্য মুছে ফেলা ঠিক আছে: এটা আপনার ফাইল, আপনার privacy, আর এতে কোনো মিথ্যা দাবি নেই। ভুয়া ক্যামেরা তথ্য বসানো এর উল্টোটা: ছবিকে এমন কিছু সাজানো যা সে নয়। প্ল্যাটফর্ম আর মানুষ যাচাই করে ও করতে পারে, আর ধরা পড়লে ক্ষতি লেবেলের চেয়ে অনেক বেশি। ToolGhor এর টুল পরিষ্কার করে — কখনো বানায় না।',
          ],
        },
      },
    ],
    faq: [
      {
        en: {
          q: 'Will Facebook or Instagram still show an "AI Info" label after cleaning?',
          a: 'The metadata the platforms read is removed. But platforms can also detect AI content in other ways — invisible pixel watermarks (like SynthID) or AI classifiers — so no tool can guarantee a label will never appear.',
        },
        bn: {
          q: 'পরিষ্কার করার পরও ফেসবুক বা ইনস্টাগ্রামে "AI Info" লেবেল আসবে?',
          a: 'প্ল্যাটফর্ম যে metadata পড়ে তা সরিয়ে ফেলা হয়। তবে প্ল্যাটফর্ম অন্য উপায়েও AI কনটেন্ট শনাক্ত করতে পারে — অদৃশ্য pixel watermark (যেমন SynthID) বা AI classifier — তাই কোনো টুলই গ্যারান্টি দিতে পারে না যে লেবেল কখনো আসবে না।',
        },
      },
      {
        en: {
          q: 'Does cleaning change how my photo looks?',
          a: 'No — the picture itself stays exactly the same; only the hidden data is stripped. The file size may change a little because the photo is re-saved.',
        },
        bn: {
          q: 'পরিষ্কার করলে আমার ছবি দেখতে বদলে যাবে?',
          a: 'না — ছবি হুবহু একই থাকে; শুধু লুকানো তথ্য মুছে যায়। ছবিটি আবার save হয় বলে ফাইলের সাইজ একটু বদলাতে পারে।',
        },
      },
      {
        en: {
          q: 'Is my photo uploaded anywhere when I clean it?',
          a: 'No — everything runs in your browser on your own device. The file never leaves it, and nobody else sees it.',
        },
        bn: {
          q: 'পরিষ্কার করার সময় আমার ছবি কোথাও আপলোড হয়?',
          a: 'না — সবকিছু আপনার নিজের ডিভাইসের ব্রাউজারেই হয়। ফাইল ডিভাইসের বাইরে যায় না, আর কেউ দেখেও না।',
        },
      },
      {
        en: {
          q: 'Is there a file size limit? Which formats work?',
          a: "No fixed limit — photos are cleaned one by one in your browser, so very large files depend on your device's memory. Works with JPG, PNG and WebP.",
        },
        bn: {
          q: 'ফাইলের সাইজের কোনো সীমা আছে? কোন format চলে?',
          a: 'নির্দিষ্ট সীমা নেই — ছবি একটা একটা করে আপনার ব্রাউজারে পরিষ্কার হয়, তাই খুব বড় ফাইল ডিভাইসের memory এর ওপর নির্ভর করে। JPG, PNG ও WebP — তিনটাতেই চলে।',
        },
      },
    ],
  },
  {
    slug: 'compress-pdf-for-application',
    metaTitle: 'How to Compress a PDF for an Online Application | ToolGhor',
    metaDescription:
      'Your application form rejects the PDF as too big? Compress it under the limit in your browser — scanned certificates, transcripts and CVs, no upload.',
    title: {
      en: 'How to Compress a PDF for an Online Application',
      bn: 'অনলাইন আবেদনের জন্য PDF Compress করবেন যেভাবে',
    },
    excerpt: {
      en: 'Form says "file too large"? Shrink your scanned certificates or CV under the 1–5 MB limit — in your browser, documents never uploaded.',
      bn: 'ফর্ম বলছে "file too large"? Scan করা সার্টিফিকেট বা CV টি 1–5 MB সীমার নিচে আনুন — ব্রাউজারেই, ডকুমেন্ট আপলোড হয় না।',
    },
    relatedTools: ['compress-pdf', 'split-pdf'],
    datePublished: '2026-10-23',
    intro: {
      en: [
        'Everything is ready — certificates scanned, form filled — and then the portal answers: "File too large." Almost every online application in Bangladesh (jobs, university admission, BCS and other government forms) limits the PDF you can upload, often to 1 MB, 2 MB or 5 MB, while a few scanned pages easily weigh 10–20 MB. This guide shows how to shrink your PDF under the limit in your browser, and how to keep it readable enough that the officer checking it can actually read your name.',
      ],
      bn: [
        'সবকিছু তৈরি — সার্টিফিকেট scan করা, ফর্ম পূরণ করা — আর তখনই portal বলল: "File too large." বাংলাদেশের প্রায় প্রতিটি অনলাইন আবেদনেই (চাকরি, বিশ্ববিদ্যালয় ভর্তি, BCS সহ সরকারি ফর্ম) আপলোড করা PDF এর সাইজ সীমিত থাকে — প্রায়ই 1 MB, 2 MB বা 5 MB — অথচ কয়েক পৃষ্ঠা scan করলেই সহজে 10–20 MB হয়ে যায়। এই গাইডে দেখানো হলো ব্রাউজারেই কীভাবে PDF টি সীমার নিচে আনবেন, আর যিনি যাচাই করবেন তিনি যাতে আপনার নামটা পড়তে পারেন সেভাবে পড়ার যোগ্য রাখবেন।',
      ],
    },
    sections: [
      {
        heading: {
          en: "First, find your limit — and your file's size",
          bn: 'প্রথমে সীমাটা জানুন — আর আপনার ফাইলের সাইজ',
        },
        bullets: {
          en: [
            'The limit is written on the application form or circular, next to the upload button — look for "max 1 MB", "within 2 MB" or similar. Check your own form first; limits differ from one application to another.',
            "Check your PDF's current size: on a phone, open the file's details/properties; on a computer, right-click the file → Properties. That tells you how far you need to shrink.",
            'Work on a copy — keep your original full-quality scan safe; you may need it for printing later.',
          ],
          bn: [
            'সীমাটি লেখা থাকে আবেদনের ফর্ম বা circular এ, আপলোড বাটনের পাশেই — "max 1 MB", "within 2 MB" জাতীয় লেখা খুঁজুন। আগে নিজের ফর্মটি দেখুন; একেক আবেদনে সীমা একেক রকম।',
            'আপনার PDF এর বর্তমান সাইজ দেখুন: ফোনে ফাইলের details/properties খুলুন; কম্পিউটারে ফাইলে right-click → Properties। এতে বুঝবেন কতটা কমাতে হবে।',
            'Copy নিয়ে কাজ করুন — original full-quality scan টি নিরাপদে রাখুন; পরে print এর জন্য লাগতে পারে।',
          ],
        },
      },
      {
        heading: {
          en: 'How to compress the PDF',
          bn: 'PDF compress করবেন যেভাবে',
        },
        steps: {
          en: [
            "Open ToolGhor's free Compress PDF tool.",
            'Choose your PDF file.',
            'Pick how much to shrink it — a stronger shrink gives a smaller file.',
            'Press Compress, compare the before and after size shown, then download.',
          ],
          bn: [
            'ToolGhor এর ফ্রি Compress PDF টুলটি খুলুন।',
            'আপনার PDF ফাইলটি বেছে নিন।',
            'কতটা shrink করবেন তা বেছে নিন — বেশি shrink মানেই ছোট ফাইল।',
            'Compress চাপুন, আগে-পরের সাইজ তুলনা করে দেখুন, তারপর ডাউনলোড করুন।',
          ],
        },
        paragraphs: {
          en: [
            "The whole process runs in your browser — your documents are not uploaded to a server. If the result is still above your form's limit, run it once more with the stronger option.",
          ],
          bn: [
            'পুরো প্রক্রিয়াটি আপনার ব্রাউজারেই হয় — ডকুমেন্ট কোনো server এ আপলোড হয় না। ফলাফল তবুও ফর্মের সীমার উপরে থাকলে শক্তিশালী option দিয়ে আরেকবার চালান।',
          ],
        },
        cta: {
          toolSlug: 'compress-pdf',
          label: {
            en: 'Compress your PDF →',
            bn: 'PDF compress করুন →',
          },
        },
      },
      {
        heading: {
          en: 'Why scanned PDFs are so heavy — and why they compress so well',
          bn: 'Scan করা PDF এত ভারী হয় কেন — আর এত ভালো compress হয় কেন',
        },
        paragraphs: {
          en: [
            'A scanned certificate page is really a full-page photo inside a PDF. Photos are heavy, so scanned PDFs are mostly image weight — and image weight is exactly what compression removes best. A 15 MB scan often comes down to 1–2 MB with text still perfectly readable. The opposite case: a PDF made of typed text only (like a CV exported from Word) is already small and barely shrinks — if such a file is over the limit, the problem is usually an embedded photo or logo, not the text.',
          ],
          bn: [
            'Scan করা সার্টিফিকেটের পৃষ্ঠা আসলে PDF এর ভেতরে একটি পূর্ণ-পৃষ্ঠা ছবি। ছবি ভারী, তাই scan করা PDF এর ওজন মূলত ছবির ওজন — আর compression সবচেয়ে ভালো সরায় ঠিক এই ছবির ওজনটাই। 15 MB এর একটি scan প্রায়ই 1–2 MB এ নেমে আসে, লেখা পুরোপুরি পড়ার যোগ্য থেকেই। উল্টো ঘটনা: শুধু typed লেখার PDF (যেমন Word থেকে export করা CV) এমনিতেই ছোট এবং প্রায় কমেই না — এমন ফাইল সীমার উপরে গেলে সমস্যা সাধারণত ভেতরে থাকা একটি ছবি বা logo, লেখা নয়।',
          ],
        },
      },
      {
        heading: {
          en: 'Keep it readable — the officer must read your name',
          bn: 'পড়ার যোগ্য রাখুন — যাচাইকারীকে আপনার নাম পড়তে হবে',
        },
        bullets: {
          en: [
            'After compressing, zoom in to 100–200% on the result and check: name, roll/registration numbers, dates, seals and signatures must be clearly readable.',
            "If the text turned blurry, use a lighter compression level — a file that fits but can't be read will be rejected just the same.",
            'Certificates with small print (transcripts, mark sheets) need more care than a CV page.',
            'Never compress so far that stamps and signatures become blobs — officials verify those.',
          ],
          bn: [
            'Compress করার পর ফলাফলটি 100–200% zoom করে দেখুন: নাম, রোল/রেজিস্ট্রেশন নম্বর, তারিখ, সিল ও স্বাক্ষর স্পষ্ট পড়া যাচ্ছে কিনা।',
            'লেখা ঝাপসা হয়ে গেলে হালকা compression level ব্যবহার করুন — ফিট হলেও পড়া না গেলে সেটাও reject ই হবে।',
            'ছোট ছাপার ডকুমেন্টে (transcript, mark sheet) CV এর পৃষ্ঠার চেয়ে বেশি যত্ন দরকার।',
            'এতটা compress করবেন না যাতে সিল ও স্বাক্ষর দলায় পরিণত হয় — কর্তৃপক্ষ ওগুলোই যাচাই করে।',
          ],
        },
      },
      {
        heading: {
          en: "If it still doesn't fit",
          bn: 'তবুও ফিট না হলে',
        },
        bullets: {
          en: [
            'Compress the scans before making the PDF: if your pages start as photos/JPGs, shrink them with Compress Image first, then combine — the final PDF starts much smaller.',
            'Scan smarter next time: 200 DPI in grayscale is plenty for certificates — 600 DPI colour scans are what create 20 MB files.',
            'Split only if the form allows parts: some forms have separate upload fields per document — upload each file separately instead of one combined PDF. If the form wants ONE file, do not split; compress harder instead (ToolGhor has a Split PDF tool for the cases where splitting is allowed).',
          ],
          bn: [
            'PDF বানানোর আগেই scan গুলো compress করুন: পৃষ্ঠাগুলো ছবি/JPG আকারে থাকলে আগে Compress Image দিয়ে সেগুলো ছোট করে তারপর একত্র করুন — শেষ PDF টি শুরু থেকেই অনেক ছোট হবে।',
            'পরের বার বুদ্ধিমানভাবে scan করুন: সার্টিফিকেটের জন্য grayscale এ 200 DPI ই যথেষ্ট — 600 DPI colour scan ই তৈরি করে 20 MB এর ফাইল।',
            'Split করুন শুধু ফর্ম অনুমতি দিলে: কিছু ফর্মে প্রতিটি ডকুমেন্টের আলাদা upload field থাকে — একটি combined PDF এর বদলে প্রতিটি ফাইল আলাদা আপলোড করুন। ফর্ম একটি ফাইল চাইলে split করবেন না; বরং আরও জোরে compress করুন (যে ক্ষেত্রে split করা যায়, তার জন্য ToolGhor এর Split PDF টুল আছে)।',
          ],
        },
      },
      {
        heading: {
          en: '4 mistakes that get PDFs rejected',
          bn: 'PDF reject হওয়ার ৪টি ভুল',
        },
        bullets: {
          en: [
            'Uploading the blurry, over-compressed version because "it fit" — unreadable means rejected.',
            'Compressing the only copy and losing the original scan.',
            'Shrinking the wrong file and uploading an outdated version of a document.',
            'Ignoring the page/format rules while fixing the size — the form may also demand a specific number of pages or one combined file; size is only one of its rules.',
          ],
          bn: [
            '"ফিট হয়েছে" বলে ঝাপসা, অতিরিক্ত compress করা version আপলোড করা — পড়া না গেলে reject ই হবে।',
            'একমাত্র copy টি compress করে original scan হারিয়ে ফেলা।',
            'ভুল ফাইল ছোট করে কোনো ডকুমেন্টের পুরনো version আপলোড করা।',
            'সাইজ ঠিক করতে গিয়ে পৃষ্ঠা/format এর নিয়ম ভুলে যাওয়া — ফর্ম নির্দিষ্ট পৃষ্ঠা সংখ্যা বা একটি combined ফাইলও চাইতে পারে; সাইজ তার নিয়মগুলোর একটি মাত্র।',
          ],
        },
      },
    ],
    faq: [
      {
        en: {
          q: 'How small can my PDF get?',
          a: 'There is no fixed number — it depends on the file. Scanned, image-heavy PDFs shrink the most (often 70–90% smaller). Text-only PDFs are already compact and shrink very little.',
        },
        bn: {
          q: 'আমার PDF সর্বনিম্ন কত ছোট হতে পারে?',
          a: 'নির্দিষ্ট কোনো সংখ্যা নেই — ফাইলের উপর নির্ভর করে। Scan করা, ছবি-ভারী PDF সবচেয়ে বেশি ছোট হয় (প্রায়ই 70–90% পর্যন্ত)। শুধু লেখার PDF এমনিতেই compact এবং খুব সামান্য ছোট হয়।',
        },
      },
      {
        en: {
          q: 'Will compression make my certificates blurry?',
          a: 'At moderate levels, no — text stays sharp. At the strongest level some softness can appear, which is why you should zoom in and check names, numbers and seals before submitting.',
        },
        bn: {
          q: 'Compress করলে সার্টিফিকেট ঝাপসা হয়ে যাবে?',
          a: 'মাঝারি level এ নয় — লেখা ধারালো থাকে। সবচেয়ে শক্তিশালী level এ কিছুটা নরমভাব আসতে পারে, তাই জমা দেওয়ার আগে zoom করে নাম, নম্বর ও সিল যাচাই করুন।',
        },
      },
      {
        en: {
          q: 'Are my documents uploaded to a server?',
          a: 'No — compression runs in your browser on your device. Your certificates never leave your phone or computer.',
        },
        bn: {
          q: 'আমার ডকুমেন্ট কি server এ আপলোড হয়?',
          a: 'না — compression আপনার ডিভাইসের ব্রাউজারেই হয়। সার্টিফিকেট আপনার ফোন বা কম্পিউটারের বাইরে যায় না।',
        },
      },
      {
        en: {
          q: "My form's limit is 1 MB and the file is still bigger after compressing. What now?",
          a: 'Use the strongest compression level, and if your PDF was made from photo scans, compress those images first and rebuild the PDF. Also confirm the limit from the form itself — some forms state the limit per file, others per document.',
        },
        bn: {
          q: 'ফর্মের সীমা 1 MB, compress করেও ফাইল বড়। এখন কী করব?',
          a: 'সবচেয়ে শক্তিশালী compression level ব্যবহার করুন, আর PDF টি ছবি scan দিয়ে বানানো হলে আগে সেই ছবিগুলো compress করে PDF আবার বানান। ফর্মের সীমাটিও আবার নিশ্চিত করুন — কিছু ফর্মে সীমা প্রতি ফাইলে, কিছুতে প্রতি ডকুমেন্টে।',
        },
      },
    ],
  },
  {
    slug: 'download-facebook-youtube-video',
    metaTitle: 'How to Download Facebook & YouTube Videos to Your Phone | ToolGhor',
    metaDescription:
      'Save Facebook, YouTube or Instagram videos as MP4 or MP3 — paste the link, pick the format, download. Free, no app to install, works on any phone.',
    title: {
      en: 'How to Download Facebook & YouTube Videos to Your Phone',
      bn: 'Facebook ও YouTube এর ভিডিও ফোনে ডাউনলোড করবেন যেভাবে',
    },
    excerpt: {
      en: 'Watch offline without burning data: save public Facebook, YouTube and Instagram videos as MP4 — or just the audio as MP3. No app needed.',
      bn: 'Data না পুড়িয়ে offline এ দেখুন: public Facebook, YouTube ও Instagram ভিডিও MP4 হিসেবে — কিংবা শুধু audio MP3 হিসেবে সেভ করুন। কোনো app লাগবে না।',
    },
    relatedTools: ['video-downloader', 'audio-extractor'],
    datePublished: '2026-10-23',
    intro: {
      en: [
        "Mobile data is precious, and the video you need — a class lecture, a tutorial, a family clip a relative posted — is never there when the network is gone. The platforms' own download buttons are limited or missing, and the app stores are full of downloader apps stuffed with ads. You don't need any of them: with the video's link and a browser, you can save it as MP4 (or just the sound, as MP3) in under a minute. This guide shows how — and what to do when a link refuses to work.",
      ],
      bn: [
        'মোবাইল ডেটা মূল্যবান, আর যে ভিডিওটা দরকার — ক্লাসের lecture, একটি tutorial, আত্মীয়ের পোস্ট করা পারিবারিক clip — network না থাকলেই ঠিক সেটাই পাওয়া যায় না। প্ল্যাটফর্মগুলোর নিজেদের download button সীমিত কিংবা নেই বললেই চলে, আর app store ভরা বিজ্ঞাপনে ঠাসা downloader app এ। এগুলোর একটাও লাগবে না: ভিডিওর link আর একটি browser থাকলেই এক মিনিটের মধ্যে MP4 হিসেবে (কিংবা শুধু শব্দ, MP3 হিসেবে) সেভ করা যায়। এই গাইডে দেখানো হলো কীভাবে — আর link কাজ না করলে কী করবেন।',
      ],
    },
    sections: [
      {
        heading: {
          en: 'Step 1 — get the video\'s real link',
          bn: 'ধাপ ১ — ভিডিওটির আসল link নিন',
        },
        bullets: {
          en: [
            'On Facebook: open the video, tap Share → Copy link. This works for public videos, Reels and Watch videos.',
            'On YouTube: tap Share under the video → Copy link. Works for normal videos and Shorts.',
            'On Instagram: tap the share (paper plane) icon on a public Reel/post → Copy link.',
            'Copy the link from the video itself, not the page you found it on — a profile link or a news-feed link will not work. The link must point to the video.',
          ],
          bn: [
            'Facebook এ: ভিডিওটি খুলে Share → Copy link চাপুন। Public ভিডিও, Reels ও Watch ভিডিওতে কাজ করে।',
            'YouTube এ: ভিডিওর নিচে Share → Copy link। সাধারণ ভিডিও ও Shorts — দুটোতেই কাজ করে।',
            'Instagram এ: public Reel/post এ share (কাগজের plane) icon চেপে Copy link।',
            'Link টি ভিডিও থেকেই কপি করুন, যেখান থেকে পেয়েছেন সেই page থেকে নয় — profile link বা news-feed link কাজ করবে না। Link টিকে ভিডিওর দিকেই নির্দেশ করতে হবে।',
          ],
        },
      },
      {
        heading: {
          en: 'Step 2 — download it with ToolGhor',
          bn: 'ধাপ ২ — ToolGhor দিয়ে ডাউনলোড করুন',
        },
        steps: {
          en: [
            "Open ToolGhor's free Video Downloader.",
            'Paste the video link.',
            'Click Get Video and choose your format — MP4 for the video, or MP3/M4A if you only want the sound.',
            'Click Download — the file saves straight to your device.',
          ],
          bn: [
            'ToolGhor এর ফ্রি Video Downloader টুলটি খুলুন।',
            'ভিডিওর link টি paste করুন।',
            'Get Video ক্লিক করে format বেছে নিন — ভিডিওর জন্য MP4, শুধু শব্দ চাইলে MP3/M4A।',
            'Download ক্লিক করুন — ফাইলটি সরাসরি আপনার ডিভাইসে সেভ হবে।',
          ],
        },
        paragraphs: {
          en: ['No app to install and no account to create.'],
          bn: ['কোনো app install করতে হবে না, account ও খুলতে হবে না।'],
        },
        cta: {
          toolSlug: 'video-downloader',
          label: {
            en: 'Download a video now →',
            bn: 'এখনই ভিডিও ডাউনলোড করুন →',
          },
        },
      },
      {
        heading: {
          en: 'MP4 or MP3 — which do you actually need?',
          bn: 'MP4 নাকি MP3 — আসলে কোনটা দরকার?',
        },
        bullets: {
          en: [
            'MP4 — the full video. Choose this for tutorials, lectures, clips you want to watch or share offline.',
            'MP3/M4A — sound only, much smaller. Perfect for lectures you only listen to, talks, songs and recitations — and it saves a lot of storage and data.',
            'Tip: a one-hour lecture as MP4 can be hundreds of MB; as MP3 it may be under 50 MB.',
          ],
          bn: [
            'MP4 — পুরো ভিডিও। Tutorial, lecture, offline দেখতে বা শেয়ার করতে চাওয়া clip এর জন্য এটাই বেছে নিন।',
            'MP3/M4A — শুধু শব্দ, অনেক ছোট। শুধু শুনলেই হয় এমন lecture, আলোচনা, গান ও তিলাওয়াতের জন্য উপযুক্ত — আর storage ও data অনেক বাঁচে।',
            'টিপ: এক ঘণ্টার lecture MP4 তে কয়েকশো MB হতে পারে; MP3 তে 50 MB এর নিচেও হতে পারে।',
          ],
        },
      },
      {
        heading: {
          en: 'After downloading — find and manage the file',
          bn: 'ডাউনলোডের পর — ফাইল খুঁজুন ও গুছিয়ে রাখুন',
        },
        bullets: {
          en: [
            "The file lands in your browser's Downloads — on Android, check the Files app → Downloads; on iPhone, the Files app or Safari's download list.",
            'Rename it right away with a name you will recognise ("Physics class 12", not "videoplayback.mp4").',
            'Long videos eat storage — if you only needed the audio, download the MP3 version and delete the MP4.',
          ],
          bn: [
            'ফাইলটি যায় আপনার browser এর Downloads এ — Android এ Files app → Downloads দেখুন; iPhone এ Files app বা Safari এর download list।',
            'সাথে সাথে নাম বদলে রাখুন চেনা যাবে এমন নামে ("Physics class 12", "videoplayback.mp4" নয়)।',
            'লম্বা ভিডিও storage খায় — শুধু শব্দ দরকার হলে MP3 version টি ডাউনলোড করে MP4 টি মুছে ফেলুন।',
          ],
        },
      },
      {
        heading: {
          en: 'Link not working? Check these 4 things',
          bn: 'Link কাজ করছে না? এই ৪টি জিনিস দেখুন',
        },
        bullets: {
          en: [
            'The video must be public. Private videos, friends-only posts and closed-group videos cannot be fetched by any downloader — the platform blocks access, and no tool can (or should) go around that.',
            'Wrong link. You copied a profile, page or comment link instead of the video\'s own link — go back and use Share → Copy link on the video.',
            'Live or restricted videos. Ongoing live streams and some age-restricted videos may not download — try after the live ends.',
            'Try once more. Platforms hiccup; paste the link again after a few seconds. If it still fails, the video\'s privacy setting is almost always the reason.',
          ],
          bn: [
            'ভিডিওটি public হতে হবে। Private ভিডিও, friends-only পোস্ট ও closed-group এর ভিডিও কোনো downloader এই আনতে পারে না — প্ল্যাটফর্ম নিজেই access আটকে দেয়, আর কোনো টুলের এটা ঘুরিয়ে যাওয়া উচিতও নয়।',
            'ভুল link। ভিডিওর নিজের link এর বদলে profile, page বা comment এর link কপি করেছেন — ফিরে গিয়ে ভিডিওতে Share → Copy link ব্যবহার করুন।',
            'Live বা restricted ভিডিও। চলমান live stream ও কিছু age-restricted ভিডিও ডাউনলোড না-ও হতে পারে — live শেষ হলে চেষ্টা করুন।',
            'আরেকবার চেষ্টা করুন। প্ল্যাটফর্মে মাঝে মাঝে ত্রুটি হয়; কয়েক সেকেন্ড পর link টি আবার paste করুন। তবুও না হলে কারণ প্রায় নিশ্চিতভাবেই ভিডিওটির privacy setting।',
          ],
        },
      },
      {
        heading: {
          en: 'Download respectfully',
          bn: 'সম্মান রেখে ডাউনলোড করুন',
        },
        paragraphs: {
          en: [
            "Save videos for your own offline viewing — a lecture for the bus ride, your own family videos, a tutorial for the workshop. Re-uploading someone else's video as your own, or selling downloaded content, steals their work and can get your account reported. If you made the video or the owner allows downloads, you're fine — enjoy it offline.",
          ],
          bn: [
            'নিজের offline দেখার জন্য ভিডিও সেভ করুন — বাসের যাত্রায় lecture, নিজের পরিবারের ভিডিও, workshop এর tutorial। অন্যের ভিডিও নিজের বলে আবার আপলোড করা, কিংবা ডাউনলোড করা কনটেন্ট বিক্রি করা মানে তার কাজ চুরি করা, এবং এতে আপনার account এ report ও আসতে পারে। ভিডিওটি আপনার নিজের হলে কিংবা মালিক ডাউনলোডের অনুমতি দিলে কোনো সমস্যা নেই — offline এ উপভোগ করুন।',
          ],
        },
      },
    ],
    faq: [
      {
        en: {
          q: 'Can I download a private Facebook video?',
          a: 'No. Only public videos can be downloaded — private and friends-only videos are blocked by Facebook itself, and any site claiming otherwise is not safe to trust.',
        },
        bn: {
          q: 'Private Facebook ভিডিও ডাউনলোড করা যাবে?',
          a: 'না। শুধু public ভিডিও ডাউনলোড করা যায় — private ও friends-only ভিডিও Facebook নিজেই আটকে দেয়, আর যে সাইট অন্যথা দাবি করে তাকে বিশ্বাস করা নিরাপদ নয়।',
        },
      },
      {
        en: {
          q: 'Does it work on my phone, or do I need a computer?',
          a: 'It works in the browser on any phone or computer — no app installation and no sign-up.',
        },
        bn: {
          q: 'এটা কি আমার ফোনে চলবে, নাকি কম্পিউটার লাগবে?',
          a: 'যেকোনো ফোন বা কম্পিউটারের browser এই চলে — কোনো app install বা sign-up লাগবে না।',
        },
      },
      {
        en: {
          q: 'Can I download just the audio of a video?',
          a: "Yes — after Get Video, choose the MP3/M4A format instead of MP4. For a video file already saved on your device, ToolGhor's Audio Extractor does the same job.",
        },
        bn: {
          q: 'ভিডিওর শুধু audio ডাউনলোড করা যাবে?',
          a: 'হ্যাঁ — Get Video এর পর MP4 এর বদলে MP3/M4A format বেছে নিন। ডিভাইসে আগেই সেভ করা ভিডিও ফাইলের জন্য ToolGhor এর Audio Extractor একই কাজ করে।',
        },
      },
      {
        en: {
          q: 'Which sites are supported?',
          a: 'YouTube, Facebook and Instagram public links, plus direct video links. The same tool also accepts a local video file uploaded from your device.',
        },
        bn: {
          q: 'কোন কোন সাইট সমর্থিত?',
          a: 'YouTube, Facebook ও Instagram এর public link, আর direct video link। একই টুল আপনার ডিভাইস থেকে local video file আপলোড করেও কাজ করে।',
        },
      },
    ],
  },
];

export const GUIDES_BY_SLUG: Record<string, Guide> = GUIDES.reduce((acc, guide) => {
  acc[guide.slug] = guide;
  return acc;
}, {} as Record<string, Guide>);
