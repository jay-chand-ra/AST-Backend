const fs = require('fs');
const path = require('path');
const db = require('./utils/db');

const schemaPath = path.join(__dirname, '../../database/schema.sql');
console.log('Schema path:', schemaPath);

const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

async function initDb() {
  try {
    await db.query(schemaSQL);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await db.close();
  }
}

initDb();
