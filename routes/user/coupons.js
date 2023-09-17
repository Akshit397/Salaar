const CouponsController = require('../../controller/user/coupons');
const Authorization = require("../../middleware/auth");

module.exports = (router, app) => {
    router.get('/website/getAvailableCoupons', (req, res, next) => {
        const couponsObj = (new CouponsController()).boot(req, res);
        return couponsObj.getAvailableCoupons();
    });

    router.post('/website/validateCouponDetails', Authorization.isAuthorised, (req, res, next) => {
        const couponsObj = (new CouponsController()).boot(req, res);
        return couponsObj.validateCouponDetails();
    });
}