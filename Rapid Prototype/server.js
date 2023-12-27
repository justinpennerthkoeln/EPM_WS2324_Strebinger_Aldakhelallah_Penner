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
        res.redirect('/login?error=Invalid_username_or_password');
    } else {
        res.redirect(`/?userId=${USER.rows[0].id}`);
    }
});

APP.get("/register", (req, res) => {
    res.sendFile(__dirname + "/views/register.html");
});

APP.post("/register", urlencodedParser, async (req, res) => {
    const USER = await USERMODEL.getByEmail(await req.body.email);
    if (USER.rows.length == 0) {
        try {
            const USER = await USERMODEL.createUser(await req.body.username, await req.body.email, await req.body.password);
            if(USER == false) {
                throw new Error('Error creating user.');
            } else {
                res.redirect('/login?success=Account_created');
            }
        } catch (error) {
            res.redirect('/register?error=Username_already_in_use');
        }
    } else {
        res.redirect('/register?error=Email_already_in_use');
    }
});

//AUTH
APP.get("/github/oauth/:uuid/:plaformId", async (req, res) => {
    const QUERY = `https://github.com/login/oauth/access_token?code=${req.query.code}&client_id=e82e9be1c2c8d95f719a&client_secret=cc9b2c76bcf27acf37dc41cc7da7b6cdec010395`
    const RESPONSE = await fetch(QUERY, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        }
    }).then((response) => response.json());

    PLATFORMSMODEL.updatePlatform(req.params.plaformId, RESPONSE.access_token, '');

    res.redirect(`/${req.params.uuid}/settings`);
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
    res.sendFile(__dirname + "/views/settings.html");
});

const IO = new SOCKETIO.Server(SERVER);

IO.on('connection', async (socket) => {
    console.log(`Connected with ${socket.id}.`);

    //Collection
    socket.on('create-collection', async (data) => {
        const COLLECTION = await COLLECTIONSMODEL.createCollection(await data.name, await data.description);
        MEMBERMODEL.createMember(await data.id, await COLLECTION.rows[0].collection_id, 'project manager');
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

    //Platforms
    socket.on('create-platform', async (data) => {
        const COLLECTION = await (await COLLECTIONSMODEL.getCollection(data.uuid)).rows[0];
        var CONN = {};
        data.collection_id = await COLLECTION.collection_id;
        const PLATFORM = PLATFORMSMODEL.createPlatform(data.id, data.collection_id, data.platform, '', '');
        Promise.resolve(PLATFORM).then(async (form) => {
            switch(data.platform) {
                case 'github':
                    CONN = connectGithub(data, form.rows[0].platform_id);
                    socket.emit('conn', await CONN);
                    break;
                case 'gitlab':
                    CONN = connectGitlab()
                    socket.emit('conn', await CONN);
                    break;
                case 'dribbble':
                    CONN = connectDribbble()
                    socket.emit('conn', await CONN);
                    break;
                case 'figma':
                    CONN = connectFigma()
                    socket.emit('conn', await CONN);
                    break;
                case 'notion':
                    CONN = connectNotion()
                    socket.emit('conn', await CONN);
                    break;
                default:
                    break;
            }
        });
    })
});

//Connections
async function connectGithub(data, platformId) {
    var CONN = {
        oauth: `https://github.com/login/oauth/authorize?client_id=e82e9be1c2c8d95f719a&redirect_uri=http://localhost:80/github/oauth/${data.uuid}/${platformId}&allow_signup=true`
    }
    return CONN;
}

async function connectGitlab() {
    const CONNECTION = await CONNECTIONSMODEL.createConnection('gitlab');
    return CONNECTION;
}

async function connectDribbble() {
    const CONNECTION = await CONNECTIONSMODEL.createConnection('dribbble');
    return CONNECTION;
}

async function connectFigma() {
    const CONNECTION = await CONNECTIONSMODEL.createConnection('figma');
    return CONNECTION;
}

async function connectNotion() {
    const CONNECTION = await CONNECTIONSMODEL.createConnection('notion');
    return CONNECTION;
}

// Host on port
SERVER.listen(80, () => {
    console.log(`Listening on port ${80}.`);
});