/** @format */

const Schema = require("mongoose").Schema;
const mongoose = require("mongoose");

const FoodProductsSchema = new Schema(
    {
        categoryIds: [{ type: Schema.Types.ObjectId, ref: "categories" }],
        type: { type: String, enum: ["Veg", "Non-veg"] },
        sellerId: { type: Schema.Types.ObjectId, ref: "Seller" },
        adminSettingsId: { type: Schema.Types.ObjectId, ref: "adminsettings" },
        name: { type: String },
        description: { type: String },
        unitPrice: { type: Number, default: 0 },
        productImage: { type: String },
        imageLabel: { type: String },
        sku: { type: String },
        customUrl: { type: String }, // unique to show in front end for getting product details
        availability: { type: Boolean, default: true },
        sponserCommission: { type: Number },
        commissionId: { type: Schema.Types.ObjectId, ref: "commissions" },
        otherTaxes: { type: Number, default: 0 },
        packagingCharges: { type: Number, default: 0 },
        deliveryCharges: { type: Number, default: 0 },
        peakCharges: { type: Number, default: 0 },
        discountPoints: { type: Number, default: 0 },
        discountDate: {
            from: { type: String },
            to: { type: String },
        },
        discountType: { type: String, enum: ["flat", "percentage"] },
        discount: { type: Number, default: 0 },
        gstCodeId: { type: Schema.Types.ObjectId, ref: "gstcodes" },
        metaKeywords: { type: String },
        metaTitle: { type: String },
        metaDescription: { type: String },
        isDeleted: { type: Boolean, default: false },
        isFood: { type: Boolean, default: true },
        status: {
            type: String,
            enum: ["Pending", "Approved", "Rejected", "Published", "Un-Published"],
            default: "Pending",
        },
        relatedItems: [{ type: Schema.Types.ObjectId, ref: "foodproducts" }],
        bestSeller: { type: Boolean, default: false },
        newArrival: { type: Boolean, default: true },
        featured: { type: Boolean, default: false },
        todaysDeal: { type: Boolean, default: false },
        salarChoice: { type: Boolean, default: false },
        festiveOffers: { type: Boolean, default: false },
        rating: { type: Number, default: 0 }
    },
    { timestamps: true },
);

const FoodProducts = mongoose.model("foodproducts", FoodProductsSchema);

module.exports = {
    FoodProducts: FoodProducts,
};
