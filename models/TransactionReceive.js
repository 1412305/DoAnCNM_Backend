var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
    hash: String,
    toAddress:  [{ type: Schema.Types.ObjectId, ref: 'Address' }],
    fromAddress: String,
    value: Number
});

module.exports = mongoose.model('TransactionSend', schema);
