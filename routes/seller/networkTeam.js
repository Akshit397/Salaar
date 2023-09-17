/** @format */

const NetworkTeamController = require("../../controller/seller/networkTeam");
const Authorization = require("../../middleware/auth");

module.exports = (router, app) => {
    router.post(
        "/seller/getPendingTeamMembers",
        Authorization.isSellerAuthorised,
        (req, res, next) => {
            const networkTeamObj = new NetworkTeamController().boot(req, res);
            return networkTeamObj.getPendingTeamMembers();
        },
    );

    router.get(
        "/seller/getPendingLevelDetails",
        Authorization.isSellerAuthorised,
        (req, res, next) => {
            const networkTeamObj = new NetworkTeamController().boot(req, res);
            return networkTeamObj.getPendingLevelDetails();
        },
    );

    router.post(
        "/seller/addTeamMember",
        Authorization.isSellerAuthorised,
        (req, res, next) => {
            const networkTeamObj = new NetworkTeamController().boot(req, res);
            return networkTeamObj.addTeamMember();
        },
    );

    router.get(
        "/seller/getTeamTreeDetails",
        Authorization.isSellerAuthorised,
        (req, res, next) => {
            const networkTeamObj = new NetworkTeamController().boot(req, res);
            return networkTeamObj.getTeamTreeDetails();
        },
    );

    router.get(
        "/seller/getFirstLevelDetails/:registerId",
        Authorization.isSellerAuthorised,
        (req, res, next) => {
            const networkTeamObj = new NetworkTeamController().boot(req, res);
            return networkTeamObj.getFirstLevelDetails();
        },
    );

    router.get(
        "/seller/getTeamTreeDetails/:registerId/:level",
        Authorization.isSellerAuthorised,
        (req, res, next) => {
            const networkTeamObj = new NetworkTeamController().boot(req, res);
            return networkTeamObj.getTeamTreeDetailsByRegisterID();
        },
    );

    router.get(
        "/seller/getNetworkTeamCount",
        Authorization.isSellerAuthorised,
        (req, res, next) => {
            const networkTeamObj = new NetworkTeamController().boot(req, res);
            return networkTeamObj.getNetworkTeamCount();
        },
    );

    router.post(
        "/seller/mySponserTeamListing",
        Authorization.isSellerAuthorised,
        (req, res, next) => {
            const networkTeamObj = new NetworkTeamController().boot(req, res);
            return networkTeamObj.mySponserTeamListing();
        },
    );
};
