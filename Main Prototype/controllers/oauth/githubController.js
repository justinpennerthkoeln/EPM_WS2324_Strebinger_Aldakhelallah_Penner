// const platformsModel = require('../models/platformsModel');

exports.generateToken = async function(query) {
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