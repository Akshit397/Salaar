const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const CountrySchema = new Schema({
    name: {
        type: String
    },
    iso: {
        type: String
    },
    nickname: {
        type: String
    },
    countryId: {
        type: String
    },
    status: {
        type: Number
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

const Country = mongoose.model("Country", CountrySchema,);
module.exports = {
    Country: Country
};
