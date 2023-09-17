const SellerNetworkCategoriesController = require('../../controller/admin/sellerNetworkCategories');
const Authorization = require('../../middleware/auth');

module.exports = (router, app) => {

    router.post('/admin/addAndUpdateSellerNetworkCategory', Authorization.isAdminAuthorised, (req, res, next) => {
        const networkObj = (new SellerNetworkCategoriesController()).boot(req, res);
        return networkObj.addAndUpdateSellerNetworkCategory();
    });

    router.get('/admin/getSellerNetworkCategoryDetails/:sellerNetworkCategoryId', Authorization.isAdminAuthorised, (req, res, next) => {
        const networkObj = (new SellerNetworkCategoriesController()).boot(req, res);
        return networkObj.getSellerNetworkCategoryDetails();
    });

    router.post('/admin/changeStatusOfSellerNetworkCategories', Authorization.isAdminAuthorised, (req, res, next) => {
        const networkObj = (new SellerNetworkCategoriesController()).boot(req, res);
        return networkObj.changeStatusOfSellerNetworkCategories();
    });

    router.post('/admin/deleteSellerNetworkCategories', Authorization.isAdminAuthorised, (req, res, next) => {
        const networkObj = (new SellerNetworkCategoriesController()).boot(req, res);
        return networkObj.deleteSellerNetworkCategories();
    });

    router.post('/admin/sellerNetworkCategoriesListing', Authorization.isAdminAuthorised, (req, res, next) => {
        const networkObj = (new SellerNetworkCategoriesController()).boot(req, res);
        return networkObj.sellerNetworkCategoriesListing();
    });

    router.post('/admin/downloadSellerNetworkCategoryFiles', Authorization.isAdminAuthorised, (req, res, next) => {
        const networkObj = (new SellerNetworkCategoriesController()).boot(req, res);
        return networkObj.downloadSellerNetworkCategoryFiles();
    });

}