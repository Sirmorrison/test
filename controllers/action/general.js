const express = require('express');
const router = express.Router();
let mongoose = require("mongoose");

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

//STORIES AND QUESTIONS
/*** END POINT FOR GETTING STORY OF BY CATEGORIES BY CURRENTLY LOGGED IN USER */
router.get('/story/:catId', function (req, res) {

    let catId = req.params.catId,
        id = mongoose.Types.ObjectId(catId);

    Story.aggregate([
        {$match: {"category.categoryId": id}},
        {$unwind: {path: "$category", preserveNullAndEmptyArrays: true}},
        {$project: {comments:{$size :"$comments"}, dislikes:{$size :"$dislikes"},likes:{$size :"$likes"}, views:{$size :"$views"}, createdAt:1, postedBy:1, title:1}},
        {$sort:{comments: -1}}
    ], function (err, data) {

        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        Story.populate(data,{
                'path': 'postedBy',
                'select': 'name photoUrl public_id'
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

/*** END POINT FOR GETTING QUESTION OF BY CATEGORIES BY CURRENTLY LOGGED IN USER */
router.get('/question/:catId', function (req, res) {

    let catId = req.params.catId,
        id = mongoose.Types.ObjectId(catId);

    Question.aggregate([
        {$match: {"category.categoryId": id}},
        {$unwind: {path: "$category", preserveNullAndEmptyArrays: true}},
        {$project: {answers:{$size :"$answers"},dislikes:{$size :"$dislikes"},likes:{$size :"$likes"}, views:{$size :"$views"}, createdAt:1, postedBy:1, question:1}},
        {$sort:{date: -1}}

    ], function (err, data) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        Question.populate(data,{
                'path': 'postedBy',
                'select': 'name photoUrl public_id title'
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

//VIEWS,
/*** END POINT FOR GETTING THE VIEWS ON A STORY OF A USER BY LOGGED IN USERS*/
router.get('/views/:storyId', function (req, res) {

    let storyId = req.params.storyId;
    Story.findOne({_id: storyId})
        .populate({
            path: 'views.userId',
            select: 'name photoUrl public_id'
        })
        .sort({date: -1})
        .exec(function (err, post) {
                if (err) {
                    return res.serverError("Something unexpected happened");
                }
                if (!post){
                    return res.success('no post found with the id provided')
                }

                res.success({dislikes: post.views});
            }
        );
});

/*** END POINT FOR GETTING THE VIEWS ON A QUESTION OF A USER BY LOGGED IN USERS*/
router.get('/views/:questionId', function (req, res) {

    let questionId = req.params.questionId;
    Question.findOne({_id: questionId})
        .populate({
            path: 'dislikes.userId',
            select: 'name photoUrl public_id'
        })
        .sort({date: -1})
        .exec(function (err, post) {

                if (err) {
                    return res.serverError("Something unexpected happened");
                }
                if (!post){
                    return res.success('no post found with the id provided')
                }
                let info = {
                    question: post.question,
                    title: post.title,
                    dislikes: post.dislikes,
                };
                res.success(info);
            }
        );
});

//LIKES,
/*** END POINT FOR GETTING THE DISLIKES ON A STORIES ANSWER OF A USER BY LOGGED IN USERS*/
router.get('/likes/:storyId', function (req, res) {

    let storyId = req.params.storyId;
    Story.findOne({_id: storyId})
        .populate({
            path: 'likes.userId',
            select: 'name photoUrl public_id'
        })
        .sort({date: -1})
        .exec(function (err, post) {

            if (err) {
                return res.serverError("Something unexpected happened");
            }
            if (!post){
                return res.success('no post found with the id provided')
            }

            res.success({dislikes: post.dislikes, title: post.title});
        }
    );
});

/*** END POINT FOR GETTING THE DISLIKES ON A QUESTION OF A USER BY LOGGED IN USERS*/
router.get('likes/:questionId', function (req, res) {

    let questionId = req.params.questionId;
    Question.findOne({_id: questionId})
        .populate({
            path: 'likes.userId',
            select: 'name photoUrl public_id'
        })
        .sort({date: -1})
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

//DISLIKES
/*** END POINT FOR GETTING THE DISLIKES ON A STORY OF A USER BY LOGGED IN USERS*/
router.get('dislike/:storyId', function (req, res) {

    let storyId = req.params.storyId;
    Story.findOne({_id: storyId})
        .populate({
            path: 'dislikes.userId',
            select: 'name photoUrl public_id'
        })
        .sort({date: -1})
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
        .sort({date: -1})
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

//USER PROFILE
/*** END POINT FOR GETTING A USER PROFILE BY OTHER USERS */
router.get('/:userId', function(req, res) {
    let id = req.params.userId;

    User.aggregate([
        {$match: {'_id': id}},
        {$unwind: {path: "$rating", preserveNullAndEmptyArrays: true}},
        {$unwind: {path: "$categoryTags", preserveNullAndEmptyArrays: true}},
        {$project: {totalFollowing:{$size :"$following"},totalFollowers:{$size :"$followers"},email:1,
            phone_number:1, rating:1, bio:1,photoUrl:1, public_id:1, profession:1, name:1, Rating:{$avg :"$rating.rating"},
            followers:1, following:1, createdAt: 1, address:1
        }},
    ], function (err, data) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        User.populate(data,{
                'path': 'followers.userId following.userId rating.ratedBy',
                'select': 'name photoUrl email bio'
            },

            function (err, user) {

                if (err) {
                    console.log(err);
                    return res.badRequest("Something unexpected happened");
                }
                if (!user) {
                    return res.badRequest("YOU NEED TO BE A REGISTERED USER TO VIEW PROFILE");
                }

                res.success(user);
            });
    });
});

/*** END POINT FOR GETTING PROFILE ANSWERS OF A USER BY ANOTHER CURRENTLY LOGGED IN USER */
router.get('/answer/:userId', function (req, res) {

    let id = req.params.userId;
    // Question.aggregate([
    //     {$match: {'answers.answeredBy': id}},
    //     {$unwind: {path: "$category", preserveNullAndEmptyArrays: true}},
    //     {$project: {answers:{$size :"$answers"}, dislikes:{$size :"$dislikes"}, likes:{$size :"$likes"}, category:1, title:1, postedOn:1,postedBy:1}},
    //     {$sort:{date: -1}}
    Question.aggregate([
        {$match: {"answers.answeredBy" : id}},
        {$project: {answers: {
            $map: {
                input: '$answers',
                as: "element",
                in: {
                    answerId: "$$element._id",
                    answer: "$$element.answer",
                    answeredOn: '$$element.createdAt',
                    answeredBy: '$$element.answeredBy',
                    likes: { $size: "$$element.likes" },
                    dislikes: { $size: "$$element.dislikes" }
                }
            }
        },
        question:1}},
        {$sort: {date: -1}},
    ], function (err, data) {
        console.log(data);
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        Question.populate(data,{
                'path': 'postedBy likes.userId dislikes.userId comments.commentedBy',
                'select': 'name photoUrl email bio title'
            },
            function (err, post) {
                if (err) {
                    console.log(err);
                    return res.badRequest("Something unexpected happened");
                }

                res.success(post);
            }
        );
    });
});

/*** END POINT FOR GETTING PROFILE QUESTIONS OF A USER BY ANOTHER CURRENTLY LOGGED IN USER */
router.get('/question/:userId', function (req, res) {

    let id = req.user.id;
    Question.aggregate([
        {$match: {'postedBy': id}},
        {$unwind: {path: "$category", preserveNullAndEmptyArrays: true}},
        {$project: {answers:{$size :"$answers"}, dislikes:{$size :"$dislikes"},likes:{$size :"$likes"}, category:1, title:1, postedOn:1,postedBy:1}},
        {$sort:{date: -1}}

    ], function (err, data) {
        console.log(data);
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }
        if (!data) {
            return res.success([]);
        }

        Question.populate(data,{
                'path': 'postedBy likes.userId dislikes.userId comments.commentedBy',
                'select': 'name photoUrl email bio title'
            },

            function (err, post) {

                if (err) {
                    console.log(err);
                    return res.badRequest("Something unexpected happened");
                }

                res.success(post);
            }
        );
    });
});

/*** END POINT FOR GETTING PROFILE STORY OF A USER BY ANOTHER CURRENTLY LOGGED IN USER */
router.get('/story/:userId', function (req, res) {

    let id = req.user.id;

    Story.aggregate([
        {$match: {'postedBy': id}},
        {$unwind: {path: "$category", preserveNullAndEmptyArrays: true}},
        {$project: {comments:{$size :"$comments"},dislikes:{$size :"$dislikes"},likes:{$size :"$likes"}, category:1, title:1, postedOn:1,postedBy:1}},
        {$sort:{date: -1}}

    ], function (err, data) {
        console.log(data);
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        Story.populate(data,{
                'path': 'postedBy likes.userId dislikes.userId comments.commentedBy',
                'select': 'name photoUrl email bio title'
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

/*** END POINT FOR GETTING FOLLOWERS OF A USER BY ANOTHER CURRENTLY LOGGED IN USER */
router.get('/follower/:userId', function(req, res){

    let id = req.params.userId;
    profile(id, function (err, result) {

        if (err){
            return res.badRequest(err.message);
        }
        res.success({followers: result.followers});
    });
});

/*** END POINT FOR GETTING FOLLOWING OF A USER BY ANOTHER CURRENTLY LOGGED IN USER */
router.get('/following/:userId', function(req, res){

    let id = req.params.userId;
    profile(id, function (err, result) {

        if (err){
            return res.badRequest(err.message);
        }

        res.success({following: result.following});
    });
});

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

module.exports = router;