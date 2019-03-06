//defining const objects that we are pulling from scenegraph API
const {
    selection
} = require("scenegraph");
const commands = require("commands");
const environment = require("./lib/storage-helper");
const svgHelper = require("./lib/svg-helper");
const smartPointRemoval = require("./lib/smart-point-removal");
const tangencies = require("./lib/tangencies");
const strokeOutline = require("./lib/outline");
const offsetPath = require("./lib/offset");

//setting/creating new api file



const $ = sel => document.querySelector(sel);
//alert message warning the user that nothing is selected.
let alertMessage;

/**
 * @NOTE: API RELATED 
 */

//setting endpoints
const spr = gettingEndpoints("spr");
const tangenciesEndpoint = gettingEndpoints("tangencies");
const validate = gettingEndpoints("validate");
const outline = gettingEndpoints("outline");
const offset = gettingEndpoints("offset");
/**
 * Getting the settings
 * @param {string} operation 
 */
async function gettingEndpoints(operation) {
    const url = await environment.get("server", "https://astui.tech/api/v1/");
    return url + operation;
}

/**
 * ESSENTIAL CALL TO THE API
 * This checks the validity of the api token passed through
 * 
 * @param {} token - string
 */
async function checkAuth(token) {
    //doesn"t handle any errors, handled by the dialogue.
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

    submitButton.addEventListener("click", e => {
        submit();
        e.preventDefault();
    });

    form.addEventListener("submit", e => {
        apiInput.close(token.value);
        e.preventDefault();
    });

    return apiInput;
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
 * checking the need to create the api dialogue and if nothing is set doesn"t allow further processes to show
 * @param {*} selection 
 */
async function createApiDialogue() {
    const dialog = insertApiKey();

    //waiting for the dialog to close and provide with accuracy value if said is set
    const r = await dialog.showModal();
    if ((r !== "") && (r !== "reasonCanceled")) {
        await environment.set("api_token", r);
        return r;
    } else {
        throw new Error("No API Key inserted");
    }
}


/**
 * Call to Smart Point Removal module
 */
async function apiCheckSpr() {

    //displays warning when nothing is selected
    if (selection.items[0] == null) {
        document.body.appendChild(createAlert("Oh no! You haven't selected anything.")).showModal();
    } else {
        const size = calculcatePathsAndPoints();
        if (size) {
            const apiCheck = await environment.get("api_token","");
            smartPointRemoval.setEndpoint(await spr);
          
            if ((apiCheck == "") || (apiCheck == "reasonCanceled")) {

                return await createApiDialogue().then(data => smartPointRemoval.setToken(data))
                    .then(data => smartPointRemoval.processData())
                    .catch(error => document.body.appendChild(createAlert(error)).showModal());
            } else {
                
                //sets the api and enpoints and processes the selection
                // let api = await environment.get("api_token", "");
                smartPointRemoval.setToken(apiCheck);
                return await smartPointRemoval.processData().catch(error => document.body.appendChild(createAlert(error)).showModal());

            }
        }
    }
}

/**
 * Call to tangencies module
 */
async function apiCheckTangencies() {
    if (selection.items[0] == null) {
        document.body.appendChild(createAlert("Oh no! You haven't selected anything.")).showModal();
    } else {

        const size = calculcatePathsAndPoints();
        if (size) {
            const apiCheck = await environment.get("api_token", "");
            
            tangencies.setEndpoint(await tangenciesEndpoint);
            if ((apiCheck == "") || (apiCheck == "reasonCanceled")) {
                return await createApiDialogue().then(data => tangencies.setToken(data))
                    .then(data => tangencies.processData())
                    .catch(error => document.body.appendChild(createAlert(error)).showModal());
            } else {
                //sets the api and enpoints and processes the selection
      
                tangencies.setToken(apiCheck);
                return await tangencies.processData().catch(error => document.body.appendChild(createAlert(error)).showModal());

            }
        }
    }

}

/**
 * Call to Outline Stroke module
 * 
 */
async function apiCheckStroke() {
    if (selection.items[0] == null) {
        document.body.appendChild(createAlert("Oh no! You haven't selected anything.")).showModal();
    } else {

        const size = calculcatePaths();
        if (size) {
            strokeOutline.setEndpoint(await outline);
            //sets the api and enpoints and processes the selection
            const apiCheck = await environment.get("api_token", "");
            if ((apiCheck == "") || (apiCheck == "reasonCanceled")) {
                return await createApiDialogue().then(data => strokeOutline.setToken(data))
                    .then(data => strokeOutline.processData())
                    .catch(error => document.body.appendChild(createAlert(error)).showModal());
            } else {
                console.log(apiCheck);
                strokeOutline.setToken(apiCheck);
                return await strokeOutline.processData().catch(error => document.body.appendChild(createAlert(error)).showModal());
            }
        }

    }
}

/**
 * Calls to Offset module
 * 
 * @param {*} selection 
 */
async function apiCheckOffset() {
    if (selection.items[0] == null) {
        document.body.appendChild(createAlert("Oh no! You haven't selected anything.")).showModal();
    } else {

        const size = calculcatePathsAndPoints();
        if (size) {
            //sets the api and enpoints and processes the selection
            const apiCheck = await environment.get("api_token", "");
            offsetPath.setEndpoint(await offset);

            if ((apiCheck == "") || (apiCheck == "reasonCanceled")) {
                return await createApiDialogue().then(data => offsetPath.setToken(data))
                    .then(data => offsetPath.processData())
                    .catch(error => document.body.appendChild(createAlert(error)).showModal());
            } else {
                offsetPath.setToken(apiCheck);
                return await offsetPath.processData().catch(error => document.body.appendChild(createAlert(error)).showModal());
            }
        }
    }
}

/**
 * Calculating the paths and points, and letting the user know if cannot process
 */
function calculcatePathsAndPoints() {

    if (selection.items.length > 1) {
        let rand;
        do {
            commands.ungroup();
            commands.convertToPath();
            rand++;
        } while (rand < 4);
    } else {

        commands.ungroup();
        commands.convertToPath();
    }

    let pointTotal = 0;
  

    selection.items.forEach(function (childNode, i) {
        const points = svgHelper.getPointsArray(childNode.pathData);

        pointTotal += points.length;
    });
 
    if ((selection.items.length >= 160) || (pointTotal >= 5292)) {
        document.body.appendChild(createAlert("File's too big. You have " + selection.items.length + " paths and " + pointTotal + " points. We accept up to 160 paths and 5292 points")).showModal();
        return false;
    } else {
        return true;
    }

}

/**
 * Calculating the paths  and letting the user know if cannot process
 */
function calculcatePaths() {

   
    if (selection.items.length > 1) {
        let rand;
        do {
            commands.ungroup();
            rand++;
        } while (rand < 4);
    } else {

        commands.ungroup();
    }

    let pointTotal = 0;
  

    if ((selection.items.length >= 160) || (pointTotal >= 5292)) {
        document.body.appendChild(createAlert("File's too big. You have " + selection.items.length + " paths. We accept up to 160")).showModal();
        return false;
    } else {
        return true;
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