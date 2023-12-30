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

exports.getTasksWithOwnershipsByCollectionId = async function (collection_id) {
	try {
		const query = `
			SELECT 
				tasks.task_id,
				tasks.collection_id,
				tasks.platform_id,
				tasks.status,
				tasks.name,
				tasks.description,
				COUNT(DISTINCT memberships.membership_id) AS assigned_users_count,
				CASE 
					WHEN COUNT(DISTINCT memberships.membership_id) > 0 
					THEN jsonb_agg(DISTINCT jsonb_build_object(
						'user_id', users.id,
						'username', users.username,
						'email', users.email
					))
					ELSE NULL
				END AS assigned_users,
				COUNT(DISTINCT feedbacks.feedback_id) AS feedbacks_count,
				CASE
					WHEN COUNT(DISTINCT todos.todo_id) > 0
					THEN COUNT(DISTINCT todos.todo_id) FILTER(WHERE todos.done) * 100.0 / COUNT(DISTINCT todos.todo_id)
					ELSE NULL
				END AS todos_progress
			FROM tasks
			LEFT JOIN ownerships ON tasks.task_id = ownerships.task_id
			LEFT JOIN memberships ON ownerships.membership_id = memberships.membership_id
			LEFT JOIN users ON memberships.user_id = users.id
			LEFT JOIN feedbacks ON tasks.task_id = feedbacks.task_id
			LEFT JOIN todos ON tasks.task_id = todos.task_id
			WHERE tasks.collection_id = $1
			GROUP BY 
				tasks.task_id, 
				tasks.collection_id, 
				tasks.platform_id, 
				tasks.status, 
				tasks.name, 
				tasks.description
			ORDER BY tasks.task_id;
		`;
		const values = [collection_id];
		return await pool.query(query, values);
	} catch (err) {
		console.error(err);
		return false;
	}
}

exports.createTask = async function (data) {
	try {
		const query = 'INSERT INTO tasks (task_id, collection_id, platform_id, status, name, description) VALUES (DEFAULT, $1, $2, $3, $4, $5) RETURNING *';
		const values = [Number(data.collection_id), Number(data.platform), data.status, data.name, data.description];
		return await pool.query(query, values);
	} catch (err) {
		console.log(err);
		return false;
	}
}