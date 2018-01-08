var mongoose = require('mongoose');
var User = mongoose.model('User');
var Address = mongoose.model('Address');
var passwordHash = require('password-hash');
var axios = require('axios');
var jwt = require('jsonwebtoken');
var utils = require('../services/utils');

exports.listUsers = function(req, res) {
    if (decode.authority != "admin")
        return;
    User.find({}, function(err, result) {
        if (err) {
            res.send(err);
        }
        responseData = [];
        result.forEach(function(element) {
            responseData.push({
                email: element.email,
                availableBalance: element.availableBalance,
                actualBalance: element.actualBalance,
                authority: element.authority,
                address: element.address
            });
        })
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
        // Create address for receive
        var newAddress = new Address({
            addressName: response.data.address
        })
        newAddress.ofUser = newUser;
        newAddress.save();
        newUser.address = newAddress.addressName;
        newUser.save();
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
                    email: user.email,
                    authority: user.authority
                }
                var token = jwt.sign(payload, 'superSecret', {
                    expiresIn: 86400 // expires in 24 hours
                });

                //Get address of user
                Address.findById(user.address, function(err, address) {
                    res.json({
                        message: 'Enjoy your token!',
                        name: user.name,
                        email: user.email,
                        address: address.addressName,
                        authority: user.authority,
                        availableBalance: user.availableBalance,
                        actualBalance: user.actualBalance,
                        token: token
                    });
                })
            }
            else {
                res.status(200).send({msg: "Invalid email or password!"});
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
