class svgHelper
{
     /**
     * Calculate the amount of points in a path
     * @param {string} selection - path string
     * @returns {Array} array points.
     */
    static getPointsArray(selection) {
        let path = selection.split(/(?=[LMC])/);
        //array of points coordinates
        let points = path.map(function (d) {
            var pointsArray = d.slice(1, d.length).split(',');

            var pairsArray = [];
            for (var i = 0; i < pointsArray.length; i += 2) {

                pairsArray.push(pointsArray[i]);
            }

            return pairsArray;
        });
        //transforms to array of just points (0,1,2,3...)
        let array = new Array();
        for (var i = 0; i < points.length; i++) {

            array.push(i);
        }

        return array;
    }
}

module.exports = svgHelper;