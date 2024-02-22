exports.handleNotification = async (data, platform, collection) => {
    switch (platform.platform) {
        case "github":
            await handleGithubNotification(data, platform, collection);
            break;
        case "gitlab":
            await handleGitlabNotification(data, platform, collection);
            break;
        case "figma":
            await handleFigmaNotification(data, platform, collection);
            break;
        case "dribbble":
            await handleDribbbleNotification(data, platform, collection);
            break;
        case "notion":
            await handleNotionNotification(data, platform, collection);
            break;
    }
};


async function handleGithubNotification(data, platform, collection) {
    fetch(`https://api.github.com/repos/${platform.username}/${platform.target_document}/issues`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `token ${platform.platform_key}`
        },
        body: JSON.stringify({
            title: `New Task in SynergyHub (${collection.name}): ${data.name}`,
            body: `A new task with the status: ${data.status} has been created in SynergyHub. \n\n ${data.description} \n\n [Link to Collection](https://wrongly-electric-salmon.ngrok-free.app/collection/${collection.uuid}/tasks)`
        })
    });
}

async function handleGitlabNotification(data, platform, collection) {
    fetch(`https://gitlab.com/api/v4/projects/${platform.target_document}/issues`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${platform.platform_key}`
        },
        body: JSON.stringify({
            title: `New Task in SynergyHub (${collection.name}): ${data.name}`,
            description: `A new task with the status: ${data.status} has been created in SynergyHub. \n\n ${data.description} \n\n [Link to Collection](https://wrongly-electric-salmon.ngrok-free.app/collection/${collection.uuid}/tasks)`
        })
    })
}

async function handleFigmaNotification(data, platform, collection) {
    console.log(platform.target_document.split("/file/")[1].split("/")[0])
    fetch(`https://api.figma.com/v1/files/${platform.target_document.split("/file/")[1].split("/")[0]}/comments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${platform.platform_key}`
        },
        body: JSON.stringify({
            message: `New Task in SynergyHub (${collection.name}): ${data.name}. With the status: ${data.status} and the description: ${data.description} \n\n [Link to Collection](https://wrongly-electric-salmon.ngrok-free.app/collection/${collection.uuid}`,
            client_meta: {
                x: 100,
                y: 100
            }
        })
    
    })
}

async function handleDribbbleNotification(data, platform, collection) {
    //TODO: Implement Dribbble notification
}

async function handleNotionNotification(data, platform, collection) {
    const linkLength = platform.target_document.split("notion.so/")[1].split("-").length -1;
    fetch(`https://api.notion.com/v1/comments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `${platform.platform_key}`,
            'Notion-Version': '2022-02-22'
        },
        body: JSON.stringify({
            parent: {
                "page_id": platform.target_document.split("notion.so/")[1].split("-")[linkLength]
            },
            rich_text: [
                {
                    "type": "text",
                    "text": {
                      "content": `New Task in Synergyhub (${collection.name}): ${data.name}`,
                      "link": null
                    },
                    "annotations": {
                      "bold": true,
                      "italic": false,
                      "strikethrough": false,
                      "underline": false,
                      "code": false,
                      "color": "orange_background"
                    },
                    "plain_text": `New Task in Synergyhub (${collection.name}): ${data.name}`,
                    "href": null
                },
                {
                    "type": "text",
                    "text": {
                      "content": ` ${data.description}`,
                      "link": null
                    },
                    "annotations": {
                      "bold": false,
                      "italic": false,
                      "strikethrough": false,
                      "underline": false,
                      "code": false,
                      "color": "default"
                    },
                    "plain_text": ` ${data.description}`,
                    "href": null
                },
                {
                    "type": "text",
                    "text": {
                      "content": ` [${data.status}]`,
                      "link": null
                    },
                    "annotations": {
                      "bold": false,
                      "italic": true,
                      "strikethrough": false,
                      "underline": false,
                      "code": false,
                      "color": "default"
                    },
                    "plain_text": ` [${data.status}]`,
                    "href": null
                }
            ]
        })
    })
}