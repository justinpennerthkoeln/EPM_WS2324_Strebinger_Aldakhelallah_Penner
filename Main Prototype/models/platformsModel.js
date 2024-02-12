const { Pool } = require("pg");

const credentials = process.env.DB_CONFIG;

if (!credentials) {
	throw new Error("Database credentials not found.");
}

// Connect to PostgreSQL
const pool = new Pool(JSON.parse(credentials));

exports.getPlatformsByCollectionId = async function (collectionID) {
	try {
		const query = "SELECT * FROM platforms WHERE collection_id = $1";
		const values = [collectionID];
		return await pool.query(query, values);
	} catch (err) {
		console.log(err);
		return false;
	}
};
