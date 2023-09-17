const Schema = require('mongoose').Schema;
const mongoose = require('mongoose');

const GamesSchema = new Schema({
    name: { type: String },
    gameUrl: { type: String },
    image: { type: String },
    categoryId: { type: Schema.Types.ObjectId, ref: 'categories' },
    status: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const Games = mongoose.model('games', GamesSchema);

module.exports = {
    Games: Games,
}