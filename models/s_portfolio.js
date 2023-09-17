const Schema = require('mongoose').Schema;
const mongoose = require('mongoose');

const PortfolioSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "Users" },
    name: { type: String },
    dob: { type: String },
    gender: { type: String, enum: ['Male', 'Female'] },
    portfolioType: [{ type: Schema.Types.ObjectId, ref: "categories" }],
    education: { type: String },
    aboutMe: { type: String },
    // Physical Stats
    height: { type: String },
    bust: { type: String },
    waist: { type: String },
    hips: { type: String },
    chest: { type: String },
    biceps: { type: String },
    hairType: { type: String },
    hairLength: { type: String },
    eyeColour: { type: String },
    // Work
    workedInTVShows: { type: Boolean, default: false },
    workedInMovies: { type: Boolean, default: false },
    workedInShortFilms: { type: Boolean, default: false },
    workDescription: { type: String },
    workPreference: { type: String, enum: ['All', 'Local', 'Global'] },
    willingToTravel: { type: Boolean, default: false },
    languagesKnown: [{ type: String }],
    languagesFluent: [{ type: String }],
    // Social Media 
    websiteLink: { type: String },
    youtubeLink: { type: String },
    instagramLink: { type: String },
    twitterLink: { type: String },
    // Banner Image 
    bannerImage: { type: String },
    // Gallery
    images: [{ path: { type: String } }],
    // Headshots
    headShots: [{ path: { type: String } }],
    // Reels
    reels: [{ path: { type: String } }],
    // Contact
    contactName: { type: String },
    mobileNo: { type: String },
    emailId: { type: String },
    status: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    countryId: { type: Schema.Types.ObjectId, ref: "Country" },
    state: { type: String },
    city: { type: String },
}, { timestamps: true });

const Portfolios = mongoose.model('portfolios', PortfolioSchema);

module.exports = {
    Portfolios: Portfolios,
}
