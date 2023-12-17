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

exports.getTasksByCollectionId = async function (collection_id) {
	try {
		const query = 'SELECT * FROM tasks WHERE collection_id = $1';
		const values = [collection_id];
		return await pool.query(query, values);
	} catch (err) {
        console.log(err);
		return false;
    }
}