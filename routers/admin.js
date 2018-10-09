let express = require('express');
let router = express.Router();

const protector = require('../middlewares/protector');

//all packages endpoints
let packages = require('../controllers/admin/packages');
router.use('/packages', protector.protect, packages);

//all packages endpoints
let broadcast = require('../controllers/admin/broadcast');
router.use('/broadcast', broadcast);

let blog = require('../controllers/admin/blog');
router.use('/blog', protector.protect, blog);

//all category endpoints
let category = require('../controllers/admin/category');
router.use('/category',protector.protect, category);

let chat = require('../controllers/admin/chat');
router.use('/chat',protector.protect, chat);

let feedback = require('../controllers/admin/feedback');
router.use('/feedback',protector.protect, feedback);

//all profile endpoints
let report = require('../controllers/admin/report');
router.use('/report',protector.protect, report);

let account = require('../controllers/admin/account');
router.use('/account',protector.protect, account);

let story = require('../controllers/admin/story');
router.use('/story',protector.protect, story);

let user = require('../controllers/admin/user');
router.use('/user',protector.protect, user);

let question = require('../controllers/admin/question');
router.use('/question',protector.protect, question);

let support = require('../controllers/admin/support');
router.use('/support', protector.protect, support);

let wallet = require('../controllers/admin/wallet');
router.use('/wallet', protector.protect, wallet);

module.exports = router;