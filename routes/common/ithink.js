const IthinkController = require("../../controller/common/ithink");

module.exports = (router, app) => {
  router.post("/checkpincode", (req, res, next) => {
    const categoryObj = new IthinkController().boot(req, res);
    return categoryObj.pinCodeCheck();
  });

  router.post("/statesList", (req, res, next) => {
    const categoryObj = new IthinkController().boot(req, res);
    return categoryObj.getStates();
  });

  router.post("/citiesList", (req, res, next) => {
    const categoryObj = new IthinkController().boot(req, res);
    return categoryObj.getCities();
  });

};
