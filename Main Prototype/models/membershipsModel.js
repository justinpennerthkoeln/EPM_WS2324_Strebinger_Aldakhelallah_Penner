const { Pool } = require('pg');

const credentials = process.env.DB_CONFIG;

if(!credentials) {
    throw new Error('Database credentials not found.');
}

// Connect to PostgreSQL
const pool = new Pool(JSON.parse(credentials));

exports.getCollectionsByUserId = async (userId) => {
    try {
        const collections = await pool.query(`
            SELECT c.*
            FROM collections c
            JOIN memberships m ON c.collection_id = m.collection_id
            WHERE m.user_id = $1;
        `, [userId]);
        return collections.rows;
    } catch (error) {
        console.log(error);
        throw new Error("Error getting collections by user id.");
    }
};

exports.setMembership = async (userId, collectionId) => {
    try {
        const newMembership = await pool.query("INSERT INTO memberships (user_id, collection_id, role) VALUES ($1, $2, $3) RETURNING *", [userId, collectionId, "project manager"]);
        return newMembership.rows[0];
    } catch (error) {
        console.log(error);
        throw new Error("Error setting membership.");
    }
}