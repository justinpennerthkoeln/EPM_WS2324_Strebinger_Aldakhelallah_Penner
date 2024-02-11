const express = require("express");
const router = express.Router();
const oauthService = require('../services/oauthService');
const path = require('path');

router.get("/gitlab", async (req, res) => {
    const uuid = req.query.ids.split('_')[0];
    const platformId = req.query.ids.split('_')[1];
    const clientID = 'ee480e58dacb20b4af3ea2eada267495191ea86740dde4360149d42a9b2706ac';
    const clientSecret = 'gloas-9cfa3f429973932e85ec8fb962e58078cae9b96f99cb9a183997a649fd29cb1f';
    const authHeader = 'Basic ' + btoa(`${clientID}:${clientSecret}`);

    // const accessQuery = `https://gitlab.com/oauth/token?client_id=${clientID}&code=${req.query.code}&grant_type=authorization_code&redirect_uri=http://localhost:80/gitlab/oauth?ids=${encodeURIComponent(uuid + "_" + platformId)}`;
    oauthService.generateGitlabToken(res, clientID, req.query.code, encodeURIComponent(uuid + "_" + platformId), authHeader, platformId, uuid);
});

router.get("/github/:uuid/:paltformId", async (req, res) => {
    const accessQuery = `https://github.com/login/oauth/access_token?code=${req.query.code}&client_id=e82e9be1c2c8d95f719a&client_secret=cc9b2c76bcf27acf37dc41cc7da7b6cdec010395`;
    oauthService.generateGithubToken(res, accessQuery, req.params.uuid, req.params.paltformId);
});

router.get("/notion", async (req, res) => {
    const authHeader = 'Basic ' + btoa('40fc3257-b3fe-4337-ab8a-297c5a970609:secret_NGi6ExCtRO9OZeTiGmvO71oJPN99z8LAiuaZZ94zvLE');
    const uuid = req.query.state.split('_')[0];
    const platformId = req.query.state.split('_')[1];
    oauthService.generateNotionToken(res, req.query.code, authHeader, uuid, platformId);
});

router.get("/figma", async (req, res) => {
    const uuid = req.query.state.split('_')[0];
    const platformId = req.query.state.split('_')[1];
    const code = req.query.code;
    const clientId = 'lran9jv5bDLcZamRAN3khE';
    const clientSecret = '5y0PGZM8aRRcOt4TvOkWa8z5citlRj';
    const body = `client_id=${clientId}&client_secret=${clientSecret}&code=${code}&grant_type=authorization_code&redirect_uri=http://localhost:80/oauth/figma`;
    oauthService.generateFigmaToken(res, body, uuid, platformId);
});

router.get("/dribbble", async (req, res) => {
    const uuid = req.query.state.split('_')[0];
    const platformId = req.query.state.split('_')[1];

    const requestBody = {
        code: req.query.code,
        client_id: '40c594e9554be586ed8cffafe32c3ab44b3b62d16aecb00a8a68a52b3430d358',
        client_secret: 'c283c1ebee3f4fb05777b650e379716ddba18e5a2552f28e53cb2a1974b1136a',
        redirect_uri: 'http://localhost:80/oauth/dribbble',
        grant_type: 'authorization_code'
    };

    oauthService.generateDribbbleToken(res, requestBody, uuid, platformId);
});


router.get("/reposelections", (req, res) => {
    res.sendFile(path.join(__dirname, "../views/reposelections.html"));
});

module.exports = router;