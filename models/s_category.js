/** @format */

const mongoose = require("mongoose"),
  Schema = require("mongoose").Schema;

const categories = new Schema(
  {
    isDeleted: { type: Boolean, default: false },
    publish: { type: Boolean, default: false },
    categoryName: { type: String },
    type: { type: String, enum: ["category", "subCategory1", "subCategory2"] },
    parentCategory: { type: Schema.Types.ObjectId, ref: "categories" },
    image: { type: String },
    metaDescription: { type: String },
    metaTitle: { type: String },
    metaKeyword: { type: String },
    customUrl: { type: String },
    categoryId: { type: String },
    description: { type: String },
    isFood: { type: Boolean, default: false },
    isVegetables: { type: Boolean, default: false },
    isGame: { type: Boolean, default: false },
    isEcommerce: { type: Boolean, default: false },
    isWineShop: { type: Boolean, default: false },
    isMovie: { type: Boolean, default: false }, // using for Portfolio
    isServices: { type: Boolean, default: false },
    isEducation: { type: Boolean, default: false },
    isInsurance: { type: Boolean, default: false },
    isSports: { type: Boolean, default: false },
    isMatrimony: { type: Boolean, default: false },
    isDelivery: { type: Boolean, default: false },
    isMedical: { type: Boolean, default: false },
    isFuel: { type: Boolean, default: false },
    isRide: { type: Boolean, default: false },
    isTravel: { type: Boolean, default: false },
    isDonation: { type: Boolean, default: false },
    isGovt: { type: Boolean, default: false },
    isCasino: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);
let Categories = mongoose.model("categories", categories);
module.exports = {
  Categories,
};
