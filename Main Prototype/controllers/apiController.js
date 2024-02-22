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
const alertsModel = require("../models/alertsModel");
const alertSettingsModel = require("../models/alertSettingsModel");
const ownershipsModel = require("../models/ownershipsModel");
const emailService = require("../services/emailService");
const bodyParser = require("body-parser");
const hookService = require("../services/hookService");
const notificationService = require("../services/notificationService");

var urlencodedParser = bodyParser.urlencoded({ extended: false });

router.get("/users", async (req, res) => {
	const searchTerm = req.query.searchTerm;
	const users = await (
		await userModel.getAllUsersWithSearchTerm(searchTerm.toLowerCase())
	).rows;
	res.send(users);

	// Sicherheit: uuid der collection o. des Users der request mitgeben
	// Maybe cors.js
});

// Get all members of a collection by username
router.get("/memberships/:collectionID/users", async (req, res) => {
	const users = await membershipsModel.searchMemberships(
		req.params.collectionID,
		req.query.searchTerm.toLowerCase()
	);

	res.send(users);
});

// TASK
router.get("/collection/:uuid/tasks", async (req, res) => {
	const collection = await (
		await collectionsModel.getCollection(req.params.uuid)
	).rows[0];

	const tasks = await (
		await tasksModel.getTasksByCollectionId(await collection.collection_id)
	).rows;

	res.send(tasks);
});

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
router.put("/tasks/states", async (req, res) => {
	Promise.resolve(
		req.body.forEach(async (task) => {
			await tasksModel.updateTaskStatus({
				taskID: task.task_id,
				status: task.status,
				statusIndex: task.status_index,
			});
		})
	).then(() => {
		notifyClients({
			targets: ["task-board"],
			initiator: req.headers["x-socket-id"],
		});
	});

	res.send({
		msg: "Status updated.",
	});
});

// Create task
router.post("/tasks", async (req, res) => {
	const data = {
		status: req.body.status,
		statusIndex: req.body.statusIndex,
		name: req.body.name,
		description: req.body.description,
		collectionID: req.body.collectionID,
		platform: req.body.platform,
		createIssue: req.body.createIssue,
		assignedUser: req.body.assignedUser,
	};

	// Create task
	const task = await tasksModel.createTask(data).then((task) => {
		notifyClients({
			targets: ["task-board"],
			initiator: req.headers["x-socket-id"],
		});
		return task;
	});

	// Create ownership
	if (data.assignedUser != null) {
		data.taskID = await task.rows[0].task_id;

		const createdOwnership = await ownershipsModel.createOwnership(data);
	}

	res.send(task);

	// TODO: Create issue noch umsetzen
});

// TODO
router.post("/tasks/:taskId/todo", async (req, res) => {
	const todo = await todoModel
		.createTodo({
			task_id: req.params.taskId,
			description: req.body.description,
		})
		.then((todo) => {
			notifyClients({
				targets: ["task-view"],
				initiator: req.headers["x-socket-id"],
			});
			return todo;
		});

	res.send(todo);
});

router.put("/tasks/:taskId/todo/:todoId", async (req, res) => {
	const todo = await todoModel
		.updateTodo({
			todo_id: req.params.todoId,
			status: req.body.status,
		})
		.then((todo) => {
			notifyClients({
				targets: ["task-board", "task-view"],
				initiator: req.headers["x-socket-id"],
			});
			return todo;
		});

	res.send(todo);
});

// Delete task
router.delete("/tasks/:taskId", async (req, res) => {
	// Delete ownership
	const ownership = await ownershipsModel.deleteOwnership(
		req.params.taskId,
		await req.body.membership_id
	);

	// Then delete task
	const task = await tasksModel.deleteTask(req.params.taskId).then(() => {
		notifyClients({
			targets: ["task-board"],
			initiator: req.headers["x-socket-id"],
		});
	});

	res.send({ msg: "Task deleted." });
});

// FEEDBACK
router.post("/tasks/:taskId/feedback", async (req, res) => {
	const feedback = await feedbackModel
		.createFeedback({
			membership_id: req.body.membership_id,
			task_id: req.params.taskId,
			comment: req.body.comment,
		})
		.then((feedback) => {
			notifyClients({
				targets: ["task-board", "task-view"],
				initiator: req.headers["x-socket-id"],
			});
			return feedback;
		});

	res.send(feedback);
});

// Save reply
router.post("/feedback/:feedbackId/reply", async (req, res) => {
	const reply = await repliesModel
		.createReply({
			feedbackID: req.params.feedbackId,
			username: req.body.username,
			comment: req.body.comment,
		})
		.then((reply) => {
			notifyClients({
				targets: ["task-view"],
				initiator: req.headers["x-socket-id"],
			});
			return reply;
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
			alertSettingsModel.createSetting(collection.collection_id);
		});
});

router.get(`/collections/:uuid/infos`, async (req, res) => {
	const collection = await (
		await collectionsModel.getByUuidWithMembers(req.params.uuid)
	).rows[0];
	res.send(collection);
});

router.get(`/collections/:uuid/members`, async (req, res) => {
	const collectionId = await (
		await collectionsModel.getByUuid(req.params.uuid)
	).rows[0].collection_id;
	const members = await membershipsModel.getMembersByCollectionId(collectionId);
	res.send(await members);
});

// Settings
router.get(`/collections/:uuid/platforms`, async (req, res) => {
	const collectionId = await (
		await collectionsModel.getByUuid(req.params.uuid)
	).rows[0].collection_id;
	const platforms = await platformsModel.getPlatformsByCollectionId(
		await collectionId
	);
	res.send(await platforms);
});

router.get(`/platform/:platformId`, async (req, res) => {
	const platforms = await platformsModel.getPlatformById(req.params.platformId);
	res.send(platforms.rows[0]);
});

router.post(`/platforms/:platformId/target-document`, async (req, res) => {
	platformsModel
		.updateTargetDocument(req.params.platformId, req.query.document)
		.then((platform) => {
			res.send(platform);
		});
});

router.post(
	`/collections/platform/create`,
	urlencodedParser,
	async (req, res) => {
		platformsModel
			.createPlatform(
				Number(req.body.userId),
				Number(req.body.collectionId),
				req.body.platform,
				"",
				"",
				""
			)
			.then((platform) => {
				res.send(platform);
			});
	}
);

router.post(`/platform/:platformId/figma-teamid`, async (req, res) => {
	platformsModel.setTeamId(req.params.platformId, req.query.teamid);
});

router.post(`/collections/platform/delete/:platformId`, async (req, res) => {
	platformsModel.deletePlatform(req.params.platformId).then(() => {
		res.send({ msg: "Platform deleted." });
	});
});

router.post(`/collections/:uuid/rename`, urlencodedParser, async (req, res) => {
	const collectionId = await (
		await collectionsModel.getByUuid(req.params.uuid)
	).rows[0].collection_id;
	collectionsModel
		.updateCollectionName(collectionId, req.body.name)
		.then((collection) => {
			res.send({ msg: "Collection renamed." });
		});
});

router.post(`/collections/:uuid/delete`, async (req, res) => {
	const collectionId = await (
		await collectionsModel.getByUuid(req.params.uuid)
	).rows[0].collection_id;
	collectionsModel.deleteCollection(collectionId).then(() => {
		res.send({ msg: "Collection deleted." });
	});
});

router.post(
	"/collections/:uuid/update-description",
	urlencodedParser,
	async (req, res) => {
		const collectionId = await (
			await collectionsModel.getByUuid(req.params.uuid)
		).rows[0].collection_id;
		collectionsModel
			.updateCollectionDescription(collectionId, req.body.description)
			.then(() => {
				res.send({ msg: "Description updated." });
			});
	}
);

router.post("/collections/:uuid/invite", urlencodedParser, async (req, res) => {
	const collectionId = await (
		await collectionsModel.getByUuid(req.params.uuid)
	).rows[0].collection_id;
	membershipsModel.setMembership(req.body.userId, collectionId).then(() => {
		res.send({ msg: "User invited." });
	});
});

router.post("/collections/:uuid/delete/:memberShipId", async (req, res) => {
	membershipsModel.deleteMembership(req.params.memberShipId).then(() => {
		res.send({ msg: "User removed." });
	});
});

// Alerts
router.get("/alerts/:uuid", async (req, res) => {
	const collectionId = await (
		await collectionsModel.getByUuid(req.params.uuid)
	).rows[0].collection_id;
	const alerts = await alertsModel.getAlertsByCollectionId(await collectionId);
	res.send(alerts);
});

router.post("/alerts/:uuid", urlencodedParser, async (req, res) => {
	const collectionId = await (
		await collectionsModel.getByUuid(req.params.uuid)
	).rows[0].collection_id;

	if (req.body.userId != null) {
		membershipsModel
			.getMembershipByCollectionIdAndUserId(collectionId, await req.body.userId)
			.then((member) => {
				alertsModel.createAlert(
					member[0].membership_id,
					collectionId,
					req.body.comment,
					req.body.alertType,
					req.body.timestamp
				);
			});
	} else {
		alertsModel.createAlert(
			null,
			collectionId,
			req.body.comment,
			req.body.alertType,
			req.body.timestamp
		);
	}
	if(req.body.alertType == "task created") {
		if(req.body.assignee != null) {
			membershipsModel.getMembershipByMemberShipId(req.body.assignee).then((member) => {
				emailService.sendMailToMemberBypassRules(member, req.body.comment + ". It is assigned to you", req.body.alertType, collectionId);
			});
		}
	}

	const members = await membershipsModel.getMembersByCollectionId(collectionId);
	emailService.sendMailToMembers(
		await members,
		req.body.comment,
		req.body.alertType,
		collectionId
	);

	res.send({ msg: "Alert created." });
});

router.get("/alerts/:uuid/settings", async (req, res) => {
	const collectionId = await (
		await collectionsModel.getByUuid(req.params.uuid)
	).rows[0].collection_id;
	const settings = await alertSettingsModel.getSettingsByCollectionId(
		await collectionId
	);
	res.send(settings);
});

router.post("/alerts/:uuid/settings", urlencodedParser, async (req, res) => {
	alertSettingsModel.updateSettingsByCollectionId(req.body.id, req.body.value);
});

router.post("/hook/:uuid/:platform", urlencodedParser, (req, res) => {
	const hooks = req.body;
	switch (req.params.platform) {
		case "github":
			if (hooks.issue) {
				hooks.comment
					? hookService.handleGithubHook(hooks, "comment", req.params.uuid)
					: hookService.handleGithubHook(hooks, "issue", req.params.uuid);
			}
			break;
		case "gitlab":
			hookService.handleGitlabHook(hooks, hooks.event_type, req.params.uuid);
			break;
		case "figma":
			(hooks.event_type === "FILE_UPDATE") ? hookService.handleFigmaHook(hooks, "update", req.params.uuid) : (hooks.event_type === "FILE_COMMENT") ? hookService.handleFigmaHook(hooks, "comment", req.params.uuid) : hookService.handleFigmaHook(hooks, "ping", req.params.uuid);
			break;
	}
});

router.post("/create-notification/:uuid/:platformId", urlencodedParser, async (req, res) => {
	const platform = await platformsModel.getPlatformById(req.params.platformId);
	const collection = await collectionsModel.getByUuid(req.params.uuid);
	notificationService.handleNotification(req.body, await platform.rows[0], await collection.rows[0]);
});

module.exports = router;
