'use strict';
var jwt    = require('jsonwebtoken');
var User = require('../models/user');
var passwordHash = require('password-hash');

exports.list_all_users = function(req, res) {
  User.find({}, function(err, user) {
    if (err)
      res.send(err);
    res.json(user);
  });
};

exports.login = function(req, res) {
  var userLogin = req.body.username;
  var passwordLogin = req.body.password;
  console.log(passwordHash);
  // find the user
	User.findOne({
		username: req.body.username
	}, function(err, user) {

		if (err) throw err;

		if (!user) {
			res.json({ success: false, message: 'Authentication failed. User not found.' });
		} else if (user) {
			// check if password matches
			if (!passwordHash.verify(req.body.password, user.password)) {
				res.json({ success: false, message: 'Authentication failed. Wrong password.' });
			} else {
				// if user is found and password is right
				// create a token
				var payload = {
					name: user.name,
          email: user.email,
          walletID: user.walletID,
          money: user.money
				}
        var token = jwt.sign(payload, 'superSecret', {
          expiresIn: 86400 // expires in 24 hours
        });

				res.json({
					success: true,
					message: 'Enjoy your token!',
					token: token
				});
			}
		}
	});
}

exports.create_user = function(req, res) {
  req.body.password = passwordHash.generate(req.body.password);
  req.body.walletID = passwordHash.generate(req.body.name);
  var new_user = new User(req.body);
  new_user.save(function(err, user) {
    if (err)
      res.send(err);
      res.json({ message: 'Register successfully' });
  });
};

exports.read_user = function(req, res) {
  User.findById(req.params.userId, function(err, user) {
    if (err)
      res.send(err);
    res.json(user);
  });
};

exports.update_user = function(req, res) {
  User.findOneAndUpdate({_id: req.params.userId}, req.body, {new: true}, function(err, user) {
    if (err)
      res.send(err);
    res.json(user);
  });
};

exports.delete_user = function(req, res) {
  User.remove({
    _id: req.params.userId
  }, function(err, user) {
    if (err)
      res.send(err);
    res.json({ message: 'User successfully deleted' });
  });
};
