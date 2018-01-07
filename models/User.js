var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var uniqueValidator = require('mongoose-unique-validator');

var schema = new Schema({
    name: String,
    email: {type: String, unique: true},
    password: String,
    publicKey: String,
    privateKey: String,
    balance: {type: Number, default: 0} ,
});
schema.plugin(uniqueValidator);

module.exports = mongoose.model('User', schema);    
