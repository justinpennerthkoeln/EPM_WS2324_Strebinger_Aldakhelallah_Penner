document.addEventListener("DOMContentLoaded", function () {
	fetch(`/api/collections/${window.location.pathname.split("/")[2]}/infos`)
		.then((response) => response.json())
		.then((collection) => {
			const header = document.querySelector("main > header");
			const dateOptions = {
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
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

	// Design
	const figma = Vue.createApp({
		data() {
			return {
				platforms: [],
				figmaFiles: [],
				dribbbleShots: [],
				gitHub: null,
			};
		},
		template: `
            <section v-if="figmaFiles.length > 0 || dribbbleShots.length > 0" class="design">
                <h2>Design</h2>
                <article v-if="figmaFiles.length > 0" class="figma">
                    <h3>Figma</h3>
                    <template v-for="file in figmaFiles">
                        <iframe width="100%" height="500"
                        :src="'https://www.figma.com/embed?embed_host=synergyhub&url=' + file.target_document + '&community_viewer=true'"
                        style="border: none; border-radius: 0.25rem;"
                        :title="file.target_document"
                        allowfullscreen></iframe>
                    </template>
                </article>
                <article v-if="dribbbleShots.length > 0" class="dribbble">
                    <h3>Dribbble</h3>
                    <template v-for="shot in dribbbleShots">
                        <figure>
                            <img :src="shot" alt="dribbble shot" />
                        </figure>
                    </template>
                </article>
            </section>
            <section class="code">
                <h2>Code</h2>
                <article v-if="gitHub !== null" class="github">
                    <h3>GitHub</h3>

                    <div class="viewer">
                        <p @click="goBack(gitHub.link)">Go back</p>
                        <ul v-if="gitHub.files[0]?.type !== undefined">
                            <li v-for="file in gitHub.files">
                                <p v-if="file.type === 'dir'" @click="updateFiles(file.name)">{{ file.name }}</p>
                                <p v-else @click="getContent(file)">{{ file.name }}</p>
                            </li>
                        </ul>
                        <pre v-if="!gitHub.files[0]?.type">
                            <code>{{ gitHub.files }}</code>
                        </pre>
                    </div>
                </article>
            </section>
        `,
		methods: {
			async getPlatforms() {
				await fetch(
					`/api/collections/${
						window.location.pathname.split("/")[2]
					}/platforms`,
					{
						method: "GET",
						headers: {
							"Content-Type": "application/json",
						},
					}
				)
					.then((response) => response.json())
					.then((platforms) => {
						console.log(platforms);

						this.platforms = platforms;

						this.getFigma();
						this.getDribbble();
						this.getGitHub();
					});
			},

			async getFigma() {
				const figmaPlatforms = await this.platforms.filter(
					(platform) => platform.platform === "figma"
				);

				this.figmaFiles = figmaPlatforms;
			},

			async getDribbble() {
				// Filter out the dribbble projects
				const dribbblePlatforms = await this.platforms.filter(
					(platform) => platform.platform === "dribbble"
				);

				// Fetch the dribbble images
				dribbblePlatforms.forEach(async (project) => {
					fetch(
						"https://api.dribbble.com/v2/user/shots?access_token=" +
							(await project.platform_key)
					)
						.then((response) => {
							return response.json();
						})
						.then((data) => {
							this.dribbbleShots.push(data[0].images.normal);
						});
				});
			},

			async getGitHub() {
				const gitHubPlatforms = await this.platforms.filter(
					(platform) => platform.platform === "github"
				);

				this.gitHub = {
					username: gitHubPlatforms[0].username,
					target_document: gitHubPlatforms[0].target_document,
					platform_key: gitHubPlatforms[0].platform_key,
					link: `https://api.github.com/repos/${gitHubPlatforms[0].username}/${gitHubPlatforms[0].target_document}/contents`,
					files: [],
				};

				// !!! Problem, wenn das Repo nicht von demjenigen ist, der es in die Collection eingefügt hat

				fetch(this.gitHub.link, {
					headers: {
						Authorization: `Bearer ${this.gitHub.platform_key}`,
					},
				})
					.then((response) => response.json())
					.then((files) => {
						this.gitHub.files = files;
					});
			},

			async updateFiles(newUrl) {
				this.gitHub.link = this.gitHub.link + "/" + newUrl;
				await fetch(this.gitHub.link, {
					headers: {
						Authorization: `Bearer ${this.gitHub.platform_key}`,
					},
				})
					.then((response) => response.json())
					.then((files) => {
						this.gitHub.files = files;
					});
			},

			async getContent(file) {
				const sha = file.sha;

				console.log(file);

				await fetch(
					`https://api.github.com/repos/${this.gitHub.username}/${this.gitHub.target_document}/git/blobs` +
						"/" +
						sha,
					{
						headers: {
							Authorization: `Bearer ${this.gitHub.platform_key}`,
						},
					}
				)
					.then((response) => response.json())
					.then((data) => {
						const base64 = atob(data.content);

						this.gitHub.files = base64;
						this.gitHub.link += "/";

						// Higlight everything after the file content has been loaded
						this.$nextTick(() => {
							hljs.highlightAll();
						});
					});
			},

			async goBack(link) {
				console.log("Go back:", link);

				if (link.split("/").length > 7) {
					const url = new URL(link);
					url.pathname = url.pathname.split("/").slice(0, -1).join("/");
					this.gitHub.link = url.href;

					console.log(this.gitHub.link);

					await fetch(this.gitHub.link, {
						headers: {
							Authorization: `Bearer ${this.gitHub.platform_key}`,
						},
					})
						.then((response) => response.json())
						.then((files) => {
							this.gitHub.files = files;
						});
				}
			},
		},
		mounted() {
			this.getPlatforms();
		},
	}).mount("#files-container");

	//     Vue.createApp({
	//         data() {
	//             return {
	//                 files: [],
	//                 username: "",
	//                 target_document: "",
	//                 platform_key: "",
	//                 link: ""
	//             };
	//         },
	//         template: `
	//             <div>
	//                 <h3>Github</h3>
	//                 <p @click="goBack(link)">back</p>
	//                 <template v-for="file in files">
	//                     <p v-if="file.type === 'dir'" @click="updateFiles(file.name)">{{ file.name }}</p>
	//                     <p v-else @click="getContent(file.sha)">{{ file.name }}</p>
	//                 </template>
	//             </div>
	//         `,
	//         methods: {
	//             async getRepo() {
	//                 const response = await fetch(`/api/collections/${window.location.pathname.split("/")[2]}/platforms`);
	//                 const platforms = await response.json();
	//                 const githubPlatform = platforms.filter(platform => platform.platform === "github");
	//                 const githubResponse = await fetch(`/api/platform/${githubPlatform[0].platform_id}`);
	//                 const github = await githubResponse.json();
	//                 this.username = github.username;
	//                 this.target_document = github.target_document;
	//                 this.platform_key = github.platform_key;
	//                 this.link = `https://api.github.com/repos/${github.username}/${github.target_document}/contents`;
	//                 await fetch(this.link, {
	//                     headers: {
	//                         "Authorization": `Bearer ${github.platform_key}`
	//                     }
	//                 }).then((response) => response.json()).then((files) => {this.files = files});
	//             },
	//             async updateFiles(newUrl) {
	//                 this.link = this.link + "/" + newUrl;
	//                 await fetch(this.link, {
	//                     headers: {
	//                         "Authorization": `Bearer ${this.platform_key}`
	//                     }
	//                 }).then((response) => response.json()).then((files) => {this.files = files});
	//                 document.querySelector("#content").innerHTML = "";
	//             },
	//             async getContent(sha) {
	//                 await fetch(`https://api.github.com/repos/${this.username}/${this.target_document}/git/blobs` + "/" + sha, {
	//                     headers: {
	//                         "Authorization": `Bearer ${this.platform_key}`
	//                     }
	//                 }).then((response) => response.json()).then((data) => {
	//                     const base64 = atob(data.content);
	//                     document.querySelector("#content").innerHTML = `<pre><code>${base64}</code></pre>`;
	//                 });
	//             },
	//             async goBack(link) {
	//                 if(link.split("/").length > 7) {
	//                     const url = new URL(link);
	//                     url.pathname = url.pathname.split("/").slice(0, -1).join("/");
	//                     this.link = url.href;
	//                     await fetch(this.link, {
	//                         headers: {
	//                             "Authorization": `Bearer ${this.platform_key}`
	//                         }
	//                     }).then((response) => response.json()).then((files) => {this.files = files});
	//                     return;
	//                 }
	//             }
	//         },
	//         mounted() {
	//             this.getRepo();
	//         },
	//     }).mount("#files");
});
