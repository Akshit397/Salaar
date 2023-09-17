const mongoose = require('mongoose');
const schema = mongoose.Schema;

const WebsitesettingsSchema = new schema({
    image: { type: String },
    rightnavbar: { type: Boolean, default: true },
    aboutas: { type: Boolean, default: true },
    gender:  { type: String, enum : ['male','female']},
    facebook: {type: String },
    instagram: {type: String },
    youtube: {type: String },
     linked: {type: String },
     twitter: {type: String },
    isDeleted: { type: Boolean, default: false },
    status: { type: Boolean, default: true }
}, {
    timestamps: true
});


const Websitesettings = mongoose.model('Websitesettings', WebsitesettingsSchema);
module.exports = {
    Websitesettings,
    WebsitesettingsSchema
}