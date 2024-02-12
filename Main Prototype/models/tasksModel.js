const { Pool } = require("pg");

const credentials = process.env.DB_CONFIG;

if (!credentials) {
	throw new Error("Database credentials not found.");
}

// Connect to PostgreSQL
const pool = new Pool(JSON.parse(credentials));

exports.getTasksByCollectionId = async (collectionId) => {
	try {
		const tasks = await pool.query(
			`SELECT 
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
                WHEN COUNT(DISTINCT feedbacks.feedback_id) > 0
                THEN jsonb_agg(DISTINCT jsonb_build_object(
                    'feedback_id', feedbacks.feedback_id,
                    'membership_id', feedbacks.membership_id,
                    'user_id', feedback_users.id,
                    'username', feedback_users.username,
                    'email', feedback_users.email,
                    'task_id', feedbacks.task_id,
                    'comment', feedbacks.comment,
                    'timestamp', feedbacks.timestamp
                ))
                ELSE NULL
            END AS feedbacks,
            CASE
                WHEN COUNT(DISTINCT todos.todo_id) > 0
                THEN COUNT(DISTINCT todos.todo_id) FILTER(WHERE todos.done) * 100.0 / COUNT(DISTINCT todos.todo_id)
                ELSE NULL
            END AS todos_progress,
            CASE
                WHEN COUNT(todos) > 0
                THEN jsonb_agg(DISTINCT jsonb_build_object(
                    'todo_id', todos.todo_id,
                    'description', todos.description,
                    'done', todos.done
                ))
                ELSE NULL
            END AS todos,
            jsonb_agg(DISTINCT jsonb_build_object(
                'platform_id', platforms.platform_id,
                'platform', platforms.platform,
                'platform_key', platforms.platform_key,
                'target_document', platforms.target_document,
                'username', platforms.username
            )) AS task_platforms
        FROM tasks
        LEFT JOIN ownerships ON tasks.task_id = ownerships.task_id
        LEFT JOIN memberships ON ownerships.membership_id = memberships.membership_id
        LEFT JOIN users ON memberships.user_id = users.id
        LEFT JOIN feedbacks ON tasks.task_id = feedbacks.task_id
        LEFT JOIN users AS feedback_users ON feedbacks.membership_id = feedback_users.id
        LEFT JOIN todos ON tasks.task_id = todos.task_id
        LEFT JOIN platforms ON tasks.platform_id = platforms.platform_id
        WHERE tasks.collection_id = $1
        GROUP BY 
            tasks.task_id, 
            tasks.collection_id, 
            tasks.platform_id, 
            tasks.status, 
            tasks.name, 
            tasks.description
        ORDER BY tasks.task_id;`,
			[collectionId]
		);
		return tasks;
	} catch (error) {
		console.log(error);
		throw new Error("Error getting tasks.");
	}
};

exports.getTaskByTaskId = async function (task_id) {
	try {
		const query = `SELECT tasks.task_id, tasks.collection_id, tasks.platform_id, tasks.status, tasks.name, tasks.description,
								ownerships.ownership_id, ownerships.membership_id,
								memberships.role,
								users.id AS user_id, users.username, users.email
						FROM tasks
						LEFT JOIN ownerships ON tasks.task_id = ownerships.task_id
						LEFT JOIN memberships ON ownerships.membership_id = memberships.membership_id
						LEFT JOIN users ON memberships.user_id = users.id
						WHERE tasks.task_id = $1;`;
		const values = [task_id];
		return await pool.query(query, values);
	} catch (err) {
		console.log(err);
		return false;
	}
};

exports.updateTaskStatus = async function (data) {
	try {
		const query = `UPDATE tasks SET status = $1 WHERE task_id = $2 RETURNING *`;
		const values = [data.status.replaceAll("-", " "), data.taskID];
		return await pool.query(query, values);
	} catch (err) {
		console.log(err);
		return false;
	}
};

exports.createTask = async function (data) {
	try {
		const query =
			"INSERT INTO tasks (task_id, collection_id, platform_id, status, name, description) VALUES (DEFAULT, $1, $2, $3, $4, $5) RETURNING *";
		const values = [
			Number(data.collectionID),
			Number(data.platform),
			data.status,
			data.name,
			data.description,
		];
		return await pool.query(query, values);
	} catch (err) {
		console.log(err);
		return false;
	}
};
