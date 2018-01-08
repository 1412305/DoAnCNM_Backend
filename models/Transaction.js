var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
    hash: String,
    fromAddresses: [{type: Schema.Types.ObjectId, ref: 'Address' }],
    toAddresses: [{type: Schema.Types.ObjectId, ref: 'Address' }],
    value: Number,
    created_at: {type: Date, default: Date.now},
    status: {type: String, default: 'unconfirmed'}
});

module.exports = mongoose.model('Transaction', schema);
