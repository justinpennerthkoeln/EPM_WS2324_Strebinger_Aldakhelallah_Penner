const { Pool } = require("pg");

const credentials = process.env.DB_CONFIG;

if (!credentials) {
	throw new Error("Database credentials not found.");
}

// Connect to PostgreSQL
const pool = new Pool(JSON.parse(credentials));

exports.createSetting = async (collectionId) => {
    try {
        await pool.query("INSERT INTO alertSettings (collection_id, setting, value) VALUES ($1, 'Task Created', true)", [collectionId]);
        await pool.query("INSERT INTO alertSettings (collection_id, setting, value) VALUES ($1, 'Task Updated', true)", [collectionId]);
        await pool.query("INSERT INTO alertSettings (collection_id, setting, value) VALUES ($1, 'Task Completed', true)", [collectionId]);
        await pool.query("INSERT INTO alertSettings (collection_id, setting, value) VALUES ($1, 'Task Feedbacks', true)", [collectionId]);
        await pool.query("INSERT INTO alertSettings (collection_id, setting, value) VALUES ($1, 'Task Feedback Replies', true)", [collectionId]);
        await pool.query("INSERT INTO alertSettings (collection_id, setting, value) VALUES ($1, 'Collection Renaming', true)", [collectionId]);
        await pool.query("INSERT INTO alertSettings (collection_id, setting, value) VALUES ($1, 'Collection Description Changes', true)", [collectionId]);
        await pool.query("INSERT INTO alertSettings (collection_id, setting, value) VALUES ($1, 'Collection Member Changes', true)", [collectionId]);
        await pool.query("INSERT INTO alertSettings (collection_id, setting, value) VALUES ($1, 'Platform Changes', true)", [collectionId]);
        await pool.query("INSERT INTO alertSettings (collection_id, setting, value) VALUES ($1, 'Design Changes', true)", [collectionId]);
        await pool.query("INSERT INTO alertSettings (collection_id, setting, value) VALUES ($1, 'Design Comments', true)", [collectionId]);
        await pool.query("INSERT INTO alertSettings (collection_id, setting, value) VALUES ($1, 'Design Comment Replies', true)", [collectionId]);
        await pool.query("INSERT INTO alertSettings (collection_id, setting, value) VALUES ($1, 'Git Commits', true)", [collectionId]);
        await pool.query("INSERT INTO alertSettings (collection_id, setting, value) VALUES ($1, 'Git Comments', true)", [collectionId]);
        await pool.query("INSERT INTO alertSettings (collection_id, setting, value) VALUES ($1, 'Git Comment Replies', true)", [collectionId]);
        await pool.query("INSERT INTO alertSettings (collection_id, setting, value) VALUES ($1, 'Git Merge', true)", [collectionId]);
        await pool.query("INSERT INTO alertSettings (collection_id, setting, value) VALUES ($1, 'Git Push', true)", [collectionId]);

    } catch (error) {
        console.log(error);
        throw new Error("Error creating setting.");
    }
};

exports.getSettingsByCollectionId = async (collectionId) => {
    try {
        return await pool.query(`SELECT * FROM alertSettings WHERE collection_id = $1`, [collectionId]);
    } catch (error) {
        console.log(error);
        throw new Error("Error creating setting.");
    }
};

exports.updateSettingsByCollectionId = async (settingId, value) => {
    try {
        return await pool.query(
            `UPDATE alertSettings SET value = $1 WHERE alert_settings_id = $2`,
            [value, settingId]
        );
    } catch (error) {
        console.log(error);
        throw new Error("Error updating setting.");
    }
};