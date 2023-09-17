const GamesController = require('../../controller/user/games');
const Authorization = require("../../middleware/auth");

module.exports = (router, app) => {
    router.post('/website/gameProductsListing', (req, res, next) => {
        const gameObj = (new GamesController()).boot(req, res);
        return gameObj.gameProductsListing();
    });

    router.get('/website/getGameProductDetails/:customUrl', (req, res, next) => {
        const gameObj = (new GamesController()).boot(req, res);
        return gameObj.getGameProductDetails();
    });

    router.post('/user/userGameProductsListing', Authorization.isAuthorised, (req, res, next) => {
        const gameObj = (new GamesController()).boot(req, res);
        return gameObj.userGameProductsListing();
    });

    router.get('/user/gamesListInGameProducts/:gameProductId', Authorization.isAuthorised, (req, res, next) => {
        const gameObj = (new GamesController()).boot(req, res);
        return gameObj.gamesListInGameProducts();
    });

    router.get('/user/giftsListInGameProducts/:gameProductId', Authorization.isAuthorised, (req, res, next) => {
        const gameObj = (new GamesController()).boot(req, res);
        return gameObj.giftsListInGameProducts();
    });

}