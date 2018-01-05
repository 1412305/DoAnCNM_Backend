'use strict';

var Transaction = require('../models/transaction');

exports.list_all_transactions = function(req, res) {
  Transaction.find({}, function(err, transactions) {
    if (err)
      res.send(err);
    res.json(transactions);
  });
};

exports.create_transaction = function(req, res) {
  var new_transaction = new Transaction(req.body);
 
  new_transaction.save(function(err, transaction) {
    if (err)
      res.send(err);
    res.json(transaction);
  });
};

// exports.delete_a_user = function(req, res) {
//   User.remove({
//     _id: req.params.userId
//   }, function(err, user) {
//     if (err)
//       res.send(err);
//     res.json({ message: 'User successfully deleted' });
//   });
// };
