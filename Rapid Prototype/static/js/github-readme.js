import { io } from 'socket.io-client';
import { getHost } from './wsHost.js';

// Establish a socket connection to the server
const SOCKET = io(getHost(window.location.href));

SOCKET.on('connect', () => {
let collection_uuid = window.location.pathname.split('/')[1];
    // Collection details
    SOCKET.emit('get-details', (collection_uuid));
    SOCKET.on('got-details', (details) => {
        const HEADER = document.querySelector('main > header');
        const DATEOPTIONS = {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        };
        const DATE = new Date(details.timestamp).toLocaleString('de-DE', DATEOPTIONS);
        const MEMBERS = details.members.map((member) => {
            return `@${member.username}`;
        }).join(', ');

        document.title = `SynergyHub | ${details.name}`;

        HEADER.children[0].textContent = details.name;
        HEADER.children[1].textContent = `${DATE} — ${MEMBERS}`;
        HEADER.children[2].textContent = details.description;
    });

    SOCKET.emit('get-member', {userId: localStorage.getItem('userId'), uuid: collection_uuid});

    SOCKET.on('got-member', (data) => {
        localStorage.setItem('username', data.username);
        localStorage.setItem('membershipId', data.membershipId);
    });

//******************************
    SOCKET.emit('get-github-readme', (collection_uuid));

    SOCKET.on('got-github-readme', (data) => {
        document.getElementById("readme").innerHTML=data;
    });



    SOCKET.on('disconnect', () => {
        SOCKET.emit('leave', collection_uuid);
        console.log('Disconnected from server');
    });
})