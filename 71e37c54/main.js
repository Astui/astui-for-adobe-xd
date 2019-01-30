//defining const objects that we are pulling from scenegraph API
const {
    selection
} = require("scenegraph");
//kindly provided by Сameron, don't need to parse JSON, so leaving this as a string
const {
    storage
} = require("uxp");
const environment = require('./lib/storage-helper')
const commands = require("commands");

//setting/creating new api file


//defining the selection const
const $ = sel => document.querySelector(sel);

//alert message warning the user that nothing is selected.
let alertMessage;

/**
 * @NOTE: API RELATED 
 */

// (async function(){
//     const env = await environment.set("server", );
//     if (!env) {
//         await setEnv();
//     }
// })();

let spr = gettingEndpoints("spr");
let tangencies = gettingEndpoints("tangencies");
let validate = gettingEndpoints("validate");
let outline =  gettingEndpoints("outline");
let offset =  gettingEndpoints("offset");

async function gettingEndpoints(operation) {
    const url = await environment.get('server', 'https://astui.tech/api/v1/');
    return url + operation;
}

/**
 * ESSENTIAL CALL TO THE API
 * This checks the validity of the api token passed through
 * 
 * @param {} token - string
 */
async function checkAuth(token) {
    //doesn't handle any errors, handled by the dialogue.
    const authentication = await fetch(await validate, {
        method: "post",
        headers: {
            "Cache-Control": "no-cache",
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json"
        },
        body: "api_token=" + token,
    });
    let response = await authentication.json();

    return response;

}

/**
 * ESSENTIAL CALL TO THE API!
 * used to call our Smart Points Removal function
 * Some minor error handling too, if the token is expired reset it and alert the user
 *
 * @param {*} body original path!
 * @param {*} accuracy option selected
 */
async function sprCallToApi(body, accuracy) {
    //get api_token
    const api_token = await environment.get("api_token");
    const endpoint = await spr;
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
            await environment.set("api_token","");
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

/**
 * ESSENTIAL CALL TO THE API!
 * Call to tangencies function
 * Some minor error handling too, if the token is expired reset it and alert the user
 * 
 * @param {*} body original path!
 * @param {*} accuracy option selected
 */
async function callToTangenciesApi(body) {
    //get api_token
    const api_token = await environment.get('api_token');
    //waiting for the request to complete
    let response = await fetch(await tangencies, {
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
            await environment.set("api_token","");
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

/**
 * Calling the offset API endpoints
 * 
 * @param {*} body path data
 * @param {*} setting data set out in the form
 */
async function callToOffsetApi(body, setting) {
    //get api_token
    const api_token = await environment.get('api_token');
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
    let response = await fetch(await offset, {
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
            await environment.set("api_token","");
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

/**
 * Calling the outline stroke endpoint
 * 
 * @param {*} body 
 * @param {*} setting 
 */
async function callToOutlineStrokeApi(path) {

    //get api_token
    const api_token = await environment.get("api_token");
    const width = path.width;
    const cap = path.cap_type;
    const join = path.join_type;
    const mitre_limit = path.mitre_limit;
    const placement = path.placement;
    const offset = path.dash_offset;
    const dashes = path.dashes;

    let requestBody;
    //waiting for the request to complete
    if (dashes[0]) {
        if (!dashes[1]) {
            requestBody = "api_token=" + api_token + "&path=" + path.path + "&width=" + width + "&join_type=" + join + "&cap_type=" + cap + "&mitre_limit=" + mitre_limit + "&placement=" + placement + "&dash_offset=" + offset + "&dashes[0]=" + dashes[0] + "&dashes[1]=" + dashes[0];
        } else {

            requestBody = "api_token=" + api_token + "&path=" + path.path + "&width=" + width + "&join_type=" + join + "&cap_type=" + cap + "&mitre_limit=" + mitre_limit + "&placement=" + placement + "&dash_offset=" + offset + "&dashes[0]=" + dashes[0] + "&dashes[1]=" + dashes[1];
        }
    } else {
        requestBody = "api_token=" + api_token + "&path=" + path.path + "&width=" + width + "&join_type=" + join + "&cap_type=" + cap + "&mitre_limit=" + mitre_limit + "&placement=" + placement;
    }


    let response = await fetch(await outline, {
        method: "post",
        headers: {
            "Cache-Control": "no-cache",
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json"
        },
        body: requestBody,
    });
    const status = response.status;
    let error = response.statusText;

    //wait for the request to send a response and return it
    if (status == 200) {
        let data = await response.json();
        data = {
            "path": data.path,
            "color": path.color,
        };
        return data;
    } else {
        //a bit of error handling, when we process a f
        if ((status == 401) || (status == 402)) {
            await environment.set("api_token","");
            error = "Unauthorised or expired. Check your token.";
        }

        let data = {
            "path": path,
            "error": status,
            "message": error,
        };
        return data;
    }
}
/**
 *  @NOTE: VIEWS!!!! Dialogues etc.
 */

/**
 * Creating a modal dialog and setting the inserting api token into the file defined above
 *
 * @param {Creating a} id
 * @return the api token
 */
function insertApiKey(id = "api") {
    const sel = `#${id}`;
    let apiInput = document.querySelector(sel);

    if (apiInput) {
        return apiInput;
    }

    document.body.innerHTML = `
    <style>
    input[type="text"] {
        width: 400px;
    }
    #error {
        color: red;
        height: 15px;
        font-size: 12px;
    }
    .info_text {
        text-align: left;
        float: left;
        clear: both;
    }
    </style>
    <dialog id="${id}">
        <form method="dialog">
            <h1>Astui API Token</h1>
            <label>
                <span>Insert your Astui API token:</span>
                <input type="text" id="api_token" />
                <div id="error"></div>
                <div class="info_text">
                <p>Don't have an Astui API Token? <a href="https://dev.astui.astute.graphics" target=_"blank">Get one here.</a></p>
                </div>
                <footer>
            </label>
       
                <button type="submit" id="submit" uxp-variant="cta">Apply</button>
            </footer>
        </form>
    </dialog>

    `;
    apiInput = document.querySelector(sel);

    const [form, submitButton, token, error] = [`${sel} form`, "#submit", "#api_token", "#error"].map(s => $(s));
    //defining different behaviours for each of the actionable fields
    const submit = () => {
        return checkAuth(token.value)
            .then(response => {
                if (response.message == "Authenticated") {
                    error.textContent = "";
                    return apiInput.close(token.value);

                } else {

                    error.textContent = "Sorry, Astui API token invalid.";
                }
            }).catch(function (err) {
                err.textContent = "";
                return apiInput.close(token.value);
            });

    }
    token.addEventListener("change", e => {
        e.preventDefault();
    });

    apiInput.addEventListener("keydown", e => {
        if (e.keyCode == 27) {
            e.preventDefault();
            apiInput.close("n/a");
        }
        if (e.keyCode == 13) {
            e.preventDefault();
            apiInput.close(token.value);
        }
    });
    submitButton.addEventListener("click", e => {
        submit();
        e.preventDefault();
    });
    form.onsubmit = submit;
    return apiInput;
}

/**
 * This method creates a ui for a dialog that alerts the user that the have to set settings for Smart Point Removal (SPR). It's not really clean
 * it combines HTML and JS together and could be written better. This exists to show multiple ways of handling the ui
 * 
 * @param {string} id
 */
function createOptions(id = "options") {
    // cache.appLocalCache = "token";

    const sel = `#${id}`;
    let options = document.querySelector(sel);
    //if the dialogue already exists, don't do anything and return
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
             <div class="hint padding">Hint: a minimum tolerance of 1 maintains the path shape but removes very few points. The maximum tolerance of 100 removes many more points but can distort the shape. Try starting with a tolerance of 30 for good results.
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
        roundParameters(accuracy);
        e.preventDefault();
    });
    //on submit it submits the form 
    submitButton.addEventListener("click", e => {
        submit();
        e.preventDefault();
    });
    form.onsubmit = submit;

    return options;
}

/**
 * Creating view for the offset
 * 
 * @param {*} id 
 */
function offsetDialogue(id = "offset") {

    const sel = `#${id}`;
    let options = document.querySelector(sel);
    //if the dialogue already exists, don't do anything and return
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
            "width": Math.round(width.value),
            "corner": type.value,
            "limit": Math.round(limit.value),
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


/**
 * Creating and alert message that nothing is selected.
 *  This uses JS instead of HTML injection
 */
function createAlert(error) {
    if (alertMessage == null) {
        //create the bar
        alertMessage = document.createElement("dialog");
        //create content with h1 element
        const text = document.createElement("h1");
        text.textContent = "Alert!";
        alertMessage.appendChild(text);
        const message = document.createElement("p");
        message.textContent = error;
        message.style.padding = "20px 0";

        alertMessage.appendChild(message);
        let footer = document.createElement("footer");
        alertMessage.appendChild(footer);
        //  include at least one way to close the dialog
        let closeButton = document.createElement("button");
        closeButton.uxpVariant = "cta";
        closeButton.textContent = "Got It!";
        closeButton.onclick = (e) => alertMessage.close();
        footer.appendChild(closeButton);

    }
    return alertMessage;
}

/**
 *  @NOTE: LOGIC, all the path related processes 
 */

/**
 * Processing the complex and simple paths
 *
 * @param {*} selection
 * @param {*} value
 */
function tangenciesProcessor() {

    commands.ungroup();
    const selectedGrid = selection.items;
    //is more than one child - optimise
    //this is more of a hack, if it's just one, but I think it's due to the Promise.all() - which needs an iteration to resolve it
    // TODO: WHILE LOOP FOR GROUPING PROPERLY
    if (selectedGrid.length > 1) {
        let rand;
        do {
            commands.convertToPath();
            commands.ungroup();
            rand++;
        } while (rand < 4);

        let paths = getPathData();
        return sendComplexTangencies(paths);
    } else {

        commands.convertToPath();
        return sendSimpleTangencies();
    }
}

/**
 * Processor for offset paths
 * 
 * @param {*} selection 
 * @param {*} setting 
 */
function offsetProcessor(setting) {

    commands.ungroup();
    const selectedGrid = selection.items;
    //is more than one child - optimise
    //this is more of a hack, if it's just one, but I think it's due to the Promise.all() - which needs an iteration to resolve it
    // TODO: WHILE LOOP FOR GROUPING PROPERLY
    if (selectedGrid.length > 1) {
        let rand;
        do {
            commands.convertToPath();
            commands.ungroup();
            rand++;
        } while (rand < 4);

        let paths = getPathData();
        return sendComplexOffset(setting, paths);
    } else {

        commands.convertToPath();
        return sendSimpleOffset(setting);
    }
}
/**
 * processing tangencies
 */
function sendComplexTangencies(array) {
    let newPaths = new Array; //array of said requests
    array.forEach(async function (element) {
        newPaths.push(callToTangenciesApi(element.path));
    });
    //modifications to the sceneGraph have to be async (plus it's an async request anyway, returning a promise)
    //that sends a further array to placeMultiplePaths method
    return Promise.all(newPaths)
        .then(data => placeMultiplePaths(data))
        .catch(function (error) {
            document.body.appendChild(createAlert("Astui returned: " + error)).showModal();
        });
}

/**
 * Single path optimisation, populates a string that is then processed via API
 * 
 * @param {*} selection - selection of elements
 * @param {*} optionSetting - the integer passed in
 */
async function sendSimpleOffset(setting) {
    //path data is an array of all selected items on the screen
    let selectedItems = selection.items;
    // selectedItems.ungroup();
    //path data letiable, ensuring it"s an empty string
    let pathData = "";
    //concattenating a string out of all selected elemets' path information
    selectedItems.forEach(function (element) {
        pathData += element.pathData;
    });
    //running the request to the server
    return callToOffsetApi(pathData, setting)
        .then(data => redrawPath(data, setting.original, setting.position))
        .catch(function (error) {
            document.body.appendChild(createAlert("Astui returned: " + error)).showModal();
        });

}

/**
 * Simple stroke path getting
 * getting the needed properties for the call 
 * 
 * @param {*} selection 
 */
async function sendSimpleStroke() {
    //path data is an array of all selected items on the screen
    let selectedItems = selection.items;
    // selectedItems.ungroup();
    //path data letiable, ensuring it"s an empty string
    let pathData = {};
    //concatenating a string out of all selected element's path information
    //getting data that is needed for the processors
    selectedItems.forEach(function (element) {
        if (element.strokeEnabled) {
            pathData.width = element.strokeWidth,
                pathData.cap_type = capTypeSetter(element.strokeEndCaps),
                pathData.join_type = element.strokeJoins,
                pathData.mitre_limit = element.strokeMiterLimit,
                pathData.dashes = element.strokeDashArray,
                pathData.dash_offset = element.strokeDashOffset,
                pathData.placement = defineStrokePlacementNameForApi(element.strokePosition),
                pathData.path = element.pathData,
                pathData.color = element.stroke;
        }
    });
    if (pathData.path) {
        //running the request to the server
        return callToOutlineStrokeApi(pathData)
            .then(data => redrawFromStrokes(data))
            .catch(function (error) {
                document.body.appendChild(createAlert("Astui returned: " + error)).showModal();
            });

    } else {
        document.body.appendChild(createAlert("Astui returned: No strokes detected")).showModal();
    }

}

/**
 * Little cap type translator, since XD's strokeEndCaps isn't complying with API's paramente
 */
function capTypeSetter(capType) {
    if (capType == "square") {
        return "projecting";
    } else {
        return capType;
    }
}
/**
 * Multiple paths stroke processing
 * 
 * @param {*} selection 
 * @param {*} array 
 */
function sendComplexStroke(array) {
    let newPaths = new Array; //array of said requests
    array.forEach(async function (element) {
        if (element.stroke == "present") {
            newPaths.push(callToOutlineStrokeApi(element));
        } else {
            newPaths.push({
                path: element.path,
                color: element.color,
            });
        }

    });
    //modifications to the sceneGraph have to be async (plus it's an async request anyway, returning a promise)
    //that sends a further array to placeMultiplePaths method
    return Promise.all(newPaths)
        .then(data => placeMultipleStrokes(data))
        .catch(function (error) {
            document.body.appendChild(createAlert("Astui returned: " + error)).showModal();
        });
}

/**
 * Processing multiple paths with the current settings
 * 
 * @param {} selection 
 * @param {*} settings 
 * @param {*} array 
 */
function sendComplexOffset(settings, array) {
    let newPaths = new Array; //array of said requests
    array.forEach(async function (element) {
        newPaths.push(callToOffsetApi(element.path, settings));
    });
    //modifications to the sceneGraph have to be async (plus it's an async request anyway, returning a promise)
    //that sends a further array to placeMultiplePaths method
    return Promise.all(newPaths)
        .then(data => placeMultiplePaths(data, settings.original, settings.position))
        .catch(function (error) {
            document.body.appendChild(createAlert("Astui returned: " + error)).showModal();
        });
}


/**
 * Single tangencies 
 * 
 * @param {*} selection 
 * @param {*} settings 
 */
async function sendSimpleTangencies(settings) {
    //path data is an array of all selected items on the screen
    let selectedItems = selection.items;
    //path data letiable, ensuring it"s an empty string
    let pathData = "";
    //concatenating a string out of all selected elemets' path information
    selectedItems.forEach(function (element) {
        pathData += element.pathData;
    });

    //running the request to the server
    return callToTangenciesApi(pathData, settings)
        .then(data => redrawPath(data))
        .catch(function (error) {
            document.body.appendChild(createAlert("Astui returned: " + error)).showModal();
        });

}


/**
 * Deciding what methods to apply for SPR
 *
 * @param {*} selection
 * @param {*} value
 */
function getAllPath(value) {

    commands.ungroup();
    const selectedGrid = selection.items;
    //is more than one child - optimise
    //this is more of a hack, if it's just one, but I think it's due to the Promise.all() - which needs an iteration to resolve it
    // TODO: WHILE LOOP FOR GROUPING PROPERLY
    if (selectedGrid.length > 1) {
        let rand;
        do {
            commands.ungroup();
            commands.convertToPath();
            rand++;
        } while (rand < 4);

        let paths = getPathData();
        return redrawComplexPath(paths, value);
    } else {
        commands.convertToPath();
        return optimise(value);
    }
}
/**
 * Single path optimisation, populates a string that is then processed via API
 * 
 * @param {*} selection - selection of elements
 * @param {*} optionSetting - the integer passed in
 */
async function optimise(optionSetting) {
    //path data is an array of all selected items on the screen
    let selectedItems = selection.items;
    // selectedItems.ungroup();
    //path data letiable, ensuring it"s an empty string
    let pathData = "";
    //concatenating a string out of all selected elemets' path information
    selectedItems.forEach(function (element) {
        pathData += element.pathData;
    });

    //running the request to the server
    return sprCallToApi(pathData, optionSetting)
        .then(data => redrawPath(data))
        .catch(function (error) {
            document.body.appendChild(createAlert("Astui returned: " + error)).showModal();
        });

}

/**
 * Redrawing elements once the API returned the data
 * 
 * @param {*} selection 
 * @param {*} data 
 */
function redrawFromStrokes(data) {
    commands.convertToPath();
    selection.items.forEach(function (element) {
        if (data.error) {
            throw data.error + " - " + data.message;
        }
        element.pathData = data.path;
        element.fillEnabled = true;
        element.fill = data.color;
        element.strokeEnabled = false;
    });
}
/**
 * One string reset.
 * 
 * @param {*} selection - still the same selection element.
 * PLEASE DO NOT PASS ANYTHING ELSE IF YOU WANT TO REDRAW THE ORIGINAL PATH
 * 
 * @param {*} data - path data that has been optimised
 * @param {*} original - indication if we keep the original path or not
 * @param {*} position - if we keep the original path, how do we place it 
 */
function redrawPath(data, original = true, position = null) {
    //need to loop through each selected element and reset the pathData property
    if (original === true) {
        selection.items.forEach(function (element) {

            if (data.error) {
                throw data.error + " - " + data.message;
            }
            element.pathData = data.path;
        });
    } else {

        commands.duplicate();
        if (position == "below") {
            commands.sendBackward();
            selection.items[0].pathData = data.path;
        }
        if (position == "above") {
            commands.bringForward();
            selection.items[0].pathData = data.path;
        }


    }
}



/**
 * Getting selection data from multiple paths and populating an array for further requests
 * 
 * @param {*} selection
 */
function getPathData() {
    const node = selection.items; //getting first node child and getting all of the containing paths
    let pathArray = new Array;
    // populate array with paths strings
    node.forEach(function (childNode, i) {

        pathArray.push({
            path: childNode.pathData,
        });
    });
    return pathArray;
}

/**
 * @TODO: OPTIMISE!
 * 
 * Getting data from strokes is slightly more complex, this surely needs to be optimised, but currently we're building arrays with paths and other parameters
 * ensuring that all paths are processed
 * 
 * @param {*} selection 
 */
function getPathDataStroke() {
    const node = selection.items; //getting first node child and getting all of the containing paths
    let pathArray = new Array;
    // populate array with paths strings
    node.forEach(function (childNode, i) {
        if (childNode.strokeEnabled) {
            pathArray.push({
                path: childNode.pathData,
                width: childNode.strokeWidth,
                cap_type: capTypeSetter(childNode.strokeEndCaps),
                mitre_limit: childNode.strokeMiterLimit,
                dash_offset: childNode.strokeDashOffset,
                join_type: childNode.strokeJoins,
                dashes: childNode.strokeDashArray,
                color: childNode.stroke,
                placement: defineStrokePlacementNameForApi(childNode.strokePosition),
                stroke: "present",

            });
        } else {
            pathArray.push({
                path: childNode.pathData,
                color: childNode.fill,
                stroke: "none",
            });
        }
    });
    return pathArray;
}

/**
 * Another definition translator from XD terminology to Astui API
 * 
 * @param {*} stroke 
 */
function defineStrokePlacementNameForApi(stroke) {

    let newStroke = '';
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
 * Redraws the paths by creating an array of fetch request with current data.
 * returns a Promise.all() -> which means that it won't proceed with other methods until the promises/requests are resolved.
 * 
 * @param {*} selection
 * @param {*} array
 * @param {*} value
 */
function redrawComplexPath(array, value) {
    let newPaths = new Array; //array of said requests
    array.forEach(async function (element) {
        newPaths.push(sprCallToApi(element.path, value));

    });
    //modifications to the sceneGraph have to be async (plus it's an async request anyway, returning a promise)
    //that sends a further array to placeMultiplePaths method
    return Promise.all(newPaths)
        .then(data => placeMultiplePaths(data))
        .catch(function (error) {
            document.body.appendChild(createAlert("Astui returned: " + error)).showModal();
        });
}

/**
 * Similar to other complex path's replacing methods, but allows to keep the properties of stroke data
 * By default the API uses the background colour of the path and not the stroke, we have to manually preserve stroke's colours
 * 
 * @param {*} selection 
 * @param {*} path - response with path and colour
 */
function placeMultipleStrokes(path) {

    commands.convertToPath();
    const node = selection.items;

    node.forEach(function (childNode, i) {

        if (path[i].error) {
            throw path[i].error + " - " + path[i].message;
        }
        childNode.pathData = path[i].path;
        childNode.strokeEnabled = false;
        childNode.fillEnabled = true;
        childNode.fill = path[i].color;

    });
}
/**
 * Redrawing multiple paths on the sceneGraph, similar to the single path's method
 * 
 * @param {*} selection
 * @param {*} path
 * @param {boolean} original 
 * @param {*} position  
 */
function placeMultiplePaths(path, original = true, position) {
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
 * @NOTE: Initialisation functions
 */

/**
 * Rounding the float to an int and printing it in the representative div
 * 
 * @param {float} value
 */
function roundParameters(value) {
    const inputText = document.getElementById("tolerance_value");
    inputText.textContent = Math.round(value.value);
}

/**
 * Creating the dialog and calling optimisation method
 * 
 * @param  {[type]} selection
 */
async function selectionInit() {

    //calling async createOptions method
    const dialog = createOptions();

    try {
        //waiting for the dialog to close and provide with accuracy value if said is set
        const r = await dialog.showModal();
        if ((r) && (r !== "reasonCanceled")) {
            //need to return a promise, returning a paths calculation method
            return getAllPath(r);
        }
    } catch (err) {
        console.log("ESC dismissed dialog", +err);
    }
}
/**
 * Stroke processor for deciding which process to run
 * 
 * @param {*} selection 
 */
function strokeProcessor() {
    const commands = require("commands");
    commands.ungroup();
    const selectedGrid = selection.items;
    //is more than one child - optimise
    //this is more of a hack, if it's just one, but I think it's due to the Promise.all() - which needs an iteration to resolve it
    // TODO: WHILE LOOP FOR GROUPING PROPERLY
    if (selectedGrid.length > 1) {
        let rand;
        do {
            commands.ungroup();
            rand++;
        } while (rand < 4);

        let paths = getPathDataStroke();
        return sendComplexStroke(paths);
    } else {

        return sendSimpleStroke();
    }
}


/**
 * Creating offset dialog
 * @param {*} selection 
 */
async function otherSelection() {
    const dialog = offsetDialogue();

    try {
        //waiting for the dialog to close and provide with accuracy value if said is set
        const r = await dialog.showModal();
        if ((r) && (r !== "reasonCanceled")) {
            //need to return a promise, returning a paths calculation method
            return offsetProcessor(r);
        }
    } catch (err) {
        console.log("ESC dismissed dialog", +err);
    }

}
/**
 * Checking if there is an API token in settings and prompting the user if not
 * @param  {[type]} selection
 * @return {[type]} promise
 */
async function apiCheckSpr() {

    if (selection.items[0] == null) {
        document.body.appendChild(createAlert("Oh no! You haven't selected anything.")).showModal();
    } else {
        const apiCheck = await environment.get("api_token");
        if ((!apiCheck) || (apiCheck == 'n/a')) {
            return createApiDialogue();
        } else {
            return await selectionInit();
        }
    }
}
/**
 * checking the need to create the api dialogue and if nothing is set doesn't allow further processes to show
 * @param {*} selection 
 */
async function createApiDialogue() {
    const dialog = insertApiKey();

    //waiting for the dialog to close and provide with accuracy value if said is set
    const r = await dialog.showModal();
    if (r !== "n/a") {
        await environment.set("api_token", r);
        return await selectionInit();
    }
}

/**
 * Check the api token for tangencies call
 * @param  {[type]} selection
 * @return {[type]}
 */
async function apiCheckTangencies() {
    if (selection.items[0] == null) {
        document.body.appendChild(createAlert("Oh no! You haven't selected anything.")).showModal();
    } else {
        const apiCheck = await environment.get("api_token");
        if ((!apiCheck) || (apiCheck == 'n/a')) {
            const dialog = insertApiKey();
            try {
                //waiting for the dialog to close and provide with accuracy value if said is set
                const r = await dialog.showModal();
                if (r) {
                    await environment.set("api_token", r);
                    return await tangenciesProcessor();
                }
            } catch (err) {
                console.log("ESC dismissed dialog", +err);
            }
        } else {
            return await tangenciesProcessor();
        }
    }

}

/**
 * Checking whether the API key is set before attempting to run processes
 * 
 * @param {*} selection 
 */
async function apiCheckStroke() {
    if (selection.items[0] == null) {
        document.body.appendChild(createAlert("Oh no! You haven't selected anything.")).showModal();
    } else {
        const apiCheck = await environment.get("api_token");
        if ((!apiCheck) || (apiCheck == 'n/a')) {
            const dialog = insertApiKey();
            try {
                //waiting for the dialog to close and provide with accuracy value if said is set
                const r = await dialog.showModal();
                if (r) {
                    await environment.set("api_token", r);
                    return await strokeProcessor();
                }
            } catch (err) {
                console.log("ESC dismissed dialog", +err);
            }
        } else {
            return await strokeProcessor();
        }
    }
}

/**
 * Checking whether API key is valid for offset operation
 * 
 * @param {*} selection 
 */
async function apiCheckOffset() {
    if (selection.items[0] == null) {
        document.body.appendChild(createAlert("Oh no! You haven't selected anything.")).showModal();
    } else {

        const apiCheck = await environment.get("api_token");
        if ((!apiCheck) || (apiCheck == 'n/a')) {
            return createOtherApiDialog();
        } else {
            return await otherSelection();
        }
    }
}

/**
 * Creating API dialog and if the key exists and not n/a creates  the next operations dialog
 * 
 * @param {*} selection 
 */
async function createOtherApiDialog() {
    const dialog = insertApiKey();

    //waiting for the dialog to close and provide with accuracy value if said is set
    const r = await dialog.showModal();
    if (r !== "n/a") {
        await environment.set("api_token", r);
        return await otherSelection();
    }
}

module.exports = {
    commands: {
        optionLoad: apiCheckSpr,
        moveTangencies: apiCheckTangencies,
        outlineStroke: apiCheckStroke,
        offsetPath: apiCheckOffset,
    }
}