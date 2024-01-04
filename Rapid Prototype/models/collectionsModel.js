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

exports.getCollection = async function (uuid) {
	try {
		const query = 'SELECT * FROM collections WHERE uuid = $1';
		const values = [uuid];
		return await pool.query(query, values);
	} catch (err) {
        console.log(err);
		return false;
    }
}

exports.createCollection = async function (name, description) {
	try {
		const query = 'INSERT INTO collections VALUES (DEFAULT, DEFAULT, $1, $2, $3) RETURNING *';
		const currentDate = new Date();
		const values = [name, description, currentDate.toISOString()];
		return await pool.query(query, values);
	} catch (err) {
		console.log(err);
		return false;
	}
}

exports.getCollectionById = async function (collectionId) {
	try {
		const query = 'SELECT * FROM collections WHERE collection_id = $1';
		const values = [collectionId];
		return await pool.query(query, values);
	} catch (err) {
		console.log(err);
		return false;
	}
}

exports.deleteCollectionById = async function (collectionId) {
	try {
		pool.query('BEGIN;');

		const DELETEVOTES = 'DELETE FROM votes WHERE feedback_id IN (SELECT feedback_id FROM feedbacks WHERE task_id IN (SELECT task_id FROM tasks WHERE collection_id = $1))';
		const DELETEFEEDBACKS = 'DELETE FROM feedbacks WHERE task_id IN (SELECT task_id FROM tasks WHERE collection_id = $1)';
		const DELETETODOS = 'DELETE FROM todos WHERE task_id IN (SELECT task_id FROM tasks WHERE collection_id = $1)';
		const DELETEPLATFORMS = 'DELETE FROM platforms WHERE collection_id = $1';
		const DELETEMEMBERSHIPS = 'DELETE FROM memberships WHERE collection_id = $1';
		const DELETEOWNERSHIPS = 'DELETE FROM ownerships WHERE task_id IN (SELECT task_id FROM tasks WHERE collection_id = $1)';
		const DELETETASKS = 'DELETE FROM tasks WHERE collection_id = $1';
		const DELETECOLLECTION = 'DELETE FROM collections WHERE collection_id = $1';
  		const values = [collectionId];

		await pool.query(DELETEVOTES, values);
		await pool.query(DELETEFEEDBACKS, values);
		await pool.query(DELETETODOS, values);
		await pool.query(DELETEOWNERSHIPS, values);
		await pool.query(DELETETASKS, values);
		await pool.query(DELETEPLATFORMS, values);
		await pool.query(DELETEMEMBERSHIPS, values);
		await pool.query(DELETECOLLECTION, values);
		pool.query('COMMIT;');

	} catch (err) {
		pool.query('ROLLBACK');
		console.log(err);
		throw new Error(err);
	}
}

// exports.deleteCollectionById = async function (collectionId) {
//     try {
//         const query = ` BEGIN;
//             DELETE FROM collections 
//             WHERE collection_id = $1 
//             RETURNING collection_id`;

//         const values = [collectionId];
//         const result = await pool.query(query, values);

//         if (result.rows.length === 0) {
//             console.log(`No collection found with ID ${collectionId}. Nothing deleted.`);
//             return false;
//         }
//		   pool.query('COMMIT;');
//         console.log(`Collection with ID ${collectionId} successfully deleted.`);

//         return true;
//     } catch (err) {
//         pool.query('ROLLBACK');
//         console.error(`An error occurred: ${err}`);
//         throw new Error(err);
//     }
// };