const { Pool } = require("pg");

const credentials = process.env.DB_CONFIG;

if (!credentials) {
	throw new Error("Database credentials not found.");
}

// Connect to PostgreSQL
const pool = new Pool(JSON.parse(credentials));

exports.getFeedbacksWithUsersAndRepliesByTaskId = async function (task_id) {
	try {
		const query = `
        SELECT 
        feedbacks.*,
        users.username,
        COUNT(DISTINCT replies.reply_id) AS reply_count,
        CASE
            WHEN COUNT(DISTINCT replies.reply_id) > 0
            THEN jsonb_agg(DISTINCT jsonb_build_object(
                'reply_id', replies.reply_id,
                'username', replies.username,
                'comment', replies.comment,
                'timestamp', replies.timestamp
            ))
            ELSE NULL
        END AS replies
    FROM 
        feedbacks
        INNER JOIN memberships ON feedbacks.membership_id = memberships.membership_id
        INNER JOIN users ON memberships.user_id = users.id
        LEFT JOIN replies ON feedbacks.feedback_id = replies.feedback_id
    WHERE 
        feedbacks.task_id = $1
    GROUP BY
        feedbacks.feedback_id,
        users.username;`;

		const values = [Number(task_id)];
		return await pool.query(query, values);
	} catch (error) {
		console.log(error);
		return false;
	}
};

exports.createFeedback = async function (feedback) {
	try {
		const currentDate = new Date();
		const query =
			"INSERT INTO feedbacks VALUES (DEFAULT, $1, $2, $3, $4) RETURNING *";
		const values = [
			Number(feedback.membership_id),
			Number(feedback.task_id),
			feedback.comment,
			currentDate.toISOString(),
		];
		return await pool.query(query, values);
	} catch (error) {
		console.log(error);
		return false;
	}
};

exports.getFeedbacksByTaskId = async function (taskId) {
    try {
        const query = "SELECT * FROM feedbacks WHERE task_id = $1";
        const values = [taskId];
        return await (
            await pool.query(query, values)
        ).rows;
    } catch (error) {
        console.log(error);
        return false;
    }
};

exports.deleteFeedbacksByTaskId = async function (taskId) {
    try {
        const query = "DELETE FROM feedbacks WHERE task_id = $1";
        const values = [taskId];
        return await pool.query(query, values);
    } catch (error) {
        console.log(error);
        return false;
    }
};