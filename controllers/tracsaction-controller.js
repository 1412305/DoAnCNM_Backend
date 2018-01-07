var mongoose = require('mongoose');
var TransactionReceive = mongoose.model('TransactionReceive');
var Address = mongoose.model('Address');
var User = mongoose.model('User');
var axios = require('axios');
var jwt = require('jsonwebtoken');
var transactionsService = require('../services/transactions');
var utils = require('../services/utils');

var createDataForTransaction = function(listAddressSend, listAddressReceive) {
    var transactionData = {
        "inputs": [],
        "outputs": [],
        "version": 1
    }

    listAddressReceive.forEach(function(element) {
        transactionData.outputs.push({
            "value": element.value,
            "lockScript": "ADD " + element.address
        })
    }, this);

    listAddressSend.forEach(function(element, index, array){
        var inputString = {
            "unlockScript": "",
            "referencedOutputHash": "",
            "referencedOutputIndex": 0
        }
        if (element.balance <= 0) return;
        TransactionReceive.find({'toAddress': element }, function(err, result){
            result.sort(function(a, b) {
                return b.confirm_at - a.confirm_at;
            })
            inputString.referencedOutputHash = result[0].hash;
            inputString.referencedOutputIndex = result[0].index;
            User.findById(element.ofUser, function(err, user) {
                if (err)
                    return;
                // var signature = transactionsService().sign(
                    // console.log(transactionsService().toBinary(result[0].hash, true))
                //     {
                //         "publicKey": user.publicKey,
                //         "privateKey": user.privateKey
                //     }
                // )
                // inputString.unlockScript = "PUB " + user.publicKey + " SIG " + signature;
                transactionData.inputs.push(inputString)
                console.log(index);
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
        
        addresses.sort(function(a, b) {
            return a.balance - b.balance;
        })
                
        for (var i=0; i < addresses.length; i++) {
            if (addresses[i].balance > 0) {
                totalValue -= addresses[i].balance;
                listAddress.push(addresses[i]);
                if (totalValue <= 0) { 
                    
                    break;
                }
            }
        }
        if (totalValue > 0)
            res.status(400).send({
                "msg": "Invalid value!"
            });
        if (totalValue < 0) {
            var excessAddress = '';
            if (addresses.length == listAddress.length) {
                User.findOne({email: req.decoded.email}, function(err, result) {
                    if (err) {
                        res.json({
                            "msg": "Invalid token!"
                        })
                    }
                    var newAddress = new Address({
                        addressName: utils().generateAddress(result.publicKey)
                    })
                    newAddress.ofUser = result
                    newAddress.save();
                    excessAddress = newAddress.addressName;
                    createDataForTransaction(listAddress, [
                        {
                            "address": receiveAddress,
                            "value": req.body.value
                        }, 
                        {
                            "address": excessAddress,
                            "value": totalValue
                        }
                    ])
                });
            }
            else {
                excessAddress = addresses[i+1].addressName;
                createDataForTransaction(listAddress, [
                    {
                        "address": receiveAddress,
                        "value": req.body.value
                    }, 
                    {
                        "address": excessAddress,
                        "value": totalValue
                    }
                ])
            }
        }
        else {
            data = createDataForTransaction(listAddress, [
                {
                    "address": receiveAddress,
                    "value": req.body.value
                }
            ])
            console.log(data);
        }
    });
};
