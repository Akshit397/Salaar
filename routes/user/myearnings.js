/** @format */

const MyEarningsController = require("../../controller/user/myearnings.js");
const Authorization = require("../../middleware/auth");

module.exports = (router, app) => {
  router.post("/myearns/sponsorCommissionListingInUser", Authorization.isAuthorised, (req, res, next) => {
    const myearnObj = new MyEarningsController().boot(req, res);
    return myearnObj.sponsorCommissionListingInUser();
  });

  router.post("/myearns/aurListingInUser", Authorization.isAuthorised, (req, res, next) => {
    const myearnObj = new MyEarningsController().boot(req, res);
    return myearnObj.aurListingInUser();
  });

  router.post("/myearns/gameCommissionListingInUser", Authorization.isAuthorised, (req, res, next) => {
    const myearnObj = new MyEarningsController().boot(req, res);
    return myearnObj.gameCommissionListingInUser();
  });

  router.get("/myearns/getGameTreeDetails/:orderId", Authorization.isAuthorised, (req, res, next) => {
    const myearnObj = new MyEarningsController().boot(req, res);
    return myearnObj.getGameTreeDetails();
  });
};
