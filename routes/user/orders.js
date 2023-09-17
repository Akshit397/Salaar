/** @format */

const OrderController = require("../../controller/user/order.js");
const Authorization = require("../../middleware/auth.js");

module.exports = (router, app) => {
    router.post("/order/validateSponserId", Authorization.isAuthorised, (req, res, next) => {
        const orderObj = new OrderController().boot(req, res);
        return orderObj.validateSponserId();
    });

    router.post("/order/addShippingAddress", Authorization.isAuthorised, (req, res, next) => {
        const orderObj = new OrderController().boot(req, res);
        return orderObj.addShippingAddress();
    });

    router.post("/order/validatePaymentMethods", Authorization.isAuthorised, (req, res, next) => {
        const orderObj = new OrderController().boot(req, res);
        return orderObj.validatePaymentMethods();
    });

    router.post("/order/placeOrder", Authorization.isAuthorised, (req, res, next) => {
        const orderObj = new OrderController().boot(req, res);
        return orderObj.placeOrder();
    });

    router.get("/getUserAddress", Authorization.isAuthorised, (req, res, next) => {
        const orderObj = new OrderController().boot(req, res);
        return orderObj.getUserAddress();
    });

    router.get("/getOrderTrackingDetails/:orderId", Authorization.isAuthorised, (req, res, next) => {
        const orderObj = new OrderController().boot(req, res);
        return orderObj.getOrderTrackingDetails();
    });

    router.get("/getShipmentLabelOfOrder/:orderId", (req, res, next) => {
        const orderObj = new OrderController().boot(req, res);
        return orderObj.getShipmentLabelOfOrder();
    });

    router.get("/getManifestDetailsOfOrder/:orderId", (req, res, next) => {
        const orderObj = new OrderController().boot(req, res);
        return orderObj.getManifestDetailsOfOrder();
    });

    router.get("/cancelOrder/:orderId", Authorization.isAuthorised, (req, res, next) => {
        const orderObj = new OrderController().boot(req, res);
        return orderObj.cancelOrder();
    });

};
