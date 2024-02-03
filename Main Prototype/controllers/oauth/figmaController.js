// const platformsModel = require('../models/platformsModel');

exports.generateToken = async function(body, uuid, platformId) {
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