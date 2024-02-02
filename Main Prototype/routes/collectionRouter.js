const express = require("express");
const router = express.Router();

// ROUTES
router.get("/:uuid", (req, res) => {
	res.send({ msg: "Collection" });
});

router.get("/:uuid/tasks", (req, res) => {
	res.send({ msg: "Tasks" });

	// const COLLECTION = await (await COLLECTIONSMODEL.getCollection(req.params.uuid)).rows[0];
	// const TASKS = await (await TASKSMODEL.getTasksByCollectionId(await COLLECTION.id)).rows;

	// res.send(TASKS);
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
	res.send({ msg: "Settings" });
});

router.get("/:uuid/settings/:setting", (req, res) => {
	res.send({ msg: "Settings" });
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
