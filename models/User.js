var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var uniqueValidator = require('mongoose-unique-validator');

var schema = new Schema({
    name: String,
    email: {type: String, unique: true},
    password: String,
    publicKey: String,
    privateKey: String,
    availableBalance: {type: Number, default: 0},
    actualBalance: {type: Number, default: 0},
    authority: {type: String, default: 'user'}
});
schema.plugin(uniqueValidator);

module.exports = mongoose.model('User', schema);    
