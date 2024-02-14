document.addEventListener('DOMContentLoaded', function() {

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

    const alerts = Vue.createApp({
        data() {
            return {
                alerts: [],
                dateOptions: {
                    year: "numeric",
                    month: "numeric",
                    day: "numeric",
                },
            };
        },
        template: `
            <template v-for="alert in alerts">
                <div class="alert-container">
                    <p>{{ alert.comment }}</p>
                    <p>{{ new Date(alert.timestamp).toLocaleString('de-DE', this.dateOptions) }}</p>
                </div>
            </template>
        `,
        methods: {
            getAlerts() {
                fetch(`/api/alerts/${window.location.pathname.split("/")[2]}`, {
                    'method': 'GET',
                    'headers': {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }).then((response) => response.json()).then((alerts) => {
                    this.alerts = alerts.rows.sort((a, b) => {
                        const timestampA = new Date(a.timestamp);
                        const timestampB = new Date(b.timestamp);
                
                        return timestampB - timestampA;
                    });
                });
            }
        },
        mounted() {
            this.getAlerts();
        },
    }).mount("#alerts");
});