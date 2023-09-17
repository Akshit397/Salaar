/** @format */

const _ = require("lodash");

const Controller = require("../base");
const RequestBody = require("../../utilities/requestBody");
const Authentication = require("../auth");
const CommonService = require("../../utilities/common");
const Services = require("../../utilities/index");
const Model = require("../../utilities/model");
const { Messages } = require("../../models/s_chat");

class MyChatController extends Controller {
  constructor() {
    super();
    this.commonService = new CommonService();
    this.services = new Services();
    this.requestBody = new RequestBody();
    this.authentication = new Authentication();
  }

  AddMessages = async () => {
    try {
      let data = this.req.body;

      const fieldsArray = ["message", "from", "to"];
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
        let payload = {
          message: {
            text: data?.message,
          },
          users: [data?.from, data?.to],
          sender: data?.from,
        };
        const newCode = await new Model(Messages).store(payload);
        if (_.isEmpty(newCode)) {
          return this.res.send({
            status: 0,
            message: "Messages not saved",
          });
        }
        return this.res.send({
          status: 1,
          message: "Message added successfully",
        });
      }
    } catch (error) {
      console.log("error- ", error);
      this.res.status(500).send({ status: 0, message: error });
    }
  };

  getAllMessages = async () => {
    try {
      const { from, to } = this.req.params;
      const data = this.req.params;
      const fieldsArray = ["from"];
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
        const user = await Messages.find({
          users: {
            $all: [from, to],
          },
        }).sort({ updatedAt: 1 });

        // const projectMessages = Messages.map(msg => {
        //   return {
        //     fromSelf: msg.sender.toString() === from,
        //     message: msg.message.text,
        //   };
        // });
        if (_.isEmpty(projectMessages)) {
          return this.res.send({
            status: 0,
            message: "Invalid User_id:" + data?.user_id,
          });
        }
        return this.res.send({
          status: 1,
          payload: projectMessages,
        });
      }
    } catch (error) {
      console.log("error- ", error);
      this.res.status(500).send({ status: 0, message: error });
    }
  };
}

module.exports = MyChatController;
