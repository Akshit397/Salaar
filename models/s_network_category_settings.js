const Schema = require('mongoose').Schema;
const mongoose = require('mongoose');

const networkCategorySettingsSchema = new Schema({
    NCNumber: { type: String },
    type: { type: String, enum: ["Normal", "Classified"] },
    categoryId: { type: Schema.Types.ObjectId, ref: 'categories' },
    subCategoryId: { type: Schema.Types.ObjectId, ref: 'categories' },
    childCategoryId: { type: Schema.Types.ObjectId, ref: 'categories' },
    travelCategoryId: { type: Schema.Types.ObjectId, ref: 'travelTypes' },
    billCategoryId: { type: Schema.Types.ObjectId, ref: 'recharges' },
    travelType: { type: String },
    brand: { type: String },
    price: {
        from: { type: Number, default: 0 },
        to: { type: Number, default: 0 }
    },
    commissionId: { type: Schema.Types.ObjectId, ref: 'commissions' },
    commissionPercentage: { type: Number },
    teamIncomePercentage: { type: Number },
    ulDownlinePercentage: { type: Number },
    convenienceFee: { type: Number },
    sponserCommission: { type: Number },
    status: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    isEcommerce: { type: Boolean, default: false },
    isFood: { type: Boolean, default: false },
    isTravel: { type: Boolean, default: false },
    isBill: { type: Boolean, default: false },
}, { timestamps: true });

const NetworkCategories = mongoose.model('networkcategories', networkCategorySettingsSchema);
module.exports = { NetworkCategories: NetworkCategories, }

