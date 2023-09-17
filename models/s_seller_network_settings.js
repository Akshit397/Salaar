const Schema = require('mongoose').Schema;
const mongoose = require('mongoose');

const SellerNetworkSettingsSchema = new Schema({
    width: { type: Number },
    depth: { type: Number },
    ULDownline: { type: Number },
    isDeleted: { type: Boolean, default: false },
    status: { type: Boolean, default: true }
}, { timestamps: true });

const SellerNetworkSettings = mongoose.model('sellernetworksettings', SellerNetworkSettingsSchema);

module.exports = {
    SellerNetworkSettings: SellerNetworkSettings,
}