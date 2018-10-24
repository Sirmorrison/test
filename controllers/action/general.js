const express = require('express');
const router = express.Router();
let mongoose = require("mongoose");
const unirest = require("unirest"); //unirest is an http request library so any other preferred library can be used.

const Transaction = require('../../models/transactions');
let validator = require('../../utils/validator'),
    Admin = require('../../models/admin_user');

const config = require('../../config');
const protector = require('../../middlewares/protector');
let Blog = require('../../models/blog');
let Package = require('../../models/packages'),
    Story = require('../../models/story'),
    Category = require('../../models/categories'),
    Broadcast = require('../../models/broadcast'),
    Question = require('../../models/question'),
    User = require('../../models/user');


//PAYMENT PACKAGES

//ADMIN BROADCAST MESSAGE
// /*** END POINT FOR GETTING BROADCAST BY CATEGORIES BY CURRENTLY LOGGED IN USER */
// router.get('/broadcast/:catId', function (req, res) {
//
//     let catId = req.params.catId,
//         id = mongoose.Types.ObjectId(catId);
//
//     Broadcast.aggregate([
//         {$match: {"category.categoryId": id}},
//         {
//             $project: {
//                 message: 1,
//                 views: 1,
//                 comments: {$size: "$comments"},
//                 dislikes: {$size: "$dislikes"},
//                 likes: {$size: "$likes"},
//                 createdAt: 1,
//                 postedBy: 1
//             }
//         },
//         {$sort: {createdAt: -1}},
//         {$limit: 30}
//     ], function (err, data) {
//
//         if (err) {
//             console.log(err);
//             return res.badRequest("Something unexpected happened");
//         }
//
//         res.success(data);
//     });
// });

//STORIES

// /*** END POINT FOR GETTING STORY OF BY CATEGORIES BY CURRENTLY LOGGED IN USER */
// router.get('/story/:catId', function (req, res) {
//
//     let catId = req.params.catId,
//         id = mongoose.Types.ObjectId(catId);
//
//     Story.aggregate([
//         {$match: {"category.categoryId": id}},
//         {
//             $project: {
//                 comments: {$size: "$comments"},
//                 dislikes: {$size: "$dislikes"},
//                 likes: {$size: "$likes"},
//                 views: 1,
//                 "category.categoryId": 1,
//                 createdAt: 1,
//                 postedBy: 1,
//                 title: 1
//             }
//         },
//         {$sort: {createdAt: -1}},
//         {$limit: 10}
//     ], function (err, data) {
//
//         if (err) {
//             console.log(err);
//             return res.badRequest("Something unexpected happened");
//         }
//
//         Story.populate(data, {
//                 'path': 'postedBy category.categoryId',
//                 'select': 'name photoUrl ranking title'
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
// /*** END POINT FOR GETTING POST OF BY CATEGORIES BY CURRENTLY LOGGED IN USER */
// router.get('/story', function (req, res) {
//
//     let token = req.body.token || req.query.token || req.headers.token;
//     if (token) {
//         protector.protect(req, res, function () {
//             let userId = req.user.id;
//             getUserCategory(userId, function (err, detail) {
//                 if (err) {
//                     console.log(err);
//                     return res.badRequest(err);
//                 }
//                 let list = detail[0].categoryTags,
//                     data = list.map(function (item) {
//                         return item['categoryId']
//                     });
//
//                 let category = [];
//                 for (let i = 0; i < data.length; i++) {
//                     let id = mongoose.Types.ObjectId(data[i]);
//                     category.push(id);
//                 }
//                 Question.aggregate([
//                     {$match: {"category.categoryId": {$in: category}}},
//                     {
//                         $project: {
//                             answers: {$size: '$answers'},
//                             comments: {$size: '$comments'},
//                             question: 1,
//                             postedBy: 1,
//                             'category.categoryId':1,
//                             views: 1,
//                             createdAt: 1
//                         },
//                     },
//                     {$sort: {answers: -1}},
//                     {$limit: 50}
//
//                 ], function (err, data) {
//                     if (err) {
//                         console.log(err);
//                         return res.badRequest("Something unexpected happened");
//                     }
//                     Question.populate(data, {
//                             'path': 'postedBy category.categoryId',
//                             'select': 'name photoUrl ranking title'
//                         },
//                         function (err, post) {
//
//                             if (err) {
//                                 console.log(err);
//                                 return res.badRequest("Something unexpected happened");
//                             }
//
//                             res.success(post);
//                         }
//                     );
//                 })
//             })
//         })
//     }else{
//         Question.aggregate([
//             {
//                 $project: {
//                     answers: {$size: '$answers'},
//                     comments: {$size: '$comments'},
//                     question: 1,
//                     postedBy: 1,
//                     'category.categoryId':1,
//                     views: 1,
//                     createdAt: 1
//                 },
//             },
//             {$sort: {views: -1, comments: -1, answers: -1}},
//             {$limit: 50}
//         ], function (err, data) {
//
//             if (err) {
//                 console.log(err);
//                 return res.badRequest("Something unexpected happened");
//             }
//
//             Question.populate(data, {
//                     'path': 'postedBy category.categoryId',
//                     'select': 'name photoUrl ranking title'
//                 },
//                 function (err, post) {
//
//                     if (err) {
//                         console.log(err);
//                         return res.badRequest("Something unexpected happened");
//                     }
//
//                     res.success(post);
//                 }
//             );
//         });
//     }
// });
//
// /*** END POINT FOR GETTING QUESTION OF BY CATEGORIES BY CURRENTLY LOGGED IN USER */
// router.get('/questions/category', function (req, res) {
//
//     let catId = req.body.categoryId,
//         v = validator.isCategory(res, catId);
//     if(!v) return;
//
//     let category = [];
//     for (let i = 0; i < data.length; i++) {
//         let id = mongoose.Types.ObjectId(data[i]);
//         category.push(id);
//     }
//
//     Question.aggregate([
//         {$match: {"category.categoryId": {$in: category}}},
//         {
//             $project: {
//                 answers: {$size: "$answers"},
//                 comments: {$size: '$comments'},
//                 views: 1,
//                 "category.categoryId": 1,
//                 createdAt: 1,
//                 postedBy: 1,
//                 question: 1
//             }
//         },
//         {$sort: {createdAt: -1}},
//         {$limit: 50}
//
//     ], function (err, data) {
//         if (err) {
//             console.log(err);
//             return res.badRequest("Something unexpected happened");
//         }
//
//         Question.populate(data, {
//                 'path': 'postedBy category.categoryId',
//                 'select': 'name photoUrl ranking title'
//             },
//
//             function (err, post) {
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
// /*** END POINT FOR GETTING A STORY OF A USER BY LOGGED IN USERS /GUEST USERS */
// router.get('/story/user/:postId'/*, allow('message')*/, function (req, res) {
//     let storyId = req.params.postId,
//         id = mongoose.Types.ObjectId(storyId);
//
//     Story.update(
//         {"_id": storyId},
//         {$inc: {views: 1}}, function (err) {
//             if (err) {
//                 console.log(err)
//             }
//
//             Story.aggregate([
//                 {$match: {"_id": id}},
//                 {
//                     $project: {
//                         // comments: {
//                         //     $map: {
//                         //         input: '$comments',
//                         //         as: "element",
//                         //         in: {
//                         //             commentId: "$$element._id",
//                         //             comment: "$$element.comment",
//                         //             commentedOn: '$$element.createdAt',
//                         //             commentedBy: '$$element.commentedBy',
//                         //             likes: {$size: "$$element.likes"},
//                         //             dislikes: {$size: "$$element.dislikes"}
//                         //         }
//                         //     }
//                         // },
//                         story: 1,
//                         title:1,
//                         "category.categoryId": 1,
//                         postedBy: 1,
//                         views: 1,
//                         dislikes: {$size: "$dislikes"},
//                         likes: {$size: "$likes"},
//                         comments: {$size: '$comments'}
//                     }
//                 },
//             ], function (err, data) {
//
//                 if (err) {
//                     console.log(err);
//                     return res.badRequest("Something unexpected happened");
//                 }
//
//                 Story.populate(data, {
//                         'path': 'postedBy category.categoryId',
//                         'select': 'name photoUrl ranking title'
//                     },
//
//                     function (err, post) {
//
//                         if (err) {
//                             console.log(err);
//                             return res.badRequest("Something unexpected happened");
//                         }
//
//                         res.success(post);
//                     }
//                 );
//             })
//         });
// });
//
// /*** END POINT FOR GETTING A STORY OF A USER BY LOGGED IN USERS /GUEST USERS */
// router.get('/story/ask_oleum/:postId'/*, allow('message')*/, function (req, res) {
//     let storyId = req.params.postId,
//         id = mongoose.Types.ObjectId(storyId);
//
//     Story.update(
//         {"_id": storyId},
//         {$inc: {views: 1}}, function (err) {
//             if (err) {
//                 console.log(err)
//             }
//
//             Story.aggregate([
//                 {$match: {"_id": id}},
//                 {
//                     $project: {
//                         // comments: {
//                         //     $map: {
//                         //         input: '$comments',
//                         //         as: "element",
//                         //         in: {
//                         //             commentId: "$$element._id",
//                         //             comment: "$$element.comment",
//                         //             commentedOn: '$$element.createdAt',
//                         //             commentedBy: '$$element.commentedBy',
//                         //             likes: {$size: "$$element.likes"},
//                         //             dislikes: {$size: "$$element.dislikes"}
//                         //         }
//                         //     }
//                         // },
//                         story: 1,
//                         title:1,
//                         postedBy: 1,
//                         views: 1,
//                         "category.categoryId": 1,
//                         dislikes: {$size: "$dislikes"},
//                         likes: {$size: "$likes"},
//                         comments: {$size: '$comments'}
//                     }
//                 },
//             ], function (err, data) {
//
//                 if (err) {
//                     console.log(err);
//                     return res.badRequest("Something unexpected happened");
//                 }
//
//                 Story.populate(data, {
//                         'path': 'postedBy category.categoryId',
//                         'select': 'name photoUrl title'
//                     },
//
//                     function (err, post) {
//
//                         if (err) {
//                             console.log(err);
//                             return res.badRequest("Something unexpected happened");
//                         }
//
//                         res.success(post);
//                     }
//                 );
//             })
//         });
// });
//
// /*** END POINT FOR GETTING A COMMENT TO A QUESTION OF A USER BY LOGGED IN USERS*/
// router.get('/comments/:storyId', function (req, res) {
//
//     let storyId = req.params.storyId;
//     Story.findOne({_id: storyId})
//         .populate({
//             path: 'postedBy',
//             select: 'name photoUrl'
//         })
//         .exec(function (err, post) {
//             if (err) {
//                 return res.serverError("Something unexpected happened");
//             }
//             if (!post){
//                 return res.success('no post found with the id provided')
//             }
//
//             res.success(post.comments);
//         }
//     );
// });
//
// /*** END POINT FOR GETTING POST OF BY CATEGORIES BY CURRENTLY LOGGED IN USER */
// router.get('/trending/story', function (req, res) {
//
//     Story.aggregate([
//         {$project: {comments:{$size :"$comments"}, title:1, createdAt:1,postedBy:1}},
//         {$sort: {comments: -1}},
//         {$limit: 5}
//
//     ], function (err, data) {
//         if (err) {
//             console.log(err);
//             return res.badRequest("Something unexpected happened");
//         }
//
//         Story.populate(data,{
//                 'path': 'postedBy',
//                 'select': 'name email'
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

//QUESTIONS(moved to question and answer)

// /*** END POINT FOR GETTING THE QUESTION AND ANSWERS INFORMATION USER BY LOGGED IN USERS*/
// router.get('/all', allow('questions'), function (req, res) {
//
//     Question.aggregate([
//         {
//             $project: {
//                 answers: {$size: '$answers'},
//                 comments: {$size: '$comments'},
//                 question: 1,
//                 postedBy: 1,
//                 'category.categoryId':1,
//                 views: 1,
//                 createdAt: 1
//             },
//         },
//         {$sort: {createdAt: -1}},
//         {$limit: 50}
//     ], function (err, data) {
//
//         if (err) {
//             console.log(err);
//             return res.badRequest("Something unexpected happened");
//         }
//
//         Question.populate(data, {
//                 'path': 'postedBy category.categoryId',
//                 'select': 'name photoUrl ranking title'
//             },
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
// /*** END POINT FOR GETTING POST OF BY CATEGORIES BY CURRENTLY LOGGED IN USER */
// router.get('/questions', function (req, res) {
//
//     let token = req.body.token || req.query.token || req.headers.token;
//     if (token) {
//         protector.protect(req, res, function () {
//             let userId = req.user.id;
//             getUserCategory(userId, function (err, detail) {
//                 if (err) {
//                     console.log(err);
//                     return res.badRequest(err);
//                 }
//                 let list = detail[0].categoryTags,
//                     data = list.map(function (item) {
//                         return item['categoryId']
//                     });
//
//                 let category = [];
//                 for (let i = 0; i < data.length; i++) {
//                     let id = mongoose.Types.ObjectId(data[i]);
//                     category.push(id);
//                 }
//                 Question.aggregate([
//                     {$match: {"category.categoryId": {$in: category}}},
//                     {
//                         $project: {
//                             answers: {$size: '$answers'},
//                             comments: {$size: '$comments'},
//                             question: 1,
//                             postedBy: 1,
//                             'category.categoryId':1,
//                             views: 1,
//                             createdAt: 1
//                         },
//                     },
//                     {$sort: {answers: -1}},
//                     {$limit: 50}
//
//                 ], function (err, data) {
//                     if (err) {
//                         console.log(err);
//                         return res.badRequest("Something unexpected happened");
//                     }
//                     Question.populate(data, {
//                             'path': 'postedBy category.categoryId',
//                             'select': 'name photoUrl ranking title'
//                         },
//                         function (err, post) {
//
//                             if (err) {
//                                 console.log(err);
//                                 return res.badRequest("Something unexpected happened");
//                             }
//
//                             res.success(post);
//                         }
//                     );
//                 })
//             })
//         })
//     }else{
//         Question.aggregate([
//             {
//                 $project: {
//                     answers: {$size: '$answers'},
//                     comments: {$size: '$comments'},
//                     question: 1,
//                     postedBy: 1,
//                     'category.categoryId':1,
//                     views: 1,
//                     createdAt: 1
//                 },
//             },
//             {$sort: {views: -1, comments: -1, answers: -1}},
//             {$limit: 50}
//         ], function (err, data) {
//
//             if (err) {
//                 console.log(err);
//                 return res.badRequest("Something unexpected happened");
//             }
//
//             Question.populate(data, {
//                     'path': 'postedBy category.categoryId',
//                     'select': 'name photoUrl ranking title'
//                 },
//                 function (err, post) {
//
//                     if (err) {
//                         console.log(err);
//                         return res.badRequest("Something unexpected happened");
//                     }
//
//                     res.success(post);
//                 }
//             );
//         });
//     }
// });
//
// /*** END POINT FOR GETTING QUESTION OF BY CATEGORIES BY CURRENTLY LOGGED IN USER */
// router.get('/questions/category', function (req, res) {
//
//     let catId = req.body.categoryId,
//         v = validator.isCategory(res, catId);
//     if(!v) return;
//
//     let category = [];
//     for (let i = 0; i < data.length; i++) {
//         let id = mongoose.Types.ObjectId(data[i]);
//         category.push(id);
//     }
//
//     Question.aggregate([
//         {$match: {"category.categoryId": {$in: category}}},
//         {
//             $project: {
//                 answers: {$size: "$answers"},
//                 comments: {$size: '$comments'},
//                 views: 1,
//                 "category.categoryId": 1,
//                 createdAt: 1,
//                 postedBy: 1,
//                 question: 1
//             }
//         },
//         {$sort: {createdAt: -1}},
//         {$limit: 50}
//
//     ], function (err, data) {
//         if (err) {
//             console.log(err);
//             return res.badRequest("Something unexpected happened");
//         }
//
//         Question.populate(data, {
//                 'path': 'postedBy category.categoryId',
//                 'select': 'name photoUrl ranking title'
//             },
//
//             function (err, post) {
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
// /*** END POINT FOR GETTING THE QUESTION AND ANSWERS INFORMATION USER BY LOGGED IN USERS*/
// router.get('/questions/:questionId', function (req, res) {
//     let questionId = req.params.questionId,
//         id = mongoose.Types.ObjectId(questionId);
//
//     Question.update(
//         {"_id": questionId},
//         {$inc: {views: 1}}, function (err) {
//             if (err) {
//                 console.log(err);
//                 return callback("Something unexpected happened");
//             }
//
//             Question.aggregate([
//                 {$match: {"_id": id}},
//                 {
//                     $project: {
//                         answers: {
//                             $map: {
//                                 input: '$answers',
//                                 as: "element",
//                                 in: {
//                                     answerId: "$$element._id",
//                                     answeredOn: '$$element.createdAt',
//                                     answeredBy: '$$element.answeredBy',
//                                     views: "$$element.views",
//                                     view_cost: "$$element.view_cost",
//                                     upVotes: {$size: "$$element.likes"},
//                                     downVotes: {$size: "$$element.dislikes"}
//                                 }
//                             }
//                         },
//                         comments: {
//                             $map: {
//                                 input: '$comments',
//                                 as: "element",
//                                 in: {
//                                     commentId: "$$element._id",
//                                     commentedOn: '$$element.createdAt',
//                                     comment: "$$element.comment",
//                                     commentedBy: '$$element.commentedBy',
//                                 }
//                             }
//                         },
//                         views: 1,
//                         question: 1,
//                         "category.categoryId": 1,
//                         postedBy: 1,
//                         total_answers: {$size: '$answers'},
//                         total_comments: {$size: '$comments'}
//                     }
//                 },
//             ], function (err, data) {
//                 if (err) {
//                     console.log(err);
//                     return res.badRequest("Something unexpected happened");
//                 }
//
//                 Question.populate(data, {
//                     'path': 'postedBy answers.answeredBy comments.commentedBy category.categoryId',
//                     'select': 'name photoUrl ranking title'
//                 },
//
//                 function (err, post) {
//
//                     if (err) {
//                         console.log(err);
//                         return res.badRequest("Something unexpected happened");
//                     }
//
//                     res.success(post);
//                 }
//             );
//         });
//     });
// });
//
// /*** END POINT FOR GETTING AN ANSWERS TO A QUESTION OF A USER BY LOGGED IN USERS*/
// router.get('/questions/:questionId/answers/:postId', allow('message'), function (req, res) {
//     let questionId = req.params.questionId,
//         answerId = req.params.postId;
//     let id = mongoose.Types.ObjectId(answerId);
//
//     Question.update({
//             "_id": questionId,
//             'answers._id': id
//         },
//         {$inc: {'answers.$.views': 1}}, function (err) {
//             if (err) {
//                 console.log(err);
//             }
//
//             Question.aggregate([
//                 {$match: {"answers._id": id}},
//                 {
//                     $project: {
//                         answers: {
//                             $map: {
//                                 input: '$answers',
//                                 as: "element",
//                                 in: {
//                                     answerId: "$$element._id",
//                                     answer: "$$element.answer",
//                                     answeredOn: '$$element.createdAt',
//                                     answeredBy: '$$element.answeredBy',
//                                     views: "$$element.views",
//                                     upVotes: {$size: "$$element.likes"},
//                                     rating: {$avg: "$$element.rating"},
//                                     downVotes: {$size: "$$element.dislikes"}
//                                 }
//                             }
//                         }, question: 1, views: 1, postedBy: 1
//                     }
//                 }], function (err, data) {
//
//                 if (err) {
//                     return res.serverError("Something unexpected happened");
//                 }
//                 Question.populate(data, {
//                     'path': 'postedBy answers.answeredBy',
//                     'select': 'name photoUrl'
//                 },
//                 function (err, data) {
//
//                     if (err) {
//                         console.log(err);
//                         return res.badRequest("Something unexpected happened");
//                     }
//
//                     res.success(data);
//                 }
//             );
//         })
//     })
// });

// follow
/*** END POINT FOR GETTING FOLLOWERS OF A CURRENTLY LOGGED IN USER */
router.get('/user/follower', function(req, res){

    let id = req.user.id;
    profile(id, function (err, result) {

        if (err){
            return res.badRequest(err.message);
        }
        res.success({followers: result.followers});
    });
});

/*** END POINT FOR GETTING FOLLOWING OF A CURRENTLY LOGGED IN USER */
router.get('/user/following', function(req, res){
    let id = req.user.id;

    profile(id, function (err, result) {
        if (err){
            return res.badRequest(err.message);
        }
        res.success({following: result.following});
    });
});

//LIKES
/*** END POINT FOR GETTING THE DISLIKES ON A STORIES ANSWER OF A USER BY LOGGED IN USERS*/
router.get('/story/likes/:storyId', function (req, res) {

    let storyId = req.params.storyId;
    Story.findOne({_id: storyId})
        .populate({
            path: 'likes.userId',
            select: 'name public_id ranking'
        })
        .sort({createdAt: -1})
        .limit(30)
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

// /*** END POINT FOR GETTING THE DISLIKES ON A QUESTION OF A USER BY LOGGED IN USERS*/
// router.get('question/likes/:questionId', function (req, res) {
//
//     let questionId = req.params.questionId;
//     Question.findOne({_id: questionId})
//         .populate({
//             path: 'likes.userId',
//             select: 'name photoUrl public_id'
//         })
//         .sort({createdAt: -1})
//         .limit(10)
//         .exec(function (err, post) {
//
//             if (err) {
//                 return res.serverError("Something unexpected happened");
//             }
//             if (!post){
//                 return res.success('no post found with the id provided')
//             }
//             let info = {
//                 dislikes: post.dislikes,
//                 title: post.title
//             };
//
//             res.success(info);
//         }
//     );
// });



/*** END POINT FOR GETTING THE DISLIKES ON A STORIES ANSWER OF A USER BY LOGGED IN USERS*/
router.get('/story/likes/:storyId/:commentId', function (req, res) {

    let storyId = req.params.storyId,
        commentId = req.params.commentId;

    Story.findOne({_id: storyId})
        .populate({
            path: 'comments.likes.userId',
            select: 'name photoUrl ranking'
        })
        .sort({date: -1})
        .exec(function (err, post) {
            if (err) {
                return res.serverError("Something unexpected happened");
            }
            if (!post){
                return res.success('no post found with the id provided')
            }

            let data = {
                likes: post.comments.id(commentId).likes,
                title: post.title,
                comments: post.comments.id(commentId).comment
            };

            res.success(data);
        }
    );
});

/*** END POINT FOR GETTING THE DISLIKES ON A QUESTIONS ANSWER OF A USER BY LOGGED IN USERS*/
router.get('/question/likes/:questionId/:answerId', function (req, res) {

    let questionId = req.params.questionId,
        answerId = req.params.answerId;

    Question.findOne({_id: questionId})
        .populate({
            path: 'answers.likes.userId',
            select: 'name public_id ranking'
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

            res.success({likes: post.answers.id(answerId).likes});
        }
    );
});

/*** END POINT FOR GETTING THE DISLIKES ON A QUESTION OF A USER BY LOGGED IN USERS*/
router.get('broadcast/likes/:broadcastId', function (req, res) {

    let broadcastId = req.params.broadcastId;
    Admin_post.findOne({_id: broadcastId})
        .populate({
            path: 'likes.userId',
            select: 'name photoUrl ranking'
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
router.get('/story/dislike/:storyId', function (req, res) {

    let storyId = req.params.storyId;
    Story.findOne({_id: storyId})
        .populate({
            path: 'dislikes.userId',
            select: 'name photoUrl ranking'
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

// /*** END POINT FOR GETTING THE DISLIKES ON A QUESTION OF A USER BY LOGGED IN USERS*/
// router.get('dislike/:questionId', function (req, res) {
//
//     let questionId = req.params.questionId;
//     Question.findOne({_id: questionId})
//         .populate({
//             path: 'dislikes.userId',
//             select: 'name photoUrl public_id'
//         })
//         .sort({createdAt: -1})
//         .exec(function (err, post) {
//
//             if (err) {
//                 return res.serverError("Something unexpected happened");
//             }
//             if (!post){
//                 return res.success('no post found with the id provided')
//             }
//             let info = {
//                 question: post.question,
//                 dislikes: post.dislikes,
//             };
//             res.success(info);
//         }
//     );
// });

/*** END POINT FOR GETTING THE DISLIKES ON A STORIES ANSWER OF A USER BY LOGGED IN USERS*/
router.get('/story/dislike/:storyId/:commentId', function (req, res) {

    let storyId = req.params.storyId,
        commentId = req.params.commentId;

    Story.findOne({_id: storyId})
        .populate({
            path: 'comments.dislikes.userId',
            select: 'name photoUrl ranking'
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

                res.success(post.comments.id(commentId).dislikes);
            }
        );
});

/*** END POINT FOR GETTING THE DISLIKES ON A QUESTIONS ANSWER OF A USER BY LOGGED IN USERS*/
router.get('/question/dislike/:questionId/:answerId', function (req, res) {

    let questionId = req.params.questionId,
        answerId = req.params.answerId;

    Question.findOne({_id: questionId})
        .populate({
            path: 'answers.dislikes.userId',
            select: 'name photoUrl ranking'
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

                res.success(post.answers.id(answerId).dislikes);
            }
        );
});

/*** END POINT FOR GETTING THE DISLIKES ON A QUESTION OF A USER BY LOGGED IN USERS*/
router.get('broadcast/dislike/:broadcastId', function (req, res) {

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

// /*** END POINT FOR GETTING BLOG POST BY USERS */
// router.get('/blog', function(req, res) {
//
//     Blog.aggregate([
//         {$match:  {"status": "approved"}},
//         {
//             $project: {
//                 comments: {$size: "$comments"}, title: 1, createdAt: 1, postedBy: 1,
//                 message: 1, mediaUrl: 1
//             }
//         },
//         {$sort: {date: -1}},
//         {$limit: 10}
//     ], function (err, data) {
//         if (err) {
//             console.log(err);
//             return res.badRequest("Something unexpected happened");
//         }
//         User.populate(data, {
//                 'path': 'postedBy',
//                 'select': 'name photoUrl email bio'
//             },
//             function (err, data) {
//                 if (err) {
//                     console.log(err);
//                     return res.badRequest("Something unexpected happened");
//                 }
//
//                 res.success(data);
//             }
//         );
//     })
// });
//
// /*** END POINT FOR GETTING BLOG POST BY THE ID BY USERS*/
// router.get('/blog/:blogId', function (req, res) {
//     let blogId = req.params.blogId,
//         id = mongoose.Types.ObjectId(blogId);
//
//     Blog.aggregate([
//         {$match: {"_id": id, status: "approved"}},
//         {
//             $project: {
//                 comments: {
//                     $map: {
//                         input: '$comments',
//                         as: "element",
//                         in: {
//                             commentId: "$$element._id",
//                             comment: "$$element.comment",
//                             commentedOn: '$$element.createdAt',
//                             commentedBy: '$$element.commentedBy'
//                         }
//                     }
//                 },
//                 title: 1,
//                 message: 1,
//                 postedBy: 1,
//                 createdAt: 1
//             }
//         },
//     ], function (err, data) {
//         if (err) {
//             console.log(err);
//             return res.badRequest("Something unexpected happened");
//         }
//
//         Blog.populate(data, {
//                 'path': 'comments.commentedBy',
//                 'select': 'name email photoUrl'
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
//     })
// });

function getPostInfo(postId, userId, callback) {
    Story.findOne({_id: postId}, function (err, data) {
        if (err) {
            console.log('errror at point 1', err);
            return callback("Something unexpected happened");
        }
        if (data && data.postedBy === userId) {
            console.log(' im viewing post because im owner')
            return callback(null, 'successful')
        }
        if (data && data.view_cost.amount <= 0) {
            console.log(' im viewing post because it is free')
            return callback(null, 'successful')
        }
        if (data && data.postedBy !== userId) {
            console.log('from story ', data)

            let details = {
                resp: 'story',
                view_cost: data.view_cost.amount,
                currency: data.view_cost.currency,
                userId: data.postedBy
            };

            return callback(null, details)

        } else {
            Question.findOne({'answers._id': postId}, function (err, question) {

                if (err) {
                    console.log(err);
                    return callback("Something unexpected happened");
                }
                if (!question) {
                    return callback("no question found with answer with that details provided");
                }
                if (question.answers.id(postId).answeredBy === userId) {
                    console.log('im found the person');
                    return callback(null, 'successful');
                }
                if (question.answers.id(postId).view_cost.amount <= 0) {
                    console.log('answer is free');
                    return callback(null, 'successful');
                }

                let details = {
                    resp: 'question',
                    view_cost: question.answers.id(postId).view_cost.amount,
                    currency: question.answers.id(postId).view_cost.currency,
                    postedBy: question.answers.id(postId).answeredBy,
                    questionBy: question.postedBy
                };

                return callback(null, details)
            })
        }
    })
}

function getPackage(plan, callback) {
    Package.findOne({plan: plan}, function (err, pack) {
        if (err) {
            console.log('at story package ', err);
            return callback("Something unexpected happened");
        }
        if (!pack) {
            return callback("no package found");
        }
        console.log(pack);

        return callback(null, pack)
    });
}

function userVerify(userId, callback) {
    User.findOne({_id: userId}, function (err, user) {
        if (err) {
            console.log('errror at point 2', err);
            return callback("Something unexpected happened");
        }
        if (!user) {
            return callback("no user found with this id");
        }

        let data = {
            walletBalance: user.walletBalance,
            package: user.packageType
        };

        return callback(null, data)
    })
}

function getUserCategory(userId, callback) {
    User.aggregate([
        {$match: {'_id': userId}},
        {$project: {'categoryTags.categoryId': 1}}
    ], function (err, data) {
        if (err) {
            console.log(err);
            return callback("Something unexpected happened");
        }
        if (!data) {
            return callback("YOU NEED TO BE A REGISTERED USER TO VIEW GET ACCESS");
        }

        return callback(null, data);
    });
}

function validAmount(postId, userId, callback) {
    getPostInfo(postId, userId, function (err, post) {
        if (err) {
            console.log('errror at point 1', err);
            return callback("Something unexpected happened");
        }
        if (post && post === 'successful') {
            return callback(null, post)
        }
        if (post && post.resp === 'story') {
            console.log('from story ', post);
            let view_cost = post.view_cost.amount,
                currency = post.view_cost.currency,
                userId = post.postedBy;

            userVerify(userId, function (err, user) {
                if (err) {
                    console.log('at story user verify ', err);
                    return callback(err);
                }

                let plan = user.package;
                getPackage(plan, function (err, pack) {
                    if (err) {
                        console.log('at story package ', err);
                        return callback(err);
                    }

                    console.log(pack);
                    let data = {
                        postedBy: userId,
                        view_cost: view_cost,
                        currency: currency,
                        commission: pack.stories.commission
                    };
                    console.log(data)
                    return callback(null, data)
                });
            })
        } else {
console.log(post, 'question');
            let view_cost = question.answers.id(postId).view_cost.amount,
                currency = question.answers.id(postId).view_cost.currency,
                postedBy = question.answers.id(postId).answeredBy,
                questionBy = question.postedBy;

            userVerify(postedBy, function (err, user) {
                if (err) {
                    console.log('at story user verify ', err);
                    return callback(err);
                }

                let plan = user.package;
                getPackage(plan, function (err, pack) {
                    if (err) {
                        console.log('at story package ', err);
                        return callback(err);
                    }

                    console.log(pack);
                    let data = {
                        view_cost: view_cost,
                        currency: currency,
                        postedBy: postedBy,
                        questionBy: questionBy,
                        commission: pack.answers.commission
                    };

                    console.log(data);
                    return callback(null, data)
                });
            });
        }
    })
}

function createTransactionCard(response, userId, postId,postedBy, callback) {
    let data ={
        'deposit.amount' : response.body.data[0].amount,
        'deposit.currency' : response.body.data[0].currency,
        status : response.body.data[0].status,
        receiptId: response.body.data[0].flwref,
        reason : postId,
        depositedBy : userId,
        receivedBy : postedBy
    };

    Transaction.create(data, function (err, info) {
        if (err) {
            console.log(err);
            return callback("Something unexpected happened");
        }

        return callback(null, info)
    })
}

function createTransactionWallet(userId, postId, postedBy, view_cost, callback) {
    console.log(userId)
    User.update(
        {"_id": userId},
        {$inc: {'walletBalance.amount': -view_cost}}, function (err, f) {
            if (err) {
                console.log(err);
                return callback(err)
            }
            console.log(f + ' this is 1');

            let data = {
                'deposit.amount': view_cost,
                'deposit.currency': 'USD',
                status: 'successful',
                reason: postId,
                depositedBy: userId,
                receivedBy: postedBy
            };
            console.log(data)
            Transaction.create(data, function (err, info) {
                if (err) {
                    console.log(err);
                    return callback(err);
                }

                console.log(info)

                return callback(null, info)
            })
        }
    );
}

function toRave(config, txref, callback) {
    let payload = {
        "SECKEY": config.rave,
        "txref": txref,
        "include_payment_entity": 1
    };

    let server_url = "https://ravesandboxapi.flutterwave.com/flwv3-pug/getpaidx/api/xrequery";
    //please make sure to change this to production url when you go live

    unirest.post(server_url)
        .headers({'Content-Type': 'application/json'})
        .send(payload)
        .end(function (response) {
            if (response.error) {
                console.log(response.error);
                return callback(response.error)
            }

            return callback(null, response)
        });
}

function payWithCard(config, txref, postId, userId, callback) {
    if(!txref){
        return callback('no payment receipt ref found')
    }
    toRave(config, txref, function (err, response) {
        if (err) {
            console.log(err);
            return callback(err)
        }

        validAmount(postId, userId, function (err, info) {
            if (err) {
                console.log(err)
                return callback(err);
            }
            if(info && info === 'successful'){
                return callback(null, info)
            }
            let postedBy_comm = info.commission.user,
                admin_comm = info.commission.admin,
                questionBy = info.questionBy,
                view_cost = info.view_cost,
                postedBy = info.postedBy;
            console.log(view_cost);

            //check status is success.
            if (response.body.data[0].status === "successful" && response.body.data[0].chargecode === '00') {
                if (response.body.data[0].amount === view_cost && response.body.data[0].currency === 'USD') {
                    createTransactionCard(response, userId, postId, postedBy, function (errorMessage, userInfo) {
                        if (errorMessage) {
                            res.badRequest(errorMessage);
                        } else {
                            if (postedBy_comm.question && postedBy_comm.answer) {
                                let answercut = ((postedBy_comm.answer / 100) * view_cost);
                                let questioncut = ((postedBy_comm.question / 100) * view_cost);
                                let admincut = ((admin_comm / 100 * view_cost));
                                //credit user that asked the question
                                User.update(
                                    {"_id": questionBy},
                                    {
                                        $inc: {'walletBalance.amount': questioncut}
                                    }, function (err, f) {
                                        if (err) {
                                            console.log(err);
                                            return callback('something happened')
                                        }

                                        console.log(f + '  this is 1');
                                        //credit user that answered the question
                                        User.update(
                                            {"_id": postedBy},
                                            {
                                                $inc: {'walletBalance.amount': answercut}
                                            }, function (err, f) {
                                                if (err) {
                                                    console.log(err);
                                                    return callback('something happened')
                                                }

                                                console.log(f + '  this is 2');
                                                //credit admin wallet with commission
                                                Admin.update(
                                                    {role: 'general'},
                                                    {
                                                        $inc: {'walletBalance.amount': admincut}
                                                    }, function (err, f) {
                                                        if (err) {
                                                            console.log(err);
                                                            return callback('something happened')
                                                        }

                                                        console.log(f + '  this is 3');

                                                        return callback(null, 'successful')
                                                    }
                                                )
                                            }
                                        )
                                    })
                            } else {
                                console.log('did not find post.com and what ever');

                                let usercut = ((postedBy_comm / 100) * view_cost);
                                let admincut = ((admin_comm / 100 * view_cost));
                                User.update(
                                    {"_id": postedBy},
                                    {
                                        $inc: {'walletBalance.amount': usercut}
                                    }, function (err, f) {
                                        if (err) {
                                            console.log(err);
                                            return callback('something happened')
                                        }

                                        console.log(f + '  this is 1');

                                        Admin.update(
                                            {role: 'general'},
                                            {
                                                $inc: {'walletBalance.amount': admincut}
                                            }, function (err, f) {
                                                if (err) {
                                                    console.log(err);
                                                    return callback('something happened')
                                                }

                                                console.log(f + '  this is 2');

                                                return callback(null, 'successful')
                                            }
                                        )
                                    }
                                )
                            }
                        }
                    })
                }else{
                    return callback("amount paid does not match the amount to view the post");
                }
            } else {
                return callback("transaction was not successful due to any of the reasons: currency or amount paid");
            }
        });
    })
}

function payFromWallet( postId, userId, callback) {
    validAmount(postId, userId, function (err, info) {
        if (err) {
            console.log(err)
            return callback(err);
        }
        if(info && info === 'successful'){
            return callback(null, info)
        }
        let postedBy_comm = info.commission.user,
            admin_comm = info.commission.admin,
            questionBy = info.questionBy,
            view_cost = info.view_cost,
            postedBy = info.postedBy;
        console.log(view_cost);

        userVerify(userId, function (err, user) {
            if (err) {
                console.log(err);
                return callback(err);
            }
            if (view_cost > user.walletBalance.amount) {
                return callback('insufficient fund in wallet to perform this action')
            }
            createTransactionWallet(userId, postId, postedBy, view_cost, function (errorMessage, userInfo) {
                if (errorMessage) {
                    return callback(errorMessage);
                }
                console.log(userInfo);

                if (postedBy_comm.question && postedBy_comm.answer) {
                    let answercut = ((postedBy_comm.answer / 100) * view_cost);
                    let questioncut = ((postedBy_comm.question / 100) * view_cost);
                    let admincut = ((admin_comm / 100 * view_cost));
                    //credit user that asked the question
                    User.update(
                        {"_id": questionBy},
                        {
                            $inc: {'walletBalance.amount': questioncut}
                        }, function (err, f) {
                            if (err) {
                                console.log(err);
                                return callback('something happened')
                            }

                            console.log(f + '  this is 1');
                            //credit user that answered the question
                            User.update(
                                {"_id": postedBy},
                                {
                                    $inc: {'walletBalance.amount': answercut}
                                }, function (err, f) {
                                    if (err) {
                                        console.log(err);
                                        return callback('something happened')
                                    }

                                    console.log(f + '  this is 2');
                                    //credit admin wallet with commission
                                    Admin.update(
                                        {role: 'general'},
                                        {
                                            $inc: {'walletBalance.amount': admincut}
                                        }, function (err, f) {
                                            if (err) {
                                                console.log(err);
                                                return callback('something happened')
                                            }

                                            console.log(f + '  this is 3');

                                            return callback(null, 'successful')
                                        }
                                    )
                                }
                            )
                        })
                } else {
                    console.log('did not find post.com and what ever');

                    let usercut = ((postedBy_comm / 100) * view_cost);
                    let admincut = ((admin_comm / 100 * view_cost));
                    User.update(
                        {"_id": postedBy},
                        {
                            $inc: {'walletBalance.amount': usercut}
                        }, function (err, f) {
                            if (err) {
                                console.log(err);
                                return callback('something happened')
                            }

                            console.log(f + '  this is 1');

                            Admin.update(
                                {role: 'general'},
                                {
                                    $inc: {'walletBalance.amount': admincut}
                                }, function (err, f) {
                                    if (err) {
                                        console.log(err);
                                        return callback('something happened')
                                    }

                                    console.log(f + '  this is 2');

                                    return callback(null, 'successful')
                                }
                            )
                        }
                    )
                }
            })
        });
    })
}

function verifyPayment(userId, txref, postId, callback) {
    if(txref){
        toRave(config,txref, function (err, response) {
            if(err){
                console.log(err)
                return callback(err)
            }else {

                let receiptId = response.body.data[0].flwref;
                // let txId = response.body.data[0].txId;

                if (userId) {
                    Transaction.findOne({reason: postId, depositedBy: userId, receiptId: receiptId}, function (err, data) {
                        if (err) {
                            console.log(err)
                            return callback('something unexpected happened try again')
                        }
                        console.log('i didnt found a payment 1')

                        if (!data) {
                            return callback('unsuccessful')
                        }
                        console.log('i found a payment 1')

                        return callback(null, 'successful')
                    })
                }else {
                    Transaction.findOne({reason: postId, receiptId: receiptId}, function (err, data) {
                        if (err) {
                            console.log(err)
                            return callback('something unexpected happened try again')
                        }

                        if (!data) {
                            console.log('i didnt found a payment 2')
                            return callback('unsuccessful')
                        }
                        console.log('i found a payment 2')
                        return callback(null, 'successful')
                    })
                }
            }
        })
    }else {
        console.log('im at verify')
        Transaction.findOne({reason: postId, depositedBy: userId}, function (err, info) {
            if(err){
                console.log(err)
                return callback(err)
            }
            console.log('i didnt found a payment 3')

            if(!info){
                return callback(null, 'unsuccessful')
            }
            console.log('i found a payment 3')

            return callback(null, 'successful')
        })
    }
}

function allow(message) {
    return function (req, res, next) {
        let postId = req.params.postId,
            txref = req.query.reference,
            token = req.body.token || req.query.token || req.headers.token;

        if (token) {
            protector.protect(req, res, function () {
                console.log(req.user.id);
                let userId = req.user.id;
                getPostInfo(postId, userId, function (err, post) {
                    if (err) {
                        console.log('errror at point 1', err);
                        return res.badRequest(err);
                    }
                    console.log(post)
                    if (post && post === 'successful') {
                        return next();
                    }
                    verifyPayment(userId, txref, postId, function (err, resp) {
                        if (err) {
                            console.log(err);
                            return res.badRequest(err)
                        }
                        console.log('this is were im');
                        console.log(resp);

                        if (message === resp) {
                            return next();
                        } else {
                            if (!txref) {
                                payFromWallet(postId, userId, function (err, result) {
                                    if (err) {
                                        console.log(err);
                                        return res.badRequest(err)
                                    }
                                    console.log(result);
                                    if (message !== result) {
                                        return res.notAllowed('your transaction was not successful please try again ')
                                    }

                                    return next();
                                })
                            } else {
                                console.log('reference was provided');
                                payWithCard(config, txref, postId, userId, function (err, response) {
                                    if (err) {
                                        console.log(err)
                                        return res.badRequest(err)
                                    }
                                    console.log(response);

                                    if (message !== response) {
                                        return res.notAllowed('your transaction was not successful please try again')
                                    }

                                    return next();
                                })
                            }
                        }
                    })
                })
            })
        } else {
            console.log('im here because no token was provided');
            let userId;
            verifyPayment(userId, txref, postId, function (err, resp) {
                if (err) {
                    console.log(err);
                    return res.badRequest(err)
                }
                console.log('this is were im');
                console.log(resp);

                if (message === resp) {
                    return next();
                }
                payWithCard(config, txref, postId, userId, function (err, response) {
                    if (err) {
                        console.log(err)
                        return res.badRequest(err)
                    }
                    console.log(response);

                    if (message !== response) {
                        return res.notAllowed('your transaction was not successful please try again')
                    }

                    return next();
                })
            })
        }
    }
}

module.exports = router;