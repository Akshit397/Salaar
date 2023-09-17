const MyStuffController = require('../../controller/user/mystuff.js');
const Authorization = require("../../middleware/auth");

module.exports = (router, app) => {

    router.post('/mystuff/pointsListingInUser', Authorization.isAuthorised, (req, res, next) => {
        const mystuffObj = (new MyStuffController()).boot(req, res);
        return mystuffObj.pointsListingInUser();
    });

    router.post('/mystuff/salarCoinsListingInUser', Authorization.isAuthorised, (req, res, next) => {
        const mystuffObj = (new MyStuffController()).boot(req, res);
        return mystuffObj.salarCoinsListingInUser();
    });

    router.post('/mystuff/shoppingAmountListingInUser', Authorization.isAuthorised, (req, res, next) => {
        const mystuffObj = (new MyStuffController()).boot(req, res);
        return mystuffObj.shoppingAmountListingInUser();
    });

}