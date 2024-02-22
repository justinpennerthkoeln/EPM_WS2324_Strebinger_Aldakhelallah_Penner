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
				gitLab: null,
			};
		},
		template: `
            <section v-if="figmaFiles.length > 0 || dribbbleShots.length > 0" class="design">
                <h2>Design</h2>
                <article v-if="figmaFiles.length > 0" class="figma">
                    <h3>Connected Figma file</h3>
                    <template v-for="file in figmaFiles">
                        <iframe width="100%" height="500"
                        :src="'https://www.figma.com/embed?embed_host=synergyhub&url=' + file.target_document + '&community_viewer=true'"
                        style="border: none; border-radius: 0.25rem;"
                        :title="file.target_document"
                        allowfullscreen></iframe>
                    </template>
                </article>
                <article v-if="dribbbleShots.length > 0" class="dribbble">
                    <h3>Connected Dribbble shot</h3>
                    <template v-for="shot in dribbbleShots">
                        <figure>
                            <img :src="shot" alt="dribbble shot" />
                        </figure>
                    </template>
                </article>
            </section>
            <section v-if="gitHub != null || gitLab != null" class="code">
                <h2>Code</h2>
                <article v-if="gitHub !== null" class="github">
                    <h3>Connected GitHub repository</h3>
                    <div class="viewer">
                        <p @click="goBack(gitHub.link)">Go back</p>
                        <ul v-if="gitHub.files[0]?.type !== undefined">
                            <li v-for="file in gitHub.files" @click="clickInside($event)">
                                <p v-if="file.type === 'dir'" @click="updateFiles(file.name)">
									<svg width="18" height="16" viewBox="0 0 18 16" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path d="M1.78671 1.77778V14.2222H16.0804V3.55556H8.56353L6.77681 1.77778H1.78671ZM9.30359 1.77778H16.9738C17.4672 1.77778 17.8671 2.17575 17.8671 2.66667V15.1111C17.8671 15.602 17.4672 16 16.9738 16H0.893356C0.399973 16 0 15.602 0 15.1111V0.888889C0 0.397973 0.399973 0 0.893356 0H7.51687L9.30359 1.77778Z" fill="#F5F5F5"/>
									</svg>
									{{ file.name }}
								</p>
                                <p v-else @click="getContent(file)">
									<svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path d="M9.6 1.6H1.6V14.4H12.8V4.8H9.6V1.6ZM0 0.79344C0 0.35524 0.357992 0 0.7988 0H10.4L14.3998 4L14.4 15.194C14.4 15.6391 14.0441 16 13.6053 16H0.79472C0.355808 16 0 15.6358 0 15.2066V0.79344ZM11.7255 8L8.89704 10.8284L7.76568 9.69704L9.46272 8L7.76568 6.30294L8.89704 5.17158L11.7255 8ZM2.67452 8L5.50294 5.17158L6.63432 6.30294L4.93726 8L6.63432 9.69704L5.50294 10.8284L2.67452 8Z" fill="#F5F5F5"/>
									</svg>
									{{ file.name }}
								</p>
                            </li>
                        </ul>
                        <pre v-if="!gitHub.files[0]?.type">
                            <code>{{ gitHub.files }}</code>
                        </pre>
                    </div>
                </article>

				<article v-if="gitLab !== null" class="gitlab">
                    <h3>Connected GitLab repository</h3>

                    <div class="viewer">
                        <p @click="navigateBack(gitLab.path)">Go back</p>
                        <ul v-if="gitLab.files[0]?.type !== undefined">
                            <li v-for="file in gitLab.files" @click="clickInside($event)">
                                <p v-if="file.type === 'tree'" @click="navigateToFile(file.name, file.type)">
									<svg width="18" height="16" viewBox="0 0 18 16" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path d="M1.78671 1.77778V14.2222H16.0804V3.55556H8.56353L6.77681 1.77778H1.78671ZM9.30359 1.77778H16.9738C17.4672 1.77778 17.8671 2.17575 17.8671 2.66667V15.1111C17.8671 15.602 17.4672 16 16.9738 16H0.893356C0.399973 16 0 15.602 0 15.1111V0.888889C0 0.397973 0.399973 0 0.893356 0H7.51687L9.30359 1.77778Z" fill="#F5F5F5"/>
									</svg>
									{{ file.name }}
								</p>
								<p v-else @click="navigateToFile(file.name, file.type)">
									<svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path d="M9.6 1.6H1.6V14.4H12.8V4.8H9.6V1.6ZM0 0.79344C0 0.35524 0.357992 0 0.7988 0H10.4L14.3998 4L14.4 15.194C14.4 15.6391 14.0441 16 13.6053 16H0.79472C0.355808 16 0 15.6358 0 15.2066V0.79344ZM11.7255 8L8.89704 10.8284L7.76568 9.69704L9.46272 8L7.76568 6.30294L8.89704 5.17158L11.7255 8ZM2.67452 8L5.50294 5.17158L6.63432 6.30294L4.93726 8L6.63432 9.69704L5.50294 10.8284L2.67452 8Z" fill="#F5F5F5"/>
									</svg>
									{{ file.name }}
								</p>
                            </li>
                        </ul>
						<pre v-if="!gitLab.files[0]?.type">
							<code>{{ gitLab.files }}</code>
						</pre>
                    </div>
                </article>
            </section>
        `,
		methods: {
			async clickInside($event) {
				const { target } = $event;

				try {
					const child = target.children[0];

					child.click();
				} catch (error) {
					return;
				}
			},

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
						this.platforms = platforms;

						this.getFigma();
						this.getDribbble();
						this.getGitHub();
						this.getGitLab();
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

				if (gitHubPlatforms.length > 0) {
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
				}
			},

			async getGitLab() {
				const gitLabPlatforms = await this.platforms.filter(
					(platform) => platform.platform === "gitlab"
				);

				if (gitLabPlatforms.length > 0) {
					const repos = fetch(
						`https://gitlab.com/api/v4/projects/${gitLabPlatforms[0].target_document}/repository/tree`,
						{
							headers: {
								"Content-Type": "Application/json",
								Authorization:
									"Bearer " + (await gitLabPlatforms[0].platform_key),
							},
						}
					)
						.then((response) => {
							return response.json();
						})
						.then((data) => {
							this.gitLab = {
								target_document: gitLabPlatforms[0].target_document,
								platform_key: gitLabPlatforms[0].platform_key,
								link: `https://gitlab.com/api/v4/projects/${gitLabPlatforms[0].target_document}/repository/tree`,
								files: data,
								path: "",
							};
						});
				}
			},

			async navigateToFile(file, type) {
				if (type === "tree") {
					await fetch(
						`https://gitlab.com/api/v4/projects/${this.gitLab.target_document}/repository/tree?path=${file}`,
						{
							headers: {
								Authorization: `Bearer ${this.gitLab.platform_key}`,
							},
						}
					)
						.then((response) => response.json())
						.then((files) => {
							this.gitLab.path +=
								this.gitLab.path.length > 0 ? "/" + file : file;

							this.gitLab.files = files;
						});
				} else if (type === "blob") {
					const fileContent =
						(await this.gitLab.path.length) > 0
							? this.gitLab.path + "/" + file
							: file;

					await fetch(
						`https://gitlab.com/api/v4/projects/${
							this.gitLab.target_document
						}/repository/files/${encodeURIComponent(fileContent)}?ref=main`,
						{
							headers: {
								Authorization: `Bearer ${this.gitLab.platform_key}`,
							},
						}
					)
						.then((response) => response.json())
						.then((data) => {
							const base64 = atob(data.content);
							this.gitLab.files = base64;
							this.gitLab.path +=
								this.gitLab.path.length > 0 ? "/" + file : file;

							// Higlight everything after the file content has been loaded
							this.$nextTick(() => {
								hljs.highlightAll();
							});
						});
				}
			},

			async navigateBack(path) {
				const url = new URL(
					`https://gitlab.com/api/v4/projects/${this.gitLab.target_document}/repository/tree`
				);
				url.searchParams.set("path", path.split("/").slice(0, -1).join(""));

				await fetch(url.href, {
					headers: {
						Authorization: `Bearer ${this.gitLab.platform_key}`,

						"Content-Type": "Application/json",
					},
				})
					.then((response) => response.json())
					.then((files) => {
						this.gitLab.files = files;
						this.gitLab.path = path.split("/").slice(0, -1).join("/");
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
				if (link.split("/").length > 7) {
					const url = new URL(link);
					url.pathname = url.pathname.split("/").slice(0, -1).join("/");
					this.gitHub.link = url.href;

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
