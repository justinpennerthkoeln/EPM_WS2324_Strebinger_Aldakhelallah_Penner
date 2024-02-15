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

exports.createPlatform = async function (userId, collectionId, platform, platformKey, targetDocument, username) {
    try {
        const query = 'INSERT INTO platforms VALUES (DEFAULT, $1, $2, $3, $4, $5, $6) RETURNING *';
        const values = [Number(userId), Number(collectionId), platform, platformKey, targetDocument, username];
        return await pool.query(query, values);
    } catch (err) {
        console.log(err);
        return false;
    }
}

exports.updatePlatform = async function (platformId, platformKey, targetDocument, username) {
    try {
        const query = 'UPDATE platforms SET platform_key = $2 WHERE platform_id = $1';
        const values = [platformId, platformKey];
        await pool.query(query, values);

        const query2 = 'UPDATE platforms SET target_document = $2 WHERE platform_id = $1';
        const values2 = [platformId, targetDocument];
        await pool.query(query2, values2);

        const query3 = 'UPDATE platforms SET username = $2 WHERE platform_id = $1';
        const values3 = [platformId, username];
        await pool.query(query3, values3);
    } catch (err) {
        console.log(err);
        return false;
    }
}

exports.getPlatformById = async function (platformId) {
    try {
        const query = 'SELECT * FROM platforms WHERE platform_id = $1';
        const values = [platformId];
        return await pool.query(query, values);
    } catch (err) {
        console.log(err);
        return false;
    }
}

exports.getConnectionsFromCollectionId = async function (collectionId) {
	try {
		const query = 'SELECT * FROM platforms WHERE collection_id = $1';
		const values = [collectionId];
		return await pool.query(query, values);
	} catch (err) {
        console.log(err);
		return false;
    }
}

exports.updateTargetDocument = async function (platformId, documentName) {
    try {
        const query = 'UPDATE platforms SET target_document = $2 WHERE platform_id = $1';
        const values = [platformId, documentName];
        await pool.query(query, values);
    } catch (err) {
        pool.query("ROLLBACK;");
        console.log(err);
        throw new Error(err);
    }
}

exports.deletePlatformById = async function (platformId) {
    try {
        pool.query("BEGIN;");
        const query = 'DELETE FROM platforms WHERE platform_id = $1';
        const values = [platformId];
        pool.query("COMMIT;");
        return await pool.query(query, values);
    } catch (err) {
        pool.query("ROLLBACK;");
        console.log(err);
        throw new Error(err);
    }
};