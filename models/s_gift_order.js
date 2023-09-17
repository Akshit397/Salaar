const mongoose = require('mongoose');
const Schema = require('mongoose').Schema;


const address = new Schema({
    name: { type: String, trim: true },
    addressLine1: { type: String, trim: true },
    addressLine2: { type: String, trim: true },
    city: { type: String, trim: true },
    cityId: { type: String, trim: true },
    state: { type: String, trim: true },
    stateId: { type: String, trim: true },
    zipCode: { type: Number, trim: true },
    mobileNo: { type: String, trim: true },
    emailId: { type: String, trim: true },
    countryId: { type: Schema.Types.ObjectId, ref: "Country" },
    landmark: { type: String, trim: true },
}, {
    _id: false
})

const giftOrders = new Schema({
    orderId: { type: Schema.Types.ObjectId, ref: 'orders' },
    userId: { type: Schema.Types.ObjectId, ref: 'Users' },
    countryId: { type: Schema.Types.ObjectId, ref: 'Country' },
    gameProductId: { type: Schema.Types.ObjectId, ref: 'gameproducts' },
    giftId: { type: Schema.Types.ObjectId, ref: 'gifts' },
    giftOn: { type: String, enum: ["OnPurchase", "CompletionOfLevels"] },
    shippingAddress: address,
    billingAddress: address,
    achievedDate: { type: Date },
    isApproved: { type: Boolean, default: false }, // indicates whether admin needs to send this gift to user based on gift type
    isDelievered: { type: Boolean, default: false }, // indicates whether the order is delievered or not, admin will update this key based on tracking
    // gift order tracking details
    giftName: { type: String },
    finalPrice: { type: Number },
    trackUrl: { type: String },
    courierName: { type: String },
    orderStatus: { type: String, enum: ["Pending", "Shipped", "Delievered", "Rejected"], default: "Pending" },
}, {
    timestamps: true
});

const GiftOrders = mongoose.model('giftorders', giftOrders);
module.exports = {
    GiftOrders
}
