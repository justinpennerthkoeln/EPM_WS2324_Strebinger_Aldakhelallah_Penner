const express = require("express");
const path = require("path");
const router = express.Router();
const collectionsModel = require("../models/collectionsModel.js");
const tasksModel = require("../models/tasksModel.js");

// ROUTES
router.get("/:uuid", (req, res) => {
	res.sendFile(path.join(__dirname, "../views/collection.html"));
});

router.get("/:uuid/tasks", async (req, res) => {
	const collection = await (
		await collectionsModel.getCollection(req.params.uuid)
	).rows[0];

	const tasks = await (
		await tasksModel.getTasksByCollectionId(await collection.collection_id)
	).rows;

	res.send(tasks);
});

router.get("/:uuid/feedback/:feedbackId", (req, res) => {
	res.send({ msg: "Feedback" });
});

router.get("/:uuid/inspection", (req, res) => {
	res.send({ msg: "Inspection" });

	// 	const COLLECTION = await (
	// 		await COLLECTIONSMODEL.getCollection(req.params.uuid)
	// 	).rows[0];
	// 	const PLATFORMS = await (
	// 		await PLATFORMSMODEL.getPlatformsByCollectionId(await COLLECTION.id)
	// 	).rows;

	// 	res.send(PLATFORMS);
});

router.get("/:uuid/settings", (req, res) => {
	res.sendFile(path.join(__dirname, "../views/settings.html"));
});

router.get("/:uuid/settings/:setting", (req, res) => {
	res.sendFile(path.join(__dirname, "../views/settings.html"));
});

router.get("/:uuid/alerts", (req, res) => {
	res.send({ msg: "Alerts" });

	// 	const COLLECTION = await (
	// 		await COLLECTIONSMODEL.getCollection(req.params.uuid)
	// 	).rows[0];
	// 	const ALERTS = await (await ALERTSMODEL.getAlerts(await COLLECTION.id)).rows;

	// 	res.send(ALERTS);
});

module.exports = router;
