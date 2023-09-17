const RechargesController = require('../../controller/admin/returnTypes');
const Authorization = require('../../middleware/auth');

module.exports = (router, app) => {
    router.post('/admin/addAndUpdateReturnType', Authorization.isAdminAuthorised, (req, res, next) => {
        const rechargeObj = (new RechargesController()).boot(req, res);
        return rechargeObj.addAndUpdateReturnType();
    });

    router.get('/admin/getReturnTypeDetails/:returnTypeId', Authorization.isAdminAuthorised, (req, res, next) => {
        const rechargeObj = (new RechargesController()).boot(req, res);
        return rechargeObj.getReturnTypeDetails();
    });

    router.post('/admin/changeStatusOfReturnTypes', Authorization.isAdminAuthorised, (req, res, next) => {
        const rechargeObj = (new RechargesController()).boot(req, res);
        return rechargeObj.changeStatusOfReturnTypes();
    });

    router.post('/admin/deleteReturnTypes', Authorization.isAdminAuthorised, (req, res, next) => {
        const rechargeObj = (new RechargesController()).boot(req, res);
        return rechargeObj.deleteReturnTypes();
    });

    router.post('/admin/returnTypesListing', Authorization.isAdminAuthorised, (req, res, next) => {
        const rechargeObj = (new RechargesController()).boot(req, res);
        return rechargeObj.returnTypesListing();
    });

    router.post('/admin/downloadReturnTypeFiles', Authorization.isAdminAuthorised, (req, res, next) => {
        const rechargeObj = (new RechargesController()).boot(req, res);
        return rechargeObj.downloadReturnTypeFiles();
    });

    router.post('/returnTypesList', (req, res, next) => {
        const rechargeObj = (new RechargesController()).boot(req, res);
        return rechargeObj.returnTypesList();
    });
}