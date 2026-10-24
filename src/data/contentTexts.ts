export interface ContentTexts {
  faq: {
    pill_en: string;
    pill_bn: string;
    title_en: string;
    title_bn: string;
    sub_en: string;
    sub_bn: string;
  };
  guides: {
    pill_en: string;
    pill_bn: string;
    title_en: string;
    title_bn: string;
    sub_en: string;
    sub_bn: string;
    practical_tag_en: string;
    practical_tag_bn: string;
    read_guide_en: string;
    read_guide_bn: string;
  };
  guide_article: {
    back_all_en: string;
    back_all_bn: string;
    published_en: string;
    published_bn: string;
    practical_tag_en: string;
    practical_tag_bn: string;
    cta_title_en: string;
    cta_title_bn: string;
    cta_desc_en: string;
    cta_desc_bn: string;
  };
  terms: {
    page_title_en: string;
    page_title_bn: string;
    sidebar_title_en: string;
    sidebar_title_bn: string;
    last_updated_en: string;
    last_updated_bn: string;
    welcome_heading_en: string;
    welcome_heading_bn: string;
    welcome_text_en: string;
    welcome_text_bn: string;
  };
  privacy: {
    page_title_en: string;
    page_title_bn: string;
    sidebar_title_en: string;
    sidebar_title_bn: string;
    last_updated_en: string;
    last_updated_bn: string;
    welcome_heading_en: string;
    welcome_heading_bn: string;
    welcome_text_en: string;
    welcome_text_bn: string;
  };
  home: {
    expand_all_en: string;
    expand_all_bn: string;
    collapse_all_en: string;
    collapse_all_bn: string;
    all_tools_chip_en: string;
    all_tools_chip_bn: string;
    categories_label_en: string;
    categories_label_bn: string;
    empty_search_en: string;
    empty_search_bn: string;
  };
  footer: {
    guides_en: string;
    guides_bn: string;
    faq_en: string;
    faq_bn: string;
    terms_en: string;
    terms_bn: string;
    privacy_en: string;
    privacy_bn: string;
    admin_en: string;
    admin_bn: string;
    back_to_top_en: string;
    back_to_top_bn: string;
  };
  about: {
    tagline_badge_en: string;
    tagline_badge_bn: string;
    desc_en: string;
    desc_bn: string;
    hl1_title_en: string;
    hl1_title_bn: string;
    hl1_sub_en: string;
    hl1_sub_bn: string;
    hl2_title_en: string;
    hl2_title_bn: string;
    hl2_sub_en: string;
    hl2_sub_bn: string;
    built_by_en: string;
    built_by_bn: string;
  };
}

export const DEFAULT_CONTENT_TEXTS: ContentTexts = {
  faq: {
    pill_en: 'NEED HELP?',
    pill_bn: 'কোনো প্রশ্ন আছে?',
    title_en: 'Frequently Asked Questions',
    title_bn: 'সাধারণ জিজ্ঞাসা',
    sub_en: 'Everything you need to know about ToolGhor — the tools, your privacy, and how everything works.',
    sub_bn: 'ToolGhor সম্পর্কে যা যা জানা দরকার — টুলগুলো, আপনার প্রাইভেসি, আর সবকিছু কীভাবে কাজ করে।',
  },
  guides: {
    pill_en: 'HELPFUL GUIDES',
    pill_bn: 'সহায়ক গাইড',
    title_en: 'Guides',
    title_bn: 'গাইড',
    sub_en: 'Helpful step-by-step guides and tutorials for everyday tasks.',
    sub_bn: 'দৈনন্দিন কাজের জন্য প্রয়োজনীয় গাইড ও ধাপে ধাপে নির্দেশনা — সম্পূর্ণ ফ্রি।',
    practical_tag_en: 'Practical Guide',
    practical_tag_bn: 'ব্যবহারিক নির্দেশিকা',
    read_guide_en: 'Read Guide →',
    read_guide_bn: 'গাইডটি পড়ুন →',
  },
  guide_article: {
    back_all_en: 'All Guides',
    back_all_bn: 'সকল গাইড',
    published_en: 'Published: October 23, 2026',
    published_bn: 'প্রকাশিত: ২৩ অক্টোবর ২০২৬',
    practical_tag_en: 'Practical Guide',
    practical_tag_bn: 'ব্যবহারিক গাইড',
    cta_title_en: 'Try the free tools',
    cta_title_bn: 'ফ্রি টুলগুলো ব্যবহার করে দেখুন',
    cta_desc_en: 'All tools run 100% free, fast, and private inside your browser:',
    cta_desc_bn: 'ToolGhor-এর এই টুলগুলো সম্পূর্ণ ফ্রি ও নিরাপদে আপনার ব্রাউজারেই চলে:',
  },
  terms: {
    page_title_en: 'Terms & Policies',
    page_title_bn: 'ব্যবহারের শর্তাবলী ও নীতিসমূহ',
    sidebar_title_en: 'Terms & Policies',
    sidebar_title_bn: 'শর্তাবলী ও নীতিমালা',
    last_updated_en: 'Last Updated: 22 October 2026',
    last_updated_bn: 'সর্বশেষ হালনাগাদ: ২২ অক্টোবর ২০২৬',
    welcome_heading_en: 'Welcome!',
    welcome_heading_bn: 'স্বাগতম!',
    welcome_text_en: 'These policies explain how ToolGhor works, what happens to your files, and the rules for using the site — in clear, honest language.',
    welcome_text_bn: 'এই নীতিগুলোতে পরিষ্কার ও সৎ ভাষায় ব্যাখ্যা করা হয়েছে ToolGhor কীভাবে কাজ করে, আপনার ফাইলের কী হয় এবং সাইট ব্যবহারের নিয়মগুলো।',
  },
  privacy: {
    page_title_en: 'Privacy Policy',
    page_title_bn: 'গোপনীয়তা নীতি',
    sidebar_title_en: 'Privacy Policy',
    sidebar_title_bn: 'গোপনীয়তা নীতি',
    last_updated_en: 'Last Updated: 22 October 2026',
    last_updated_bn: 'সর্বশেষ হালনাগাদ: ২২ অক্টোবর ২০২৬',
    welcome_heading_en: 'Welcome!',
    welcome_heading_bn: 'স্বাগতম!',
    welcome_text_en: 'Your privacy is paramount at ToolGhor. We do not store your files on external servers — all processing happens directly in your browser on your own device.',
    welcome_text_bn: 'ToolGhor-এ আপনার তথ্যের গোপনীয়তা রক্ষা করা আমাদের প্রধান অগ্রাধিকার। আমাদের কোনো টুল আপনার ফাইল কোনো রিমোট সার্ভারে জমা করে না — সব প্রসেসিং সরাসরি আপনার ডিভাইসে ঘটে।',
  },
  home: {
    expand_all_en: 'Expand All',
    expand_all_bn: 'সব খুলুন',
    collapse_all_en: 'Collapse All',
    collapse_all_bn: 'সব বন্ধ করুন',
    all_tools_chip_en: 'All (Expand All)',
    all_tools_chip_bn: 'সব টুলস (সব খুলুন)',
    categories_label_en: 'Categories',
    categories_label_bn: 'ক্যাটাগরি',
    empty_search_en: 'No tool found. Try a different word, or click "Request a Tool" at the top to suggest one.',
    empty_search_bn: 'কোনো টুল পাওয়া যায়নি। অন্য শব্দে চেষ্টা করুন, অথবা ওপরে "টুলের অনুরোধ" বাটনে ক্লিক করে জানান।',
  },
  footer: {
    guides_en: 'Guides',
    guides_bn: 'গাইড',
    faq_en: 'FAQ',
    faq_bn: 'সাধারণ জিজ্ঞাসা',
    terms_en: 'Terms of Service',
    terms_bn: 'ব্যবহারের শর্তাবলী',
    privacy_en: 'Privacy Policy',
    privacy_bn: 'গোপনীয়তা নীতি',
    admin_en: 'Admin',
    admin_bn: 'অ্যাডমিন',
    back_to_top_en: 'Back to top',
    back_to_top_bn: 'উপরে যান',
  },
  about: {
    tagline_badge_en: 'Simple tools • Smarter everyday work',
    tagline_badge_bn: 'সহজ টুলস • স্মার্ট দৈনন্দিন কাজ',
    desc_en: 'ToolGhor brings together a thoughtfully curated collection of useful online tools, designed to make everyday digital tasks simpler, faster, and more convenient.',
    desc_bn: 'ToolGhor নিয়ে এসেছে প্রয়োজনীয় সব অনলাইন টুলের একটি সমৃদ্ধ ও নির্ভরযোগ্য সংগ্রহ, যা আপনার দৈনন্দিন ডিজিটাল কাজগুলোকে আরও সহজ, দ্রুত ও স্বাচ্ছন্দ্যময় করে তোলার জন্য তৈরি।',
    hl1_title_en: 'Built for simplicity',
    hl1_title_bn: 'সহজ ব্যবহারের নিশ্চয়তা',
    hl1_sub_en: 'Clean & distraction-free interface',
    hl1_sub_bn: 'ঝামেলাহীন ও সাবলীল ইন্টারফেস',
    hl2_title_en: 'Designed for everyday use',
    hl2_title_bn: 'দৈনন্দিন কাজের উপযোগী',
    hl2_sub_en: 'Fast, reliable and daily-ready',
    hl2_sub_bn: 'মুহূর্তেই নির্ভুল ও দ্রুত সমাধান',
    built_by_en: 'BUILT BY',
    built_by_bn: 'তৈরি করেছেন',
  },
};

export function mergeContentTexts(stored: any): ContentTexts {
  if (!stored || typeof stored !== 'object') return DEFAULT_CONTENT_TEXTS;
  return {
    faq: { ...DEFAULT_CONTENT_TEXTS.faq, ...(stored.faq || {}) },
    guides: { ...DEFAULT_CONTENT_TEXTS.guides, ...(stored.guides || {}) },
    guide_article: { ...DEFAULT_CONTENT_TEXTS.guide_article, ...(stored.guide_article || {}) },
    terms: { ...DEFAULT_CONTENT_TEXTS.terms, ...(stored.terms || {}) },
    privacy: { ...DEFAULT_CONTENT_TEXTS.privacy, ...(stored.privacy || {}) },
    home: { ...DEFAULT_CONTENT_TEXTS.home, ...(stored.home || {}) },
    footer: { ...DEFAULT_CONTENT_TEXTS.footer, ...(stored.footer || {}) },
    about: { ...DEFAULT_CONTENT_TEXTS.about, ...(stored.about || {}) },
  };
}
