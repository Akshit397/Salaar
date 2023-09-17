/** @format */

const Schema = require("mongoose").Schema;
const mongoose = require("mongoose");

const WalletManagementSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "Users" },
    adminId: { type: Schema.Types.ObjectId, ref: "Admin" },
    sellerId: { type: Schema.Types.ObjectId, ref: "Seller" },
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    reason: { type: String },
    walletAmount: { type: Number },
    existingWalletAmount: { type: Number },
    ipAddress: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const FundReceivedSchema = new Schema(
  {
    TransactionId: { type: String },
    user_id: { type: Schema.Types.ObjectId, ref: "Users" },
    Amount: { type: Number },
    status: { type: String },
    userName: { type: String },
  },
  { timestamps: true },
);

const FundTransferSchema = new Schema(
  {
    TransactionId: { type: String },
    user_id: { type: Schema.Types.ObjectId, ref: "Users" },
    Amount: { type: Number },
    status: { type: String },
    userName: { type: String },
  },
  { timestamps: true },
);

const WalletHistorySchema = new Schema(
  {
    TransactionId: { type: String },
    Amount: { type: Number },
    commission_type: { type: String },
    commission_name: { type: String },
    date: { type: String },
    user_id: { type: Schema.Types.ObjectId, ref: "Users" },
    status: { type: String },
  },
  { timestamps: true },
);

const WalletManagements = mongoose.model(
  "wallet_managements",
  WalletManagementSchema,
);
const FundReceived = mongoose.model("fund_recevied", FundReceivedSchema);
const FundTransfer = mongoose.model("FundTransfer", FundTransferSchema);
const WalletHistory = mongoose.model("wallet_history", WalletHistorySchema);
module.exports = {
  WalletManagements: WalletManagements,
  FundReceived: FundReceived,
  WalletHistory: WalletHistory,
  FundTransfer: FundTransfer,
};
