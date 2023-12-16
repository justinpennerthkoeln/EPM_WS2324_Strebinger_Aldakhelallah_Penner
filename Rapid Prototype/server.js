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

//Routing
APP.get("/", (req, res) => {
    res.send({"message": "Hello World!"});
});

const IO = new SOCKETIO.Server(SERVER);

IO.on('connection', async (socket) => {
    console.log(`Connected with ${socket.id}.`);

    socket.on('disconnect', () => {
        console.log(`Socket ${socket.id} disconnected.`);
    });
})

// Host on port
SERVER.listen(80, () => {
    console.log(`Listening on port ${80}.`);
});