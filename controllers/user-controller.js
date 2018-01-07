var mongoose = require('mongoose');
var User = mongoose.model('User');
var Address = mongoose.model('Address');
var passwordHash = require('password-hash');
var axios = require('axios');
var jwt = require('jsonwebtoken');

exports.listUsers = function(req, res) {
    User.find({}, function(err, result) {
        if (err) {
            res.send(err);
        }
        res.json(result);
    });
};

exports.addUser = function(req, res) {
    req.body.password = passwordHash.generate(req.body.password);
    var newUser = new User(req.body);
    axios.get('https://api.kcoin.club/generate-address')
    .then(response => {
        newUser.publicKey = response.data.publicKey;
        newUser.privateKey = response.data.privateKey;
        newUser.save(function(err, user) {
            if (err) {
                res.send(err);
            }
            res.json(user);
        });
        var newAddress = new Address({
            addressName: response.data.address
        })
        newAddress.ofUser.push(newUser);
        newAddress.save();
    })
    .catch(error => {
        console.log(error);
      });
};

exports.login = function(req, res) {
    var email = req.body.email;
    var passwordLogin = req.body.password;
    User.findOne({email: email}, function(err, user) {
        if (!user)
            res.status(404).send({ msg: "Email not found!" });
        else
            if(passwordHash.verify(passwordLogin, user.password)) {
                var payload = {
                    name: user.name,
                    email: user.email
                }
                var token = jwt.sign(payload, 'superSecret', {
                    expiresIn: 86400 // expires in 24 hours
                });
                res.json({
					message: 'Enjoy your token!',
                    name: user.name,
                    email: user.email,
                    availableBalance: user.availableBalance,
                    actualBalance: user.actualBalance,
					token: token
				});
            }
    });
}; 

exports.getUser = function(req, res) {
    User.findById(req.params.id, function(err, user) {
        if (err) {
            res.send(err);
        }
        res.json(user);
    });
};

exports.updateUser = function(req, res) {
    User.findOneAndUpdate({_id: req.params.id}, req.body, {new: true}, function(err, user) {
        if (err) {
        res.send(err);
        }
        res.json(user);
    });
};

exports.removeUser = function(req, res) {
    User.remove({_id: req.params.id}, function(err, user) {
        if (err) {
            res.send(err);
        }
    });
};
