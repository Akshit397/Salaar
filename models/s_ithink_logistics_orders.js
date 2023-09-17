const Schema = require('mongoose').Schema;
const mongoose = require('mongoose');

const IthinkLogisticsSchema = new Schema({
    orderId: { type: Schema.Types.ObjectId, ref: 'orders' },
    status: { type: String },
    remark: { type: String },
    waybill: { type: String },
    refnum: { type: String },
    logistic_name: { type: String }
},
    { timestamps: true });

const IthinkOrders = mongoose.model('ithinklogisticsorders', IthinkLogisticsSchema);

module.exports = {
    IthinkOrders: IthinkOrders,
};