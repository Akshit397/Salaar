
const GiftOrdersController = require('../../controller/user/giftOrders');
const Authorization = require("../../middleware/auth");

module.exports = (router, app) => {
    router.get('/user/getGiftOrderDetails/:giftOrderId', Authorization.isAuthorised, (req, res, next) => {
        const giftObj = (new GiftOrdersController()).boot(req, res);
        return giftObj.getGiftOrderDetails();
    });

    router.post('/user/giftOrdersListing', Authorization.isAuthorised, (req, res, next) => {
        const giftObj = (new GiftOrdersController()).boot(req, res);
        return giftObj.giftOrdersListing();
    });

}