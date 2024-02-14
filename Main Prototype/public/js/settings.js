document.addEventListener('DOMContentLoaded', () => {

    fetch(`/api/collections/${window.location.pathname.split("/")[2]}/infos`).then((response) => response.json()).then((collection) => {
        const header = document.querySelector('main > header');
        const dateOptions = {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        };
        const date = new Date(collection.timestamp).toLocaleString('de-DE', dateOptions);
        const members = collection.members.map((member) => {
            return `@${member.username}`;
        }).join(', ');

        document.title = `SynergyHub | ${collection.name}`;

        header.children[0].textContent = collection.name;
        header.children[1].textContent = `${date} — ${members}`;
        header.children[2].textContent = collection.description;
    });

    // Show and mark the active setting
    const setting = window.location.pathname.split('/')[4];
    if(setting == undefined) {
        document.querySelector('aside#rename-collection').classList.remove('hidden');
        const links = document.querySelectorAll('#aside-nav ul a');
        links.forEach((link) => {
            if(link.innerHTML == 'Rename collection') {
                link.classList.add('active');
            }
        });
    } else {
        document.querySelector(`aside#${setting}`).classList.remove('hidden');
        const links = document.querySelectorAll('#aside-nav ul a');
        links.forEach((link) => {
            if(link.innerHTML.toLowerCase() == setting.toLowerCase().replaceAll('-', ' ')) {
                link.classList.add('active');
            }
        });
    }

    // Update the side nav links to the current collection
    const sideNav = document.querySelectorAll('#aside-nav ul a');
    sideNav.forEach((element) => {
        element.href = '/collection/' + window.location.pathname.split('/')[2] + '/settings/' + element.href.split('/')[4];
    });

    // Rename Collection
    const renameButton = document.querySelector('.rename-collection-button');
    renameButton.addEventListener('click', ($event) => {
        const renameInput = document.querySelector('.rename-collection-input').value;
        const errorMessage = document.querySelector('p.error');
        $event.preventDefault();
        if(renameInput.length > 0) {
            fetch(`/api/collections/${window.location.pathname.split('/')[2]}/rename`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                },
                body: "name=" + renameInput
            }).then((response) => response.json()).then((data) => {
                fetch(`/api/alerts/${window.location.pathname.split('/')[2]}`, {
                    'method': 'POST',
                    'headers': {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    'body': JSON.stringify({
                        userId: JSON.parse(localStorage.getItem('user')).id,
                        collectionUuid: window.location.pathname.split('/')[2],
                        comment: `Collection renamed to ${renameInput}.`,
                        alertType: 'collection renaming',
                        timestamp: new Date().toISOString()
                    })
                })
                window.location = `${window.location.origin}${window.location.pathname}?success=${data.msg}`;
            });
        } else {
            errorMessage.classList.remove('hidden');
        }
    });

    // Delete Collection
    const deleteForm = document.querySelector('#delete-collection div form');
    deleteForm.addEventListener('submit', ($event) => {
        $event.preventDefault();
        const deleteInput = document.querySelector('#delete-collection div form input');
        const collectionName = document.querySelector('#collection-name').innerHTML;
        if(deleteInput.value == collectionName && deleteInput.value.length > 0) {
            fetch(`/api/collections/${window.location.pathname.split('/')[2]}/delete`, {
                method: 'POST'
            }).then((response) => response.json()).then((data) => {
                window.location = `${window.location.origin}/?success=Collection deleted.`;
            });
        } else {
            window.location = `${window.location.origin}${window.location.pathname}?error=The Collection's name doesnt match.`;
        }
    });

    // Update Description
    const descriptionForm = document.querySelector('#update-description form');
    descriptionForm.addEventListener('submit', ($event) => {
        $event.preventDefault();
        const descriptionInput = document.querySelector('#update-description form input');
        if(descriptionInput.value.length > 0) {
            fetch(`/api/collections/${window.location.pathname.split('/')[2]}/update-description`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                },
                body: "description=" + descriptionInput.value
            }).then((response) => response.json()).then((data) => {
                fetch(`/api/alerts/${window.location.pathname.split('/')[2]}`, {
                    'method': 'POST',
                    'headers': {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    'body': JSON.stringify({
                        userId: JSON.parse(localStorage.getItem('user')).id,
                        collectionUuid: window.location.pathname.split('/')[2],
                        comment: `Description renamed to ${descriptionInput.value}.`,
                        alertType: 'collection description changes',
                        timestamp: new Date().toISOString()
                    })
                })
                window.location = `${window.location.origin}${window.location.pathname}?success=Updated description.`;
            });
        } else {
            window.location = `${window.location.origin}${window.location.pathname}?error=The description is empty.`;
        }
    });

    // Invite Collaborators
    const searchInput = document.querySelector('.invite-collaborators input');
    const searchResults = document.querySelector('.invite-collaborators ul');
    const inviteButton = document.querySelector('.invite-collaborators button');

    searchInput.addEventListener('input', () => {
        if(searchInput.value.length > 0) {
            searchResults.classList.add('disabled');
            inviteButton.setAttribute('disabled', true);
            fetch(`/api/users?searchTerm=${searchInput.value.toLowerCase()}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then((response) => {
                return response.json();
            }).then((users) => {
                searchResults.classList.remove('disabled');
                searchResults.innerHTML = '';
                users.forEach((user) => {
                    const li = document.createElement('li');
                    li.setAttribute('userId', user.id);
                    li.innerHTML = user.username;
                    searchResults.appendChild(li);
                    li.addEventListener('click', () => {
                        searchResults.innerHTML = '';
                        searchResults.appendChild(li);
                        li.classList.toggle('selected');
                        inviteButton.toggleAttribute('disabled');
                    });
                });
            });
        } else {
            searchResults.innerHTML = '';
        }
    });

    inviteButton.addEventListener('click', async ($event) => {
        $event.preventDefault();
        const userId = searchResults.querySelector('.selected').getAttribute('userid');
        var alreadyMember = false;
        
        fetch(`/api/collections/${window.location.pathname.split('/')[2]}/members`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            }
        }).then((response) => response.json()).then((members) => {
            members.forEach((member) => {
                if(Number(member.user_id) == Number(userId)) {
                    console.log(true)
                    alreadyMember = true;
                }
            });
        }).then(() => {
            if(alreadyMember == false) {
                fetch(`/api/collections/${window.location.pathname.split('/')[2]}/invite`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json'
                    },
                    body: "userId=" + userId
                }).then((response) => response.json()).then((data) => {
                    window.location = `${window.location.origin}${window.location.pathname}?success=${data.msg}`;
                });
                fetch(`/api/alerts/${window.location.pathname.split('/')[2]}`, {
                    'method': 'POST',
                    'headers': {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    'body': JSON.stringify({
                        userId: JSON.parse(localStorage.getItem('user')).id,
                        collectionUuid: window.location.pathname.split('/')[2],
                        comment: `New User invited`,
                        alertType: 'collection member changes',
                        timestamp: new Date().toISOString()
                    })
                })
            } else {
                window.location = `${window.location.origin}${window.location.pathname}?error=This user is already a member.`;
            }
        });
    });

    // Manage Collaborators
    const collaboratorsDiv = document.querySelector('#manage-collaborators .collaborators');
    fetch(`/api/collections/${window.location.pathname.split('/')[2]}/members`).then((response) => response.json()).then((collaborators) => {
        collaboratorsDiv.innerHTML = '';
        collaborators.forEach((collaborator) => {
            const div = document.createElement('div');
            div.classList.add('collaborator');
            div.innerHTML = `
                    <h3>@${collaborator.username}</h3>
                    <form>
                        <div class="collaborator-setting-buttons">
                            <button class="delete-collaborator" value="${collaborator.membership_id}">Delete</button>
                        </div>
                    </form>
            `;
            collaboratorsDiv.appendChild(div);

            const deleteButton = div.querySelector('.delete-collaborator');
            deleteButton.addEventListener('click', ($event) => {
                $event.preventDefault();
                const username = deleteButton.parentElement.parentElement.parentElement.querySelector('h3').innerHTML
                if(JSON.parse(localStorage.getItem('user')).username.toLowerCase().trim() != username.toLowerCase().trim().replace('@', '')){
                    fetch(`/api/collections/${window.location.pathname.split('/')[2]}/delete/${deleteButton.value}`, {
                        method: 'POST'
                    }).then((response) => response.json()).then((data) => {
                        window.location = `${window.location.origin}${window.location.pathname}?success=Successfully deleted collaborator.`;
                        fetch(`/api/alerts/${window.location.pathname.split('/')[2]}`, {
                            'method': 'POST',
                            'headers': {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json'
                            },
                            'body': JSON.stringify({
                                userId: JSON.parse(localStorage.getItem('user')).id,
                                collectionUuid: window.location.pathname.split('/')[2],
                                comment: `User ${username} deleted.`,
                                alertType: 'collection member changes',
                                timestamp: new Date().toISOString()
                            })
                        })
                    });
                } else {
                    window.location = `${window.location.origin}${window.location.pathname}?error=You can't delete yourself.`;
                }
            });
        });
    });

    // Add project
    const buttons = document.querySelectorAll('.connections button');
    buttons.forEach((button) => {
        button.addEventListener('click', ($event) => {
            $event.preventDefault();
            if($event.target.value != undefined) {
                getPlatform(JSON.parse(localStorage.getItem('user')).id, window.location.pathname.split('/')[2], $event.target.value);
            } else {
                getPlatform(JSON.parse(localStorage.getItem('user')).id, window.location.pathname.split('/')[2], $event.target.parentElement.value);
            }
        })
    });

    // Manage projects
    const projectsDiv = document.querySelector('#manage-projects .platforms');
    fetch(`/api/collections/${window.location.pathname.split('/')[2]}/platforms`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then((response) => response.json()).then((platforms) => {
        projectsDiv.innerHTML = '';
        platforms.forEach((platform) => {
            const div = document.createElement('div');
            div.classList.add('platform');
            div.innerHTML = `
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
            projectsDiv.appendChild(div);

            const deleteButton = div.querySelector('.delete-platform');
            deleteButton.addEventListener('click', ($event) => {
                $event.preventDefault();
                fetch(`/api/collections/platform/delete/${deleteButton.value}`, {
                    method: 'POST'
                }).then((response) => response.json()).then((data) => {
                    fetch(`/api/alerts/${window.location.pathname.split('/')[2]}`, {
                        'method': 'POST',
                        'headers': {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        'body': JSON.stringify({
                            userId: JSON.parse(localStorage.getItem('user')).id,
                            collectionUuid: window.location.pathname.split('/')[2],
                            comment: `platform ${platform.platform} deleted.`,
                            alertType: 'collection member changes',
                            timestamp: new Date().toISOString()
                        })
                    })
                    window.location = `${window.location.origin}${window.location.pathname}?success=Successfully deleted project.`;
                });
            });

            const updateButton = div.querySelector('.update-platform');
            updateButton.addEventListener('click', ($event) => {
                $event.preventDefault();
                fetch(`/api/platforms/${updateButton.value}/target-document?document=${div.querySelector('.target-document').value}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json'
                    }
                }).then((response) => response.json()).then((data) => {
                    window.location = `${window.location.origin}${window.location.pathname}?success=Successfully updated project.`;
                });
            });
        });
    });
    
    function capitalizeFirstLetter(word) {
        return word.slice(0, 1).toUpperCase() + word.slice(1);
    }

    const alerts = Vue.createApp({
        data() {
            return {
                settings: null,
                setting_options: {},
                dateOptions: {
                    year: "numeric",
                    month: "numeric",
                    day: "numeric",
                },
            };
        },
        template: `
            <template v-for="setting in setting_options" class="alert-template">
                <div id="alert-setting">
                    <p>{{setting.setting}}</p>
                    <label class="switch">
                        <input type="checkbox" v-model="setting.value">
                        <span class="slider round" :class="{true: 'checked'}[setting.value]"  @click="updateSetting(setting.alert_settings_id, setting.value, setting.setting)"></span>
                    </label>
                </div>
            </template>
        `,
        methods: {
            getAlerts() {
                fetch(`/api/alerts/${window.location.pathname.split("/")[2]}/settings`, {
                    'method': 'GET',
                    'headers': {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }).then((response) => response.json()).then((settings) => {
                    this.settings = settings.rows;
                    this.setting_options = settings.rows
                });
            },
            updateSetting(id, value, name) {
                this.setting_options.forEach((setting) => {
                    if(setting.setting == name) {
                        setting.value = value;
                    }
                });
                fetch(`/api/alerts/${window.location.pathname.split("/")[2]}/settings`, {
                    'method': 'POST',
                    'headers': {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    'body': JSON.stringify({
                        id: id,
                        value: !value,
                        setting: name
                    })
                })
            }
        },
        mounted() {
            this.getAlerts();
        },
    }).mount("#collection-alert-settings .alert-settings");
});

async function getPlatform (userId, collectionUuid, platform) {
    fetch(`/api/collections/${collectionUuid}/infos`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then((response) => response.json()).then((collection) => {
        fetch(`/api/collections/platform/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            body: "userId=" + userId + "&collectionId=" + collection.collection_id + "&platform=" + platform
        }).then((response) => {
            response.json().then((data) => {
                switch(platform) {
                    case "github":
                        connectGithub(window.location.pathname.split('/')[2], data.platform_id);
                        break;
                    case "gitlab":
                        connectGitlab(window.location.pathname.split('/')[2], data.platform_id);
                        break;
                    case "dribbble":
                        connectDribbble(window.location.pathname.split('/')[2], data.platform_id);
                        break;
                    case "figma":
                        connectFigma(window.location.pathname.split('/')[2], data.platform_id);
                        break;
                    case "notion":
                        connectNotion(window.location.pathname.split('/')[2], data.platform_id);
                        break;
                }
            });
        });

        fetch(`/api/alerts/${window.location.pathname.split('/')[2]}`, {
            'method': 'POST',
            'headers': {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            'body': JSON.stringify({
                userId: JSON.parse(localStorage.getItem('user')).id,
                collectionUuid: window.location.pathname.split('/')[2],
                comment: `Connected to ${platform}`,
                alertType: 'platform changes',
                timestamp: new Date().toISOString()
            })
        })
    });
}

//Connections
async function connectGithub(uuid, platformId) {
    window.location.href = `https://github.com/login/oauth/authorize?client_id=e82e9be1c2c8d95f719a&redirect_uri=http://localhost:80/oauth/github/${uuid}/${platformId}&allow_signup=true&scope=repo%20user`;
}

async function connectGitlab(uuid, platformId) {
    window.location.href = `https://gitlab.com/oauth/authorize?client_id=ee480e58dacb20b4af3ea2eada267495191ea86740dde4360149d42a9b2706ac&redirect_uri=http://localhost:80/oauth/gitlab?ids=${uuid+'_'+platformId}&response_type=code&state=STATE&scopes=write_repository,read_user`;
}

async function connectDribbble(uuid, platformId) {
    window.location.href = `https://dribbble.com/oauth/authorize?client_id=40c594e9554be586ed8cffafe32c3ab44b3b62d16aecb00a8a68a52b3430d358&redirect_uri=http://localhost:80/oauth/dribbble&scope=public+write&state=${uuid+'_'+platformId}`;
}

async function connectFigma(uuid, platformId) {
    window.location.href = `https://www.figma.com/oauth?scope=files:read,file_comments:write&state=${uuid}_${platformId}&response_type=code&client_id=lran9jv5bDLcZamRAN3khE&redirect_uri=http://localhost:80/oauth/figma`;
}

async function connectNotion(uuid, platformId) {
    var redirect_uri = new URL('http://localhost:80/oauth/notion');
    window.location.href = `https://api.notion.com/v1/oauth/authorize?response_type=code&client_id=40fc3257-b3fe-4337-ab8a-297c5a970609&owner=user&redirect_uri=${redirect_uri}&state=${uuid+'_'+platformId}`;
}