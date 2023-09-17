/** @format */

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const OrderSchema = Schema({
  payu_order_id: {
    type: String,
  },
  logi_order_id: {
    type: String,
  },
  parent_id: {
    type: Schema.Types.ObjectId,
    ref: "Order",
  },
  child_ids: [
    {
      type: Schema.Types.ObjectId,
      ref: "Order",
    },
  ],
  initiater_id: {
    type: Schema.Types.ObjectId,
    ref: "Order",
  },
  isInitiater: {
    type: Boolean,
    default: false,
  },
  position: {
    type: Number,
  },
  depth: {
    type: Number,
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  quantity: {
    type: Number,
    default: 0,
  },
  unit_price: {
    type: Number,
    default: 0,
  },
  final_price: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
  },
  rorre: {
    type: String,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

const OrderRefundSchema = new Schema(
  {
    order_id: {
      type: Schema.Types.ObjectId,
      ref: "Order",
    },
    refund_amount: { type: Number },
    refund_status: {
      type: String,
      enum: ["pending", "processing", "completed", "rejected"],
    },
    product_details: { type: String },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    payment_method: { type: String },
    cancel_order: { type: String },
  },
  { timestamps: true },
);

const OrderReturnORReplaceSchema = new Schema(
  {
    order_id: {
      type: Schema.Types.ObjectId,
      ref: "Order",
    },
    replacement_status: {
      type: String,
      enum: ["pending", "processing", "completed", "rejected"],
    },
    refund_status: {
      type: String,
      enum: ["pending", "processing", "completed"],
    },
    product_details: { type: String },
    payment_method: { type: String },
    return_reason: { type: String },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

const OrderProductChatsSchema = new Schema(
  {
    order_id: {
      type: Schema.Types.ObjectId,
      ref: "Order",
    },
    chat: { type: String },
    status: { type: String, enum: ["open", "close"] },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

const OrderProductReviewSchema = new Schema(
  {
    order_id: {
      type: Schema.Types.ObjectId,
      ref: "Order",
    },
    product_name: { type: String },
    product_rating: { type: String },
    product_review: { type: String },
    seller_response: { type: String },
    review_rating: { type: String },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

const OrderTrackSchema = new Schema({}, { timestamps: true });

const Order = mongoose.model("Order", OrderSchema);
const OrderRefund = mongoose.model("Orderrefund", OrderRefundSchema);
const OrderReturnOrReplace = mongoose.model(
  "OrderReturnOrReplace",
  OrderReturnORReplaceSchema,
);
const OrderProductChats = mongoose.model(
  "OrderProductChats",
  OrderProductChatsSchema,
);
const OrderProductReview = mongoose.model(
  "OrderProductReview",
  OrderProductReviewSchema,
);
const OrderTrack = mongoose.model("OrderTrack", OrderTrackSchema);

module.exports = {
  Order: Order,
  OrderRefund: OrderRefund,
  OrderReturnOrReplace: OrderReturnOrReplace,
  OrderTrack: OrderTrack,
  OrderProductReview: OrderProductReview,
  OrderProductChats: OrderProductChats,
};
