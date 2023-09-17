const Schema = require('mongoose').Schema;
const mongoose = require('mongoose');

const SellerBrandsSchema = new Schema({
    categoryId: { type: Schema.Types.ObjectId, ref: 'categories' },
    subCategoryId: { type: Schema.Types.ObjectId, ref: 'categories' },
    childCategoryId: { type: Schema.Types.ObjectId, ref: 'categories' },
    brandId: { type: Schema.Types.ObjectId, ref: 'brands' },
    stock: { type: Number },
    registerId: { type: String },
    isDeleted: { type: Boolean, default: false },
    status: { type: Boolean, default: true },
    remarks: { type: String },
    approvalStatus: { type: String, enum: ['Approved', 'Rejected', 'Pending'], default: "Pending" },
    sellerId: { type: Schema.Types.ObjectId, ref: "Seller" },
},
    { timestamps: true });

const SellerBrands = mongoose.model('seller_brands', SellerBrandsSchema);

module.exports = {
    SellerBrands: SellerBrands,
}

