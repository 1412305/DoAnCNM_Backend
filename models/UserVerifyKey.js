var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var uniqueValidator = require('mongoose-unique-validator');

var schema = new Schema({
    hash: String,
    user: {type: Schema.Types.ObjectId, ref:"User"}
});
schema.plugin(uniqueValidator);

module.exports = mongoose.model('UserVerifyKey', schema);    
