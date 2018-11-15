//defining const objects that we are pulling from scenegraph API
const {
    scenegraph,
    Path
} = require("scenegraph");
//kindly provided by Сameron, don't need to parse JSON, so leaving this as a string
const {
    storage
} = require('uxp');
const {
    localFileSystem: fs
} = storage;

const API_FILE = 'api.json'; //path to settings file
//setting/creating new api file
const setApiToken = function (input = 'n/a') {
    return fs
        .getDataFolder()
        .then(folder => folder.createEntry(API_FILE, {
            overwrite: true
        }))
        .then(file => file.write(input))
        .catch(function (error) {
            console.log("Token setting" + error);
        });
};
//getting the contents of the api file
const getApiToken = function () {
    return fs
        .getDataFolder()
        .then(folder => folder.getEntry(API_FILE))
        .then(file => file.read())
        .catch(function (error) {
            console.log("Token getting " + error);
        });
};

//defining the selection const
const $ = sel => document.querySelector(sel);

//alert message warning the user that nothing is selected.
let alertMessage;

/**
 * @NOTE: API RELATED 
 */

const spr = "https://astui.tech/api/v1/spr";
const tangencies = "https://astui.tech/api/v1/tangencies";
const validate = "https://astui.tech/api/v1/validate";

/**
 * ESSENTIAL CALL TO THE API
 * This checks the validity of the api token passed through
 * @param {} token - string
 */
async function checkAuth(token) {
    //doesn't handle any errors, handled by the dialogue.
    const authentication = await fetch(validate, {
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
    const api_token = await getApiToken();

    //waiting for the request to complete
    let response = await fetch(spr, {
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
            await setApiToken();
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
    const api_token = await getApiToken();
    //waiting for the request to complete
    let response = await fetch(tangencies, {
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
            await setApiToken();
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
                <p>Don't have an Astui API Token? <a href="https://astui.tech" target=_"blank">Get one here.</a></p>
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
            apiInput.close('n/a');
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
        font-size: 10px;
    }
</style>
<dialog id="${id}">
    <form method="dialog">
        <h1>Smart Point Remove</h1>
        <label>
            <span>Set your Smart Point Removal tolerance:</span>
            <input type="range" min="1" max="100" value="30" id="accuracy" />
            <div>
             <div id="tolerance_value">30</div>
             </div>
             <div class="hint">Hint: a minimum tolerance of 1 maintains the path shape but removes very few points. The maximum tolerance of 100 removes many more points but can distort the shape. Try starting with a tolerance of 30 for good results.
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
    accuracy.addEventListener("change", e => {
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
function tangenciesProcessor(selection) {

    const commands = require("commands");
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

        let paths = getPathData(selection);
        return sendComplexTangencies(selection, paths);
    } else {

        commands.convertToPath();
        return sendSimpleTangencies(selection);
    }
}
/**
 * processing tangencies
 */
function sendComplexTangencies(selection, array) {
    let newPaths = new Array; //array of said requests
    array.forEach(async function (element) {
        newPaths.push(callToTangenciesApi(element.path));
    });
    //modifications to the sceneGraph have to be async (plus it's an async request anyway, returning a promise)
    //that sends a further array to placeMultiplePaths method
    return Promise.all(newPaths)
        .then(data => placeMultiplePaths(selection, data))
        .catch(function (error) {
            document.body.appendChild(createAlert("Astui returned: " + error)).showModal();
        });
}

/**
 * Single path optimisation, populates a string that is then processed via API
 * @param {*} selection - selection of elements
 * @param {*} optionSetting - the integer passed in
 */
async function sendSimpleTangencies(selection) {
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
    return callToTangenciesApi(pathData)
        .then(data => redrawPath(selection, data))
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
function getAllPath(selection, value) {
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
            commands.convertToPath();
            rand++;
        } while (rand < 4);

        let paths = getPathData(selection);
        return redrawComplexPath(selection, paths, value);
    } else {
        commands.convertToPath();
        return optimise(selection, value);
    }
}
/**
 * Single path optimisation, populates a string that is then processed via API
 * @param {*} selection - selection of elements
 * @param {*} optionSetting - the integer passed in
 */
async function optimise(selection, optionSetting) {
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
    return sprCallToApi(pathData, optionSetting)
        .then(data => redrawPath(selection, data))
        .catch(function (error) {
            document.body.appendChild(createAlert("Astui returned: " + error)).showModal();
        });

}

/**
 * One string reset.
 * @param {*} selection - still the same selection element.
 * PLEASE DO NOT PASS ANYTHING ELSE IF YOU WANT TO REDRAW THE ORIGINAL PATH
 * @param {*} data - path data that has been optimised
 */
function redrawPath(selection, data) {
    //need to loop through each selected element and reset the pathData property
    selection.items.forEach(function (element) {

        if (data.error) {
            throw data.error;
        }
        element.pathData = data.path;
    });
}



/**
 * Getting selection data from multiple paths and populating an array for further requests
 * @param {*} selection
 */
function getPathData(selection) {
    const node = selection.items; //getting first node child and getting all of the containing paths
    let pathArray = new Array;
    // populate array with paths strings
    node.forEach(function (childNode, i) {
        
        pathArray.push({
            path: childNode.pathData
        });
    });
    return pathArray;
}

/**
 * Redraws the paths by creating an array of fetch request with current data.
 * returns a Promise.all() -> which means that it won't proceed with other methods until the promises/requests are resolved.
 * @param {*} selection
 * @param {*} array
 * @param {*} value
 */
function redrawComplexPath(selection, array, value) {
    let newPaths = new Array; //array of said requests
    array.forEach(async function (element) {
        newPaths.push(sprCallToApi(element.path, value));

    });
    //modifications to the sceneGraph have to be async (plus it's an async request anyway, returning a promise)
    //that sends a further array to placeMultiplePaths method
    return Promise.all(newPaths)
        .then(data => placeMultiplePaths(selection, data))
        .catch(function (error) {
            document.body.appendChild(createAlert("Astui returned: " + error)).showModal();
        });
}
/**
 * Redrawing multiple paths on the sceneGraph
 * @param {*} selection
 * @param {*} path
 */
function placeMultiplePaths(selection, path) {
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
 * 
 * @NOTE: Initialisation functions
 */

/**
 * Rounding the float to an int and printing it in the representative div
 * @param {float} value
 */
function roundParameters(value) {
    const inputText = document.getElementById("tolerance_value");
    inputText.textContent = Math.round(value.value);
}

/**
 * creating the dialog and calling optimisation method
 * @param  {[type]} selection
 */
async function selectionInit(selection) {

    //calling async createOptions method
    const dialog = createOptions();

    try {
        //waiting for the dialog to close and provide with accuracy value if said is set
        const r = await dialog.showModal();
        if (r) {
            //need to return a promise, returning a paths calculation method
            return getAllPath(selection, r);
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
async function apiCheckSpr(selection) {

    if (selection.items[0] == null) {
        document.body.appendChild(createAlert("Oh no! You haven't selected anything.")).showModal();
    } else {

        const apiCheck = await getApiToken();
        if ((!apiCheck) || (apiCheck == 'n/a')) {
            return createApiDialogue(selection);
        } else {
            return await selectionInit(selection);
        }


    }
}
/**
 * checking the need to create the api dialogue and if nothing is set doesn't allow further processes to show
 * @param {*} selection 
 */
async function createApiDialogue(selection) {
    const dialog = insertApiKey();

    //waiting for the dialog to close and provide with accuracy value if said is set
    const r = await dialog.showModal();
    if (r !== "n/a") {
        await setApiToken(r);
        return await selectionInit(selection);
    }


}

/**
 * Check the api token for tangencies call
 * @param  {[type]} selection
 * @return {[type]}
 */
async function apiCheckTangencies(selection) {
    if (selection.items[0] == null) {
        document.body.appendChild(createAlert()).showModal();
    } else {
        const apiCheck = await getApiToken();
        if ((!apiCheck) || (apiCheck == 'n/a')) {
            const dialog = insertApiKey();
            try {
                //waiting for the dialog to close and provide with accuracy value if said is set
                const r = await dialog.showModal();
                if (r) {
                    await setApiToken(r);
                    return await tangenciesProcessor(selection);
                }
            } catch (err) {
                console.log("ESC dismissed dialog", +err);
            }
        } else {
            return await tangenciesProcessor(selection);
        }
    }

}

module.exports = {
    commands: {
        optionLoad: apiCheckSpr,
        moveTangencies: apiCheckTangencies,
    }
}