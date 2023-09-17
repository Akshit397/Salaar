const Schema = require('mongoose').Schema;
const mongoose = require('mongoose');

const PlanSchema = new Schema({
    name: { type: String },
    width: { type: Number },
    depth: { type: Number, },
    status: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const Plans = mongoose.model('plans', PlanSchema);

module.exports = {
    Plans: Plans,
}
