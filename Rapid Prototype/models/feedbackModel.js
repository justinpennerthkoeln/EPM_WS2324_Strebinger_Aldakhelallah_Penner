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

exports.saveFeedback = async function (feedback) {
    try {
        const currentDate = new Date();
        const query = 'INSERT INTO feedbacks VALUES (DEFAULT, $1, $2, $3, $4)';
        const values = [Number(feedback.membership_id), Number(feedback.task_id), feedback.comment, currentDate.toISOString()];
        await pool.query(query, values);
    } catch (error) {
        console.log(error);
        return false;
    }
}