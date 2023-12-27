import { io } from 'socket.io-client';

// Establish a socket connection to the server
const socket = io('ws://localhost:80');

socket.on('connect', () => {
    console.log(`Connected with ${socket.id}.`);

    const h1 = document.querySelector('h1');
    const forms = document.querySelectorAll('form');
    const platformForm = document.querySelectorAll('#add-platform-form')[0];
    const sideNav = document.querySelectorAll('#aside-nav ul a');

    socket.emit('get-details', (window.location.pathname.split('/')[1]));

    socket.on('got-details', (collection) => {
        h1.innerHTML = collection.name;

        forms.forEach((element) => {
            element.action = '/' + collection.uuid + '/' + element.action.split('/')[3];
        });
    });

    platformForm.addEventListener('submit', ($event) => {
        $event.preventDefault();

        const COLLECTIONSDATA = new FormData(platformForm);
        const COLLECTIONSECTION = document.getElementById('platform-select');
        socket.emit('create-platform', {
            id: Number(document.cookie.split('userId=')[1]),
            platform: COLLECTIONSECTION.value,
            uuid: window.location.pathname.split('/')[1]
        });
    });

    socket.on('conn', (CONN) => {
        window.location.href = CONN.oauth;
    });

    sideNav.forEach((element) => {
        element.href = '/' + window.location.pathname.split('/')[1] + '/settings/' + element.href.split('/')[4];
    });

    socket.on('disconnect', () => {
        console.log(`Disconnected from ${socket.id}.`);
    });
});