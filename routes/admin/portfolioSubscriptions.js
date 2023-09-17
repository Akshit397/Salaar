const PortfolioSubscriptionsController = require('../../controller/admin/portfolioSubscriptions');
const Authorization = require("../../middleware/auth");

module.exports = (router, app) => {
    router.post('/addAndUpdatePortfolioSubscription', Authorization.isAdminAuthorised, (req, res, next) => {
        const portfolioObj = (new PortfolioSubscriptionsController()).boot(req, res);
        return portfolioObj.addAndUpdatePortfolioSubscription();
    });

    router.get('/getPortfolioSubscriptionDetails/:portfolioSubscriptionId', Authorization.isAdminAuthorised, (req, res, next) => {
        const portfolioObj = (new PortfolioSubscriptionsController()).boot(req, res);
        return portfolioObj.getPortfolioSubscriptionDetails();
    });

    router.post('/portfolioSubscriptionsListing', Authorization.isAdminAuthorised, (req, res, next) => {
        const portfolioObj = (new PortfolioSubscriptionsController()).boot(req, res);
        return portfolioObj.portfolioSubscriptionsListing();
    });

    router.post('/changeStatusOfPortfolioSubscriptions', Authorization.isAdminAuthorised, (req, res, next) => {
        const portfolioObj = (new PortfolioSubscriptionsController()).boot(req, res);
        return portfolioObj.changeStatusOfPortfolioSubscriptions();
    });

    router.post('/deletePortfolioSubscriptions', Authorization.isAdminAuthorised, (req, res, next) => {
        const portfolioObj = (new PortfolioSubscriptionsController()).boot(req, res);
        return portfolioObj.deletePortfolioSubscriptions();
    });

    router.post('/downloadPortfolioSubscriptionFiles', Authorization.isAdminAuthorised, (req, res, next) => {
        const portfolioObj = (new PortfolioSubscriptionsController()).boot(req, res);
        return portfolioObj.downloadPortfolioSubscriptionFiles();
    });

    router.post('/portfolioSubscriptionList', Authorization.isAdminAuthorised, (req, res, next) => {
        const portfolioObj = (new PortfolioSubscriptionsController()).boot(req, res);
        return portfolioObj.portfolioSubscriptionList();
    });
}