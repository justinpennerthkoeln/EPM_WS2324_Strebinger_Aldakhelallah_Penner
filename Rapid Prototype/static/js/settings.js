import { io } from 'socket.io-client';

// Establish a SOCKET connection to the server
const SOCKET = io('ws://localhost:80');

SOCKET.on('connect', () => {
    console.log(`Connected with ${SOCKET.id}.`);

    const sideNav = document.querySelectorAll('#aside-nav ul a');

    // Update Page on Connection and Join Room
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

    SOCKET.on('conn', (CONN) => {
        window.location.href = CONN.oauth;
    });

    sideNav.forEach((element) => {
        element.href = '/' + window.location.pathname.split('/')[1] + '/settings/' + element.href.split('/')[4];
    });

    SOCKET.emit('join', window.location.pathname.split('/')[1]);

    // Show and mark the active setting
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

    // Invite Collaborators
    const SEARCHINPUT = document.querySelector('.invite-collaborators input');
    const SEARCHRESULTS = document.querySelector('.invite-collaborators ul');
    const INVITEBUTTON = document.querySelector('.invite-collaborators button');

    SEARCHINPUT.addEventListener('input', () => {
        if(SEARCHINPUT.value.length > 0) {
            SEARCHRESULTS.classList.add('disabled');
            INVITEBUTTON.setAttribute('disabled', true);
            fetch(`/api/users?searchTerm=${SEARCHINPUT.value.toLowerCase()}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then((response) => {
                return response.json();
            }).then((users) => {
                SEARCHRESULTS.classList.remove('disabled');
                SEARCHRESULTS.innerHTML = '';
                users.forEach((user) => {
                    const LI = document.createElement('li');
                    LI.setAttribute('userId', user.id);
                    LI.innerHTML = user.username;
                    SEARCHRESULTS.appendChild(LI);
                    LI.addEventListener('click', () => {
                        SEARCHRESULTS.innerHTML = '';
                        SEARCHRESULTS.appendChild(LI);
                        LI.classList.toggle('selected');
                        INVITEBUTTON.toggleAttribute('disabled');
                    });
                });
            });
        } else {
            SEARCHRESULTS.innerHTML = '';
        }
    });

    INVITEBUTTON.addEventListener('click', ($event) => {
        $event.preventDefault();
        const USERID = SEARCHRESULTS.children[0].getAttribute('userId');
        SOCKET.emit('invite-collaborator', {
            userId: USERID,
            uuid: window.location.pathname.split('/')[1]
        });
    });

    // Delete Collection
    const DELETEFORM = document.querySelector('#delete-collection div form');
    DELETEFORM.addEventListener('submit', ($event) => {
        $event.preventDefault();
        const DELETEINPUT = document.querySelector('#delete-collection div form input');
        const COLLECTIONNAME = document.querySelector('#collection-name').innerHTML;
        console.log(COLLECTIONNAME);
        if(DELETEINPUT.value == COLLECTIONNAME) {
            SOCKET.emit('delete-collection', {
                uuid: window.location.pathname.split('/')[1]
            });
        } else {
            window.location = `${window.location.origin}${window.location.pathname}?error=The Collection's name doesnt match.`;
        }
    });

    // Connect to Platform
    const BUTTONS = document.querySelectorAll('.connections button');
    BUTTONS.forEach((button) => {
        button.addEventListener('click', ($event) => {
            $event.preventDefault();
            if($event.target.value != undefined) {
                SOCKET.emit('create-platform', {
                    id: localStorage.getItem('userId'),
                    uuid: window.location.pathname.split('/')[1],
                    platform: $event.target.value
                });
            } else {
                SOCKET.emit('create-platform', {
                    id: localStorage.getItem('userId'),
                    uuid: window.location.pathname.split('/')[1],
                    platform: $event.target.parentElement.value
                });
            }
        })
    });

    // Manage Platforms
    const PLATFORMSDIV = document.querySelector('#manage-projects .platforms');
    SOCKET.emit('get-platforms', window.location.pathname.split('/')[1]);
    SOCKET.on('got-platforms', (platforms) => {
        PLATFORMSDIV.innerHTML = '';
        platforms.forEach((platform) => {
            const DIV = document.createElement('div');
            DIV.classList.add('platform');
            DIV.innerHTML = `
                    <h3>${capitalizeFirstLetter(platform.platform)}</h3>
                    <form>
                        <div>
                            <label for="target-document">Target Document</label>
                            <input type="text" name="target-document" value="${platform.target_document}" id="target-document" class="target-document">
                        </div>
                        <div class="platform-setting-buttons">
                            <button class="update-platform" value="${platform.platform_id}">Update</button>
                            <button class="delete-platform" value="${platform.platform_id}">Delete</button>
                        </div>
                    </form>
            `;
            PLATFORMSDIV.appendChild(DIV);

            const UPDATEBUTTON = DIV.querySelector('.update-platform');
            UPDATEBUTTON.addEventListener('click', ($event) => {
                const TARGETDOCUMENT = DIV.querySelector('.target-document');
                $event.preventDefault();
                SOCKET.emit('update-target-document', {
                    platformId: UPDATEBUTTON.value,
                    targetDocument: TARGETDOCUMENT.value,
                });
            });

            const DELETEBUTTON = DIV.querySelector('.delete-platform');
            DELETEBUTTON.addEventListener('click', ($event) => {
                $event.preventDefault();
                SOCKET.emit('delete-platform', {
                    platformId: DELETEBUTTON.value
                });
            });
        });
    });

    function capitalizeFirstLetter(word) {
        return word.slice(0, 1).toUpperCase() + word.slice(1);
    }

    // Manage Collaborators
    const COLLABORATORSDIV = document.querySelector('#manage-collaborators .collaborators');
    SOCKET.emit('get-members', window.location.pathname.split('/')[1]);
    SOCKET.on('got-members', (collaborators) => {
        COLLABORATORSDIV.innerHTML = '';
        collaborators.forEach((collaborator) => {
            const DIV = document.createElement('div');
            DIV.classList.add('collaborator');
            DIV.innerHTML = `
                    <h3>@${collaborator.username}</h3>
                    <form>
                        <div class="collaborator-setting-buttons">
                            <button class="delete-collaborator" value="${collaborator.membership_id}">Delete</button>
                        </div>
                    </form>
            `;
            COLLABORATORSDIV.appendChild(DIV);

            const DELETEBUTTON = DIV.querySelector('.delete-collaborator');
            DELETEBUTTON.addEventListener('click', ($event) => {
                $event.preventDefault();
                SOCKET.emit('delete-collaborator', {
                    membershipId: DELETEBUTTON.value
                });
            });
        });
    });

    // Rename Collection
    const RENAMEBUTTON = document.querySelector('.rename-collection-button');
    RENAMEBUTTON.addEventListener('click', ($event) => {
        const RENAMEINPUT = document.querySelector('.rename-collection-input').value;
        const ERRORMSG = document.querySelector('p.error');
        $event.preventDefault();
        if(RENAMEINPUT.length > 0) {
            SOCKET.emit('rename-collection', {
                uuid: window.location.pathname.split('/')[1],
                name: RENAMEINPUT
            });
        } else {
            ERRORMSG.classList.remove('hidden');
        }
    });
    
    // ERROR OR SUCCESS HANDLING
    SOCKET.on('error', (data) => {
        window.location = `${window.location.origin}${window.location.pathname}?error=${data}`;
    });

    SOCKET.on('invited-collaborator', (data) => {
        window.location = `${window.location.origin}${window.location.pathname}?success=${data.success}`;
    });

    SOCKET.on('deleted-collection', (data) => {
        window.location = `${window.location.origin}/?userId=${localStorage.userId}&success=${data}`;
    });

    SOCKET.on('updated-target-document', (data) => {
        window.location = `${window.location.origin}${window.location.pathname}?success=${data}`;
    });

    SOCKET.on('deleted-platform', (data) => {
        window.location = `${window.location.origin}${window.location.pathname}?success=${data}`;
    });

    SOCKET.on('deleted-collaborator', (data) => {
        window.location = `${window.location.origin}${window.location.pathname}?success=${data}`;
    });

    SOCKET.on('renamed-collection', (data) => {
        window.location = `${window.location.origin}${window.location.pathname}?success=${data}`;
    });

    SOCKET.on('disconnect', () => {
        SOCKET.emit('leave', window.location.pathname.split('/')[1]);
        console.log(`Disconnected from ${SOCKET.id}.`);
    });
});