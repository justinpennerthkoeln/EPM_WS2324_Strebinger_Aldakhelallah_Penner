const { Pool } = require('pg');

const credentials = process.env.DB_CONFIG;

if(!credentials) {
    throw new Error('Database credentials not found.');
}

// Connect to PostgreSQL
const pool = new Pool(JSON.parse(credentials));

exports.createCollection = async (name, description, timestamp) => {
    try {
        const newCollection = await pool.query("INSERT INTO collections (name, description, timestamp) VALUES ($1, $2, $3) RETURNING *", [name, description, timestamp]);
        return newCollection.rows[0];
    } catch (error) {
        console.log(error);
        throw new Error("Error creating collection.");
    }
};