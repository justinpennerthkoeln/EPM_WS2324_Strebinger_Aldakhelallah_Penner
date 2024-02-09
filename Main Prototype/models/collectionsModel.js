const { Pool } = require('pg');

const credentials = process.env.DB_CONFIG;

if(!credentials) {
    throw new Error('Database credentials not found.');
}

// Connect to PostgreSQL
const pool = new Pool(JSON.parse(credentials));
