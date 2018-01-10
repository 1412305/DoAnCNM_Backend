var mongoose = require('mongoose');
var User = mongoose.model('User');
var Transaction = mongoose.model('Transaction');
var Address = mongoose.model('Address');
var axios = require('axios');

exports.check_send_unconfirmed_transaction = (transaction) => {
    //get all inputs of transaction
    let inputs = transaction.inputs;
    //get all outputs of transaction
    let outputs = transaction.outputs;
    //decode unlockScript of first input
    let PUB = decodeScript(inputs[0].unlockScript);

    //find user that matches this public key
    User.findOne({'publicKey': PUB}, async function(err, docs){
        if (err) return;
        //if found
        if (docs){
            let new_transaction = new Transaction();
            new_transaction.hash = transaction.hash;
            new_transaction.inputs = await getInputs(inputs);
            new_transaction.outputs = getOutputs(outputs);
            //create new transaction
            new_transaction.save(function(err, transaction){
                if (err) return;
                console.log(transaction);
            });
           
        }
    });
}

exports.check_send_confirmed_transaction = (block) => {

    //get all confirmed transaction from block
    let transactions = block.transactions;
    checkSendConfirmedTransaction(transactions);
    checkReceiveConfirmedTransaction(transactions);

}

function checkSendConfirmedTransaction(transactions){
    transactions.forEach((e) => {
        //if a transaction hash match with transaction in db
        Transaction.findOne({'hash': e.hash}, (err, t) => {
            if (err) return;
            //change status to confirmed
            if (t){
                t.status = "confirmed";
                t.balance = 0;
                t.save(function(err, tx){
                    if (err) return;
                    console.log(tx);
                    User.findById(t.ofUser, function(err, user){
                        if (err) return;
                        //if found
                        if (user){
                            //update user balance
                            user.actualBalance = user.availableBalance;
                            user.save()
                        }
                    });
                });
            }
        });
    });
}

async function checkReceiveConfirmedTransaction(transactions){
    
    await Promise.all(transactions.map( (e, i) => {
        //if a transaction hash match with transaction in db
        
        let addressNames = [];
        e.outputs.forEach(async (output) => {
            let addressName = decodeScript(output.lockScript);
    
            Address.findOne({'addressName':addressName}, async (err, t) => {
                if (err) return;
               
                if (t){
                    if (!addressNames.includes(addressName))
                    {
                        addressNames.push(addressName);
                        let new_transaction = new Transaction();
                        new_transaction.hash = e.hash;
                        new_transaction.inputs = await getInputs(e.inputs);
                        new_transaction.outputs = getOutputs(e.outputs);
                        new_transaction.status = "received";
                        //create new transaction
                        new_transaction.save(function(err, transaction){
                            if (err) return;
                            console.log(transaction);
                        });
                    }
                  
                    User.findById(t.ofUser, function(err, user){
                        if (err) return;
                        //if found
                        if (user){
                            //update user balance
                            t.balance += output.value;
                            t.save();
                            user.actualBalance += output.value;
                            user.actualBalance = user.availableBalance;
                            user.save()
                        }
                    });
                }
            })
        })
    }));
       
}

//decode script of in to get public key
function decodeScript(script){
    if (script === undefined) return;
    let splitStrings = script.split(' ');
    return splitStrings[1];
}

//get inputs array
async function getInputs(array){
    let result = await Promise.all(array.map(async (e) => {
        let result = await getInputAddress(e.referencedOutputHash);
        let outputs = result.data.outputs;
        let address;

        address = (e.referencedOutputIndex === -1) ? "genesis" : decodeScript(outputs[e.referencedOutputIndex].lockScript);

        return {address: address,
                        referencedOutputHash: e.referencedOutputHash,
                        referencedOutputIndex: e.referencedOutputIndex
                        }
    }));
    return result;
}

//get outputs array
function getOutputs(array){
    return array.map(e => ({ value: e.value,
                            address: decodeScript(e.lockScript)})
    );
}

async function getInputAddress(referencedOutputHash){
 
    //get transaction info on blockchain
    return await axios.get('https://api.kcoin.club/transactions/' + referencedOutputHash);
}


