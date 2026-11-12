const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

async function test() {
  try {
    console.log("Connecting to MySQL at " + process.env.DB_HOST);
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'Applea@12345',
      database: process.env.DB_NAME || 'reqarchitect_db'
    });

    console.log("Connected successfully!");

    const [tables] = await connection.execute('SHOW TABLES');
    console.log("\nTables found:", tables.length);

    for (const row of tables) {
      const tableName = Object.values(row)[0];
      const [count] = await connection.execute(`SELECT COUNT(*) as c FROM ${tableName}`);
      console.log(`- ${tableName}: ${count[0].c} rows`);
    }

    await connection.end();
  } catch (err) {
    console.error("Database connection failed:", err.message);
  }
}

test();
