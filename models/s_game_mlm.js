const Schema = require('mongoose').Schema;
const mongoose = require('mongoose');

const GameMlmSchema = new Schema({
    mlmId: { type: Schema.Types.ObjectId, ref: 'mlms' },
    orderId: { type: Schema.Types.ObjectId, ref: 'orders' },
    userId: { type: Schema.Types.ObjectId, ref: 'users' },
    registerId: { type: String }, // to whom we are crediting salar coins and shopping amount (uplinerId)
    byUserId: { type: String }, // order placed by
    level: { type: Number },
    commissionAmount: { type: Number },
    salarCoins: { type: Number },
    shoppingAmount: { type: Number },
    wallet: { type: Number },
    sponserCommission: { type: Number },
    freezingAmount: { type: Number, default: 0 },
    isAutoRepurchase: { type: Boolean, default: false },
    type: { type: String, enum: ["Credited", "Debited"], default: 'Credited' }
},
    { timestamps: true });

const GamesMLM = mongoose.model('games_mlms', GameMlmSchema);

const mlmSchema = new Schema({
    gameProductId: { type: Schema.Types.ObjectId, ref: 'gameproducts' },
    parentMlmId: { type: Schema.Types.ObjectId, ref: 'mlms' },
    orderId: { type: Schema.Types.ObjectId, ref: 'orders' },
    userId: { type: Schema.Types.ObjectId, ref: 'users' }, // ulDownlineUserId
    registerId: { type: String },
    uplinerId: { type: String },
    width: { type: Number },
    depth: { type: Number },
    count: { type: Number, default: 0 },
    requiredUsersCount: { type: Number, default: 0 },
    usersCount: { type: Number, default: 0 },
    commissionAmountReceived: { type: Number, default: 0 },
    salarCoinsReceived: { type: Number, default: 0 },
    shoppingAmountReceived: { type: Number, default: 0 },
    orderType: { type: String, enum: ["Original", "Auto-Repurchase"], default: "Original" },
    levelsCompleted: { type: Boolean, default: false },
    autoRepurchase: { type: Boolean, default: false },
    autoRepurchaseCycleExists: { type: Boolean, default: false }
},
    { timestamps: true });
const MLM = mongoose.model('mlms', mlmSchema);


const gameOrdersTracking = new Schema({
    orderId: { type: Schema.Types.ObjectId, ref: 'orders' },
    productId: { type: Schema.Types.ObjectId, ref: 'gameproducts' },
    userId: { type: Schema.Types.ObjectId, ref: 'users' },
    points: { type: Number, default: 0 },
    pointsValidity: {
        startDate: { type: Date },
        endDate: { type: Date },
    },
    type: { type: String, enum: ['purchase', 'autoPurchase'] },
    pointsType: { type: String, enum: ['credited', 'debited'], default: "credited" }
},
    { timestamps: true });

const GameOrdersTracking = mongoose.model('gameordersTracking', gameOrdersTracking);
module.exports = {
    GamesMLM, MLM, GameOrdersTracking
}

