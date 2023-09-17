const GamesController = require('../../controller/admin/games');
const Authorization = require('../../middleware/auth');

module.exports = (router, app) => {
  router.post('/admin/addAndUpdateGame', Authorization.isAdminAuthorised, (req, res, next) => {
    const gameObj = (new GamesController()).boot(req, res);
    return gameObj.addAndUpdateGame();
  });

  router.get('/admin/getGameDetails/:gameId', Authorization.isAdminAuthorised, (req, res, next) => {
    const gameObj = (new GamesController()).boot(req, res);
    return gameObj.getGameDetails();
  });

  router.post('/admin/changeStatusOfGames', Authorization.isAdminAuthorised, (req, res, next) => {
    const gameObj = (new GamesController()).boot(req, res);
    return gameObj.changeStatusOfGames();
  });

  router.post('/admin/deleteGames', Authorization.isAdminAuthorised, (req, res, next) => {
    const gameObj = (new GamesController()).boot(req, res);
    return gameObj.deleteGames();
  });

  router.post('/admin/gamesListing', Authorization.isAdminAuthorised, (req, res, next) => {
    const gameObj = (new GamesController()).boot(req, res);
    return gameObj.gamesListing();
  });

  router.post('/admin/downloadGameFiles', Authorization.isAdminAuthorised, (req, res, next) => {
    const gameObj = (new GamesController()).boot(req, res);
    return gameObj.downloadGameFiles();
  });

  router.post('/gamesList', (req, res, next) => {
    const gameObj = (new GamesController()).boot(req, res);
    return gameObj.gamesList();
  });
}