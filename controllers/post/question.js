let express = require('express');
let router = express.Router();
let mongoose = require("mongoose");
const unirest = require("unirest"); //unirest is an http request library so any other preferred library can be used.
const protector = require('../../middlewares/protector');

let Question = require('../../models/question');
let arrayUtils = require('../../utils/array');
let validator = require('../../utils/validator');
let User = require('../../models/user');

/*** END POINT FOR GETTING POST OF BY CATEGORIES BY CURRENTLY LOGGED IN USER */
router.get('/', function (req, res) {

    let token = req.body.token || req.query.token || req.headers.token;
    if (token) {
        protector.protect(req, res, function () {
            let userId = req.user.id;
            getUserCategory(userId, function (err, detail) {
                if (err) {
                    console.log(err);
                    return res.badRequest(err);
                }
                let list = detail[0].categoryTags,
                    data = list.map(function (item) {
                        return item['categoryId']
                    });

                let category = [];
                for (let i = 0; i < data.length; i++) {
                    let id = mongoose.Types.ObjectId(data[i]);
                    category.push(id);
                }
                Question.aggregate([
                    {$match: {"category.categoryId": {$in: category}}},
                    {
                        $lookup: {
                            from: "answers",
                            localField: "_id",
                            foreignField: "postId",
                            as: "answers"
                        }
                    },
                    {
                        $project: {
                            answers: {$size: '$answers'},
                            comments: {$size: '$comments'},
                            question: 1,
                            postedBy: 1,
                            'category.categoryId':1,
                            views: 1,
                            createdAt: 1
                        },
                    },
                    {$sort: {createdAt: -1}},
                    {$limit: 50}

                ], function (err, data) {
                    if (err) {
                        console.log(err);
                        return res.badRequest("Something unexpected happened");
                    }
                    Question.populate(data, {
                            'path': 'postedBy category.categoryId',
                            'select': 'name photoUrl ranking title'
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
            })
        })
    }else{
        Question.aggregate([
            {
                $lookup: {
                    from: "answers",
                    localField: "_id",
                    foreignField: "postId",
                    as: "answers"
                }
            },
            {
                $project: {
                    answers: {$size: '$answers'},
                    comments: {$size: '$comments'},
                    question: 1,
                    postedBy: 1,
                    'category.categoryId':1,
                    views: 1,
                    createdAt: 1
                },
            },
            {$sort: {views: -1, comments: -1, answers: -1}},
            {$limit: 50}
        ], function (err, data) {

            if (err) {
                console.log(err);
                return res.badRequest("Something unexpected happened");
            }

            Question.populate(data, {
                    'path': 'postedBy category.categoryId',
                    'select': 'name photoUrl ranking title'
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
    }
});

/*** END POINT FOR GETTING THE QUESTION AND ANSWERS INFORMATION USER BY LOGGED IN USERS*/
router.get('/q/:questionId', function (req, res) {
    let questionId = req.params.questionId,
        id = mongoose.Types.ObjectId(questionId);

    Question.update(
        {"_id": questionId},
        {$inc: {views: 1}}, function (err) {
            if (err) {
                console.log(err);
                return callback("Something unexpected happened");
            }

            Question.aggregate([
                {$match: {"_id": id}},
                {
                    $lookup: {
                        from: "answers",
                        localField: "_id",
                        foreignField: "postId",
                        as: "answers"
                    }
                },
                {
                    $project: {
                        answers: {
                            $map: {
                                input: '$answer',
                                as: "element",
                                in: {
                                    answerId: "$$element._id",
                                    answeredOn: '$$element.createdAt',
                                    answeredBy: '$$element.answeredBy',
                                    views: "$$element.views",
                                    view_cost: "$$element.view_cost",
                                    upVotes: {$size: "$$element.likes"},
                                    downVotes: {$size: "$$element.dislikes"}
                                }
                            }
                        },
                        comments: {
                            $map: {
                                input: '$comments',
                                as: "element",
                                in: {
                                    commentId: "$$element._id",
                                    commentedOn: '$$element.createdAt',
                                    comment: "$$element.comment",
                                    commentedBy: '$$element.commentedBy',
                                }
                            }
                        },
                        views: 1,
                        question: 1,
                        "category.categoryId": 1,
                        postedBy: 1,
                        total_answers: {$size: '$answers'},
                        total_comments: {$size: '$comments'}
                    }
                },
            ], function (err, data) {
                if (err) {
                    console.log(err);
                    return res.badRequest("Something unexpected happened");
                }

                Question.populate(data, {
                        'path': 'postedBy answers.answeredBy comments.commentedBy category.categoryId',
                        'select': 'name photoUrl ranking title'
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
});

/*** END POINT FOR GETTING QUESTION OF BY CATEGORIES BY CURRENTLY LOGGED IN USER */
router.get('/category', function (req, res) {

    let catId = req.query.categoryId,
        v = validator.isCategory(res, catId);
    if(!v) return;

    let category = [];
    for (let i = 0; i < data.length; i++) {
        let id = mongoose.Types.ObjectId(data[i]);
        category.push(id);
    }

    Question.aggregate([
        {$match: {"category.categoryId": {$in: category}}},
        {
            $lookup: {
                from: "answers",
                localField: "_id",
                foreignField: "postId",
                as: "answers"
            }
        },
        {
            $project: {
                answers: {$size: "$answers"},
                comments: {$size: '$comments'},
                views: 1,
                "category.categoryId": 1,
                createdAt: 1,
                postedBy: 1,
                question: 1
            }
        },
        {$sort: {createdAt: -1}},
        {$limit: 50}

    ], function (err, data) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }
        if (!data) {
            return res.success([]);
        }
        Question.populate(data, {
                'path': 'postedBy category.categoryId',
                'select': 'name photoUrl ranking title'
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

/*** END POINT FOR GETTING QUESTIONS OF A CURRENTLY LOGGED IN USER */
router.get('/profile', protector.protect, function (req, res) {

    let id = req.user.id;
    Question.aggregate([
        {$match: {'postedBy': id}},
        {
            $lookup: {
                from: "answers",
                localField: "_id",
                foreignField: "postId",
                as: "answer"
            }
        },
        {
            $project: {
                answers: {$size: "$answer"},
                comments: {$size: '$comments'},
                views: 1,
                "category.categoryId": 1,
                createdAt: 1,
                postedBy: 1,
                question: 1
            }
        },
        {$sort: {date: -1}},
    ], function (err, data) {
        console.log(data);
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        Question.populate(data, {
                'path': 'postedBy category.categoryId',
                'select': 'name photoUrl ranking title'
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

/*** END POINT FOR GETTING QUESTIONS OF A CURRENTLY LOGGED IN USER */
router.get('/profile/:userId', function (req, res) {

    let id = req.params.userId;
    Question.aggregate([
        {$match: {'postedBy': id}},
        {
            $lookup: {
                from: "answers",
                localField: "_id",
                foreignField: "postId",
                as: "answer"
            }
        },
        {
            $project: {
                answers: {$size: "$answer"},
                // comments: {$size: '$comments'},
                views: 1,
                "category.categoryId": 1,
                createdAt: 1,
                postedBy: 1,
                question: 1
            }
        },
        {$sort: {date: -1}},
    ], function (err, data) {
        console.log(data);
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        Question.populate(data, {
                'path': 'postedBy category.categoryId',
                'select': 'name photoUrl  ranking title'
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

/*** END POINT FOR POST CREATION CONTAINING FILE TO BE UPLOADED BY A CURRENTLY LOGGED IN USER */
router.post('/', protector.protect, function (req, res) {

    let userId = req.user.id,
        question = req.body.question,
        cate_tags = req.body.category;

    let validated = validator.isSentence(res, question) &&
        validator.isCategory(res, cate_tags);
    if (!validated) return;

    arrayUtils.removeDuplicates(cate_tags);
    let categoryTags = []; //new empty array
    for (let i = 0; i < cate_tags.length; i++) {
        let cateId = cate_tags[i];

        categoryTags.push({categoryId: cateId});
    }

    let data = {
        question: question,
        postedBy: userId,
        category: categoryTags
    };

    createQuestion(data, userId, function (err, post) {
        if (err) {
            console.log(err);
            return res.badRequest(err.message);
        }

        let data = {
            postId: post._id,
            category: post.category,
            question: post.question,
            postedOn: post.createdAt,
            postedBy: post.postedBy
        };

        res.success(data);
    });
});

/*** END POINT FOR EDITING POST BY A CURRENTLY LOGGED IN USER */
router.put('/:questionId', protector.protect, function (req, res) {

    let question = req.body.question,
        id = req.params.questionId,
        cate_tags = req.body.category;

    if (!(question || cate_tags)) {
        return res.badRequest("please enter values to fields you will love to be updated");
    }

    let values = {};
    // values.postedBy = req.user.id;

    if (question) {
        let vmess = validator.isSentence(res, question);
        if (!vmess) return;
        values.question = question;
    }
    if (cate_tags) {
        //remove duplicates before proceeding
        arrayUtils.removeDuplicates(cate_tags);

        let validated = validator.isCategory(res, cate_tags);
        if (!validated) return;

        values.category = []; //new empty array
        for (let i = 0; i < cate_tags.length ; i++){
            let cateId = cate_tags[i];

            if (typeof(cateId) !== "string"){
                return res.badRequest("category IDs in tagged array must be string");
            }
            values.category.push({categoryId: cateId});
        }
    }

    Question.findOneAndUpdate({_id: id, postedBy: req.user.id},
        {$set: values}, {new: true})
        .populate({
            path: 'postedBy',
            select: 'name ranking'
        })
        .populate({
            path: 'category.categoryId',
            select: 'title'
        })
        .exec(function (err, post) {
            if (err) {
                console.log(err)
                return res.serverError("Something unexpected happened");
            }
            if(!post){
                return res.badRequest("no story found with details provided");
            }
            if (post === null) {
                return res.success("no field value was changed by you");
            }

            let data = {
                questionId: post._id,
                createdAt: post.createdAt,
                question: post.question,
                postedBy: post.postedBy,
                category: post.category
            };

        res.success(data);
    });
});

/*** END POINT FOR DELETING A POST BY A CURRENTLY LOGGED IN USER */
router.delete('/:questionId', protector.protect, function (req, res) {

    let id = req.params.questionId;
    Question.remove({_id: id, postedBy: req.user.id}, function (err, result) {
        if (err) {
            console.log(err);
            return res.badRequest("Some error occurred");
        }
        if(!result){
            return res.badRequest("no post found with details provided")
        }

        res.success('question successfully deleted')
    })
});

function createQuestion(data, userId, callback) {
    Question.create(data, function (err, story) {
        if (err) {
            console.log(err);
            return callback("Something unexpected happened");
        }

        Question.populate(story, {
                'path': 'postedBy category.categoryId',
                'select': 'name photoUrl ranking title'
            },
            function (err, post) {
                if (err) {
                    console.log(err);
                    return callback("Something unexpected happened");
                }

                User.update(
                    {"_id": userId},
                    {$inc: {rating: 100}}, function (err) {
                        if (err) {
                            console.log(err);
                        }
                    }
                );

                return callback(null, post)
            })
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

module.exports = router;