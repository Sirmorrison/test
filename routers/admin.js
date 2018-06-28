let express = require('express');
let router = express.Router();

const protector = require('../middlewares/protector');

//all packages endpoints
let packages = require('../controllers/admin/packages');
router.use('/packages',protector.protect, packages);

//all category endpoints
let category = require('../controllers/admin/category');
router.use('/category', category);

//all profile endpoints
let report = require('../controllers/admin/report');
router.use('/report',protector.protect, report);

let account = require('../controllers/admin/account');
router.use('/account', account);

let story = require('../controllers/admin/story');
router.use('/story', story);

let user = require('../controllers/admin/user');
router.use('/user', user);

let question = require('../controllers/admin/question');
router.use('/question', question);

module.exports = router;