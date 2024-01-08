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
const ALERTSMODEL = require('./models/alertsModel.js');
const TASKSMODEL = require('./models/tasksModel.js');
const MEMBERMODEL = require('./models/memberModel.js');
const USERMODEL = require('./models/userModel.js');
const PLATFORMSMODEL = require('./models/platformModel.js');
const TODOMODEL = require('./models/todoModel.js');
const FEEDBACKMODEL = require('./models/feedbackModel.js');
const REPLIESMODEL = require('./models/repliesModel.js');

//Routing
APP.get("/", (req, res) => {
    if(req.query.userId) {
        res.sendFile(__dirname + "/views/overview.html");
    }
    else {
        res.redirect('/signin');
    }
});

APP.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect('/signin');
});

APP.get("/login", (req, res) => {
    res.redirect('/signin');
});

APP.get("/register", (req, res) => {
    res.redirect('/signup');
});

APP.get("/signin", (req, res) => {
    res.sendFile(__dirname + "/views/signin.html");
});

APP.post("/signin", urlencodedParser, async (req, res) => {
    const USER = await USERMODEL.getByUsernameAndPassword(await req.body.username, await req.body.password);
    if (USER.rows.length == 0) {
        res.redirect('/signin?error=Invalid_username_or_password');
    } else {
        res.redirect(`/?userId=${USER.rows[0].id}&success=Signed_in`);
    }
});

APP.get("/signup", (req, res) => {
    res.sendFile(__dirname + "/views/signup.html");
});

APP.post("/signup", urlencodedParser, async (req, res) => {

    if (await req.body.password != await req.body.confirmPassword) {
        res.redirect('/signup?error=Passwords_do_not_match');
    }
    else {
        const USER = await USERMODEL.getByEmail(await req.body.email);

        if (USER.rows.length == 0) {
            try {
                const USER = await USERMODEL.createUser(await req.body.username, await req.body.email, await req.body.password);
                if(USER == false) {
                    throw new Error('Error creating user.');
                } else {
                    res.redirect('/signin?success=Account_created');
                }
            } catch (error) {
                res.redirect('/signup?error=Username_already_in_use');
            }
        } else {
            res.redirect('/signup?error=Email_already_in_use');
        }
    }
});

APP.get("/reposelections", (req, res) => {
    res.sendFile(__dirname + "/views/reposelections.html");
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

    const QUERY2 = `https://api.github.com/user`;
    const RESPONSE2 = await fetch(QUERY2, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Authorization': `token ${RESPONSE.access_token}`
        }
    }).then((response) => response.json());

    PLATFORMSMODEL.updatePlatform(req.params.plaformId, await RESPONSE.access_token, '', await RESPONSE2.login);

    res.redirect(`/reposelections?uuid=${req.params.uuid}&platformId=${req.params.plaformId}&platform=github`);
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

    Promise.resolve(RESPONSE).then(async (authJson) => {
        fetch(`https://gitlab.com/api/v4/user`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer ${authJson.access_token}`
            }
        }).then((response) => response.json()).then((data) => {
            PLATFORMSMODEL.updatePlatform(platformId, authJson.access_token, '', data.username);
            res.redirect(`/reposelections?uuid=${uuid}&platformId=${platformId}&platform=gitlab`);
        });
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
        PLATFORMSMODEL.updatePlatform(PLATFORMID, response.access_token, response.workspace_id, '');
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
        PLATFORMSMODEL.updatePlatform(PLATFORMID, data.access_token, '', '');
        res.status(200).redirect(`/${UUID}/settings`);
    })
    .catch(error =>{
        console.error('Error during token exchange:', error);
        res.status(500).send('Internal Server Error');
    });

    
});

APP.get("/figma/oauth", async (req, res) => {
    const UUID = req.query.state.split('_')[0];
    const PLATFORMID = req.query.state.split('_')[1];
    const CODE = req.query.code;
    const CLIENTID = 'lran9jv5bDLcZamRAN3khE';
    const CLIENTSECRET = '5y0PGZM8aRRcOt4TvOkWa8z5citlRj';

    const test = fetch(`https://www.figma.com/api/oauth/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `client_id=${CLIENTID}&client_secret=${CLIENTSECRET}&code=${CODE}&grant_type=authorization_code&redirect_uri=http://localhost:80/figma/oauth`
    }).then((response) => {
        return response.json();
    })
    Promise.resolve(test).then((data) => {
        PLATFORMSMODEL.updatePlatform(PLATFORMID, data.access_token, '', '');
        res.status(200).redirect(`/${UUID}/settings`);
    });
});

//Collection
APP.get("/:uuid", async (req, res) => {
    res.sendFile(__dirname + "/views/collection.html");
});

APP.get("/:uuid/feedback/:feedbackId", async (req, res) => {
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
    const PLATFORMS = await (await PLATFORMSMODEL.getPlatformsByCollectionId(await COLLECTION.id)).rows;

    res.send(PLATFORMS);
});

APP.get("/:uuid/settings", async (req, res) => {
    res.sendFile(__dirname + "/views/settings.html");
});

APP.get("/:uuid/settings/:setting", async (req, res) => {
    res.sendFile(__dirname + "/views/settings.html");
});


//API

APP.get("/api/users", async (req, res) => {
    const SEARCHTERM = req.query.searchTerm;
    const USERS = await (await USERMODEL.getAllUsers(SEARCHTERM.toLowerCase())).rows;
    res.send(USERS);
});

APP.get("/api/tasks/:taskId/todos", async (req, res) => {
    const TODOS = await (await TODOMODEL.getTodosByTaskId(req.params.taskId)).rows;
    res.send(TODOS);
});

APP.get("/api/tasks/:taskId/feedbacks", async (req, res) => {
    const FEEDBACKS = await (await FEEDBACKMODEL.getFeedbacksWithUsersAndRepliesByTaskId(req.params.taskId)).rows;
    res.send(FEEDBACKS);
})

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

    // User informations
    socket.on('get-user', async (userId) => {
        const INFORMATION = await (await USERMODEL.getInformation(userId)).rows[0];
        socket.emit('got-user', await INFORMATION);
    });

    socket.on('get-member', async (data) => {
        const COLLECTION = await (await COLLECTIONSMODEL.getCollection(data.uuid)).rows[0];
        var member = await (await MEMBERMODEL.getMembershipsByCollectionIdAndUserId(data.userId, await COLLECTION.collection_id)).rows[0];
        const USER = await (await USERMODEL.getInformation(data.userId)).rows[0];
        socket.emit('got-member', {membershipId: await member.membership_id, username: await USER.username});
    });

    // User Socket Conn
    socket.on('join' , async (data) => {
        socket.join("room-" + data.uuid);
        socket.handshake.session.uuid = "room-" + data.uuid;
        socket.handshake.session.save();
    });

    socket.on('leave', async (data) => {
        socket.leave("room-" + data);
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

    socket.on('delete-collection', async (data) => {
        try {
            const COLLECTION = await (await COLLECTIONSMODEL.getCollection(data.uuid)).rows[0];
            await COLLECTIONSMODEL.deleteCollectionById(COLLECTION.collection_id);
            socket.emit('deleted-collection', "Collection deleted.");
        } catch (error) {
            console.log(error);
            socket.emit('error', 'Something went wrong. Please try again later.');
        }
    });

    //Task Board
    socket.on('get-details', async (uuid) => {
        const MEMBERARRAY = [];
        const COLLECTION = await (await COLLECTIONSMODEL.getCollection(uuid)).rows[0];
        const MEMBERS = await (await MEMBERMODEL.getMembershipsByCollectionId(await COLLECTION.collection_id)).rows;
        for (const MEMBER of MEMBERS) {
            MEMBERARRAY.push(await (await USERMODEL.getInformation(await MEMBER.user_id)).rows[0]);
        }
        COLLECTION.members = await MEMBERARRAY;
        socket.emit('got-details', await COLLECTION);
    })

    socket.on('get-tasks', async (uuid) => {
        const COLLECTION = await (await COLLECTIONSMODEL.getCollection(uuid)).rows[0];
        const TASKS = await (await TASKSMODEL.getTasksWithOwnershipsByCollectionId(await COLLECTION.collection_id)).rows;

        socket.emit('got-tasks', await TASKS);
    });

    socket.on('get-todos-of-task', async (taskId) => {
        const TODOS = await (await TODOMODEL.getTodosByTaskId(taskId)).rows;
        socket.emit('got-todos-of-task', await TODOS);
    });

    socket.on('create-task', async (data) => {
        const COLLECTION = await (await COLLECTIONSMODEL.getCollection(data.uuid)).rows[0];
        data.collection_id = await COLLECTION.collection_id;
        TASKSMODEL.createTask(await data);
        const PLATFORM = await (await PLATFORMSMODEL.getPlatformById(await data.platform)).rows[0];
        if(data.createIssue) {
            switch(PLATFORM.platform) {
                case 'github':
                    fetch(`https://api.github.com/repos/${PLATFORM.username}/${PLATFORM.target_document}/issues`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `token ${PLATFORM.platform_key}`,
                        },
                        body: JSON.stringify({
                            title: data.name,
                            body: data.description
                        })
                    })
                    break;
                case 'gitlab':
                    fetch(`https://gitlab.com/api/v4/projects/${PLATFORM.target_document}/issues`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${PLATFORM.platform_key}`,
                        },
                        body: JSON.stringify({
                            title: data.name,
                            description: data.description
                        })
                    })
                    break;
                case 'figma':
                    fetch(`https://api.figma.com/v1/files/${PLATFORM.target_document}/comments`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + PLATFORM.platform_key,
                        },
                        body: JSON.stringify({
                            "message": data.name + ' | ' + data.description,
                        })
                    }).then((response) => response.json());
                    break;
                case 'notion':
                    fetch(`https://api.notion.com/v1/comments`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': PLATFORM.platform_key,
                            'Notion-Version': '2022-02-22'
                        },
                        body: JSON.stringify({
                            "parent": {
                                "page_id": PLATFORM.target_document
                            },
                            "rich_text": [
                                {
                                    "type": "text",
                                    "text": {
                                      "content": `${data.name}:`,
                                      "link": null
                                    },
                                    "annotations": {
                                      "bold": true,
                                      "italic": false,
                                      "strikethrough": false,
                                      "underline": false,
                                      "code": false,
                                      "color": "orange_background"
                                    },
                                    "plain_text": `${data.name}:`,
                                    "href": null
                                },
                                {
                                    "type": "text",
                                    "text": {
                                      "content": ` ${data.description}`,
                                      "link": null
                                    },
                                    "annotations": {
                                      "bold": false,
                                      "italic": false,
                                      "strikethrough": false,
                                      "underline": false,
                                      "code": false,
                                      "color": "default"
                                    },
                                    "plain_text": ` ${data.description}`,
                                    "href": null
                                },
                                {
                                    "type": "text",
                                    "text": {
                                      "content": ` [${data.status}]`,
                                      "link": null
                                    },
                                    "annotations": {
                                      "bold": false,
                                      "italic": true,
                                      "strikethrough": false,
                                      "underline": false,
                                      "code": false,
                                      "color": "default"
                                    },
                                    "plain_text": ` [${data.status}]`,
                                    "href": null
                                }
                            ]
                        })
                    }).then((response) => response.json());
                    break;
                case 'dribbble':
                    break;
                case '-':
                    console.log('No platform connected.');
                    break;
                default:
                    break;
            }
        }
        IO.in(socket.handshake.session.uuid).emit('created-tasks', await data);
    })

    socket.on('save-todo', async (data) => {
        TODOMODEL.createTodo(await data);
    });

    socket.on('update-todo', async (data) => {
        TODOMODEL.updateTodoStatus(data.todo_id, data.status);
        data.todo_count = await (await TODOMODEL.getTodosByTaskId(data.task_id)).rowCount;
        IO.to(socket.handshake.session.uuid).emit('updated-todo', await data);
    });

    socket.on('save-feedback', async (data) => {
        const FEEDBACK = await (await FEEDBACKMODEL.saveFeedback(await data)).rows[0];
        FEEDBACK.username = data.username;
        IO.in(socket.handshake.session.uuid).emit('saved-feedback', await FEEDBACK);
    })

    socket.on('save-reply-feedback', async (data) => {
        const REPLY = await (await REPLIESMODEL.saveReply(await data)).rows[0];
        IO.in(socket.handshake.session.uuid).emit('saved-reply-feedback', await REPLY);
    });

    socket.on('disconnect', () => {
        console.log(`Socket ${socket.id} disconnected.`);
    });

    socket.on('get-platforms', async (uuid) => {
        const COLLECTION = await (await COLLECTIONSMODEL.getCollection(uuid)).rows[0];
        const PLATFORMS = await (await PLATFORMSMODEL.getPlatformsByCollectionId(await COLLECTION.collection_id)).rows;
        socket.emit('got-platforms', await PLATFORMS);
    });

    socket.on('update-task-status', async (data) => {
        if(TASKSMODEL.updateTaskStatus(await data))
            IO.in(socket.handshake.session.uuid).emit('updated-task-status', await data);
    });

    //Platforms
    socket.on('create-platform', async (data) => {
        const COLLECTION = await (await COLLECTIONSMODEL.getCollection(data.uuid)).rows[0];
        var CONN = {};
        data.collection_id = await COLLECTION.collection_id;
        const PLATFORM = PLATFORMSMODEL.createPlatform(data.id, data.collection_id, data.platform, '', '', '');
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
                    CONN = connectFigma(data, form.rows[0].platform_id)
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

    //Get Repos of Connection
    socket.on('get-repos', async (data) => {
        const PLATFORM = await (await PLATFORMSMODEL.getPlatformById(data.platformId)).rows[0];
        switch(data.platform) {
            case 'github': 
                var repos = fetch(`https://api.github.com/users/${PLATFORM.username}/repos`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `token ${PLATFORM.platform_key}`
                    }
                }).then((response) => response.json());
                socket.emit('got-repos', await repos);
                break;
            case 'gitlab':
                var repos = fetch(`https://gitlab.com/api/v4/projects?membership=true`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': `Bearer ${PLATFORM.platform_key}`
                    }
                }).then((response) => response.json());
                socket.emit('got-repos', await repos);
                break;
        }
    });

    socket.on('update-target-document', async (data) => {
        try {
            await PLATFORMSMODEL.updateTargetDocument(data.platformId, data.targetDocument);
            socket.emit('updated-target-document', 'Target document updated.');
        } catch (error) {
            socket.emit('error', 'Could not be updated. Please try again later.');
            console.log(error);
        }
    });

    socket.on('delete-platform', async (data) => {
        try {
            await PLATFORMSMODEL.deletePlatformById(data.platformId);
            socket.emit('deleted-platform', 'Platform deleted.');
        } catch (error) {
            socket.emit('error', 'Could not be deleted. Please try again later.');
            console.log(error);
        }
    });

    //Settings

    //Invite Collaborators
    socket.on('invite-collaborator', async (data) => {
        const COLLECTION = await (await COLLECTIONSMODEL.getCollection(data.uuid)).rows[0];
        const MEMBER = await (await MEMBERMODEL.checkMembership(data.userId, await COLLECTION.collection_id)).rows[0];
        if(MEMBER.count > 0) {
            socket.emit('error', 'User already invited.');
        } else {
            const MEMBER = await (await MEMBERMODEL.createMember(data.userId, await COLLECTION.collection_id)).rows[0];
            MEMBER.success = 'User invited.';
            socket.emit('invited-collaborator', await MEMBER);
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
        oauth: `https://gitlab.com/oauth/authorize?client_id=ee480e58dacb20b4af3ea2eada267495191ea86740dde4360149d42a9b2706ac&redirect_uri=http://localhost:80/gitlab/oauth?ids=${data.uuid+'_'+platformId}&response_type=code&state=STATE&scopes=write_repository,read_user`
    }
    return CONN;
}

async function connectDribbble(data, platformId) {
    var CONN = {
        oauth: `https://dribbble.com/oauth/authorize?client_id=40c594e9554be586ed8cffafe32c3ab44b3b62d16aecb00a8a68a52b3430d358&redirect_uri=http://localhost:80/dribbble/oauth&scope=public+write&state=${data.uuid+'_'+platformId}`
    }
    return CONN;
}

async function connectFigma(data, platformId) {
    var CONN = {
        oauth: `https://www.figma.com/oauth?scope=files:read,file_comments:write&state=${data.uuid}_${platformId}&response_type=code&client_id=lran9jv5bDLcZamRAN3khE&redirect_uri=http://localhost:80/figma/oauth`
    }
    return CONN;
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