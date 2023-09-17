const ReviewsController = require('../../controller/user/productReview');
const Authorization = require("../../middleware/auth");

module.exports = (router, app) => {
    router.post('/addReview', Authorization.isAuthorised, (req, res, next) => {
        const reviewObj = (new ReviewsController()).boot(req, res);
        return reviewObj.addReview();
    });

    router.post('/user/reviewListing', (req, res, next) => {
        const reviewObj = (new ReviewsController()).boot(req, res);
        return reviewObj.reviewListing();
    });

}