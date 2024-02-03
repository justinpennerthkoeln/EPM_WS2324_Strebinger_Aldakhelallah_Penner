// IMPORTS
const http = require("http");
const express = require("express");
const socketIo = require("socket.io");

// APP SETUP
const app = express();
const server = http.createServer(app);

// MIDDLEWARE
app.use(express.static(__dirname + "/public"));

const session = require('express-session');
const savedSession = session({
	secret: 'keyboard cat',
	cookie: { maxAge: 60000 },
	resave: false,
	saveUninitialized: true,
});
app.use(savedSession);

// ROUTER
const userRouter = require("./routes/userRouter.js");
const collectionRouter = require("./routes/collectionRouter.js");
const apiRouter = require("./routes/apiRouter.js");
const oauthRouter = require("./routes/oauthRouter.js");

// ROUTING
app.use("/", userRouter);
app.use("/collection", collectionRouter);
app.use("/api", apiRouter);
app.use("/oauth", oauthRouter);

// HOST SERVER
server.listen(80, () => {
	console.log(`Listening on port 80.`);
});