/** @format */

const _ = require("lodash");

const Controller = require("../base");
const { Country } = require("../../models/s_country");

const RequestBody = require("../../utilities/requestBody");
const CommonService = require("../../utilities/common");
const Services = require("../../utilities/index");

class WebhookController extends Controller {
    constructor() {
        super();
        this.commonService = new CommonService();
        this.services = new Services();
        this.requestBody = new RequestBody();
    }

    async razorpayWebhook() {
        try {

            return this.res.send({ status: 1 });
        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }
}

module.exports = WebhookController;
