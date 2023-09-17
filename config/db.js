require('dotenv').config()
var mongoose = require('mongoose');
const mongoUri = "mongodb+srv://salaar:LPBQBwxlPLyzLmVV@cluster1.e2nlvyn.mongodb.net/salaarDB";
var db = mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
mongoose.connection.once('open', () => {
    console.log('connected to database');
});

mongoose.connection.once('error', (error) => {
    console.log(error);
});

console.log(mongoose.connection.readyState);
var onerror = function (error, callback) {
    mongoose.connection.close();
    callback(error);
};

const user = require('../models/s_users');

mongoose.Promise = global.Promise;
module.exports.db = db;
module.exports = {
    user
}