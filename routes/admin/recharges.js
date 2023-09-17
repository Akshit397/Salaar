const RechargesController = require('../../controller/admin/recharges');
const Authorization = require('../../middleware/auth');

module.exports = (router, app) => {
    router.post('/admin/addAndUpdateRecharge', Authorization.isAdminAuthorised, (req, res, next) => {
        const rechargeObj = (new RechargesController()).boot(req, res);
        return rechargeObj.addAndUpdateRecharge();
    });

    router.get('/admin/getRechargeDetails/:rechargeId', Authorization.isAdminAuthorised, (req, res, next) => {
        const rechargeObj = (new RechargesController()).boot(req, res);
        return rechargeObj.getRechargeDetails();
    });

    router.post('/admin/changeStatusOfRecharges', Authorization.isAdminAuthorised, (req, res, next) => {
        const rechargeObj = (new RechargesController()).boot(req, res);
        return rechargeObj.changeStatusOfRecharges();
    });

    router.post('/admin/deleteRecharges', Authorization.isAdminAuthorised, (req, res, next) => {
        const rechargeObj = (new RechargesController()).boot(req, res);
        return rechargeObj.deleteRecharges();
    });

    router.post('/admin/rechargesListing', Authorization.isAdminAuthorised, (req, res, next) => {
        const rechargeObj = (new RechargesController()).boot(req, res);
        return rechargeObj.rechargesListing();
    });

    router.post('/admin/downloadRechargeFiles', Authorization.isAdminAuthorised, (req, res, next) => {
        const rechargeObj = (new RechargesController()).boot(req, res);
        return rechargeObj.downloadRechargeFiles();
    });
}