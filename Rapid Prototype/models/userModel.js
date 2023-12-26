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

exports.getByEmail = async function (email) {
    try {
        const query = 'SELECT * FROM users WHERE email = $1';
        const values = [email];
        return await pool.query(query, values);
    } catch (err) {
        console.log(err);
        return false;
    }
}

exports.createUser = async function (username, email, password) {
    try {
        const query = 'INSERT INTO users VALUES (DEFAULT, $1, $2, $3) RETURNING *';
        const values = [username, email, password];
        return await pool.query(query, values);
    } catch (err) {
        console.log(err);
        return false;
    }
}

exports.getByUsernameAndPassword = async function (username, password) {
    try {
        const query = 'SELECT * FROM users WHERE username = $1 AND password = $2';
        const values = [username, password];
        return await pool.query(query, values);
    } catch (err) {
        console.log(err);
        return false;
    }
}