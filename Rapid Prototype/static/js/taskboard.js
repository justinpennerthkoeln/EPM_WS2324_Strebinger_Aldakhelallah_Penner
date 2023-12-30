// Create taskboard
const TASKBOARD = Vue.createApp({
    data() {
        return {
            tasks: [],
            states: ['todo', 'in-progress', 'review', 'done'],
        }
    },
    template: `
        <section>

        </section>
    `,
    methods: {
        
        addTask() {
            this.tasks.push({
                title: 'New Task',
                description: 'New Task Description',
                status: 'todo',
                priority: 'low',
                assignee: 'Unassigned',
            });
        },
    },
}).mount('#taskboard');