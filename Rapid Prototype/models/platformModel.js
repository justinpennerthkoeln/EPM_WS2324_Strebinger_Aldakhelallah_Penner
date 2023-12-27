const { Pool } = require('pg');
const DOTENV = require('dotenv');
DOTENV.config();

// Credentials for the database connection
const credentials = {
	user: process.env.DB_USER,
	host: process.env.DB_HOST,
	database: 'postgres',
	password: process.env.DB_PASSWORD,
	port: process.env.DB_PORT,
	
};

// Connect to PostgreSQL
const pool = new Pool(credentials);

exports.getPlatformsByCollectionId = async function (collection_id) {
    try {
        const query = 'SELECT * FROM platforms WHERE collection_id = $1';
        const values = [collection_id];
        return await pool.query(query, values);
    } catch (err) {
        console.log(err);
        return false;
    }
}

exports.createPlatform = async function (userId, collectionId, platform, platformKey, targetDocument) {
    try {
        const query = 'INSERT INTO platforms VALUES (DEFAULT, $1, $2, $3, $4, $5) RETURNING *';
        const values = [Number(userId), Number(collectionId), platform, platformKey, targetDocument];
        return await pool.query(query, values);
    } catch (err) {
        console.log(err);
        return false;
    }
}

exports.updatePlatform = async function (platformId, platformKey, targetDocument) {
    try {
        const query = 'UPDATE platforms SET platform_key = $2 WHERE platform_id = $1';
        const values = [platformId, platformKey];
        await pool.query(query, values);

        const query2 = 'UPDATE platforms SET target_document = $2 WHERE platform_id = $1';
        const values2 = [platformId, targetDocument];
        await pool.query(query2, values2);
    } catch (err) {
        console.log(err);
        return false;
    }
}