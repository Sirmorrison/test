const express = require('express');
let app = express();

//setup cors to accept requests from everywhere
const cors = require('cors');
app.use(cors());

let path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

//log all requests to the console
const logger = require('morgan');
app.use(logger('dev'));

//parse all incoming parameters to req.body
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const multipart = require('connect-multiparty');
let multipartMiddleware = multipart();
app.use(multipartMiddleware);

//consistent reply functions from all endpoints
let reply = require('./middlewares/reply');
app.use(reply.setupResponder);

let config = require('./config');
let mongoose = require('mongoose');

mongoose.connect(config.mongoUrl, {
    useMongoClient: true,
});
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error'));
db.once('open', () => console.log('connected to ask oleum database'));

//routers
let account = require('./routers/account');
app.use('/account', account);

let action = require('./routers/action');
app.use('/action', action);

let admin = require('./routers/admin');
app.use('/admin', admin);

let payments = require('./routers/payments');
app.use('/payments', payments);

let post = require('./routers/post');
app.use('/post', post);

let messages = require('./routers/messages');
app.use('/messages', messages);

app.use(function(err, req, res, next){
	res.status(400).json(err);
});


module.exports = app;