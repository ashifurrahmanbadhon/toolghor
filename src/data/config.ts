export interface SiteConfig {
  name: string;
  nameEn: string;
  nameAccent: string;
  tagline: string;
  taglineEn: string;
  url: string;
  logo: string;
  logoDark: string;
  logoIcon: string;
  creator: {
    name: string;
    role: string;
    bio: string;
    bioBn: string;
    image: string;
    facebook: string;
    linkedin: string;
    github: string;
  };
  social: {
    facebook: string;
    linkedin: string;
    whatsapp: {
      number: string;
      textBn: string;
      textEn: string;
    };
  };
  apis: {
    removeBgKey: string;
    geminiKey: string;
    openaiKey: string;
    ilovepdfPublicKey: string;
  };
}

export const siteConfig: SiteConfig = {
  name: 'ToolGhor',
  nameEn: 'ToolGhor',
  nameAccent: '',
  tagline: 'দৈনন্দিন কাজের সব টুল, এখন এক প্ল্যাটফর্মে',
  taglineEn: 'Everyday tools, now on one modern platform',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://toolghor.com',
  logo: '/assets/logo.png',
  logoDark: '/assets/logo-dark.png',
  logoIcon: '/assets/logo-icon.png',
  creator: {
    name: 'Ashifur Rahman Badhon',
    role: 'Full Stack Engineer & Creator',
    bio: 'Passionate about crafting fast, privacy-friendly, and accessible productivity tools.',
    bioBn: 'দ্রুতগতির, নিরাপদ ও ব্যবহারবান্ধব প্রোডাক্টিভিটি টুল তৈরিতে নিবেদিত।',
    image: '/assets/creator.jpg',
    facebook: 'https://www.facebook.com/ashifurrahmanbadhon',
    linkedin: 'https://www.linkedin.com/in/ashifurrahmanbadhon',
    github: 'https://github.com/ashifurrahmanbadhon'
  },
  social: {
    facebook: 'https://www.facebook.com/ashifurrahmanbadhon',
    linkedin: 'https://www.linkedin.com/in/ashifurrahmanbadhon',
    whatsapp: {
      number: '8801521417284',
      textBn: 'হ্যালো, আপনার ToolGhor ওয়েবসাইট দেখে যোগাযোগ করছি।',
      textEn: 'Hello, I am contacting you from your ToolGhor website.'
    }
  },
  apis: {
    removeBgKey: process.env.REMOVE_BG_API_KEY || '',
    geminiKey: process.env.GEMINI_API_KEY || '',
    openaiKey: process.env.OPENAI_API_KEY || '',
    ilovepdfPublicKey: process.env.ILOVEPDF_PUBLIC_KEY || 'project_public_d3a21718d02285b2005ba3571e3946f6_rw99Gce4ea394dce81730b8c0bbc1a8f9b23a'
  }
};
