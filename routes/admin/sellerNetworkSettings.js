const SellerNetworkSettingsController = require('../../controller/admin/sellerNetworkSettings');
const Authorization = require("../../middleware/auth");

module.exports = (router, app) => {
    router.post('/addAndUpdateSellerNetworkSettings', Authorization.isAdminAuthorised, (req, res, next) => {
        const sellerObj = (new SellerNetworkSettingsController()).boot(req, res);
        return sellerObj.addAndUpdateSellerNetworkSettings();
    });

    router.post('/sellerNetworkSettingsListing', Authorization.isAdminAuthorised, (req, res, next) => {
        const sellerObj = (new SellerNetworkSettingsController()).boot(req, res);
        return sellerObj.sellerNetworkSettingsListing();
    });

    router.get('/getSellerNetworkSettingsDetails/:sellerNetworkSettingsId', Authorization.isAdminAuthorised, (req, res, next) => {
        const sellerObj = (new SellerNetworkSettingsController()).boot(req, res);
        return sellerObj.getSellerNetworkSettingsDetails();
    });

    router.get('/getSellerNetworkSettings', Authorization.isAdminAuthorised, (req, res, next) => {
        const sellerObj = (new SellerNetworkSettingsController()).boot(req, res);
        return sellerObj.getSellerNetworkSettings();
    });

    router.post('/changeStatusOfSellerNetworkSettings', Authorization.isAdminAuthorised, (req, res, next) => {
        const sellerObj = (new SellerNetworkSettingsController()).boot(req, res);
        return sellerObj.changeStatusOfSellerNetworkSettings();
    });

    router.post('/deleteSellerNetworkSettings', Authorization.isAdminAuthorised, (req, res, next) => {
        const sellerObj = (new SellerNetworkSettingsController()).boot(req, res);
        return sellerObj.deleteSellerNetworkSettings();
    });

}