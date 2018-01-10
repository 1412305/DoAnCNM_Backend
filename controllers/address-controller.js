var mongoose = require('mongoose');
var Address = mongoose.model('Address');
var User = mongoose.model('User');
var passwordHash = require('password-hash');

exports.listAddresses = function(req, res) {
    let responseData = [];
    if (req.decoded.authority != "admin")
        return;
    Address.find({},function(err, result) {
        if (err) {
            res.send(err);
        }
        let index = 0;
        result.forEach(function(element) {
            User.findById(element.ofUser, function(err, user){
              index++;
              let addressInfo = {
                address: element.addressName,
                user: "",
                availableBalance: 0,
                actualBalance: 0
              }
              if (user) {
                addressInfo.user = user.email
                addressInfo.availableBalance = user.availableBalance;
                addressInfo.actualBalance = user.actualBalance;
              }
              responseData.push(addressInfo);
              if (index === result.length)
              {
                console.log(responseData)
                res.json(responseData)
              }
            })
        })
    });
};
