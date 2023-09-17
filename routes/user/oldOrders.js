/** @format */

const OrderController = require("../../controller/user/oldOrder");
const Authorization = require("../../middleware/auth.js");

module.exports = (router, app) => {

  router.post("/place-order", Authorization.isAuthorised, (req, res, next) => {
    const orderObj = new OrderController().boot(req, res);
    return orderObj.placeOrder();
  });
  router.get("/order-summary", Authorization.isAuthorised, (req, res, next) => {
    const orderObj = new OrderController().boot(req, res);
    return orderObj.getOrderSummary();
  });

  router.get("/orders/", Authorization.isAuthorised, (req, res, next) => {
    const orderObj = new OrderController().boot(req, res);
    return orderObj.getAllOrder();
  });

  router.get(
    "/orders/:user_id",
    Authorization.isAuthorised,
    (req, res, next) => {
      const orderObj = new OrderController().boot(req, res);
      return orderObj.getAllOrder();
    },
  );

  router.get(
    "/orders/:user_id/:id",
    Authorization.isAuthorised,
    (req, res, next) => {
      const orderObj = new OrderController().boot(req, res);
      return orderObj.getOrderByUsingID();
    },
  );

  router.post(
    "/addrefundorders",
    Authorization.isAuthorised,
    (req, res, next) => {
      const orderObj = new OrderController().boot(req, res);
      return orderObj.AddRefund();
    },
  );

  router.get(
    "/getrefundorders/:user_id",
    Authorization.isAuthorised,
    (req, res, next) => {
      const orderObj = new OrderController().boot(req, res);
      return orderObj.getOrderRefund();
    },
  );
  router.post(
    "/addreturnorders",
    Authorization.isAuthorised,
    (req, res, next) => {
      const orderObj = new OrderController().boot(req, res);
      return orderObj.AddReturn();
    },
  );

  router.get(
    "/getreturnorders/:user_id",
    Authorization.isAuthorised,
    (req, res, next) => {
      const orderObj = new OrderController().boot(req, res);
      return orderObj.getOrderReturn();
    },
  );

  router.post(
    "/addProductchatorders",
    Authorization.isAuthorised,
    (req, res, next) => {
      const orderObj = new OrderController().boot(req, res);
      return orderObj.AddProductchat();
    },
  );

  router.get(
    "/getProductchatorders/:user_id",
    Authorization.isAuthorised,
    (req, res, next) => {
      const orderObj = new OrderController().boot(req, res);
      return orderObj.getOrderProductChat();
    },
  );

  router.post(
    "/addProductrevieworders",
    Authorization.isAuthorised,
    (req, res, next) => {
      const orderObj = new OrderController().boot(req, res);
      return orderObj.AddProductReview();
    },
  );

  router.get(
    "/getProductrevieworders/:user_id",
    Authorization.isAuthorised,
    (req, res, next) => {
      const orderObj = new OrderController().boot(req, res);
      return orderObj.getOrderProductReview();
    },
  );
};
