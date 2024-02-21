const { Pool } = require('pg');

const credentials = process.env.DB_CONFIG;

if(!credentials) {
    throw new Error('Database credentials not found.');
}

// Connect to PostgreSQL
const pool = new Pool(JSON.parse(credentials));

exports.createPlatform = async (userId, collectionId, platform, platformKey, targetDocument, username) => {
    try {
        const newPlatform = await pool.query("INSERT INTO platforms (user_id, collection_id, platform, platform_key, target_document, username) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *", [userId, collectionId, platform, platformKey, targetDocument, username]);
        return newPlatform.rows[0];
    } catch (error) {
        console.log(error);
        throw new Error("Error creating platform.");
    }
};

exports.updatePlatform = async (platformId, platformKey, targetDocument, username) => {
    try {
        const updatedPlatform = await pool.query("UPDATE platforms SET platform_key = $1, target_document = $2, username = $3 WHERE platform_id = $4 RETURNING *", [platformKey, targetDocument, username, platformId]);
        return updatedPlatform.rows[0];
    } catch (error) {
        console.log(error);
        throw new Error("Error updating platform.");
    }
};

exports.getPlatformsByCollectionId = async (collectionId) => {
    try {
        const platforms = await pool.query("SELECT * FROM platforms WHERE collection_id = $1", [collectionId]);
        return platforms.rows;
    } catch (error) {
        console.log(error);
        throw new Error("Error getting platforms.");
    }
};

exports.getPlatformById = async function (platformId) {
    try {
        const query = 'SELECT * FROM platforms WHERE platform_id = $1';
        const values = [platformId];
        return await pool.query(query, values);
    } catch (err) {
        console.log(err);
        return false;
    }
};

exports.updateTargetDocument = async (platformId, targetDocument) => {
    try {
        const updatedPlatform = await pool.query("UPDATE platforms SET target_document = $1 WHERE platform_id = $2 RETURNING *", [targetDocument, platformId]);
        return updatedPlatform.rows[0];
    } catch (error) {
        console.log(error);
        throw new Error("Error updating platform.");
    }
};

exports.deletePlatform = async (platformId) => {
    try {
        await pool.query("DELETE FROM platforms WHERE platform_id = $1", [platformId]);
    } catch (error) {
        console.log(error);
        throw new Error("Error deleting platform.");
    }
};
