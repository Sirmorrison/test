let express = require('express');
let router = express.Router();

let Question = require('../../models/question');
let Story = require('../../models/story');

/*** END POINT FOR GETTING BOOKMARKED STORY OF CURRENTLY LOGGED IN USER */
router.get('/story', function (req, res) {

    let id = req.user.id;
    Story.aggregate([
        {$match: {"bookmarks.userId": id}},
        {$unwind: {path: "$bookmarks", preserveNullAndEmptyArrays: true}},
        {$project: {comments:{$size :"$comments"},dislikes:{$size :"$dislikes"},likes:{$size :"$likes"}, category:1, story:1, postedOn:1,postedBy:1, title:1}},
        {$sort:{date: -1}}

    ], function (err, data) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        Story.populate(data,{
                'path': 'likes.userId dislikes.userId comments.commentedBy',
                'select': 'name photoUrl email bio'
            },

            function (err, post) {

                if (err) {
                    console.log(err);
                    return res.badRequest("Something unexpected happened");
                }
                if (!post) {
                    return res.success([]);
                }

                res.success(post);
            }
        );
    });
});

/*** END POINT FOR GETTING BOOKMARKED ANSWERS OF CURRENTLY LOGGED IN USER */
router.get('/answer', function (req, res) {

    let id = req.user.id;
    Question.aggregate([
        {$match: {"bookmarks.userId": id}},
        {$unwind: {path: "$bookmarks", preserveNullAndEmptyArrays: true}},
        {$project: {comments:{$size :"$comments"},dislikes:{$size :"$dislikes"},likes:{$size :"$likes"}, category:1, story:1, postedOn:1,postedBy:1, title:1}},
        {$sort:{date: -1}}

    ], function (err, data) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        Story.populate(data,{
                'path': 'likes.userId dislikes.userId comments.commentedBy',
                'select': 'name photoUrl email bio'
            },

            function (err, post) {

                if (err) {
                    console.log(err);
                    return res.badRequest("Something unexpected happened");
                }
                if (!post) {
                    return res.success([]);
                }

                res.success(post);
            }
        );
    });
});

/*** END POINT FOR BOOKMARKING A STORY  BY CURRENTLY LOGGED IN USER */
router.post('/:storyId', function (req, res) {

    let userId = req.user.id;
    let storyId = req.params.storyId;

    User.update({
        "_id": userId,
        "bookmarks": {
            "$not": {
                "$elemMatch": {
                    "storyId": storyId
                }
            }
        },$addToSet: {
            bookmarks: {
                "storyId": storyId
            }
        }
    },function (err, f) {
        console.log(f);

        if (err) {
            return res.badRequest("Something unexpected happened");
        }
        console.log(f);
        if(f.nModified === 0){
            let updateOperation = {
                '$pull': {
                    'bookmarks': {
                        "storyId": storyId
                    }
                }
            };

            User.update({_id: userId}, updateOperation, function (err) {
                if (err) {
                    console.log(err);
                    return res.badRequest("Some error occurred");
                }

                res.success({bookmarked: false});
            });
        }else {
            res.success({bookmarked: true});
        }
    });
});

/*** END POINT FOR BOOKMARKING A QUESTION  BY CURRENTLY LOGGED IN USER */
router.post('/:answerId', function (req, res) {

    let userId = req.user.id;
    let questionId = req.params.questionId;

    User.update({
        "_id": userId,
        "bookmarks": {
            "$not": {
                "$elemMatch": {
                    "questionId": questionId
                }
            }
        },$addToSet: {
            bookmarks: {
                "questionId": questionId
            }
        }
    },function (err, f) {
        console.log(f);

        if (err) {
            return res.badRequest("Something unexpected happened");
        }
        console.log(f);
        if(f.nModified === 0){
            let updateOperation = {
                '$pull': {
                    'bookmarks': {
                        "questionId": questionId
                    }
                }
            };

            User.update({_id: userId}, updateOperation, function (err) {
                if (err) {
                    console.log(err);
                    return res.badRequest("Some error occurred");
                }

                res.success({bookmarked: false});
            });
        }else {
            res.success({bookmarked: true});
        }
    });
});

module.exports = router;