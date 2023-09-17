const Schema = require("mongoose").Schema;
const mongoose = require("mongoose");

const ProductReviewSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "Users" },
    sellerId: { type: Schema.Types.ObjectId, ref: "Seller" },
    orderId: { type: Schema.Types.ObjectId, ref: "orders" },
    productId: { type: Schema.Types.ObjectId, ref: "products" },
    foodProductId: { type: Schema.Types.ObjectId, ref: "foodproducts" },
    files: [{
        type: { type: String, enum: ['image', 'video'] },
        path: { type: String }
    }],
    rating: { type: Number },
    title: { type: String },
    description: { type: String },
    isDeleted: { type: Boolean, default: false },
    status: { type: Boolean, default: false },
    type: { type: String, enum: ["isEcommerce", "isFood"] }
}, {
    timestamps: true
});
let ProductReviews = mongoose.model('productReviews', ProductReviewSchema);
module.exports = {
    ProductReviews
}


