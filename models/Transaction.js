var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
    hash: String,
    inputs: [{
        address: String,
        referencedOutputHash: String,
        referencedOutputIndex: Number
    }],
    outputs: [{
        value: Number,
        address: String
    }],
    created_at: {type: Date, default: Date.now},
    status: {type: String, default: 'unconfirmed'}
});

module.exports = mongoose.model('Transaction', schema);
