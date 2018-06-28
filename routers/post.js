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

let blog = require('../controllers/post/blog');
router.use('/blog', protector.protect, blog);

let answer = require('../controllers/post/answer');
router.use('/answer', answer);

module.exports = router;