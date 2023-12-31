const Schema = require('mongoose').Schema;
const mongoose = require('mongoose');

const kycSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'Users' },
    sellerId: { type: Schema.Types.ObjectId, ref: 'Seller' },
    selectId: { type: String, enum: ['Driving License', 'Aadhar Card', 'Passport', 'Voter ID'] },
    numberProof: { type: String },
    frontImage: { type: String },
    backImage: { type: String },
    status: { type: String, enum: ['Approved', 'Rejected', 'Pending'], default: "Pending" },
    remarks: { type: String },
    isDeleted: { type: Boolean, default: false }
},
    { timestamps: true });

const KycDetails = mongoose.model('kyc', kycSchema);

module.exports = {
    KycDetails: KycDetails,
}

