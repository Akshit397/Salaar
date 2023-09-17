const _ = require("lodash");

const Controller = require("../base");
const RequestBody = require("../../utilities/requestBody");
const CommonService = require("../../utilities/common");


class GeoLocationController extends Controller {
    constructor() {
        super();
        this.commonService = new CommonService();
        this.requestBody = new RequestBody();
    }

    // Need to use this logic to find the distance between user and seller to show delivery charges
    async getDistanceFromLatLonInKm(lon1, lat1, lon2, lat2) {
        const R = 6371; // Radius of the earth in km
        const dLat = this.deg2rad(lat2 - lat1);  // deg2rad below
        const dLon = this.deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
            ;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in km
        return d;
    }

    async deg2rad(deg) {
        return deg * (Math.PI / 180)
    }
}
module.exports = GeoLocationController;