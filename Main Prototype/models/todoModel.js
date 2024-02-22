const { Pool } = require("pg");

const credentials = process.env.DB_CONFIG;

if (!credentials) {
	throw new Error("Database credentials not found.");
}

// Connect to PostgreSQL
const pool = new Pool(JSON.parse(credentials));

exports.getTodosByTaskId = async function (taskId) {
	try {
		const query =
			"SELECT * FROM todos WHERE task_id = $1 ORDER BY timestamp ASC";
		const values = [taskId];
		return await pool.query(query, values);
	} catch (err) {
		console.log(err);
		return false;
	}
};

exports.createTodo = async function (todo) {
	try {
		const query = "INSERT INTO todos VALUES (DEFAULT, $1, false, $2, $3)";
		const values = [
			Number(todo.task_id),
			todo.description,
			new Date().toISOString(),
		];
		return await pool.query(query, values);
	} catch (err) {
		console.log(err);
		return false;
	}
};

exports.updateTodo = async function (todo) {
	try {
		const query = "UPDATE todos SET done = $2 WHERE todo_id = $1";
		const values = [todo.todo_id, todo.status];
		return await pool.query(query, values);
	} catch (err) {
		console.log(err);
		return false;
	}
};

exports.deleteTodosByTaskId = async function (taskId) {
    try {
        const query = "DELETE FROM todos WHERE task_id = $1";
        const values = [taskId];
        return await pool.query(query, values);
    } catch (err) {
        console.log(err);
        return false;
    }
};
