exports.generateDribbbleToken = async function(tokenurl, requestBody, uuid, platformId) {
    fetch(tokenurl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        // PLATFORMSMODEL.updatePlatform(PLATFORMID, data.access_token, '', '');
        console.log("PLATFORMSMODEL.updatePlatform(PLATFORMID, data.access_token, '', '');")
        // res.redirect(`/reposelections?uuid=${uuid}&platformId=${platformId}&platform=dribbble`);
    })
    .catch(error =>{
        console.error('Error during token exchange:', error);
        res.status(500).send('Internal Server Error');
    });
};

exports.generateFigmaToken = async function(body, uuid, platformId) {
    const authJson = await fetch(`https://www.figma.com/api/oauth/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body
    }).then((response) => response.json());

    Promise.resolve(authJson).then(async (response) => {
        // platformsModel.updatePlatform(platformId, response.access_token, '', '');
        console.log("platformsModel.updatePlatform(platformId, response.access_token, '', '');")
        // res.redirect(`/reposelections?uuid=${uuid}&platformId=${platformId}&platform=figma`);
    });
};

exports.generateGithubToken = async function(query) {
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

    // platformsModel.updatePlatform(req.params.plaformId, accessJson.access_token, '', userJson.login);
    console.log("platformsModel.updatePlatform(req.params.plaformId, accessJson.access_token, '', userJson.login);")
    res.redirect(`/reposelections?uuid=${req.params.uuid}&platformId=${req.params.plaformId}&platform=github`);
};

exports.generateGitlabToken = async function(query, authHeader) {
    const accessJson = await fetch(query, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': authHeader
        }
    }).then(async (response) => {
        if (!response.ok) {
            const errorResponse = await response.json();
            throw new Error(`Failed to get access token: ${errorResponse.error_description}`);
        }
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
            // PLATFORMSMODEL.updatePlatform(platformId, authJson.access_token, '', data.username);
            console.log("PLATFORMSMODEL.updatePlatform(platformId, authJson.access_token, '', data.username);")
            // res.redirect(`/reposelections?uuid=${uuid}&platformId=${platformId}&platform=gitlab`);
        });
    });
};

exports.generateNotionToken = async function(code, authHeader, uuid, platformId) {
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