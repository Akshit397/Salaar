const Schema = require('mongoose').Schema;
const mongoose = require('mongoose');

const TravelTypeSchema = new Schema({
    name: { type: String },
    isDeleted: { type: Boolean, default: false },
    status: { type: Boolean, default: true }
},
    { timestamps: true });

const TravelTypes = mongoose.model('travelTypes', TravelTypeSchema);

module.exports = {
    TravelTypes: TravelTypes,
}

