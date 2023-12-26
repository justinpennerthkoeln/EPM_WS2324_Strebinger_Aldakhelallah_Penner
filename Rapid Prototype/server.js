// Imports
const HTTP = require('http');
const EXPRESS = require('express');
const SOCKETIO = require('socket.io');
const DOTENV = require('dotenv');
const BODYPARSER = require('body-parser');

// App setup
const APP = EXPRESS();
const SERVER = HTTP.createServer(APP);

var jsonParser = BODYPARSER.json()
var urlencodedParser = BODYPARSER.urlencoded({ extended: false })

//Middleware
APP.use(EXPRESS.static(__dirname + '/static'));
DOTENV.config();
APP.set("view engine", "ejs");

//modules
const COLLECTIONSMODEL = require('./models/collectionsModel.js');
const CONNECTIONSMODEL = require('./models/connectionsModel.js');
const ALERTSMODEL = require('./models/alertsModel.js');
const TASKSMODEL = require('./models/tasksModel.js');
const MEMBERMODEL = require('./models/memberModel.js');
const USERMODEL = require('./models/userModel.js');
const PLATFORMSMODEL = require('./models/platformModel.js');

//Routing
APP.get("/", (req, res) => {
    res.sendFile(__dirname + "/views/createCollection.html");
});

APP.get("/login", (req, res) => {
    res.sendFile(__dirname + "/views/login.html");
});

APP.post("/login", urlencodedParser, async (req, res) => {
    const USER = await USERMODEL.getByUsernameAndPassword(await req.body.username, await req.body.password);
    if (USER.rows.length == 0) {
        res.redirect('/login?error=Invalid username or password.');
    } else {
        res.redirect(`/?userId=${USER.rows[0].id}&role=programmer`);
    }
});

APP.get("/register", (req, res) => {
    res.sendFile(__dirname + "/views/register.html");
});

APP.post("/register", urlencodedParser, async (req, res) => {
    const USER = await USERMODEL.getByEmail(await req.body.email);
    if (USER.rows.length == 0) {
        const USER = await USERMODEL.createUser(await req.body.username, await req.body.email, await req.body.password);
        res.redirect('/login?success=Account created.');
    } else {
        res.redirect('/register?error=Email already in use.');
    }
});

//Collection
APP.get("/:uuid", async (req, res) => {
    res.sendFile(__dirname + "/views/collection.html");
});

APP.get("/:uuid/alerts", async (req, res) => {
    const COLLECTION = await (await COLLECTIONSMODEL.getCollection(req.params.uuid)).rows[0];
    const ALERTS = await (await ALERTSMODEL.getAlerts(await COLLECTION.id)).rows;

    res.send(ALERTS);
});

APP.get("/:uuid/tasks", async (req, res) => {
    res.sendFile(__dirname + "/views/collection.html");
    // const COLLECTION = await (await COLLECTIONSMODEL.getCollection(req.params.uuid)).rows[0];
    // const TASKS = await (await TASKSMODEL.getTasksByCollectionId(await COLLECTION.id)).rows;

    // res.send(TASKS);
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

    //Collection
    socket.on('create-collection', async (data) => {
        const COLLECTION = await COLLECTIONSMODEL.createCollection(await data.name, await data.description);
        MEMBERMODEL.createMember(await data.id, await COLLECTION.rows[0].collection_id, await data.role);
        socket.emit('created-collection', await COLLECTION);

    })

    socket.on('get-user-collections', async (userId) => {
        const MEMBER = await (await MEMBERMODEL.getMemberById(userId)).rows[0];
        if (MEMBER) {
            const MEMBERSHIPS = await (await MEMBERMODEL.getMembershipsByUserId(userId)).rows;
            const COLLECTIONS = [];
            for (const MEMBERSHIP of MEMBERSHIPS) {
                COLLECTIONS.push(await (await COLLECTIONSMODEL.getCollectionById(await MEMBERSHIP.collection_id)).rows[0]);
            }
            socket.emit('got-collections', await COLLECTIONS);
        } else {
            socket.emit('got-collections', []);
        }
    });

    //Task Board
    socket.on('get-details', async (uuid) => {
        const COLLECTION = await (await COLLECTIONSMODEL.getCollection(uuid)).rows[0];
        socket.emit('got-details', await COLLECTION);
    })

    socket.on('get-tasks', async (uuid) => {
        const COLLECTION = await (await COLLECTIONSMODEL.getCollection(uuid)).rows[0];
        const TASKS = await (await TASKSMODEL.getTasksByCollectionId(await COLLECTION.collection_id)).rows;
        socket.emit('got-tasks', await TASKS);
    })

    socket.on('create-task', async (data) => {
        const COLLECTION = await (await COLLECTIONSMODEL.getCollection(data.uuid)).rows[0];
        data.collection_id = await COLLECTION.collection_id;
        TASKSMODEL.createTask(await data);
        IO.emit('created-tasks', await data);
    })

    socket.on('disconnect', () => {
        console.log(`Socket ${socket.id} disconnected.`);
    });

    socket.on('get-platforms', async (uuid) => {
        const COLLECTION = await (await COLLECTIONSMODEL.getCollection(uuid)).rows[0];
        const PLATFORMS = await (await PLATFORMSMODEL.getPlatformsByCollectionId(await COLLECTION.collection_id)).rows;
        socket.emit('got-platforms', await PLATFORMS);
    })
})

// Host on port
SERVER.listen(80, () => {
    console.log(`Listening on port ${80}.`);
});