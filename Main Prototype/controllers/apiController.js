const express = require("express");
const router = express.Router();
const membershipsModel = require("../models/membershipsModel");
const collectionsModel = require("../models/collectionsModel");
const tasksModel = require("../models/tasksModel");
const todoModel = require("../models/todoModel");
const feedbackModel = require("../models/feedbackModel");
const userModel = require("../models/userModel");
const repliesModel = require("../models/repliesModel");
const platformsModel = require("../models/platformsModel");
const bodyParser = require("body-parser");

var urlencodedParser = bodyParser.urlencoded({ extended: false });

router.get("/users", async (req, res) => {
	res.send({ msg: "Get all users by api" });
	// const SEARCHTERM = req.query.searchTerm;
	// const USERS = await (await USERMODEL.getAllUsers(SEARCHTERM.toLowerCase())).rows;
	// res.send(USERS);

	// Sicherheit: uuid der collection o. des Users der request mitgeben
	// Maybe cors.js
});

// TASK
router.get("/tasks/:taskId", async (req, res) => {
	const task = await tasksModel.getTaskByTaskId(req.params.taskId);
	res.send(task);
});

router.get("/tasks/:taskId/todos", async (req, res) => {
	const todos = await (
		await todoModel.getTodosByTaskId(req.params.taskId)
	).rows;
	res.send(todos);
});

router.get("/tasks/:taskId/feedbacks", async (req, res) => {
	const feedbacks = await (
		await feedbackModel.getFeedbacksWithUsersAndRepliesByTaskId(
			req.params.taskId
		)
	).rows;
	res.send(feedbacks);
});

// Update task status
router.put("/tasks/:taskId/status", async (req, res) => {
	const status = tasksModel.updateTaskStatus({
		taskID: req.params.taskId,
		status: req.body.status,
	});

	res.send(status);
});

// Create task
router.post("/tasks", async (req, res) => {
	const data = {
		status: req.body.status,
		name: req.body.name,
		description: req.body.description,
		collectionID: req.body.collectionID,
		platform: req.body.platform,
		createIssue: req.body.createIssue,
	};

	console.log(data);

	const task = await tasksModel.createTask(data);

	res.send(task);

	// TODO: Create issue noch umsetzen
});

// TODO
router.post("/tasks/:taskId/todo", async (req, res) => {
	const todo = await todoModel.createTodo({
		task_id: req.params.taskId,
		description: req.body.description,
	});

	res.send(todo);
});

router.put("/tasks/:taskId/todo/:todoId", async (req, res) => {
	const todo = await todoModel.updateTodo({
		todo_id: req.params.todoId,
		status: req.body.status,
	});

	res.send(todo);
});

// FEEDBACK
router.post("/tasks/:taskId/feedback", async (req, res) => {
	const feedback = await feedbackModel.createFeedback({
		membership_id: req.body.membership_id,
		task_id: req.params.taskId,
		comment: req.body.comment,
	});

	res.send(feedback);
});

// Save reply
router.post("/feedback/:feedbackId/reply", async (req, res) => {
	const reply = await repliesModel.createReply({
		feedbackID: req.params.feedbackId,
		username: req.body.username,
		comment: req.body.comment,
	});

	res.send(reply);
});

// Get a user by uuid
router.get("/users/:uuid", async (req, res) => {
	userModel.getUserByUuid(req.params.uuid).then((user) => {
		res.send(user);
	});
});

// Get membershipID by userId and collectionId
router.get("/memberships/:collectionId/:userId", async (req, res) => {
	membershipsModel
		.getMembershipByCollectionId({
			collection_id: req.params.collectionId,
			user_id: req.params.userId,
		})
		.then((membership) => {
			res.send(membership);
		});
});

// Get a collection by collectionUUID
router.get("/collections/id/:collectionUUID", async (req, res) => {
	const collection = await collectionsModel.getCollection(
		req.params.collectionUUID
	);
	res.send(collection);
});

// Get a collection by userId
router.get("/collections/:userId", async (req, res) => {
	membershipsModel
		.getCollectionsByUserId(req.params.userId)
		.then((collections) => {
			res.send(collections);
		});
});

router.post("/collections/create", urlencodedParser, async (req, res) => {
	const reqCollection = req.body;
	const currentDate = new Date();
	collectionsModel
		.createCollection(
			reqCollection.name,
			reqCollection.description,
			currentDate.toISOString()
		)
		.then((collection) => {
			res.send(collection);
			membershipsModel.setMembership(
				reqCollection.userId,
				collection.collection_id
			);
		});
});

// PLATFORMS

// Get platforms by collectionID
router.get("/platforms/:collectionID", async (req, res) => {
	const platforms = await (
		await platformsModel.getPlatformsByCollectionId(req.params.collectionID)
	).rows;

	res.send(platforms);
});

module.exports = router;
