let express = require('express');
let router = express.Router();


const protector = require('../middlewares/protector');

//all login endpoints
let payment = require('../controllers/bills/payment');
router.use('/payment', payment);

//all signup endpoints
// let signup = require('./payment');
// router.use('/signup', signup);

module.exports = router;