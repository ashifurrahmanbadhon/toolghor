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

export const DEFAULT_POLICY_SECTIONS: Record<string, PolicySection> = {
  terms: {
    id: 'terms',
    table_name: 'section_policy_terms',
    title_en: 'Terms & Conditions',
    title_bn: 'শর্তাবলী',
    body_en: `Welcome to ToolGhor. By accessing or using this website, you agree to these Terms & Conditions. If you do not agree, please do not use the website.

## Use of the Service
ToolGhor provides free online tools for everyday digital tasks — including PDF, image, calculator, QR code, video, and resume tools.
You may use the tools for lawful personal and professional purposes.
No account or registration is required to use the tools.

## Changes to the Service
We may update, modify, suspend, or discontinue any tool or feature at any time, with or without notice, as the platform evolves.

## Your Responsibility
You are solely responsible for the files and content you process with the tools, including having the right to use them.
You are responsible for checking that a tool's output is suitable and accurate for your purpose before relying on it.
You must use the website in compliance with all applicable laws.

## Governing Terms
If any part of these terms is found unenforceable, the remaining parts continue in full effect. These terms are governed by the laws of Bangladesh.`,
    body_bn: `ToolGhor-এ স্বাগতম। এই ওয়েবসাইট ব্যবহারের মাধ্যমে আপনি এই শর্তাবলীতে সম্মত হচ্ছেন। সম্মত না হলে অনুগ্রহ করে ওয়েবসাইটটি ব্যবহার করবেন না।

## সেবার ব্যবহার
ToolGhor প্রতিদিনের ডিজিটাল কাজের জন্য ফ্রি অনলাইন টুল সরবরাহ করে — PDF, ছবি, ক্যালকুলেটর, QR কোড, ভিডিও ও রেজিউমে টুলসহ।
আপনি বৈধ ব্যক্তিগত ও পেশাগত কাজে টুলগুলো ব্যবহার করতে পারবেন।
টুল ব্যবহারে কোনো অ্যাকাউন্ট বা নিবন্ধনের প্রয়োজন নেই।

## সেবার পরিবর্তন
প্ল্যাটফর্মের উন্নয়নের সাথে সাথে আমরা যেকোনো সময়, নোটিশসহ বা ছাড়াই, যেকোনো টুল বা ফিচার আপডেট, পরিবর্তন, স্থগিত বা বন্ধ করতে পারি।

## আপনার দায়িত্ব
টুল দিয়ে প্রসেস করা ফাইল ও কনটেন্টের সম্পূর্ণ দায়িত্ব আপনার — সেগুলো ব্যবহারের অধিকার থাকাসহ।
কোনো টুলের ফলাফলের উপর নির্ভর করার আগে তা আপনার কাজের জন্য উপযুক্ত ও সঠিক কিনা যাচাই করার দায়িত্ব আপনার।
আপনাকে সকল প্রযোজ্য আইন মেনে ওয়েবসাইট ব্যবহার করতে হবে।

## প্রযোজ্য আইন
এই শর্তাবলীর কোনো অংশ অকার্যকর প্রমাণিত হলেও বাকি অংশ পূর্ণভাবে কার্যকর থাকবে। এই শর্তাবলী বাংলাদেশের আইন দ্বারা পরিচালিত।`,
  },

  privacy: {
    id: 'privacy',
    table_name: 'section_policy_privacy',
    title_en: 'Privacy Policy',
    title_bn: 'গোপনীয়তা নীতি',
    body_en: `Your privacy matters to us. This policy explains what information ToolGhor handles and how.

## Your Files Stay on Your Device
Most ToolGhor tools run entirely inside your browser. Your files, photos, and documents are processed on your own device and are never transmitted to or stored on our servers for those tools.

## Tools That Use External Processing
A small number of tools need a third-party service to work — for example, background removal, some file conversions, AI-powered features, and video downloading. Only when you use one of those tools is the specific file or input sent to that provider for processing, as described in the Third-Party Services section.

## Information We Collect
We do not require accounts, names, or sign-ups from visitors.
We use privacy-friendly, aggregate usage analytics to understand which tools are popular and to improve the platform. This does not identify you personally and involves no advertising trackers.
If you contact us or submit a tool request, we receive the information you choose to send.

## Local Storage
The website stores small preferences in your own browser — such as your language choice — so the site works the way you left it. If you choose to use your own API key with a tool, it is stored only in your browser.

## No Sale of Personal Information
We do not sell personal information to third parties. Information is shared only with the service providers needed to operate a tool you actively use.

## Your Choices
You can clear the website's stored preferences at any time through your browser's settings (clearing site data / local storage).`,
    body_bn: `আপনার গোপনীয়তা আমাদের কাছে গুরুত্বপূর্ণ। ToolGhor কী তথ্য নিয়ে কাজ করে এবং কীভাবে — এই নীতিতে তা ব্যাখ্যা করা হয়েছে।

## আপনার ফাইল আপনার ডিভাইসেই থাকে
ToolGhor-এর বেশিরভাগ টুল সম্পূর্ণভাবে আপনার ব্রাউজারের ভিতরেই চলে। ওই টুলগুলোর ক্ষেত্রে আপনার ফাইল, ছবি ও ডকুমেন্ট আপনার নিজের ডিভাইসেই প্রসেস হয় — কখনো আমাদের সার্ভারে পাঠানো বা সংরক্ষণ করা হয় না।

## যেসব টুল বাইরের সেবা ব্যবহার করে
কিছু টুলের কাজের জন্য তৃতীয় পক্ষের সেবা প্রয়োজন — যেমন ব্যাকগ্রাউন্ড রিমুভাল, কিছু ফাইল কনভার্সন, AI ফিচার ও ভিডিও ডাউনলোড। শুধুমাত্র ওই টুলগুলো ব্যবহার করলেই নির্দিষ্ট ফাইল বা ইনপুট ওই সেবাদাতার কাছে প্রসেসিংয়ের জন্য পাঠানো হয়, যা Third-Party Services অংশে বর্ণিত আছে।

## আমরা যা সংগ্রহ করি
আমরা ভিজিটরদের কাছ থেকে অ্যাকাউন্ট, নাম বা সাইন-আপ চাই না।
কোন টুলগুলো জনপ্রিয় তা বুঝতে ও প্ল্যাটফর্ম উন্নত করতে আমরা গোপনীয়তা-বান্ধব, সমষ্টিগত ব্যবহার-পরিসংখ্যান ব্যবহার করি। এটি আপনাকে ব্যক্তিগতভাবে শনাক্ত করে না এবং এতে কোনো বিজ্ঞাপন ট্র্যাকার নেই।
আপনি আমাদের সাথে যোগাযোগ করলে বা টুলের অনুরোধ পাঠালে, আপনি যা পাঠাতে চান শুধু সেই তথ্যই আমরা পাই।

## লোকাল স্টোরেজ
ওয়েবসাইট আপনার নিজের ব্রাউজারে ছোট কিছু পছন্দ সংরক্ষণ করে — যেমন আপনার ভাষা নির্বাচন — যাতে সাইটটি আপনার রেখে যাওয়া অবস্থায় কাজ করে। কোনো টুলে নিজের API key ব্যবহার করলে তা শুধুমাত্র আপনার ব্রাউজারেই থাকে।

## ব্যক্তিগত তথ্য বিক্রি নয়
আমরা তৃতীয় পক্ষের কাছে ব্যক্তিগত তথ্য বিক্রি করি না। তথ্য শুধুমাত্র সেই সেবাদাতাদের সাথেই ভাগ করা হয়, যারা আপনার সক্রিয়ভাবে ব্যবহৃত একটি টুল পরিচালনার জন্য প্রয়োজন।

## আপনার পছন্দ
ব্রাউজারের সেটিংস থেকে যেকোনো সময় ওয়েবসাইটের সংরক্ষিত পছন্দ মুছে ফেলতে পারবেন (site data / local storage পরিষ্কার করে)।`,
  },

  cookies: {
    id: 'cookies',
    table_name: 'section_policy_cookies',
    title_en: 'Cookie Policy',
    title_bn: 'কুকি নীতি',
    body_en: `Cookies are small files a website saves in your browser. ToolGhor keeps its use of browser storage minimal.

## What We Store
Essential preferences: your language selection and similar display settings, saved in local storage so the website remembers them on your next visit.
Analytics: privacy-friendly, aggregate statistics about tool usage. We do not use advertising cookies or cross-site trackers.

## What We Do Not Do
We do not use cookies to build advertising profiles, and we do not track your activity on other websites.

## Managing Cookies and Storage
You can block or delete cookies and site data at any time in your browser's settings. The website will still work, but preferences such as language will reset.`,
    body_bn: `কুকি হলো ছোট ফাইল যা একটি ওয়েবসাইট আপনার ব্রাউজারে সংরক্ষণ করে। ToolGhor ব্রাউজার স্টোরেজের ব্যবহার সর্বনিম্ন রাখে।

## আমরা যা সংরক্ষণ করি
প্রয়োজনীয় পছন্দ: আপনার ভাষা নির্বাচন ও এ ধরনের ডিসপ্লে সেটিংস — local storage-এ সংরক্ষিত থাকে যাতে পরের ভিজিটে ওয়েবসাইট তা মনে রাখতে পারে।
পরিসংখ্যান: টুল ব্যবহারের গোপনীয়তা-বান্ধব, সমষ্টিগত পরিসংখ্যান। আমরা বিজ্ঞাপন কুকি বা ক্রস-সাইট ট্র্যাকার ব্যবহার করি না।

## যা আমরা করি না
বিজ্ঞাপনের প্রোফাইল তৈরি করতে আমরা কুকি ব্যবহার করি না, এবং অন্য ওয়েবসাইটে আপনার কার্যকলাপ আমরা অনুসরণ করি না।

## কুকি ও স্টোরেজ ব্যবস্থাপনা
ব্রাউজারের সেটিংস থেকে যেকোনো সময় কুকি ও site data ব্লক বা মুছে ফেলতে পারবেন। ওয়েবসাইট তবুও চলবে, তবে ভাষার মতো পছন্দগুলো রিসেট হয়ে যাবে।`,
  },

  disclaimer: {
    id: 'disclaimer',
    table_name: 'section_policy_disclaimer',
    title_en: 'Disclaimer',
    title_bn: 'দাবিত্যাগ',
    body_en: `ToolGhor's tools are provided for general informational and practical purposes, on an "as is" and "as available" basis.

Tool outputs may contain errors or may not suit every situation. When accuracy matters — for example, with documents, measurements, or conversions — verify the result before using it.

We do not guarantee uninterrupted availability, error-free operation, or any specific result from using a tool.

Websites, files, and services provided by third parties are outside our direct control, and we are not responsible for their content or behavior.

To the extent permitted by law, ToolGhor is not liable for incidental or consequential damages arising from use of the website or its tools.`,
    body_bn: `ToolGhor-এর টুলগুলো সাধারণ তথ্য ও ব্যবহারিক কাজের জন্য "যেমন আছে" ও "যেমন পাওয়া যায়" ভিত্তিতে সরবরাহ করা হয়।

টুলের ফলাফলে ভুল থাকতে পারে বা তা সব পরিস্থিতির জন্য উপযুক্ত নাও হতে পারে। যেখানে নির্ভুলতা গুরুত্বপূর্ণ — যেমন ডকুমেন্ট, পরিমাপ বা কনভার্সনের ক্ষেত্রে — ব্যবহারের আগে ফলাফল যাচাই করে নিন।

আমরা নিরবচ্ছিন্ন প্রাপ্যতা, ত্রুটিমুক্ত কার্যক্রম বা কোনো টুল ব্যবহারে নির্দিষ্ট ফলাফলের গ্যারান্টি দিই না।

তৃতীয় পক্ষের ওয়েবসাইট, ফাইল ও সেবা আমাদের সরাসরি নিয়ন্ত্রণের বাইরে, এবং তাদের কনটেন্ট বা আচরণের জন্য আমরা দায়ী নই।

আইন যতটুকু অনুমতি দেয়, ওয়েবসাইট বা এর টুল ব্যবহার থেকে উদ্ভূত আনুষঙ্গিক বা পরোক্ষ ক্ষতির জন্য ToolGhor দায়ী থাকবে না।`,
  },

  ip: {
    id: 'ip',
    table_name: 'section_policy_ip',
    title_en: 'Intellectual Property & Copyright',
    title_bn: 'মেধা সম্পত্তি ও কপিরাইট',
    body_en: `## Our Content
The ToolGhor name, logo, website design, and original content belong to ToolGhor and are protected by applicable intellectual property laws. You may not copy or reuse them for commercial purposes without permission.

## Your Content
You keep all rights to the files and content you process with our tools. Using a tool does not transfer any ownership of your content to ToolGhor.

## Third-Party Rights
We respect the intellectual property rights of others. Do not use the tools to infringe anyone's copyright or other rights.

## Reporting Infringement
If you believe material connected with this website infringes your copyright, contact us through the Contact section with details of the work and where it appears, and we will review the request promptly.`,
    body_bn: `## আমাদের কনটেন্ট
ToolGhor নাম, লোগো, ওয়েবসাইট ডিজাইন ও মৌলিক কনটেন্ট ToolGhor-এর সম্পত্তি এবং প্রযোজ্য মেধা সম্পত্তি আইন দ্বারা সুরক্ষিত। অনুমতি ছাড়া বাণিজ্যিক উদ্দেশ্যে এগুলো কপি বা পুনঃব্যবহার করা যাবে না।

## আপনার কনটেন্ট
আমাদের টুল দিয়ে প্রসেস করা ফাইল ও কনটেন্টের সকল অধিকার আপনারই থাকে। টুল ব্যবহারে আপনার কনটেন্টের কোনো মালিকানা ToolGhor-এর কাছে হস্তান্তরিত হয় না।

## তৃতীয় পক্ষের অধিকার
আমরা অন্যদের মেধা সম্পত্তির অধিকারকে সম্মান করি। কারো কপিরাইট বা অন্য অধিকার লঙ্ঘন করতে টুলগুলো ব্যবহার করবেন না।

## লঙ্ঘনের অভিযোগ
আপনার কপিরাইট লঙ্ঘন হয়েছে বলে মনে করলে Contact অংশের মাধ্যমে কাজের বিবরণ ও তা কোথায় আছে জানিয়ে আমাদের সাথে যোগাযোগ করুন — আমরা অনুরোধটি দ্রুত পর্যালোচনা করব।`,
  },

  third_party: {
    id: 'third_party',
    table_name: 'section_policy_third_party',
    title_en: 'Third-Party Services',
    title_bn: 'তৃতীয় পক্ষের সেবা',
    body_en: `Some ToolGhor tools work with third-party services to deliver their function. Depending on the tool you use, these may include:
Background removal processing (remove.bg)
File conversion services (ConvertAPI, iLovePDF)
AI providers for AI-powered features (Google Gemini, OpenAI)
Source platforms accessed by the video downloading tools

Most tools do not use any external service at all — they work fully in your browser.

When a tool relies on a third-party service, that provider's own terms and privacy policy also apply to that processing. ToolGhor is not responsible for the availability or behavior of third-party services.`,
    body_bn: `কিছু ToolGhor টুল তাদের কাজ সম্পন্ন করতে তৃতীয় পক্ষের সেবার সাথে কাজ করে। আপনি কোন টুল ব্যবহার করছেন তার উপর নির্ভর করে এর মধ্যে থাকতে পারে:
ব্যাকগ্রাউন্ড রিমুভাল প্রসেসিং (remove.bg)
ফাইল কনভার্সন সেবা (ConvertAPI, iLovePDF)
AI ফিচারের জন্য AI সেবাদাতা (Google Gemini, OpenAI)
ভিডিও ডাউনলোড টুল যেসব প্ল্যাটফর্ম থেকে ভিডিও আনে সেগুলো

বেশিরভাগ টুল কোনো বাইরের সেবাই ব্যবহার করে না — সেগুলো সম্পূর্ণভাবে আপনার ব্রাউজারেই কাজ করে।

কোনো টুল তৃতীয় পক্ষের সেবার উপর নির্ভর করলে, সেই প্রসেসিংয়ের ক্ষেত্রে ওই সেবাদাতার নিজস্ব শর্ত ও গোপনীয়তা নীতিও প্রযোজ্য হবে। তৃতীয় পক্ষের সেবার প্রাপ্যতা বা আচরণের জন্য ToolGhor দায়ী নয়।`,
  },

  acceptable_use: {
    id: 'acceptable_use',
    table_name: 'section_policy_acceptable_use',
    title_en: 'Acceptable Use Policy',
    title_bn: 'গ্রহণযোগ্য ব্যবহার নীতি',
    body_en: `To keep ToolGhor safe and available for everyone, you agree NOT to:
Attempt to hack, probe, overload, disrupt, or exploit the website, its servers, or its security measures.
Use the tools for illegal purposes or to infringe the rights of others.
Upload or process malicious files or content intended to harm systems or people.
Misuse automated access in a way that degrades the service for others.

We may restrict or block access, and apply rate limits, when necessary to protect the website, its infrastructure, or its users.`,
    body_bn: `ToolGhor সবার জন্য নিরাপদ ও সচল রাখতে আপনি সম্মত হচ্ছেন যে আপনি নিম্নোক্ত কাজগুলো করবেন না:
ওয়েবসাইট, এর সার্ভার বা নিরাপত্তা ব্যবস্থা হ্যাক, পরীক্ষা-আক্রমণ, ওভারলোড, ব্যাহত বা অপব্যবহারের চেষ্টা করা।
অবৈধ কাজে বা অন্যদের অধিকার লঙ্ঘনে টুল ব্যবহার করা।
সিস্টেম বা মানুষের ক্ষতির উদ্দেশ্যে তৈরি ক্ষতিকর ফাইল বা কনটেন্ট আপলোড বা প্রসেস করা।
অন্য ব্যবহারকারীদের সেবা ব্যাহত হয় এমনভাবে স্বয়ংক্রিয় অ্যাক্সেসের অপব্যবহার করা।

ওয়েবসাইট, এর অবকাঠামো বা ব্যবহারকারীদের সুরক্ষার প্রয়োজনে আমরা অ্যাক্সেস সীমিত বা বন্ধ করতে এবং rate limit প্রয়োগ করতে পারি।`,
  },

  updates: {
    id: 'updates',
    table_name: 'section_policy_updates',
    title_en: 'Policy Updates',
    title_bn: 'নীতি হালনাগাদ',
    body_en: `We may update these policies from time to time as the website, its tools, or legal requirements change.

The "Last Updated" date shown at the top of this page is revised whenever the policy content changes materially. Continuing to use ToolGhor after an update means you accept the revised policies. We encourage you to review this page periodically.`,
    body_bn: `ওয়েবসাইট, এর টুল বা আইনি প্রয়োজনের পরিবর্তনের সাথে সাথে আমরা সময়ে সময়ে এই নীতিগুলো হালনাগাদ করতে পারি।

নীতির কনটেন্টে উল্লেখযোগ্য পরিবর্তন হলেই এই পেজের উপরে দেখানো "Last Updated" তারিখটি হালনাগাদ করা হয়। হালনাগাদের পর ToolGhor ব্যবহার অব্যাহত রাখলে আপনি সংশোধিত নীতিগুলো মেনে নিচ্ছেন বলে গণ্য হবে। আমরা আপনাকে নিয়মিত এই পেজটি দেখে নেওয়ার পরামর্শ দিই।`,
  },

  contact: {
    id: 'contact',
    table_name: 'section_policy_contact',
    title_en: 'Contact Us',
    title_bn: 'যোগাযোগ করুন',
    body_en: `Questions about these policies, privacy concerns, or copyright reports — reach us at:

Email: ashifur.badhon@gmail.com

We read every message and aim to respond as promptly as we reasonably can.`,
    body_bn: `এই নীতিগুলো সম্পর্কে প্রশ্ন, গোপনীয়তা সংক্রান্ত উদ্বেগ বা কপিরাইট অভিযোগের জন্য আমাদের কাছে পৌঁছান:

ইমেইল: ashifur.badhon@gmail.com

আমরা প্রতিটি বার্তা পড়ি এবং যতটা যুক্তিসঙ্গতভাবে সম্ভব দ্রুত উত্তর দেওয়ার চেষ্টা করি।`,
  },
};
