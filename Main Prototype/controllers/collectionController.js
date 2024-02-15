const express = require("express");
const path = require("path");
const router = express.Router();
const collectionsModel = require("../models/collectionsModel.js");
const tasksModel = require("../models/tasksModel.js");

// ROUTES
router.get("/:uuid", (req, res) => {
	res.sendFile(path.join(__dirname, "../views/collection.html"));
});

router.get("/:uuid/tasks", (req, res) => {
	res.sendFile(path.join(__dirname, "../views/collection.html"));
});

router.get("/:uuid/feedback/:feedbackId", (req, res) => {
	res.send({ msg: "Feedback" });
});

router.get("/:uuid/inspection", (req, res) => {
	res.sendFile(path.join(__dirname, "../views/inspection.html"));
});

router.get("/:uuid/settings", (req, res) => {
	res.sendFile(path.join(__dirname, "../views/settings.html"));
});

router.get("/:uuid/settings/:setting", (req, res) => {
	res.sendFile(path.join(__dirname, "../views/settings.html"));
});

router.get("/:uuid/alerts", (req, res) => {
	res.sendFile(path.join(__dirname, "../views/alerts.html"));
});

module.exports = router;
