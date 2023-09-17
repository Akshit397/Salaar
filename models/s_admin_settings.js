const Schema = require('mongoose').Schema;
const mongoose = require('mongoose');

const AdminSettingsSchema = new Schema({
    local: { minimum: { type: Number }, maximum: { type: Number } },
    global: { minimum: { type: Number }, maximum: { type: Number } },
    tds: { withPanCard: { type: Number }, withoutPanCard: { type: Number } },
    withdrawal: { type: Number },
    fundTransfer: { type: Number },
    purchase: { type: Number },
    proCommission: { type: Number },
    transactionFeeLocal: { type: Number, default: 0 },
    transactionFeeGlobal: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false }
},
    { timestamps: true });

const AdminSettings = mongoose.model('adminsettings', AdminSettingsSchema);

module.exports = {
    AdminSettings: AdminSettings,
}

