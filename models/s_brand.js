const Schema = require('mongoose').Schema;
const mongoose = require('mongoose');

const BrandSchema = new Schema({
    categoryId: { type: Schema.Types.ObjectId, ref: 'categories' },
    subCategoryId: { type: Schema.Types.ObjectId, ref: 'categories' },
    childCategoryId: { type: Schema.Types.ObjectId, ref: 'categories' },
    name: { type: String },
    website: { type: String },
    image: { type: String },
    topBrand: { type: Boolean, default: false },
    status: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    isFood: { type: Boolean, default: false },
    isVegetables: { type: Boolean, default: false },
    isGame: { type: Boolean, default: false },
    isEcommerce: { type: Boolean, default: true },
}, { timestamps: true });

const Brands = mongoose.model('brands', BrandSchema);

module.exports = {
    Brands: Brands,
}
