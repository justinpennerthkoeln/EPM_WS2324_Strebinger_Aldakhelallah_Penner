// Import socket.io-client
import { io } from 'socket.io-client';

// Establish a socket connection to the server
const SOCKET = io('ws://localhost:80');

SOCKET.on('connect', () => {
    console.log(`Connected with ${SOCKET.id}.`);

    localStorage.setItem('userId', new URLSearchParams(window.location.search).get('userId'));

    SOCKET.emit('get-user-collections', new URLSearchParams(window.location.search).get('userId'));

    SOCKET.emit('get-user', new URLSearchParams(window.location.search).get('userId'));

    const USERNAME = document.getElementById('username');

    SOCKET.on('got-user', (data) => {
        USERNAME.innerText = `@${data.username}`;
    });

    let collections;

    SOCKET.on('got-collections', (data) => {
        collections = Vue.createApp({
            data() {
                return {
                    collections: data,
                    dateOptions: {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric'
                    }
                }
            },
            template: `
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Created</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="collection in collections" @click="navigateToCollection(collection.uuid)">
                        <td>{{ collection.name }}</td>
                        <td>{{ new Date(collection.timestamp).toLocaleString('de-DE', this.dateOptions) }}</td>
                    </tr>
                </tbody>
            `,
            methods: {
                navigateToCollection(uuid) {
                    window.location.href = `/${uuid}`;
                },
                addCollection(data) {
                    this.collections.push(data);
                }
            }
        }).mount('#collections');
    });

    SOCKET.on('disconnect', () => {
        console.log(`Disconnected from ${SOCKET.id}.`);
    });

    const CREATECOLLECTIONBUTTON = document.getElementById('create-collection');
    const CREATECOLLECTIONCONTAINER = document.getElementById('create-collection-container');

    CREATECOLLECTIONBUTTON.addEventListener('click', () => {
        CREATECOLLECTIONCONTAINER.classList.toggle('hidden');
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                CREATECOLLECTIONCONTAINER.classList.add('hidden');
            }
        });
    });

    CREATECOLLECTIONCONTAINER.addEventListener('click', (event) => {
        if (event.target === CREATECOLLECTIONCONTAINER) {
            CREATECOLLECTIONCONTAINER.classList.toggle('hidden');
        }
    });

    

    const COLLECTIONCREATEFORM = document.getElementById('collection-create-form');
    COLLECTIONCREATEFORM.addEventListener('submit', ($event) => {
        $event.preventDefault();

        const COLLECTIONSDATA = new FormData(COLLECTIONCREATEFORM);
        SOCKET.emit('create-collection', {
            id: new URLSearchParams(window.location.search).get('userId'),
            name: COLLECTIONSDATA.get('name'),
            description: COLLECTIONSDATA.get('description')
        });
    });

    SOCKET.on('created-collection', (data) => {
        collections.addCollection(data.rows[0]);

        CREATECOLLECTIONCONTAINER.classList.toggle('hidden');
    });
});