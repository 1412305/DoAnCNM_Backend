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
    
    var keyList = [];
    var i = 0;
    var endOfLoop = listAddressSend.length;
    listAddressSend.forEach(async function(element){
        var address = element.addressName;
        var addressBalance = element.balance;
        i++;
        Transaction.find({'outputs.address': address}).exec(async function(err, result){
            if (result.length == 0)
                return;
            result.sort(function(a, b) {
                return (b.created_at - a.created_at);
            })
            
            let inputStrings = await getInputStrings(result, address, addressBalance);
            let keys = await getPublicKeys(element);
            inputStrings.forEach(function(item){
                if (item != undefined) {
                    item.forEach(function(x){
                        if (x != undefined) {
                            transactionData.inputs.push(x); }
                        keyList.push(keys[0]);
                    })
                }
            })
            if (i == endOfLoop) {
                var data = transactionService().sign(transactionData, keyList);
                axios.post('https://api.kcoin.club/transactions', data)
                .then(response => {
                    
                    res.json({
                        "msg": "Successfully create transaction!"
                    })
                })
                .catch(error => {
                    console.log(error)
                    res.status(400).send({
                        "msg": "Error when create transacion!"
                    })
                });
                // console.log(data);
            }
        })
        // let keys = await getPublicKeys(element);
    })
}

async function getInputStrings(result, address, addressBalance){
    let inputStrings = await Promise.all(result.map( (transaction) => {
        if (addressBalance <= 0) return;
        var hash = transaction.hash;
        let inputStringList = [];
        transaction.outputs.forEach(function(item, index, array){
            if (item.address === address) {
                let inputString = {
                    "unlockScript": "",
                    "referencedOutputHash": hash,
                    "referencedOutputIndex": 0
                }
                inputString.referencedOutputIndex = index;
                inputStringList.push(inputString);
                addressBalance -= item.value; 
            }
        });
       
       return inputStringList; 
    }));
    return inputStrings;
}

async function getPublicKeys(element){
    let user = await getUser(element);
    var keys = [];
    if (!user)
        return;
    
    keys.push({
        "publicKey": user.publicKey,
        "privateKey": user.privateKey
    });
    
    return keys;
}

async function getUser(element){
    return await User.findById(element.ofUser); 
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
        user.availableBalance -= req.body.value;
        if (user.availableBalance >= 0)    
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
