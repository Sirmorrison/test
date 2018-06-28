const express = require('express');
const router = express.Router();
let mongoose = require("mongoose");
let async = require('async');

let Admin_post = require('../../models/admin_post');
let Blog = require('../../models/blog');
let Package = require('../../models/packages'),
    Story = require('../../models/story'),
    Question = require('../../models/question'),
    User = require('../../models/user');

//PAYMENT PACKAGES
/*** END POINT FOR GETTING PLAN PACKAGES BY ALL USER */
router.get('/packages', function (req, res) {

    Package.find({}, {package_name:1, amount:1, currency:1},function (err, result) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        res.success(result);
    })
});

//ADMIN BROADCAST MESSAGE
/*** END POINT FOR GETTING STORY OF BY CATEGORIES BY CURRENTLY LOGGED IN USER */
router.get('/broadcast', function (req, res) {

    Admin_post.aggregate([
        {
            $project: {
                message: 1,
                views: 1,
                comments: {$size: "$comments"},
                dislikes: {$size: "$dislikes"},
                likes: {$size: "$likes"},
                createdAt: 1,
                postedBy: 1
            }
        },
        {$sort: {createdAt: -1}},
        {$limit: 10}
    ], function (err, data) {

        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        res.success(data);
    });
});

//STORIES
/*** END POINT FOR GETTING STORY OF BY CATEGORIES BY CURRENTLY LOGGED IN USER */
router.get('/story/:catId', function (req, res) {

    let catId = req.params.catId,
        id = mongoose.Types.ObjectId(catId);

    Story.aggregate([
        {$match: {"category.categoryId": id}},
        {$project: {comments:{$size :"$comments"}, dislikes:{$size :"$dislikes"},likes:{$size :"$likes"}, createdAt:1, postedBy:1, title:1}},
        {$sort:{createdAt: -1}},
        {$limit: 10}
    ], function (err, data) {

        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        Story.populate(data,{
                'path': 'postedBy',
                'select': 'name photoUrl'
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

/*** END POINT FOR GETTING POST OF BY CATEGORIES BY CURRENTLY LOGGED IN USER */
router.get('/trending/story', function (req, res) {

    Story.aggregate([
        {$project: {comments:{$size :"$comments"}, title:1, createdAt:1,postedBy:1}},
        {$sort: {comments: -1}},
        {$limit: 5}

    ], function (err, data) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        Story.populate(data,{
                'path': 'postedBy',
                'select': 'name email'
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

//QUESTIONS
/*** END POINT FOR GETTING QUESTION OF BY CATEGORIES BY CURRENTLY LOGGED IN USER */
router.get('/question/:catId', function (req, res) {

    let catId = req.params.catId,
        id = mongoose.Types.ObjectId(catId);

    Question.aggregate([
        {$match: {"category.categoryId": id}},
        {$project: {answers:{$size :"$answers"}, views:{$size :"$views"}, createdAt:1, postedBy:1, question:1}},
        {$sort:{createdAt: -1}},
        {$limit: 10}

    ], function (err, data) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        Question.populate(data,{
                'path': 'postedBy',
                'select': 'name photoUrl title'
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

/*** END POINT FOR GETTING POST OF BY CATEGORIES BY CURRENTLY LOGGED IN USER */
router.get('/trending/question', function (req, res) {
    Question.aggregate([
        {$project: {answers:{$size :"$answers"}, question:1, createdAt:1,postedBy:1}},
        {$sort: {answers: -1}},
        {$limit: 5}

    ], function (err, data) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        Story.populate(data,{
                'path': 'postedBy ',
                'select': 'name email'
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

// //VIEWS,
// /*** END POINT FOR GETTING THE VIEWS ON A STORY OF A USER BY LOGGED IN USERS*/
// router.get('/views/:storyId', function (req, res) {
//
//     let storyId = req.params.storyId;
//     Story.findOne({_id: storyId})
//         .populate({
//             path: 'views.userId',
//             select: 'name photoUrl public_id'
//         })
//         .sort({date: -1})
//         .exec(function (err, post) {
//                 if (err) {
//                     return res.serverError("Something unexpected happened");
//                 }
//                 if (!post){
//                     return res.success('no post found with the id provided')
//                 }
//
//                 res.success({dislikes: post.views});
//             }
//         );
// });
//
// /*** END POINT FOR GETTING THE VIEWS ON A QUESTION OF A USER BY LOGGED IN USERS*/
// router.get('/views/:questionId', function (req, res) {
//
//     let questionId = req.params.questionId;
//     Question.findOne({_id: questionId})
//         .populate({
//             path: 'dislikes.userId',
//             select: 'name photoUrl public_id'
//         })
//         .sort({date: -1})
//         .exec(function (err, post) {
//
//                 if (err) {
//                     return res.serverError("Something unexpected happened");
//                 }
//                 if (!post){
//                     return res.success('no post found with the id provided')
//                 }
//                 let info = {
//                     question: post.question,
//                     title: post.title,
//                     dislikes: post.dislikes,
//                 };
//                 res.success(info);
//             }
//         );
// });

//LIKES,
/*** END POINT FOR GETTING THE DISLIKES ON A STORIES ANSWER OF A USER BY LOGGED IN USERS*/
router.get('/story/likes/:storyId', function (req, res) {

    let storyId = req.params.storyId;
    Story.findOne({_id: storyId})
        .populate({
            path: 'likes.userId',
            select: 'name photoUrl public_id'
        })
        .sort({createdAt: -1})
        .limit(10)
        .exec(function (err, post) {

            if (err) {
                return res.serverError("Something unexpected happened");
            }
            if (!post){
                return res.success('no post found with the id provided')
            }

            res.success({likes: post.likes, title: post.title});
        }
    );
});

/*** END POINT FOR GETTING THE DISLIKES ON A QUESTION OF A USER BY LOGGED IN USERS*/
router.get('question/likes/:questionId', function (req, res) {

    let questionId = req.params.questionId;
    Question.findOne({_id: questionId})
        .populate({
            path: 'likes.userId',
            select: 'name photoUrl public_id'
        })
        .sort({createdAt: -1})
        .limit(10)
        .exec(function (err, post) {

            if (err) {
                return res.serverError("Something unexpected happened");
            }
            if (!post){
                return res.success('no post found with the id provided')
            }
            let info = {
                dislikes: post.dislikes,
                title: post.title
            };

            res.success(info);
        }
    );
});

/*** END POINT FOR GETTING THE DISLIKES ON A QUESTION OF A USER BY LOGGED IN USERS*/
router.get('broadcast/likes/:broadcastId', function (req, res) {

    let broadcastId = req.params.broadcastId;
    Admin_post.findOne({_id: broadcastId})
        .populate({
            path: 'likes.userId',
            select: 'name photoUrl public_id'
        })
        .sort({createdAt: -1})
        .limit(10)
        .exec(function (err, post) {

            if (err) {
                return res.serverError("Something unexpected happened");
            }
            if (!post){
                return res.success('no post found with the id provided')
            }
            let info = {
                dislikes: post.dislikes,
            };

            res.success(info);
        }
    );
});

//DISLIKES
/*** END POINT FOR GETTING THE DISLIKES ON A STORY OF A USER BY LOGGED IN USERS*/
router.get('dislike/:storyId', function (req, res) {

    let storyId = req.params.storyId;
    Story.findOne({_id: storyId})
        .populate({
            path: 'dislikes.userId',
            select: 'name photoUrl public_id'
        })
        .sort({createdAt: -1})
        .exec(function (err, post) {

                if (err) {
                    return res.serverError("Something unexpected happened");
                }
                if (!post){
                    return res.success('no post found with the id provided')
                }
                let info = {
                    title: post.title,
                    dislikes: post.dislikes,
                };
                res.success(info);
            }
        );
});

/*** END POINT FOR GETTING THE DISLIKES ON A QUESTION OF A USER BY LOGGED IN USERS*/
router.get('dislike/:questionId', function (req, res) {

    let questionId = req.params.questionId;
    Question.findOne({_id: questionId})
        .populate({
            path: 'dislikes.userId',
            select: 'name photoUrl public_id'
        })
        .sort({createdAt: -1})
        .exec(function (err, post) {

                if (err) {
                    return res.serverError("Something unexpected happened");
                }
                if (!post){
                    return res.success('no post found with the id provided')
                }
                let info = {
                    question: post.question,
                    dislikes: post.dislikes,
                };
                res.success(info);
            }
        );
});

/*** END POINT FOR GETTING THE DISLIKES ON A QUESTION OF A USER BY LOGGED IN USERS*/
router.get('broadcast/likes/:broadcastId', function (req, res) {

    let broadcastId = req.params.broadcastId;
    Admin_post.findOne({_id: broadcastId})
        .populate({
            path: 'dislikes.userId',
            select: 'name photoUrl public_id'
        })
        .sort({createdAt: -1})
        .limit(10)
        .exec(function (err, post) {

            if (err) {
                return res.serverError("Something unexpected happened");
            }
            if (!post){
                return res.success('no post found with the id provided')
            }
            let info = {
                dislikes: post.dislikes,
            };

            res.success(info);
        }
    );
});

//BLOG
/*** END POINT FOR GETTING BLOG POST BY USERS */
router.get('/blog', function(req, res) {

    Blog.aggregate([
        {$project: {comments:{$size :"$comments"}, title:1, createdAt:1, postedBy:1,
            message:1, mediaUrl: 1}},
        {$sort: {date: -1}},
        {$limit: 10}
    ], function (err, data) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }
        User.populate(data, {
                'path': 'postedBy',
                'select': 'name photoUrl email bio'
            },
            function (err, data) {
                if (err) {
                    console.log(err);
                    return res.badRequest("Something unexpected happened");
                }

                res.success(data);
            }
        );
    })
});

/*** END POINT FOR GETTING BLOG POST BY THE ID BY USERS*/
router.get('/blog/:blogId', function (req, res) {
    let blogId = req.params.blogId,
        id = mongoose.Types.ObjectId(blogId);

    Blog.aggregate([
        {$match: {"_id" : id}},
        {$project: {comments: {
            $map: {
                input: '$comments',
                as: "element",
                in: {
                    commentId: "$$element._id",
                    comment: "$$element.comment",
                    commentedOn: '$$element.createdAt',
                    commentedBy: '$$element.commentedBy'
                }
            }
        }, title:1, message:1, postedBy:1, createdAt:1}},
    ], function (err, data) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        Blog.populate(data, {
                'path': 'comments.commentedBy',
                'select': 'name email photoUrl public_id'
            },
            function (err, post) {
                if (err) {
                    console.log(err);
                    return res.badRequest("Something unexpected happened");
                }

                res.success(post);
            }
        );
    })
});

//SEARCH
/*** END POINT FOR SEARCHING FOR A USER BY TEXT*/
router.get('/search/user/:search', function (req, res) {

    let search = req.params.search;
    User.aggregate(
        [
            {$match: {$text: {$search: search}}},
            {$project: {photoUrl:1, name:1, score: {$meta: "textScore"}}},
            // {$match: {score: {$gt: 1.0}}},
            {$limit: 5}
        ], function (err, data) {
            if (err) {
                console.log(err);
                return res.badRequest("Something unexpected happened");
            }
            if(!data){
            return res.badRequest("no user found with the query parameter ", search,". please try searching with first, last or both names")
        }

            res.success(data);
        });


    res.success(results)
});

/*** END POINT FOR SEARCHING FOR A QUESTION BY TEXT*/
router.get('/search/question/:search', function (req, res){

    let search = req.params.search;
    Question.aggregate(
    [
        {$match: {$text: {$search: search}}},
        {$project: {question:1, answer:1, score: {$meta: "textScore"}}},
        // {$match: {score: {$gt: 1.0}}},
        {$limit: 5}
    ], function (err, question) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }
        if (!question) {
            console.log(err);
            return res.badRequest("no question found with the query parameter ", search );
        }

        res.success(question);
        }
    )
});

/*** END POINT FOR SEARCHING FOR A STORY BY TEXT*/
router.get('/search/story/:search', function (req, res){

    let search = req.params.search;
    Story.aggregate(
        [
            {$match: {$text: {$search: search}}},
            {$project: {title:1, story:1, score: {$meta: "textScore"}}},
            // {$match: {score: {$gt: 1.0}}},
            {$limit: 5}
        ], function (err, story) {
            if (err) {
                console.log(err);
                return res.badRequest("Something unexpected happened");
            }

            if (!story) {
                console.log(err);
                return res.badRequest("no story found with the query parameter ", search );
            }

            res.success(story);
        }
    );
});

//USER PROFILE

// /*** END POINT FOR GETTING PROFILE ANSWERS OF A USER BY ANOTHER CURRENTLY LOGGED IN USER */
// router.get('/answer/:userId', function (req, res) {
//
//     let id = req.params.userId;
//     // Question.aggregate([
//     //     {$match: {'answers.answeredBy': id}},
//     //     {$unwind: {path: "$category", preserveNullAndEmptyArrays: true}},
//     //     {$project: {answers:{$size :"$answers"}, dislikes:{$size :"$dislikes"}, likes:{$size :"$likes"}, category:1, title:1, postedOn:1,postedBy:1}},
//     //     {$sort:{date: -1}}
//     Question.aggregate([
//         {$match: {"answers.answeredBy" : id}},
//         {$project: {answers: {
//             $map: {
//                 input: '$answers',
//                 as: "element",
//                 in: {
//                     answerId: "$$element._id",
//                     answer: "$$element.answer",
//                     answeredOn: '$$element.createdAt',
//                     answeredBy: '$$element.answeredBy',
//                     likes: { $size: "$$element.likes" },
//                     dislikes: { $size: "$$element.dislikes" }
//                 }
//             }
//         },
//         question:1}},
//         {$sort: {date: -1}},
//     ], function (err, data) {
//         console.log(data);
//         if (err) {
//             console.log(err);
//             return res.badRequest("Something unexpected happened");
//         }
//
//         Question.populate(data,{
//                 'path': 'postedBy likes.userId dislikes.userId comments.commentedBy',
//                 'select': 'name photoUrl email bio title'
//             },
//             function (err, post) {
//                 if (err) {
//                     console.log(err);
//                     return res.badRequest("Something unexpected happened");
//                 }
//
//                 res.success(post);
//             }
//         );
//     });
// });
//
// /*** END POINT FOR GETTING PROFILE QUESTIONS OF A USER BY ANOTHER CURRENTLY LOGGED IN USER */
// router.get('/question/:userId', function (req, res) {
//
//     let id = req.user.id;
//     Question.aggregate([
//         {$match: {'postedBy': id}},
//         {$unwind: {path: "$category", preserveNullAndEmptyArrays: true}},
//         {$project: {answers:{$size :"$answers"}, dislikes:{$size :"$dislikes"},likes:{$size :"$likes"}, category:1, title:1, postedOn:1,postedBy:1}},
//         {$sort:{date: -1}}
//
//     ], function (err, data) {
//         console.log(data);
//         if (err) {
//             console.log(err);
//             return res.badRequest("Something unexpected happened");
//         }
//         if (!data) {
//             return res.success([]);
//         }
//
//         Question.populate(data,{
//                 'path': 'postedBy likes.userId dislikes.userId comments.commentedBy',
//                 'select': 'name photoUrl email bio title'
//             },
//
//             function (err, post) {
//
//                 if (err) {
//                     console.log(err);
//                     return res.badRequest("Something unexpected happened");
//                 }
//
//                 res.success(post);
//             }
//         );
//     });
// });
//
// /*** END POINT FOR GETTING PROFILE STORY OF A USER BY ANOTHER CURRENTLY LOGGED IN USER */
// router.get('/story/:userId', function (req, res) {
//
//     let id = req.user.id;
//
//     Story.aggregate([
//         {$match: {'postedBy': id}},
//         {$unwind: {path: "$category", preserveNullAndEmptyArrays: true}},
//         {$project: {comments:{$size :"$comments"},dislikes:{$size :"$dislikes"},likes:{$size :"$likes"}, category:1, title:1, postedOn:1,postedBy:1}},
//         {$sort:{date: -1}}
//
//     ], function (err, data) {
//         console.log(data);
//         if (err) {
//             console.log(err);
//             return res.badRequest("Something unexpected happened");
//         }
//
//         Story.populate(data,{
//                 'path': 'postedBy likes.userId dislikes.userId comments.commentedBy',
//                 'select': 'name photoUrl email bio title'
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
// /*** END POINT FOR GETTING FOLLOWERS OF A USER BY ANOTHER CURRENTLY LOGGED IN USER */
// router.get('/follower/:userId', function(req, res){
//
//     let id = req.params.userId;
//     profile(id, function (err, result) {
//
//         if (err){
//             return res.badRequest(err.message);
//         }
//         res.success({followers: result.followers});
//     });
// });
//
// /*** END POINT FOR GETTING FOLLOWING OF A USER BY ANOTHER CURRENTLY LOGGED IN USER */
// router.get('/following/:userId', function(req, res){
//
//     let id = req.params.userId;
//     profile(id, function (err, result) {
//
//         if (err){
//             return res.badRequest(err.message);
//         }
//
//         res.success({following: result.following});
//     });
// });

function profile(id, callback){
    User.findById(id)
        .populate({
            path: 'followers.userId',
            select: 'name photo email bio'
        })
        .populate({
            path: 'following.userId',
            select: 'name photo email bio'
        })
        .sort({date: -1})
        .exec(function (err, user) {

                if (err) {
                    return callback("Something unexpected happened");
                }
                if (!user) {
                    return callback("could not find user with id: " + id);
                }
                let info = {
                    followers: user.followers,
                    following: user.following
                };

                return callback(null, info);
            }
        );
}

function ranking(id, callback){
    User.findById(id, function (err, user) {
        if (err) {
            console.log(err)
            return callback("Something unexpected happened");
        }
        if (!user) {
            return callback("could not find user with id: " + id);
        }
        if (user.rating >= 50000000) {
            user.ranking = 'ultimate';
            user.save(function (err, result) {
                if (err) {
                    console.log(err);
                    return callback("Something unexpected happened");
                }
                console.log(result);
                return callback(null, result)
            })
        }
        else if (user.rating <50000000 && user.rating >=5000000) {
            user.ranking = 'veteran';
            user.save(function (err, result) {
                if (err) {
                    console.log(err);
                    return callback("Something unexpected happened");
                }
                console.log(result);
                return callback(null, result)
            })
        }
        else if (user.rating < 5000000 && user.rating >=500000) {
            user.ranking = 'expert';
            user.save(function (err, result) {
                if (err) {
                    console.log(err);
                    return callback("Something unexpected happened");
                }
                console.log(result);
                return callback(null, result)
            })
        }
        else if (user.rating < 500000 && user.rating >=100000) {
            user.ranking = 'professional';
            user.save(function (err, result) {
                if (err) {
                    console.log(err);
                    return callback("Something unexpected happened");
                }
                console.log(result);
                return callback(null, result)
            })
        }
        else if (user.rating < 100000 && user.rating >=10000) {
            user.ranking = 'proficient';
            user.save(function (err, result) {
                if (err) {
                    console.log(err);
                    return callback("Something unexpected happened");
                }
                console.log(result);
                return callback(null, result)
            })
        }
        else if (user.rating < 10000 && user.rating >= 1000) {
            user.ranking = 'amateur';
            user.save(function (err, result) {
                if (err) {
                    console.log(err);
                    return callback("Something unexpected happened");
                }
                console.log(result);
                return callback(null, result)

            })
        }
        else {
            user.ranking = 'beginner';
            user.save(function (err, result) {
                if (err) {
                    console.log(err);
                    return badRequest("Something unexpected happened");
                }
                console.log(result);
                return callback(null, result)
            })
        }
    });
}

module.exports = router;