const { Pool } = require('pg');

const credentials = process.env.DB_CONFIG;

if(!credentials) {
    throw new Error('Database credentials not found.');
}

// Connect to PostgreSQL
const pool = new Pool(JSON.parse(credentials));

exports.checkCredentials = async (username, password) => {
    try {
        const countUser = await pool.query("SELECT count(*), username, email, id FROM users WHERE username = $1 AND password = $2 GROUP BY users.username, users.email, users.id", [username, password]);
        return countUser.rows[0];
    } catch (error) {
        console.log(error);
        throw new Error("Error checking credentials.");
    }
};

exports.checkExist = async (email) => {
    try {
        const userCount = await pool.query("SELECT count(*) FROM users WHERE email = $1", [email]);
        return userCount.rows[0].count > 0 ? true : false;
    } catch (error) {
        console.log(error);
        throw new Error("Error checking new user.");
    }
};

exports.createUser = async (username, email, password) => {
    try {
        const newUser = await pool.query("INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *", [username, email, password]);
    } catch (error) {
        console.log(error);
        throw new Error("Error creating user.");
    }
};