const {
    selection
} = require("scenegraph");
const environment = require('./storage-helper');

class smartPointRemoval {

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
     * Rounding the float to an int and printing it in the representative div
     * 
     * @param {float} value
     */
    static roundParameters(value) {
        const inputText = document.getElementById("tolerance_value");
        inputText.textContent = Math.round(value.value);
    }

    /**
     * Creating the dialog and calling optimisation method
     * 
     * @param  {[type]} selection
     */
    static async processData() {

        //calling async createOptions method
        const dialog = this.getDialog();

        //waiting for the dialog to close and provide with accuracy value if said is set
        const r = await dialog.showModal();
        if ((r) && (r !== "reasonCanceled")) {
            //need to return a promise, returning a paths calculation method
            return this.getAllPath(r);
        }

    }
    /**
     * This method creates a ui for a dialog that alerts the user that the have to set settings for Smart Point Removal (SPR). It"s not really clean
     * it combines HTML and JS together and could be written better. This exists to show multiple ways of handling the ui
     * 
     * @param {string} id
     */
    static getDialog(id = "options") {
        // cache.appLocalCache = "token";

        //defining the selection const
        const $ = sel => document.querySelector(sel);
        const sel = `#${id}`;
        let options = document.querySelector(sel);
        //if the dialogue already exists, don"t do anything and return
        if (options) {
            return options;
        }
        //create your elements
        document.body.innerHTML = `
<style>
    ${sel} form {
        width: 300px;
    }
    .hint {
        margin-top: 10px;
        font-size: 10px;
    }
    .padding {
        padding-left: 5px;
    }
</style>
<dialog id="${id}">
    <form method="dialog">
        <h1>Smart Point Remove</h1>
        <label>
            <span>Set your Smart Point Removal tolerance:</span>
            <input type="range" min="1" max="100" value="15" id="accuracy" />
            <div class="padding">
             <div id="tolerance_value">15</div>
             </div>
             <div class="hint padding">Hint: a minimum tolerance of 1 maintains the path shape but removes very few points. The maximum tolerance of 100 removes many more points but can distort the shape. Try starting with a tolerance of 15 for good results.
            </div>
        </label>
        <footer>
            <button id="cancel">Cancel</button>
            <button type="submit" id="submit" uxp-variant="cta">Apply</button>
        </footer>
    </form>
</dialog>
`;

        options = document.querySelector(sel);
        //define variables
        const [form, submitButton, cancel, accuracy] = [`${sel} form`, "#submit", "#cancel", "#accuracy"].map(s => $(s));
        //create a submit function
        const submit = () => {
            //passing the full integer to resolve the closure
            options.close(Math.round(accuracy.value));

        }
        //adding event listeners to various elements
        //cancel button just closes the window
        cancel.addEventListener("click", () => {
            options.close();
        });
        //when the slider changes it calls the roundParameters method
        accuracy.addEventListener("input", e => {
            this.roundParameters(accuracy);
            e.preventDefault();
        });
        //on submit it submits the form 
        submitButton.addEventListener("click", e => {
            submit();
            e.preventDefault();
        });

        form.addEventListener("submit", e => {
            dialog.close(input.value);
            e.preventDefault();
        });

        return options;
    }

    /**
     * Deciding what methods to apply for SPR
     *
     * @param {*} selection
     * @param {*} tolerance
     */
    static getAllPath(tolerance) {

        //build array of objects with paths and points
        const node = selection.items; //getting first node 
        let pathArray = new Array;

        node.forEach(function (childNode, i) {
            pathArray.push({
                path: childNode.pathData
            });
        });
        return this.getNewPaths(pathArray, tolerance);
    }


    /**
     * Redraws the paths by creating an array of fetch request with current data.
     * returns a Promise.all() -> which means that it won"t proceed with other methods until the promises/requests are resolved.
     * 
     * @param {*} selection
     * @param {*} array
     * @param {*} value
     */
    static getNewPaths(origPaths, tolerance) {
        let newPaths = new Array; //array of said requests
        let object = this;
        origPaths.forEach(async function (element) {
            newPaths.push(object.sprCallToApi(element.path, tolerance));

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
     * used to call our Smart Points Removal function
     * Some minor error handling too, if the token is expired reset it and alert the user
     *
     * @param {*} body original path!
     * @param {*} accuracy option selected
     */
    static async sprCallToApi(body, accuracy) {
        //get api_token
        const api_token = this.api;
        const endpoint = this.endpoint;
        //waiting for the request to complete
        let response = await fetch(endpoint, {

            method: "post",
            headers: {
                "Cache-Control": "no-cache",
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json"
            },
            body: "api_token=" + api_token + "&path=" + body + "&tolerance=" + accuracy + "&decimal=1",
        });
        const status = response.status;
        let error = response.statusText;


        // error handling, if the status is ok resolve with a new path
        // reslving to the original with error details if not
        if (status == 200) {
            let data = await response.json();
            return data;
        } else {
            if ((status == 401) || (status == 402)) {
                //expired and unauthed errors, need the file to be writable, hence setting it to nothing
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

module.exports = smartPointRemoval;