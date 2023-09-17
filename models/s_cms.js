const mongoose = require('mongoose');
const Schema = require('mongoose').Schema;

const cmspages = new Schema({
    pageName: { type: String, required: true, trim: true },
    pageUrl: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    metaTitle: { type: String, required: true, trim: true },
    metaDescription: { type: String, required: true, trim: true },
    metaKeyword: { type: String, required: true, trim: true },
    isDeleted: { type: Boolean, default: false },
    status: { type: Boolean, default: true },
}, {
    timestamps: true
});
let CmsPages = mongoose.model('cmspages', cmspages);
module.exports = {
    CmsPages
}
