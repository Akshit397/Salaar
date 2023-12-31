const Schema = require('mongoose').Schema;
const mongoose = require('mongoose');

const address = new Schema({
    addressLine1: { type: String, trim: true },
    addressLine2: { type: String, trim: true },
    city: { type: String, trim: true },
    cityId: { type: String, trim: true },
    pincode: { type: Number, trim: true },
    countryId: { type: Schema.Types.ObjectId, ref: 'Country' },
    state: { type: String, trim: true },
    stateId: { type: String, trim: true },
});

let StoreSchema = new Schema({
    name: { type: String },
    logo: { type: String },
    banner: { type: String },
    mobileNo: { type: String },
    whatsappNo: { type: String },
    emailId: { type: String },
    registerId: { type: String },
    storeLink: { type: String },
    wareHouseId: { type: String },
    storeAddress: address,
    sellerId: { type: Schema.Types.ObjectId, ref: 'Seller' },
    isDeleted: { type: Boolean, default: false },
    status: { type: Boolean, default: true },
    approvalStatus: { type: String, enum: ['Approved', 'Rejected', 'Pending'], default: "Pending" },
    remarks: { type: String },
    location: {
        type: { type: String, default: 'Point' },
        coordinates: [{ type: Number }, { type: Number }] // [longitude, latitude]
    },
    locationAddress: { type: String },
    operationalHours: [{
        day: { type: String, enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] },
        timings: [
            {
                startTime: {
                    hours: { type: Number },
                    mins: { type: Number },
                    meridiem: { type: String, enum: ["AM", "PM"] }
                },
                endTime: {
                    hours: { type: Number },
                    mins: { type: Number },
                    meridiem: { type: String, enum: ["AM", "PM"] }
                }
            }
        ]
    }],
    ownerName: { type: String },
    contactNo: { type: String },
    establishmentType: [{ type: String }], // "Both Delivery and Delivery", "Dine-in", "Delivery"
    restaurantType: [{ type: String }], // "Pure Veg", "Non-Veg", "Both Veg & Non-Veg"
    cuisineIds: [{ type: Schema.Types.ObjectId, ref: 'categories' }],
    storeType: { type: String, enum: ["isEcommerce", "isFood"] }
}, { timestamps: true });

StoreSchema.index({ location: "2dsphere" })
const Stores = mongoose.model('stores', StoreSchema);

module.exports = {
    Stores: Stores,
}
