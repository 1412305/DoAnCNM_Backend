var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var cors = require('cors');
var User = require('./models/User');
var User = require('./models/Address');
var app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var url = "mongodb://khanh:123456@ds121906.mlab.com:21906/blockchain";
mongoose.Promise = global.Promise;
mongoose.connect(url);

var routes = require('./routes/route');
routes(app, express); 

app.listen();

module.exports = app;

