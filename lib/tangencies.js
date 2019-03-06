const {
    selection
} = require("scenegraph");
const environment = require('./storage-helper');

class tangencies {
    /**
     * Setting API token
     * @param {string} api 
     */
    static async setToken(api) {
        this.api = api;
    }

    /**
     * Setting endpoints to call the API
     * @param {string} endpoint - full address
     */
    static async setEndpoint(endpoint) {
        this.endpoint = endpoint;

    }
    /**
     * Processing the complex and simple paths
     *
     * @param {*} selection
     * @param {*} value
     */
    static processData() {

        //build array of objects with paths and points
        const node = selection.items; //getting first node 
        let pathArray = new Array;

        node.forEach(function (childNode, i) {
            pathArray.push({
                path: childNode.pathData
            });
        });
        return this.getNewPaths(pathArray);

    }


    /**
     * Redraws the paths by creating an array of fetch request with current data.
     * returns a Promise.all() -> which means that it won"t proceed with other methods until the promises/requests are resolved.
     * 
     * @param {*} selection
     * @param {*} array
     * @param {*} value
     */
    static getNewPaths(origPaths) {
        let newPaths = new Array; //array of said requests
        let object = this;
        origPaths.forEach(async function (element) {
            newPaths.push(object.callToTangenciesApi(element.path));

        });
        return Promise.all(newPaths)
            .then(data => this.placePaths(data));
    }


    /**
     * Replacing paths
     * @param {array} path 
     */
    static placePaths(path) {
        const node = selection.items; //getting array of current paths
        //reset their pathData
        node.forEach(function (childNode, i) {
            if (path[i].error) {
                throw path[i].error + " - " + path[i].message;
            }
            childNode.pathData = path[i].path;
        });
    }

    /**
     * ESSENTIAL CALL TO THE API!
     * Call to tangencies 
     * Some minor error handling too, if the token is expired reset it and alert the user
     * 
     * @param {*} body original path!
     * @param {*} accuracy option selected
     */
    static async callToTangenciesApi(body) {
        //get api_token
        const api_token = this.api;
        //waiting for the request to complete
        let response = await fetch(this.endpoint, {
            method: "post",
            headers: {
                "Cache-Control": "no-cache",
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json"
            },
            body: "api_token=" + api_token + "&path=" + body + "&accuracy=10&angle=90",
        });
        const status = response.status;
        let error = response.statusText;
        //wait for the request to send a response and return it
        if (status == 200) {
            let data = await response.json();
            return data;
        } else {
            //a bit of error handling, when we process a f
            if ((status == 401) || (status == 402)) {
                await environment.set("api_token", "");
                error = "Unauthorised or expired. Check your token.";
            }

            let data = {
                "path": body,
                "error": status,
                "message": error,
            };
            return data;
        }

    }
}
module.exports = tangencies;