const { Pool } = require("pg");

const credentials = process.env.DB_CONFIG;

if (!credentials) {
	throw new Error("Database credentials not found.");
}

// Connect to PostgreSQL
const pool = new Pool(JSON.parse(credentials));

exports.getAlertsByCollectionId = async (collectionId) => {
    try {
        const alerts = await pool.query(`
        SELECT
            alerts.alert_id,
            json_build_object(
                'user_id', memberships.user_id,
                'username', users.username,
                'email', users.email
            ) AS member,
            collections.name AS collection_name,
            alerts.comment,
            alerts.timestamp
        FROM
            alerts
        INNER JOIN memberships ON alerts.membership_id = memberships.membership_id
        INNER JOIN users ON memberships.user_id = users.id
        INNER JOIN collections ON alerts.collection_id = collections.collection_id
        WHERE
            collections.collection_id = $1;
        `, [collectionId]);
		return alerts;
    } catch (error) {
        console.log(error);
		throw new Error("Error getting alerts.");
    }
};

exports.createAlert = async (membershipId, collectionId, comment, alertType, timestamp) => {
    try {
        timestamp = new Date(timestamp);
        await pool.query(`
        INSERT INTO alerts (membership_id, collection_id, comment, alert_type, timestamp)
        VALUES ($1, $2, $3, $4, $5);
        `, [membershipId, collectionId, comment, alertType, timestamp]);
    } catch (error) {
        console.log(error);
        throw new Error("Error creating alert.");
    }
};