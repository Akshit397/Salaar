const Schema = require('mongoose').Schema;
const mongoose = require('mongoose');

const BusinessSubSegmentSchema = new Schema({
    businessSegmentId: { type: Schema.Types.ObjectId, ref: 'categories' },
    name: { type: String },
    isDeleted: { type: Boolean, default: false },
    status: { type: Boolean, default: true }
},
    { timestamps: true });

const BusinessSubSegments = mongoose.model('business_sub_segments', BusinessSubSegmentSchema);

module.exports = {
    BusinessSubSegments: BusinessSubSegments,
}

