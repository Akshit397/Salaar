const ProductsController = require("../../controller/common/websiteProd");

module.exports = (router, app) => {
  router.get("/common/getProducts", (req, res, next) => {
    const categoryObj = new ProductsController().boot(req, res);
    return categoryObj.getWebSiteProducts();
  });

  router.get("/getGameProducts/:id", (req, res, next) => {
    const categoryObj = new ProductsController().boot(req, res);
    return categoryObj.getWebSiteGameProducts();
  });
};
