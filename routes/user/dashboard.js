/** @format */

const UserDashboardController = require("../../controller/user/dashboard");
const Authorization = require("../../middleware/auth");

module.exports = (router, app) => {
  router.get(
    "/getUserDashboardData/:user_id",
    Authorization.isAuthorised,
    (req, res, next) => {
      const myearnObj = new UserDashboardController().boot(req, res);
      return myearnObj.getUserDashboardData();
    },
  );

  router.get("/sponserId/:sponsor_id", (req, res, next) => {
    const myearnObj = new UserDashboardController().boot(req, res);
    return myearnObj.getSponserIdDetails();
  });

  router.get("/sponserIduser/:sponsor_id", (req, res, next) => {
    const myearnObj = new UserDashboardController().boot(req, res);
    return myearnObj.getSponserIdUserID();
  });
};
