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
        localStorage.setItem('username', data.username)
        localStorage.setItem('membershipId', data.membershipId);
    });

    // Taskboard
    SOCKET.emit('join', {uuid: window.location.pathname.split('/')[1]});

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
                const TASKCONTAINER = document.querySelector('.view-task-container');
                const ADDFEEDBACKBTN = document.querySelector('.add-feedback-btn');
                const ERRORPARAGRAPHFEEDBACK = document.querySelector('.task-feedback p');
                TASKCONTAINER.classList.toggle('hidden');

                document.addEventListener('keydown', ($event) => {
                    if ($event.key == 'Escape') {
                        TASKCONTAINER.classList.add('hidden');
                        clearTaskView();
                    }
                });

                TASKCONTAINER.addEventListener('click', ($event) => {
                    if ($event.target == TASKCONTAINER) {
                        TASKCONTAINER.classList.add('hidden');
                        clearTaskView();
                    }
                });

                ADDFEEDBACKBTN.addEventListener('click', ($event) => {
                    $event.preventDefault();
                    var feedbackinput = document.querySelector('.task-feedback textarea').value;
                    ERRORPARAGRAPHFEEDBACK.classList.add('hidden');
                    if(feedbackinput != "") {
                        SOCKET.emit('save-feedback', {
                            username: localStorage.getItem('username'),
                            membership_id: localStorage.getItem('membershipId'),
                            task_id: this.tasks[index].task_id,
                            comment: feedbackinput
                        });
                    } else {
                        ERRORPARAGRAPHFEEDBACK.classList.remove('hidden');
                    }
                });
                const TODOS = fetch(`/api/tasks/${this.tasks[index].task_id}/todos`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then((response) => {
                    return response.json();
                });

                const FEEDBACKS = fetch(`/api/tasks/${this.tasks[index].task_id}/feedbacks`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then((response) => {
                    return response.json();
                });

                genTaskView(this.tasks[index], await TODOS, await FEEDBACKS);
            },

            handleDragStart($event, id) {
                $event.dataTransfer.setData('text/plain', id.toString());
            },

            handleDrop($event, targetState) {
                $event.preventDefault();
            
                const taskID = parseInt($event.dataTransfer.getData('text/plain'), 10);
                const draggedTask = this.tasks.find((task) => {
                    return task.task_id == taskID;
                });
            
                draggedTask.status = targetState;

                SOCKET.emit('update-task-status', {
                    task_id: taskID,
                    status: draggedTask.status
                });
            },

            allowDrop(event) {
                event.preventDefault();
            },
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

    SOCKET.on('saved-feedback', (feedback) => {
        const TASKS = document.querySelectorAll('.card');
        TASKS.forEach((task) => {
            if(task.querySelector('input[type="checkbox"]').getAttribute('id') == feedback.task_id) {
                task.querySelectorAll('.task-stats')[0].children[0].children[1].innerHTML = Number(task.querySelectorAll('.task-stats')[0].children[0].children[1].innerHTML) + 1;
            }
        });
    });

    SOCKET.on('saved-feedback', (feedback) => {
        const DATE = new Date();
        const DATEOPTIONS = {
            year: DATE.getFullYear(),
            month: DATE.getMonth() + 1,
            day: DATE.getDate(),
        };
        const FEEDBACK = document.createElement('div');
        FEEDBACK.classList.add('feedback');
        FEEDBACK.innerHTML =`
            <div>
                <div class="feedback-info">
                    <p>@${feedback.username}</p>
                    <p>${DATEOPTIONS.day + '.' + DATEOPTIONS.month + '.' + DATEOPTIONS.year}</p>
                </div>
                <div class="feedback-thumbs">
                    <button id="reply-btn" value="${feedback.feedback_id}">reply</button>
                    <svg width="18" height="17" viewBox="0 0 18 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.1105 6.28424H16.1399C17.008 6.28424 17.7116 6.9879 17.7116 7.85588V9.50958C17.7116 9.71483 17.6714 9.91813 17.5932 10.108L15.1616 16.0134C15.0403 16.3079 14.7533 16.5 14.4349 16.5H1.20917C0.775171 16.5 0.42334 16.1482 0.42334 15.7142V7.85588C0.42334 7.42189 0.775171 7.07007 1.20917 7.07007H3.9453C4.20064 7.07007 4.44005 6.94601 4.5873 6.73741L8.87274 0.666365C8.98472 0.507731 9.19579 0.454681 9.36946 0.541519L10.795 1.25429C11.6214 1.6675 12.0482 2.60074 11.8203 3.49613L11.1105 6.28424ZM5.13832 8.31755V14.9283H13.9086L16.1399 9.50958V7.85588H11.1105C10.0852 7.85588 9.33449 6.89008 9.58737 5.8965L10.2972 3.1084C10.3428 2.92931 10.2574 2.74266 10.0921 2.66003L9.5726 2.40025L5.8713 7.64376C5.67492 7.92196 5.42389 8.15001 5.13832 8.31755ZM3.56666 8.64171H1.995V14.9283H3.56666V8.64171Z" fill="#F5F5F5"/>
                    </svg>
                    <svg width="18" height="17" viewBox="0 0 18 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7.31252 10.7158H2.28308C1.41508 10.7158 0.711426 10.0121 0.711426 9.14411V7.49049C0.711426 7.28516 0.751644 7.08186 0.829803 6.89209L3.26145 0.986624C3.38269 0.692174 3.66965 0.5 3.98809 0.5H17.2138C17.6478 0.5 17.9997 0.851831 17.9997 1.28583V9.14411C17.9997 9.57813 17.6478 9.92994 17.2138 9.92994H14.4777C14.2223 9.92994 13.983 10.054 13.8357 10.2626L9.55027 16.3337C9.43829 16.4922 9.22721 16.5454 9.05354 16.4584L7.628 15.7457C6.80158 15.3325 6.37479 14.3993 6.60273 13.5039L7.31252 10.7158ZM13.2847 8.68244V2.07166H4.51436L2.28308 7.49049V9.14411H7.31252C8.33781 9.14411 9.08851 10.1099 8.83563 11.1035L8.12579 13.8916C8.08022 14.0707 8.16556 14.2573 8.3309 14.34L8.85041 14.5997L12.5517 9.35629C12.7481 9.07802 12.9991 8.84998 13.2847 8.68244ZM14.8563 8.35828H16.428V2.07166H14.8563V8.35828Z" fill="#F5F5F5"/>
                    </svg>
                </div>
            </div>
            <p>${feedback.comment}</p>
        `;
        const FEEDBACKSECTION = document.querySelector('.task-feedback .feedbacks');
        FEEDBACKSECTION.appendChild(FEEDBACK);
    });

    //view task
    const TASKVIEW = document.querySelector('.view-task-container');
    function genTaskView(task, todos, feedbacks) {


        //WRITE API CALL FOR FEEDBACKS
        //ALSO GET USER THAT WROTE THE FEEDBACK
        //ITERATE OVER TASKS PUSH EACH FEEDBACK
        
        const ADDTODOBTN = document.querySelector('.add-todo-btn');
        const ERRORPARAGRAPH = document.querySelector('.task-subtasks p');
        const ADDTODOINPUT = document.querySelector('.add-todo input');

        ADDTODOBTN.addEventListener('click', ($event) => {
            $event.preventDefault();
            ERRORPARAGRAPH.classList.add('hidden');
            if(ADDTODOINPUT.value != "") {
                SOCKET.emit('save-todo', {
                    task_id: task.task_id,
                    description: ADDTODOINPUT.value
                });
    
                const TODO = document.createElement('div');
                TODO.classList.add('todo');
    
                const LABEL = document.createElement('label');
                LABEL.classList.add('checkbox-container');
    
                const INPUT = document.createElement('input');
                INPUT.setAttribute('type', 'checkbox');
                INPUT.setAttribute('id', task.task_id);
                INPUT.setAttribute('name', task.task_id);
    
                const SPAN = document.createElement('span');
                SPAN.classList.add('checkmark');
    
                const P = document.createElement('p');
                P.innerHTML = ADDTODOINPUT.value;
    
                LABEL.appendChild(INPUT);
                LABEL.appendChild(SPAN);
                TODO.appendChild(LABEL);
                TODO.appendChild(P);
                TASKVIEW.querySelector('.todos').appendChild(TODO);
    
                ADDTODOINPUT.value = "";
            } else {
                ERRORPARAGRAPH.classList.remove('hidden');
            }
        });

        TASKVIEW.querySelector('h2').textContent = task.name;
        TASKVIEW.querySelector('p').textContent = task.description;
        if(task.assigned_users != null) {
            TASKVIEW.querySelector('.task-intro p').innerHTML = task.assigned_users.map((user) => {
                return `@${user.username}`;
            }).join(', ');
        } else {
            TASKVIEW.querySelector('.task-intro p').innerHTML = "<i>No users assigned to this task.</i>";
        }

        function updateTodo(todoId, status) {
            SOCKET.emit('update-todo', {
                todo_id: todoId,
                status: status,
                task_id: task.task_id
            });
        }

        SOCKET.on('updated-todo', (data) => {
            const TODOS = document.querySelectorAll('.todo');
            const TASKS = document.querySelectorAll('.card');
            var checkedCount = 0;
            for(const TODO of TODOS) {
                if(TODO.querySelector('input[type="checkbox"]').getAttribute('todo_id') == data.todo_id) {
                    TODO.querySelector('input[type="checkbox"]').checked = data.status;
                }
                if(TODO.querySelector('input[type="checkbox"]').checked) {
                    checkedCount++;
                }
            }
            TASKS.forEach((task) => {
                if(task.querySelector('input[type="checkbox"]').getAttribute('id') == data.task_id) {
                    task.querySelectorAll('.task-stats')[0].children[1].children[1].innerHTML = `${Math.round((checkedCount / data.todo_count) * 100)}%`;
                }
            });
        });

        TASKVIEW.querySelector('.task-info p').innerHTML = `${task.description}`;
        if (todos != null) {
            const todosContainer = TASKVIEW.querySelector('.todos');
            todosContainer.innerHTML = todos.map((todo) => {
                return `
                    <div class="todo">
                        <label class="checkbox-container">
                            <input type="checkbox" task_id="${task.task_id}" todo_id="${todo.todo_id}" :name="${todo.description}" ${(todo.done)?'checked':''}/>
                            <span class="checkmark"></span>
                        </label>
                        <p>${todo.description}</p>
                    </div>
                `;
            }).join('');

            // Attach a single event listener to the todosContainer for the click event
            todosContainer.addEventListener('click', function(event) {
                const target = event.target;
                if (target.classList.contains('checkmark')) {
                    const todoId = target.parentElement.querySelector('input[type="checkbox"]').getAttribute('todo_id');
                    updateTodo(todoId, !target.previousElementSibling.checked);
                }
            });
        }

        if (feedbacks !== null) {
            feedbacks = feedbacks.sort((a, b) => {
                const timestampA = new Date(a.timestamp);
                const timestampB = new Date(b.timestamp);
        
                return timestampA - timestampB;
            });
        
            const feedbacksHTML = feedbacks.map((feedback) => {
                const DATE = new Date(feedback.timestamp);
                const DATEOPTIONS = {
                    year: DATE.getFullYear(),
                    month: DATE.getMonth() + 1,
                    day: DATE.getDate(),
                };
        
                feedback.replies = feedback.replies ? feedback.replies.sort((a, b) => {
                    const timestampA = new Date(a.timestamp);
                    const timestampB = new Date(b.timestamp);
            
                    return timestampA - timestampB;
                }) : null;

                const repliesHTML = feedback.replies ? feedback.replies.map((reply) => {
                    const replyDate = new Date(reply.timestamp);
                    const replyDateOptions = {
                        year: replyDate.getFullYear(),
                        month: replyDate.getMonth() + 1,
                        day: replyDate.getDate(),
                    };
        
                    return `
                        <div class="reply">
                            <div class="reply-feedback-info">
                                <p>To: @${feedback.username}</p>
                                <p>From: @${reply.username}</p>
                                <p>${replyDateOptions.day + '.' + replyDateOptions.month + '.' + replyDateOptions.year}</p>
                            </div>
                            <div class="reply-feedback-content">
                                <p>${reply.comment}</p>
                            </div>
                        </div>
                    `;
                }).join('') : '';
        
                return `
                    <div class="feedback" value="${feedback.feedback_id}">
                        <div>
                            <div class="feedback-info">
                                <p>@${feedback.username}</p>
                                <p>${DATEOPTIONS.day + '.' + DATEOPTIONS.month + '.' + DATEOPTIONS.year}</p>
                            </div>
                            <div class="feedback-thumbs">
                                <button id="reply-btn" value="${feedback.feedback_id}">reply</button>
                                <svg width="18" height="17" viewBox="0 0 18 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M11.1105 6.28424H16.1399C17.008 6.28424 17.7116 6.9879 17.7116 7.85588V9.50958C17.7116 9.71483 17.6714 9.91813 17.5932 10.108L15.1616 16.0134C15.0403 16.3079 14.7533 16.5 14.4349 16.5H1.20917C0.775171 16.5 0.42334 16.1482 0.42334 15.7142V7.85588C0.42334 7.42189 0.775171 7.07007 1.20917 7.07007H3.9453C4.20064 7.07007 4.44005 6.94601 4.5873 6.73741L8.87274 0.666365C8.98472 0.507731 9.19579 0.454681 9.36946 0.541519L10.795 1.25429C11.6214 1.6675 12.0482 2.60074 11.8203 3.49613L11.1105 6.28424ZM5.13832 8.31755V14.9283H13.9086L16.1399 9.50958V7.85588H11.1105C10.0852 7.85588 9.33449 6.89008 9.58737 5.8965L10.2972 3.1084C10.3428 2.92931 10.2574 2.74266 10.0921 2.66003L9.5726 2.40025L5.8713 7.64376C5.67492 7.92196 5.42389 8.15001 5.13832 8.31755ZM3.56666 8.64171H1.995V14.9283H3.56666V8.64171Z" fill="#F5F5F5"/>
                                </svg>
                                <svg width="18" height="17" viewBox="0 0 18 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M7.31252 10.7158H2.28308C1.41508 10.7158 0.711426 10.0121 0.711426 9.14411V7.49049C0.711426 7.28516 0.751644 7.08186 0.829803 6.89209L3.26145 0.986624C3.38269 0.692174 3.66965 0.5 3.98809 0.5H17.2138C17.6478 0.5 17.9997 0.851831 17.9997 1.28583V9.14411C17.9997 9.57813 17.6478 9.92994 17.2138 9.92994H14.4777C14.2223 9.92994 13.983 10.054 13.8357 10.2626L9.55027 16.3337C9.43829 16.4922 9.22721 16.5454 9.05354 16.4584L7.628 15.7457C6.80158 15.3325 6.37479 14.3993 6.60273 13.5039L7.31252 10.7158ZM13.2847 8.68244V2.07166H4.51436L2.28308 7.49049V9.14411H7.31252C8.33781 9.14411 9.08851 10.1099 8.83563 11.1035L8.12579 13.8916C8.08022 14.0707 8.16556 14.2573 8.3309 14.34L8.85041 14.5997L12.5517 9.35629C12.7481 9.07802 12.9991 8.84998 13.2847 8.68244ZM14.8563 8.35828H16.428V2.07166H14.8563V8.35828Z" fill="#F5F5F5"/>
                                </svg>
                            </div>
                        </div>
                        <p>${feedback.comment}</p>
                        <div class="replies">
                            ${repliesHTML}
                        </div>
                    </div>
                `;
            }).join('');
        
            TASKVIEW.querySelector('.feedbacks').innerHTML = feedbacksHTML;
            const FEEDBACKS = document.querySelectorAll('.feedback');
            
            FEEDBACKS.forEach((feedback) => {
                const REPLYBTN = feedback.querySelector('#reply-btn');
                const TASKCONTAINER = document.querySelector('.view-task-container');
                REPLYBTN.addEventListener('click', ($event) => {
                    $event.preventDefault();
                    TASKCONTAINER.classList.toggle('hidden');
                    const FEEDBACKSECTION = document.querySelector('.feedback-reply-container');
                    FEEDBACKSECTION.classList.toggle('hidden');
        
                    document.addEventListener('keydown', ($event) => {
                        if ($event.key == 'Escape') {
                            TASKCONTAINER.classList.add('hidden');
                            FEEDBACKSECTION.classList.add('hidden');
                        }
                    });
        
                    TASKCONTAINER.addEventListener('click', ($event) => {
                        if ($event.target == TASKCONTAINER) {
                            TASKCONTAINER.classList.add('hidden');
                            FEEDBACKSECTION.classList.add('hidden');
                        }
                    });
        
                    const FEEDBACKID = $event.srcElement.value;
                    const SENDREPLYFORM = document.querySelector('.feedback-reply-container #feedback-reply-form');
                    const ERRORREPLYFEEDBACKERROR = document.querySelector('.feedback-reply-container #error-reply');
                    SENDREPLYFORM.addEventListener('submit', ($event) => {
                        ERRORREPLYFEEDBACKERROR.classList.add('hidden');
                        $event.preventDefault();
                        const REPLYINPUT = document.querySelector('.feedback-reply-container textarea').value;
                        if(REPLYINPUT.length != 0) {
                            SOCKET.emit('save-reply-feedback', {
                                username: localStorage.getItem('username'),
                                feedback_id: FEEDBACKID,
                                task_id: task.task_id,
                                comment: REPLYINPUT
                            });
                            TASKCONTAINER.classList.remove('hidden');
                            FEEDBACKSECTION.classList.add('hidden');
                            document.querySelector('.feedback-reply-container textarea').value = "";
                        } else {
                            ERRORREPLYFEEDBACKERROR.classList.remove('hidden');
                        }
                        
                    });
                });
            });
        }

        SOCKET.on('saved-reply-feedback', (reply) => {
            const FEEDBACKS = document.querySelectorAll('.feedback');
            const DATE = new Date(reply.timestamp);
            const DATEOPTIONS = {
                year: DATE.getFullYear(),
                month: DATE.getMonth() + 1,
                day: DATE.getDate(),
            };
            FEEDBACKS.forEach((feedback) => {
                if(feedback.getAttribute('value') == reply.feedback_id) {
                    const REPLY = document.createElement('div');
                    REPLY.classList.add('reply');
                    REPLY.innerHTML = `
                        <div class="reply-feedback-info">
                            <p>To: ${feedback.querySelector('.feedback-info p').innerHTML}</p>
                            <p>From: @${reply.username}</p>
                            <p>${DATEOPTIONS.day + '.' + DATEOPTIONS.month + '.' + DATEOPTIONS.year}</p>
                        </div>
                        <div class="reply-feedback-content">
                            <p>${reply.comment}</p>
                        </div>
                    `;
                    feedback.querySelector('.replies').appendChild(REPLY);
                }
            });
        })
        
        if(task.task_platforms != null) {
            const TASKPLATFORM = task.task_platforms[0];
            const TASKINFOLINK = TASKVIEW.querySelector('.task-info a');
            switch(TASKPLATFORM.platform) {
                case 'github':
                    var SVG = `
                        <svg width="13" height="15" viewBox="0 0 13 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2.1719 12.023C1.95795 11.8798 1.77382 11.6979 1.55844 11.4407C1.48058 11.3477 1.1654 10.9525 1.22622 11.028C0.896153 10.618 0.687625 10.428 0.472656 10.3509C0.101874 10.218 -0.0909125 9.80957 0.0420627 9.43876C0.175038 9.06802 0.583414 8.87524 0.954203 9.00818C1.49101 9.20068 1.85413 9.53227 2.34325 10.1408C2.2762 10.0574 2.58531 10.4451 2.65212 10.5249C2.78801 10.6872 2.88749 10.7855 2.96521 10.8375C3.11135 10.9353 3.38475 10.9774 3.786 10.9373C3.80281 10.6647 3.85324 10.4003 3.93015 10.1561C1.81311 9.63868 0.615017 8.2727 0.615017 5.5942C0.615017 4.71059 0.878372 3.91397 1.36963 3.2463C1.21438 2.60875 1.23779 1.83768 1.58484 0.970048C1.66443 0.771085 1.82926 0.618446 2.03375 0.554355C2.09231 0.537387 2.12475 0.529834 2.18243 0.520975C2.75508 0.433041 3.56393 0.64246 4.61863 1.30313C5.23666 1.15723 5.88392 1.0832 6.53488 1.0832C7.18514 1.0832 7.83183 1.15709 8.44934 1.30271C9.50243 0.637432 10.3132 0.428091 10.8899 0.520825C10.9503 0.530532 11.0021 0.543157 11.0452 0.5573C11.2456 0.623103 11.4066 0.774223 11.4849 0.970048C11.8319 1.83749 11.8553 2.6084 11.7002 3.24586C12.193 3.91358 12.4547 4.70435 12.4547 5.5942C12.4547 8.27391 11.2606 9.63476 9.14361 10.1534C9.23269 10.4493 9.27969 10.78 9.27969 11.1377C9.27969 11.6116 9.27791 12.0642 9.27456 12.5716C9.2737 12.7072 9.27263 12.8522 9.27106 13.0749C9.53881 13.134 9.75991 13.3456 9.81711 13.6317C9.89436 14.018 9.64387 14.3937 9.25758 14.471C8.44507 14.6335 7.84303 14.0917 7.84303 13.3837C7.84303 13.3193 7.84352 13.2272 7.84459 13.0651C7.84623 12.8419 7.84723 12.6975 7.84816 12.5623C7.85144 12.0577 7.85322 11.6081 7.85322 11.1377C7.85322 10.6403 7.72256 10.3162 7.54946 10.167C7.07801 9.76057 7.31694 8.9875 7.93553 8.91796C10.0513 8.68024 11.0283 7.8608 11.0283 5.5942C11.0283 4.91332 10.8058 4.35032 10.377 3.87949C10.193 3.67747 10.1406 3.38807 10.2421 3.13436C10.3603 2.83892 10.4107 2.45178 10.31 1.98332L10.3033 1.98521C9.95241 2.08448 9.51135 2.29912 8.97764 2.66195C8.80354 2.78025 8.58614 2.81565 8.38358 2.75867C7.79852 2.59414 7.16973 2.50967 6.53488 2.50967C5.89996 2.50967 5.27118 2.59414 4.68615 2.75867C4.48464 2.81535 4.2684 2.78064 4.09475 2.66374C3.55799 2.30239 3.1145 2.088 2.76159 1.98812C2.65928 2.45401 2.70977 2.83977 2.82761 3.13436C2.9291 3.38807 2.8767 3.67747 2.69272 3.87949C2.26686 4.3471 2.04148 4.91951 2.04148 5.5942C2.04148 7.85652 3.01939 8.68152 5.12397 8.91796C5.74113 8.98736 5.98099 9.75751 5.51232 10.165C5.37509 10.2843 5.20627 10.687 5.20627 11.1377V13.3837C5.20627 14.0872 4.61084 14.6146 3.80861 14.4742C3.42059 14.4063 3.1611 14.0367 3.229 13.6487C3.28045 13.3546 3.50515 13.1345 3.77981 13.0745V12.3688C3.13068 12.4124 2.59453 12.3058 2.1719 12.023Z" fill="#6A40BF"/>
                        </svg>
                    `;
                    TASKINFOLINK.innerHTML = "Github " + SVG;
                    TASKINFOLINK.href = `https://www.github.com/${TASKPLATFORM.username}/${TASKPLATFORM.target_document}`;
                    break;
                case 'gitlab':
                    var SVG = `
                        <svg width="13" height="15" viewBox="0 0 13 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2.1719 12.023C1.95795 11.8798 1.77382 11.6979 1.55844 11.4407C1.48058 11.3477 1.1654 10.9525 1.22622 11.028C0.896153 10.618 0.687625 10.428 0.472656 10.3509C0.101874 10.218 -0.0909125 9.80957 0.0420627 9.43876C0.175038 9.06802 0.583414 8.87524 0.954203 9.00818C1.49101 9.20068 1.85413 9.53227 2.34325 10.1408C2.2762 10.0574 2.58531 10.4451 2.65212 10.5249C2.78801 10.6872 2.88749 10.7855 2.96521 10.8375C3.11135 10.9353 3.38475 10.9774 3.786 10.9373C3.80281 10.6647 3.85324 10.4003 3.93015 10.1561C1.81311 9.63868 0.615017 8.2727 0.615017 5.5942C0.615017 4.71059 0.878372 3.91397 1.36963 3.2463C1.21438 2.60875 1.23779 1.83768 1.58484 0.970048C1.66443 0.771085 1.82926 0.618446 2.03375 0.554355C2.09231 0.537387 2.12475 0.529834 2.18243 0.520975C2.75508 0.433041 3.56393 0.64246 4.61863 1.30313C5.23666 1.15723 5.88392 1.0832 6.53488 1.0832C7.18514 1.0832 7.83183 1.15709 8.44934 1.30271C9.50243 0.637432 10.3132 0.428091 10.8899 0.520825C10.9503 0.530532 11.0021 0.543157 11.0452 0.5573C11.2456 0.623103 11.4066 0.774223 11.4849 0.970048C11.8319 1.83749 11.8553 2.6084 11.7002 3.24586C12.193 3.91358 12.4547 4.70435 12.4547 5.5942C12.4547 8.27391 11.2606 9.63476 9.14361 10.1534C9.23269 10.4493 9.27969 10.78 9.27969 11.1377C9.27969 11.6116 9.27791 12.0642 9.27456 12.5716C9.2737 12.7072 9.27263 12.8522 9.27106 13.0749C9.53881 13.134 9.75991 13.3456 9.81711 13.6317C9.89436 14.018 9.64387 14.3937 9.25758 14.471C8.44507 14.6335 7.84303 14.0917 7.84303 13.3837C7.84303 13.3193 7.84352 13.2272 7.84459 13.0651C7.84623 12.8419 7.84723 12.6975 7.84816 12.5623C7.85144 12.0577 7.85322 11.6081 7.85322 11.1377C7.85322 10.6403 7.72256 10.3162 7.54946 10.167C7.07801 9.76057 7.31694 8.9875 7.93553 8.91796C10.0513 8.68024 11.0283 7.8608 11.0283 5.5942C11.0283 4.91332 10.8058 4.35032 10.377 3.87949C10.193 3.67747 10.1406 3.38807 10.2421 3.13436C10.3603 2.83892 10.4107 2.45178 10.31 1.98332L10.3033 1.98521C9.95241 2.08448 9.51135 2.29912 8.97764 2.66195C8.80354 2.78025 8.58614 2.81565 8.38358 2.75867C7.79852 2.59414 7.16973 2.50967 6.53488 2.50967C5.89996 2.50967 5.27118 2.59414 4.68615 2.75867C4.48464 2.81535 4.2684 2.78064 4.09475 2.66374C3.55799 2.30239 3.1145 2.088 2.76159 1.98812C2.65928 2.45401 2.70977 2.83977 2.82761 3.13436C2.9291 3.38807 2.8767 3.67747 2.69272 3.87949C2.26686 4.3471 2.04148 4.91951 2.04148 5.5942C2.04148 7.85652 3.01939 8.68152 5.12397 8.91796C5.74113 8.98736 5.98099 9.75751 5.51232 10.165C5.37509 10.2843 5.20627 10.687 5.20627 11.1377V13.3837C5.20627 14.0872 4.61084 14.6146 3.80861 14.4742C3.42059 14.4063 3.1611 14.0367 3.229 13.6487C3.28045 13.3546 3.50515 13.1345 3.77981 13.0745V12.3688C3.13068 12.4124 2.59453 12.3058 2.1719 12.023Z" fill="#6A40BF"/>
                        </svg>
                    `;
                    TASKINFOLINK.innerHTML = "Gitlab " + SVG;
                    TASKINFOLINK.href = `https://www.gitlab.com/${TASKPLATFORM.username}/${TASKPLATFORM.target_document}`;
                    break;
                case 'dribbble':
                    var SVG = `
                        <svg width="13" height="15" viewBox="0 0 13 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2.1719 12.023C1.95795 11.8798 1.77382 11.6979 1.55844 11.4407C1.48058 11.3477 1.1654 10.9525 1.22622 11.028C0.896153 10.618 0.687625 10.428 0.472656 10.3509C0.101874 10.218 -0.0909125 9.80957 0.0420627 9.43876C0.175038 9.06802 0.583414 8.87524 0.954203 9.00818C1.49101 9.20068 1.85413 9.53227 2.34325 10.1408C2.2762 10.0574 2.58531 10.4451 2.65212 10.5249C2.78801 10.6872 2.88749 10.7855 2.96521 10.8375C3.11135 10.9353 3.38475 10.9774 3.786 10.9373C3.80281 10.6647 3.85324 10.4003 3.93015 10.1561C1.81311 9.63868 0.615017 8.2727 0.615017 5.5942C0.615017 4.71059 0.878372 3.91397 1.36963 3.2463C1.21438 2.60875 1.23779 1.83768 1.58484 0.970048C1.66443 0.771085 1.82926 0.618446 2.03375 0.554355C2.09231 0.537387 2.12475 0.529834 2.18243 0.520975C2.75508 0.433041 3.56393 0.64246 4.61863 1.30313C5.23666 1.15723 5.88392 1.0832 6.53488 1.0832C7.18514 1.0832 7.83183 1.15709 8.44934 1.30271C9.50243 0.637432 10.3132 0.428091 10.8899 0.520825C10.9503 0.530532 11.0021 0.543157 11.0452 0.5573C11.2456 0.623103 11.4066 0.774223 11.4849 0.970048C11.8319 1.83749 11.8553 2.6084 11.7002 3.24586C12.193 3.91358 12.4547 4.70435 12.4547 5.5942C12.4547 8.27391 11.2606 9.63476 9.14361 10.1534C9.23269 10.4493 9.27969 10.78 9.27969 11.1377C9.27969 11.6116 9.27791 12.0642 9.27456 12.5716C9.2737 12.7072 9.27263 12.8522 9.27106 13.0749C9.53881 13.134 9.75991 13.3456 9.81711 13.6317C9.89436 14.018 9.64387 14.3937 9.25758 14.471C8.44507 14.6335 7.84303 14.0917 7.84303 13.3837C7.84303 13.3193 7.84352 13.2272 7.84459 13.0651C7.84623 12.8419 7.84723 12.6975 7.84816 12.5623C7.85144 12.0577 7.85322 11.6081 7.85322 11.1377C7.85322 10.6403 7.72256 10.3162 7.54946 10.167C7.07801 9.76057 7.31694 8.9875 7.93553 8.91796C10.0513 8.68024 11.0283 7.8608 11.0283 5.5942C11.0283 4.91332 10.8058 4.35032 10.377 3.87949C10.193 3.67747 10.1406 3.38807 10.2421 3.13436C10.3603 2.83892 10.4107 2.45178 10.31 1.98332L10.3033 1.98521C9.95241 2.08448 9.51135 2.29912 8.97764 2.66195C8.80354 2.78025 8.58614 2.81565 8.38358 2.75867C7.79852 2.59414 7.16973 2.50967 6.53488 2.50967C5.89996 2.50967 5.27118 2.59414 4.68615 2.75867C4.48464 2.81535 4.2684 2.78064 4.09475 2.66374C3.55799 2.30239 3.1145 2.088 2.76159 1.98812C2.65928 2.45401 2.70977 2.83977 2.82761 3.13436C2.9291 3.38807 2.8767 3.67747 2.69272 3.87949C2.26686 4.3471 2.04148 4.91951 2.04148 5.5942C2.04148 7.85652 3.01939 8.68152 5.12397 8.91796C5.74113 8.98736 5.98099 9.75751 5.51232 10.165C5.37509 10.2843 5.20627 10.687 5.20627 11.1377V13.3837C5.20627 14.0872 4.61084 14.6146 3.80861 14.4742C3.42059 14.4063 3.1611 14.0367 3.229 13.6487C3.28045 13.3546 3.50515 13.1345 3.77981 13.0745V12.3688C3.13068 12.4124 2.59453 12.3058 2.1719 12.023Z" fill="#6A40BF"/>
                        </svg>
                    `;
                    TASKINFOLINK.innerHTML = "Dribbble " + SVG;
                    TASKINFOLINK.href = `https://www.dribbble.com/${TASKPLATFORM.username}/${TASKPLATFORM.target_document}`;
                    break;
                case 'figma':
                    var SVG = `
                        <svg width="13" height="15" viewBox="0 0 13 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2.1719 12.023C1.95795 11.8798 1.77382 11.6979 1.55844 11.4407C1.48058 11.3477 1.1654 10.9525 1.22622 11.028C0.896153 10.618 0.687625 10.428 0.472656 10.3509C0.101874 10.218 -0.0909125 9.80957 0.0420627 9.43876C0.175038 9.06802 0.583414 8.87524 0.954203 9.00818C1.49101 9.20068 1.85413 9.53227 2.34325 10.1408C2.2762 10.0574 2.58531 10.4451 2.65212 10.5249C2.78801 10.6872 2.88749 10.7855 2.96521 10.8375C3.11135 10.9353 3.38475 10.9774 3.786 10.9373C3.80281 10.6647 3.85324 10.4003 3.93015 10.1561C1.81311 9.63868 0.615017 8.2727 0.615017 5.5942C0.615017 4.71059 0.878372 3.91397 1.36963 3.2463C1.21438 2.60875 1.23779 1.83768 1.58484 0.970048C1.66443 0.771085 1.82926 0.618446 2.03375 0.554355C2.09231 0.537387 2.12475 0.529834 2.18243 0.520975C2.75508 0.433041 3.56393 0.64246 4.61863 1.30313C5.23666 1.15723 5.88392 1.0832 6.53488 1.0832C7.18514 1.0832 7.83183 1.15709 8.44934 1.30271C9.50243 0.637432 10.3132 0.428091 10.8899 0.520825C10.9503 0.530532 11.0021 0.543157 11.0452 0.5573C11.2456 0.623103 11.4066 0.774223 11.4849 0.970048C11.8319 1.83749 11.8553 2.6084 11.7002 3.24586C12.193 3.91358 12.4547 4.70435 12.4547 5.5942C12.4547 8.27391 11.2606 9.63476 9.14361 10.1534C9.23269 10.4493 9.27969 10.78 9.27969 11.1377C9.27969 11.6116 9.27791 12.0642 9.27456 12.5716C9.2737 12.7072 9.27263 12.8522 9.27106 13.0749C9.53881 13.134 9.75991 13.3456 9.81711 13.6317C9.89436 14.018 9.64387 14.3937 9.25758 14.471C8.44507 14.6335 7.84303 14.0917 7.84303 13.3837C7.84303 13.3193 7.84352 13.2272 7.84459 13.0651C7.84623 12.8419 7.84723 12.6975 7.84816 12.5623C7.85144 12.0577 7.85322 11.6081 7.85322 11.1377C7.85322 10.6403 7.72256 10.3162 7.54946 10.167C7.07801 9.76057 7.31694 8.9875 7.93553 8.91796C10.0513 8.68024 11.0283 7.8608 11.0283 5.5942C11.0283 4.91332 10.8058 4.35032 10.377 3.87949C10.193 3.67747 10.1406 3.38807 10.2421 3.13436C10.3603 2.83892 10.4107 2.45178 10.31 1.98332L10.3033 1.98521C9.95241 2.08448 9.51135 2.29912 8.97764 2.66195C8.80354 2.78025 8.58614 2.81565 8.38358 2.75867C7.79852 2.59414 7.16973 2.50967 6.53488 2.50967C5.89996 2.50967 5.27118 2.59414 4.68615 2.75867C4.48464 2.81535 4.2684 2.78064 4.09475 2.66374C3.55799 2.30239 3.1145 2.088 2.76159 1.98812C2.65928 2.45401 2.70977 2.83977 2.82761 3.13436C2.9291 3.38807 2.8767 3.67747 2.69272 3.87949C2.26686 4.3471 2.04148 4.91951 2.04148 5.5942C2.04148 7.85652 3.01939 8.68152 5.12397 8.91796C5.74113 8.98736 5.98099 9.75751 5.51232 10.165C5.37509 10.2843 5.20627 10.687 5.20627 11.1377V13.3837C5.20627 14.0872 4.61084 14.6146 3.80861 14.4742C3.42059 14.4063 3.1611 14.0367 3.229 13.6487C3.28045 13.3546 3.50515 13.1345 3.77981 13.0745V12.3688C3.13068 12.4124 2.59453 12.3058 2.1719 12.023Z" fill="#6A40BF"/>
                        </svg>
                    `;
                    TASKINFOLINK.innerHTML = "Figma " + SVG;
                    TASKINFOLINK.href = `https://www.figma.com/${TASKPLATFORM.username}/${TASKPLATFORM.target_document}`;
                    break;
                case 'notion':
                    var SVG = `
                        <svg width="13" height="15" viewBox="0 0 13 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2.1719 12.023C1.95795 11.8798 1.77382 11.6979 1.55844 11.4407C1.48058 11.3477 1.1654 10.9525 1.22622 11.028C0.896153 10.618 0.687625 10.428 0.472656 10.3509C0.101874 10.218 -0.0909125 9.80957 0.0420627 9.43876C0.175038 9.06802 0.583414 8.87524 0.954203 9.00818C1.49101 9.20068 1.85413 9.53227 2.34325 10.1408C2.2762 10.0574 2.58531 10.4451 2.65212 10.5249C2.78801 10.6872 2.88749 10.7855 2.96521 10.8375C3.11135 10.9353 3.38475 10.9774 3.786 10.9373C3.80281 10.6647 3.85324 10.4003 3.93015 10.1561C1.81311 9.63868 0.615017 8.2727 0.615017 5.5942C0.615017 4.71059 0.878372 3.91397 1.36963 3.2463C1.21438 2.60875 1.23779 1.83768 1.58484 0.970048C1.66443 0.771085 1.82926 0.618446 2.03375 0.554355C2.09231 0.537387 2.12475 0.529834 2.18243 0.520975C2.75508 0.433041 3.56393 0.64246 4.61863 1.30313C5.23666 1.15723 5.88392 1.0832 6.53488 1.0832C7.18514 1.0832 7.83183 1.15709 8.44934 1.30271C9.50243 0.637432 10.3132 0.428091 10.8899 0.520825C10.9503 0.530532 11.0021 0.543157 11.0452 0.5573C11.2456 0.623103 11.4066 0.774223 11.4849 0.970048C11.8319 1.83749 11.8553 2.6084 11.7002 3.24586C12.193 3.91358 12.4547 4.70435 12.4547 5.5942C12.4547 8.27391 11.2606 9.63476 9.14361 10.1534C9.23269 10.4493 9.27969 10.78 9.27969 11.1377C9.27969 11.6116 9.27791 12.0642 9.27456 12.5716C9.2737 12.7072 9.27263 12.8522 9.27106 13.0749C9.53881 13.134 9.75991 13.3456 9.81711 13.6317C9.89436 14.018 9.64387 14.3937 9.25758 14.471C8.44507 14.6335 7.84303 14.0917 7.84303 13.3837C7.84303 13.3193 7.84352 13.2272 7.84459 13.0651C7.84623 12.8419 7.84723 12.6975 7.84816 12.5623C7.85144 12.0577 7.85322 11.6081 7.85322 11.1377C7.85322 10.6403 7.72256 10.3162 7.54946 10.167C7.07801 9.76057 7.31694 8.9875 7.93553 8.91796C10.0513 8.68024 11.0283 7.8608 11.0283 5.5942C11.0283 4.91332 10.8058 4.35032 10.377 3.87949C10.193 3.67747 10.1406 3.38807 10.2421 3.13436C10.3603 2.83892 10.4107 2.45178 10.31 1.98332L10.3033 1.98521C9.95241 2.08448 9.51135 2.29912 8.97764 2.66195C8.80354 2.78025 8.58614 2.81565 8.38358 2.75867C7.79852 2.59414 7.16973 2.50967 6.53488 2.50967C5.89996 2.50967 5.27118 2.59414 4.68615 2.75867C4.48464 2.81535 4.2684 2.78064 4.09475 2.66374C3.55799 2.30239 3.1145 2.088 2.76159 1.98812C2.65928 2.45401 2.70977 2.83977 2.82761 3.13436C2.9291 3.38807 2.8767 3.67747 2.69272 3.87949C2.26686 4.3471 2.04148 4.91951 2.04148 5.5942C2.04148 7.85652 3.01939 8.68152 5.12397 8.91796C5.74113 8.98736 5.98099 9.75751 5.51232 10.165C5.37509 10.2843 5.20627 10.687 5.20627 11.1377V13.3837C5.20627 14.0872 4.61084 14.6146 3.80861 14.4742C3.42059 14.4063 3.1611 14.0367 3.229 13.6487C3.28045 13.3546 3.50515 13.1345 3.77981 13.0745V12.3688C3.13068 12.4124 2.59453 12.3058 2.1719 12.023Z" fill="#6A40BF"/>
                        </svg>
                    `;
                    TASKINFOLINK.innerHTML = "Notion " + SVG;
                    TASKINFOLINK.href = `https://www.notion.com/${TASKPLATFORM.username}/${TASKPLATFORM.target_document}`;
                    break;
            }
        }
    }

    function clearTaskView() {
        TASKVIEW.querySelector('h2').textContent = "";
        TASKVIEW.querySelector('p').textContent = "";
        TASKVIEW.querySelector('.task-intro p').textContent = "";
        TASKVIEW.querySelector('.task-info p').textContent = "";
        TASKVIEW.querySelector('.todos').innerHTML = "";
        TASKVIEW.querySelector('.feedbacks').innerHTML = "";
    }

    // Disconnect from server
    SOCKET.on('disconnect', () => {
        console.log('Disconnected from server');
    });
});