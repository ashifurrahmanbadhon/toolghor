import { neon } from '@neondatabase/serverless';
import { CATEGORIES, TOOLS } from '../data/registry';
import { siteConfig } from '../data/config';
import { GUIDES } from '../data/guides';
import { GENERAL_FAQ, FAQ_DATA } from '../data/seoData';

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

  const exec = async (query: any) => {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await query;
      } catch (err: any) {
        if (attempt === 2) throw err;
        await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
      }
    }
  };

  // 1. Section: Hero (Header Tagline, Search Placeholders)
  await exec(sql`
    CREATE TABLE IF NOT EXISTS section_hero (
      id INT PRIMARY KEY DEFAULT 1,
      is_active BOOLEAN NOT NULL DEFAULT true,
      tagline_bn TEXT NOT NULL,
      tagline_en TEXT NOT NULL,
      search_placeholder_bn TEXT NOT NULL,
      search_placeholder_en TEXT NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

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
      '📢 স্বাগতম ToolGhor-এ! ২৭টি দরকারি অনলাইন টুল ব্রাউজারে সম্পূর্ণ বিনামূল্যে ব্যবহার করুন।',
      '📢 Welcome to ToolGhor! 27 fast & secure web tools right inside your browser.',
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
  await sql`DELETE FROM section_tools WHERE slug = 'convert-image'`;
  await sql`
    UPDATE section_tools 
    SET title_bn = 'ছবির সাইজ পরিবর্তন', title_en = 'Resize Image', desc_bn = 'ছবির রেজোলিউশন ও ফাইলের মাপ পরিবর্তন করুন', desc_en = 'Resize image resolution and target file size'
    WHERE slug = 'resize-image'
  `;

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
      ilovepdf_active BOOLEAN NOT NULL DEFAULT true,
      ilovepdf_public_key TEXT DEFAULT '',
      ilovepdf_secret_key TEXT DEFAULT '',
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    INSERT INTO section_api_keys (id, is_active, gemini_active, gemini_key, convertapi_active, convertapi_token, removebg_active, removebg_key, openai_active, openai_key, ilovepdf_active, ilovepdf_public_key, ilovepdf_secret_key)
    VALUES (1, true, true, '', true, '', true, '', true, '', true, '', '')
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
      passcode TEXT NOT NULL,
      email VARCHAR(255) NOT NULL DEFAULT 'ashifur.badhon@gmail.com',
      phone VARCHAR(50) NOT NULL DEFAULT '+8801521417284',
      reset_otp VARCHAR(10),
      reset_otp_expires_at TIMESTAMP WITH TIME ZONE,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const setupPasscode = (process.env.ADMIN_SETUP_PASSCODE || process.env.ADMIN_INITIAL_PASSWORD || '').trim();
  if (setupPasscode) {
    await sql`
      INSERT INTO admin_account (id, username, passcode, email, phone)
      VALUES (1, 'admin', ${setupPasscode}, 'ashifur.badhon@gmail.com', '+8801521417284')
      ON CONFLICT (id) DO NOTHING;
    `;
  }

  // 10. Password Reset Challenges (Cryptographically secure, hashed OTP, attempts, resend cooldown, and single-use bearer reset tokens)
  await sql`
    CREATE TABLE IF NOT EXISTS password_reset_challenges (
      id VARCHAR(64) PRIMARY KEY,
      account_id INT NOT NULL,
      email VARCHAR(255) NOT NULL,
      otp_hash VARCHAR(128) NOT NULL,
      otp_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      attempts INT NOT NULL DEFAULT 0,
      max_attempts INT NOT NULL DEFAULT 5,
      resend_cooldown_until TIMESTAMP WITH TIME ZONE NOT NULL,
      reset_token_hash VARCHAR(128),
      reset_token_expires_at TIMESTAMP WITH TIME ZONE,
      is_verified BOOLEAN NOT NULL DEFAULT false,
      is_consumed BOOLEAN NOT NULL DEFAULT false,
      ip_address VARCHAR(100),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_pwd_reset_email ON password_reset_challenges(email);
  `;
  // 11. Section: UI & Animation Settings (Cursor Animation, Default Theme, High Performance Mode)
  await sql`
    CREATE TABLE IF NOT EXISTS section_ui_settings (
      id INT PRIMARY KEY DEFAULT 1,
      default_theme VARCHAR(20) NOT NULL DEFAULT 'dark',
      cursor_animation_type VARCHAR(50) NOT NULL DEFAULT 'cyber-comet',
      cursor_animation_active BOOLEAN NOT NULL DEFAULT true,
      background_animation_active BOOLEAN NOT NULL DEFAULT true,
      high_performance_mode BOOLEAN NOT NULL DEFAULT true,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    INSERT INTO section_ui_settings (id, default_theme, cursor_animation_type, cursor_animation_active, background_animation_active, high_performance_mode)
    VALUES (1, 'dark', 'cyber-comet', true, true, true)
    ON CONFLICT (id) DO NOTHING;
  `;

  // 12. Section: Legal Pages (Privacy Policy, Terms of Service)
  await sql`
    CREATE TABLE IF NOT EXISTS section_legal_pages (
      slug VARCHAR(50) PRIMARY KEY,
      title_bn TEXT NOT NULL,
      title_en TEXT NOT NULL,
      content_bn TEXT NOT NULL,
      content_en TEXT NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    INSERT INTO section_legal_pages (slug, title_bn, title_en, content_bn, content_en)
    VALUES (
      'privacy',
      'গোপনীয়তা নীতি (Privacy Policy)',
      'Privacy Policy',
      'ToolGhor আপনার গোপনীয়তাকে সর্বোচ্চ অগ্রাধিকার দেয়। আমাদের সকল টুল ব্রাউজারে ক্লায়েন্ট-সাইডে সম্পূর্ণ নিরাপদভাবে চলে। আপনার কোনো ছবি, ডকুমেন্ট বা ব্যক্তিগত ফাইল আমাদের সার্ভারে সংরক্ষণ বা আপলোড করা হয় না।',
      'ToolGhor prioritizes your privacy above all. All productivity tools run 100% client-side inside your browser. None of your photos, documents, or personal files are stored or uploaded to our servers.'
    )
    ON CONFLICT (slug) DO NOTHING;
  `;

  await sql`
    INSERT INTO section_legal_pages (slug, title_bn, title_en, content_bn, content_en)
    VALUES (
      'terms',
      'ব্যবহারের শর্তাবলী (Terms of Service)',
      'Terms of Service',
      'ToolGhor-এর সমস্ত সেবা সম্পূর্ণ বিনামূল্যে ব্যবহারের জন্য উন্মুক্ত। ব্যবহারকারী তার নিজস্ব ফাইলের সঠিক ব্যবহারের জন্য দায়বদ্ধ। সাইটটি কোনো অবৈধ বা অনৈতিক উদ্দেশ্যে ব্যবহার করা সম্পূর্ণ নিষিদ্ধ।',
      'All services on ToolGhor are completely free for personal and professional use. Users are solely responsible for the legitimate use of their files. Any illegal or unauthorized usage is strictly prohibited.'
    )
    ON CONFLICT (slug) DO NOTHING;
  `;

  // 13. Policy Sections (Each policy lives in its own separate table)
  const policyTables = [
    'section_policy_terms',
    'section_policy_privacy',
    'section_policy_cookies',
    'section_policy_disclaimer',
    'section_policy_ip',
    'section_policy_third_party',
    'section_policy_acceptable_use',
    'section_policy_updates',
    'section_policy_contact',
  ];

  for (const tbl of policyTables) {
    await sql.query(`
      CREATE TABLE IF NOT EXISTS ${tbl} (
        id INT PRIMARY KEY DEFAULT 1,
        title_en TEXT NOT NULL,
        title_bn TEXT NOT NULL,
        body_en TEXT NOT NULL,
        body_bn TEXT NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  // 14. Section: Remove AI Label Tool (Dedicated Separate Table)
  await sql`
    CREATE TABLE IF NOT EXISTS section_tool_remove_ai_label (
      id INT PRIMARY KEY DEFAULT 1,
      name_en TEXT NOT NULL,
      name_bn TEXT NOT NULL,
      description_en TEXT NOT NULL,
      description_bn TEXT NOT NULL,
      icon VARCHAR(50) NOT NULL DEFAULT 'ShieldCheck',
      enabled BOOLEAN NOT NULL DEFAULT true,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    INSERT INTO section_tool_remove_ai_label (id, name_en, name_bn, description_en, description_bn, icon, enabled)
    VALUES (
      1,
      'Remove AI Label',
      'AI লেবেল রিমুভার',
      'Remove AI labels & metadata (C2PA, EXIF, XMP) from photos — free, in your browser, no upload.',
      'ছবি থেকে AI লেবেল ও মেটাডেটা (C2PA, EXIF, XMP) মুছে ফেলুন — ফ্রি, ব্রাউজারেই, কোনো আপলোড ছাড়াই।',
      'ShieldCheck',
      true
    )
    ON CONFLICT (id) DO NOTHING;
  `;

  // 15. Content: Guides (content_guides)
  await sql`
    CREATE TABLE IF NOT EXISTS content_guides (
      slug VARCHAR(120) PRIMARY KEY,
      sort_order INT NOT NULL DEFAULT 1,
      enabled BOOLEAN NOT NULL DEFAULT true,
      category VARCHAR(80) NOT NULL DEFAULT 'practical',
      read_minutes INT NOT NULL DEFAULT 4,
      title_en TEXT NOT NULL,
      title_bn TEXT NOT NULL,
      description_en TEXT NOT NULL,
      description_bn TEXT NOT NULL,
      hero_en TEXT NOT NULL,
      hero_bn TEXT NOT NULL,
      sections_en JSONB NOT NULL DEFAULT '[]'::jsonb,
      sections_bn JSONB NOT NULL DEFAULT '[]'::jsonb,
      faq_en JSONB NOT NULL DEFAULT '[]'::jsonb,
      faq_bn JSONB NOT NULL DEFAULT '[]'::jsonb,
      tool_slug VARCHAR(120),
      tool_slug_2 VARCHAR(120),
      meta_title TEXT,
      meta_description TEXT,
      date_published VARCHAR(30) DEFAULT '2026-10-23',
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  for (let i = 0; i < GUIDES.length; i++) {
    const g = GUIDES[i];
    const sections_en = g.sections.map((s) => ({
      heading: s.heading.en,
      paragraphs: s.paragraphs?.en || [],
      bullets: s.bullets?.en || [],
      steps: s.steps?.en || [],
      paragraphsAfter: s.paragraphsAfter?.en || [],
      cta: s.cta ? { toolSlug: s.cta.toolSlug, label: s.cta.label.en } : null,
    }));
    const sections_bn = g.sections.map((s) => ({
      heading: s.heading.bn,
      paragraphs: s.paragraphs?.bn || [],
      bullets: s.bullets?.bn || [],
      steps: s.steps?.bn || [],
      paragraphsAfter: s.paragraphsAfter?.bn || [],
      cta: s.cta ? { toolSlug: s.cta.toolSlug, label: s.cta.label.bn } : null,
    }));
    const faq_en = g.faq.map((f) => ({ q: f.en.q, a: f.en.a }));
    const faq_bn = g.faq.map((f) => ({ q: f.bn.q, a: f.bn.a }));

    await sql`
      INSERT INTO content_guides (
        slug, sort_order, enabled, category, read_minutes,
        title_en, title_bn, description_en, description_bn,
        hero_en, hero_bn, sections_en, sections_bn,
        faq_en, faq_bn, tool_slug, tool_slug_2,
        meta_title, meta_description, date_published
      )
      VALUES (
        ${g.slug},
        ${i + 1},
        true,
        'practical',
        ${g.slug.includes('land') ? 6 : 4},
        ${g.title.en},
        ${g.title.bn},
        ${g.excerpt.en},
        ${g.excerpt.bn},
        ${g.intro.en.join('\n\n')},
        ${g.intro.bn.join('\n\n')},
        ${JSON.stringify(sections_en)}::jsonb,
        ${JSON.stringify(sections_bn)}::jsonb,
        ${JSON.stringify(faq_en)}::jsonb,
        ${JSON.stringify(faq_bn)}::jsonb,
        ${g.relatedTools[0] || null},
        ${g.relatedTools[1] || null},
        ${g.metaTitle},
        ${g.metaDescription},
        ${g.datePublished}
      )
      ON CONFLICT (slug) DO NOTHING;
    `;
  }

  // 16. Content: FAQ Items (content_faq_items)
  await sql`
    CREATE TABLE IF NOT EXISTS content_faq_items (
      id SERIAL PRIMARY KEY,
      scope VARCHAR(120) NOT NULL,
      sort_order INT NOT NULL DEFAULT 1,
      enabled BOOLEAN NOT NULL DEFAULT true,
      question_en TEXT NOT NULL,
      question_bn TEXT NOT NULL,
      answer_en TEXT NOT NULL,
      answer_bn TEXT NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_faq_scope ON content_faq_items(scope);
  `;

  const faqCountRes = await sql`SELECT COUNT(*)::int AS count FROM content_faq_items;`;
  if (!faqCountRes[0] || faqCountRes[0].count === 0) {
    for (let i = 0; i < GENERAL_FAQ.length; i++) {
      const f = GENERAL_FAQ[i];
      await sql`
        INSERT INTO content_faq_items (scope, sort_order, enabled, question_en, question_bn, answer_en, answer_bn)
        VALUES ('general', ${i + 1}, true, ${f.en.q}, ${f.bn.q}, ${f.en.a}, ${f.bn.a});
      `;
    }
    for (const [toolSlug, items] of Object.entries(FAQ_DATA)) {
      for (let i = 0; i < items.length; i++) {
        const f = items[i];
        await sql`
          INSERT INTO content_faq_items (scope, sort_order, enabled, question_en, question_bn, answer_en, answer_bn)
          VALUES (${toolSlug}, ${i + 1}, true, ${f.en.q}, ${f.bn.q}, ${f.en.a}, ${f.bn.a});
        `;
      }
    }
  } else {
    // Idempotent repair: if any general-scope row has an empty question_en, the whole
    // general scope was corrupted (e.g. an admin save wrote blanks). Re-seed it from code defaults.
    const generalCheck = await sql`
      SELECT COUNT(*)::int AS bad
      FROM content_faq_items
      WHERE scope = 'general' AND (question_en = '' OR question_en IS NULL);
    `;
    const badCount = generalCheck[0]?.bad ?? 0;
    if (badCount > 0) {
      await sql`DELETE FROM content_faq_items WHERE scope = 'general';`;
      for (let i = 0; i < GENERAL_FAQ.length; i++) {
        const f = GENERAL_FAQ[i];
        await sql`
          INSERT INTO content_faq_items (scope, sort_order, enabled, question_en, question_bn, answer_en, answer_bn)
          VALUES ('general', ${i + 1}, true, ${f.en.q}, ${f.bn.q}, ${f.en.a}, ${f.bn.a});
        `;
      }
    }
  }

  isInitialized = true;
  return { success: true };
}
