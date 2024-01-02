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

    if(platformForm) {
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
    }

    SOCKET.on('conn', (CONN) => {
        window.location.href = CONN.oauth;
    });

    sideNav.forEach((element) => {
        element.href = '/' + window.location.pathname.split('/')[1] + '/settings/' + element.href.split('/')[4];
    });

    const SETTING = window.location.pathname.split('/')[3];
    if(SETTING == undefined) {
        document.querySelector('aside#rename-collection').classList.remove('hidden');
        const LINKS = document.querySelectorAll('#aside-nav ul a');
        LINKS.forEach((link) => {
            if(link.innerHTML == 'Rename collection') {
                link.classList.add('active');
            }
        });
    } else {
        document.querySelector(`aside#${SETTING}`).classList.remove('hidden');
        const LINKS = document.querySelectorAll('#aside-nav ul a');
        LINKS.forEach((link) => {
            if(link.innerHTML.toLowerCase() == SETTING.toLowerCase().replaceAll('-', ' ')) {
                link.classList.add('active');
            }
        });
    }

    SOCKET.on('disconnect', () => {
        console.log(`Disconnected from ${SOCKET.id}.`);
    });
});