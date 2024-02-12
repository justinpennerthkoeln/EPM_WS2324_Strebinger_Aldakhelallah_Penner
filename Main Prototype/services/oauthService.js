const platformsModel = require('../models/platformsModel');

exports.generateDribbbleToken = async function(res, requestBody, uuid, platformId) {
    fetch(`https://dribbble.com/oauth/token?client_id=${requestBody.client_id}&client_secret=${requestBody.client_secret}&code=${requestBody.code}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(response.statusText);
        }
        return response.json();
    })
    .then(data => {
        platformsModel.updatePlatform(platformId, data.access_token, '', '');
        res.redirect(`/oauth/reposelections?uuid=${uuid}&platformId=${platformId}&platform=dribbble`);
    })
    .catch(error =>{
        console.error('Error during token exchange:', error);
        res.status(500).send('Internal Server Error');
    });
};

exports.generateFigmaToken = async function(res, body, uuid, platformId) {
    const authJson = await fetch(`https://www.figma.com/api/oauth/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body
    }).then((response) => response.json());

    Promise.resolve(authJson).then(async (response) => {
        platformsModel.updatePlatform(platformId, response.access_token, '', '');
        res.redirect(`/oauth/reposelections?uuid=${uuid}&platformId=${platformId}&platform=figma`);
    });
};

exports.generateGithubToken = async function(res, query, uuid, platformId) {
    const accessJson = await fetch(query, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        }
    }).then((response) => response.json());

    const userJson = await fetch('https://api.github.com/user', {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Authorization': `token ${accessJson.access_token}`
        }
    }).then((response) => response.json()); 

    platformsModel.updatePlatform(platformId, await accessJson.access_token, '', await userJson.login);
    res.redirect(`/oauth/reposelections?uuid=${uuid}&platformId=${platformId}&platform=github`);
};

exports.generateGitlabToken = async function(res, clientId, code, ids, authHeader, platformId, uuid) {
    const accessJson = await fetch(`https://gitlab.com/oauth/token?client_id=${clientId}&code=${code}&grant_type=authorization_code&redirect_uri=http://localhost:80/oauth/gitlab?ids=${ids}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': authHeader
        }
    }).then(async (response) => {
        return response.json();
    });

    Promise.resolve(accessJson).then(async (authJson) => {
        fetch(`https://gitlab.com/api/v4/user`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer ${authJson.access_token}`
            }
        }).then((response) => response.json()).then((data) => {
            platformsModel.updatePlatform(platformId, authJson.access_token, '', data.username);
            res.redirect(`/oauth/reposelections?uuid=${uuid}&platformId=${platformId}&platform=gitlab`);
        });
    });
};

exports.generateNotionToken = async function(res, code, authHeader, uuid, platformId) {
    const authJson = await fetch(`https://api.notion.com/v1/oauth/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': authHeader
        },
        body: "grant_type=authorization_code&code=" + code + "&redirect_uri=" + new URL("http://localhost:80/oauth/notion")
    }).then((response) => response.json());

    // const user = await fetch(`https://api.notion.com/v1/users`, {
    //     method: 'GET',
    //     headers: {
    //         'Content-Type': 'application/json',
    //         'Authorization': 'Bearer ' + await authJson.access_token,
    //         'Notion-Version': '2022-02-22'
    //     }
    // }).then((response) => response.json());

    Promise.resolve(authJson).then(async (response) => {
        platformsModel.updatePlatform(platformId, response.access_token, response.workspace_id, response.owner.user.name);
        res.redirect(`/oauth/reposelections?uuid=${uuid}&platformId=${platformId}&platform=notion`);
    });
};