let express = require('express');
let router = express.Router();


const protector = require('../middlewares/protector');

//all action endpoints

let general = require('../controllers/action/general');
router.use('/general', general);

let follow = require('../controllers/action/follow');
router.use('/follow', protector.protect, follow);

let dislike = require('../controllers/action/dislike');
router.use('/dislike', protector.protect, dislike);

let notification = require('../controllers/action/notification');
router.use('/notification', protector.protect, notification);

let like = require('../controllers/action/like');
router.use('/like', protector.protect, like);

let rating = require('../controllers/action/rating');
router.use('/rating', protector.protect, rating);

let report = require('../controllers/action/report');
router.use('/report', protector.protect, report);

let support = require('../controllers/message/support');
router.use('/message', protector.protect, support);

let messages = require('../controllers/admin/chat');
router.use('/messages', protector.protect, messages);

let bookmark = require('../controllers/action/bookmark');
router.use('/bookmark', protector.protect, bookmark);

module.exports = router;