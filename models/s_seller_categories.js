const Schema = require('mongoose').Schema;
const mongoose = require('mongoose');

const SellerCategoriesSchema = new Schema({
    categoryId: { type: Schema.Types.ObjectId, ref: 'categories' },
    subCategoryId: { type: Schema.Types.ObjectId, ref: 'categories' },
    childCategoryId: { type: Schema.Types.ObjectId, ref: 'categories' },
    image: { type: String },
    registerId: { type: String },
    isDeleted: { type: Boolean, default: false },
    status: { type: Boolean, default: true },
    remarks: { type: String },
    approvalStatus: { type: String, enum: ['Approved', 'Rejected', 'Pending'], default: "Pending" },
    sellerId: { type: Schema.Types.ObjectId, ref: "Seller" },
},
    { timestamps: true });

const SellerCategories = mongoose.model('seller_categories', SellerCategoriesSchema);

module.exports = {
    SellerCategories: SellerCategories,
}

