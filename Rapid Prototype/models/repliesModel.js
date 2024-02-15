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


exports.saveReply = async function (reply) {
    try {
        const currentDate = new Date();
        const query = 'INSERT INTO replies VALUES (DEFAULT, $1, $2, $3, $4) RETURNING *';
        const values = [reply.username, Number(reply.feedback_id), reply.comment, currentDate.toISOString()];
        return await pool.query(query, values);
    } catch (error) {
        console.log(error);
        return false;
    }
}