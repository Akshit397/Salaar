const Schema = require("mongoose").Schema;
const mongoose = require("mongoose");

const WithdrawManagementSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "Users"
    },
    withdrawal_request_id: {
        type: String,
    },
    adminId: {
        type: Schema.Types.ObjectId,
        ref: "Admin"
    },
    sellerId: { // Not in use now
        type: Schema.Types.ObjectId,
        ref: "Seller"
    },
    transactionId: {
        type: String
    },
    amount: {
        type: Number,
    },
    netpayable_amount: {
        type: Number,
    },
    requested_amount: {
        type: Number
    },
    available_commission: {
        type: String
    },
    country: {
        type: String,
    },
    admin_fee_percent: {
        type: Number
    },
    admin_amount: {
        type: Number
    },
    bank_details: {
        type: Object,
    },
    tds_applied_percent: {
        type: Number
    },
    tds_amount: {
        type: Number,
    },
    commissionType: {
        type: String,
        enum: ['normal', 'auto']
    },
    commissionName: {
        type: String
    },
    status: {
        type: String,
        enum: ["successful", "rejected", "pending"],
        default: "pending"
    },
    ip_address: {
        type: String,
    },
    razorpay_resp: {
        type: Object,
        default: null
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
},);


const WithdrawManagement = mongoose.model("WithdrawManagement", WithdrawManagementSchema,);

module.exports = {
    WithdrawManagement: WithdrawManagement
};
