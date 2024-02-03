// const platformsModel = require('../models/platformsModel');

exports.generateToken = async function(code, authHeader, uuid, platformId) {
    const authJson = await fetch(`https://api.notion.com/v1/oauth/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
        },
        body: JSON.stringify({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: new URL('http://localhost:80/notion/oauth')
        })
    }).then((response) => response.json());

    const user = await fetch(`https://api.notion.com/v1/users`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authJson.access_token,
            'Notion-Version': '2022-02-22'
        }
    }).then((response) => response.json());

    Promise.resolve(authJson).then(async (response) => {
        // platformsmodel.updatePlatform(platformId, response.access_token, response.workspace_id, user.results[0].name);
        console.log("platformsmodel.updatePlatform(platformId, response.access_token, response.workspace_id, user.results[0].name);")
        // res.redirect(`/reposelections?uuid=${uuid}&platformId=${platformId}&platform=notion`);
    });
};