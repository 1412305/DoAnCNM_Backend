var mongoose = require('mongoose');
var User = mongoose.model('User');
var Address = mongoose.model('Address');
var UserVerifyKey = mongoose.model('UserVerifyKey');
var passwordHash = require('password-hash');
var axios = require('axios');
var jwt = require('jsonwebtoken');
var utils = require('../services/utils');
var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
           user: 'doan.cnm2018@gmail.com',
           pass: 'cnm123456789'
       }
   });

exports.listUsers = function(req, res) {
    if (req.decoded.authority != "admin")
        res.status(403).send("You don't have permission for this page")
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

        sendEmailVerification(newUser);
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
        UserVerifyKey.findOne({hash: req.query.verify}, function(err, result){
            if (err || !result) {
                res.status(200).send("Wrong verify key!")
                return;
            }
            if (result.user != user.id) {
                res.status(200).send("Wrong verify key for this account!")
            }
            else {
                user.active = true;
                user.save();
                result.remove();
                res.status(200).send("Your account now can use for our website! Welcome!")
            }
        })
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

function sendEmailVerification(newUser){
    // Send email for user
    var key = utils().hash(newUser.publicKey).toString('hex');
    var newKey = new UserVerifyKey({
        hash: key,
        user: newUser
    })
    newKey.save();
    
    var link = "http://localhost:3000/api/user/" + newUser.id +'?verify=' + newKey.hash;
    console.log(link);
    //Create email's content 
    const mailOptions = {
        from: 'doan.cnm2018@email.com', // sender address
        to: newUser.email, // list of receivers
        subject: 'Verify your account', // Subject line
        html: "<a href='" + link + "' method='POST'>" + newKey.hash +  "</a>"
    };

    transporter.sendMail(mailOptions, function (err, info) {
        if(err)
          console.log(err)
        else
          console.log(info);
     });
}
