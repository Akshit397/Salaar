const Schema = require('mongoose').Schema;
const mongoose = require('mongoose');

// one-time (i.e., for original orders)
const GiftSchema = new Schema({
    userType: { type: String, enum: ['all', "regular", "organisation"] },
    gameProductId: { type: Schema.Types.ObjectId, ref: 'gameproducts' },
    gameProductUnitPrice: { type: Number },
    gameProductFinalPrice: { type: Number },
    giftOn: { type: String, enum: ["OnPurchase", "CompletionOfLevels"] },
    giftName: { type: String },
    finalPrice: { type: Number },
    levelMembers: { type: Number }, // 0 or 30
    status: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    image: { type: String },
    portfolioSubscriptionId: { type: Schema.Types.ObjectId, ref: 'portfoliosubscriptions' },
    type: { type: String, enum: ["General", "Portfolio"], default: "General" }
}, { timestamps: true });

const Gifts = mongoose.model('gifts', GiftSchema);

module.exports = {
    Gifts: Gifts,
}