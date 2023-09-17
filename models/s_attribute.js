const Schema = require('mongoose').Schema;
const mongoose = require('mongoose');

const AttributeSchema = new Schema({
    categoryId: { type: Schema.Types.ObjectId, ref: 'categories' },
    subCategoryId: { type: Schema.Types.ObjectId, ref: 'categories' },
    childCategoryId: { type: Schema.Types.ObjectId, ref: 'categories' },
    unitId: { type: Schema.Types.ObjectId, ref: 'units' },
    status: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const Attributes = mongoose.model('attributes', AttributeSchema);
module.exports = { Attributes: Attributes, }