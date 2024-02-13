const { Pool } = require("pg");

const credentials = process.env.DB_CONFIG;

if (!credentials) {
	throw new Error("Database credentials not found.");
}

// Connect to PostgreSQL
const pool = new Pool(JSON.parse(credentials));

exports.createCollection = async (name, description, timestamp) => {
	try {
		const newCollection = await pool.query(
			"INSERT INTO collections (name, description, timestamp) VALUES ($1, $2, $3) RETURNING *",
			[name, description, timestamp]
		);
		return newCollection.rows[0];
	} catch (error) {
		console.log(error);
		throw new Error("Error creating collection.");
	}
};

exports.getByUuid = async (uuid) => {
	try {
		const collection = await pool.query(
			"SELECT * FROM collections WHERE uuid = $1",
			[uuid]
		);
		return collection;
	} catch (error) {
		console.log(error);
		throw new Error("Error getting collection.");
	}
};

exports.getByUuidWithMembers = async (uuid) => {
	try {
		const collection = await pool.query(
			`
                SELECT c.*, JSON_AGG(json_build_object('user_id', m.user_id, 'username', u.username)) as members
                FROM collections c
                INNER JOIN memberships m ON c.collection_id = m.collection_id
                INNER JOIN users u ON m.user_id = u.id
                WHERE c.uuid = $1
                GROUP BY c.collection_id`,
			[uuid]
		);
		return collection;
	} catch (error) {
		console.log(error);
		throw new Error("Error getting collection.");
	}
};

exports.updateCollectionName = async (collectionId, name) => {
	try {
		const updatedCollection = await pool.query(
			"UPDATE collections SET name = $1 WHERE collection_id = $2 RETURNING *",
			[name, collectionId]
		);
		return updatedCollection.rows[0];
	} catch (error) {
		console.log(error);
		throw new Error("Error updating collection.");
	}
};

exports.deleteCollection = async (collectionId) => {
	try {
		await pool.query("START TRANSACTION;");
		await pool.query(
			"DELETE FROM replies WHERE feedback_id IN (SELECT feedback_id FROM feedbacks WHERE task_id IN (SELECT task_id FROM tasks WHERE collection_id = $1));",
			[collectionId]
		);
		await pool.query(
			"DELETE FROM votes WHERE feedback_id IN (SELECT feedback_id FROM feedbacks WHERE task_id IN (SELECT task_id FROM tasks WHERE collection_id = $1));",
			[collectionId]
		);
		await pool.query(
			"DELETE FROM feedbacks WHERE task_id IN (SELECT task_id FROM tasks WHERE collection_id = $1);",
			[collectionId]
		);
		await pool.query(
			"DELETE FROM todos WHERE task_id IN (SELECT task_id FROM tasks WHERE collection_id = $1);",
			[collectionId]
		);
		await pool.query(
			"DELETE FROM ownerships WHERE task_id IN (SELECT task_id FROM tasks WHERE collection_id = $1);",
			[collectionId]
		);
		await pool.query("DELETE FROM tasks WHERE collection_id = $1;", [
			collectionId,
		]);
		await pool.query("DELETE FROM alerts WHERE collection_id = $1;", [
			collectionId,
		]);
		await pool.query("DELETE FROM platforms WHERE collection_id = $1;", [
			collectionId,
		]);
		await pool.query("DELETE FROM memberships WHERE collection_id = $1;", [
			collectionId,
		]);
		await pool.query("DELETE FROM alertSettings WHERE collection_id = $1;", [
			collectionId,
		]);
		await pool.query("DELETE FROM collections WHERE collection_id = $1;", [
			collectionId,
		]);
		await pool.query("COMMIT;");
	} catch (error) {
		await pool.query("ROLLBACK;");
		console.log(error);
		throw new Error("Error deleting collection.");
	}
};

exports.updateCollectionDescription = async (collectionId, description) => {
	try {
		const updatedCollection = await pool.query(
			"UPDATE collections SET description = $1 WHERE collection_id = $2 RETURNING *",
			[description, collectionId]
		);
		return updatedCollection.rows[0];
	} catch (error) {
		console.log(error);
		throw new Error("Error updating collection.");
	}
};

exports.getCollection = async (uuid) => {
	try {
		const collection = await pool.query(
			"SELECT * FROM collections WHERE uuid = $1",
			[uuid]
		);
		return collection;
	} catch (error) {
		console.log(error);
		throw new Error("Error getting collection.");
	}
};
