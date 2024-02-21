import { io } from "socket.io-client";

document.addEventListener("DOMContentLoaded", async function () {
	fetch(`/api/collections/${window.location.pathname.split("/")[2]}/infos`)
		.then((response) => response.json())
		.then((collection) => {
			const header = document.querySelector("main > header");
			const dateOptions = {
				year: "numeric",
				month: "numeric",
				day: "numeric",
			};
			const date = new Date(collection.timestamp).toLocaleString(
				"de-DE",
				dateOptions
			);
			const members = collection.members
				.map((member) => {
					return `@${member.username}`;
				})
				.join(", ");

			document.title = `SynergyHub | ${collection.name}`;

			header.children[0].textContent = collection.name;
			header.children[1].textContent = `${date} — ${members}`;
			header.children[2].textContent = collection.description;
		});

	async function getCollectionUUID() {
		for (const path of window.location.pathname.split("/")) {
			if (path.length > 10) {
				return path;
			}
		}
	}

	// SOCKET.IO CONNECTION
	const socket = io("http://localhost:80", {
		query: {
			collectionUUID: await getCollectionUUID(),
		},
	});

	// SOCKET.IO NOTIFICATIONS
	let socketID;

	socket.on("connect", () => {
		socketID = socket.id;

		socket.on("refresh", (data) => {
			if (data.targets) {
				data.targets.forEach((target) => {
					switch (target) {
						case "task-board":
							taskBoard.loadTasks();
							break;
						case "task-view":
							taskView.loadTask(taskView.task);
							break;
						default:
							break;
					}
				});
			}
		});
	});

	// Get and save membershipID
	async function getMembershipID() {
		const user = JSON.parse(localStorage.getItem("user"));

		let collectionUUID;

		for (const path of window.location.pathname.split("/")) {
			if (path.length > 10) {
				collectionUUID = path;
			}
		}

		const collectionID = await fetch(`/api/collections/id/${collectionUUID}`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		})
			.then((response) => {
				return response.json();
			})
			.then((collection) => {
				return collection.rows[0].collection_id;
			});

		fetch(`/api/memberships/${await collectionID}/${user.id}`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		})
			.then((response) => {
				return response.json();
			})
			.then((membership) => {
				localStorage.setItem("membershipId", membership[0].membership_id);
			});
	}

	getMembershipID();

	// TASKBOARD
	const taskBoard = Vue.createApp({
		data() {
			return {
				tasks: [],
				states: ["todo", "running", "review", "done"],
			};
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
                                <!-- <label class="checkbox-container">
                                    <input type="checkbox" :id="task.task_id" :name="task.task_id"/>
                                    <span class="checkmark"></span>
                                </label> -->
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
			async loadTasks() {
				let collectionID;

				for (const path of window.location.pathname.split("/")) {
					if (path.length > 10) {
						collectionID = path;
					}
				}

				fetch(`/api/collection/${collectionID}/tasks`, {
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
				})
					.then((response) => {
						return response.json();
					})
					.then(async (tasks) => {
						this.tasks = await this.sortTasks(tasks);
					});
			},

			async sortTasks(tasks) {
				// Sort tasks by status and status_index
				const sortedTasks = await tasks.sort((a, b) => {
					const statusComparison =
						this.states.indexOf(a.status) - this.states.indexOf(b.status);

					if (statusComparison === 0) {
						return a.status_index - b.status_index;
					}

					return statusComparison;
				});

				return sortedTasks;
			},

			hasTasks(state) {
				return this.tasks.some((task) => {
					return task.status == state.replaceAll("-", " ");
				});
			},

			async openTask(index) {
				// Make task view visible
				const taskContainer = document.querySelector(".view-task-container");
				taskContainer.classList.toggle("hidden");

				// Load task view variables
				const selectedTask = this.tasks[index];

				// Pass variables to task view
				taskView.loadTask(selectedTask);

				// Load task view exit interaction
				document.addEventListener("keydown", ($event) => {
					if ($event.key == "Escape") {
						taskContainer.classList.add("hidden");
						taskView.clearTaskView();
					}
				});

				taskContainer.addEventListener("click", ($event) => {
					if ($event.target == taskContainer) {
						taskContainer.classList.add("hidden");
						taskView.clearTaskView();
					}
				});
			},

			handleDragStart($event, id) {
				$event.dataTransfer.setData("text/plain", id.toString());
			},

			async handleDrop($event, targetState) {
				$event.preventDefault();

				const taskID = parseInt($event.dataTransfer.getData("text/plain"), 10);
				const draggedTask = this.tasks.find((task) => task.task_id === taskID);

				// Update status of the dragged task
				draggedTask.status = targetState;

				// Find the new index of the dragged task
				const cardsContainer = $event.target.closest(".cards");
				const cards =
					cardsContainer && cardsContainer.children
						? Array.from(cardsContainer.children)
						: [];
				const newIndex = Math.max(
					cards.findIndex((card) => card === $event.target.closest(".card")),
					0
				);

				// All tasks sorted by status and status_index
				const allTasksSortedByStatus = await this.tasks.reduce((acc, task) => {
					if (!acc[task.status]) {
						acc[task.status] = [];
					}

					acc[task.status].push(task);

					return acc;
				}, {});

				Object.keys(allTasksSortedByStatus).forEach((status) => {
					// Get all tasks without the dragged task
					const allTasksWithoutDraggedTask = allTasksSortedByStatus[
						status
					].filter((task) => task.task_id !== taskID);

					// Sort tasks by status_index
					allTasksWithoutDraggedTask.sort(
						(a, b) => a.status_index - b.status_index
					);

					// Get number of tasks in status
					const tasksCount = allTasksSortedByStatus[status].length;

					// New array for the ordered tasks
					const orderedTasks = [];

					// Update status_index of the tasks
					for (let index = 0; index < tasksCount; index++) {
						if (targetState == status && index == newIndex) {
							orderedTasks[index] = draggedTask;
						} else {
							orderedTasks[index] = allTasksWithoutDraggedTask.shift();
						}

						orderedTasks[index].status_index = index;
					}

					// Update tasks in allTasksSortedByStatus
					allTasksSortedByStatus[status] = orderedTasks;
				});

				const allTasks = Object.values(allTasksSortedByStatus).reduce(
					(acc, tasks) => {
						return acc.concat(tasks);
					},
					[]
				);

				this.tasks = await this.sortTasks(await allTasks);

				fetch(`/api/tasks/states`, {
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
						Accept: "application/json",
						"X-Socket-ID": socketID,
					},
					body: JSON.stringify(
						allTasks.map((task) => {
							return {
								task_id: task.task_id,
								status: task.status,
								status_index: task.status_index,
							};
						})
					),
				})
					.then((response) => {
						return response.json();
					})
					.then((status) => {
						// console.log(status);
					})
					.catch((error) => {
						console.error(error);
					});

				if (draggedTask.status != "done") {
					fetch(`/api/alerts/${window.location.pathname.split("/")[2]}`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Accept: "application/json",
						},
						body: JSON.stringify({
							userId: JSON.parse(localStorage.getItem("user")).id,
							collectionUuid: window.location.pathname.split("/")[2],
							comment: `@${
								JSON.parse(localStorage.getItem("user")).username
							}. has updated status of task "${draggedTask.name}" to "${
								draggedTask.status
							}".`,
							alertType: "task updated",
							timestamp: new Date().toISOString(),
						}),
					});
				} else {
					fetch(`/api/alerts/${window.location.pathname.split("/")[2]}`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Accept: "application/json",
						},
						body: JSON.stringify({
							userId: JSON.parse(localStorage.getItem("user")).id,
							collectionUuid: window.location.pathname.split("/")[2],
							comment: `@${
								JSON.parse(localStorage.getItem("user")).username
							}. has marked "${draggedTask.name}" as done.`,
							alertType: "task completed",
							timestamp: new Date().toISOString(),
						}),
					});
				}
			},

			allowDrop(event) {
				event.preventDefault();
			},

			async newFeedback(feedback) {
				const affectedTask = this.tasks.find((task) => {
					return task.task_id == feedback.task_id;
				});

				affectedTask.feedbacks_count = Number(affectedTask.feedbacks_count) + 1;
			},

			updateTodosProgress(taskID, percentage) {
				const affectedTask = this.tasks.find((task) => {
					return task.task_id == taskID;
				});

				affectedTask.todos_progress = percentage;
			},
		},
		mounted() {
			this.loadTasks();
		},
	}).mount("#taskboard");

	// TASKVIEW
	const taskView = Vue.createApp({
		data() {
			return {
				task: {},
				todos: [],
				feedbacks: [],
				possiblePlatforms: ["GitHub", "GitLab", "Figma", "Notion"],
				dateOptions: {
					year: "numeric",
					month: "numeric",
					day: "numeric",
				},
			};
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
			<section class="delete-task">
					<p @click="deleteTask">Delete Task</p>
			</section>
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
                                    <!-- <li>
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
                                    </li> -->
                                    <li>
                                        <p @click="toggleReplyOverlay(index)">Reply</p>
                                    </li>
                                </ul>
                                <div class="reply-overlay hidden" :id="'reply-overlay-' + index">
                                    <textarea name="reply" placeholder="Add a reply..."></textarea>
                                    <button @click="saveReplyFeedback(index)">Add reply</button>
                                </div>
                                <ul>
                                    <li v-for="(reply, index) in feedback.replies" class="reply">
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
			async loadTask(task) {
				this.task = task;

				fetch(`/api/tasks/${task.task_id}/todos`, {
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
				})
					.then((response) => {
						return response.json();
					})
					.then(async (todos) => {
						this.todos = await todos;
					});

				fetch(`/api/tasks/${task.task_id}/feedbacks`, {
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
				})
					.then((response) => {
						return response.json();
					})
					.then(async (feedbacks) => {
						this.feedbacks = await feedbacks;
					});
			},

			async clearTaskView() {
				this.task = {};
				this.todos = [];
				this.feedbacks = [];
			},

			findConnectedPlatform(name) {
				for (const platform of this.possiblePlatforms) {
					if (platform.toLowerCase() === name) {
						return platform;
					}
				}
				return "-";
			},

			addTodo($event) {
				const todo = $event.target.value;

				if (todo.length > 0 && $event.key == "Enter") {
					fetch(`/api/tasks/${this.task.task_id}/todo`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Accept: "application/json",
							"X-Socket-ID": socketID,
						},
						body: JSON.stringify({
							description: todo,
						}),
					})
						.then((response) => response.json())
						.then((todo) => {
							$event.target.value = "";
						})
						.catch((error) => {
							console.error("Error:", error);
						});
				}
			},

			async updateTodo($event) {
				fetch(
					`/api/tasks/${this.task.task_id}/todo/${$event.target.getAttribute(
						"name"
					)}`,
					{
						method: "PUT",
						headers: {
							"Content-Type": "application/json",
							Accept: "application/json",
							"X-Socket-ID": socketID,
						},
						body: JSON.stringify({
							status: $event.target.checked,
						}),
					}
				)
					.then((response) => response.json())
					.then((todo) => {
						// console.log(todo);
					})
					.catch((error) => {
						console.error("Error:", error);
					});
			},

			addFeedback($event) {
				$event.preventDefault();

				const comment = $event.target.querySelector(
					'textarea[name="comment"]'
				).value;

				if (comment.length > 0) {
					fetch(`/api/tasks/${this.task.task_id}/feedback`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Accept: "application/json",
							"X-Socket-ID": socketID,
						},
						body: JSON.stringify({
							username: JSON.parse(localStorage.getItem("user")).username,
							membership_id: localStorage.getItem("membershipId"),
							comment: comment,
						}),
					})
						.then((response) => response.json())
						.then((feedback) => {
							// console.log(feedback);

							$event.target.querySelector('textarea[name="comment"]').value =
								"";
						})
						.catch((error) => {
							console.error("Error:", error);
						});

					fetch(`/api/alerts/${window.location.pathname.split("/")[2]}`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Accept: "application/json",
						},
						body: JSON.stringify({
							userId: JSON.parse(localStorage.getItem("user")).id,
							collectionUuid: window.location.pathname.split("/")[2],
							comment: `@${
								JSON.parse(localStorage.getItem("user")).username
							}. has added feedback to task "${this.task.name}": "${comment}".`,
							alertType: "task feedbacks",
							timestamp: new Date().toISOString(),
						}),
					});
				}
			},

			toggleReplyOverlay(index) {
				const OVERLAY = document.querySelector("#reply-overlay-" + index);
				OVERLAY.classList.toggle("hidden");
			},

			async saveReplyFeedback(index) {
				const feedbackID = this.feedbacks[index].feedback_id;
				const comment = document.querySelector(
					"#reply-overlay-" + index + ' textarea[name="reply"]'
				).value;

				fetch(`/api/feedback/${feedbackID}/reply`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Accept: "application/json",
						"X-Socket-ID": socketID,
					},
					body: JSON.stringify({
						username: JSON.parse(localStorage.getItem("user")).username,
						comment: comment,
					}),
				})
					.then((response) => {
						return response.json();
					})
					.then(() => {
						document.querySelector(
							"#reply-overlay-" + index + ' textarea[name="reply"]'
						).value = "";
						this.toggleReplyOverlay(index);
					})
					.catch((error) => {
						console.error(error);
					});

				fetch(`/api/alerts/${window.location.pathname.split("/")[2]}`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Accept: "application/json",
					},
					body: JSON.stringify({
						userId: JSON.parse(localStorage.getItem("user")).id,
						collectionUuid: window.location.pathname.split("/")[2],
						comment: `@${
							JSON.parse(localStorage.getItem("user")).username
						}. has replied to feedback "${
							this.feedbacks[index].comment
						}":  "${comment}".`,
						alertType: "task feedback replies",
						timestamp: new Date().toISOString(),
					}),
				});
			},

			async deleteTask() {
				document.querySelector(".view-task-container").classList.add("hidden");

				const assignedUser = this.task.assigned_users
					? this.task.assigned_users[0].membership_id
					: null;

				fetch(`/api/tasks/${this.task.task_id}`, {
					method: "DELETE",
					headers: {
						"Content-Type": "application/json",
						Accept: "application/json",
						"X-Socket-ID": socketID,
					},
					body: JSON.stringify({
						membership_id: assignedUser,
					}),
				})
					.then((response) => {
						return response.json();
					})
					.then((task) => {
						this.clearTaskView();
					})
					.catch((error) => {
						console.error(error);
					});
			},
		},
	}).mount("#task-view");

	// CREATE TASK
	async function getCollectionID() {
		let collectionUUID;

		for (const path of window.location.pathname.split("/")) {
			if (path.length > 10) {
				collectionUUID = path;
			}
		}

		const collectionID = await fetch(`/api/collections/id/${collectionUUID}`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		})
			.then((response) => {
				return response.json();
			})
			.then((collection) => {
				return collection.rows[0].collection_id;
			});

		return collectionID;
	}

	const createTaskContainer = document.querySelector("#create-task-container");
	const createTaskForm = document.querySelector("#create-task-form");
	const createTaskButton = document.querySelectorAll("#create-task-button");

	async function getPlatforms() {
		const select = document.querySelector("#platform-select");

		let collectionUUID;

		for (const path of window.location.pathname.split("/")) {
			if (path.length > 10) {
				collectionUUID = path;
			}
		}

		const platforms = await fetch(
			`/api/collections/${await collectionUUID}/platforms`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			}
		)
			.then((response) => {
				return response.json();
			})
			.then((platforms) => {
				return platforms;
			});

		platforms.forEach((platform) => {
			select.innerHTML += `<option value="${platform.platform_id}">${
				platform.platform.charAt(0).toUpperCase() + platform.platform.slice(1)
			}</option>`;
		});
	}

	getPlatforms();

	function clearForm() {
		createTaskForm.querySelector('input[name="status"]').value = "";
		createTaskForm.querySelector('input[name="name"]').value = "";
		createTaskForm.querySelector('textarea[name="description"]').value = "";
		createTaskForm.querySelector("#platform-select").selectedIndex = 0;

		// Assigned user
		selectResponsibleUser.searchInput = "";
		selectResponsibleUser.selected = null;
		selectResponsibleUser.searchResults = [];
	}

	createTaskButton.forEach((button) => {
		button.addEventListener("click", ($event) => {
			createTaskContainer.classList.remove("hidden");
			createTaskForm.querySelector('input[name="status"]').value =
				$event.target.value;
		});
	});

	createTaskContainer.addEventListener("click", ($event) => {
		if ($event.target == createTaskContainer) {
			createTaskContainer.classList.add("hidden");

			clearForm();
		}
	});

	createTaskForm.addEventListener("submit", async ($event) => {
		$event.preventDefault();

		const data = {};

		data.status = createTaskForm
			.querySelector('input[name="status"]')
			.value.replace("-", " ");
		data.statusIndex = taskBoard.tasks.filter(
			(task) => task.status == data.status
		).length;
		data.name = createTaskForm.querySelector('input[name="name"]').value;
		data.description = createTaskForm.querySelector(
			'textarea[name="description"]'
		).value;
		data.collectionID = await getCollectionID();
		data.platform = Number(
			createTaskForm.querySelector("#platform-select").value
		);
		data.createIssue =
			createTaskForm.querySelector("#send-notification").checked;

		// Assigned user
		data.assignedUser = selectResponsibleUser.selected;

		fetch("/api/tasks", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
				"X-Socket-ID": socketID,
			},
			body: JSON.stringify(data),
		})
			.then((response) => {
				return response.json();
			})
			.then((task) => {
				// console.log(task);
			})
			.catch((error) => {
				console.error(error);
			});

		createTaskContainer.classList.add("hidden");

		fetch(`/api/alerts/${window.location.pathname.split("/")[2]}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify({
				userId: JSON.parse(localStorage.getItem("user")).id,
				collectionUuid: window.location.pathname.split("/")[2],
				comment: `A new task in ${
					document.querySelector("main > header").children[0].textContent
				} by @${JSON.parse(localStorage.getItem("user")).username}. "${
					data.name
				}"`,
				alertType: "task created",
				timestamp: new Date().toISOString(),
			}),
		});

		clearForm();
	});

	// Select responsible user
	const selectResponsibleUser = Vue.createApp({
		data() {
			return {
				collectionID: null,
				searchResults: [],
				searchInput: "",
				selected: null,
			};
		},
		template: `
			<label for="assigned-user-input">Assigned user (optional)</label>
            <input id="assigned-user-input" type="text" class="search-user" placeholder="Enter a username..." v-model="searchInput" @input="searchUsers" />
            <ul :class="'suggestedAssignedUserNames ' + (searchResults.length === 0 ? 'disabled' : '')">
                <li v-for="user in searchResults" :key="user.id" @click="selectUser(user.membership_id)">{{user.username}}</li>
            </ul>
        `,
		methods: {
			async getCollectionID() {
				let collectionUUID;

				for (const path of window.location.pathname.split("/")) {
					if (path.length > 10) {
						collectionUUID = path;
					}
				}

				const collectionID = await fetch(
					`/api/collections/id/${collectionUUID}`,
					{
						method: "GET",
						headers: {
							"Content-Type": "application/json",
						},
					}
				)
					.then((response) => {
						return response.json();
					})
					.then((collection) => {
						return collection.rows[0].collection_id;
					});

				this.collectionID = collectionID;
			},

			async searchUsers() {
				if (this.collectionID == null) {
					await this.getCollectionID();
				}

				// If the full name is written, select the user
				if (
					this.searchResults.find(
						(user) => user.username === this.searchInput
					) &&
					this.searchInput.length > 0 &&
					this.searchResults.length == 1
				) {
					Promise.resolve(() => {
						this.selectUser(
							this.searchResults.find(
								(user) => user.username === this.searchInput
							).id
						);
					}).then(() => {
						this.searchResults = [];
					});
				} else {
					this.selected = null;

					if (this.searchInput.length > 0) {
						fetch(
							`/api/memberships/${
								this.collectionID
							}/users?searchTerm=${this.searchInput.toLowerCase()}`,
							{
								method: "GET",
								headers: {
									"Content-Type": "application/json",
								},
							}
						)
							.then((response) => {
								return response.json();
							})
							.then((users) => {
								this.searchResults = users;
							});
					} else {
						this.searchResults = [];
					}
				}
			},

			selectUser(membershipId) {
				this.searchInput = this.searchResults.find(
					(user) => user.membership_id === membershipId
				).username;
				this.searchResults = [];

				this.selected = this.selected == membershipId ? null : membershipId;
			},
		},
	}).mount("#select-responsible-user");
});
