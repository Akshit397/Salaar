const Schema = require('mongoose').Schema;
const mongoose = require('mongoose');

const RechargeSchema = new Schema({
    name: { type: String },
    isDeleted: { type: Boolean, default: false },
    status: { type: Boolean, default: true }
},
    { timestamps: true });

const Recharges = mongoose.model('recharges', RechargeSchema);

module.exports = {
    Recharges: Recharges,
}

