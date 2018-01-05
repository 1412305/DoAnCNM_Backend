'use strict';

module.exports = function(app) {
  var userController = require('../controllers/user');

  app.route('/users')
    .get(userController.list_all_users)
    .post(userController.create_user);

  app.route('/users/:id')
    .get(userController.read_user)
    .put(userController.update_user)
    .delete(userController.delete_user);

  app.route('/login')
    .post(userController.login)

  app.route('/register')
    .post(userController.create_user)
};
