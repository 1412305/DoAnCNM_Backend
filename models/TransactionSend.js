var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
    hash: String,
    fromAddress:  { type: Schema.Types.ObjectId, ref: 'Address' },
    toAddress: String,
    value: Number,
    confirm_at: {type: Date, default: Date.now}
});

module.exports = mongoose.model('TransactionSend', schema);
