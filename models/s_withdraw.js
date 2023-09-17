const Schema = require("mongoose").Schema;
const mongoose = require("mongoose");

const WithdrawManagementSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "Users"
    },
    adminId: {
        type: Schema.Types.ObjectId,
        ref: "Admin"
    },
    sellerId: {
        type: Schema.Types.ObjectId,
        ref: "Seller"
    },
    transactionId: {
        type: String
    },
    amount: {
        type: Number
    },
    commissionType: {
        type: String
    },
    commissionName: {
        type: String
    },
    status: {
        type: String
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
