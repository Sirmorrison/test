let express = require('express');
let router = express.Router();

const protector = require('../middlewares/protector');

//all feedback endpoints'
let feedback = require('../controllers/message/feedback');
router.use('/feedback', feedback);

let chat = require('../controllers/admin/chat');
router.use('/chat',protector.protect, chat);

let support = require('../controllers/message/support');
router.use('/support', protector.protect, support);

// let comment = require('../controllers/post/comment');
// router.use('/comment', protector.protect, comment);
//
// let blog = require('../controllers/post/blog');
// router.use('/blog', protector.protect, blog);
//
// let answer = require('../controllers/post/answer');
// router.use('/answer', protector.protect, answer);

module.exports = router;