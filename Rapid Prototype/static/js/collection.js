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

    SOCKET.emit('get-member', {userId: localStorage.getItem('userId'), uuid: window.location.pathname.split('/')[1]});

    SOCKET.on('got-member', (data) => {
        localStorage.setItem('username', data.username);
        localStorage.setItem('membershipId', data.membershipId);
    });

    // Join taskboard
    SOCKET.emit('join', {uuid: window.location.pathname.split('/')[1]});

    // Create task view
    const TASKVIEW = Vue.createApp({
        data() {
            return {
                task: {},
                todos: [],
                feedbacks: [],
                possiblePlatforms: ['GitHub', 'GitLab', 'Figma', 'Notion'],
                dateOptions: {
                    year: 'numeric',
                    month: 'numeric',
                    day: 'numeric'
                }
            }
        },
        template: `
            <input type="hidden" name="task_id" :value="task.task_id"/>
            <header>
                <h2>{{ task.name }}</h2>
                <h3>{{ task.description }}</h3>
                <template v-if="task.assigned_users">
                    <p>{{ 
                            task.assigned_users.map(user => {
                                return "@" + user.username;
                            }).join(', ') 
                    }}</p>
                </template>
                <template v-else>
                    <p><i>No users are assigned to this task.</i></p>
                </template>
                <template v-if="task.task_platforms">
                    <p>Connected with <span>{{ 
                        this.findConnectedPlatform(task.task_platforms[0].platform)
                    }}</span></p>
                </template>
            </header>
            <section class="task-subtasks">
                <h2>Subtasks</h2>
                <ul class="todos">
                    <template v-if="todos != null">
                        <template v-for="(todo, index) in todos">
                            <li>
                                <label class="checkbox-container">
                                    <input type="checkbox" :id="todo.todo_id" :name="todo.todo_id" :checked="todo.done" @change="updateTodo($event)" />
                                    <span class="checkmark"></span>
                                </label>
                                <p>{{ todo.description }}</p>
                            </li>
                        </template>
                    </template>
                    <li class="add-todo">
                        <label class="checkbox-container">
                            <span class="checkmark"></span>
                        </label>
                        <input type="text" placeholder="Enter a new task..." @keydown="addTodo($event)">
                    </li>
                </ul>
            </section>
            <section class="task-feedback">
                <h2>Feedback</h2>
                <form class="add-feedback" @submit="addFeedback($event)">
                    <textarea name="comment" placeholder="Add a new feedback..."></textarea>
                    <button>Add feedback</button>
                </form>
                <ul class="feedbacks">
                    <template v-if="feedbacks != null">
                        <template v-for="(feedback, index) in feedbacks">
                            <li>
                                <header>
                                    <p>@{{ feedback.username }}</p>
                                    <p>{{ new Date(feedback.timestamp).toLocaleString('de-DE', this.dateOptions) }}</p>
                                </header>
                                <p>{{ feedback.comment }}</p>
                                <ul class="interaction">
                                    <li>
                                        <svg width="18" height="17" viewBox="0 0 18 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M11.1105 6.28424H16.1399C17.008 6.28424 17.7116 6.9879 17.7116 7.85588V9.50958C17.7116 9.71483 17.6714 9.91813 17.5932 10.108L15.1616 16.0134C15.0403 16.3079 14.7533 16.5 14.4349 16.5H1.20917C0.775171 16.5 0.42334 16.1482 0.42334 15.7142V7.85588C0.42334 7.42189 0.775171 7.07007 1.20917 7.07007H3.9453C4.20064 7.07007 4.44005 6.94601 4.5873 6.73741L8.87274 0.666365C8.98472 0.507731 9.19579 0.454681 9.36946 0.541519L10.795 1.25429C11.6214 1.6675 12.0482 2.60074 11.8203 3.49613L11.1105 6.28424ZM5.13832 8.31755V14.9283H13.9086L16.1399 9.50958V7.85588H11.1105C10.0852 7.85588 9.33449 6.89008 9.58737 5.8965L10.2972 3.1084C10.3428 2.92931 10.2574 2.74266 10.0921 2.66003L9.5726 2.40025L5.8713 7.64376C5.67492 7.92196 5.42389 8.15001 5.13832 8.31755ZM3.56666 8.64171H1.995V14.9283H3.56666V8.64171Z" fill="#F5F5F5"/>
                                        </svg>
                                        <p>0</p>
                                    </li>
                                    <li>
                                        <svg width="18" height="17" viewBox="0 0 18 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M7.31252 10.7158H2.28308C1.41508 10.7158 0.711426 10.0121 0.711426 9.14411V7.49049C0.711426 7.28516 0.751644 7.08186 0.829803 6.89209L3.26145 0.986624C3.38269 0.692174 3.66965 0.5 3.98809 0.5H17.2138C17.6478 0.5 17.9997 0.851831 17.9997 1.28583V9.14411C17.9997 9.57813 17.6478 9.92994 17.2138 9.92994H14.4777C14.2223 9.92994 13.983 10.054 13.8357 10.2626L9.55027 16.3337C9.43829 16.4922 9.22721 16.5454 9.05354 16.4584L7.628 15.7457C6.80158 15.3325 6.37479 14.3993 6.60273 13.5039L7.31252 10.7158ZM13.2847 8.68244V2.07166H4.51436L2.28308 7.49049V9.14411H7.31252C8.33781 9.14411 9.08851 10.1099 8.83563 11.1035L8.12579 13.8916C8.08022 14.0707 8.16556 14.2573 8.3309 14.34L8.85041 14.5997L12.5517 9.35629C12.7481 9.07802 12.9991 8.84998 13.2847 8.68244ZM14.8563 8.35828H16.428V2.07166H14.8563V8.35828Z" fill="#F5F5F5"/>
                                        </svg>
                                        <p>0</p>
                                    </li>
                                    <li>
                                        <p>Reply</p>
                                    </li>
                                </ul>
                                <ul>
                                    <li v-for="(reply, index) in feedback.replies">
                                        <header>
                                            <p>Commented by @{{ reply.username }}</p>
                                            <p>{{ new Date(reply.timestamp).toLocaleString('de-DE', this.dateOptions) }}</p>
                                        </header>
                                        <p>{{ reply.comment }}</p>
                                    </li>
                                </ul>
                            </li>
                        </template>
                    </template>
                </ul>
            </section>
        `,
        methods: {
            async loadTask(task, todos, feedbacks) {
                this.task = await task;
                this.todos = await todos;
                this.feedbacks = await feedbacks;
            },

            async clearTaskView() {
                this.task = {};
                this.todos = [];
                this.feedbacks = [];
            },

            findConnectedPlatform(name) {
                for (const PLATFORM of this.possiblePlatforms) {
                    if (PLATFORM.toLowerCase() === name) {
                        return PLATFORM;
                    }
                }
                return '-';
            },

            addTodo($event) {
                const TODO = $event.target.value;

                if (TODO.length > 0 && $event.key == 'Enter') {
                    SOCKET.emit('save-todo', {
                        task_id: this.task.task_id,
                        description: TODO
                    });

                    $event.target.value = "";
                }
            },

            async newTodo(todo) {
                this.todos.push(todo);
            },

            async updateTodo($event) {
                const TODOID = $event.target.getAttribute('name');
                const STATUS = $event.target.checked;
                const TASKID = this.task.task_id;

                SOCKET.emit('update-todo', {
                    todo_id: TODOID,
                    status: STATUS,
                    task_id: TASKID
                });
            },

            async updatedTodos(todos) {
                this.todos = await todos;
            },            

            addFeedback($event) {
                $event.preventDefault();

                const COMMENT = $event.target.querySelector('textarea[name="comment"]').value;

                if (COMMENT != "") {
                    SOCKET.emit('save-feedback', {
                        username: localStorage.getItem('username'),
                        membership_id: localStorage.getItem('membershipId'),
                        task_id: this.task.task_id,
                        comment: COMMENT
                    });
                }

                $event.target.querySelector('textarea[name="comment"]').value = "";
            },

            async newFeedback(feedback) {
                this.feedbacks.push(feedback);
            }
        }
    }).mount('#task-view');

    // Create taskboard
    const TASKBOARD = Vue.createApp({
        data() {
            return {
                tasks: [],
                states: ['todo', 'running', 'review', 'done'],
            }
        },
        template: `
            <section 
                v-for="state in states" 
                :class="'state-' + state"
                @drop="handleDrop($event, state)" 
                @dragover.prevent="allowDrop"
            >
                <h2>{{ state.charAt(0).toUpperCase() + state.slice(1).replace('-', ' ')}}</h2>
                <div :id="state + '-cards'" class="cards">
                    <template v-if="hasTasks(state)">
                        <template v-for="(task, index) in tasks">
                            <div 
                                :value="state"
                                :draggable="true" 
                                class="card" 
                                id="card" 
                                v-if="task.status == state.replaceAll('-', ' ')" 
                                @click="openTask(index)" 
                                @dragstart="handleDragStart($event, task.task_id)"
                            >
                                <label class="checkbox-container">
                                    <input type="checkbox" :id="task.task_id" :name="task.task_id"/>
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
                    </template>
                </div>
                <button :value="state" id="create-task-button">Add Task</button>
            </section>
        `,
        methods: {
            async loadTasks(tasks) {
                this.tasks = await tasks;
            },

            hasTasks(state) {
                return this.tasks.some((task) => {
                    return task.status == state.replaceAll('-', ' ');
                });
            },

            async openTask(index) {

                // Make task view visible
                const TASKCONTAINER = document.querySelector('.view-task-container');
                TASKCONTAINER.classList.toggle('hidden');

                // Load task view variables
                const SELECTEDTASK = this.tasks[index];
                const TODOS = fetch(`/api/tasks/${SELECTEDTASK.task_id}/todos`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then((response) => {
                    return response.json();
                });
                const FEEDBACKS = fetch(`/api/tasks/${SELECTEDTASK.task_id}/feedbacks`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then((response) => {
                    return response.json();
                });

                // Pass variables to task view
                TASKVIEW.loadTask(SELECTEDTASK, await TODOS, await FEEDBACKS);

                // Load task view exit interaction
                document.addEventListener('keydown', ($event) => {
                    if($event.key == 'Escape') {
                        TASKCONTAINER.classList.add('hidden');
                        TASKVIEW.clearTaskView();
                    }
                });

                TASKCONTAINER.addEventListener('click', ($event) => {
                    if($event.target == TASKCONTAINER) {
                        TASKCONTAINER.classList.add('hidden');
                        TASKVIEW.clearTaskView();
                    }
                });
            },

            handleDragStart($event, id) {
                $event.dataTransfer.setData('text/plain', id.toString());
            },

            handleDrop($event, targetState) {
                $event.preventDefault();
            
                const TASKID = parseInt($event.dataTransfer.getData('text/plain'), 10);
                const DRAGGEDTASK = this.tasks.find((task) => {
                    return task.task_id == taskID;
                });
            
                DRAGGEDTASK.status = targetState;

                SOCKET.emit('update-task-status', {
                    task_id: TASKID,
                    status: DRAGGEDTASK.status
                });
            },

            allowDrop(event) {
                event.preventDefault();
            },

            async newFeedback(feedback) {
                const AFFECTEDTASK = this.tasks.find((task) => {
                    return task.task_id == feedback.task_id;
                });

                AFFECTEDTASK.feedbacks_count = Number(AFFECTEDTASK.feedbacks_count) + 1;
            },

            updateTodosProgress(taskID, percentage) {
                const AFFECTEDTASK = this.tasks.find((task) => {
                    return task.task_id == taskID;
                });

                AFFECTEDTASK.todos_progress = percentage;
            }
        }
    }).mount('#taskboard');

    // Get tasks
    SOCKET.emit('get-tasks', (window.location.pathname.split('/')[1]));
    SOCKET.on('got-tasks', (tasks) => {
        TASKBOARD.loadTasks(tasks);
    });

    // Update task status
    SOCKET.on('updated-task-status', (data) => {
        TASKBOARD.tasks.forEach((task) => {
            if(task.task_id == data.task_id) {
                task.status = data.status;
            }
        });
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
        task.todos_progress = 0;
        TASKBOARD.tasks.push(task);
    });


    // Feedback
    SOCKET.on('saved-feedback', (feedback) => {
        TASKBOARD.newFeedback(feedback);
        TASKVIEW.newFeedback(feedback);
    });


    // Todos
    SOCKET.on('saved-todo', (todo) => {
        TASKVIEW.newTodo(todo);
    });

    SOCKET.on('updated-todo', (data) => {
        const TASKID = data.rows[0].task_id;
        const TODOSDONE = data.rows.filter((todo) => {
            return todo.done == true;
        }).length / data.todo_count * 100;

        TASKVIEW.updatedTodos(data.rows);
        TASKBOARD.updateTodosProgress(TASKID, TODOSDONE);
    });


    // Disconnect from server
    SOCKET.on('disconnect', () => {
        SOCKET.emit('leave', window.location.pathname.split('/')[1]);
        console.log('Disconnected from server');
    });
})