const _ = require("lodash");

const CmsPages = require('../../models/s_cms').CmsPages;
const Controller = require("../base");


class CmsController extends Controller {
    constructor() {
        super();
    }

  /********************************************************
    Purpose: Get Cms Details In Admin
    Method: GET
    Authorisation: true
    Return: JSON String
    ********************************************************/
    async getCmsDetailsByPageName() {
        try {
            let cms = await CmsPages.findOne({ pageName: this.req.params.pageName , isDeleted: false}, { __v: 0 });
            if (_.isEmpty(cms))
                return this.res.send({ status: 0, message: "Details not found" });
            return this.res.send({ status: 1, message: "Details are: ", data: cms });
        } catch (error) {
            console.log(`error: ${error}`);
            return this.res.send({ status: 0, message: "Internal server error" });
        }
    }
}
module.exports = CmsController
