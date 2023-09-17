/** @format */

const SponsorProductController = require("../../controller/user/sponserProComm");
const Authorization = require("../../middleware/auth");

module.exports = (router, app) => {
  router.post(
    "/addproductcomm",
    Authorization.isAuthorised,
    (req, res, next) => {
      const myearnObj = new SponsorProductController().boot(req, res);
      return myearnObj.AddProductCommission();
    },
  );

  router.get(
    "/getproductcomm/:user_id",
    Authorization.isAuthorised,
    (req, res, next) => {
      const myearnObj = new SponsorProductController().boot(req, res);
      return myearnObj.getProductCommission();
    },
  );

  router.post(
    "/addsponsorcomm",
    Authorization.isAuthorised,
    (req, res, next) => {
      const myearnObj = new SponsorProductController().boot(req, res);
      return myearnObj.AddSponserTeam();
    },
  );

  router.get(
    "/getsponsorteam/:user_id",
    Authorization.isAuthorised,
    (req, res, next) => {
      const myearnObj = new SponsorProductController().boot(req, res);
      return myearnObj.getSponsorTeam();
    },
  );
};
