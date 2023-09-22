/** @format */

const Schema = require("mongoose").Schema;
const mongoose = require("mongoose");

const SponsorCommissionSchema = new Schema( // In Use
  {
    dataOfPurchase: { type: String },
    productType: { type: String },
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    userName: { type: String },
    sponsorCommission: { type: Number },
    status: { type: String },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

const AurCommissionSchema = new Schema( // In Use
  {
    dataOfPurchase: { type: String },
    productType: { type: String },
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    userName: { type: String },
    aurCommission: { type: Number },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

const ProCommissionSchema = new Schema(
  {
    dataOfPurchase: { type: String },
    productType: { type: String },
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    userName: { type: String },
    proCommission: { type: Number },
    status: { type: String },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

const MemberShipCommissionSchema = new Schema( // In Use // -> Game Commission
  {
    date: { type: String },
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    genCode: { type: String },
    tree: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reqMembers: { type: Number },
    joinedMembers: { type: Number },
    status: { type: String },
    commissionEarned: { type: Number },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

const TeamIncomeSchema = new Schema(
  {
    dataOfPurchase: { type: String },
    productType: { type: String },
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    productName: { type: String },
    userName: { type: String },
    uplinkerId: { type: String },
    teamIncome: { type: Number },
    status: { type: String },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

const SponsorCommission = mongoose.model(
  "SponsorCommission",
  SponsorCommissionSchema,
);
const AurCommission = mongoose.model("AurCommission", AurCommissionSchema);
const ProCommission = mongoose.model("ProCommission", ProCommissionSchema);
const MemberShipCommission = mongoose.model(
  "MemberShipCommission",
  MemberShipCommissionSchema,
);

const TeamIncome = mongoose.model("TeamIncome", TeamIncomeSchema);

module.exports = {
  SponsorCommission: SponsorCommission,
  AurCommission: AurCommission,
  ProCommission: ProCommission,
  MemberShipCommission: MemberShipCommission,
  TeamIncome: TeamIncome,
};
