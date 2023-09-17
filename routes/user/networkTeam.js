/** @format */

const NetworkTeamController = require("../../controller/user/networkTeam");
const Authorization = require("../../middleware/auth");

module.exports = (router, app) => {
  router.post(
    "/getPendingTeamMembers",
    Authorization.isAuthorised,
    (req, res, next) => {
      const networkTeamObj = new NetworkTeamController().boot(req, res);
      return networkTeamObj.getPendingTeamMembers();
    },
  );

  router.get(
    "/getPendingLevelDetails",
    Authorization.isAuthorised,
    (req, res, next) => {
      const networkTeamObj = new NetworkTeamController().boot(req, res);
      return networkTeamObj.getPendingLevelDetails();
    },
  );

  router.post(
    "/addTeamMember",
    Authorization.isAuthorised,
    (req, res, next) => {
      const networkTeamObj = new NetworkTeamController().boot(req, res);
      return networkTeamObj.addTeamMember();
    },
  );

  router.get(
    "/getTeamTreeDetails",
    Authorization.isAuthorised,
    (req, res, next) => {
      const networkTeamObj = new NetworkTeamController().boot(req, res);
      return networkTeamObj.getTeamTreeDetails();
    },
  );

  router.get(
    "/getFirstLevelDetails/:registerId",
    Authorization.isAuthorised,
    (req, res, next) => {
      const networkTeamObj = new NetworkTeamController().boot(req, res);
      return networkTeamObj.getFirstLevelDetails();
    },
  );

  router.get(
    "/getTeamTreeDetails/:registerId/:level",
    Authorization.isAuthorised,
    (req, res, next) => {
      const networkTeamObj = new NetworkTeamController().boot(req, res);
      return networkTeamObj.getTeamTreeDetailsByRegisterID();
    },
  );

  router.get(
    "/getNetworkTeamCount",
    Authorization.isAuthorised,
    (req, res, next) => {
      const networkTeamObj = new NetworkTeamController().boot(req, res);
      return networkTeamObj.getNetworkTeamCount();
    },
  );
};
