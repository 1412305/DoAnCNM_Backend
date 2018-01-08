var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var cors = require('cors');
var User = require('./models/User');
var Address = require('./models/Address');
var TransactionReceive = require('./models/TransactionReceive');
var app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var url = "mongodb://khanh:123456@ds121906.mlab.com:21906/blockchain";
mongoose.Promise = global.Promise;
mongoose.connect(url);

var routes = require('./routes/route');
routes(app, express); 

const WebSocket = require('ws');
var ws = new WebSocket('wss://api.kcoin.club');

ws.on('open', function(){
    console.log("connect");
});

ws.on('message', function(data){
    console.log(data);
});

setInterval(function(){ 
    checkTime(ws) },
6000);

function checkTime(ws) {
   ws.send("hello");
}
ws.on('disconnect', function(){
    console.log("disconnect");
});

app.listen();

module.exports = app;

