let express = require('express');
let router = express.Router();


const protector = require('../middlewares/protector');

//all login endpoints
// let payment = require('../controllers/bills/payment');
// router.use('/payment', payment);

let rave = require('../controllers/bills/rave');
router.use('/rave',protector.protect, rave);

//all signup endpoints
// let signup = require('./payment');
// router.use('/signup', signup);

module.exports = router;