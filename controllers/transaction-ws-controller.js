var mongoose = require('mongoose');
var User = mongoose.model('User');
var Transaction = mongoose.model('Transaction');
var axios = require('axios');

exports.check_send_unconfirmed_transaction = (transaction) => {
    //get all inputs of transaction
    let inputs = transaction.data.inputs;
    //get all outputs of transaction
    let outputs = transaction.data.outputs;
    //decode unlockScript of first input
    let PUB = decodeScript(inputs[0].unlockScript);

    //find user that matches this public key
    User.findOne({'publicKey': PUB}, async function(err, docs){
        if (err) return;
        //if found
        if (docs){
            let new_transaction = new Transaction();
            new_transaction.hash = transaction.data.hash;
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

exports.check_send_confirmed_transaction = function(){

}

//decode script of in to get public key
function decodeScript(script){
    let splitStrings = script.split(' ');
    return splitStrings[1];
}

//get inputs array
async function getInputs(array){
    let result = await Promise.all(array.map(async (e) => {
        let result = await getInputAddress(e.referencedOutputHash);
        let outputs = result.data.outputs;

        let address = decodeScript(outputs[e.referencedOutputIndex].lockScript);

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


