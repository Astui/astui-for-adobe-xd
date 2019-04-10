const {
    selection
} = require("scenegraph");
const commands = require("commands");
const environment = require('./storage-helper');

class offset {

    /**
     * Setting API token that acts as the authentication for this request
     * @param {string} api 
     */
    static async setToken(api) {
        this.api = api;
    }

    /**
     * Setting endpoint for this operation of the API
     * @param {string} endpoint - full address
     */
    static async setEndpoint(endpoint) {
        this.endpoint = endpoint;

    }

    /**
     * Initiating the UI dialogue for getting values from the user then proceeding with the data if the dialog isn't dismissed
     */
    static async processData() {
        const dialog = this.getDialog();
        const settings = await dialog.showModal();
        if ((settings) && (settings !== "reasonCanceled")) {
            return this.getAllPath(settings);
        }
    }

    /**
     * Creating the UI itself.
     * Allows user to input the needed parameters: the width, type (Miter, Round, Bevel), limit if the type is Miter and Whether the operation should keep the original path. 
     * This gets returned when the dialog is submitted
     * The last selected value is remains in the dialog window
     * 
     */
    static getDialog(id = "offset") {

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
        width: 220px;
    }
    input {
        font-size: 10px;
        width: 50px;
    }
</style>
<dialog id="${id}">
    <form method="dialog">
        <h1>Offset Path</h1>
        <hr>
        <div class="row">
            <div class="column">
            <label for="width">
                <span>Width:</span>
            </label>
          
                <input type="number" id="width" name="width"  value="10"/>
            </div>

            <div class="column">
        <label>
    <span>Corner:</span>
    <select id="type">
        <option value="miter">Miter</option>
        <option value="round">Round</option>
        <option value="bevel">Bevel</option>
    </select>
    </label>
    </div>
    <div class="column">
    <label>
    <span>Limit</span>
    <input type="number" id="limit" name="limit" disabled>
    </label>
    </div>
    </div>
    <hr>
    <label class="row">
    <span>Position Result</span>
    <select id="position">
        <option value="above">Above</option>
        <option value="below">Below</option>
    </select>
    </label>
    <label class="row">
    <input type="checkbox" name="original_path" id="original_path" checked="true"/>
    <span>Remove original path</span>
    </label>
    
        <footer>
            <button id="cancel">Cancel</button>
            <button type="submit" id="submit" uxp-variant="cta">Apply</button>
        </footer>
    </form>
</dialog>
`;

        options = document.querySelector(sel);
        const [form, submitButton, cancel, width, type, limit, original, position] = [`${sel} form`, "#submit", "#cancel", "#width", "#type", "#limit", "#original_path", "#position"].map(s => $(s));
        type.selectedIndex = 0;
        position.selectedIndex = 0;
        const submit = () => {

            let settings = {
                "width": width.value,
                "corner": type.value,
                "limit": limit.value,
                "original": original.checked,
                "position": position.value,
            };
            options.close(settings);

        };
        cancel.addEventListener("click", () => {
            options.close();
        });
        width.addEventListener("change", e => {
            e.preventDefault();
        });
        if (type.value == "miter") {
            limit.disabled = false;
            limit.value = 20;
        }

        type.addEventListener("change", e => {
            e.preventDefault();
            if (type.value == "miter") {
                limit.disabled = false;
                limit.value = 20;
            } else {

                limit.disabled = true;
                limit.value = "";
            }
        });
        submitButton.addEventListener("click", e => {
            submit();
            e.preventDefault();
        });
        form.onsubmit = submit;

        return options;
    }


    /**
     * Gathers all selected items into an array of objects that is used to be processed
     * 
     * @param {*} selection 
     */
    static getAllPath(settings) {

        const node = selection.items; 
        let pathArray = new Array;

        node.forEach(function (childNode, i) {
            pathArray.push({
                path: childNode.pathData
            });
        });
        return this.getNewPaths(pathArray, settings);
    }

    /**
     * This will allow us to process each of the available paths with the API calls
     * This also passes user defined values from the UI
     * Resolves all requests via Promises and sends the response object to redraw paths method.
     * 
     * @param {*} array 
     * @param {*} settings 
     */
    static async getNewPaths(array, settings) {
        let newPaths = new Array;
        let object = this;
        array.forEach(async function (element) {
            newPaths.push(object.callToOffsetApi(element.path, settings));

        });

        return Promise.all(newPaths)
            .then(data => this.placePaths(data, settings.original, settings.position));
    }


    /**
     * Little cap type translator, since XD"s strokeEndCaps isn"t complying with API's parameter
     */
    static capTypeSetter(capType) {
        if (capType == "square") {
            return "projecting";
        } else {
            return capType;
        }
    }

    /**
     * Another definition translator from XD terminology to Astui API
     * 
     * @param {*} stroke 
     */
    static defineStrokePlacementNameForApi(stroke) {

        let newStroke = "";
        switch (stroke) {
            case "outside":
                newStroke = "outset";
                break;
            case "inside":
                newStroke = "inset";
                break;
            case "center":
                newStroke = "centered";
                break;
            case "miter":
                newStroke = "mitre";
                break;

        }
        return newStroke;

    }

    /**
     * Replacing selected object paths with the newly processed paths from the API, allows to keep the properties of stroke data
     * By default the API uses the background colour of the path and not the stroke, we have to manually preserve stroke's colours
     * This also preserves (duplicates) or removes the original paths, depending on the user selection from the UI.
     * 
     * @param {*} selection 
     * @param {*} path - response with path and colour
     */
    static placePaths(path, original = true, position = null) {
        const node = selection.items;
        if (original === true) {
            node.forEach(function (childNode, i) {
                if (path[i].error) {
                    throw path[i].error + " - " + path[i].message;
                }
                childNode.pathData = path[i].path;
            });
        } else {

            const commands = require("commands");
            commands.duplicate();
            node.forEach(function (childNode, i) {
                if (path[i].error) {
                    throw path[i].error + " - " + path[i].message;
                }

                if (position == "below") {
                    commands.sendBackward();
                    childNode.pathData = path[i].path;
                }
                if (position == "above") {
                    commands.bringForward();
                    childNode.pathData = path[i].path;
                }
            });
        }
    }

    /**
     * API Call using user defined properties, current path information and array of points to be affected, if the call is unsuccessful and has an error
     * it builds error information into the object's response with the current path, so no artwork disappears
     * 
     * @param {*} body path data
     * @param {*} setting data set out in the form
     */
    static async callToOffsetApi(body, setting) {
        const api_token = await environment.get("api_token");
        const width = setting.width;
        const cornerType = setting.corner;
        const limit = setting.limit;
        let content;
        if (limit) {
            content = "api_token=" + api_token + "&path=" + body + "&offset=" + width + "&join_type=" + cornerType + "&mitre_limit=" + limit;
        } else {
            content = "api_token=" + api_token + "&path=" + body + "&offset=" + width + "&join_type=" + cornerType;
        }
        let response = await fetch(this.endpoint, {
            method: "post",
            headers: {
                "Cache-Control": "no-cache",
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json"
            },
            body: content,
        });
        const status = response.status;
        let error = response.statusText;
        if (status == 200) {
            let data = await response.json();
            return data;
        } else {
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

module.exports = offset;