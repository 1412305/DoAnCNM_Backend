var mongoose = require('mongoose');
var Address = mongoose.model('Address');
var User = mongoose.model('User');
var passwordHash = require('password-hash');

exports.listAddresses = function(req, res) {
    responseData = [];
    if (req.decoded.authority != "admin")
        return;
    Address.find({},function(err, result) {
        if (err) {
            res.send(err);
        }
        var index = 0;
        result.forEach(function(element) {
            User.findById(element.ofUser, function(err, user){
                index++;
                responseData.push({
                    address: element.addressName,
                    user: user.email,
                    authority: user.authority
                });
                if (index == result.length) {
                    res.json(responseData);
                }
            })
        })
    });
};