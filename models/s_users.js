/** @format */

const mongoose = require("mongoose");
const schema = mongoose.Schema;

const address = new schema({
    name: {
        type: String,
        trim: true
    },
    addressLine1: {
        type: String,
        trim: true
    },
    addressLine2: {
        type: String,
        trim: true
    },
    city: {
        type: String,
        trim: true
    },
    cityId: {
        type: String,
        trim: true
    },
    state: {
        type: String,
        trim: true
    },
    stateId: {
        type: String,
        trim: true
    },
    zipCode: {
        type: Number,
        trim: true
    },
    mobileNo: {
        type: String,
        trim: true
    },
    emailId: {
        type: String,
        trim: true
    },
    countryId: {
        type: schema.Types.ObjectId,
        ref: "Country"
    },
    landmark: {
        type: String,
        trim: true
    },
    defaultAddress: {
        type: Boolean,
        trim: true,
        default: false
    }
});

const UserSchema = new schema({
    fullName: {
        type: String
    },
    dob: {
        type: String
    },
    image: {
        type: String
    },
    gender: {
        type: String,
        enum: ["male", "female"]
    },
    age: {
        type: String
    },
    emailId: {
        type: String,
        required: true
    },
    countryId: {
        type: schema.Types.ObjectId,
        ref: "Country"
    },
    mobileNo: {
        type: String
    },
    password: {
        type: String
    },
    transactionPassword: {
        type: String
    },
    sponserId: {
        type: String
    },
    ulDownlineId: {
        type: String
    },
    level: {
        type: Number
    },
    registerId: {
        type: String
    },
    organisationName: {
        type: String
    },
    userRoleName: {
        type: String
    },
    roleInOrganisation: {
        type: String
    },
    registeredYear: {
        type: String
    },
    otp: {
        type: String
    },
    wallet: {
        type: Number,
        default: 0
    },
    freezingAmount: {
        type: Number,
        default: 0
    },
    salarCoins: {
        type: Number,
        default: 0
    },
    shoppingAmount: {
        type: Number,
        default: 0
    },
    termsAndConditions: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    status: {
        type: Boolean,
        default: true
    },
    role: {
        type: String,
        enum: ["regular", "organisation"]
    },
    shippingAddresses: [address],
    otp: {
        type: String
    },
    bankDetails: {
        type: schema.Types.ObjectId,
        ref: "bankDetails",
        default: null
    },
    kycDetails: {
        type: schema.Types.ObjectId,
        ref: "kyc",
        default: null
    },
    customerId: {
        type: String
    },
    state: { type: String },
    city: { type: String },
    zipCode: { type: String },
}, {
    timestamps: true
},);

const Users = mongoose.model("Users", UserSchema);
module.exports = {
    Users,
    UserSchema
};
