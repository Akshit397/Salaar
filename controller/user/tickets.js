/** @format */

const _ = require("lodash");

const Controller = require("../base");
const RequestBody = require("../../utilities/requestBody");
const Authentication = require("../auth");
const CommonService = require("../../utilities/common");
const Services = require("../../utilities/index");
const Model = require("../../utilities/model");
const { TicketsList } = require("../../models/s_ticket");
var crypto = require("crypto");

class TicketsController extends Controller {
  constructor() {
    super();
    this.commonService = new CommonService();
    this.services = new Services();
    this.requestBody = new RequestBody();
    this.authentication = new Authentication();
  }

  AddTickets = async () => {
    try {
      let data = this.req.body;

      const fieldsArray = ["subjectId", "message", "chat", "status", "user_id"];
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
        var da = {
          ticketNo: id,
          ...data,
        };

        const newCode = await new Model(TicketsList).store(da);
        if (_.isEmpty(newCode)) {
          return this.res.send({
            status: 0,
            message: "Ticket not saved",
          });
        }
        return this.res.send({
          status: 1,
          message: "Ticket added successfully",
        });
      }
    } catch (error) {
      console.log("error- ", error);
      this.res.status(500).send({ status: 0, message: error });
    }
  };

  getTicketByUserId = async () => {
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
        const Ticket = await TicketsList.find({ user_id: data?.user_id });
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
}

module.exports = TicketsController;
