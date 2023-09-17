/** @format */

const Schema = require("mongoose").Schema;
const mongoose = require("mongoose");

const ProductsSchema = new Schema(
  {
    categoryIds: [{ type: Schema.Types.ObjectId, ref: "categories" }],
    brandId: { type: Schema.Types.ObjectId, ref: "brands" },
    gstCodeId: { type: Schema.Types.ObjectId, ref: "gstcodes" },
    commissionId: { type: Schema.Types.ObjectId, ref: "commissions" },
    adminSettingsId: { type: Schema.Types.ObjectId, ref: "adminsettings" },
    length: { type: Number }, // in cms
    width: { type: Number },  // in cms
    height: { type: Number }, // in cms
    weight: { type: Number }, // in gms
    sellerId: { type: Schema.Types.ObjectId, ref: "Seller" },
    name: { type: String },
    minPurchaseQty: { type: Number, default: 0 },
    maxPurchaseQty: { type: Number, default: 0 },
    barCode: { type: String },
    sku: { type: String },
    hsnCode: { type: String },
    customUrl: { type: String }, // unique to show in front end for getting product details
    unitPrice: { type: Number, default: 0 },
    otherTaxes: { type: Number, default: 0 },
    discountPoints: { type: Number, default: 0 },
    sponserCommission: { type: Number },
    discountDate: {
      from: { type: String },
      to: { type: String },
    },
    discountType: { type: String, enum: ["percentage"] },
    discount: { type: Number, default: 0 },
    attributes: [
      {
        color: { type: String },
        gallaryImages: [
          {
            imgSequence: Number,
            imgLabel: String,
            imgName: String,
          },
        ],
        values: [{
          size: { type: String }, stock: { type: Number }, price: { type: Number },
        }],
      },
    ],
    stock: { type: Number, default: 0 },
    stockWarning: { type: Boolean, default: false },
    description: { type: String },
    longDescription: { type: String },
    shippingDays: { type: Number, default: 0 },
    returnAvailability: { type: Boolean, default: false },
    returnTypes: [{ type: Schema.Types.ObjectId, ref: "returntypes" }],
    returnDays: { type: Number, default: 0 },
    replacementAvailability: { type: Boolean, default: false },
    replacementTypes: [{ type: Schema.Types.ObjectId, ref: "returntypes" }],
    replacementDays: { type: Number, default: 0 },
    refundAvailability: { type: Boolean, default: false },
    refundAmount: { type: Number },
    cancellationAvailability: { type: Boolean, default: false },
    cancellationCharges: { type: Number, default: 0 },
    productVideoUrl: { type: String },
    productPdf: { type: String },
    productImage: { type: String },
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
    metaKeywords: { type: String },
    metaTitle: { type: String },
    metaDescription: { type: String },
    productType: {
      type: String,
      enum: ["Simple", "Variant"],
    },
    productDataType: {
      type: String,
      enum: ["Physical", "Digital", 'License'], default: 'Physical'
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Published", "Un-Published"],
      default: "Pending",
    },
    isDeleted: { type: Boolean, default: false },
    isEcommerce: { type: Boolean, default: true },
    bestSeller: { type: Boolean, default: false },
    newArrival: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    todaysDeal: { type: Boolean, default: false },
    salarChoice: { type: Boolean, default: false },
    festiveOffers: { type: Boolean, default: false },
    freeDelivery: { type: Boolean, default: false },
    relatedItems: [{ type: Schema.Types.ObjectId, ref: "products" }],
    rating: { type: Number, default: 0 }
  },
  { timestamps: true },
);

const Products = mongoose.model("products", ProductsSchema);

module.exports = {
  Products: Products,
};
