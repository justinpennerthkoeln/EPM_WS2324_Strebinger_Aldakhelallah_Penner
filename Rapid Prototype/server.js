// Imports
const HTTP = require('http');
const EXPRESS = require('express');
const SOCKETIO = require('socket.io');
const DOTENV = require('dotenv');
const BODYPARSER = require('body-parser');
const SOCKETIOEXPRESSSESSION = require('socket.io-express-session');
const COOKIEPARSER = require('cookie-parser');
const COMPRESSION = require('compression');

// App setup
const APP = EXPRESS();
const SERVER = HTTP.createServer(APP);

//Middleware
var jsonParser = BODYPARSER.json()
var urlencodedParser = BODYPARSER.urlencoded({ extended: false })

APP.use(EXPRESS.static(__dirname + '/static'));
DOTENV.config();

const SESSION = require('express-session');
const SAVEDSESSION = SESSION({
	secret: 'keyboard cat',
	cookie: { maxAge: 60000 },
	resave: false,
	saveUninitialized: true,
});

APP.use(COOKIEPARSER());
APP.set('trust proxy', 1);
APP.use(SAVEDSESSION);
APP.use(COMPRESSION());
APP.disable('etag');

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

APP.get("/gitlab/oauth", async (req, res) => {
    const uuid = req.query.ids.split('_')[0];
    const platformId = req.query.ids.split('_')[1];
    const clientID = 'ee480e58dacb20b4af3ea2eada267495191ea86740dde4360149d42a9b2706ac';
    const clientSecret = 'gloas-9cfa3f429973932e85ec8fb962e58078cae9b96f99cb9a183997a649fd29cb1f';
    const authHeader = 'Basic ' + btoa(`${clientID}:${clientSecret}`);

    const RESPONSE = fetch(`https://gitlab.com/oauth/token?client_id=${clientID}&code=${req.query.code}&grant_type=authorization_code&redirect_uri=http://localhost:80/gitlab/oauth?ids=${encodeURIComponent(uuid + "_" + platformId)}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': authHeader
        },
    })
    .then(async (response) => {
        if (!response.ok) {
            const errorResponse = await response.json();
            throw new Error(`Failed to get access token: ${errorResponse.error_description}`);
        }
        return response.json();
    });

    Promise.resolve(RESPONSE)
    .then(async (response) => {
        PLATFORMSMODEL.updatePlatform(platformId, response.access_token, '');
        res.redirect(`/${uuid}/settings`);
    })
    .catch((error) => {
        console.error(error);
    });
});

APP.get('/notion/oauth', async (req, res) => {
    const RESPONSE = await fetch(`https://api.notion.com/v1/oauth/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${btoa('40fc3257-b3fe-4337-ab8a-297c5a970609:secret_NGi6ExCtRO9OZeTiGmvO71oJPN99z8LAiuaZZ94zvLE')}`
        },
        body: JSON.stringify({
            grant_type: 'authorization_code',
            code: req.query.code,
            redirect_uri: new URL('http://localhost:80/notion/oauth')
        })
    }).then((response) => response.json());

    const UUID = req.query.state.split('_')[0];
    const PLATFORMID = req.query.state.split('_')[1];

    Promise.resolve(RESPONSE).then(async (response) => {
        PLATFORMSMODEL.updatePlatform(PLATFORMID, response.access_token, response.workspace_id);
        res.redirect(`/${UUID}/settings`);
    });
});

APP.get("/dribbble/oauth", async (req, res) => {
    const TOKENURL = 'https://dribbble.com/oauth/token';
    const CLIENTID = '40c594e9554be586ed8cffafe32c3ab44b3b62d16aecb00a8a68a52b3430d358';
    const CLIENTSECRET = 'c283c1ebee3f4fb05777b650e379716ddba18e5a2552f28e53cb2a1974b1136a';
    const REDIRECT_URI = 'http://localhost:80/dribbble/oauth';

    const UUID = req.query.state.split('_')[0];
    const PLATFORMID = req.query.state.split('_')[1];

    const requestBody = {
        code: req.query.code,
        client_id: CLIENTID,
        client_secret: CLIENTSECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code'
    };

    fetch(TOKENURL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        PLATFORMSMODEL.updatePlatform(PLATFORMID, data.access_token, '');
        res.status(200).redirect(`/${UUID}/settings`);
    })
    .catch(error =>{
        console.error('Error during token exchange:', error);
        res.status(500).send('Internal Server Error');
    });

    
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

// Use socket.io-express-session middleware for session handling
IO.use(SOCKETIOEXPRESSSESSION(SAVEDSESSION));

IO.use((socket, next) => {
	const expressSessionMiddleware = SAVEDSESSION;
	expressSessionMiddleware(socket.handshake, {}, next);
});

IO.on('connection', async (socket) => {
    console.log(`Connected with ${socket.id}.`);

    socket.on('save-user', async (userId) => {
        socket.handshake.session.user = {
            id: userId
        }
    });

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
        console.log(data)
        const PLATFORM = PLATFORMSMODEL.createPlatform(data.id, data.collection_id, data.platform, '', '');
        Promise.resolve(PLATFORM).then(async (form) => {
            switch(data.platform) {
                case 'github':
                    CONN = connectGithub(data, form.rows[0].platform_id);
                    socket.emit('conn', await CONN);
                    break;
                case 'gitlab':
                    CONN = connectGitlab(data, form.rows[0].platform_id)
                    socket.emit('conn', await CONN);
                    break;
                case 'dribbble':
                    CONN = connectDribbble(data, form.rows[0].platform_id)
                    socket.emit('conn', await CONN);
                    break;
                case 'figma':
                    CONN = connectFigma()
                    socket.emit('conn', await CONN);
                    break;
                case 'notion':
                    CONN = connectNotion(data, form.rows[0].platform_id)
                    socket.emit('conn', await CONN);
                    break;
                default:
                    break;
            }
        });
    });

    socket.on('save-conn', async (data) => {
        socket.handshake.session.conn = {
            socketId: socket.id,
            uuid: data.uuid,
            platformId: data.platformId
        }
    });
});

//Connections
async function connectGithub(data, platformId) {
    var CONN = {
        oauth: `https://github.com/login/oauth/authorize?client_id=e82e9be1c2c8d95f719a&redirect_uri=http://localhost:80/github/oauth/${data.uuid}/${platformId}&allow_signup=true`
    }
    return CONN;
}

async function connectGitlab(data, platformId) {
    var CONN = {
        oauth: `https://gitlab.com/oauth/authorize?client_id=ee480e58dacb20b4af3ea2eada267495191ea86740dde4360149d42a9b2706ac&redirect_uri=http://localhost:80/gitlab/oauth?ids=${data.uuid+'_'+platformId}&response_type=code&state=STATE&scope=api read_api`
    }
    return CONN;
}

async function connectDribbble(data, platformId) {
    var CONN = {
        oauth: `https://dribbble.com/oauth/authorize?client_id=40c594e9554be586ed8cffafe32c3ab44b3b62d16aecb00a8a68a52b3430d358&redirect_uri=http://localhost:80/dribbble/oauth&scope=public+write&state=${data.uuid+'_'+platformId}`
    }
    return CONN;
}

async function connectFigma() {
    const CONNECTION = await CONNECTIONSMODEL.createConnection('figma');
    return CONNECTION;
}

async function connectNotion(data, platformId) {
    var redirect_uri = new URL('http://localhost:80/notion/oauth');
    var CONN = {
        oauth: `https://api.notion.com/v1/oauth/authorize?response_type=code&client_id=40fc3257-b3fe-4337-ab8a-297c5a970609&owner=user&redirect_uri=${redirect_uri}&state=${data.uuid+'_'+platformId}`,
        uuid: data.uuid,
        platformId: platformId
    }
    return CONN;
}

// Host on port
SERVER.listen(80, () => {
    console.log(`Listening on port ${80}.`);
});