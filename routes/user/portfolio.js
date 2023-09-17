const PortfolioController = require('../../controller/user/portfolio');
const Authorization = require("../../middleware/auth");

module.exports = (router, app) => {
    router.post('/addAndUpdatePortfolio', Authorization.isAuthorised, (req, res, next) => {
        const portfolioObj = (new PortfolioController()).boot(req, res);
        return portfolioObj.addAndUpdatePortfolio();
    });

    router.get('/getPortfolioDetails', Authorization.isAuthorised, (req, res, next) => {
        const portfolioObj = (new PortfolioController()).boot(req, res);
        return portfolioObj.getPortfolioDetails();
    });

    router.post('/changeStatusOfPortfolio', Authorization.isAuthorised, (req, res, next) => {
        const portfolioObj = (new PortfolioController()).boot(req, res);
        return portfolioObj.changeStatusOfPortfolio();
    });

    router.post('/deletePortfolio', Authorization.isAuthorised, (req, res, next) => {
        const portfolioObj = (new PortfolioController()).boot(req, res);
        return portfolioObj.deletePortfolio();
    });

    // portfolio website api's 
    router.post('/portfolioHomePage', (req, res, next) => {
        const portfolioObj = (new PortfolioController()).boot(req, res);
        return portfolioObj.portfolioHomePage();
    });

    router.get('/getPortfolioDetailsOfUser/:portfolioId', (req, res, next) => {
        const portfolioObj = (new PortfolioController()).boot(req, res);
        return portfolioObj.getPortfolioDetailsOfUser();
    });

    router.post('/portfolioCategoryPage', (req, res, next) => {
        const portfolioObj = (new PortfolioController()).boot(req, res);
        return portfolioObj.portfolioCategoryPage();
    });
}