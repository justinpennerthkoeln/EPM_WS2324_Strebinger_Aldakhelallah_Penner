const {Octokit} = require('octokit'); // library to connect to github site
const markdown = require( "markdown" ).markdown;  /// library format Readme.md to html

const COLLECTIONSMODEL = require("./collectionsModel");
const PLATFORMSMODEL = require("./platformModel");


exports.getGithubReadme = async function (uuid) {
    try {
        const collection_id = await (await COLLECTIONSMODEL.getCollection(uuid)).rows[0].collection_id;
        const PLATFORMS = await (await PLATFORMSMODEL.getPlatformsByCollectionId(collection_id)).rows;
        let github = null;
        for (const PLATFORM of PLATFORMS)
            if (PLATFORM.platform === "github")
                github = PLATFORM;

// connect to github api
        const octokit = new Octokit({
            auth: github.platform_key,
            baseUrl: "https://raw.githubusercontent.com"
        });
// https://raw.githubusercontent.com/  {owner}/{repo}/{branch}/README.md
        const response = await octokit.request(
            "GET /" + github.username + "/" + github.target_document+"/master/README.md", {});
        return markdown.toHTML( response.data ) ;
    } catch (err) {
        console.log(err);
        return err.toString();
    }
}


