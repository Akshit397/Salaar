const BrandsController = require('../../controller/admin/brands');
const Authorization = require('../../middleware/auth');

module.exports = (router, app) => {
    router.post('/admin/addAndUpdateBrand', Authorization.isAdminAuthorised, (req, res, next) => {
        const brandObj = (new BrandsController()).boot(req, res);
        return brandObj.addAndUpdateBrand();
    });

    router.get('/admin/getBrandDetails/:brandId', Authorization.isAdminAuthorised, (req, res, next) => {
        const brandObj = (new BrandsController()).boot(req, res);
        return brandObj.getBrandDetails();
    });

    router.post('/admin/changeStatusOfBrands', Authorization.isAdminAuthorised, (req, res, next) => {
        const brandObj = (new BrandsController()).boot(req, res);
        return brandObj.changeStatusOfBrands();
    });

    router.post('/admin/deleteBrands', Authorization.isAdminAuthorised, (req, res, next) => {
        const brandObj = (new BrandsController()).boot(req, res);
        return brandObj.deleteBrands();
    });

    router.post('/admin/brandsListing', Authorization.isAdminAuthorised, (req, res, next) => {
        const brandObj = (new BrandsController()).boot(req, res);
        return brandObj.brandsListing();
    });

    router.post('/admin/downloadBrandFiles', Authorization.isAdminAuthorised, (req, res, next) => {
        const brandObj = (new BrandsController()).boot(req, res);
        return brandObj.downloadBrandFiles();
    });

    router.post('/brandsList', (req, res, next) => {
        const brandObj = (new BrandsController()).boot(req, res);
        return brandObj.brandsList();
    });
}