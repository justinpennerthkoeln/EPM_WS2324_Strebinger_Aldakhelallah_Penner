//Github hook service

exports.handleGithubHook = function (hooks, hookType, uuid) {
    switch (hookType) {
        case "comment":
            handleGithubCommentHook(hooks, uuid);
        case "issue":
            handleGithubIssueHook(hooks, uuid);
    }
};

function handleGithubCommentHook(hooks, uuid) {
    fetch(`https://wrongly-electric-salmon.ngrok-free.app/api/alerts/${uuid}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify({
            userId: null,
            collectionUuid: uuid,
            comment: `${hooks.comment.user.login} commented on issue in Github ${hooks.issue.title}`,
            alertType: "git issue comments",
            timestamp: new Date().toISOString(),
        }),
    });
}

function handleGithubIssueHook(hooks, uuid) {
    fetch(`https://wrongly-electric-salmon.ngrok-free.app/api/alerts/${uuid}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify({
            userId: null,
            collectionUuid: uuid,
            comment: `${hooks.issue.user.login} created issue in Github: ${hooks.issue.title}`,
            alertType: "git issue created",
            timestamp: new Date().toISOString(),
        }),
    });
}

// Gitlab hook service

exports.handleGitlabHook = function (hooks, hookType, uuid) {
    switch (hookType) {
        case "note":
            handleGitlabCommentHook(hooks, uuid);
            break;
        case "issue":
            handleGitlabIssueHook(hooks, uuid);
            break;
    }
};

function handleGitlabCommentHook (hooks, uuid) {
    fetch(`https://wrongly-electric-salmon.ngrok-free.app/api/alerts/${uuid}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify({
            userId: null,
            collectionUuid: uuid,
            comment: `${hooks.user.name} commented on issue in Gitlab (${hooks.project.name}) ${hooks.object_attributes.note}}`,
            alertType: "git issue comments",
            timestamp: new Date().toISOString(),
        }),
    });
};

function handleGitlabIssueHook (hooks, uuid) {
    fetch(`https://wrongly-electric-salmon.ngrok-free.app/api/alerts/${uuid}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify({
            userId: null,
            collectionUuid: uuid,
            comment: `${hooks.user.name} created issue in Gitlab Repo (${hooks.project.name}) : ${hooks.object_attributes.title}`,
            alertType: "git issue created",
            timestamp: new Date().toISOString(),
        }),
    });
};