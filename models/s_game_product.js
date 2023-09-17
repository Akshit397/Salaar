/** @format */
const Schema = require('mongoose').Schema;
const mongoose = require('mongoose');

const GameProductsSchema = new Schema({
  countryId: { type: Schema.Types.ObjectId, ref: 'Country' },
  planId: { type: Schema.Types.ObjectId, ref: 'plans' },
  categoryId: { type: Schema.Types.ObjectId, ref: 'categories' },
  adminSettingsId: { type: Schema.Types.ObjectId, ref: "adminsettings" },
  hsnCode: { type: String },
  sku: { type: String },
  name: { type: String },
  customUrl: { type: String }, // unique for each game added
  games: [{ type: Schema.Types.ObjectId, ref: 'games' }],
  description: { type: String },
  unitPrice: { type: Number },
  gstPercentage: { type: Number, default: 0 },
  gstAmount: { type: Number, default: 0 },
  otherTaxes: { type: Number, default: 0 },
  finalPrice: { type: Number },
  sponserCommission: { type: Number }, // in rupees
  autoRepurchaseCommission: { type: Number }, // in rupees
  points: { type: Number },
  pointsValidity: { type: Number },
  autoPoints: { type: Number },
  autoPointsValidity: { type: Number },
  autoRepurchaseCycle: { type: Number },
  rewardsCycle: { type: Number },
  shoppingAmountCycle: { type: Number },
  products: [{ type: Schema.Types.ObjectId, ref: 'products' }],
  levels: [
    {
      level: Number,
      commissionAmount: Number, // in rupees
      salarCoins: Number,
      shoppingAmount: Number, // in rupees
    },
  ],
  image: {
    type: String,
  },
  imageLabel: { type: String, trim: true },
  gallaryImages: [
    {
      imgSequence: Number,
      imgLabel: String,
      imgName: String,
    },
  ],
  tempImgArr: [
    {
      imgSequence: Number,
      imgLabel: String,
      imgName: String,
    },
  ],
  temporaryImages: [{ imgName: String }],
  metaTitle: { type: String },
  metaKeywords: { type: String },
  metaDescription: { type: String },
  status: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
  isGame: { type: Boolean, default: true },
}, { timestamps: true });

const GameProducts = mongoose.model('gameproducts', GameProductsSchema);

module.exports = {
  GameProducts: GameProducts,
}
