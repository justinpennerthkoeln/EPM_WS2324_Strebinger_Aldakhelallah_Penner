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

exports.getCollection = async function (uuid) {
	try {
		const query = 'SELECT * FROM collections WHERE uuid = $1';
		const values = [uuid];
		return await pool.query(query, values);
	} catch (err) {
        console.log(err);
		return false;
    }
}

exports.createCollection = async function (name, description) {
	try {
		const query = 'INSERT INTO collections VALUES (DEFAULT, DEFAULT, $1, $2, $3) RETURNING *';
		const currentDate = new Date();
		const values = [name, description, currentDate.toISOString()];
		return await pool.query(query, values);
	} catch (err) {
		console.log(err);
		return false;
	}
}

exports.getCollectionById = async function (collectionId) {
	try {
		const query = 'SELECT * FROM collections WHERE collection_id = $1';
		const values = [collectionId];
		return await pool.query(query, values);
	} catch (err) {
		console.log(err);
		return false;
	}
}