import { neon } from '@neondatabase/serverless';

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

// Ensure database schema exists and is initialized
export async function initDatabase() {
  const sql = getDb();

  // 1. Tool statuses table
  await sql`
    CREATE TABLE IF NOT EXISTS tool_statuses (
      slug VARCHAR(100) PRIMARY KEY,
      is_active BOOLEAN NOT NULL DEFAULT true,
      badge VARCHAR(50),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // 2. Site settings table
  await sql`
    CREATE TABLE IF NOT EXISTS site_settings (
      key VARCHAR(100) PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // 3. Analytics table
  await sql`
    CREATE TABLE IF NOT EXISTS tool_analytics (
      slug VARCHAR(100) PRIMARY KEY,
      count BIGINT NOT NULL DEFAULT 0,
      last_used TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // 4. Contact / feedback table
  await sql`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id SERIAL PRIMARY KEY,
      name VARCHAR(150),
      email VARCHAR(150),
      message TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Insert default announcement if not present
  const defaultAnnouncement = {
    enabled: true,
    textBn: 'ToolGhor এখন Next.js এবং Neon PostgreSQL ক্লাউড ডাটাবেস দ্বারা পরিচালিত!',
    textEn: 'ToolGhor is now fully powered by Next.js and Neon PostgreSQL cloud database!',
  };

  await sql`
    INSERT INTO site_settings (key, value)
    VALUES ('announcement', ${JSON.stringify(defaultAnnouncement)}::jsonb)
    ON CONFLICT (key) DO NOTHING;
  `;

  return { success: true };
}
