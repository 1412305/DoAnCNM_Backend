'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
  username: {
    type: String,
    unique: true,
    required: 'Kindly enter your username.'
  },
  name: {
    type: String,
    required: 'Kindly enter your name.'
  },
  password: {
    type: String,
    required: 'Kindly enter your password.'
  },
  email: {
    type: String,
    unique: true,
    trim: true,
    required: 'Kindly enter your email.'
  },
  Created_date: {
    type: Date,
    default: Date.now
  },
  walletID: {
    type: String,
  },
  money: {
    type: Number,
    default: 1000
  }
  // status: {
  //   type: [{
  //     type: String,
  //     enum: ['pending', 'ongoing', 'completed']
  //   }],
  //   default: ['pending']
  // }

});

module.exports = mongoose.model('User', UserSchema);
