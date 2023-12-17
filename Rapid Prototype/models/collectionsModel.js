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