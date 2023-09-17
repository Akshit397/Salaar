/** @format */

const RazorpayController = require("../../controller/common/razorpay");
const Authorization = require("../../middleware/auth");
module.exports = (router, app) => {
    router.post("/common/createOrder", Authorization.isAuthorised, (req, res, next) => {
        const razorPayObj = new RazorpayController().boot(req, res);
        return razorPayObj.createRazorpayOrder();
    },);

    router.post("/createContact", Authorization.isAuthorised, (req, res, next) => {
        const razorPayObj = new RazorpayController().boot(req, res);
        return razorPayObj.createContact();
    },);

    router.post("/updateContact", Authorization.isAuthorised, (req, res, next) => {
        const razorPayObj = new RazorpayController().boot(req, res);
        return razorPayObj.createContact();
    },);

    router.post("/createFundAccount", Authorization.isAuthorised, (req, res, next) => {
        const razorPayObj = new RazorpayController().boot(req, res);
        return razorPayObj.createFundAccount();
    },);

    router.post("/createPayouts", Authorization.isAuthorised, (req, res, next) => {
        const razorPayObj = new RazorpayController().boot(req, res);
        return razorPayObj.createPayout();
    },);
};
