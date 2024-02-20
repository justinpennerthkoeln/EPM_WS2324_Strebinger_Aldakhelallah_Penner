//Github hook service
const platformsModel = require("../models/platformsModel.js");
const collectionsModel = require("../models/collectionsModel.js");

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

exports.handleFigmaHook = function (hooks, hookType, uuid) {
    collectionsModel.getByUuid(uuid).then((collection) => {
        if(collection.rowCount > 0) {
            platformsModel.getByCollectionIdAndPlatform(collection.rows[0].collection_id, "figma").then((platforms) => {
                if(platforms.length > 0){
                    if(platforms[0].target_document.split("/")[4] == hooks.file_key) {
                        switch (hookType) {
                            case "comment":
                                handleFigmaCommentHook(hooks, uuid);
                                break;
                            case "update":
                                handleFigmaUpdateHook(hooks, uuid);
                                break;
                        }
                    }
                }
            });
        }
    });
};

function handleFigmaCommentHook (hooks, uuid) {
    fetch(`https://wrongly-electric-salmon.ngrok-free.app/api/alerts/${uuid}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify({
            userId: null,
            collectionUuid: uuid,
            comment: `new comment on Figma file ${hooks.file_name}`,
            alertType: "design comment",
            timestamp: new Date().toISOString(),
        }),
    });
};

function handleFigmaUpdateHook (hooks, uuid) {
    fetch(`https://wrongly-electric-salmon.ngrok-free.app/api/alerts/${uuid}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify({
            userId: null,
            collectionUuid: uuid,
            comment: `design changes on Figma file ${hooks.file_name}`,
            alertType: "design changes",
            timestamp: new Date().toISOString(),
        }),
    });
};