import { io } from 'socket.io-client';
import { getHost } from './wsHost.js';

// Establish a socket connection to the server
const SOCKET = io(getHost(window.location.href));

SOCKET.on('connect', () => {


/// server 429   question
let collection_uuid = window.location.pathname.split('/')[1];
    SOCKET.emit('get-is-github-connected', (collection_uuid));


////  answer
    SOCKET.on('got-is-github-connected', (data) => {
        if(data==true)
            document.getElementById("btn-github").style.visibility="visible";
    });


    SOCKET.on('disconnect', () => {
        SOCKET.emit('leave', window.location.pathname.split('/')[1]);
        console.log('Disconnected from server');
    });
})