let express = require('express');
let router = express.Router();

const protector = require('../middlewares/protector');

//all post endpoints'
let story = require('../controllers/post/story');
router.use('/story', story);

let question = require('../controllers/post/question');
router.use('/question',  question);

let comment = require('../controllers/post/comment');
router.use('/comment', comment);

let blog = require('../controllers/post/blog');
router.use('/blog', blog);

let answer = require('../controllers/post/answer');
router.use('/answer', answer);

module.exports = router;