import { FaqItem } from './seoData';

export interface GuideSection {
  heading: { en: string; bn: string };
  paragraphs?: { en: string[]; bn: string[] };   // plain paragraphs
  bullets?: { en: string[]; bn: string[] };       // bullet list
  steps?: { en: string[]; bn: string[] };         // numbered steps
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
];

export const GUIDES_BY_SLUG: Record<string, Guide> = GUIDES.reduce((acc, guide) => {
  acc[guide.slug] = guide;
  return acc;
}, {} as Record<string, Guide>);
