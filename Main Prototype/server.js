// IMPORTS
const http = require("http");
const express = require("express");
const socketIo = require("socket.io");

// APP SETUP
const app = express();
const server = http.createServer(app);

// MIDDLEWARE
app.use(express.static(__dirname + "/public"));

// ROUTER
const userRouter = require("./routes/userRouter.js");
const collectionRouter = require("./routes/collectionRouter.js");
const apiRouter = require("./routes/apiRouter.js");

// ROUTING
app.use("/", userRouter);
app.use("/collection", collectionRouter);
app.use("/api", apiRouter);

// HOST SERVER
server.listen(80, () => {
	console.log(`Listening on port 80.`);
});
