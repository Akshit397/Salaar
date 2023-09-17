const Schema = require('mongoose').Schema;
const mongoose = require('mongoose');

const AdminSchema = new Schema({
    fullName: { type: String },
    dob: { type: Date },
    gender: { type: String, enum: ['male', 'female'] },
    age: { type: String },
    email: { type: String, required: true },
    mobileNo: { type: String },
    password: { type: String },
    registerId: { type: String },
    transactionPassword: { type: String },
    status: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    role: { type: String, enum: ['admin', 'staff'] },
    image: { type: String },
    addressLine1: { type: String },
    addressLine2: { type: String },
    city: { type: String },
    state: { type: String },
    pinCode: { type: String },
    countryId: { type: Schema.Types.ObjectId, ref: "Country" },
    roleId: { type: Schema.Types.ObjectId, ref: "roles" },
}, {
    timestamps: true
});

const Admin = mongoose.model('Admin', AdminSchema);
module.exports = {
    Admin,
    AdminSchema
}