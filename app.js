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

var WebSocket = require('ws');
const ws = new WebSocket('https://api.kcoin.club/');

ws.on('message', function incoming(data) {
    console.log("asdas");
    console.log(data);
});

app.listen();

module.exports = app;

