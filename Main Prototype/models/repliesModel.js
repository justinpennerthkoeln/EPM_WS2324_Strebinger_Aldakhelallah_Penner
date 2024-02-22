const { Pool } = require("pg");

const credentials = process.env.DB_CONFIG;

if (!credentials) {
	throw new Error("Database credentials not found.");
}

// Connect to PostgreSQL
const pool = new Pool(JSON.parse(credentials));

exports.createReply = async function (reply) {
	try {
		const currentDate = new Date();
		const query =
			"INSERT INTO replies VALUES (DEFAULT, $1, $2, $3, $4) RETURNING *";
		const values = [
			reply.username,
			Number(reply.feedbackID),
			reply.comment,
			currentDate.toISOString(),
		];
		return await pool.query(query, values);
	} catch (error) {
		console.log(error);
		return false;
	}
};

exports.deleteRepliesByFeedbackId = async function (feedbackID) {
	try {
		const query = "DELETE FROM replies WHERE feedback_id = $1";
		const values = [feedbackID];
		return await pool.query(query, values);
	} catch (error) {
		console.log(error);
		return false;
	}
};
