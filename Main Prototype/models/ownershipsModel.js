const { Pool } = require("pg");

const credentials = process.env.DB_CONFIG;

if (!credentials) {
	throw new Error("Database credentials not found.");
}

// Connect to PostgreSQL
const pool = new Pool(JSON.parse(credentials));

exports.createOwnership = async (data) => {
	try {
		const newOwnership = await pool.query(
			"INSERT INTO ownerships VALUES (DEFAULT, $1, $2) RETURNING *",
			[data.taskID, data.assignedUser]
		);
		return newOwnership.rows[0];
	} catch (error) {
		console.log(error);
		throw new Error("Error creating ownership.");
	}
};

exports.deleteOwnership = async (taskID, membershipID) => {
	try {
		const deletedOwnership = await pool.query(
			"DELETE FROM ownerships WHERE membership_id = $1 AND task_id = $2 RETURNING *",
			[membershipID, taskID]
		);
		return deletedOwnership.rows[0];
	} catch (error) {
		console.log(error);
		throw new Error("Error deleting ownership.");
	}
};
