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

exports.createTodo = async function (todo) {
    try {
        const query = 'INSERT INTO todos VALUES (DEFAULT, $1, false, $2)';
        const values = [Number(todo.task_id), todo.description];
        return await pool.query(query, values);
    } catch (err) {
        console.log(err);
        return false;
    }
}

exports.updateTodoStatus = async function (todoId, status) {
    try {
        const query = 'UPDATE todos SET done = $2 WHERE todo_id = $1';
        const values = [todoId, status];
        return await pool.query(query, values);
    } catch (err) {
        console.log(err);
        return false;
    }
}