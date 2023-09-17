const GameProductsController = require('../../controller/admin/gameProducts');
const Authorization = require('../../middleware/auth');

module.exports = (router, app) => {
    router.post('/admin/addAndUpdateGameProduct', Authorization.isAdminAuthorised, (req, res, next) => {
        const gameObj = (new GameProductsController()).boot(req, res);
        return gameObj.addAndUpdateGameProduct();
    });

    router.get('/admin/getGameProductDetails/:gameProductId', Authorization.isAdminAuthorised, (req, res, next) => {
        const gameObj = (new GameProductsController()).boot(req, res);
        return gameObj.getGameProductDetails();
    });

    router.post('/admin/changeStatusOfGameProducts', Authorization.isAdminAuthorised, (req, res, next) => {
        const gameObj = (new GameProductsController()).boot(req, res);
        return gameObj.changeStatusOfGameProducts();
    });

    router.post('/admin/deleteGameProducts', Authorization.isAdminAuthorised, (req, res, next) => {
        const gameObj = (new GameProductsController()).boot(req, res);
        return gameObj.deleteGameProducts();
    });

    router.post('/admin/gameProductsListing', Authorization.isAdminAuthorised, (req, res, next) => {
        const gameObj = (new GameProductsController()).boot(req, res);
        return gameObj.gameProductsListing();
    });

    router.post('/admin/downloadGameProductFiles', Authorization.isAdminAuthorised, (req, res, next) => {
        const gameObj = (new GameProductsController()).boot(req, res);
        return gameObj.downloadGameProductFiles();
    });

    router.post('/admin/addEcomProduct', Authorization.isAdminAuthorised, (req, res, next) => {
        const gameObj = (new GameProductsController()).boot(req, res);
        return gameObj.addEcomProduct();
    });

    router.post('/admin/deleteEcomProduct', Authorization.isAdminAuthorised, (req, res, next) => {
        const gameObj = (new GameProductsController()).boot(req, res);
        return gameObj.deleteEcomProduct();
    });

    router.post('/admin/ecomProductsListing', Authorization.isAdminAuthorised, (req, res, next) => {
        const gameObj = (new GameProductsController()).boot(req, res);
        return gameObj.ecomProductsListing();
    });

    router.post('/gameProductFieldsList', (req, res, next) => {
        const gameObj = (new GameProductsController()).boot(req, res);
        return gameObj.gameProductFieldsList();
    });

    router.post('/gameProductFieldsListForGifts', (req, res, next) => {
        const gameObj = (new GameProductsController()).boot(req, res);
        return gameObj.gameProductFieldsListForGifts();
    });
}