/** @format */

const _ = require("lodash");

const Controller = require("../base");
const RequestBody = require("../../utilities/requestBody");
const Authentication = require("../auth");
const CommonService = require("../../utilities/common");
const Services = require("../../utilities/index");
const Model = require("../../utilities/model");
const { Commissions } = require("../../models/s_category_commission");
const { SponsorId } = require("../../models/s_sponser_team");

class SponsorProductController extends Controller {
  constructor() {
    super();
    this.commonService = new CommonService();
    this.services = new Services();
    this.requestBody = new RequestBody();
    this.authentication = new Authentication();
  }

  AddProductCommission = async () => {
    try {
      let data = this.req.body;
      const fieldsArray = [
        "user_id",
        "brand",
        "product_name",
        "product_details",
        "qty",
        "final_price",
        "sponsor",
        "team_income",
      ];
      const emptyFields = await this.requestBody.checkEmptyWithFields(
        data,
        fieldsArray,
      );
      if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
        return this.res.send({
          status: 0,
          message:
            "Please send" + " " + emptyFields.toString() + " fields required.",
        });
      } else {
        const newCode = await new Model(Commissions).store(data);
        if (_.isEmpty(newCode)) {
          return this.res.send({
            status: 0,
            message: "Product Commission not saved",
          });
        }
        return this.res.send({
          status: 1,
          message: "Product Commission added successfully",
        });
      }
    } catch (error) {
      console.log("error- ", error);
      this.res.status(500).send({ status: 0, message: error });
    }
  };

  getProductCommission = async () => {
    try {
      let data = this.req.params;
      const fieldsArray = ["user_id"];
      const emptyFields = await this.requestBody.checkEmptyWithFields(
        data,
        fieldsArray,
      );
      if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
        return this.res.send({
          status: 0,
          message:
            "Please send" + " " + emptyFields.toString() + " fields required.",
        });
      } else {
        const Ticket = await Commissions.find({ user_id: data?.user_id });
        if (_.isEmpty(Ticket)) {
          return this.res.send({
            status: 0,
            message: "Invalid User_id:" + data?.user_id,
          });
        }
        return this.res.send({
          status: 1,
          payload: Ticket,
        });
      }
    } catch (error) {
      console.log("error- ", error);
      this.res.status(500).send({ status: 0, message: error });
    }
  };

  AddSponserTeam = async () => {
    try {
      let data = this.req.body;
      const fieldsArray = ["user_id", "sponsor_id", "doj", "user_name"];
      const emptyFields = await this.requestBody.checkEmptyWithFields(
        data,
        fieldsArray,
      );
      if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
        return this.res.send({
          status: 0,
          message:
            "Please send" + " " + emptyFields.toString() + " fields required.",
        });
      } else {
        const newCode = await new Model(SponsorId).store(data);
        if (_.isEmpty(newCode)) {
          return this.res.send({
            status: 0,
            message: "Sponser_id not saved",
          });
        }
        return this.res.send({
          status: 1,
          message: "Sponser id added successfully",
        });
      }
    } catch (error) {
      console.log("error- ", error);
      this.res.status(500).send({ status: 0, message: error });
    }
  };

  getSponsorTeam = async () => {
    try {
      let data = this.req.params;
      const fieldsArray = ["user_id"];
      const emptyFields = await this.requestBody.checkEmptyWithFields(
        data,
        fieldsArray,
      );
      if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
        return this.res.send({
          status: 0,
          message:
            "Please send" + " " + emptyFields.toString() + " fields required.",
        });
      } else {
        const Ticket = await SponsorId.find({ sponsor_id: data?.user_id });
        if (_.isEmpty(Ticket)) {
          return this.res.send({
            status: 0,
            message: "Invalid sponsor_id:" + data?.user_id,
          });
        }
        return this.res.send({
          status: 1,
          payload: Ticket,
        });
      }
    } catch (error) {
      console.log("error- ", error);
      this.res.status(500).send({ status: 0, message: error });
    }
  };
}

module.exports = SponsorProductController;
