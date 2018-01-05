'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TransactionSchema = new Schema({
  type: {
    type: String
  },
  otherUser: {
    type: String
  },
  createdDate: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: String
  },
  money: {
    type: Number
  }
});

module.exports = mongoose.model('Transaction', TransactionSchema);
