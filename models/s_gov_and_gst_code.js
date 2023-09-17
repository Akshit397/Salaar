const Schema = require('mongoose').Schema;
const mongoose = require('mongoose');

const GovtGstCodeSchema = new Schema({
    categoryId: { type: Schema.Types.ObjectId, ref: 'categories' },
    subCategoryId: { type: Schema.Types.ObjectId, ref: 'categories' },
    childCategoryId: { type: Schema.Types.ObjectId, ref: 'categories' },
    gst: { type: Number },
    price: {
        from: { type: Number, default: 0 },
        to: { type: Number, default: 0 }
    },
    code: { type: String },
    status: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const GSTCodes = mongoose.model('gstcodes', GovtGstCodeSchema);
module.exports = { GSTCodes: GSTCodes, }