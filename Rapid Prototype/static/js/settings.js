import { io } from 'socket.io-client';

// Establish a SOCKET connection to the server
const SOCKET = io('ws://localhost:80');

SOCKET.on('connect', () => {
    console.log(`Connected with ${SOCKET.id}.`);

    const forms = document.querySelectorAll('form');
    const platformForm = document.querySelectorAll('#add-platform-form')[0];
    const sideNav = document.querySelectorAll('#aside-nav ul a');

    SOCKET.emit('get-details', (window.location.pathname.split('/')[1]));
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

    SOCKET.emit('get-member', {userId: localStorage.getItem('userId'), uuid: window.location.pathname.split('/')[1]});

    SOCKET.on('got-member', (member) => {
        localStorage.setItem('username', member.username)
        localStorage.setItem('membershipId', member.membership_id);
    });

    platformForm.addEventListener('submit', ($event) => {
        $event.preventDefault();

        const COLLECTIONSDATA = new FormData(platformForm);
        const COLLECTIONSECTION = document.getElementById('platform-select');
        SOCKET.emit('create-platform', {
            id: Number(localStorage.getItem('userId')),
            platform: COLLECTIONSECTION.value,
            uuid: window.location.pathname.split('/')[1]
        });
    });


    SOCKET.on('conn', (CONN) => {
        window.location.href = CONN.oauth;
    });

    sideNav.forEach((element) => {
        element.href = '/' + window.location.pathname.split('/')[1] + '/settings/' + element.href.split('/')[4];
    });

    SOCKET.on('disconnect', () => {
        console.log(`Disconnected from ${SOCKET.id}.`);
    });
});