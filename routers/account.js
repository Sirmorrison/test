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
router.use('/profile',protector.protect , profile);

let bank_account = require('../controllers/account/bank_account');
router.use('/bank_account',protector.protect, bank_account);

//all recovery endpoints
let recovery = require('../controllers/account/recovery');
router.use('/recovery', recovery);

//all verification endpoints
let verification = require('../controllers/account/verification');
router.use('/verification',protector.protect, verification);

let token = require('../controllers/account/token');
router.use('/token',protector.protect, token);

let wallet = require('../controllers/account/wallet');
router.use('/wallet',protector.protect, wallet);

let category = require('../controllers/account/category');
router.use('/category',protector.protect, category);

//all subscribe endpoints
let subscribe = require('../controllers/account/subscribe');
router.use('/subscribe', subscribe);

module.exports = router;