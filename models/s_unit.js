const Schema = require('mongoose').Schema;
const mongoose = require('mongoose');

const UnitSchema = new Schema({
    name: { type: String },
    values: [{ type: String }],
    status: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const Units = mongoose.model('units', UnitSchema);

module.exports = {
    Units: Units,
}