let express = require('express');
let router = express.Router();

let Story = require('../../models/story');
let Question = require('../../models/question');

/*** END POINT FOR GETTING THE DISLIKES ON A STORIES ANSWER OF A USER BY LOGGED IN USERS*/
router.get('/:storyId/:commentId', function (req, res) {

    let storyId = req.params.storyId,
        commentId = req.params.commentId;

    Story.findOne({_id: storyId})
        .populate({
            path: 'comments.likes.userId',
            select: 'name photoUrl public_id'
        })
        .sort({date: -1})
        .exec(function (err, post) {
        console.log(post);
                if (err) {
                    return res.serverError("Something unexpected happened");
                }
                if (!post){
                    return res.success('no post found with the id provided')
                }

                res.success(post.comments.id(commentId).likes);
            }
        );
});

/*** END POINT FOR GETTING THE DISLIKES ON A QUESTIONS ANSWER OF A USER BY LOGGED IN USERS*/
router.get('/:questionId/:answerId', function (req, res) {

    let questionId = req.params.questionId,
        answerId = req.params.answerId;

    Question.findOne({_id: questionId})
        .populate({
            path: 'answers.likes.userId',
            select: 'name photoUrl public_id'
        })
        .sort({date: -1})
        .exec(function (err, post) {
            console.log(post);
            if (err) {
                return res.serverError("Something unexpected happened");
            }
            if (!post){
                return res.success('no post found with the id provided')
            }

            res.success(post.answers.id(answerId).likes);
        }
    );
});

//STORY
/*** END POINT FOR LIKING A STORY  BY CURRENTLY LOGGED IN USER */
router.post('/story/:postId', function (req, res) {

    let userId = req.user.id;
    let postId = req.params.postId;

    Story.update({
        "_id": postId,
        "dislikes": {
            "$not": {
                "$elemMatch": {
                    "userId": userId
                }
            }
        },
        "likes": {
            "$not": {
                "$elemMatch": {
                    "userId": userId
                }
            }
        }
    }, {
        $addToSet: {
            likes: {
                "userId": userId
            }
        }
    },function (err, f) {
        if (err) {
            return res.badRequest("Something unexpected happened");
        }
        console.log(f)
        if(f.nModified === 0){
            return res.success('you have either liked or disliked this post')
        }
        res.success({liked: true});
    });
});

/*** END POINT FOR DELETING STORY OF A POST BY CURRENTLY LOGGED IN USER */
router.delete('/story/:postId', function (req, res) {
    let updateOperation = {
        '$pull': {
            'likes': {
                'userId': req.user.id
            }
        }
    };

    Story.update({_id: req.params.postId}, updateOperation, function (err) {
        if (err) {
            console.log(err);
            return res.badRequest("Some error occurred");
        }

        res.success({liked: false});
    });
});

//QUESTION
/*** END POINT FOR LIKING A QUESTION  BY CURRENTLY LOGGED IN USER */
router.post('/question/:postId', function (req, res) {

    let userId = req.user.id;
    let postId = req.params.postId;

    Question.update({
        "_id": postId,
        "dislikes": {
            "$not": {
                "$elemMatch": {
                    "userId": userId
                }
            }
        },
        "likes": {
            "$not": {
                "$elemMatch": {
                    "userId": userId
                }
            }
        }
    }, {
        $addToSet: {
            likes: {
                "userId": userId
            }
        }
    },function (err, f) {
        if (err) {
            return res.badRequest("Something unexpected happened");
        }
        if(f.nModified === 0){
            return res.success('you have either liked or disliked this post')
        }
        res.success({liked: true});
    });
});

/*** END POINT FOR DELETING QUESTION OF A POST BY CURRENTLY LOGGED IN USER */
router.delete('/question/:postId', function (req, res) {
    let updateOperation = {
        '$pull': {
            'likes': {
                'userId': req.user.id
            }
        }
    };

    Question.update({_id: req.params.postId}, updateOperation, function (err) {
        if (err) {
            console.log(err);
            return res.badRequest("Some error occurred");
        }

        res.success({liked: false});
    });
});

//STORY COMMENTS AND QUESTION ANSWERS
/*** END POINT FOR LIKING A COMMENT BY CURRENTLY LOGGED IN USER */
router.post('/story/:storyId/comment/:commentId', function (req, res) {

    let userId = req.user.id;
    let storyId = req.params.storyId;
    let answerId = req.params.answerId;

    Story.update({
        "_id": storyId,
        'comments._id': answerId,
        "comments.dislikes": {
            "$not": {
                "$elemMatch": {
                    "userId": userId
                }
            }
        },
        "comments.likes": {
            "$not": {
                "$elemMatch": {
                    "userId": userId
                }
            }
        }
    }, {
        $addToSet: {
            'comments.$.likes': {
                "userId": userId
            }
        }
    },function (err, f) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }
        if(f.nModified === 0){
            return res.success('you have either liked or disliked this post')
        }
        res.success({liked: true});
    });
});

/*** END POINT FOR LIKING AN ANSWER  BY CURRENTLY LOGGED IN USER */
router.post('/question/:questionId/answer/:answerId', function (req, res) {

    let userId = req.user.id;
    let questionId = req.params.questionId;
    let answerId = req.params.answerId;

    Story.update({
        "_id": questionId,
        'answers._id': answerId,
        "answers.dislikes": {
            "$not": {
                "$elemMatch": {
                    "userId": userId
                }
            }
        },
        "answers.likes": {
            "$not": {
                "$elemMatch": {
                    "userId": userId
                }
            }
        }
    }, {
        $addToSet: {
            'answers.$.likes': {
                "userId": userId
            }
        }
    },function (err, f) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }
        if(f.nModified === 0){
            return res.success('you have either liked or disliked this post')
        }
        res.success({liked: true});
    });
});

/*** END POINT FOR DELETING COMMENT LIKE OF A POST BY CURRENTLY LOGGED IN USER */
router.delete('/story/:storyId/comment/:commentId', function (req, res) {
    let userId = req.user.id;
    let storyId = req.params.storyId;
    let commentId = req.params.commentId;
    let updateOperation = {
        $pull: {
            'comments.$.likes': {
                    userId: userId
            }
        }
    };

    Story.update({'_id': storyId, 'comments._id': commentId}, updateOperation, function (err, g) {
        if (err) {
            console.log(err);
            return res.badRequest("Some error occurred");
        }

        res.success({liked: false});
    });
});

/*** END POINT FOR DELETING ANSWER LIKE OF A POST BY CURRENTLY LOGGED IN USER */
router.delete('/question/:questionId/answer/:answerId', function (req, res) {
    let userId = req.user.id;
    let questionId = req.params.questionId;
    let answerId = req.params.answerId;
    let updateOperation = {
        $pull: {
            'answers.$.likes': {
                userId: userId
            }
        }
    };

    Story.update({'_id': questionId, 'answers._id': answerId}, updateOperation, function (err, g) {
        if (err) {
            console.log(err);
            return res.badRequest("Some error occurred");
        }

        res.success({liked: false});
    });
});

module.exports = router;