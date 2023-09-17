const NetworkCategoriesController = require('../../controller/admin/networkCategories');
const Authorization = require('../../middleware/auth');

module.exports = (router, app) => {

    router.post('/admin/getCommissionOfCategories', Authorization.isAdminAuthorised, (req, res, next) => {
        const networkObj = (new NetworkCategoriesController()).boot(req, res);
        return networkObj.getCommissionOfCategories();
    });

    router.post('/admin/addAndUpdateNetworkCategory', Authorization.isAdminAuthorised, (req, res, next) => {
        const networkObj = (new NetworkCategoriesController()).boot(req, res);
        return networkObj.addAndUpdateNetworkCategory();
    });

    router.get('/admin/getNetworkCategoryDetails/:networkCategoryId', Authorization.isAdminAuthorised, (req, res, next) => {
        const networkObj = (new NetworkCategoriesController()).boot(req, res);
        return networkObj.getNetworkCategoryDetails();
    });

    router.post('/admin/changeStatusOfNetworkCategories', Authorization.isAdminAuthorised, (req, res, next) => {
        const networkObj = (new NetworkCategoriesController()).boot(req, res);
        return networkObj.changeStatusOfNetworkCategories();
    });

    router.post('/admin/deleteNetworkCategories', Authorization.isAdminAuthorised, (req, res, next) => {
        const networkObj = (new NetworkCategoriesController()).boot(req, res);
        return networkObj.deleteNetworkCategories();
    });

    router.post('/admin/networkCategoriesListing', Authorization.isAdminAuthorised, (req, res, next) => {
        const networkObj = (new NetworkCategoriesController()).boot(req, res);
        return networkObj.networkCategoriesListing();
    });

    router.post('/admin/downloadNetworkCategoryFiles', Authorization.isAdminAuthorised, (req, res, next) => {
        const networkObj = (new NetworkCategoriesController()).boot(req, res);
        return networkObj.downloadNetworkCategoryFiles();
    });

}