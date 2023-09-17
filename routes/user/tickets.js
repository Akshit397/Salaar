/** @format */

const TicketsController = require("../../controller/user/tickets.js");
const Authorization = require("../../middleware/auth");

module.exports = (router, app) => {
  router.post(
    "/addtickets",
    Authorization.isAuthorised,
    (req, res, next) => {
      const myearnObj = new TicketsController().boot(req, res);
      return myearnObj.AddTickets();
    },
  );

  router.get(
    "/gettickets/:user_id",
    Authorization.isAuthorised,
    (req, res, next) => {
      const myearnObj = new TicketsController().boot(req, res);
      return myearnObj.getTicketByUserId();
    },
  );
};
