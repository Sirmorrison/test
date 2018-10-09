let express = require('express');
let router = express.Router();

const protector = require('../middlewares/protector');

//all chat endpoints
let chat = require('../controllers/payments/chat');
router.use('/chat',protector.protect, chat);


//all redirect endpoints
let redirect = require('../controllers/payments/redirect');
router.use('/redirect', redirect);

module.exports = router;