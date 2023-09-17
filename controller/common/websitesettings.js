const _ = require("lodash");

const Controller = require("../base");
const Model = require("../../utilities/model");
const {Websitesettings} = require("../../models/s_websitesettings")
const RequestBody = require("../../utilities/requestBody");
const CommonService = require("../../utilities/common");
const Services = require('../../utilities/index');

class AllWebsitesettingsController extends Controller {
    constructor() {
        super();
        this.commonService = new CommonService();
        this.services = new Services();
        this.requestBody = new RequestBody();
    }

   async addPagesWebsites() {
        try {
          let data = this.req.body;
            let fieldsArray =["image"];
            let emptyFields = await this.requestBody.checkEmptyWithFields(this.req.body, fieldsArray);
            if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                 return this.res.send({ status: 0, message: "not found" });
            }else{
                const newPage = await new Model(Websitesettings).store(data);
                if (_.isEmpty(newPage)) {
                    return this.res.send({ status: 0, message: "Not saved" })
                }
                return this.res.send({ status: 1, message: "Registered Successfully"});
            }
        } catch (error) {
            console.log("error = ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }

    }

     async getPagesWebsites() {
        try {
            const newBlogs = await Websitesettings.find({ status: true, }, { status: 0, _v: 0 });
            return this.res.send({ status: 1, data: newBlogs });

        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: "Internal server error" });
        }


    }





}
module.exports = AllWebsitesettingsController;