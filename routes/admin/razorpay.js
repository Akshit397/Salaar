const AdminRazorpayController = require('../../controller/admin/razorpay');
const Authorization = require("../../middleware/auth");

module.exports = (router, app) => {
  router.get('/admin/getPayouts', Authorization.isAdminAuthorised, (req, res, next) => {
    const razorPayObj = (new AdminRazorpayController()).boot(req, res);
    return razorPayObj.getPayouts();
  });

  router.post('/admin/createPayout', Authorization.isAdminAuthorised, (req, res, next) => {
    const razorPayObj = (new AdminRazorpayController()).boot(req, res);
    return razorPayObj.createPayout();
  });

  router.get('/admin/getWithdrawHistoryList', Authorization.isAdminAuthorised, (req, res, next) => {
    const razorPayObj = (new AdminRazorpayController()).boot(req, res);
    return razorPayObj.getWithdrawHistoryList();
  });

  router.post('/admin/createWithdrawRequest', Authorization.isAdminAuthorised, (req, res, next) => {
    const razorPayObj = (new AdminRazorpayController()).boot(req, res);
    return razorPayObj.createWithdrawRequest();
  });

  router.get('/admin/getPayoutTotal', Authorization.isAdminAuthorised, (req, res, next) => {
    const razorPayObj = (new AdminRazorpayController()).boot(req, res);
    return razorPayObj.getPayoutTotal();
  });
}