let express = require('express');
let router = express.Router();

let Story = require('../../models/story_bookmark');
let Answer = require('../../models/answer_bookmark');
let Question = require('../../models/question_bookmark');


/*** END POINT FOR GETTING STORY BOOKMARKS OF CURRENTLY LOGGED IN USER */
router.get('/story_bookmark', function (req, res) {

    let id = req.user.id;
    Story.find({userId: id}, {message: 1, createdOn: 1})
        .populate({
            path: 'userId',
            select: 'name photoUrl'
        })
        .populate({
            path: 'storyId',
            select: 'title views likes dislikes createdAt'
        })
        .exec(function (err, story) {
            if (err) {
                console.log(err);
                return res.badRequest('something unexpected happened')
            }
            if (!story) {
                return res.success({})
            }

            let data = {
                'total bookmarks': story.length,
                stories: story
            };

            res.success(data)
        }
    );
});

/*** END POINT FOR GETTING ANSWER BOOKMARKS OF CURRENTLY LOGGED IN USER */
router.get('/answer_bookmark', function (req, res) {

    let id = req.user.id;
    Answer.find({userId: id}, {message: 1, createdOn: 1})
        .populate({
            path: 'userId',
            select: 'name photoUrl'
        })
        .populate({
            path: 'answerId',
            select: 'views likes dislikes createdAt answeredBy.name'
        })
        .exec(function (err, answer) {
            if (err) {
                console.log(err);
                return res.badRequest('something unexpected happened')
            }
            if (!answer) {
                return res.success({})
            }

            let data = {
                'total bookmarks': answer.length,
                answer: answer
            };

            res.success(data)
        }
    );
});

/*** END POINT FOR GETTING ANSWER BOOKMARKS OF CURRENTLY LOGGED IN USER */
router.get('/question_bookmark', function (req, res) {

    let id = req.user.id;
    Question.find({userId: id}, {message: 1, createdOn: 1})
        .populate({
            path: 'userId',
            select: 'name photoUrl'
        })
        .populate({
            path: 'questionId',
            select: 'views answers question postedBy.name createdOn'
        })
        .exec(function (err, question) {
                if (err) {
                    console.log(err);
                    return res.badRequest('something unexpected happened')
                }
                if (!question) {
                    return res.success({})
                }

                let data = {
                    'total bookmarks': question.length,
                    question: question
                };

                res.success(data)
            }
        );
});

// /*** END POINT FOR GETTING BOOKMARKED STORY OF CURRENTLY LOGGED IN USER */
// router.get('/story', function (req, res) {
//
//     let id = req.user.id;
//     Story.aggregate([
//         {$match: {"bookmarks.userId": id}},
//         {$unwind: {path: "$bookmarks", preserveNullAndEmptyArrays: true}},
//         {$project: {comments:{$size :"$comments"},dislikes:{$size :"$dislikes"},likes:{$size :"$likes"}, category:1, story:1, postedOn:1,postedBy:1, title:1}},
//         {$sort:{date: -1}}
//
//     ], function (err, data) {
//         if (err) {
//             console.log(err);
//             return res.badRequest("Something unexpected happened");
//         }
//
//         Story.populate(data,{
//                 'path': 'likes.userId dislikes.userId comments.commentedBy',
//                 'select': 'name photoUrl email bio'
//             },
//
//             function (err, post) {
//
//                 if (err) {
//                     console.log(err);
//                     return res.badRequest("Something unexpected happened");
//                 }
//                 if (!post) {
//                     return res.success([]);
//                 }
//
//                 res.success(post);
//             }
//         );
//     });
// });
//
// /*** END POINT FOR GETTING BOOKMARKED ANSWERS OF CURRENTLY LOGGED IN USER */
// router.get('/answer', function (req, res) {
//
//     let id = req.user.id;
//     Question.aggregate([
//         {$match: {"bookmarks.userId": id}},
//         {$unwind: {path: "$bookmarks", preserveNullAndEmptyArrays: true}},
//         {$project: {comments:{$size :"$comments"},dislikes:{$size :"$dislikes"},likes:{$size :"$likes"}, category:1, story:1, postedOn:1,postedBy:1, title:1}},
//         {$sort:{date: -1}}
//
//     ], function (err, data) {
//         if (err) {
//             console.log(err);
//             return res.badRequest("Something unexpected happened");
//         }
//
//         Story.populate(data,{
//                 'path': 'likes.userId dislikes.userId comments.commentedBy',
//                 'select': 'name photoUrl email bio'
//             },
//
//             function (err, post) {
//
//                 if (err) {
//                     console.log(err);
//                     return res.badRequest("Something unexpected happened");
//                 }
//                 if (!post) {
//                     return res.success([]);
//                 }
//
//                 res.success(post);
//             }
//         );
//     });
// });
/*** END POINT FOR BOOKMARKING A STORY  BY CURRENTLY LOGGED IN USER */
router.post('/story_bookmark', function (req, res) {

    let userId = req.user.id;
    let storyId = req.query.storyId;
    Story.findOne({storyId: storyId, userId: userId}, function (err, story) {
        if (err) {
            console.log(err);
            return res.badRequest('something unexpected happened')
        }
        if(story){
            return res.success('you have already bookmarked this story')
        }

        let data = {
            userId: userId,
            storyId: storyId
        };
        Story.create(data, function (err, bookmark) {
            if (err) {
                console.log(err);
                return res.badRequest('something unexpected happened')
            }

            res.success('bookmark has been saves successfully')
        })
    })
});

/*** END POINT FOR BOOKMARKING AN ANSWER  BY CURRENTLY LOGGED IN USER */
router.post('/answer_bookmark', function (req, res) {

    let userId = req.user.id;
    let answerId = req.query.answerId;
    Story.findOne({answerId: answerId, userId: userId}, function (err, question) {
        if (err) {
            console.log(err);
            return res.badRequest('something unexpected happened')
        }
        if(question){
            return res.success('you have already bookmarked this story')
        }

        let data = {
            userId: userId,
            answerId: answerId
        };
        Story.create(data, function (err, bookmark) {
            if (err) {
                console.log(err);
                return res.badRequest('something unexpected happened')
            }

            res.success('bookmark has been saves successfully')
        })
    })
});

/*** END POINT FOR BOOKMARKING AN ANSWER  BY CURRENTLY LOGGED IN USER */
router.post('/question_bookmark', function (req, res) {

    let userId = req.user.id;
    let questionId = req.query.questionId;
    Question.findOne({questionId: questionId, userId: userId}, function (err, question) {
        if (err) {
            console.log(err);
            return res.badRequest('something unexpected happened')
        }
        if(question){
            return res.success('you have already bookmarked this question')
        }

        let data = {
            userId: userId,
            questionId: questionId
        };
        Question.create(data, function (err, bookmark) {
            if (err) {
                console.log(err);
                return res.badRequest('something unexpected happened')
            }

            res.success('bookmark has been saves successfully')
        })
    })
});

/*** END POINT FOR DELETING BOOKMARK OF AN ANSWER BY CURRENTLY LOGGED IN USER */
router.delete('/answer_bookmark/:bookmarkId', function (req, res) {

    let userId = req.user.id;
    let bookmarkId = req.params.bookmarkId;
    Answer.remove({answerId: bookmarkId, userId: userId}, function (err, result) {
        if (err) {
            console.log(err);
            return res.badRequest('something unexpected happened')
        }
        if (!result) {
            return res.badRequest('no bookmarked answer with detail provided')
        }

        res.success('answer bookmark deleted successfully')
    });
});

/*** END POINT FOR DELETING BOOKMARK OF AN ANSWER BY CURRENTLY LOGGED IN USER */
router.delete('/story_bookmark/:bookmarkId', function (req, res) {

    let userId = req.user.id;
    let bookmarkId = req.params.bookmarkId;
    Story.remove({storyId: bookmarkId, userId: userId}, function (err, result) {
        if (err) {
            console.log(err);
            return res.badRequest('something unexpected happened')
        }
        if (!result) {
            return res.badRequest('no bookmarked story with detail provided')
        }

        res.success('story bookmark deleted successfully')
    });
});

module.exports = router;