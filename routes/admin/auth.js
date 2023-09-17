/** @format */

const AdminAuthController = require("../../controller/admin/authentication");
const Authorization = require('../../middleware/auth');

module.exports = (router, app) => {
  router.post("/admin-login", (req, res, next) => {
    const authObj = new AdminAuthController().boot(req, res);
    return authObj.signIn();
  });

  router.post("/admin-signup", (req, res, next) => {
    const authObj = new AdminAuthController().boot(req, res);
    return authObj.signUp();
  });

  router.get("/adminLoginAsUser/:userId", Authorization.isAdminAuthorised, (req, res, next) => {
    const authObj = new AdminAuthController().boot(req, res);
    return authObj.adminLoginAsUser();
  });
};
