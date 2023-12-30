import { io } from 'socket.io-client';

// Establish a socket connection to the server
const SOCKET = io('ws://localhost:80');

SOCKET.on('connect', () => {

    // Collection details
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

    // Taskboard

    // Create taskboard
    const TASKBOARD = Vue.createApp({
        data() {
            return {
                tasks: [],
                states: ['todo', 'in-progress', 'review', 'done'],
            }
        },
        template: `
            <section v-for="state in states" :class="'state-' + state">
                <h2>{{ state.charAt(0).toUpperCase() + state.slice(1).replace('-', ' ')}}</h2>
                    <div :id="state + '-cards'" class="cards" v-if="hasTasks(state)">
                        <template v-for="task in tasks">
                            <div :value="state" class="card" id="card" v-if="task.status == state.replaceAll('-', ' ')">
                                <label class="checkbox-container">
                                    <input type="checkbox" :id="task.task_id" :name="task.task_id" />
                                    <span class="checkmark"></span>
                                </label>
                                <div>
                                    <p>{{ task.name }}</p>
                                    <p>{{ task.description }}</p>
                                    <p v-if="task.assigned_users">
                                    {{ 
                                        task.assigned_users.map(user => {
                                            return "@" + user.username;
                                        }) 
                                        .join(', ')
                                    }}
                                    </p>
                                    <div class="task-stats">
                                        <span>
                                            <svg width="15" height="14" viewBox="0 0 15 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M5.74359 0H8.61539C11.7875 0 14.359 2.57149 14.359 5.74359C14.359 8.9157 11.7875 11.4872 8.61539 11.4872V14C5.02564 12.5641 0 10.4103 0 5.74359C0 2.57149 2.57149 0 5.74359 0ZM7.17949 10.0513H8.61539C10.9945 10.0513 12.9231 8.12266 12.9231 5.74359C12.9231 3.36452 10.9945 1.4359 8.61539 1.4359H5.74359C3.36452 1.4359 1.4359 3.36452 1.4359 5.74359C1.4359 8.33538 3.20354 10.0266 7.17949 11.8317V10.0513Z" fill="#D9D9D9"/>
                                            </svg>
                                            <p>{{ task.feedbacks_count }}</p>
                                        </span>
                                        <span>
                                            <svg width="15" height="14" viewBox="0 0 15 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M0.358887 7.77778H1.92686C2.30426 10.4162 4.57335 12.4444 7.3162 12.4444C10.059 12.4444 12.328 10.4162 12.7055 7.77778H14.2734C13.8865 11.2778 10.9193 14 7.3162 14C3.71307 14 0.745785 11.2778 0.358887 7.77778ZM0.358887 6.22222C0.745785 2.72226 3.71307 0 7.3162 0C10.9193 0 13.8865 2.72226 14.2734 6.22222H12.7055C12.328 3.58377 10.059 1.55556 7.3162 1.55556C4.57335 1.55556 2.30426 3.58377 1.92686 6.22222H0.358887Z" fill="#D9D9D9"/>
                                            </svg>                                        
                                            <p>{{ Math.round(task.todos_progress) }}%</p>
                                        </span>                                    
                                    </div>
                                </div>
                            </div>
                        </template>
                    </div>
                <button :value="state" id="create-task-button">Add Task</button>
            </section>
        `,
        methods: {
            loadTasks(tasks) {
                this.tasks = tasks;
            },
            hasTasks(state) {
                return this.tasks.some((task) => {
                    return task.status == state;
                });
            }
        }
    }).mount('#taskboard');

    // Get tasks
    SOCKET.emit('get-tasks', (window.location.pathname.split('/')[1]));
    SOCKET.on('got-tasks', (tasks) => {
        TASKBOARD.loadTasks(tasks);
    });

    // Get platforms
    SOCKET.emit('get-platforms', (window.location.pathname.split('/')[1]));
    SOCKET.on('got-platforms', (platforms) => {
        const SELECT = document.querySelector('#platform-select');
        platforms.forEach((platform) => {
            SELECT.innerHTML += `<option value="${platform.platform_id}">${platform.platform.charAt(0).toUpperCase() + platform.platform.slice(1)}</option>`;
        });
    });

    // Create task
    const CREATETASK = document.querySelector('#create-task-container');
    const FORM = document.querySelector('#create-task-form');
    const CREATETASKBUTTONS = document.querySelectorAll('#create-task-button');

    function clearForm() {
        FORM.querySelector('input[name="status"]').value = "";
        FORM.querySelector('input[name="name"]').value = "";
        FORM.querySelector('textarea[name="description"]').value = "";
        FORM.querySelector('#platform-select').selectedIndex = 0;
    }

    CREATETASKBUTTONS.forEach((button) => {
        button.addEventListener('click', ($event) => {
            CREATETASK.classList.remove('hidden');
            FORM.querySelector('input[name="status"]').value = $event.target.value;
        });
    });

    CREATETASK.addEventListener('click', ($event) => {
        if ($event.target == CREATETASK) {
            CREATETASK.classList.add('hidden');
            
            clearForm();
        }
    });

    FORM.addEventListener('submit', ($event) => {
        $event.preventDefault();

        const DATA = {
            status: FORM.querySelector('input[name="status"]').value.replace('-', ' '),
            name: FORM.querySelector('input[name="name"]').value,
            description: FORM.querySelector('textarea[name="description"]').value,
            uuid: window.location.pathname.split('/')[1],
            platform: FORM.querySelector('#platform-select').value,
            createIssue: FORM.querySelector('#send-notification').checked
        };

        SOCKET.emit('create-task', DATA);

        CREATETASK.classList.add('hidden');
        
        clearForm();
    });

    SOCKET.on('created-tasks', (task) => {
        TASKBOARD.tasks.push(task);
    });

    // Disconnect from server
    SOCKET.on('disconnect', () => {
        console.log('Disconnected from server');
    });
});