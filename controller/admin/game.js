/** @format */

const _ = require("lodash");

const Controller = require("../base");
const { Admin } = require("../../models/s_admin");
const { GameProduct } = require("../../models/s_game_product");
const RequestBody = require("../../utilities/requestBody");
const Authentication = require("../auth");
const CommonService = require("../../utilities/common");
const Services = require("../../utilities/index");
const Model = require("../../utilities/model");
const { Level } = require("../../models/s_level_detail");

class MlmProductsController extends Controller {
  constructor() {
    super();
    this.commonService = new CommonService();
    this.services = new Services();
    this.requestBody = new RequestBody();
    this.authentication = new Authentication();
  }

  async AddLevels() {
    try {
      const currentUserId = this.req.user;
      const user = await Admin.findOne({ id: currentUserId });
      if (_.isEmpty(user)) {
        return this.res.send({
          status: 0,
          message: "User is not allowed to create plan",
        });
      }
      let data = this.req.body;
      const fieldsArray = ["level", "level_members", "commission", "reward", "shopping_amount"];
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
        const newLevel = await new Model(Level).store(data);
        if (_.isEmpty(newLevel)) {
          return this.res.send({ status: 0, message: "Level not updated" });
        }
        return this.res.send({
          status: 1,
          message: "Level updated successfully",
        });
      }
    } catch (error) {
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }

  async getLevels() {
    try {
      const gameProductsLevels = await Level.find({ status: true });
      if (_.isEmpty(gameProductsLevels)) {
        return this.res.send({ status: 0, message: "Games not found" });
      }
      return this.res.send({ status: 1, data: gameProductsLevels });
    } catch (error) {
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }
}
module.exports = MlmProductsController;
