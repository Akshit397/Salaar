const mongoose = require('mongoose');
const Schema = require('mongoose').Schema;

const CartSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'users' },
    ecommerceCart: [{
        productId: { type: Schema.Types.ObjectId, ref: 'products' },
        quantity: { type: Number },
        productType: { type: String },
        attributeId: { type: String },
        sizeId: { type: String },
    }],
    foodCart: [{
        productId: { type: Schema.Types.ObjectId, ref: 'foodproducts' },
        quantity: { type: Number },
        productType: { type: String },
        attributeId: { type: String },
        sizeId: { type: String },
    }],
    gameCart: [{
        productId: { type: Schema.Types.ObjectId, ref: 'gameproducts' },
        quantity: { type: Number },
        productType: { type: String },
        sponserId: { type: String },
        ecommerceProducts: [{
            productId: { type: Schema.Types.ObjectId, ref: 'products' },
            quantity: { type: Number },
            productType: { type: String },
            attributeId: { type: String },
            sizeId: { type: String },
        }]
    }],
    ecommerceSaveForLater: [{
        productId: { type: Schema.Types.ObjectId, ref: 'products' },
        quantity: { type: Number },
        productType: { type: String },
        attributeId: { type: String },
        sizeId: { type: String },
    }],
    foodSaveForLater: [{
        productId: { type: Schema.Types.ObjectId, ref: 'products' },
        quantity: { type: Number },
        productType: { type: String },
        attributeId: { type: String },
        sizeId: { type: String },
    }],
    gameSaveForLater: [{
        productId: { type: Schema.Types.ObjectId, ref: 'products' },
        quantity: { type: Number },
        productType: { type: String },
        sponserId: { type: String }
    }],
}, {
    timestamps: true
});
const Cart = mongoose.model('cart', CartSchema);
module.exports = { Cart }