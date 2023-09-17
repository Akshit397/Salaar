/** @format */

const WebsiteController = require("../../controller/user/website");

module.exports = (router, app) => {
  router.get("/ua/countries", (req, res, next) => {
    const websiteObj = new WebsiteController().boot(req, res);
    return websiteObj.getCountriesUA();
  });
  router.post("/ua/countriespost", (req, res, next) => {
    const websiteObj = new WebsiteController().boot(req, res);
    return websiteObj.getCountriesUAPost();
  });
  router.get("/ua/categories", (req, res, next) => {
    const websiteObj = new WebsiteController().boot(req, res);
    return websiteObj.getCategoryiesUA();
  });
  router.get("/ua/brands", (req, res, next) => {
    const websiteObj = new WebsiteController().boot(req, res);
    return websiteObj.getBrandsUA();
  });

  router.get("/ua/game-products", (req, res, next) => {
    const websiteObj = new WebsiteController().boot(req, res);
    return websiteObj.getGameProductsUA();
  });

  router.get("/ua/game-products/:id", (req, res, next) => {
    const websiteObj = new WebsiteController().boot(req, res);
    return websiteObj.getGameProductsUAID();
  });

  router.get("/ua/ecomm-products", (req, res, next) => {
    const websiteObj = new WebsiteController().boot(req, res);
    return websiteObj.getEcommProductsUA();
  });
  router.get("/ua/ecomm-products/:id", (req, res, next) => {
    const websiteObj = new WebsiteController().boot(req, res);
    return websiteObj.getEcommProductsUAID();
  });
  router.get("/ua/product-detail/:id", (req, res, next) => {
    const websiteObj = new WebsiteController().boot(req, res);
    return websiteObj.getEcommProductsDetailUAID();
  });

  router.get("/ua/getDealDetailsall", (req, res, next) => {
    const dealObj = new WebsiteController().boot(req, res);
    return dealObj.getDealDetailsAll();
  });
};
