var mongoose = require('mongoose');
var Transaction = mongoose.model('Transaction');
var Address = mongoose.model('Address');
var User = mongoose.model('User');
var axios = require('axios');
var jwt = require('jsonwebtoken');
var transactionService = require('../services/transactions');
var utils = require('../services/utils');

var createDataForTransaction = function(res, listAddressSend, listAddressReceive) {
    var transactionData = {
        "inputs": [],
        "outputs": [],
        "version": 1
    }

    listAddressReceive.forEach(function(element) {
        transactionData.outputs.push({
            "value": parseInt(element.value),
            "lockScript": "ADD " + element.address
        })
    }, this);

    listAddressSend.forEach(function(element){
        var keys = [];
        var inputString = {
            "unlockScript": "",
            "referencedOutputHash": "",
            "referencedOutputIndex": 0
        }
        if (element.balance <= 0) return;
        Transaction.find({'outputs': element.addressName}, function(err, result){
            if (result.length == 0)
                return;
            result.sort(function(a, b) {
                return (b.created_at - a.created_at);
            })
            inputString.referencedOutputHash = result[0].hash;
            inputString.referencedOutputIndex = result[0].outputs.indexOf(element.addressName);
            //element.balance = 0;
            element.save();
            User.findById(element.ofUser, function(err, user) {
                if (err)
                    return;
                transactionData.inputs.push(inputString)
                keys.push({
                    "publicKey": user.publicKey,
                    "privateKey": user.privateKey
                });
                if ((transactionData.inputs.length == listAddressSend.length) && (transactionData.outputs.length == listAddressReceive.length))
                {
                    var data = transactionService().sign(transactionData,keys);
                    axios.post('https://api.kcoin.club/transactions', data)
                    .then(response => {
                        res.json({
                            "msg": "Successfully create transaction!"
                        })
                    })
                    .catch(error => {
                        res.status(400).send({
                            "msg": "Error when create transacion!"
                        })
                    });
                }
            })
        })
    })
}

exports.createTransaction = function(req, res) {
    // param: token, value, address
    let totalValue = req.body.value;
    let receiveAddress = req.body.address
    
    if (!(totalValue && receiveAddress)) {
        res.status(400).json("Missing data for transaction")
    }
    
    Address.find().exec(function(err, addresses) {
        let listAddress = [];
        let excessAddress = '';
        addresses.sort(function(a, b) {
            return b.balance - a.balance;
        })
        for (var i=0; i < addresses.length; i++) {
            if (addresses[i].balance > 0) {
                totalValue -= addresses[i].balance;
                listAddress.push(addresses[i]);
                if (totalValue <= 0) {
                    if (i != addresses.length-1) {
                        excessAddress = addresses[i+1].addressName;
                    }
                    break;
                }
            } else continue;
        }
        if (totalValue > 0)
            res.status(400).send({
                "msg": "Invalid value!"
            });
        if (totalValue < 0) {
            if (addresses.length == listAddress.length) {
                User.findOne({email: req.decoded.email}, function(err, result) {
                    var newAddress = new Address({
                        addressName: utils().generateAddress(result.publicKey)
                    })
                    newAddress.ofUser = result
                    newAddress.save();
                    excessAddress = newAddress.addressName;
                    createDataForTransaction(res, listAddress, [
                        {
                            "address": receiveAddress,
                            "value": req.body.value
                        }, 
                        {
                            "address": excessAddress,
                            "value": -totalValue
                        }
                    ])
                });
            }
            else {
                createDataForTransaction(res, listAddress, [
                    {
                        "address": receiveAddress,
                        "value": req.body.value
                    }, 
                    {
                        "address": excessAddress,
                        "value": -totalValue
                    }
                ])
            }
        }
        else {
            data = createDataForTransaction(res, listAddress, [
                {
                    "address": receiveAddress,
                    "value": req.body.value
                }
            ])
        }
    });
    User.findOne({email: req.decoded.email}, function(err, user) {
        if (err) {
            res.json({
                "msg": "Invalid token!"
            })
        }
        // user.availableBalance -= req.body.value;
        if (user.availableBalance > 0)    
            user.save();
        else
            res.status(400).send({
                "msg": "Invalid value"
            });
    });
};

exports.listTransactions = function(req, res) {
    if (req.decoded.authority != "admin")
        return;
    Transaction.find({}, function(err, result) {
        if (err) {
            res.send(err);
        }
        res.json(result);
    });
};
