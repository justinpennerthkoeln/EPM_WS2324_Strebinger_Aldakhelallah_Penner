const express = require("express");
const router = express.Router();

router.get("/users", async (req, res) => {
	res.send({ msg: "Get all users by api" });
	// const SEARCHTERM = req.query.searchTerm;
	// const USERS = await (await USERMODEL.getAllUsers(SEARCHTERM.toLowerCase())).rows;
	// res.send(USERS);

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

module.exports = router;
