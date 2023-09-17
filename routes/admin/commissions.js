const ReturnTypesController = require('../../controller/admin/commissions');
const Authorization = require('../../middleware/auth');

module.exports = (router, app) => {
    router.post('/admin/addAndUpdateCommission', Authorization.isAdminAuthorised, (req, res, next) => {
        const commissionObj = (new ReturnTypesController()).boot(req, res);
        return commissionObj.addAndUpdateCommission();
    });

    router.get('/admin/getCommissionDetails/:commissionId', Authorization.isAdminAuthorised, (req, res, next) => {
        const commissionObj = (new ReturnTypesController()).boot(req, res);
        return commissionObj.getCommissionDetails();
    });

    router.post('/admin/changeStatusOfCommissions', Authorization.isAdminAuthorised, (req, res, next) => {
        const commissionObj = (new ReturnTypesController()).boot(req, res);
        return commissionObj.changeStatusOfCommissions();
    });

    router.post('/admin/deleteCommissions', Authorization.isAdminAuthorised, (req, res, next) => {
        const commissionObj = (new ReturnTypesController()).boot(req, res);
        return commissionObj.deleteCommissions();
    });

    router.post('/admin/commissionsListing', Authorization.isAdminAuthorised, (req, res, next) => {
        const commissionObj = (new ReturnTypesController()).boot(req, res);
        return commissionObj.commissionsListing();
    });

    router.post('/admin/downloadCommissionFiles', Authorization.isAdminAuthorised, (req, res, next) => {
        const commissionObj = (new ReturnTypesController()).boot(req, res);
        return commissionObj.downloadCommissionFiles();
    });

    router.post('/admin/commissionsList', Authorization.isAdminAuthorised, (req, res, next) => {
        const commissionObj = (new ReturnTypesController()).boot(req, res);
        return commissionObj.commissionsList();
    });
}