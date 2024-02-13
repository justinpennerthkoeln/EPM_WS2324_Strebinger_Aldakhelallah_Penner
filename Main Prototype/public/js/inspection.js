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

    Vue.createApp({
        data() {
            return {
                files: [],
                username: "",
                target_document: "",
                platform_key: "",
                link: ""
            };
        },
        template: `
            <div>
                <h3>Github</h3>
                <p @click="goBack(link)">back</p>
                <template v-for="file in files">
                    <p v-if="file.type === 'dir'" @click="updateFiles(file.name)">{{ file.name }}</p>
                    <p v-else @click="getContent(file.sha)">{{ file.name }}</p>
                </template>
            </div>
        `,
        methods: {
            async getRepo() {
                const response = await fetch(`/api/collections/${window.location.pathname.split("/")[2]}/platforms`);
                const platforms = await response.json();
                const githubPlatform = platforms.filter(platform => platform.platform === "github");
                const githubResponse = await fetch(`/api/platform/${githubPlatform[0].platform_id}`);
                const github = await githubResponse.json();
                this.username = github.username;
                this.target_document = github.target_document;
                this.platform_key = github.platform_key;
                this.link = `https://api.github.com/repos/${github.username}/${github.target_document}/contents`;
                await fetch(this.link, {
                    headers: {
                        "Authorization": `Bearer ${github.platform_key}`
                    }
                }).then((response) => response.json()).then((files) => {this.files = files});
            },
            async updateFiles(newUrl) {
                this.link = this.link + "/" + newUrl;
                await fetch(this.link, {
                    headers: {
                        "Authorization": `Bearer ${this.platform_key}`
                    }
                }).then((response) => response.json()).then((files) => {this.files = files});
                document.querySelector("#content").innerHTML = "";
            },
            async getContent(sha) {
                await fetch(`https://api.github.com/repos/${this.username}/${this.target_document}/git/blobs` + "/" + sha, {
                    headers: {
                        "Authorization": `Bearer ${this.platform_key}`
                    }
                }).then((response) => response.json()).then((data) => {
                    const base64 = atob(data.content);
                    document.querySelector("#content").innerHTML = `<pre><code>${base64}</code></pre>`;
                });
            },
            async goBack(link) {
                if(link.split("/").length > 7) {
                    const url = new URL(link);
                    url.pathname = url.pathname.split("/").slice(0, -1).join("/");
                    this.link = url.href;
                    await fetch(this.link, {
                        headers: {
                            "Authorization": `Bearer ${this.platform_key}`
                        }
                    }).then((response) => response.json()).then((files) => {this.files = files});
                    return;
                }
            }
        },
        mounted() {
            this.getRepo();
        },
    }).mount("#files");
});