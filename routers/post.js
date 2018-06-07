let express = require('express');
let router = express.Router();

const protector = require('../middlewares/protector');

//all post endpoints

let story = require('../controllers/post/story');
router.use('/story',protector.protect, story);

let question = require('../controllers/post/question');
router.use('/question',protector.protect, question);

let comment = require('../controllers/post/comment');
router.use('/comment', protector.protect, comment);

let answer = require('../controllers/post/answer');
router.use('/answer', protector.protect, answer);

module.exports = router;