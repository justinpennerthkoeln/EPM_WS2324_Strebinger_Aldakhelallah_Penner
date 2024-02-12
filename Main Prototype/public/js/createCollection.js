document.addEventListener("DOMContentLoaded", async function () {
	// Check if user is logged in
	if (!window.localStorage.getItem("user")) {
		const params = new URLSearchParams(window.location.search);
		window.localStorage.setItem("uuid", params.get("uuid"));
		fetch(`/api/users/${params.get("uuid")}`)
			.then((response) => response.json())
			.then((user) => {
				window.localStorage.setItem("user", JSON.stringify(user));
			})
			.then(() => {
				generateCollections();
			});
	} else {
		generateCollections();
	}

	window.history.pushState({}, document.title, window.location.pathname);

	// Logout
	const LOGOUTBUTTON = document.getElementById("logout-button");
	LOGOUTBUTTON.addEventListener("click", () => {
		window.localStorage.clear();
		window.location.href = `/signin?success=Succesfully_logged_out.`;
	});

	// Open collection form
	const ADDCOLLECTIONBUTTON = document.querySelector("#create-collection");
	const ADDCOLLECTIONCONTAINER = document.querySelector(
		"#create-collection-container"
	);
	ADDCOLLECTIONBUTTON.addEventListener("click", ($event) => {
		$event.preventDefault();
		ADDCOLLECTIONCONTAINER.classList.toggle("hidden");
		document.addEventListener("keydown", (event) => {
			if (event.key === "Escape") {
				ADDCOLLECTIONCONTAINER.classList.add("hidden");
			}
		});
	});

	// Close collection form
	ADDCOLLECTIONCONTAINER.addEventListener("click", (event) => {
		if (event.target === ADDCOLLECTIONCONTAINER) {
			ADDCOLLECTIONCONTAINER.classList.toggle("hidden");
		}
	});

	// Create collection
	const CREATECOLLECTIONFORM = document.querySelector(
		"#collection-create-form"
	);
	CREATECOLLECTIONFORM.addEventListener("submit", async ($event) => {
		$event.preventDefault();

    // Create collection
    const CREATECOLLECTIONFORM = document.querySelector('#collection-create-form');
    CREATECOLLECTIONFORM.addEventListener('submit', async ($event) => {
        $event.preventDefault();
        fetch(`/api/collections/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            body: "name=" + CREATECOLLECTIONFORM.querySelector('#name').value + "&userId=" + JSON.parse(window.localStorage.getItem('user')).id + "&description=" + CREATECOLLECTIONFORM.querySelector('#description').value
        }).then(response => response.json()).then(data => {
            window.location.href = `/collection/${data.uuid}/`;
        }).catch(error => {
            console.error('Error creating collection:', error);
        });
    });
});

// Generate collection list
function generateCollections() {
	Vue.createApp({
		data() {
			return {
				collections: [],
				dateOptions: {
					year: "numeric",
					month: "numeric",
					day: "numeric",
				},
			};
		},
		template: `
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Created</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="collection in collections" @click="navigateToCollection(collection.uuid)">
                    <td>{{ collection.name }}</td>
                    <td>{{ new Date(collection.timestamp).toLocaleString('de-DE', this.dateOptions) }}</td>
                </tr>
            </tbody>
        `,
		methods: {
			navigateToCollection(uuid) {
				window.location.href = `/collection/${uuid}/`;
			},
			addCollection(data) {
				this.collections.push(data);
			},
			fetchCollections() {
				if (!window.localStorage.getItem("user")) {
					return;
				}
				const user = JSON.parse(window.localStorage.getItem("user")); // user abrufen
				fetch(`/api/collections/${user.id}`)
					.then((response) => response.json())
					.then((collections) => {
						this.collections = collections;
					})
					.catch((error) => {
						console.error("Error fetching collections:", error);
					});
			},
		},
		mounted() {
			this.fetchCollections();
		},
	}).mount("#collections");
}
