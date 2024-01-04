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
        const query = 'INSERT INTO feedbacks VALUES (DEFAULT, $1, $2, $3, $4) RETURNING *';
        const values = [Number(feedback.membership_id), Number(feedback.task_id), feedback.comment, currentDate.toISOString()];
        return await pool.query(query, values);
    } catch (error) {
        console.log(error);
        return false;
    }
}

exports.getFeedbacksWithUsersByTaskId = async function (task_id) {
    try {
        const query = `
            SELECT 
                feedbacks.*,
                users.username
            FROM 
                feedbacks
                INNER JOIN memberships ON feedbacks.membership_id = memberships.membership_id
                INNER JOIN users ON memberships.user_id = users.id
            WHERE 
                feedbacks.task_id = $1`;
        const values = [Number(task_id)];
        return await pool.query(query, values);
    } catch (error) {
        console.log(error);
        return false;
    }
}