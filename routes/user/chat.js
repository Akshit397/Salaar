/** @format */

const MyChatController = require("../../controller/user/chat.js");
const Authorization = require("../../middleware/auth");

module.exports = (router, app) => {
  router.post(
    "/chat/addmessage",
    Authorization.isAuthorised,
    (req, res, next) => {
      const myearnObj = new MyChatController().boot(req, res);
      return myearnObj.AddMessages();
    },
  );

  router.get(
    "/chat/getallmessages/:from",
    Authorization.isAuthorised,
    (req, res, next) => {
      const myearnObj = new MyChatController().boot(req, res);
      return myearnObj.getAllMessages();
    },
  );
};
