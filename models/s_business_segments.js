const Schema = require('mongoose').Schema;
const mongoose = require('mongoose');

const BusinessSegmentSchema = new Schema({
    name: { type: String },
    isDeleted: { type: Boolean, default: false },
    status: { type: Boolean, default: true }
},
    { timestamps: true });

const BusinessSegments = mongoose.model('business_segments', BusinessSegmentSchema);

module.exports = {
    BusinessSegments: BusinessSegments,
}

