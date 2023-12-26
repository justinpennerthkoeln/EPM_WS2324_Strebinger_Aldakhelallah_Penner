// Import socket.io-client
import { io } from 'socket.io-client';

// Establish a socket connection to the server
const SOCKET = io('ws://localhost:80');

SOCKET.on('connect', () => {
    console.log(`Connected with ${SOCKET.id}.`);

    SOCKET.emit('get-user-collections', new URLSearchParams(window.location.search).get('userId'));

    SOCKET.on('got-collections', (data) => {
        const COLLECTIONSECTION = document.getElementById('collections');
        for (const COLLECTION of data) {
            const a = document.createElement('a');
            a.href = `/${COLLECTION.uuid}`;
            a.innerText = COLLECTION.name;
            const div = document.createElement('div');
            div.classList.add('collection');
            div.appendChild(a);
            COLLECTIONSECTION.appendChild(div);
        }
    });

    SOCKET.on('disconnect', () => {
        console.log(`Disconnected from ${SOCKET.id}.`);
    });


    const COLLECTIONCREATEFORM = document.getElementById('collection-create-form');
    COLLECTIONCREATEFORM.addEventListener('submit', ($event) => {
        $event.preventDefault();

        const COLLECTIONSDATA = new FormData(COLLECTIONCREATEFORM);
        SOCKET.emit('create-collection', {
            id: new URLSearchParams(window.location.search).get('userId'),
            name: COLLECTIONSDATA.get('name'),
            description: COLLECTIONSDATA.get('description'),
            role: new URLSearchParams(window.location.search).get('role')
        });
    });

    const COLLECTIONSECTION = document.getElementById('collections');
    SOCKET.on('created-collection', (data) => {
        const a = document.createElement('a');
        a.href = `/${data.rows[0].uuid}`;
        a.innerText = data.rows[0].name;
        const div = document.createElement('div');
        div.classList.add('collection');
        div.appendChild(a);
        COLLECTIONSECTION.appendChild(div);
    });
});