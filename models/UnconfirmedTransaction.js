var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
    hash: String,
    ofAddress:  [{ type: Schema.Types.ObjectId, ref: 'Address' }],
});

module.exports = mongoose.model('UnconfirmedTransaction', schema);
