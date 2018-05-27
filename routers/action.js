"use strict";

let express = require('express');
let router = express.Router();
const protector = require('../middlewares/protector');

//all action endpoints

let story = require('../controllers/action/story');
router.use('/story',protector.protect, story);

let question = require('../controllers/action/question');
router.use('/question',protector.protect, question);

let follow = require('../controllers/action/follow');
router.use('/follow', protector.protect, follow);

let dislike = require('../controllers/action/dislike');
router.use('/dislike', protector.protect, dislike);

let like = require('../controllers/action/like');
router.use('/like', protector.protect, like);

let rating = require('../controllers/action/rating');
router.use('/rating', protector.protect, rating);

let comment = require('../controllers/action/comment');
router.use('/comment', protector.protect, comment);

module.exports = router;