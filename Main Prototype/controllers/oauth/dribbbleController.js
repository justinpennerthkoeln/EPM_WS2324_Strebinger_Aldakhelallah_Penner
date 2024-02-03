// const platformsModel = require('../models/platformsModel');

exports.generateToken = async function(tokenurl, requestBody, uuid, platformId) {
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