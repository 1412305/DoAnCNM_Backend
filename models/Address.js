    
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
    addressName: String,
    ofUser:  {type: Schema.Types.ObjectId, ref: 'User'},
    balance: {type: Number, default: 0},
    // isAddressForExcessCash: {type: Boolean, default: false}
});

module.exports = mongoose.model('Address', schema);
