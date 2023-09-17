const PayoutsController = require('../../controller/common/payouts');
const Authorization = require("../../middleware/auth");
module.exports = (router, app) => {
    router.post('/UserWithDrawRequest', Authorization.isAuthorised, (req, res, next) => {
        const payout = (new PayoutsController()).boot(req, res);
        return payout.createPayout();
    });

    router.post('/SellerWithDrawRequest', Authorization.isSellerAuthorised, (req, res, next) => {
        const payout = (new PayoutsController()).boot(req, res);
        return payout.createPayout();
    });

    router.post('/UserWithDrawHistory', Authorization.isAuthorised, (req, res, next) => {
        const payout = (new PayoutsController()).boot(req, res);
        return payout.getWithdrawHistory();
    });

    router.post('/SellerWithDrawHistory', Authorization.isSellerAuthorised, (req, res, next) => {
        const payout = (new PayoutsController()).boot(req, res);
        return payout.getWithdrawHistory();
    });
}
