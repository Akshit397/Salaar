/** @format */

const _ = require("lodash");

const Controller = require("../base");
const RequestBody = require("../../utilities/requestBody");
const Authentication = require("../auth");
const CommonService = require("../../utilities/common");
const Services = require("../../utilities/index");
const Model = require("../../utilities/model");
const {
  FundReceived,
  WalletHistory,
  FundTransfer,
} = require("../../models/s_wallet_management");
var crypto = require("crypto");
const { time } = require("console");

class MyWalletController extends Controller {
  constructor() {
    super();
    this.commonService = new CommonService();
    this.services = new Services();
    this.requestBody = new RequestBody();
    this.authentication = new Authentication();
  }

  AddFundReceived = async () => {
    try {
      let data = this.req.body;

      const fieldsArray = ["user_id", "Amount", "status", "userName"];

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
        var id = crypto.randomBytes(7).toString("hex");
        var Fund = {
          TransactionId: id,
          user_id: data?.user_id,
          Amount: data?.Amount,
          status: data?.status,
          userName: data?.userName,
        };
        const newCode = await new Model(FundReceived).store(Fund);
        if (_.isEmpty(newCode)) {
          return this.res.send({
            status: 0,
            message: "Funds not added",
          });
        }
        return this.res.send({
          status: 1,
          message: "Funds added Successfully",
        });
      }
    } catch (error) {
      console.log("error- ", error);
      this.res.status(500).send({ status: 0, message: error });
    }
  };

  getFundReceived = async () => {
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
        let newCode = await FundReceived.find({ user_id: data?.user_id });
        if (_.isEmpty(newCode)) {
          return this.res.send({
            status: 0,
            message: "Not Found user_id",
          });
        }
        return this.res.send({
          status: 1,
          payload: newCode,
        });
      }
    } catch (error) {
      console.log("error- ", error);
      this.res.status(500).send({ status: 0, message: error });
    }
  };

  AddFundTRansfer = async () => {
    try {
      let data = this.req.body;

      const fieldsArray = ["user_id", "Amount", "status", "userName"];

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
        var id = crypto.randomBytes(7).toString("hex");
        var Fund = {
          TransactionId: id,
          user_id: data?.user_id,
          Amount: data?.Amount,
          status: data?.status,
          userName: data?.userName,
        };
        const newCode = await new Model(FundTransfer).store(Fund);
        if (_.isEmpty(newCode)) {
          return this.res.send({
            status: 0,
            message: "Funds not added",
          });
        }
        return this.res.send({
          status: 1,
          message: "Funds Transfered added Successfully",
        });
      }
    } catch (error) {
      console.log("error- ", error);
      this.res.status(500).send({ status: 0, message: error });
    }
  };

  getFundTransfer = async () => {
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
        let newCode = await FundTransfer.find({ user_id: data?.user_id });
        if (_.isEmpty(newCode)) {
          return this.res.send({
            status: 0,
            message: "Not Found user_id",
          });
        }
        return this.res.send({
          status: 1,
          payload: newCode,
        });
      }
    } catch (error) {
      console.log("error- ", error);
      this.res.status(500).send({ status: 0, message: error });
    }
  };

  AddWalletHistory = async () => {
    try {
      let data = this.req.body;

      const fieldsArray = [
        "user_id",
        "Amount",
        "commission_type",
        "commission_name",
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
        var id = crypto.randomBytes(7).toString("hex");
        var wallet = {
          TransactionId: id,
          user_id: data?.user_id,
          Amount: data?.Amount,
          commission_type: data?.commission_type,
          commission_name: data?.commission_name,
          date: Date.now(),
        };
        const newCode = await new Model(WalletHistory).store(wallet);
        if (_.isEmpty(newCode)) {
          return this.res.send({
            status: 0,
            message: "Funds not added",
          });
        }
        return this.res.send({
          status: 1,
          message: "Wallet History added Successfully",
        });
      }
    } catch (error) {
      console.log("error- ", error);
      this.res.status(500).send({ status: 0, message: error });
    }
  };

  getWalletHistory = async () => {
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
        let newCode = await WalletHistory.find({ user_id: data?.user_id });
        if (_.isEmpty(newCode)) {
          return this.res.send({
            status: 0,
            message: "Not Found user_id",
          });
        }
        return this.res.send({
          status: 1,
          payload: newCode,
        });
      }
    } catch (error) {
      console.log("error- ", error);
      this.res.status(500).send({ status: 0, message: error });
    }
  };
}

module.exports = MyWalletController;
