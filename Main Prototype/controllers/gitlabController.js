// const platformsModel = require('../models/platformsModel');

exports.generateToken = async function(query, authHeader) {
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