const PlansController = require('../../controller/admin/plans');
const Authorization = require('../../middleware/auth');

module.exports = (router, app) => {
    router.post('/admin/addAndUpdatePlan', Authorization.isAdminAuthorised, (req, res, next) => {
        const planObj = (new PlansController()).boot(req, res);
        return planObj.addAndUpdatePlan();
    });

    router.get('/admin/getPlanDetails/:planId', Authorization.isAdminAuthorised, (req, res, next) => {
        const planObj = (new PlansController()).boot(req, res);
        return planObj.getPlanDetails();
    });

    router.post('/admin/changeStatusOfPlans', Authorization.isAdminAuthorised, (req, res, next) => {
        const planObj = (new PlansController()).boot(req, res);
        return planObj.changeStatusOfPlans();
    });

    router.post('/admin/deletePlans', Authorization.isAdminAuthorised, (req, res, next) => {
        const planObj = (new PlansController()).boot(req, res);
        return planObj.deletePlans();
    });

    router.post('/admin/plansListing', Authorization.isAdminAuthorised, (req, res, next) => {
        const planObj = (new PlansController()).boot(req, res);
        return planObj.plansListing();
    });

    router.post('/admin/downloadPlanFiles', Authorization.isAdminAuthorised, (req, res, next) => {
        const planObj = (new PlansController()).boot(req, res);
        return planObj.downloadPlanFiles();
    });

    router.post('/plansList', (req, res, next) => {
        const planObj = (new PlansController()).boot(req, res);
        return planObj.plansList();
    });
}