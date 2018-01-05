var express = require('express');
var app = express();
var port = process.env.PORT || 8000;
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
const cors = require('cors');

// mongoose instance connection url connection
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://nhatnt:Arrowtn2428456@ds119486.mlab.com:19486/nhatblockchain');

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var userRoute = require('./routes/user'); //importing route
var transactionRoute = require('./routes/transaction'); //importing route
transactionRoute(app); //register the route
userRoute(app); //register the route

app.listen(port);
console.log('Block chain RESTful API server started on: ' + port);
