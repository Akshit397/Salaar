const ReviewsController = require('../../controller/admin/productReview');
const Authorization = require('../../middleware/auth');

module.exports = (router, app) => {
    router.post('/admin/updateReview', Authorization.isAdminAuthorised, (req, res, next) => {
        const reviewObj = (new ReviewsController()).boot(req, res);
        return reviewObj.updateReview();
    });

    router.get('/admin/getReviewDetails/:reviewId', Authorization.isAdminAuthorised, (req, res, next) => {
        const reviewObj = (new ReviewsController()).boot(req, res);
        return reviewObj.getReviewDetails();
    });

    router.post('/admin/changeReviewStatus', Authorization.isAdminAuthorised, (req, res, next) => {
        const reviewObj = (new ReviewsController()).boot(req, res);
        return reviewObj.changeReviewStatus();
    });

    router.post('/admin/deleteReviews', Authorization.isAdminAuthorised, (req, res, next) => {
        const reviewObj = (new ReviewsController()).boot(req, res);
        return reviewObj.deleteReviews();
    });

    router.post('/admin/reviewListing', Authorization.isAdminAuthorised, (req, res, next) => {
        const reviewObj = (new ReviewsController()).boot(req, res);
        return reviewObj.reviewListing();
    });

    router.post('/admin/downloadReviewsFile', Authorization.isAdminAuthorised, (req, res, next) => {
        const reviewObj = (new ReviewsController()).boot(req, res);
        return reviewObj.downloadReviewsFile();
    });

    router.post('/admin/reviewsList', Authorization.isAdminAuthorised, (req, res, next) => {
        const reviewObj = (new ReviewsController()).boot(req, res);
        return reviewObj.reviewsList();
    });
}