const Schema = require('mongoose').Schema;
const mongoose = require('mongoose');

const CouponsSchema = new Schema({
    type: { type: String, enum: ["For Products", "Game Products", "All Game Products", "E-Commerce Products", "Total Orders"] },
    couponCode: { type: String },
    userLimit: { type: Number },
    usedBy: { type: Number, default: 0 },
    minShoppingAmount: { type: Number },
    maxShoppingAmount: { type: Number },
    startDate: { type: Date },
    endDate: { type: Date },
    discount: { type: Number },
    isCompleted: { type: Boolean, default: false },
    discountType: { type: String, enum: ["Amount", "Percentage"] },
    isDeleted: { type: Boolean, default: false },
    status: { type: Boolean, default: true }
},
    { timestamps: true });

const Coupons = mongoose.model('coupons', CouponsSchema);

module.exports = {
    Coupons: Coupons,
}

