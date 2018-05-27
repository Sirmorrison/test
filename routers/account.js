"use strict";

let express = require('express');
let router = express.Router();


const protector = require('../middlewares/protector');

//all login endpoints
let login = require('../controllers/account/login');
router.use('/login', login);

//all signup endpoints
let signup = require('../controllers/account/signup');
router.use('/signup', signup);

//all profile endpoints
let profile = require('../controllers/account/profile');
router.use('/profile',protector.protect, profile);

//all recovery endpoints
let recovery = require('../controllers/account/recovery');
router.use('/recovery', recovery);

//all verification endpoints
let verification = require('../controllers/account/verification');
router.use('/verification', verification);

let token = require('../controllers/account/token');
router.use('/token', token);

module.exports = router;