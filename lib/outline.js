const {
    selection
} = require("scenegraph");
const commands = require("commands");
const environment = require('./storage-helper');

class outline {
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
     * Stroke processor for deciding which process to run
     * 
     * @param {*} selection 
     */
    static processData() {
        commands.ungroup();
        const selectedGrid = selection.items;
        //is more than one child - optimise
        //this is more of a hack, if it"s just one, but I think it"s due to the Promise.all() - which needs an iteration to resolve it
        // TODO: WHILE LOOP FOR GROUPING PROPERLY
        if (selectedGrid.length > 1) {
            let rand;
            do {
                commands.ungroup();
                rand++;
            } while (rand < 4);
        }

        let paths = this.getStrokes();

        return this.getNewPaths(paths);
    }
    /**
     * @TODO: OPTIMISE!
     * 
     * Getting data from strokes is slightly more complex, this surely needs to be optimised, but currently we"re building arrays with paths and other parameters
     * ensuring that all paths are processed
     * 
     * @param {*} selection 
     */
    static getStrokes() {
        const node = selection.items; //getting first node child and getting all of the containing paths
        let pathArray = new Array;
        const object = this;
        // populate array with paths strings
        node.forEach(function (childNode, i) {
            if (childNode.strokeEnabled) {
                pathArray.push({
                    path: childNode.pathData,
                    width: childNode.strokeWidth,
                    cap_type: object.capTypeSetter(childNode.strokeEndCaps),
                    mitre_limit: childNode.strokeMiterLimit,
                    dash_offset: childNode.strokeDashOffset,
                    join_type: childNode.strokeJoins,
                    dashes: childNode.strokeDashArray,
                    color: childNode.stroke,
                    placement: object.defineStrokePlacementNameForApi(childNode.strokePosition),
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

    static async getNewPaths(array) {
        let newPaths = new Array; //array of said requests
        let object = this;
        array.forEach(async function (element) {
            if (element.stroke == "present") {
                newPaths.push(object.callToOutlineStrokeApi(element));
            } else {
                newPaths.push({
                    path: element.path,
                    color: element.color,
                });
            }
        });

        return Promise.all(newPaths)
            .then(data => this.placePaths(data));
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
    static placePaths(path) {
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
     * Calling the outline stroke endpoint
     * 
     * @param {*} body 
     * @param {*} setting 
     */
    static async callToOutlineStrokeApi(path) {
     
        //get api_token
        const api_token = this.api;
        const width = path.width;
        const cap = path.cap_type;
        const join = path.join_type;
        const mitre_limit = path.mitre_limit;
        const placement = path.placement;
        const offset = path.dash_offset;
        const dashes = path.dashes;

        let requestBody;
        //waiting for the request to complete
        if (dashes.length) {
            if (!dashes[1]) {
                requestBody = "api_token=" + api_token + "&path=" + path.path + "&width=" + width + "&join_type=" + join + "&cap_type=" + cap + "&mitre_limit=" + mitre_limit + "&placement=" + placement + "&dash_offset=" + offset + "&dashes[0]=" + dashes + "&dashes[1]=" + dashes[0];
            } else {

                requestBody = "api_token=" + api_token + "&path=" + path.path + "&width=" + width + "&join_type=" + join + "&cap_type=" + cap + "&mitre_limit=" + mitre_limit + "&placement=" + placement + "&dash_offset=" + offset + "&dashes[0]=" + dashes[0] + "&dashes[1]=" + dashes[1];
            }
        } else {
            requestBody = "api_token=" + api_token + "&path=" + path.path + "&width=" + width + "&join_type=" + join + "&cap_type=" + cap + "&mitre_limit=" + mitre_limit + "&placement=" + placement;
        }

        let response = await fetch(this.endpoint, {
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
                await environment.set("api_token", "");
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
}

module.exports = outline;