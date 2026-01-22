/**
 * 手动添加缺失的列到 ai_events 表
 */

import pg from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL not set");
  process.exit(1);
}

async function addMissingColumns() {
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("✅ Connected to database");

    // 添加缺失的列
    const alterStatements = [
      `ALTER TABLE ai_events ADD COLUMN IF NOT EXISTS "registrationUrl" TEXT`,
      `ALTER TABLE ai_events ADD COLUMN IF NOT EXISTS speakers TEXT`,
      `ALTER TABLE ai_events ADD COLUMN IF NOT EXISTS "expectedAttendees" INTEGER`,
      `ALTER TABLE ai_events ADD COLUMN IF NOT EXISTS agenda TEXT`,
      `ALTER TABLE ai_events ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT NOW()`,
    ];

    console.log("\n🔧 Adding missing columns...");
    for (const statement of alterStatements) {
      console.log(`  Executing: ${statement}`);
      await client.query(statement);
    }

    console.log("\n✅ All columns added successfully!");

    // 验证表结构
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'ai_events'
      ORDER BY ordinal_position;
    `);

    console.log("\n📋 Updated ai_events table structure:");
    console.log("=".repeat(60));
    result.rows.forEach((row) => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });
    console.log("=".repeat(60));

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.end();
  }
}

addMissingColumns();
