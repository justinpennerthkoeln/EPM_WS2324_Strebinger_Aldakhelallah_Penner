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

exports.getMemberById = async function (userId) {
	try {
		const query = 'SELECT * FROM memberships WHERE user_id = $1';
		const values = [Number(userId)];
		return await pool.query(query, values);
	} catch (err) {
        console.log(err);
		return false;
    }
}

exports.createMember = async function (userId, collectionId, role) {
	try {
		const query = 'INSERT INTO memberships VALUES (DEFAULT, $1, $2, $3)';
		const values = [Number(userId), Number(collectionId), role];
		return await pool.query(query, values);
	} catch (err) {
		console.log(err);
		return false;
	}
}

exports.getMembershipsByUserId = async function (userId) {
	try {
		const query = 'SELECT * FROM memberships WHERE user_id = $1';
		const values = [Number(userId)];
		return await pool.query(query, values);
	} catch (err) {
		console.log(err);
		return false;
	}
}

exports.getMembershipsByCollectionId = async function (collectionId) {
	try {
		const query = 'SELECT * FROM memberships WHERE collection_id = $1';
		const values = [Number(collectionId)];
		return await pool.query(query, values);
	} catch (err) {
		console.log(err);
		return false;
	}
}