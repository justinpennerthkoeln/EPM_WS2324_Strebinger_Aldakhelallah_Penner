const express = require("express");
const router = express.Router();
const membershipsModel = require("../models/membershipsModel");
const collectionsModel = require("../models/collectionsModel");
const platformsModel = require("../models/platformsModel");
const userModel = require("../models/userModel");
const bodyParser = require('body-parser');

var urlencodedParser = bodyParser.urlencoded({ extended: false })

router.get("/users", async (req, res) => {
	
	const searchTerm = req.query.searchTerm;
	const users = await (await userModel.getAllUsersWithSearchTerm(searchTerm.toLowerCase())).rows;
	res.send(users);

	// Sicherheit: uuid der collection o. des Users der request mitgeben
	// Maybe cors.js
});

router.get("/tasks/:taskId/todos", async (req, res) => {
	res.send({ msg: "Get todos of tasks" });
	// const TODOS = await (await TODOMODEL.getTodosByTaskId(req.params.taskId)).rows;
	// res.send(TODOS);
});

router.get("/tasks/:taskId/feedbacks", async (req, res) => {
	res.send({ msg: "Get all feedbacks of task" });
	// const FEEDBACKS = await (await FEEDBACKMODEL.getFeedbacksWithUsersAndRepliesByTaskId(req.params.taskId)).rows;
	// res.send(FEEDBACKS);
});

// Get a user by uuid
router.get("/users/:uuid", async (req, res) => {
	userModel.getUserByUuid(req.params.uuid).then((user) => {
		res.send(user);
	});
});

// Get a collection by userId
router.get("/collections/:userId", async (req, res) => {
	membershipsModel.getCollectionsByUserId(req.params.userId).then((collections) => {
		res.send(collections);
	});
});

router.post("/collections/create", urlencodedParser, async (req, res) => {
	const reqCollection = req.body;
	const currentDate = new Date();
	collectionsModel.createCollection(reqCollection.name, reqCollection.description, currentDate.toISOString()).then((collection) => {
		res.send(collection);
		membershipsModel.setMembership(reqCollection.userId, collection.collection_id);
	})
});

router.get(`/collections/:uuid/infos`, async (req, res) => {
	const collection = await (await collectionsModel.getByUuidWithMembers(req.params.uuid)).rows[0];
	res.send(collection);
})

router.get(`/collections/:uuid/members`, async (req, res) => {
	const collectionId = await (await collectionsModel.getByUuid(req.params.uuid)).rows[0].collection_id;
	const members = await membershipsModel.getMembersByCollectionId(collectionId);
	res.send(await members);
});

// Settings
router.get(`/collections/:uuid/platforms`, async (req, res) => {
	const collectionId = await (await collectionsModel.getByUuid(req.params.uuid)).rows[0].collection_id;
	const platforms = await platformsModel.getPlatformsByCollectionId(collectionId);
	res.send(platforms);
});

router.get(`/platforms/:platformId`, async (req, res) => {
	const platforms = await platformsModel.getPlatformById(req.params.platformId);
	res.send(platforms.rows[0]);
});

router.post(`/platforms/:platformId/target-document`, async (req, res) => {
	platformsModel.updateTargetDocument(req.params.platformId, req.query.document).then((platform) => {
		res.send(platform);
	});
})

router.post(`/collections/platform/create`, urlencodedParser, async (req, res) => {
	platformsModel.createPlatform(Number(req.body.userId), Number(req.body.collectionId), req.body.platform, '', '', '').then((platform) => {
		res.send(platform);
	});
});

router.post(`/collections/platform/delete/:platformId`, async (req, res) => {
	platformsModel.deletePlatform(req.params.platformId).then(() => {
		res.send({msg: "Platform deleted."})
	});
});

router.post(`/collections/:uuid/rename`, urlencodedParser, async (req, res) => {
	const collectionId = await (await collectionsModel.getByUuid(req.params.uuid)).rows[0].collection_id;
	collectionsModel.updateCollectionName(collectionId, req.body.name).then((collection) => {
		res.send({msg: "Collection renamed."})
	});
})

router.post(`/collections/:uuid/delete`, async (req, res) => {
	const collectionId = await (await collectionsModel.getByUuid(req.params.uuid)).rows[0].collection_id;
	collectionsModel.deleteCollection(collectionId).then(() => {
		res.send({msg: "Collection deleted."})
	});
})

router.post('/collections/:uuid/update-description', urlencodedParser, async (req, res) => {
	const collectionId = await (await collectionsModel.getByUuid(req.params.uuid)).rows[0].collection_id;
	collectionsModel.updateCollectionDescription(collectionId, req.body.description).then(() => {
		res.send({msg: "Description updated."})
	});
});

router.post('/collections/:uuid/invite', urlencodedParser, async (req, res) => {
	const collectionId = await (await collectionsModel.getByUuid(req.params.uuid)).rows[0].collection_id;
	membershipsModel.setMembership(req.body.userId, collectionId).then(() => {
		res.send({msg: "User invited."})
	});
});

router.post('/collections/:uuid/delete/:memberShipId', async (req, res) => {
	membershipsModel.deleteMembership(req.params.memberShipId).then(() => {
		res.send({msg: "User removed."})
	});
});

module.exports = router;
