var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
    hash: String,
    fromAddress:  [{ type: Schema.Types.ObjectId, ref: 'Address' }],
    toAddress: String,
    value: Number
});

module.exports = mongoose.model('TransactionSend', schema);
