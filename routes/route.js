module.exports = function(app) {
    var userController = require('../controllers/user-controller');
    // var transactionController = require('../controllers/transaction-controller')

    app.route('/users')
       .get(userController.listUsers)
       .post(userController.addUser);
    app.route('/user/:id')
       .get(userController.getUser)
       .put(userController.updateUser)
       .delete(userController.removeUser);
    app.route('/login')
       .post(userController.login);

    // app.route('/transactions')
    //    .get(transactionController.listAllTrans)
    // app.route('/transaction/:username')
    //    .get(transactionController.listTrans)
};
