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

  router.post('/admin/getWithdrawHistoryList', Authorization.isAdminAuthorised, (req, res, next) => {
    const razorPayObj = (new AdminRazorpayController()).boot(req, res);
    return razorPayObj.getWithdrawHistoryList();
  });

  router.get('/admin/getPayoutTotal', Authorization.isAdminAuthorised, (req, res, next) => {
    const razorPayObj = (new AdminRazorpayController()).boot(req, res);
    return razorPayObj.getPayoutTotal();
  });

  router.post('/admin/payoutDateStatistics', Authorization.isAdminAuthorised, (req, res, next) => {
    const razorPayObj = (new AdminRazorpayController()).boot(req, res);
    return razorPayObj.payoutStatistics();
  });

  router.get('/admin/payoutDateStatisticsTotal', Authorization.isAdminAuthorised, (req, res, next) => {
    const razorPayObj = (new AdminRazorpayController()).boot(req, res);
    return razorPayObj.payoutStatisticsTotal();
  });

  router.get('/admin/withdrawal/:withdrawal_id', Authorization.isAdminAuthorised, (req, res, next) => {
    const razorPayObj = (new AdminRazorpayController()).boot(req, res);
    return razorPayObj.getWithdrawalDetails();
  });
}