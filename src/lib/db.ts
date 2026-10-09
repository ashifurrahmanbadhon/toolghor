import { neon } from '@neondatabase/serverless';
import { CATEGORIES, TOOLS } from '@/data/registry';
import { siteConfig } from '@/data/config';

function getDbUrl() {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL;
  if (!url) {
    throw new Error('Database connection string is missing in environment variables.');
  }
  return url;
}

export function getDb() {
  const url = getDbUrl();
  return neon(url);
}

let isInitialized = false;

// Ensure every single section has its own separate database table
export async function initDatabase() {
  if (isInitialized) return;
  const sql = getDb();

  // 1. Section: Hero (Header Tagline, Search Placeholders)
  await sql`
    CREATE TABLE IF NOT EXISTS section_hero (
      id INT PRIMARY KEY DEFAULT 1,
      is_active BOOLEAN NOT NULL DEFAULT true,
      tagline_bn TEXT NOT NULL,
      tagline_en TEXT NOT NULL,
      search_placeholder_bn TEXT NOT NULL,
      search_placeholder_en TEXT NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Seed default hero if empty
  await sql`
    INSERT INTO section_hero (id, is_active, tagline_bn, tagline_en, search_placeholder_bn, search_placeholder_en)
    VALUES (
      1,
      true,
      'দৈনন্দিন কাজের সব টুল, এখন এক প্ল্যাটফর্মে',
      'Everyday tools, now on one platform',
      'কী দরকার? যেমন: পিডিএফ, ছবি, কিউআর, বয়স…',
      'What do you need? e.g. PDF, image, QR, age…'
    )
    ON CONFLICT (id) DO NOTHING;
  `;

  // 2. Section: Announcement Banner
  await sql`
    CREATE TABLE IF NOT EXISTS section_announcement (
      id INT PRIMARY KEY DEFAULT 1,
      is_active BOOLEAN NOT NULL DEFAULT false,
      text_bn TEXT NOT NULL,
      text_en TEXT NOT NULL,
      type VARCHAR(20) NOT NULL DEFAULT 'info',
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Seed default announcement if empty
  await sql`
    INSERT INTO section_announcement (id, is_active, text_bn, text_en, type)
    VALUES (
      1,
      false,
      '📢 স্বাগতম ToolGhor-এ! ২৮+ দরকারি অনলাইন টুল ব্রাউজারে সম্পূর্ণ বিনামূল্যে ব্যবহার করুন।',
      '📢 Welcome to ToolGhor! 28+ fast & secure web tools right inside your browser.',
      'info'
    )
    ON CONFLICT (id) DO NOTHING;
  `;

  // 3. Section: Categories
  await sql`
    CREATE TABLE IF NOT EXISTS section_categories (
      slug VARCHAR(50) PRIMARY KEY,
      is_active BOOLEAN NOT NULL DEFAULT true,
      title_bn TEXT NOT NULL,
      title_en TEXT NOT NULL,
      desc_bn TEXT NOT NULL,
      desc_en TEXT NOT NULL,
      symbol VARCHAR(10) NOT NULL,
      display_order INT NOT NULL DEFAULT 0,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Seed categories from registry if empty
  for (let i = 0; i < CATEGORIES.length; i++) {
    const cat = CATEGORIES[i];
    await sql`
      INSERT INTO section_categories (slug, is_active, title_bn, title_en, desc_bn, desc_en, symbol, display_order)
      VALUES (${cat.id}, true, ${cat.bn}, ${cat.en}, ${cat.desc}, ${cat.descEn}, ${cat.symbol}, ${i})
      ON CONFLICT (slug) DO NOTHING;
    `;
  }

  // 4. Section: Tools
  await sql`
    CREATE TABLE IF NOT EXISTS section_tools (
      slug VARCHAR(100) PRIMARY KEY,
      category_slug VARCHAR(50) NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT true,
      title_bn TEXT NOT NULL,
      title_en TEXT NOT NULL,
      desc_bn TEXT NOT NULL,
      desc_en TEXT NOT NULL,
      badge VARCHAR(50) DEFAULT '',
      display_order INT NOT NULL DEFAULT 0,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Seed tools from registry if empty
  for (let i = 0; i < TOOLS.length; i++) {
    const tool = TOOLS[i];
    await sql`
      INSERT INTO section_tools (slug, category_slug, is_active, title_bn, title_en, desc_bn, desc_en, badge, display_order)
      VALUES (
        ${tool.slug},
        ${tool.cats[0]},
        true,
        ${tool.bn},
        ${tool.en},
        ${tool.desc},
        ${tool.descEn},
        ${tool.badge || ''},
        ${i}
      )
      ON CONFLICT (slug) DO NOTHING;
    `;
  }

  // 5. Section: Footer & Social Links (including WhatsApp Floating Action Button)
  await sql`
    CREATE TABLE IF NOT EXISTS section_footer_social (
      id INT PRIMARY KEY DEFAULT 1,
      is_active BOOLEAN NOT NULL DEFAULT true,
      copyright_text_bn TEXT NOT NULL,
      copyright_text_en TEXT NOT NULL,
      whatsapp_active BOOLEAN NOT NULL DEFAULT true,
      whatsapp_number VARCHAR(50) NOT NULL,
      whatsapp_text_bn TEXT NOT NULL,
      whatsapp_text_en TEXT NOT NULL,
      facebook_active BOOLEAN NOT NULL DEFAULT true,
      facebook_url TEXT NOT NULL,
      linkedin_active BOOLEAN NOT NULL DEFAULT true,
      linkedin_url TEXT NOT NULL,
      github_active BOOLEAN NOT NULL DEFAULT true,
      github_url TEXT NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Seed default footer/social if empty
  await sql`
    INSERT INTO section_footer_social (
      id, is_active, copyright_text_bn, copyright_text_en,
      whatsapp_active, whatsapp_number, whatsapp_text_bn, whatsapp_text_en,
      facebook_active, facebook_url, linkedin_active, linkedin_url, github_active, github_url
    )
    VALUES (
      1,
      true,
      'আপনার ফাইল ও তথ্য সরাসরি আপনার ব্রাউজারেই প্রসেস করা হয়।',
      'Your files and data are processed in your browser.',
      true,
      ${siteConfig.social?.whatsapp?.number || '8801700000000'},
      ${siteConfig.social?.whatsapp?.textBn || 'আসসালামু আলাইকুম, ToolGhor নিয়ে কিছু জানতে চাই।'},
      ${siteConfig.social?.whatsapp?.textEn || 'Hello, I have a question about ToolGhor.'},
      true,
      ${siteConfig.creator?.facebook || 'https://www.facebook.com/ashifurrahmanbadhon'},
      true,
      ${siteConfig.creator?.linkedin || 'https://www.linkedin.com/in/ashifurrahmanbadhon'},
      true,
      ${siteConfig.creator?.github || 'https://github.com/ashifurrahmanbadhon'}
    )
    ON CONFLICT (id) DO NOTHING;
  `;

  // 6. Section: Creator & About Info
  await sql`
    CREATE TABLE IF NOT EXISTS section_creator_about (
      id INT PRIMARY KEY DEFAULT 1,
      is_active BOOLEAN NOT NULL DEFAULT true,
      name TEXT NOT NULL,
      role_bn TEXT NOT NULL,
      role_en TEXT NOT NULL,
      email_active BOOLEAN NOT NULL DEFAULT true,
      email TEXT NOT NULL,
      bio_bn TEXT NOT NULL,
      bio_en TEXT NOT NULL,
      social_active BOOLEAN NOT NULL DEFAULT true,
      facebook_url TEXT NOT NULL,
      linkedin_url TEXT NOT NULL,
      github_url TEXT DEFAULT 'https://github.com/ashifurrahmanbadhon',
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Seed default creator if empty
  await sql`
    INSERT INTO section_creator_about (
      id, is_active, name, role_bn, role_en, email_active, email, bio_bn, bio_en, social_active, facebook_url, linkedin_url, github_url
    )
    VALUES (
      1,
      true,
      'Ashifur Rahman',
      'প্রতিষ্ঠাতা ও নির্মাতা, ToolGhor',
      'Founder & Creator, ToolGhor',
      true,
      'ashifur.badhon@gmail.com',
      'দৈনন্দিন জীবনের সব ডিজিটাল টুলকে সহজ, দ্রুত ও শতভাগ নিরাপদ করার লক্ষ্য নিয়ে কাজ করছি।',
      'Dedicated to making everyday digital tools fast, simple, and 100% private directly in the browser.',
      true,
      'https://www.facebook.com/ashifurrahmanbadhon',
      'https://www.linkedin.com/in/ashifurrahmanbadhon',
      'https://github.com/ashifurrahmanbadhon'
    )
    ON CONFLICT (id) DO NOTHING;
  `;

  // 7. Section: API Keys Config
  await sql`
    CREATE TABLE IF NOT EXISTS section_api_keys (
      id INT PRIMARY KEY DEFAULT 1,
      is_active BOOLEAN NOT NULL DEFAULT true,
      gemini_active BOOLEAN NOT NULL DEFAULT true,
      gemini_key TEXT DEFAULT '',
      convertapi_active BOOLEAN NOT NULL DEFAULT true,
      convertapi_token TEXT DEFAULT '',
      removebg_active BOOLEAN NOT NULL DEFAULT true,
      removebg_key TEXT DEFAULT '',
      openai_active BOOLEAN NOT NULL DEFAULT true,
      openai_key TEXT DEFAULT '',
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    INSERT INTO section_api_keys (id, is_active, gemini_active, gemini_key, convertapi_active, convertapi_token, removebg_active, removebg_key, openai_active, openai_key)
    VALUES (1, true, true, '', true, '', true, '', true, '')
    ON CONFLICT (id) DO NOTHING;
  `;

  // 8. Tool Analytics
  await sql`
    CREATE TABLE IF NOT EXISTS tool_analytics (
      slug VARCHAR(100) PRIMARY KEY,
      count BIGINT NOT NULL DEFAULT 0,
      last_used TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // 9. Admin Account / Authentication & Profile
  await sql`
    CREATE TABLE IF NOT EXISTS admin_account (
      id INT PRIMARY KEY DEFAULT 1,
      username VARCHAR(100) NOT NULL DEFAULT 'admin',
      passcode TEXT NOT NULL DEFAULT 'admin123',
      email VARCHAR(255) NOT NULL DEFAULT 'ashifur.badhon@gmail.com',
      phone VARCHAR(50) NOT NULL DEFAULT '+8801521417284',
      reset_otp VARCHAR(10),
      reset_otp_expires_at TIMESTAMP WITH TIME ZONE,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    INSERT INTO admin_account (id, username, passcode, email, phone)
    VALUES (1, 'admin', 'admin123', 'ashifur.badhon@gmail.com', '+8801521417284')
    ON CONFLICT (id) DO NOTHING;
  `;

  isInitialized = true;
  return { success: true };
}
