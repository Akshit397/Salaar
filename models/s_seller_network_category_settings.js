const Schema = require('mongoose').Schema;
const mongoose = require('mongoose');

const sellerNetworkCategorySettingsSchema = new Schema({
    NCNumber: { type: String },
    type: { type: String, enum: ["Normal", "Classified"] },
    categoryId: { type: Schema.Types.ObjectId, ref: 'categories' },
    subCategoryId: { type: Schema.Types.ObjectId, ref: 'categories' },
    childCategoryId: { type: Schema.Types.ObjectId, ref: 'categories' },
    price: {
        from: { type: Number, default: 0 },
        to: { type: Number, default: 0 }
    },
    commissionId: { type: Schema.Types.ObjectId, ref: 'commissions' },
    teamIncomePercentage: { type: Number },
    ulDownlinePercentage: { type: Number },
    otherTaxes: { type: Number },
    status: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    isEcommerce: { type: Boolean, default: false },
    isFood: { type: Boolean, default: false },
}, { timestamps: true });

const SellerNetworkCategories = mongoose.model('sellerNetworkcategories', sellerNetworkCategorySettingsSchema);
module.exports = { SellerNetworkCategories: SellerNetworkCategories, }

