import { io } from 'socket.io-client';

// Establish a SOCKET connection to the server
const SOCKET = io('ws://localhost:80');

SOCKET.on('connect', () => {
    console.log(`Connected with ${SOCKET.id}.`);

    const h1 = document.querySelector('h1');
    const forms = document.querySelectorAll('form');
    const platformForm = document.querySelectorAll('#add-platform-form')[0];
    const sideNav = document.querySelectorAll('#aside-nav ul a');

    SOCKET.emit('get-details', (window.location.pathname.split('/')[1]));

    SOCKET.on('got-details', (collection) => {
        h1.innerHTML = collection.name;

        forms.forEach((element) => {
            element.action = '/' + collection.uuid + '/' + element.action.split('/')[3];
        });
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