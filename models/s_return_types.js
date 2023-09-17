const Schema = require('mongoose').Schema;
const mongoose = require('mongoose');

const ReturnTypeSchema = new Schema({
    name: { type: String },
    isDeleted: { type: Boolean, default: false },
    status: { type: Boolean, default: true }
},
    { timestamps: true });

const ReturnTypes = mongoose.model('returntypes', ReturnTypeSchema);

module.exports = {
    ReturnTypes: ReturnTypes,
}

