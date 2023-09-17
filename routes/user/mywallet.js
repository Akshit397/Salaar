/** @format */

const MyWalletController = require("../../controller/user/mywallet.js");
const Authorization = require("../../middleware/auth");

module.exports = (router, app) => {
  router.post(
    "/mywallet/addfunds",
    Authorization.isAuthorised,
    (req, res, next) => {
      const myearnObj = new MyWalletController().boot(req, res);
      return myearnObj.AddFundReceived();
    },
  );

  router.get(
    "/mywallet/getfundsrecevied/:user_id",
    Authorization.isAuthorised,
    (req, res, next) => {
      const myearnObj = new MyWalletController().boot(req, res);
      return myearnObj.getFundReceived();
    },
  );

  router.post(
    "/mywallet/addfundtransfer",
    Authorization.isAuthorised,
    (req, res, next) => {
      const myearnObj = new MyWalletController().boot(req, res);
      return myearnObj.AddFundTRansfer();
    },
  );

  router.get(
    "/mywallet/getfundstransfer/:user_id",
    Authorization.isAuthorised,
    (req, res, next) => {
      const myearnObj = new MyWalletController().boot(req, res);
      return myearnObj.getFundTransfer();
    },
  );

  router.post(
    "/mywallet/addwallethistory",
    Authorization.isAuthorised,
    (req, res, next) => {
      const myearnObj = new MyWalletController().boot(req, res);
      return myearnObj.AddWalletHistory();
    },
  );

  router.get(
    "/mywallet/getwallethistory/:user_id",
    Authorization.isAuthorised,
    (req, res, next) => {
      const myearnObj = new MyWalletController().boot(req, res);
      return myearnObj.getWalletHistory();
    },
  );
};
