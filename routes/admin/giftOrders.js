
const GiftOrdersController = require('../../controller/admin/giftOrders');
const Authorization = require("../../middleware/auth");

module.exports = (router, app) => {
    router.get('/getGiftOrderDetails/:giftOrderId', Authorization.isAdminAuthorised, (req, res, next) => {
        const giftObj = (new GiftOrdersController()).boot(req, res);
        return giftObj.getGiftOrderDetails();
    });

    router.post('/giftOrdersListing', Authorization.isAdminAuthorised, (req, res, next) => {
        const giftObj = (new GiftOrdersController()).boot(req, res);
        return giftObj.giftOrdersListing();
    });

    router.post('/changeStatusOfGiftOrders', Authorization.isAdminAuthorised, (req, res, next) => {
        const giftObj = (new GiftOrdersController()).boot(req, res);
        return giftObj.changeStatusOfGiftOrders();
    });

    router.post('/updateTrackingDetails', Authorization.isAdminAuthorised, (req, res, next) => {
        const giftObj = (new GiftOrdersController()).boot(req, res);
        return giftObj.updateTrackingDetails();
    });

    router.post('/downloadGiftOrderFiles', Authorization.isAdminAuthorised, (req, res, next) => {
        const giftObj = (new GiftOrdersController()).boot(req, res);
        return giftObj.downloadGiftOrderFiles();
    });
}