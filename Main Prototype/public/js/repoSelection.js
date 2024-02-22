document.addEventListener("DOMContentLoaded", () => {
	// Go back to the collection settings page
	document
		.querySelector("#cancel-selection")
		.addEventListener("click", ($event) => {
			$event.preventDefault();

			const platformID = new URLSearchParams(window.location.search).get(
				"platformId"
			);

			fetch(`/api/collections/platform/delete/${platformID}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
				},
			}).then((response) => {
				if (response.status === 200) {
					window.location = `${
						window.location.origin
					}/collection/${new URLSearchParams(window.location.search).get(
						"uuid"
					)}/settings/add-projects`;
				}
			});
		});

	// window.addEventListener("unload", () => {
	// 	const platformID = new URLSearchParams(window.location.search).get(
	// 		"platformId"
	// 	);

	// 	fetch(`/api/collections/platform/delete/${platformID}`, {
	// 		method: "POST",
	// 		headers: {
	// 			"Content-Type": "application/json",
	// 			Accept: "application/json",
	// 		},
	// 	});
	// });

	// Project selection
	const repositories = Vue.createApp({
		data() {
			return {
				repos: [],
				platform: "",
				platformId: "",
				platformKey: "",
				collection: null,
			};
		},
		template: `
			<ul v-if="repos.length > 0">
				<li v-for="repo in repos" class="repo">
					<h2 v-if="platform === 'github' || platform === 'gitlab'">{{ repo.name }}</h2>
					<h2 v-else-if="platform === 'dribbble'">{{ repo.title }}</h2>
					<button v-if="platform === 'github' || platform === 'gitlab'" @click="selectRepo(repo)">Select repository</button>
					<button v-else-if="platform === 'dribbble'" @click="selectShot(repo)">Select shot</button>
				</li>
			</ul>
			<template v-else>
				<div class="link-insertion">
					<h2>Insert a link to the page</h2>
					<p>Please make sure to grand view access to the page.</p>
					<form @submit.prevent="submitLink">
						<input type="text" placeholder="Enter a link...">
						<button type="submit">Submit</button>
					</form>
				</div>
			</template>
		`,
		methods: {
			async loadRepos(platform, platformId) {
				this.platform = platform;
				this.platformId = platformId;

				// Fetch the platform data
				const fetchedPlatform = await fetch(`/api/platform/${platformId}`, {
					method: "GET",
					headers: {
						"Content-Type": "application/json",
						Accept: "application/json",
					},
				});

				const platformData = await fetchedPlatform.json();

				// Save the platform key
				this.platformKey = platformData.platform_key;

				// Fetch the repos
				switch (platformData.platform) {
					case "github":
						var repos = await fetch(`https://api.github.com/user/repos`, {
							method: "GET",
							headers: {
								Accept: "application/json",
								Authorization: `token ${platformData.platform_key}`,
							},
						});

						const githubRepos = await repos.json();
						this.repos = githubRepos;
						break;
					case "gitlab":
						var repos = await fetch(
							`https://gitlab.com/api/v4/projects?membership=true`,
							{
								method: "GET",
								headers: {
									"Content-Type": "application/x-www-form-urlencoded",
									Authorization: `Bearer ${platformData.platform_key}`,
								},
							}
						);

						const gitlabRepos = await repos.json();
						this.repos = gitlabRepos;
						break;
				}
			},

			async loadShots(platformId, platformKey) {
				this.platformId = platformId;
				this.platformKey = platformKey;

				const fetchedPlatform = await fetch(`/api/platform/${platformId}`, {
					method: "GET",
					headers: {
						"Content-Type": "application/json",
						Accept: "application/json",
					},
				});

				const platformData = await fetchedPlatform.json();

				var shots = fetch(
					`https://api.dribbble.com/v2/user/shots?access_token=${platformData.platform_key}`,
					{
						method: "GET",
						headers: {
							"Content-Type": "application/json",
							Accept: "application/json",
						},
					}
				).then((response) => response.json());

				this.repos = await shots;
			},

			async selectRepo(repo) {
				if (this.platform === "github") {
					fetch(
						`/api/platforms/${this.platformId}/target-document?document=${repo.name}`,
						{
							method: "POST",
							headers: {
								"Content-Type": "application/json",
								Accept: "application/json",
							},
						}
					);

					fetch(`/api/platform/${this.platformId}`, {
						method: "GET",
						headers: {
							"Content-Type": "application/json",
							"Accept": "application/json",
						}
					}).then((response) => response.json()).then((data) => {

						fetch(`/api/alerts/${this.collection}`, {
							method: "POST",
							headers: {
								"Content-Type": "application/json",
								Accept: "application/json",
							},
							body: JSON.stringify({
								userId: JSON.parse(localStorage.getItem("user")).id,
								collectionUuid: this.collection,
								comment: `Connected to Github Repository (${data.target_document})`,
								alertType: "platform changes",
								timestamp: new Date().toISOString(),
							}),
						})

						fetch(`https://api.github.com/repos/${data.username}/${data.target_document}/hooks`, {
							method: "POST",
							headers: {
								"Accept": "application/vnd.github+json",
								"Authorization": `Bearer ${data.platform_key}`,
								"X-GitHub-Api-Version": "2022-11-28",
							},
							body: JSON.stringify({"name":"web","active":true,"events":["push","pull_request", "issues", "issue_comment"],"config":{"url":`https://wrongly-electric-salmon.ngrok-free.app/api/hook/${this.collection}/github`,"content_type":"json","insecure_ssl":"0"}})
						}).then((response) => response.json()).then((data) => {
							window.location = `${window.location.origin}/collection/${this.collection}/settings/add-projects?success=Added Repository`;
						});
					});

				} else {
					fetch(
						`/api/platforms/${this.platformId}/target-document?document=${repo.id}`,
						{
							method: "POST",
							headers: {
								"Content-Type": "application/json",
								Accept: "application/json",
							},
						}
					)
					fetch(`/api/platform/${this.platformId}`, {
						method: "GET",
						headers: {
							"Content-Type": "application/json",
							"Accept": "application/json",
						}
					}).then((response) => response.json()).then((data) => {
						fetch(`/api/alerts/${this.collection}`, {
							method: "POST",
							headers: {
								"Content-Type": "application/json",
								Accept: "application/json",
							},
							body: JSON.stringify({
								userId: JSON.parse(localStorage.getItem("user")).id,
								collectionUuid: this.collection,
								comment: `Connected to Gitlab Repository (${data.target_document})`,
								alertType: "platform changes",
								timestamp: new Date().toISOString(),
							}),
						})

						fetch(`https://gitlab.com/api/v4/projects/${data.target_document}/hooks`, {
							method: "POST",
							headers: {
								"Accept": "application/json",
								"Content-Type": "application/x-www-form-urlencoded",
								"Authorization": `Bearer ${data.platform_key}`,
							},
							body: "url=" + `https://wrongly-electric-salmon.ngrok-free.app/api/hook/${this.collection}/gitlab&issues_events=true&push_events=false&note_events=true`
						}).then((response) => response.json()).then((data) => {
							window.location = `${window.location.origin}/collection/${this.collection}/settings/add-projects?success=Added Repository`;
						});
					});
				}
			},

			async selectShot(shot) {
				fetch(
					`/api/platforms/${this.platformId}/target-document?document=${shot.id}`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Accept: "application/json",
						},
					}
				);

				window.location = `${window.location.origin}/collection/${this.collection}/settings/add-projects?success=Added Shot`;
			},

			async submitLink($event) {
				$event.preventDefault();

				const input = $event.target.querySelector("input");
				fetch(
					`/api/platforms/${this.platformId}/target-document?document=${input.value}`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Accept: "application/json",
						},
					}
				);

				window.location = `${window.location.origin}/collection/${this.collection}/settings/add-projects?success=Added Page`;
			},
		},
		mounted() {
			const params = new URLSearchParams(window.location.search);

			this.platform = params.get("platform");
			this.platformId = params.get("platformId");
			this.collection = params.get("uuid");

			switch (params.get("platform")) {
				case "github":
				case "gitlab":
					this.loadRepos(this.platform, this.platformId);
					break;
				case "notion":
				case "figma":
					break;
				case "dribbble":
					this.loadShots(this.platformId);
					break;
			}
		},
	}).mount("#repositories-container");
});

// const params = new URLSearchParams(window.location.search);
// switch (params.get("platform")) {
// 	case "github":
// 	case "gitlab":
// 		loadRepos(params.get("platform"), params.get("platformId"));
// 		break;
// 	case "notion":
// 	case "figma":
// 		setToInput(params.get("platform"));
// 		break;
// 	case "dribbble":
// 		loadShots(params.get("platformId"));
// 		break;
// }

// function setToInput(platform) {
// 	const h1 = document.querySelector("h1");
// 	h1.innerText = `Enter a ${platform} Page ID`;
// 	const repos = document.getElementById("repos");

// 	repos.innerHTML = `
//             <form id="repo-form">
//                 <input type="text" placeholder="Enter a link to ${platform} File/Page">
//                 <button type="submit">Submit</button>
//             </form>
//         `;

// 	const form = document.getElementById("repo-form");
// 	const input = form.querySelector("input");
// 	form.addEventListener("submit", ($event) => {
// 		$event.preventDefault();
// 		fetch(
// 			`/api/platforms/${params.get(
// 				"platformId"
// 			)}/target-document?document=${getTargetFromLink(
// 				input.value,
// 				params.get("platform")
// 			).toString()}`,
// 			{
// 				method: "POST",
// 				headers: {
// 					"Content-Type": "application/json",
// 					Accept: "application/json",
// 				},
// 			}
// 		);

// 		window.location = `${window.location.origin}/collection/${params.get(
// 			"uuid"
// 		)}/settings/add-projects?success=Added Page`;
// 	});
// }

// function getTargetFromLink(link, platform) {
// 	switch (platform) {
// 		case "notion":
// 			return link.split("-")[2];
// 			break;
// 		case "figma":
// 			return link.split("file/")[1].split("/")[0];
// 			break;
// 	}
// }

// async function loadRepos(platform, platformId) {
// 	const fetchedPlatform = await fetch(`/api/platform/${platformId}`, {
// 		method: "GET",
// 		headers: {
// 			"Content-Type": "application/json",
// 			Accept: "application/json",
// 		},
// 	});
// 	const platformData = await fetchedPlatform.json();

// 	switch (platformData.platform) {
// 		case "github":
// 			var repos = await fetch(`https://api.github.com/user/repos`, {
// 				method: "GET",
// 				headers: {
// 					Accept: "application/json",
// 					Authorization: `token ${platformData.platform_key}`,
// 				},
// 			});
// 			const githubRepos = await repos.json();
// 			generateRepos(githubRepos, "github");
// 			break;
// 		case "gitlab":
// 			var repos = await fetch(
// 				`https://gitlab.com/api/v4/projects?membership=true`,
// 				{
// 					method: "GET",
// 					headers: {
// 						"Content-Type": "application/x-www-form-urlencoded",
// 						Authorization: `Bearer ${platformData.platform_key}`,
// 					},
// 				}
// 			);
// 			const gitlabRepos = await repos.json();
// 			generateRepos(gitlabRepos, "gitlab");
// 			break;
// 	}
// }

// async function generateRepos(repos, platform) {
// 	const REPOS = document.getElementById("repos");
// 	repos.forEach((repo) => {
// 		const REPO = document.createElement("div");
// 		REPO.classList.add("repo");
// 		REPO.innerHTML = `
//                 <h2>${repo.name}</h2>
//                 <button class="select-repo-btn" data-repo-name="${repo.name}">Select Repo</button>
//             `;

// 		REPO.querySelector(".select-repo-btn").addEventListener(
// 			"click",
// 			($event) => {
// 				$event.preventDefault();
// 				if (platform === "github") {
// 					fetch(
// 						`/api/platforms/${params.get(
// 							"platformId"
// 						)}/target-document?document=${repo.name}`,
// 						{
// 							method: "POST",
// 							headers: {
// 								"Content-Type": "application/json",
// 								Accept: "application/json",
// 							},
// 						}
// 					);
// 				} else {
// 					fetch(
// 						`/api/platforms/${params.get(
// 							"platformId"
// 						)}/target-document?document=${repo.id}`,
// 						{
// 							method: "POST",
// 							headers: {
// 								"Content-Type": "application/json",
// 								Accept: "application/json",
// 							},
// 						}
// 					);
// 				}
// 				window.location = `${window.location.origin}/collection/${params.get(
// 					"uuid"
// 				)}/settings/add-projects?success=Added Repository`;
// 			}
// 		);
// 		REPOS.appendChild(REPO);
// 	});
// }

// async function loadShots(platformId) {
// 	const fetchedPlatform = await fetch(`/api/platforms/${platformId}`, {
// 		method: "GET",
// 		headers: {
// 			"Content-Type": "application/json",
// 			Accept: "application/json",
// 		},
// 	});
// 	const platformData = await fetchedPlatform.json();

// 	var shots = fetch(
// 		`https://api.dribbble.com/v2/user/shots?access_token=${platformData.platform_key}`,
// 		{
// 			method: "GET",
// 			headers: {
// 				"Content-Type": "application/json",
// 				Accept: "application/json",
// 			},
// 		}
// 	).then((response) => response.json());
// 	generateShots(await shots);
// }

// async function generateShots(shots) {
// 	const REPOS = document.getElementById("repos");
// 	const H1 = document.querySelector("h1");
// 	H1.innerText = `Select a Shot: `;
// 	shots.forEach((shot) => {
// 		const REPO = document.createElement("div");
// 		REPO.classList.add("repo");
// 		REPO.innerHTML = `
//                 <h2>${shot.title}</h2>
//                 <button class="select-repo-btn" data-repo-name="${shot.id}">Select Shot</button>
//             `;

// 		REPO.querySelector(".select-repo-btn").addEventListener(
// 			"click",
// 			($event) => {
// 				$event.preventDefault();
// 				fetch(
// 					`/api/platforms/${params.get(
// 						"platformId"
// 					)}/target-document?document=${shot.id}`,
// 					{
// 						method: "POST",
// 						headers: {
// 							"Content-Type": "application/json",
// 							Accept: "application/json",
// 						},
// 					}
// 				);
// 				window.location = `${window.location.origin}/collection/${params.get(
// 					"uuid"
// 				)}/settings/add-projects?success=Added Shot`;
// 			}
// 		);
// 		REPOS.appendChild(REPO);
// 	});
// }
