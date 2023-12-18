// Imports
const HTTP = require('http');
const EXPRESS = require('express');
const SOCKETIO = require('socket.io');
const DOTENV = require('dotenv');

// App setup
const APP = EXPRESS();
const SERVER = HTTP.createServer(APP);

//Middleware
APP.use(EXPRESS.static(__dirname + '/static'));
DOTENV.config();
APP.set("view engine", "ejs");

//modules
const COLLECTIONSMODEL = require('./models/collectionsModel.js');
const CONNECTIONSMODEL = require('./models/connectionsModel.js');
const ALERTSMODEL = require('./models/alertsModel.js');
const TASKSMODEL = require('./models/tasksModel.js');

//Routing
APP.get("/", (req, res) => {
    res.send({"msg" : "Hello World!"});
});

APP.get("/login", (req, res) => {

});

APP.get("/register", (req, res) => {

});

APP.get("/:uuid", async (req, res) => {
    res.sendFile(__dirname + "/views/collection.html");
});

APP.get("/:uuid/alerts", async (req, res) => {
    const COLLECTION = await (await COLLECTIONSMODEL.getCollection(req.params.uuid)).rows[0];
    const ALERTS = await (await ALERTSMODEL.getAlerts(await COLLECTION.id)).rows;

    res.send(ALERTS);
});

APP.get("/:uuid/tasks", async (req, res) => {
    const COLLECTION = await (await COLLECTIONSMODEL.getCollection(req.params.uuid)).rows[0];
    const TASKS = await (await TASKSMODEL.getTasksByCollectionId(await COLLECTION.id)).rows;

    res.send(TASKS);
});

APP.get("/:uuid/inspection", async (req, res) => {
    const COLLECTION = await (await COLLECTIONSMODEL.getCollection(req.params.uuid)).rows[0];
    const CONNECTIONS = await (await CONNECTIONSMODEL.getConnectionsFromCollectionId(await COLLECTION.id)).rows;

    res.send(CONNECTIONS);
});

APP.get("/:uuid/settings", async (req, res) => {

});

const IO = new SOCKETIO.Server(SERVER);

IO.on('connection', async (socket) => {
    console.log(`Connected with ${socket.id}.`);

    socket.on('get-details', async (uuid) => {
        const COLLECTION = await (await COLLECTIONSMODEL.getCollection(uuid)).rows[0];
        socket.emit('got-details', await COLLECTION);
    })

    socket.on('get-tasks', async (uuid) => {
        const COLLECTION = await (await COLLECTIONSMODEL.getCollection(uuid)).rows[0];
        const TASKS = await (await TASKSMODEL.getTasksByCollectionId(await COLLECTION.id)).rows;

        socket.emit('got-tasks', await TASKS);
    })

    socket.on('create-task', async (data) => {
        const COLLECTION = await (await COLLECTIONSMODEL.getCollection(data.uuid)).rows[0];
        data.collection_id = await COLLECTION.id;
        TASKSMODEL.createTask(await data);
        socket.emit('created-tasks', await data);
    })

    socket.on('disconnect', () => {
        console.log(`Socket ${socket.id} disconnected.`);
    });
})

// Host on port
SERVER.listen(80, () => {
    console.log(`Listening on port ${80}.`);
});