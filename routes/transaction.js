'use strict';

module.exports = function(app) {
  var transactionController = require('../controllers/transaction');

  app.route('/transactions')
    .get(transactionController.list_all_transactions)
    .post(transactionController.create_transaction);
};
