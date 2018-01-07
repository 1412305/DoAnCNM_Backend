var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
    hash: String,
    toAddress: { type: Schema.Types.ObjectId, ref: 'Address' },
    value: Number,
    confirm_at: {type: Date, default: Date.now}
});

module.exports = mongoose.model('TransactionReceive', schema);
