/**
 * 检查数据库表结构
 */

import pg from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL not set");
  process.exit(1);
}

async function checkDbStructure() {
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("✅ Connected to database");

    // 查询 ai_events 表的列信息
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'ai_events'
      ORDER BY ordinal_position;
    `);

    console.log("\n📋 ai_events 表结构:");
    console.log("=".repeat(60));
    result.rows.forEach((row) => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });
    console.log("=".repeat(60));

    // 查询表中的数据数量
    const countResult = await client.query("SELECT COUNT(*) FROM ai_events");
    console.log(`\n📊 当前会议数量: ${countResult.rows[0].count}`);

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.end();
  }
}

checkDbStructure();
