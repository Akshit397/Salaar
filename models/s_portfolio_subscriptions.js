const Schema = require('mongoose').Schema;
const mongoose = require('mongoose');

const PortfolioSubscriptionsSchema = new Schema({
    name: { type: String }, // helps to filter portfolio subscription details in gifts 
    portfolioIds: [{ type: Schema.Types.ObjectId, ref: "categories" }], // portfolio categories
    validity: { type: Number }, // in days
    unitPrice: { type: Number },
    sponserCommission: { type: Number },
    points: { type: Number },
    GSTPercentage: { type: Number },
    metaKeywords: { type: String }, // meta
    metaTitle: { type: String }, // meta
    metaDescription: { type: String }, // meta
    status: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const PortfolioSubscriptions = mongoose.model('portfoliosubscriptions', PortfolioSubscriptionsSchema);

module.exports = {
    PortfolioSubscriptions: PortfolioSubscriptions,
}
