const {
    selection
} = require("scenegraph");
const commands = require("commands");
const environment = require('./storage-helper');

class offset {
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

    static async processData() {
        const dialog = this.getDialog();
        const settings = await dialog.showModal();
        if ((settings) && (settings !== "reasonCanceled")) {
            return this.getAllPath(settings);
        }
    }

    /**
     * Stroke processor for deciding which process to run
     * 
     * @param {*} selection 
     */
    static getAllPath(settings) {
        commands.ungroup();
        const selectedGrid = selection.items;
        //is more than one child - optimise
        //this is more of a hack, if it"s just one, but I think it"s due to the Promise.all() - which needs an iteration to resolve it
        // TODO: WHILE LOOP FOR GROUPING PROPERLY
        if (selectedGrid.length > 1) {
            let rand;
            do {
                commands.ungroup();
                commands.convertToPath();
                rand++;
            } while (rand < 4);
        }

        commands.convertToPath();
        const node = selection.items; //getting first node 
        let pathArray = new Array;

        node.forEach(function (childNode, i) {
            pathArray.push({
                path: childNode.pathData
            });
        });
        return this.getNewPaths(pathArray, settings);

    }

    /**
     * Creating view for the offset
     * 
     * @param {*} id 
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
          
                <input type="text" id="width" name="width"  value="10"/>
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
    <input type="text" id="limit" name="limit" disabled>
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
        //define variables
        const [form, submitButton, cancel, width, type, limit, original, position] = [`${sel} form`, "#submit", "#cancel", "#width", "#type", "#limit", "#original_path", "#position"].map(s => $(s));
        type.selectedIndex = 0;
        position.selectedIndex = 0;
        //populating the settings options that will be passed to be processed with the path at a later stage
        const submit = () => {

            //passing the full integer to resolve the closure
            let settings = {
                "width": width.value,
                "corner": type.value,
                "limit": limit.value,
                "original": original.checked,
                "position": position.value,
            };
            options.close(settings);

        }
        //adding event listeners to various elements
        //cancel button just closes the window
        cancel.addEventListener("click", () => {
            options.close();
        });
        //when the slider changes it calls the roundParameters method
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
        //on submit it submits the form 
        submitButton.addEventListener("click", e => {
            submit();
            e.preventDefault();
        });
        form.onsubmit = submit;

        return options;
    }
    

    static async getNewPaths(array, settings) {
        let newPaths = new Array; //array of said requests
        let object = this;
        array.forEach(async function (element) {
                newPaths.push(object.callToOffsetApi(element.path, settings));
         
        });

        return Promise.all(newPaths)
            .then(data => this.placePaths(data, settings.original, settings.position));
    }


    /**
     * Little cap type translator, since XD"s strokeEndCaps isn"t complying with API"s paramente
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
     * Similar to other complex path"s replacing methods, but allows to keep the properties of stroke data
     * By default the API uses the background colour of the path and not the stroke, we have to manually preserve stroke"s colours
     * 
     * @param {*} selection 
     * @param {*} path - response with path and colour
     */
    static placePaths(path, original = true, position = null) {
        const node = selection.items; //getting array of current paths
        //reset their pathData
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
 * Calling the offset API endpoints
 * 
 * @param {*} body path data
 * @param {*} setting data set out in the form
 */
static async callToOffsetApi(body, setting) {
    //get api_token
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
    //waiting for the request to complete
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

module.exports = offset;