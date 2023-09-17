/** @format */

const _ = require("lodash");

const Controller = require("../base");
const { Admin } = require("../../models/s_admin");
const { EmailTemplate } = require("../../models/s_email_template");
const RequestBody = require("../../utilities/requestBody");
const Authentication = require("../auth");
const CommonService = require("../../utilities/common");
const Services = require("../../utilities/index");
const { Users } = require("../../models/s_users");

const UserDashboardController = require("../../controller/user/dashboard");

class AdminUserController extends Controller {
  constructor() {
    super();
    this.commonService = new CommonService();
    this.services = new Services();
    this.requestBody = new RequestBody();
    this.authentication = new Authentication();
  }

  async getAllUsers() {
    try {
      const user = await Users.find()
        .populate("countryId", { name: 1, iso: 1, nickname: 1 })
        .populate("shippingAddresses.countryId", {
          name: 1,
          iso: 1,
          nickname: 1,
          countryId: 1,
        });

      return this.res.send({ status: 1, data: user });
    } catch (error) {
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }

  async getAllUsersWithBankAndKycDetails() {
    try {
      const user = await Users.find()
        .populate("bankDetails")
        .populate("kycDetails");
      return this.res.send({ status: 1, data: user });
    } catch (error) {
      return this.res.send({
        status: 0,
        message: "Internal server error",
        error: error,
      });
    }
  }

  // async getAllUsersWithALLDetails() {
  //   try {
  //     const user = await Users.find()
  //       .populate("bankDetails")
  //       .populate("kycDetails");
  //     return this.res.send({ status: 1, data: user });
  //   } catch (error) {
  //     return this.res.send({
  //       status: 0,
  //       message: "Internal server error",
  //       error: error,
  //     });
  //   }
  // }

  async getAllUsersWithALLDetails() {
    try {
      let UserDetails = [];
      const user = await Users.find({}, { _id: 1 });
      const myearnObj = new UserDashboardController();
      for (var i in user) {
        let Data = await myearnObj.getUserDashboardData(user[i]._id);
        UserDetails.push(Data);
      }
      return this.res.send({
        status: 1,
        payload: UserDetails,
      });
    } catch (error) {
      return this.res.send({
        status: 0,
        message: "Internal server error",
        error: error,
      });
    }
  }
}

module.exports = AdminUserController;
