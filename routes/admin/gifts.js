
const GiftsController = require('../../controller/admin/gifts');
const Authorization = require("../../middleware/auth");

module.exports = (router, app) => {
    router.post('/addAndUpdateGift', Authorization.isAdminAuthorised, (req, res, next) => {
        const giftObj = (new GiftsController()).boot(req, res);
        return giftObj.addAndUpdateGift();
    });

    router.get('/getGiftDetails/:giftId', Authorization.isAdminAuthorised, (req, res, next) => {
        const giftObj = (new GiftsController()).boot(req, res);
        return giftObj.getGiftDetails();
    });

    router.post('/giftsListing', Authorization.isAdminAuthorised, (req, res, next) => {
        const giftObj = (new GiftsController()).boot(req, res);
        return giftObj.giftsListing();
    });

    router.post('/changeStatusOfGifts', Authorization.isAdminAuthorised, (req, res, next) => {
        const giftObj = (new GiftsController()).boot(req, res);
        return giftObj.changeStatusOfGifts();
    });

    router.post('/deleteGifts', Authorization.isAdminAuthorised, (req, res, next) => {
        const giftObj = (new GiftsController()).boot(req, res);
        return giftObj.deleteGifts();
    });

    router.post('/downloadGiftFiles', Authorization.isAdminAuthorised, (req, res, next) => {
        const giftObj = (new GiftsController()).boot(req, res);
        return giftObj.downloadGiftFiles();
    });
}