/** @format */

const _ = require("lodash");

const Controller = require("../base");
const { Plans } = require("../../models/s_plan_game");
const { OrderSummary } = require("../../models/s_order_summary");
const {
  Order,
  OrderRefund,
  OrderReturnOrReplace,
  OrderTrack,
  OrderProductReview,
  OrderProductChats,
} = require("../../models/s_old_orders");
const { Cart } = require("../../models/s_cart");
const RequestBody = require("../../utilities/requestBody");
const CommonService = require("../../utilities/common");
const Services = require("../../utilities/index");
const { Users } = require("../../models/s_users");
const Model = require("../../utilities/model");
class OrderController extends Controller {
  constructor() {
    super();
    this.commonService = new CommonService();
    this.services = new Services();
    this.requestBody = new RequestBody();
  }

  async placeOrder() {
    try {
      let digitalOrders = [];
      let ecommOrders = [];
      let orderData = this.req.body.products;
      let orderInsertId = [];
      let totalPrice = 0;
      for (let order of orderData)
        if (order.hasOwnProperty("ecomm_prod_id")) ecommOrders.push(order);
        else digitalOrders.push(order);
      if (digitalOrders.length) {
        for (let order of digitalOrders) {
          let temp = {};
          let planDetails = await Plans.findById(order.game_prod_id.plan);
          temp.user_id = this.req.user;
          temp.game_prod_id = order.game_prod_id._id;
          temp.quantity = order.quantity;
          temp.unit_price = order.game_prod_id.unit_price;
          temp.final_price = order.game_prod_id.unit_price * order.quantity;
          temp.status = "order_received";
          temp.payu_order_id = "";
          temp.logi_order_id = "";
          console.log(temp);
          if (planDetails?.width > 0 && planDetails?.depth > 0) {
            if (this.req.body.refferal_id) {
              // Order using refferal id

              let refferalUser = await Users.find({
                registerId: this.req.body.refferal_id,
              });
              let existOrder = await Order.find({
                game_prod_id: order.game_prod_id._id,
                user_id: refferalUser._id,
              }).sort({ created_at: "asc" });

              for (let extorder of existOrder) {
                if (extorder.child_ids.length < planDetails.width) {
                  temp.parent_id = extorder._id;
                  temp.isInitiater = false;
                  temp.initiater_id = extorder.initiater_id;
                  temp.child_ids = [];
                  temp.depth = extorder.depth + 1;
                  console.log("order type obj ", temp);
                  let orderInsert = await Order.create(temp);
                  orderInsertId.push(orderInsert._id);
                  let updateRefferalOrder = await Order.findByIdAndUpdate(
                    extorder._id,
                    { $push: { child_ids: orderInsert._id } },
                  );
                  break;
                }
              }
            } else {
              let existOrder = await Order.find({
                game_prod_id: order.game_prod_id._id,
              }).sort({ created_at: "asc" });
              console.log("Existing order : ", existOrder.length);
              if (existOrder && existOrder.length) {
                for (let extorder of existOrder) {
                  if (extorder.child_ids.length < planDetails.width) {
                    temp.parent_id = extorder._id;
                    temp.isInitiater = false;
                    temp.initiater_id = extorder.isInitiater
                      ? extorder._id
                      : extorder._id;
                    temp.child_ids = [];
                    temp.depth = (extorder.depth ? extorder.depth : 0) + 1;
                    console.log("order type obj ", temp);
                    let orderInsert = await Order.create(temp);
                    orderInsertId.push(orderInsert._id);
                    let updateExistOrder = await Order.findByIdAndUpdate(
                      extorder._id,
                      { $push: { child_ids: orderInsert._id } },
                    );
                    break;
                  }
                }
              } else {
                temp.parent_id = null;
                temp.isInitiater = true;
                temp.initiater_id = null;
                temp.position = 0;
                temp.depth = 0;
                temp.child_ids = [];
                console.log("order type obj ", temp);
                let orderInsert = await Order.create(temp);
                orderInsertId.push(orderInsert._id);
              }
            }
          } else {
            let orderInsert = await Order.create(temp);
            orderInsertId.push(orderInsert._id);
          }

          totalPrice += temp.final_price;
          console.log(totalPrice);
        }
      }

      if (ecommOrders.length) {
        for (let order of ecommOrders) {
          let temp = {};
          temp.user_id = this.req.user;
          temp.ecomm_prod_id = order?.ecomm_prod_id?._id;
          temp.quantity = order.quantity;
          temp.unit_price = parseInt(order?.ecomm_prod_id?.unit_price);
          temp.final_price =
            parseInt(order?.ecomm_prod_id?.unit_price) *
            parseInt(order.quantity);
          temp.status = "order_received";
          temp.payu_order_id = "";
          temp.logi_order_id = "";
          let orderInsert = await Order.create(temp);
          orderInsertId.push(orderInsert._id);
          totalPrice += temp.final_price;
        }
      }

      let insertSummary = await OrderSummary.insertMany([
        {
          order_id: orderInsertId,
          user_id: this.req.user,
          refferal_id: this.req.body.refferal_id,
          total_price: totalPrice,
          tranx_fees: this.req.body.tranx_fees,
          trnx_method: this.req.body.trnx_method,
        },
      ]);

      this.res.send({
        status: 1,
        message: "Order Placed",
        data: insertSummary,
      });
    } catch (error) {
      console.error("error in placing game product order ", error);
      this.res
        .status(500)
        .send({ status: 0, message: error.message, data: error });
    }
  }


  async getAllOrder() {
    try {
      let user_id = "";
      if (this.req.params) {
        user_id = this.req.params;
      } else {
        user_id = this.req.user;
      }
      const order = await Order.find({ user_id: user_id?.user_id });
      return this.res.send({ status: 1, data: order, message: "Orders" });
    } catch (error) {
      console.log("error- ", error);
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }

  async getOrderByUsingID() {
    try {
      let user_id = "";
      if (this.req.params) {
        user_id = this.req.params;
      } else {
        user_id = this.req.user;
      }
      const order = await Order.find({
        user_id: user_id?.user_id,
        _id: user_id?.id,
      })
      return this.res.send({ status: 1, data: order, message: "Orders" });
    } catch (error) {
      console.log("error- ", error);
      return this.res.send({ status: 0, message: "Internal server error" });
    }
  }

  AddRefund = async () => {
    try {
      let data = this.req.body;
      const fieldsArray = [
        "order_id",
        "refund_amount",
        "product_details",
        "refund_status",
        "payment_method",
        "cancel_order",
        "user_id",
      ];
      const emptyFields = await this.requestBody.checkEmptyWithFields(
        data,
        fieldsArray,
      );
      if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
        return this.res.send({
          status: 0,
          message:
            "Please send" + " " + emptyFields.toString() + " fields required.",
        });
      } else {
        const newCode = await new Model(OrderRefund).store(data);
        if (_.isEmpty(newCode)) {
          return this.res.send({
            status: 0,
            message: "Order refund not saved",
          });
        }
        return this.res.send({
          status: 1,
          message: "Order Refund added successfully",
        });
      }
    } catch (error) {
      console.log("error- ", error);
      this.res.status(500).send({ status: 0, message: error });
    }
  };

  getOrderRefund = async () => {
    try {
      let data = this.req.params;
      const fieldsArray = ["user_id"];
      const emptyFields = await this.requestBody.checkEmptyWithFields(
        data,
        fieldsArray,
      );
      if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
        return this.res.send({
          status: 0,
          message:
            "Please send" + " " + emptyFields.toString() + " fields required.",
        });
      } else {
        let refund = await OrderRefund.find({
          user_id: data?.user_id,
        }).populate({ path: "order_id" });

        if (_.isEmpty(refund)) {
          return this.res.send({
            status: 0,
            message: "Invalid User_id:" + data?.user_id,
          });
        }
        return this.res.send({
          status: 1,
          payload: refund,
        });
      }
    } catch (error) {
      console.log("error- ", error);
      this.res.status(500).send({ status: 0, message: error });
    }
  };

  AddReturn = async () => {
    try {
      let data = this.req.body;
      const fieldsArray = [
        "order_id",
        "replacement_status",
        "refund_status",
        "product_details",
        "payment_method",
        "return_reason",
        "user_id",
      ];
      const emptyFields = await this.requestBody.checkEmptyWithFields(
        data,
        fieldsArray,
      );
      if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
        return this.res.send({
          status: 0,
          message:
            "Please send" + " " + emptyFields.toString() + " fields required.",
        });
      } else {
        const newCode = await new Model(OrderReturnOrReplace).store(data);
        if (_.isEmpty(newCode)) {
          return this.res.send({
            status: 0,
            message: "Order return not saved",
          });
        }
        return this.res.send({
          status: 1,
          message: "Order return added successfully",
        });
      }
    } catch (error) {
      console.log("error- ", error);
      this.res.status(500).send({ status: 0, message: error });
    }
  };

  getOrderReturn = async () => {
    try {
      let data = this.req.params;
      const fieldsArray = ["user_id"];
      const emptyFields = await this.requestBody.checkEmptyWithFields(
        data,
        fieldsArray,
      );
      if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
        return this.res.send({
          status: 0,
          message:
            "Please send" + " " + emptyFields.toString() + " fields required.",
        });
      } else {
        let refund = await OrderReturnOrReplace.find({
          user_id: data?.user_id,
        }).populate({ path: "order_id" });

        if (_.isEmpty(refund)) {
          return this.res.send({
            status: 0,
            message: "Invalid User_id:" + data?.user_id,
          });
        }
        return this.res.send({
          status: 1,
          payload: refund,
        });
      }
    } catch (error) {
      console.log("error- ", error);
      this.res.status(500).send({ status: 0, message: error });
    }
  };

  AddProductchat = async () => {
    try {
      let data = this.req.body;
      const fieldsArray = ["order_id", "chat", "status", "user_id"];
      const emptyFields = await this.requestBody.checkEmptyWithFields(
        data,
        fieldsArray,
      );
      if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
        return this.res.send({
          status: 0,
          message:
            "Please send" + " " + emptyFields.toString() + " fields required.",
        });
      } else {
        const newCode = await new Model(OrderProductChats).store(data);
        if (_.isEmpty(newCode)) {
          return this.res.send({
            status: 0,
            message: "Order Product chat not saved",
          });
        }
        return this.res.send({
          status: 1,
          message: "Order Product chat added successfully",
        });
      }
    } catch (error) {
      console.log("error- ", error);
      this.res.status(500).send({ status: 0, message: error });
    }
  };

  getOrderProductChat = async () => {
    try {
      let data = this.req.params;
      const fieldsArray = ["user_id"];
      const emptyFields = await this.requestBody.checkEmptyWithFields(
        data,
        fieldsArray,
      );
      if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
        return this.res.send({
          status: 0,
          message:
            "Please send" + " " + emptyFields.toString() + " fields required.",
        });
      } else {
        let refund = await OrderProductChats.find({
          user_id: data?.user_id,
        }).populate({ path: "order_id" });

        if (_.isEmpty(refund)) {
          return this.res.send({
            status: 0,
            message: "Invalid User_id:" + data?.user_id,
          });
        }
        return this.res.send({
          status: 1,
          payload: refund,
        });
      }
    } catch (error) {
      console.log("error- ", error);
      this.res.status(500).send({ status: 0, message: error });
    }
  };
  AddProductReview = async () => {
    try {
      let data = this.req.body;
      const fieldsArray = [
        "order_id",
        "product_name",
        "product_rating",
        "product_review",
        "review_rating",
        "seller_response",
        "user_id",
      ];
      const emptyFields = await this.requestBody.checkEmptyWithFields(
        data,
        fieldsArray,
      );
      if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
        return this.res.send({
          status: 0,
          message:
            "Please send" + " " + emptyFields.toString() + " fields required.",
        });
      } else {
        const newCode = await new Model(OrderProductReview).store(data);
        if (_.isEmpty(newCode)) {
          return this.res.send({
            status: 0,
            message: "Order Product review not saved",
          });
        }
        return this.res.send({
          status: 1,
          message: "Order Product review added successfully",
        });
      }
    } catch (error) {
      console.log("error- ", error);
      this.res.status(500).send({ status: 0, message: error });
    }
  };

  getOrderProductReview = async () => {
    try {
      let data = this.req.params;
      const fieldsArray = ["user_id"];
      const emptyFields = await this.requestBody.checkEmptyWithFields(
        data,
        fieldsArray,
      );
      if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
        return this.res.send({
          status: 0,
          message:
            "Please send" + " " + emptyFields.toString() + " fields required.",
        });
      } else {
        let refund = await OrderProductReview.find({
          user_id: data?.user_id,
        }).populate({ path: "order_id" });

        if (_.isEmpty(refund)) {
          return this.res.send({
            status: 0,
            message: "Invalid User_id:" + data?.user_id,
          });
        }
        return this.res.send({
          status: 1,
          payload: refund,
        });
      }
    } catch (error) {
      console.log("error- ", error);
      this.res.status(500).send({ status: 0, message: error });
    }
  };
}

module.exports = OrderController;
