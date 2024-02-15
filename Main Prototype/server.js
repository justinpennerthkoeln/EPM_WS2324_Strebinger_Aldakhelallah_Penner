// IMPORTS
const http = require("http");
const express = require("express");
const socketIO = require("socket.io");
const session = require("express-session");
const bodyParser = require("body-parser");

// APP SETUP
const app = express();
const server = http.createServer(app);

// MIDDLEWARE
app.use(express.static(__dirname + "/public"));
const savedSession = session({
	secret: "keyboard cat",
	cookie: { maxAge: 60000 },
	resave: false,
	saveUninitialized: true,
});
app.use(savedSession);
app.use(bodyParser.json());

// CONTROLLER
const userController = require("./controllers/userController.js");
const collectionController = require("./controllers/collectionController.js");
const apiController = require("./controllers/apiController.js");
const oauthController = require("./controllers/oauthController.js");

// SOCKET.IO SETUP
const IO = new socketIO.Server(server);

// SOCKET.IO CONNECTION
const rooms = {};

IO.on("connection", (socket) => {
	console.log(`Client connected.`);

	// Join collection room
	rooms[socket.id] = socket.handshake.query.collectionUUID;
	socket.join(socket.handshake.query.collectionUUID);

	socket.on("disconnect", () => {
		socket.leave(rooms[socket.id]);
		delete rooms[socket.id];

		console.log("Client disconnected.");
	});
});

// NOTIFY CLIENTS
notifyClients = async (data) => {
	IO.to(rooms[data.initiator]).emit("refresh", data);
};

// ROUTING
app.use("/", userController);
app.use("/collection", collectionController);
app.use("/api", apiController);
app.use("/oauth", oauthController);

// HOST SERVER
server.listen(80, () => {
	console.log(`Listening on port 80.`);
});
