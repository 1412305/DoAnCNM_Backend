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
                // transactionData.inputs.push(item);
                // keyList.push(keys[0]);
                var data = transactionService().sign(item, keys);
                // console.log(data);
            })
            if (i == endOfLoop) {
                var data = { inputs:
                    [ { unlockScript: 'PUB 2d2d2d2d2d424547494e205055424c4943204b45592d2d2d2d2d0a4d4947664d413047435371475349623344514542415155414134474e4144434269514b426751436b3165696e54567275656d386f46634d6c494779564b7671320a365372327874715339495177365a414153597644796f6c63656d6e3059684e5036654d524c55384846332b6265657568434a6841624a56476235334a477676390a2b7a4f5841423358654937335248623237594238724966524b4a647445524c334563716568477958364e6531704731436e2f476b41726a756555776b4f7577660a493375425472726f49786c724a4f4f2f53514944415141420a2d2d2d2d2d454e44205055424c4943204b45592d2d2d2d2d0a SIG 04446bd279ef543203dc954c1c631bf2652905ebee50050cf7f795d73d1a329c3be273b7ee13d693240e6101e21fce99cd71ec137a348f968589eac823d488c6ada7507816f445852e1870a0a601c18eaf81cd10b34eb9a8a91cc386367551277a5ecc5f29c44fc69cd978872d5999c9d328774e8890d6e6b427faa915de53ca',
                        referencedOutputHash: 'f3d218bad02b3d8069a46e8020de8ef620e1b03f5fa904061499631a94a1b985',
                        referencedOutputIndex: 25 },
                        { unlockScript: 'PUB 2d2d2d2d2d424547494e205055424c4943204b45592d2d2d2d2d0a4d4947664d413047435371475349623344514542415155414134474e4144434269514b426751436b3165696e54567275656d386f46634d6c494779564b7671320a365372327874715339495177365a414153597644796f6c63656d6e3059684e5036654d524c55384846332b6265657568434a6841624a56476235334a477676390a2b7a4f5841423358654937335248623237594238724966524b4a647445524c334563716568477958364e6531704731436e2f476b41726a756555776b4f7577660a493375425472726f49786c724a4f4f2f53514944415141420a2d2d2d2d2d454e44205055424c4943204b45592d2d2d2d2d0a SIG 04446bd279ef543203dc954c1c631bf2652905ebee50050cf7f795d73d1a329c3be273b7ee13d693240e6101e21fce99cd71ec137a348f968589eac823d488c6ada7507816f445852e1870a0a601c18eaf81cd10b34eb9a8a91cc386367551277a5ecc5f29c44fc69cd978872d5999c9d328774e8890d6e6b427faa915de53ca',
                        referencedOutputHash: 'f96aac3ddac36fcd600c9d999a0aeedc85c646c4ce3ba3eed63830195514f7e9',
                        referencedOutputIndex: 1 } ],
                   outputs:
                    [ { value: 1,
                        lockScript: 'ADD e8e6fecbda23e83b35f7bcc808cdba8d2853221b1f7b9864992c25bd892f702348' },
                      { value: 19998,
                        lockScript: 'ADD 4021e05a50583354dfcd112f7860775ed52ddd77526ff20e6a6ba339be00f8f3' } ],
                   version: 1 };
                // var data = transactionService().sign(transactionData, keyList);
                // axios.post('https://api.kcoin.club/transactions', data)
                // .then(response => {
                //     res.json({
                //         "msg": "Successfully create transaction!"
                //     })
                // })
                // .catch(error => {
                //     console.log(error)
                //     res.status(400).send({
                //         "msg": "Error when create transacion!"
                //     })
                // });
                // console.log(keyList);
                console.log(transactionData);
            }
        })
        // let keys = await getPublicKeys(element);
    })
}

async function getInputStrings(result, address, addressBalance){
    let inputStrings = await Promise.all(result.map( (transaction) => {
        if (addressBalance <= 0) return;
        let inputString = {
            "unlockScript": "",
            "referencedOutputHash": "",
            "referencedOutputIndex": 0
        }
        inputString.referencedOutputHash = transaction.hash;
        transaction.outputs.forEach(function(item, index, array){
            if (item.address === address) {
                inputString.referencedOutputIndex = index;
                addressBalance -= item.value; 
            }
        });
        // addressBalance -= transact
        // transactionData.inputs.push(inputString);
        // addressBalance -= totalBalance(transaction.outputs);
        // console.log(transactionData);
        //element.balance = 0;
        // element.save();
       return inputString;
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
        // if ((addressBalance<=0) && (transactionData.outputs.length == listAddressReceive.length))
        // {
        //     var data = transactionService().sign(transactionData,keys);
        //     // axios.post('https://api.kcoin.club/transactions', data)
        //     // .then(response => {
        //     //     res.json({
        //     //         "msg": "Successfully create transaction!"
        //     //     })
        //     // })
        //     // .catch(error => {
        //     //     res.status(400).send({
        //     //         "msg": "Error when create transacion!"
        //     //     })
        //     // });
        //     // console.log(data);
        // }
    // })
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
