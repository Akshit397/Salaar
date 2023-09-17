const mongoose = require('mongoose');
const Schema = require('mongoose').Schema;


const transport = new Schema({
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

const product = new Schema({
    sellerName: { type: String },
    sellerEmailId: { type: String },
    brandName: { type: String },
    productName: { type: String },
    description: { type: String },
    productType: { type: String },
    productImage: { type: String },
    customUrl: { type: String },
    sku: { type: String },
    size: { type: String },
    color: { type: String },
    quantity: { type: Number },
    finalPrice: { type: Number },
    transactionFee: { type: Number },
    unitPrice: { type: Number },
    otherTaxes: { type: Number },
    gstPercentage: { type: Number },
    gstAmount: { type: Number },
    isCancelled: { type: Boolean, default: false },
    deliveryStatus: { type: Boolean, default: false },
    attributeId: { type: Schema.Types.ObjectId, ref: 'products' },
    valueId: { type: Schema.Types.ObjectId, ref: 'products' },
    productId: { type: Schema.Types.ObjectId, ref: 'products' },
    userId: { type: Schema.Types.ObjectId, ref: 'users' },
}, {
    _id: false
})

const orders = new Schema({
    reOrderId: { type: Schema.Types.ObjectId, ref: 'orders' },
    userId: { type: Schema.Types.ObjectId, ref: 'users' },
    ipAddress: { type: String },
    fullName: { type: String },
    emailId: { type: String },
    type: { type: String },
    shippingAddress: transport,
    billingAddress: transport,
    orderStatus: {
        type: String, enum: ['paid', 'pending', 'processing', 'picked', 'shipped', 'delivered', 'refunded', 'closed', 'cancelled', 'hold', 'unHold'],
        default: 'pending'
    },
    status: { type: String },
    couponCode: { type: String },
    orderId: { type: String }, // generated to statistics purpose
    paymentMethods: [{ method: { type: String }, amount: { type: Number } }],
    isLivePay: { type: Boolean, default: false },
    isOnlinePay: { type: Boolean, default: false },
    products: [product],
    totalAmount: { type: Number },
    discount: { type: Number, default: 0 },
    shippingCharges: { type: Number, default: 0 },
    commission: { type: Number, default: 0 },
    packagingCharges: { type: Number, default: 0 },
    deliveryCharges: { type: Number, default: 0 },
    orderType: { type: String, enum: ["Original", "Auto-Repurchase"], default: "Original" },
    // razor pay details
    razorPayOrderId: { type: String },
    razorPayPaymentId: { type: String },
    razorPaySignature: { type: String },
}, {
    timestamps: true
});
let Orders = mongoose.model('orders', orders);
module.exports = {
    Orders
}
