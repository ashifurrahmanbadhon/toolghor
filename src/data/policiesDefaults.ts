export interface PolicySection {
  id: string; // e.g. 'terms', 'privacy', 'cookies', 'disclaimer', 'ip', 'third_party', 'acceptable_use', 'updates', 'contact'
  table_name: string; // e.g. 'section_policy_terms'
  title_en: string;
  title_bn: string;
  body_en: string;
  body_bn: string;
  updated_at?: string;
}

export const POLICY_SECTIONS_LIST: Omit<PolicySection, 'title_en' | 'title_bn' | 'body_en' | 'body_bn'>[] = [
  { id: 'terms', table_name: 'section_policy_terms' },
  { id: 'privacy', table_name: 'section_policy_privacy' },
  { id: 'cookies', table_name: 'section_policy_cookies' },
  { id: 'disclaimer', table_name: 'section_policy_disclaimer' },
  { id: 'ip', table_name: 'section_policy_ip' },
  { id: 'third_party', table_name: 'section_policy_third_party' },
  { id: 'acceptable_use', table_name: 'section_policy_acceptable_use' },
  { id: 'updates', table_name: 'section_policy_updates' },
  { id: 'contact', table_name: 'section_policy_contact' },
];

export const TERMS_SECTIONS_LIST: Omit<PolicySection, 'title_en' | 'title_bn' | 'body_en' | 'body_bn'>[] = [
  { id: 'terms', table_name: 'section_policy_terms' },
  { id: 'cookies', table_name: 'section_policy_cookies' },
  { id: 'disclaimer', table_name: 'section_policy_disclaimer' },
  { id: 'ip', table_name: 'section_policy_ip' },
  { id: 'third_party', table_name: 'section_policy_third_party' },
  { id: 'acceptable_use', table_name: 'section_policy_acceptable_use' },
  { id: 'updates', table_name: 'section_policy_updates' },
  { id: 'contact', table_name: 'section_policy_contact' },
];

export interface PolicySubheading {
  id: string;
  title: string;
}

export const KNOWN_SUBHEAD_MAP: Record<string, string> = {
  // Privacy subheadings
  'your files stay on your device': 'your-files-stay-on-your-device',
  'আপনার ফাইল আপনার ডিভাইসেই থাকে': 'your-files-stay-on-your-device',
  'tools that use external processing': 'tools-external-processing',
  'যেসব টুল বাইরের সেবা ব্যবহার করে': 'tools-external-processing',
  'information we collect': 'information-we-collect',
  'আমরা যা সংগ্রহ করি': 'information-we-collect',
  'local storage': 'local-storage',
  'লোকাল স্টোরেজ': 'local-storage',
  'how we protect information': 'how-we-protect-information',
  'তথ্য সুরক্ষা': 'how-we-protect-information',
  'no sale of personal information': 'no-sale-of-personal-information',
  'ব্যক্তিগত তথ্য বিক্রি নয়': 'no-sale-of-personal-information',
  'your choices': 'your-choices',
  'আপনার পছন্দ': 'your-choices',
  // Terms & other subheadings
  'the service': 'the-service',
  'সেবাটি': 'the-service',
  'acceptable use': 'acceptable-use',
  'গ্রহণযোগ্য ব্যবহার': 'acceptable-use',
  'changes to the service': 'changes-to-service',
  'সেবার পরিবর্তন': 'changes-to-service',
  'your responsibility': 'your-responsibility',
  'আপনার দায়িত্ব': 'your-responsibility',
  'general': 'general',
  'সাধারণ': 'general',
  'what we store': 'what-we-store',
  'আমরা যা সংরক্ষণ করি': 'what-we-store',
  'what we do not do': 'what-we-do-not-do',
  'যা আমরা করি না': 'what-we-do-not-do',
  'managing cookies and storage': 'managing-cookies-storage',
  'কুকি ও স্টোরেজ ব্যবস্থাপনা': 'managing-cookies-storage',
  'our content': 'our-content',
  'আমাদের কনটেন্ট': 'our-content',
  'your content': 'your-content',
  'আপনার কনটেন্ট': 'your-content',
  'third-party rights': 'third-party-rights',
  'তৃতীয় পক্ষের অধিকার': 'third-party-rights',
  'reporting infringement': 'reporting-infringement',
  'লঙ্ঘনের অভিযোগ': 'reporting-infringement',
};

export const KNOWN_SUBHEADS_SET = new Set(Object.keys(KNOWN_SUBHEAD_MAP));

export function getHeadingSlug(text: string, fallbackIndex: number): string {
  const normalized = text.toLowerCase().trim();
  if (KNOWN_SUBHEAD_MAP[normalized]) {
    return KNOWN_SUBHEAD_MAP[normalized];
  }
  const ascii = normalized.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  if (ascii) return ascii;
  return `sub-${fallbackIndex}`;
}

export function extractSubheadings(content: string): PolicySubheading[] {
  if (!content) return [];
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const results: PolicySubheading[] = [];
  let count = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const lower = trimmed.toLowerCase();
    if (trimmed.startsWith('## ') || trimmed.startsWith('### ') || KNOWN_SUBHEADS_SET.has(lower)) {
      const headingText = trimmed.replace(/^#+\s*/, '');
      count++;
      results.push({
        id: getHeadingSlug(headingText, count),
        title: headingText,
      });
    }
  }
  return results;
}


export const DEFAULT_POLICY_SECTIONS: Record<string, PolicySection> = {
  terms: {
    id: 'terms',
    table_name: 'section_policy_terms',
    title_en: 'Terms & Conditions',
    title_bn: 'শর্তাবলী',
    body_en: `Welcome to ToolGhor ("ToolGhor", "we", "us", "our"). These Terms & Conditions govern your access to and use of the ToolGhor website and its tools (together, the "Service"). By accessing or using the Service, you agree to be bound by these terms. If you do not agree, please do not use the Service.

The Service
ToolGhor provides free online tools for everyday digital tasks — including PDF, image, calculator, QR code, video and audio, and resume tools.
No account, registration, or payment is required to use the tools.
Most tools run entirely in your browser; a small number use external processing, as described in the Third-Party Services section.

Acceptable Use
Your use of the Service must comply with the Acceptable Use Policy on this page and with all applicable laws. You may use the tools for lawful personal and professional purposes only.

Changes to the Service
We may update, modify, suspend, or discontinue any tool or feature at any time, with or without notice, as the platform evolves. We may also restrict or block access where necessary to protect the Service, its infrastructure, or its users.

Your Responsibility
You are solely responsible for the files and content you process with the tools, including having the right to use them.
You are responsible for checking that a tool's output is suitable and accurate for your purpose before relying on it.

General
These terms, together with the policies on this page, are the complete agreement between you and ToolGhor regarding the Service. If any part of these terms is found unenforceable, the remaining parts continue in full effect. These terms are governed by the laws of Bangladesh.`,
    body_bn: `ToolGhor-এ স্বাগতম ("ToolGhor", "আমরা")। এই শর্তাবলী ToolGhor ওয়েবসাইট ও এর টুলসমূহ (একত্রে "সেবা") ব্যবহারের নিয়ম নির্ধারণ করে। সেবা ব্যবহারের মাধ্যমে আপনি এই শর্তাবলীতে সম্মত হচ্ছেন। সম্মত না হলে অনুগ্রহ করে সেবাটি ব্যবহার করবেন না।

সেবাটি
ToolGhor প্রতিদিনের ডিজিটাল কাজের জন্য ফ্রি অনলাইন টুল সরবরাহ করে — PDF, ছবি, ক্যালকুলেটর, QR কোড, ভিডিও ও অডিও এবং রেজিউমে টুলসহ।
টুল ব্যবহারে কোনো অ্যাকাউন্ট, নিবন্ধন বা পেমেন্টের প্রয়োজন নেই।
বেশিরভাগ টুল সম্পূর্ণভাবে আপনার ব্রাউজারেই চলে; কিছু টুল বাইরের প্রসেসিং ব্যবহার করে, যা Third-Party Services অংশে বর্ণিত আছে।

গ্রহণযোগ্য ব্যবহার
সেবার ব্যবহারে এই পেজের Acceptable Use Policy এবং সকল প্রযোজ্য আইন মেনে চলতে হবে। টুলগুলো শুধুমাত্র বৈধ ব্যক্তিগত ও পেশাগত কাজে ব্যবহার করা যাবে।

সেবার পরিবর্তন
প্ল্যাটফর্মের উন্নয়নের সাথে সাথে আমরা যেকোনো সময়, নোটিশসহ বা ছাড়াই, যেকোনো টুল বা ফিচার আপডেট, পরিবর্তন, স্থগিত বা বন্ধ করতে পারি। সেবা, এর অবকাঠামো বা ব্যবহারকারীদের সুরক্ষার প্রয়োজনে আমরা অ্যাক্সেস সীমিত বা বন্ধও করতে পারি।

আপনার দায়িত্ব
টুল দিয়ে প্রসেস করা ফাইল ও কনটেন্টের সম্পূর্ণ দায়িত্ব আপনার — সেগুলো ব্যবহারের অধিকার থাকাসহ।
কোনো টুলের ফলাফলের উপর নির্ভর করার আগে তা আপনার কাজের জন্য উপযুক্ত ও সঠিক কিনা যাচাই করার দায়িত্ব আপনার।

সাধারণ
এই শর্তাবলী এই পেজের নীতিগুলোসহ সেবা বিষয়ে আপনার ও ToolGhor-এর মধ্যকার সম্পূর্ণ চুক্তি। এই শর্তাবলীর কোনো অংশ অকার্যকর প্রমাণিত হলেও বাকি অংশ পূর্ণভাবে কার্যকর থাকবে। এই শর্তাবলী বাংলাদেশের আইন দ্বারা পরিচালিত।`,
  },

  privacy: {
    id: 'privacy',
    table_name: 'section_policy_privacy',
    title_en: 'Privacy Policy',
    title_bn: 'গোপনীয়তা নীতি',
    body_en: `Your privacy matters to us. This policy explains what information ToolGhor handles, why, and what control you have over it.

Your Files Stay on Your Device
Most ToolGhor tools run entirely inside your browser. For those tools, your files, photos, and documents are processed on your own device and are never transmitted to or stored on our servers.

Tools That Use External Processing
A small number of tools need a third-party service to work — for example, background removal, some file conversions, AI-powered features, and video downloading. Only when you actively use one of those tools is the specific file or input sent to that provider for processing, as described in the Third-Party Services section. ToolGhor does not keep copies of files processed through these tools.

Information We Collect
No accounts: we do not require or collect names, accounts, or sign-ups from visitors.
Aggregate analytics: we use privacy-friendly, aggregated usage statistics (provided by our hosting platform, Vercel) to understand which tools are popular and to improve the platform. This data does not identify you personally and involves no advertising trackers.
Messages you send us: if you contact us or submit a tool request, we receive the information you choose to send, and use it only to respond and improve the Service.

Local Storage
The website stores small preferences in your own browser — such as your language choice — so the site works the way you left it. If you choose to use your own API key with a tool, it is stored only in your browser, on your device.

How We Protect Information
The website is served over secure HTTPS connections, and access to administrative systems is restricted and protected. No method of transmission or storage is completely secure, but we apply reasonable safeguards appropriate to the limited data involved.

No Sale of Personal Information
We do not sell personal information to third parties. Information is shared only with the service providers needed to operate a tool you actively use.

Your Choices
You can clear the website's stored preferences at any time through your browser's settings (clearing site data / local storage). For any privacy question or request, contact us through the Contact section.`,
    body_bn: `আপনার গোপনীয়তা আমাদের কাছে গুরুত্বপূর্ণ। ToolGhor কী তথ্য নিয়ে কাজ করে, কেন করে এবং এতে আপনার নিয়ন্ত্রণ কী — এই নীতিতে তা ব্যাখ্যা করা হয়েছে।

আপনার ফাইল আপনার ডিভাইসেই থাকে
ToolGhor-এর বেশিরভাগ টুল সম্পূর্ণভাবে আপনার ব্রাউজারের ভিতরেই চলে। ওই টুলগুলোর ক্ষেত্রে আপনার ফাইল, ছবি ও ডকুমেন্ট আপনার নিজের ডিভাইসেই প্রসেস হয় — কখনো আমাদের সার্ভারে পাঠানো বা সংরক্ষণ করা হয় না।

যেসব টুল বাইরের সেবা ব্যবহার করে
কিছু টুলের কাজের জন্য তৃতীয় পক্ষের সেবা প্রয়োজন — যেমন ব্যাকগ্রাউন্ড রিমুভাল, কিছু ফাইল কনভার্সন, AI ফিচার ও ভিডিও ডাউনলোড। শুধুমাত্র ওই টুলগুলো সক্রিয়ভাবে ব্যবহার করলেই নির্দিষ্ট ফাইল বা ইনপুট ওই সেবাদাতার কাছে প্রসেসিংয়ের জন্য পাঠানো হয়, যা Third-Party Services অংশে বর্ণিত আছে। এই টুলগুলো দিয়ে প্রসেস করা ফাইলের কোনো কপি ToolGhor রেখে দেয় না।

আমরা যা সংগ্রহ করি
অ্যাকাউন্ট নেই: আমরা ভিজিটরদের কাছ থেকে নাম, অ্যাকাউন্ট বা সাইন-আপ চাই না বা সংগ্রহ করি না।
সমষ্টিগত পরিসংখ্যান: কোন টুলগুলো জনপ্রিয় তা বুঝতে ও প্ল্যাটফর্ম উন্নত করতে আমরা গোপনীয়তা-বান্ধব, সমষ্টিগত ব্যবহার-পরিসংখ্যান ব্যবহার করি (আমাদের হোস্টিং প্ল্যাটফর্ম Vercel-এর মাধ্যমে)। এই ডেটা আপনাকে ব্যক্তিগতভাবে শনাক্ত করে না এবং এতে কোনো বিজ্ঞাপন ট্র্যাকার নেই।
আপনার পাঠানো বার্তা: আপনি আমাদের সাথে যোগাযোগ করলে বা টুলের অনুরোধ পাঠালে, আপনি যা পাঠাতে চান শুধু সেই তথ্যই আমরা পাই — এবং তা শুধুমাত্র উত্তর দেওয়া ও সেবা উন্নত করতেই ব্যবহার করি।

লোকাল স্টোরেজ
ওয়েবসাইট আপনার নিজের ব্রাউজারে ছোট কিছু পছন্দ সংরক্ষণ করে — যেমন আপনার ভাষা নির্বাচন — যাতে সাইটটি আপনার রেখে যাওয়া অবস্থায় কাজ করে। কোনো টুলে নিজের API key ব্যবহার করলে তা শুধুমাত্র আপনার ব্রাউজারেই, আপনার ডিভাইসেই থাকে।

তথ্য সুরক্ষা
ওয়েবসাইট নিরাপদ HTTPS সংযোগের মাধ্যমে সরবরাহ করা হয় এবং প্রশাসনিক সিস্টেমে প্রবেশাধিকার সীমিত ও সুরক্ষিত। কোনো প্রেরণ বা সংরক্ষণ পদ্ধতিই সম্পূর্ণ নিরাপদ নয়, তবে জড়িত সীমিত ডেটার জন্য আমরা যুক্তিসংগত সুরক্ষা ব্যবস্থা প্রয়োগ করি।

ব্যক্তিগত তথ্য বিক্রি নয়
আমরা তৃতীয় পক্ষের কাছে ব্যক্তিগত তথ্য বিক্রি করি না। তথ্য শুধুমাত্র সেই সেবাদাতাদের সাথেই ভাগ করা হয়, যারা আপনার সক্রিয়ভাবে ব্যবহৃত একটি টুল পরিচালনার জন্য প্রয়োজন।

আপনার পছন্দ
ব্রাউজারের সেটিংস থেকে যেকোনো সময় ওয়েবসাইটের সংরক্ষিত পছন্দ মুছে ফেলতে পারবেন (site data / local storage পরিষ্কার করে)। গোপনীয়তা বিষয়ক যেকোনো প্রশ্ন বা অনুরোধের জন্য Contact অংশের মাধ্যমে আমাদের সাথে যোগাযোগ করুন।`,
  },

  cookies: {
    id: 'cookies',
    table_name: 'section_policy_cookies',
    title_en: 'Cookie Policy',
    title_bn: 'কুকি নীতি',
    body_en: `Cookies and local storage are small pieces of data a website saves in your browser. ToolGhor keeps its use of browser storage minimal and purposeful.

What We Store
Essential preferences: your language selection and similar display settings, saved in local storage so the website remembers them on your next visit.
Your own API keys (optional): if you choose to add your own API key for a tool, it is saved only in your browser, on your device.
Analytics: our hosting platform (Vercel) provides privacy-friendly, aggregate statistics about tool usage. We do not use advertising cookies or cross-site trackers.

What We Do Not Do
We do not use cookies or storage to build advertising profiles, and we do not track your activity on other websites.

Managing Cookies and Storage
You can block or delete cookies and site data at any time in your browser's settings. The website will still work, but preferences such as language will reset.`,
    body_bn: `কুকি ও লোকাল স্টোরেজ হলো ছোট ডেটা যা একটি ওয়েবসাইট আপনার ব্রাউজারে সংরক্ষণ করে। ToolGhor ব্রাউজার স্টোরেজের ব্যবহার সর্বনিম্ন ও উদ্দেশ্যমূলক রাখে।

আমরা যা সংরক্ষণ করি
প্রয়োজনীয় পছন্দ: আপনার ভাষা নির্বাচন ও এ ধরনের ডিসপ্লে সেটিংস — local storage-এ সংরক্ষিত থাকে যাতে পরের ভিজিটে ওয়েবসাইট তা মনে রাখতে পারে।
আপনার নিজের API key (ঐচ্ছিক): কোনো টুলের জন্য নিজের API key যোগ করলে তা শুধুমাত্র আপনার ব্রাউজারেই, আপনার ডিভাইসেই সংরক্ষিত থাকে।
পরিসংখ্যান: আমাদের হোস্টিং প্ল্যাটফর্ম (Vercel) টুল ব্যবহারের গোপনীয়তা-বান্ধব, সমষ্টিগত পরিসংখ্যান সরবরাহ করে। আমরা বিজ্ঞাপন কুকি বা ক্রস-সাইট ট্র্যাকার ব্যবহার করি না।

যা আমরা করি না
বিজ্ঞাপনের প্রোফাইল তৈরি করতে আমরা কুকি বা স্টোরেজ ব্যবহার করি না, এবং অন্য ওয়েবসাইটে আপনার কার্যকলাপ আমরা অনুসরণ করি না।

কুকি ও স্টোরেজ ব্যবস্থাপনা
ব্রাউজারের সেটিংস থেকে যেকোনো সময় কুকি ও site data ব্লক বা মুছে ফেলতে পারবেন। ওয়েবসাইট তবুও চলবে, তবে ভাষার মতো পছন্দগুলো রিসেট হয়ে যাবে।`,
  },

  disclaimer: {
    id: 'disclaimer',
    table_name: 'section_policy_disclaimer',
    title_en: 'Disclaimer',
    title_bn: 'দাবিত্যাগ',
    body_en: `ToolGhor's tools are provided for general informational and practical purposes, on an "as is" and "as available" basis, without warranties of any kind, express or implied.

Tool outputs may contain errors or may not suit every situation. When accuracy matters — for example, with documents, measurements, or conversions — verify the result before using it.

The calculators provide general estimates only (for example, health-related calculators such as BMI) and are not a substitute for professional medical, financial, or legal advice.

We do not guarantee uninterrupted availability, error-free operation, or any specific result from using a tool.

Websites, files, and services provided by third parties are outside our direct control, and we are not responsible for their content or behavior.

To the extent permitted by law, ToolGhor is not liable for incidental or consequential damages arising from use of the website or its tools.`,
    body_bn: `ToolGhor-এর টুলগুলো সাধারণ তথ্য ও ব্যবহারিক কাজের জন্য "যেমন আছে" ও "যেমন পাওয়া যায়" ভিত্তিতে সরবরাহ করা হয় — প্রকাশ্য বা অন্তর্নিহিত কোনো ধরনের ওয়ারেন্টি ছাড়াই।

টুলের ফলাফলে ভুল থাকতে পারে বা তা সব পরিস্থিতির জন্য উপযুক্ত নাও হতে পারে। যেখানে নির্ভুলতা গুরুত্বপূর্ণ — যেমন ডকুমেন্ট, পরিমাপ বা কনভার্সনের ক্ষেত্রে — ব্যবহারের আগে ফলাফল যাচাই করে নিন।

ক্যালকুলেটরগুলো শুধুমাত্র সাধারণ ধারণা দেয় (যেমন BMI-এর মতো স্বাস্থ্য-সংক্রান্ত ক্যালকুলেটর) এবং এগুলো পেশাদার চিকিৎসা, আর্থিক বা আইনি পরামর্শের বিকল্প নয়।

আমরা নিরবচ্ছিন্ন প্রাপ্যতা, ত্রুটিমুক্ত কার্যক্রম বা কোনো টুল ব্যবহারে নির্দিষ্ট ফলাফলের গ্যারান্টি দিই না।

তৃতীয় পক্ষের ওয়েবসাইট, ফাইল ও সেবা আমাদের সরাসরি নিয়ন্ত্রণের বাইরে, এবং তাদের কনটেন্ট বা আচরণের জন্য আমরা দায়ী নই।

আইন যতটুকু অনুমতি দেয়, ওয়েবসাইট বা এর টুল ব্যবহার থেকে উদ্ভূত আনুষঙ্গিক বা পরোক্ষ ক্ষতির জন্য ToolGhor দায়ী থাকবে না।`,
  },

  ip: {
    id: 'ip',
    table_name: 'section_policy_ip',
    title_en: 'Intellectual Property & Copyright',
    title_bn: 'মেধা সম্পত্তি ও কপিরাইট',
    body_en: `Our Content
The ToolGhor name, logo, website design, and original content belong to ToolGhor and are protected by applicable intellectual property laws. You may not copy, reproduce, or reuse them for commercial purposes without our prior written permission.

Your Content
You keep all rights to the files and content you process with our tools. Using a tool does not transfer any ownership of your content to ToolGhor, and we claim no rights over your files or over the outputs you create from them.

Third-Party Rights
We respect the intellectual property rights of others. Do not use the tools to infringe anyone's copyright, trademark, or other rights.

Reporting Infringement
If you believe material connected with this website infringes your copyright, contact us through the Contact section, including: a description of the copyrighted work, where the material appears, and your contact details. We will review valid requests promptly and take appropriate action.`,
    body_bn: `আমাদের কনটেন্ট
ToolGhor নাম, লোগো, ওয়েবসাইট ডিজাইন ও মৌলিক কনটেন্ট ToolGhor-এর সম্পত্তি এবং প্রযোজ্য মেধা সম্পত্তি আইন দ্বারা সুরক্ষিত। আমাদের পূর্ব লিখিত অনুমতি ছাড়া বাণিজ্যিক উদ্দেশ্যে এগুলো কপি, পুনরুৎপাদন বা পুনঃব্যবহার করা যাবে না।

আপনার কনটেন্ট
আমাদের টুল দিয়ে প্রসেস করা ফাইল ও কনটেন্টের সকল অধিকার আপনারই থাকে। টুল ব্যবহারে আপনার কনটেন্টের কোনো মালিকানা ToolGhor-এর কাছে হস্তান্তরিত হয় না, এবং আপনার ফাইল বা সেগুলো থেকে তৈরি ফলাফলের উপর আমরা কোনো অধিকার দাবি করি না।

তৃতীয় পক্ষের অধিকার
আমরা অন্যদের মেধা সম্পত্তির অধিকারকে সম্মান করি। কারো কপিরাইট, ট্রেডমার্ক বা অন্য অধিকার লঙ্ঘন করতে টুলগুলো ব্যবহার করবেন না।

লঙ্ঘনের অভিযোগ
আপনার কপিরাইট লঙ্ঘন হয়েছে বলে মনে করলে Contact অংশের মাধ্যমে যোগাযোগ করুন — কপিরাইটকৃত কাজের বিবরণ, উপাদানটি কোথায় আছে এবং আপনার যোগাযোগের বিবরণসহ। আমরা বৈধ অনুরোধ দ্রুত পর্যালোচনা করে যথাযথ ব্যবস্থা নেব।`,
  },

  third_party: {
    id: 'third_party',
    table_name: 'section_policy_third_party',
    title_en: 'Third-Party Services',
    title_bn: 'তৃতীয় পক্ষের সেবা',
    body_en: `Some ToolGhor tools and the website itself work with third-party services. Depending on the tool you use, these may include:
Hosting & analytics: Vercel — the website is hosted on Vercel, which also provides the aggregate usage analytics described in the Privacy Policy.
Background removal processing: remove.bg
File conversion services: ConvertAPI, iLovePDF
AI providers for AI-powered features: Google Gemini, OpenAI
Source platforms accessed by the video downloading tools

Most tools do not use any external service at all — they work fully in your browser.

When a tool relies on a third-party service, that provider's own terms and privacy policy also apply to that processing. ToolGhor is not responsible for the availability, accuracy, or behavior of third-party services, and links or references to third-party websites do not imply endorsement.`,
    body_bn: `কিছু ToolGhor টুল এবং ওয়েবসাইটটি তৃতীয় পক্ষের সেবার সাথে কাজ করে। আপনি কোন টুল ব্যবহার করছেন তার উপর নির্ভর করে এর মধ্যে থাকতে পারে:
হোস্টিং ও পরিসংখ্যান: Vercel — ওয়েবসাইটটি Vercel-এ হোস্ট করা, এবং গোপনীয়তা নীতিতে বর্ণিত সমষ্টিগত ব্যবহার-পরিসংখ্যানও Vercel সরবরাহ করে।
ব্যাকগ্রাউন্ড রিমুভাল প্রসেসিং: remove.bg
ফাইল কনভার্সন সেবা: ConvertAPI, iLovePDF
AI ফিচারের জন্য AI সেবাদাতা: Google Gemini, OpenAI
ভিডিও ডাউনলোড টুল যেসব প্ল্যাটফর্ম থেকে ভিডিও আনে সেগুলো

বেশিরভাগ টুল কোনো বাইরের সেবাই ব্যবহার করে না — সেগুলো সম্পূর্ণভাবে আপনার ব্রাউজারেই কাজ করে।

কোনো টুল তৃতীয় পক্ষের সেবার উপর নির্ভর করলে, সেই প্রসেসিংয়ের ক্ষেত্রে ওই সেবাদাতার নিজস্ব শর্ত ও গোপনীয়তা নীতিও প্রযোজ্য হবে। তৃতীয় পক্ষের সেবার প্রাপ্যতা, নির্ভুলতা বা আচরণের জন্য ToolGhor দায়ী নয়, এবং তৃতীয় পক্ষের ওয়েবসাইটের লিংক বা উল্লেখ তাদের অনুমোদন বোঝায় না।`,
  },

  acceptable_use: {
    id: 'acceptable_use',
    table_name: 'section_policy_acceptable_use',
    title_en: 'Acceptable Use Policy',
    title_bn: 'গ্রহণযোগ্য ব্যবহার নীতি',
    body_en: `To keep ToolGhor safe and available for everyone, you agree NOT to:
Attempt to hack, probe, scan, overload, disrupt, or exploit the website, its servers, or its security measures, or to bypass rate limits or access controls.
Use the tools for illegal purposes, or to infringe the rights of others.
Upload or process malicious files, or content intended to harm systems or people.
Use automated access (bots, scripts, scrapers) in a way that degrades the service for others.
Impersonate ToolGhor or misrepresent your affiliation with it.

We may restrict or block access, and apply rate limits, when necessary to protect the website, its infrastructure, or its users. Decisions about misuse are at our reasonable discretion.`,
    body_bn: `ToolGhor সবার জন্য নিরাপদ ও সচল রাখতে আপনি সম্মত হচ্ছেন যে আপনি নিম্নোক্ত কাজগুলো করবেন না:
ওয়েবসাইট, এর সার্ভার বা নিরাপত্তা ব্যবস্থা হ্যাক, পরীক্ষা-আক্রমণ, স্ক্যান, ওভারলোড, ব্যাহত বা অপব্যবহারের চেষ্টা করা, অথবা rate limit বা অ্যাক্সেস নিয়ন্ত্রণ এড়িয়ে যাওয়ার চেষ্টা করা।
অবৈধ কাজে বা অন্যদের অধিকার লঙ্ঘনে টুল ব্যবহার করা।
সিস্টেম বা মানুষের ক্ষতির উদ্দেশ্যে তৈরি ক্ষতিকর ফাইল বা কনটেন্ট আপলোড বা প্রসেস করা।
অন্য ব্যবহারকারীদের সেবা ব্যাহত হয় এমনভাবে স্বয়ংক্রিয় অ্যাক্সেসের (বট, স্ক্রিপ্ট, স্ক্র্যাপার) ব্যবহার করা।
ToolGhor-এর ভান করা বা এর সাথে আপনার সম্পৃক্ততা সম্পর্কে ভুল ধারণা দেওয়া।

ওয়েবসাইট, এর অবকাঠামো বা ব্যবহারকারীদের সুরক্ষার প্রয়োজনে আমরা অ্যাক্সেস সীমিত বা বন্ধ করতে এবং rate limit প্রয়োগ করতে পারি। অপব্যবহার বিষয়ক সিদ্ধান্ত আমাদের যুক্তিসংগত বিবেচনায় হবে।`,
  },

  updates: {
    id: 'updates',
    table_name: 'section_policy_updates',
    title_en: 'Policy Updates',
    title_bn: 'নীতি হালনাগাদ',
    body_en: `We may update these policies from time to time as the website, its tools, or legal requirements change.

The "Last Updated" date shown at the top of this page is revised whenever the policy content changes materially, and significant changes may also be highlighted through the website's announcement bar. Continuing to use ToolGhor after an update means you accept the revised policies. We encourage you to review this page periodically.`,
    body_bn: `ওয়েবসাইট, এর টুল বা আইনি প্রয়োজনের পরিবর্তনের সাথে সাথে আমরা সময়ে সময়ে এই নীতিগুলো হালনাগাদ করতে পারি।

নীতির কনটেন্টে উল্লেখযোগ্য পরিবর্তন হলেই এই পেজের উপরে দেখানো "Last Updated" তারিখটি হালনাগাদ করা হয়, এবং গুরুত্বপূর্ণ পরিবর্তন ওয়েবসাইটের announcement bar-এর মাধ্যমেও জানানো হতে পারে। হালনাগাদের পর ToolGhor ব্যবহার অব্যাহত রাখলে আপনি সংশোধিত নীতিগুলো মেনে নিচ্ছেন বলে গণ্য হবে। আমরা আপনাকে নিয়মিত এই পেজটি দেখে নেওয়ার পরামর্শ দিই।`,
  },

  contact: {
    id: 'contact',
    table_name: 'section_policy_contact',
    title_en: 'Contact Us',
    title_bn: 'যোগাযোগ করুন',
    body_en: `Questions about these policies, privacy concerns, tool requests, or copyright reports — reach us at:

Email: ashifur.badhon@gmail.com

For copyright reports, please include the details listed in the Intellectual Property section so we can review your request promptly. We read every message and aim to respond as promptly as we reasonably can.`,
    body_bn: `এই নীতিগুলো সম্পর্কে প্রশ্ন, গোপনীয়তা সংক্রান্ত উদ্বেগ, টুলের অনুরোধ বা কপিরাইট অভিযোগের জন্য আমাদের কাছে পৌঁছান:

ইমেইল: ashifur.badhon@gmail.com

কপিরাইট অভিযোগের ক্ষেত্রে Intellectual Property অংশে উল্লেখিত বিবরণগুলো অন্তর্ভুক্ত করুন, যাতে আমরা আপনার অনুরোধ দ্রুত পর্যালোচনা করতে পারি। আমরা প্রতিটি বার্তা পড়ি এবং যত দ্রুত যুক্তিসংগতভাবে সম্ভব উত্তর দেওয়ার চেষ্টা করি।`,
  },
};
